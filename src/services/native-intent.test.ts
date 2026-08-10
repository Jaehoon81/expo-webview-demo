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
    expect(rewriteIncomingSystemPath("/settings")).toBe("/settings");
  });

  it("유효하지 않은 입력은 안전하게 index로 보낸다", () => {
    expect(rewriteIncomingSystemPath("http://[invalid")).toBe("/");
  });
});
