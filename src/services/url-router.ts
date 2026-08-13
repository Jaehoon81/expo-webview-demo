// [파일 역할] deep link parsing, HTTPS 정규화와 일반/popup WebView URL의 처리 주체를 결정하는 순수 routing 정책입니다.
// [검증 경계] 반환 decision의 분류는 unit test로 확인하지만 실제 외부 앱 존재·WebView navigation 성공은 실기기 경계입니다.
import type { TabIndex } from "@/src/types/navigation";
import { isTabIndex } from "@/src/types/navigation";

export const LOCAL_WEB_BASE_URL = "https://local.webviewappdemo/";

export type DemoDeepLink = {
  tabIndex: TabIndex;
  targetUrl: string | null;
};

export type NavigationDecision =
  | { type: "allow" }
  | { type: "ignore" }
  | { type: "block-http"; url: string }
  | { type: "deep-link"; value: DemoDeepLink }
  | { type: "external"; url: string };

export type PopupDecision =
  | { type: "parent"; url: string }
  | { type: "external"; url: string }
  | { type: "popup"; url: string };

const EXTERNAL_CONTACT_SCHEMES = new Set([
  "tel:",
  "sms:",
  "mailto:",
  "facetime:",
]);

const SOCIAL_HOSTS = ["instagram.com", "facebook.com", "twitter.com"];

function isHostOrSubdomain(hostname: string, domain: string): boolean {
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

export function normalizeHttpsUrl(value: string): string | null {
  // scheme이 없는 host는 HTTPS를 보완하지만 명시적 HTTP나 다른 scheme을 HTTPS로 강제 변환하지 않습니다.
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function parseDemoDeepLink(value: string): DemoDeepLink | null {
  try {
    // [FLOW-06 / 4단계] development build custom scheme과 Expo Go `/--/` path를 같은 내부 값으로 parse합니다.
    const url = new URL(value);
    const isCustomScheme =
      url.protocol === "mywebviewapp:" && url.hostname === "webviewappdemo";
    const isExpoGo =
      (url.protocol === "exp:" || url.protocol === "exps:") &&
      url.pathname.replace(/\/$/, "").endsWith("/--/webviewappdemo");

    if (!isCustomScheme && !isExpoGo) {
      return null;
    }

    const targetValue = url.searchParams.get("target");
    if (targetValue === null) {
      return null;
    }

    const targetNumber = Number(targetValue);
    // query는 문자열이므로 number 변환 뒤 0~3 integer runtime guard를 다시 거칩니다.
    if (!isTabIndex(targetNumber)) {
      return null;
    }

    const rawTargetUrl = url.searchParams.get("url");
    const targetUrl =
      rawTargetUrl === null ? null : normalizeHttpsUrl(rawTargetUrl);

    // URL이 제공됐다면 HTTPS로 정규화 가능한 값만 허용해 bridge/deep link가 HTTP를 우회하지 못하게 합니다.
    if (rawTargetUrl !== null && targetUrl === null) {
      return null;
    }

    return {
      tabIndex: targetNumber,
      targetUrl,
    };
  } catch {
    return null;
  }
}

export function classifyNavigationUrl(url: string): NavigationDecision {
  // WebView 내부 문서 생성·빈 문서는 통과시키고 외부 network scheme 정책과 구분합니다.
  if (
    url === "about:blank" ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return { type: "allow" };
  }

  const deepLink = parseDemoDeepLink(url);
  if (deepLink) {
    // [FLOW-06 / 6단계] WebView에서 누른 자체 scheme은 WebView load를 중단하고 app tab 이동으로 되돌립니다.
    return { type: "deep-link", value: deepLink };
  }

  try {
    // [FLOW-03 / 3단계] scheme을 parse해 HTTPS 허용, HTTP 차단, 연락처/기타 scheme 외부 위임으로 분류합니다.
    const parsed = new URL(url);

    if (parsed.protocol === "https:") {
      return { type: "allow" };
    }

    if (parsed.protocol === "http:") {
      // cleartext HTTP는 WebView와 외부 앱 양쪽으로 넘기지 않고 caller가 차단 안내를 표시합니다.
      return { type: "block-http", url };
    }

    if (EXTERNAL_CONTACT_SCHEMES.has(parsed.protocol)) {
      return { type: "external", url };
    }

    if (parsed.protocol === "about:") {
      return { type: "ignore" };
    }

    return { type: "external", url };
  } catch {
    return { type: "ignore" };
  }
}

export function classifyPopupUrl(url: string): PopupDecision {
  try {
    // [FLOW-04 / 2단계] 새 창 target을 기존 부모 tab, OS 외부 앱, app 내부 popup 중 하나로 분류합니다.
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();

    if (SOCIAL_HOSTS.some((domain) => isHostOrSubdomain(hostname, domain))) {
      return { type: "external", url };
    }

    const isKnownParentUrl =
      url.startsWith(LOCAL_WEB_BASE_URL) ||
      ["m.naver.com", "m.daum.net", "m.nate.com"].some((domain) =>
        isHostOrSubdomain(hostname, domain),
      );

    if (isKnownParentUrl) {
      // 참고 앱의 로컬/주요 mobile host는 별도 modal을 만들지 않고 source WebView history에 이어 엽니다.
      return { type: "parent", url };
    }

    if (parsed.protocol === "https:") {
      return { type: "popup", url };
    }

    return { type: "external", url };
  } catch {
    return { type: "external", url };
  }
}
