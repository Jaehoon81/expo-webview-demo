// [파일 역할] system path의 custom-scheme/Expo Go 모양을 index route canonical query로 바꾸는 문자열 계약을 검증합니다.
// [검증 경계] Expo Router hook만 테스트하며 Android intent filter, iOS scheme registration과 실제 app launch는 확인하지 않습니다.
import { rewriteIncomingSystemPath } from "@/src/services/native-intent";

describe("rewriteIncomingSystemPath", () => {
  it("custom scheme을 index route의 canonical query로 재작성한다", () => {
    const result = rewriteIncomingSystemPath(
      "mywebviewapp://webviewappdemo?target=1&url=m.nate.com",
    );

    expect(result).toBe(
      "/?demoDeepLink=mywebviewapp%3A%2F%2Fwebviewappdemo%3Ftarget%3D1%26url%3Dm.nate.com",
    );
  });

  it("Expo Go path도 같은 canonical query로 재작성한다", () => {
    const result = rewriteIncomingSystemPath(
      "exp://192.0.2.10:8081/--/webviewappdemo?target=3",
    );

    expect(result).toBe(
      "/?demoDeepLink=mywebviewapp%3A%2F%2Fwebviewappdemo%3Ftarget%3D3",
    );
  });

  it("관련 없는 route는 변경하지 않는다", () => {
    // demo가 아닌 route를 rewrite가 가로채지 않는 보존 경계입니다.
    expect(rewriteIncomingSystemPath("/settings")).toBe("/settings");
  });

  it("유효하지 않은 입력은 안전하게 index로 보낸다", () => {
    expect(rewriteIncomingSystemPath("http://[invalid")).toBe("/");
  });
});
