// [파일 역할] deep link에서 탭과 URL을 올바르게 읽는지 확인합니다. HTTPS 주소 보완과 일반 WebView·popup URL 분류의 허용·거부 경우도 검사합니다.
// [검증 경계] URL 문자열을 나누는 함수만 확인합니다. 실제 WebView 이동, 외부 앱 설치 여부, 앱을 처음 열거나 실행 중에 받은 intent는 확인하지 않습니다.
// [라이브러리] Jest로 URL 검사 함수가 돌려준 객체 또는 null을 비교합니다. 함수 안에서는 JavaScript 표준 `URL`이 주소를 나눕니다.

// ========================================== 외부 의존성 ==========================================

import {
  classifyNavigationUrl,
  classifyPopupUrl,
  normalizeHttpsUrl,
  parseDemoDeepLink,
} from "@/src/services/url-router";

// =================================================================================================

// ========================================== test cases ===========================================

// [역할] `describe` callback은 deep link, HTTPS 보완과 WebView·popup URL 분류 test를 한 묶음으로 실행합니다.
describe("URL router", () => {
  // [역할] 이 test callback은 custom scheme에서 탭 번호를 읽고 scheme 없는 host를 HTTPS로 바꾸는지 확인합니다.
  it("custom scheme과 bare host를 탭 이동으로 변환한다", () => {
    // deep link 안의 `m.nate.com`에 HTTPS와 마지막 slash가 붙은 결과까지 한 객체에서 확인합니다.
    expect(
      parseDemoDeepLink(
        "mywebviewapp://webviewappdemo?target=1&url=m.nate.com",
      ),
    ).toEqual({
      tabIndex: 1,
      targetUrl: "https://m.nate.com/",
    });
  });

  // [역할] 이 test callback은 Expo Go 주소에서도 같은 deep link 값이 만들어지는지 확인합니다.
  it("Expo Go deep link 형식을 지원한다", () => {
    expect(
      parseDemoDeepLink(
        "exp://192.0.2.10:8081/--/webviewappdemo?target=3",
      ),
    ).toEqual({
      tabIndex: 3,
      targetUrl: null,
    });
  });

  // [역할] 이 test callback은 범위를 벗어난 탭 번호와 HTTP target URL을 거부하는지 확인합니다.
  it("범위를 벗어난 탭과 HTTP target URL을 거부한다", () => {
    // scheme이 맞아도 탭 번호가 범위를 벗어나거나 안쪽 URL이 HTTP이면 거절해야 합니다.
    // [문법] 이 함수의 반환 type에는 올바른 객체와 null이 함께 있습니다. 아래 두 잘못된 입력에는 null을 기대합니다.
    expect(
      parseDemoDeepLink(
        "mywebviewapp://webviewappdemo?target=4&url=m.nate.com",
      ),
    ).toBeNull();
    expect(
      parseDemoDeepLink(
        "mywebviewapp://webviewappdemo?target=1&url=http%3A%2F%2Fm.nate.com",
      ),
    ).toBeNull();
  });

  // [역할] 이 test callback은 host에 HTTPS를 보완하고 HTTP나 잘못된 주소는 거부하는지 확인합니다.
  it("HTTPS만 정규화한다", () => {
    expect(normalizeHttpsUrl("m.nate.com")).toBe("https://m.nate.com/");
    expect(normalizeHttpsUrl("http://m.nate.com")).toBeNull();
    expect(normalizeHttpsUrl("not a host")).toBeNull();
  });

  // [역할] 이 test callback은 일반 WebView URL을 허용·차단·외부 앱·deep link로 올바르게 나누는지 확인합니다.
  it("WebView navigation을 HTTPS, HTTP, 외부 앱으로 분류한다", () => {
    // 결과 종류만 볼 때는 `.type`을 비교합니다. 외부 앱으로 보낼 원래 URL도 중요할 때는 객체 전체를 비교합니다.
    expect(classifyNavigationUrl("https://example.com").type).toBe("allow");
    expect(classifyNavigationUrl("http://example.com").type).toBe(
      "block-http",
    );
    expect(classifyNavigationUrl("tel:010-1234-5678")).toEqual({
      type: "external",
      url: "tel:010-1234-5678",
    });
    expect(
      classifyNavigationUrl(
        "mywebviewapp://webviewappdemo?target=0",
      ).type,
    ).toBe("deep-link");
  });

  // [역할] 이 test callback은 새 창 URL을 원래 탭·외부 앱·popup으로 올바르게 나누는지 확인합니다.
  it("새 창을 부모, 외부 브라우저, 팝업으로 분류한다", () => {
    // 이 함수는 분류 결과만 돌려줍니다. 실제 WebView 열기, 외부 앱 열기, modal 열기는 `DemoShell`과 `PopupWebView`가 합니다.
    // [라이브러리] 각 URL은 인터넷으로 요청하지 않습니다. 표준 `URL` 객체로 host와 protocol 글자만 읽습니다.
    expect(classifyPopupUrl("https://m.naver.com/news").type).toBe(
      "parent",
    );
    expect(classifyPopupUrl("https://www.instagram.com/test").type).toBe(
      "external",
    );
    expect(classifyPopupUrl("https://www.bing.com").type).toBe("popup");
  });
});

// =================================================================================================
