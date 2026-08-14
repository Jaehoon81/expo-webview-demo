// [파일 역할] OS와 Expo Go가 서로 다른 모양으로 준 demo 주소를 첫 화면이 읽는 한 가지 모양으로 바꿉니다.
// [FLOW-06] OS나 WebView에서 받은 deep link를 검사해 탭 번호와 선택 주소로 바꾸고, 이미 만든 탭 화면에 적용합니다.

// ======================================== system URL 변환 ========================================

// [역할] `rewriteIncomingSystemPath`는 demo 주소만 canonical custom URL을 담은 index query로 바꿉니다.
// [문법] `try/catch`로 URL 해석 오류를 잡아 앱이 멈추지 않게 합니다. 잘못된 주소는 안전한 첫 화면으로 보냅니다.
export function rewriteIncomingSystemPath(path: string): string {
  try {
    // [라이브러리] 표준 `URL`에 기준 주소를 주면 전체 주소와 `/settings` 같은 상대 주소를 같은 방식으로 읽을 수 있습니다.
    // 원래 주소 뒤의 query 값은 아래 기준 주소로 그대로 옮깁니다.
    const url = new URL(path, "mywebviewapp://app.home");
    // [문법] 정규식 `/\/$/`은 문자열 맨 끝의 `/` 하나만 찾아 없앱니다.
    const normalizedPath = url.pathname.replace(/\/$/, "");
    const isDemoDeepLink =
      url.hostname === "webviewappdemo" ||
      normalizedPath.endsWith("/webviewappdemo");

    if (!isDemoDeepLink) {
      // demo 주소가 아니면 바꾸지 않고 Expo Router가 원래대로 처리하게 합니다.
      return path;
    }

    const canonicalUrl = new URL("mywebviewapp://webviewappdemo");
    // [라이브러리] `URLSearchParams.forEach`로 query 값을 하나씩 읽고 `append`로 새 주소에 붙입니다.
    // 같은 이름이 여러 번 나온 값도 빠뜨리지 않습니다.
    // [역할] `forEach` callback은 원래 query의 key와 값을 canonical URL에 같은 순서로 옮깁니다.
    url.searchParams.forEach((value, key) => {
      canonicalUrl.searchParams.append(key, value);
    });

    // [FLOW-06 / 2단계] custom scheme 주소 전체를 `demoDeepLink` 한 칸에 넣어 `/` 화면으로 보냅니다.
    // [문법] `encodeURIComponent`는 주소 안의 `?`와 `&`를 글자로 바꿉니다.
    // 그래서 안쪽 주소가 바깥 route의 query 구분자로 잘못 읽히지 않습니다.
    return `/?demoDeepLink=${encodeURIComponent(canonicalUrl.toString())}`;
  } catch {
    // URL로 읽을 수 없는 값은 앱에 실제로 존재하는 첫 화면 `/`로 보냅니다.
    return "/";
  }
}

// =================================================================================================
