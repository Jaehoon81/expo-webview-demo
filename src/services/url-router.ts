// [파일 역할] 들어온 주소를 읽어 WebView, 앱 안 탭, popup, OS 외부 앱 중 어디에서 처리할지 정합니다.
// [검증 경계] unit test는 주소가 어느 종류로 나뉘는지만 확인합니다.
// 실제 외부 앱이 설치됐는지, WebView가 페이지를 열었는지는 기기에서 확인해야 합니다.
// [문법] `import type`은 TypeScript 검사에만 쓰고, 일반 import의 `isTabIndex`는 앱 실행 중 값 검사에 씁니다.

// ========================================== 외부 의존성 ==========================================

import type { TabIndex } from "@/src/types/navigation";
import { isTabIndex } from "@/src/types/navigation";

// =================================================================================================

// ======================================= URL type과 기준값 =======================================

export const LOCAL_WEB_BASE_URL = "https://local.webviewappdemo/";

export type DemoDeepLink = {
  tabIndex: TabIndex;
  targetUrl: string | null;
};

// [문법] 각 결과에 고정된 `type` 문자열을 넣었습니다. `switch`에서 type을 확인하면 함께 있는 값도 자동으로 정해집니다.
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

// [라이브러리] `Set`은 protocol 전체가 목록에 있는지 확인합니다. 일부 글자만 우연히 같은 주소는 허용하지 않습니다.
const EXTERNAL_CONTACT_SCHEMES = new Set([
  "tel:",
  "sms:",
  "mailto:",
  "facetime:",
]);

const SOCIAL_HOSTS = ["instagram.com", "facebook.com", "twitter.com"];

// [역할] `isHostOrSubdomain`은 host가 지정 domain 자체이거나 그 아래의 올바른 하위 domain인지 확인합니다.
function isHostOrSubdomain(hostname: string, domain: string): boolean {
  // 주소가 domain과 정확히 같거나 `.` 뒤의 하위 domain일 때만 true입니다. `notinstagram.com`은 제외됩니다.
  return hostname === domain || hostname.endsWith(`.${domain}`);
}

// =================================================================================================

// ==================================== URL 정규화와 deep link =====================================

// [역할] `normalizeHttpsUrl`은 scheme이 없는 host에 HTTPS를 붙이고 실제 HTTPS 주소만 문자열로 돌려줍니다.
export function normalizeHttpsUrl(value: string): string | null {
  // `m.nate.com`처럼 scheme이 없을 때만 HTTPS를 붙입니다. 이미 HTTP나 다른 scheme이면 억지로 바꾸지 않습니다.
  // [라이브러리] `trim`은 앞뒤 공백만 지웁니다. 주소 안쪽 공백은 URL 검사가 잘못된 주소로 거부합니다.
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  // [문법] 정규식은 문자열 맨 앞에 `https:` 같은 scheme이 있는지 확인합니다.
  // 삼항 연산자는 scheme이 없을 때만 `https://`를 붙입니다.
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    // [라이브러리] 표준 `URL`이 주소 문법과 protocol을 확인하고 일정한 모양의 문자열로 바꿉니다.
    const url = new URL(candidate);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

// [역할] `parseDemoDeepLink`는 custom scheme이나 Expo Go 주소에서 검사된 탭 번호와 선택 URL을 꺼냅니다.
export function parseDemoDeepLink(value: string): DemoDeepLink | null {
  // 외부 문자열이 잘못돼도 오류를 밖으로 던지지 않고 `null`을 돌려줍니다.
  try {
    // [FLOW-06 / 8단계] 공통 parser가 custom scheme과 Expo Go 모양을 읽고 target index·optional HTTPS URL을 runtime 검사합니다.
    const url = new URL(value);
    const isCustomScheme =
      url.protocol === "mywebviewapp:" && url.hostname === "webviewappdemo";
    const isExpoGo =
      (url.protocol === "exp:" || url.protocol === "exps:") &&
      url.pathname.replace(/\/$/, "").endsWith("/--/webviewappdemo");

    if (!isCustomScheme && !isExpoGo) {
      return null;
    }

    // [라이브러리] `URLSearchParams.get`은 값이 없으면 null을 돌려줘 빈 문자열과 구분할 수 있습니다.
    const targetValue = url.searchParams.get("target");
    if (targetValue === null) {
      return null;
    }

    // [문법] `Number`로 query 문자열을 숫자로 바꿉니다. 이것만으로 0~3이라고 믿지는 않습니다.
    const targetNumber = Number(targetValue);
    // 주소의 값은 원래 문자열이므로 숫자로 바꾼 뒤 정수 0~3인지 `isTabIndex`로 다시 확인합니다.
    if (!isTabIndex(targetNumber)) {
      return null;
    }

    const rawTargetUrl = url.searchParams.get("url");
    // [문법] 이동할 URL이 없으면 `null`을 유지하고, 있으면 HTTPS 주소로 바꿀 수 있는지 확인합니다.
    const targetUrl =
      rawTargetUrl === null ? null : normalizeHttpsUrl(rawTargetUrl);

    // URL이 함께 왔다면 올바른 HTTPS 주소만 허용합니다. deep link로 HTTP 차단 규칙을 피해 갈 수 없습니다.
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

// =================================================================================================

// =================================== WebView와 popup URL 분류 ====================================

// [역할] `classifyNavigationUrl`은 일반 WebView URL을 허용·차단·앱 이동·외부 앱 처리 중 하나로 나눕니다.
export function classifyNavigationUrl(url: string): NavigationDecision {
  // WebView가 내부에서 만드는 빈 문서와 data/blob 문서는 허용합니다. 외부 인터넷 주소와 따로 처리합니다.
  if (
    url === "about:blank" ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return { type: "allow" };
  }

  // 일반 주소를 나누기 전에 이 앱의 deep link인지 먼저 확인해 앱 안 탭 이동으로 보냅니다.
  // [FLOW-06 / 2-B단계] 일반 WebView classifier는 다른 scheme 분류보다 먼저 app deep link parser를 호출합니다.
  const deepLink = parseDemoDeepLink(url);
  if (deepLink) {
    // [FLOW-06 / 3-B단계] parser 성공값은 `deep-link` decision으로 돌아가 DemoShell의 적용 branch와 WebView load 차단을 함께 선택합니다.
    return { type: "deep-link", value: deepLink };
  }

  try {
    // [FLOW-03 / 6단계] classifier는 URL을 parse해 `allow`, `block-http`, `external`, `ignore` decision 중 하나로만 반환합니다.
    const parsed = new URL(url);

    if (parsed.protocol === "https:") {
      return { type: "allow" };
    }

    if (parsed.protocol === "http:") {
      // 암호화되지 않은 HTTP는 WebView에도 OS 앱에도 넘기지 않습니다. 이 결과를 받은 화면이 안내를 띄웁니다.
      return { type: "block-http", url };
    }

    // [라이브러리] `Set.has`로 tel, sms, mailto, facetime 중 정확히 하나인지 확인해 OS 앱으로 보냅니다.
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

// [역할] `classifyPopupUrl`은 새 창 URL을 원래 탭·외부 앱·앱 안 popup 처리 중 하나로 나눕니다.
export function classifyPopupUrl(url: string): PopupDecision {
  try {
    // [FLOW-04 / 5단계] `classifyPopupUrl`은 host와 scheme을 검사해 `parent`, `external`, `popup` decision 하나를 반환합니다.
    const parsed = new URL(url);
    // host를 소문자로 바꿔 대문자 사용으로 주소 규칙을 피해 가지 못하게 합니다.
    const hostname = parsed.hostname.toLowerCase();

    // [문법] `some`은 소셜 domain 목록 중 하나라도 현재 host와 맞으면 바로 true를 돌려줍니다.
    // [역할] 첫 `some` callback은 현재 host가 소셜 domain 하나와 같은 계열인지 차례로 확인합니다.
    if (SOCIAL_HOSTS.some((domain) => isHostOrSubdomain(hostname, domain))) {
      return { type: "external", url };
    }

    // local HTML 주소와 세 mobile 사이트는 새 popup 대신 현재 WebView에서 이어 엽니다.
    const isKnownParentUrl =
      url.startsWith(LOCAL_WEB_BASE_URL) ||
      // [역할] 둘째 `some` callback은 현재 host가 원래 탭에서 이어 열 mobile site인지 확인합니다.
      ["m.naver.com", "m.daum.net", "m.nate.com"].some((domain) =>
        isHostOrSubdomain(hostname, domain),
      );

    if (isKnownParentUrl) {
      // 참고 앱과 같은 주요 mobile 주소는 별도 창을 만들지 않고 현재 WebView 방문 기록에 이어 엽니다.
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

// =================================================================================================
