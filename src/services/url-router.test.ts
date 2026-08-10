import {
  classifyNavigationUrl,
  classifyPopupUrl,
  normalizeHttpsUrl,
  parseDemoDeepLink,
} from "@/src/services/url-router";

describe("URL router", () => {
  it("custom scheme과 bare host를 탭 이동으로 변환한다", () => {
    expect(
      parseDemoDeepLink(
        "mywebviewapp://webviewappdemo?target=1&url=m.nate.com",
      ),
    ).toEqual({
      tabIndex: 1,
      targetUrl: "https://m.nate.com/",
    });
  });

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

  it("범위를 벗어난 탭과 HTTP target URL을 거부한다", () => {
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

  it("HTTPS만 정규화한다", () => {
    expect(normalizeHttpsUrl("m.nate.com")).toBe("https://m.nate.com/");
    expect(normalizeHttpsUrl("http://m.nate.com")).toBeNull();
    expect(normalizeHttpsUrl("not a host")).toBeNull();
  });

  it("WebView navigation을 HTTPS, HTTP, 외부 앱으로 분류한다", () => {
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

  it("새 창을 부모, 외부 브라우저, 팝업으로 분류한다", () => {
    expect(classifyPopupUrl("https://m.naver.com/news").type).toBe(
      "parent",
    );
    expect(classifyPopupUrl("https://www.instagram.com/test").type).toBe(
      "external",
    );
    expect(classifyPopupUrl("https://www.bing.com").type).toBe("popup");
  });
});
