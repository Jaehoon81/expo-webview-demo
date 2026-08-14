// [파일 역할] WebView에 넣을 HTML 문자열에 bridge 버튼, URL 이동, 사진 영역, 필요한 layout·touch CSS가 들어 있는지 확인합니다.
// [검증 경계] 문자열에 글자가 있는지만 봅니다.
// browser JavaScript, DOM event, WebView와 앱의 message 왕복, 실제 사진 표시는 실행하지 않습니다.
// [라이브러리] Jest의 문자열과 정규식 비교만 사용합니다. HTML을 실행하거나 DOM parser로 읽지 않습니다.

// ========================================== 외부 의존성 ==========================================

import { BRIDGE_ACTIONS } from "@/src/bridge/types";
import { LOCAL_DEMO_HTML } from "@/src/web/local-html";

// =================================================================================================

// ========================================== test cases ===========================================

// [역할] `describe` callback은 WebView HTML payload에 필요한 문자열 계약 test를 한 묶음으로 실행합니다.
describe("LOCAL_DEMO_HTML", () => {
  // [역할] 이 test callback은 마지막 내용이 하단 탭 위까지 올라올 충분한 아래 여백을 갖는지 확인합니다.
  it("하단 탭 바 위로 마지막 콘텐츠를 스크롤할 여백을 포함한다", () => {
    expect(LOCAL_DEMO_HTML).toContain("padding: 20px 16px 120px");
  });

  // [역할] 이 test callback은 action 8개와 앱 응답·요청 bridge 함수 이름이 payload에 모두 있는지 확인합니다.
  it("참고 앱의 8개 bridge action과 callback을 포함한다", () => {
    // `BRIDGE_ACTIONS` 배열에 있는 모든 action이 HTML 안에도 있는지 차례로 확인합니다. action을 test에 하나씩 따로 적다가 빠뜨리는 일을 줄입니다.
    // [문법] `for...of`는 readonly tuple 안의 action 문자열을 앞에서부터 하나씩 꺼냅니다.
    for (const action of BRIDGE_ACTIONS) {
      expect(LOCAL_DEMO_HTML).toContain(action);
    }
    expect(LOCAL_DEMO_HTML).toContain("calledByNative");
    expect(LOCAL_DEMO_HTML).toContain("ReactNativeWebView.postMessage");
  });

  // [역할] 이 test callback은 일반 이동, popup, 연락처와 앱 deep link 예제가 payload에 있는지 확인합니다.
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

  // [역할] 이 test callback은 버튼의 즉시 눌림 CSS와 카테고리별 색상 문자열이 유지되는지 확인합니다.
  it("카테고리별 버튼이 지연 없이 색상 반전 눌림 피드백을 표시한다", () => {
    // iOS에서 버튼을 눌렀을 때 바로 반응하도록 고친 CSS가 HTML 문자열에 계속 남아 있는지 확인합니다.
    // [라이브러리] global 정규식은 일치하는 모든 button 모양을 찾습니다. 그 배열 길이로 정확한 개수를 확인합니다.
    expect(LOCAL_DEMO_HTML.match(/<button ontouchstart=""/g)).toHaveLength(9);
    // `not.toContain`은 버튼 반응을 늦췄던 CSS property가 다시 들어오면 test를 실패시킵니다.
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

  // [역할] 이 test callback은 선택 사진 두 장과 이름을 보여 줄 DOM id가 모두 있는지 확인합니다.
  it("사진 두 장을 표시할 요소를 포함한다", () => {
    expect(LOCAL_DEMO_HTML).toContain('id="image1"');
    expect(LOCAL_DEMO_HTML).toContain('id="image2"');
    expect(LOCAL_DEMO_HTML).toContain('id="photo1_name"');
    expect(LOCAL_DEMO_HTML).toContain('id="photo2_name"');
  });
});

// =================================================================================================
