// [파일 역할] OS/Expo Go가 전달한 여러 demo URL 모양을 index route의 단일 demoDeepLink query로 정규화합니다.
// [FLOW-06] deep link 흐름은 system path 또는 WebView URL을 검증해 탭 index와 선택 URL로 바꾼 뒤 기존 tab instance에 적용합니다.
export function rewriteIncomingSystemPath(path: string): string {
  try {
    // 상대 path도 분석할 수 있도록 custom scheme base를 주며 원래 query parameter는 아래 canonical URL로 복사합니다.
    const url = new URL(path, "mywebviewapp://app.home");
    const normalizedPath = url.pathname.replace(/\/$/, "");
    const isDemoDeepLink =
      url.hostname === "webviewappdemo" ||
      normalizedPath.endsWith("/webviewappdemo");

    if (!isDemoDeepLink) {
      // 관련 없는 system route는 Expo Router가 원래대로 처리하도록 손대지 않습니다.
      return path;
    }

    const canonicalUrl = new URL("mywebviewapp://webviewappdemo");
    url.searchParams.forEach((value, key) => {
      canonicalUrl.searchParams.append(key, value);
    });

    // [FLOW-06 / 2단계] custom scheme 전체를 한 query 값으로 encode해 Root Stack 안의 `/` route로 전달합니다.
    return `/?demoDeepLink=${encodeURIComponent(canonicalUrl.toString())}`;
  } catch {
    // URL로 해석할 수 없는 system 입력은 존재하는 index route로만 안전하게 보냅니다.
    return "/";
  }
}
