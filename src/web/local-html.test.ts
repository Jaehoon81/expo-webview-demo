// [파일 역할] template literal payload에 bridge/navigation/photo DOM과 회귀된 layout·touch CSS가 존재하는지 정적 검증합니다.
// [검증 경계] 문자열 포함 검사는 browser JavaScript 실행, DOM event, WebView bridge 왕복과 실제 이미지 표시를 증명하지 않습니다.
import { BRIDGE_ACTIONS } from "@/src/bridge/types";
import { LOCAL_DEMO_HTML } from "@/src/web/local-html";

describe("LOCAL_DEMO_HTML", () => {
  it("하단 탭 바 위로 마지막 콘텐츠를 스크롤할 여백을 포함한다", () => {
    expect(LOCAL_DEMO_HTML).toContain("padding: 20px 16px 120px");
  });

  it("참고 앱의 8개 bridge action과 callback을 포함한다", () => {
    // BridgeAction 기준 배열을 순회해 action을 하나씩 hard-code하다 누락하는 일을 줄입니다.
    for (const action of BRIDGE_ACTIONS) {
      expect(LOCAL_DEMO_HTML).toContain(action);
    }
    expect(LOCAL_DEMO_HTML).toContain("calledByNative");
    expect(LOCAL_DEMO_HTML).toContain("ReactNativeWebView.postMessage");
  });

  it("동일 창, 팝업, 연락처, 자체 deep link를 포함한다", () => {
    expect(LOCAL_DEMO_HTML).toContain("https://www.google.com");
    expect(LOCAL_DEMO_HTML).toContain("window.open");
    expect(LOCAL_DEMO_HTML).toContain("tel:010-1234-5678");
    expect(LOCAL_DEMO_HTML).toContain("sms:010-1234-5678");
    expect(LOCAL_DEMO_HTML).toContain("mailto:demo@example.com");
    expect(LOCAL_DEMO_HTML).toContain(
      "mywebviewapp://webviewappdemo?target=1",
    );
  });

  it("카테고리별 버튼이 지연 없이 색상 반전 눌림 피드백을 표시한다", () => {
    // iOS WebView에서 확인한 즉시 feedback 회귀를 payload 문자열 수준에서 고정합니다.
    expect(LOCAL_DEMO_HTML.match(/<button ontouchstart=""/g)).toHaveLength(9);
    expect(LOCAL_DEMO_HTML).not.toContain("transition:");
    expect(LOCAL_DEMO_HTML).not.toContain("transform:");
    expect(LOCAL_DEMO_HTML).toContain(".device-actions button:active");
    expect(LOCAL_DEMO_HTML).toContain(".tab-actions button:active");
    expect(LOCAL_DEMO_HTML).toContain(".photo-actions button:active");
    expect(LOCAL_DEMO_HTML).toContain("background: #075985");
    expect(LOCAL_DEMO_HTML).toContain("background: #166534");
    expect(LOCAL_DEMO_HTML).toContain("background: #9a3412");
    expect(LOCAL_DEMO_HTML).toContain('class="card device-actions"');
    expect(LOCAL_DEMO_HTML).toContain('class="card tab-actions"');
    expect(LOCAL_DEMO_HTML).toContain('class="card photo-actions"');
  });

  it("사진 두 장을 표시할 요소를 포함한다", () => {
    expect(LOCAL_DEMO_HTML).toContain('id="image1"');
    expect(LOCAL_DEMO_HTML).toContain('id="image2"');
    expect(LOCAL_DEMO_HTML).toContain('id="photo1_name"');
    expect(LOCAL_DEMO_HTML).toContain('id="photo2_name"');
  });
});
