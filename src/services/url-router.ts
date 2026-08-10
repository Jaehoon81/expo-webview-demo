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
    if (!isTabIndex(targetNumber)) {
      return null;
    }

    const rawTargetUrl = url.searchParams.get("url");
    const targetUrl =
      rawTargetUrl === null ? null : normalizeHttpsUrl(rawTargetUrl);

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
  if (
    url === "about:blank" ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return { type: "allow" };
  }

  const deepLink = parseDemoDeepLink(url);
  if (deepLink) {
    return { type: "deep-link", value: deepLink };
  }

  try {
    const parsed = new URL(url);

    if (parsed.protocol === "https:") {
      return { type: "allow" };
    }

    if (parsed.protocol === "http:") {
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
