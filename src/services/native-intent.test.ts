// [파일 역할] 휴대폰에서 받은 custom scheme과 Expo Go URL을 앱의 index route query로 올바르게 바꾸는지 확인합니다.
// [검증 경계] Expo Router가 부를 문자열 함수만 검사합니다. Android intent filter, iOS scheme 등록, 실제 앱 실행은 확인하지 않습니다.
// [라이브러리] Jest로 바뀐 문자열 전체를 비교합니다. URL 해석과 query 문자 변환 결과까지 포함합니다.
// [문법] 각 `it`의 `() => { ... }`는 그 test 안에서만 쓸 변수 영역을 만듭니다. 다른 test와 변수를 공유하지 않습니다.

// ========================================== 외부 의존성 ==========================================

import { rewriteIncomingSystemPath } from "@/src/services/native-intent";

// =================================================================================================

// ========================================== test cases ===========================================

// [역할] `describe` callback은 OS와 Expo Go 주소 변환 규칙을 확인하는 test들을 한 묶음으로 실행합니다.
describe("rewriteIncomingSystemPath", () => {
  // [역할] 이 test callback은 custom scheme 주소가 canonical index query로 바뀌는지 확인합니다.
  it("custom scheme을 index route의 canonical query로 재작성한다", () => {
    // 실제 Expo Router Hook이 받을 전체 custom scheme 문자열을 변환 함수에 직접 줍니다.
    const result = rewriteIncomingSystemPath(
      "mywebviewapp://webviewappdemo?target=1&url=m.nate.com",
    );

    // `toBe`로 slash와 percent encoding까지 포함한 문자열 전체를 정확히 비교합니다.
    expect(result).toBe(
      "/?demoDeepLink=mywebviewapp%3A%2F%2Fwebviewappdemo%3Ftarget%3D1%26url%3Dm.nate.com",
    );
  });

  // [역할] 이 test callback은 Expo Go의 `/--/` 주소도 같은 canonical query로 바뀌는지 확인합니다.
  it("Expo Go path도 같은 canonical query로 재작성한다", () => {
    // Expo Go URL의 `/--/` 앞부분이 있어도 최종 결과는 custom scheme과 같은 앱 내부 query 모양이어야 합니다.
    const result = rewriteIncomingSystemPath(
      "exp://192.0.2.10:8081/--/webviewappdemo?target=3",
    );

    expect(result).toBe(
      "/?demoDeepLink=mywebviewapp%3A%2F%2Fwebviewappdemo%3Ftarget%3D3",
    );
  });

  // [역할] 이 test callback은 demo와 관계없는 route가 원래 문자열 그대로 유지되는지 확인합니다.
  it("관련 없는 route는 변경하지 않는다", () => {
    // demo가 아닌 다른 route는 변환하지 않고 원래 값을 그대로 돌려주는지 확인합니다.
    expect(rewriteIncomingSystemPath("/settings")).toBe("/settings");
  });

  // [역할] 이 test callback은 URL로 읽을 수 없는 입력이 안전한 index route로 바뀌는지 확인합니다.
  it("유효하지 않은 입력은 안전하게 index로 보낸다", () => {
    expect(rewriteIncomingSystemPath("http://[invalid")).toBe("/");
  });
});

// =================================================================================================
