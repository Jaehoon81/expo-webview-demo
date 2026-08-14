// [파일 역할] bridge action 8개가 알맞은 함수를 부르는지 확인합니다. 성공 응답과 입력 오류·기능 실행 오류의 공통 응답 모양도 검사합니다.
// [검증 경계] 실제 SecureStore, Toast, 알림, 사진, 탭 화면은 사용하지 않고 Jest의 가짜 함수를 씁니다.
// 실제 WebView callback 실행도 확인하지 않습니다.
// [라이브러리] Jest mock 함수는 어떤 값으로 몇 번 불렸는지 기록합니다. 성공값을 돌려주거나 오류를 내도록 test에서 정할 수도 있습니다.

// ========================================== 외부 의존성 ==========================================

import { dispatchBridgeMessage } from "@/src/bridge/dispatcher";
import type { BridgeDependencies } from "@/src/bridge/types";

// =================================================================================================

// ======================================= bridge test 준비 ========================================

// [역할] `makeDependencies`는 각 test가 독립적으로 사용할 bridge 실행 함수 mock 묶음을 만듭니다.
// [문법] `jest.Mocked<T>`는 interface 안의 각 함수를 Jest mock type으로 바꿉니다.
// 그래서 `toHaveBeenCalledWith` 같은 검사 기능을 쓸 수 있습니다.
function makeDependencies(): jest.Mocked<BridgeDependencies> {
  // 실제 interface와 같은 함수 이름을 가진 가짜 기능 묶음입니다.
  // test마다 새 객체를 만들어 이전 test의 호출 기록과 설정이 섞이지 않게 합니다.
  return {
    getDeviceUUID: jest.fn().mockResolvedValue("device-id"),
    showToastMessage: jest.fn(),
    showNotiMessage: jest.fn().mockResolvedValue(undefined),
    reloadOtherTabs: jest.fn(),
    goToAnotherTab: jest.fn(),
    setBottomNaviVisible: jest.fn(),
    getPhotoImages: jest.fn().mockResolvedValue([
      {
        name: "사진앨범 선택 이미지(1)",
        base64Image: "base64-data",
      },
    ]),
  };
}

// =================================================================================================

// ======================================= bridge test cases =======================================

// [역할] `describe` callback은 bridge action 실행과 공통 응답을 확인하는 test들을 한 묶음으로 실행합니다.
describe("dispatchBridgeMessage", () => {
  // [역할] 이 test callback은 UUID action 결과가 원래 요청 정보와 함께 성공 응답으로 돌아오는지 확인합니다.
  it("getDeviceUUID 결과를 기존 envelope로 반환한다", async () => {
    // [문법] `async` test에서 `await`를 사용해 dispatcher 작업이 끝난 뒤 결과를 검사합니다.
    const dependencies = makeDependencies();
    // [라이브러리] 실제 WebView도 문자열 message를 보내므로 `JSON.stringify`로 요청 객체를 문자열로 바꿔 전달합니다.
    const result = await dispatchBridgeMessage(
      JSON.stringify({ uuid: "", action: "getDeviceUUID" }),
      dependencies,
    );

    expect(result).toEqual({
      uuid: "",
      action: "getDeviceUUID",
      result: "device-id",
      isError: false,
    });
  });

  // [역할] 이 test callback은 toast와 알림 parameter가 알맞은 실행 함수에 전달되는지 확인합니다.
  it("toast와 notification parameter를 전달한다", async () => {
    const dependencies = makeDependencies();

    await dispatchBridgeMessage(
      JSON.stringify({
        uuid: "toast-id",
        action: "showToastMessage",
        params: ["토스트"],
      }),
      dependencies,
    );
    await dispatchBridgeMessage(
      JSON.stringify({
        uuid: "noti-id",
        action: "showNotiMessage",
        params: ["제목", "본문"],
      }),
      dependencies,
    );

    // [라이브러리] `toHaveBeenCalledWith`로 응답만 보지 않고, 실제 기능에 올바른 parameter가 전달됐는지도 확인합니다.
    expect(dependencies.showToastMessage).toHaveBeenCalledWith("토스트");
    expect(dependencies.showNotiMessage).toHaveBeenCalledWith("제목", "본문");
  });

  // [역할] 이 test callback은 다른 탭 새로 고침과 탭 이동 action이 각각 실행되는지 확인합니다.
  it("reload와 다른 탭 이동을 실행한다", async () => {
    const dependencies = makeDependencies();

    await dispatchBridgeMessage(
      JSON.stringify({ uuid: "reload-id", action: "reloadOtherTabs" }),
      dependencies,
    );
    await dispatchBridgeMessage(
      JSON.stringify({
        uuid: "move-id",
        action: "goToAnotherTab",
        params: ["f1", "https://m.nate.com"],
      }),
      dependencies,
    );

    expect(dependencies.reloadOtherTabs).toHaveBeenCalledTimes(1);
    expect(dependencies.goToAnotherTab).toHaveBeenCalledWith(
      "f1",
      "https://m.nate.com",
    );
  });

  // [역할] 이 test callback은 하단 탭 보이기와 숨기기가 서로 다른 boolean 값으로 전달되는지 확인합니다.
  it("하단 탭 표시와 숨김을 구분한다", async () => {
    const dependencies = makeDependencies();

    await dispatchBridgeMessage(
      JSON.stringify({
        uuid: "show-id",
        action: "showBottomNaviView",
      }),
      dependencies,
    );
    await dispatchBridgeMessage(
      JSON.stringify({
        uuid: "hide-id",
        action: "hideBottomNaviView",
      }),
      dependencies,
    );

    expect(dependencies.setBottomNaviVisible).toHaveBeenNthCalledWith(1, true);
    expect(dependencies.setBottomNaviVisible).toHaveBeenNthCalledWith(2, false);
  });

  // [역할] 이 test callback은 사진 선택 결과 배열이 bridge 성공 응답에 그대로 담기는지 확인합니다.
  it("사진 결과 배열을 반환한다", async () => {
    const dependencies = makeDependencies();
    const result = await dispatchBridgeMessage(
      JSON.stringify({ uuid: "photo-id", action: "getPhotoImages" }),
      dependencies,
    );

    // `toMatchObject`로 응답의 공통 핵심 값을 확인합니다. result 배열은 바로 아래에서 전체 값을 따로 비교합니다.
    expect(result).toMatchObject({
      uuid: "photo-id",
      action: "getPhotoImages",
      isError: false,
    });
    expect(result.result).toEqual([
      {
        name: "사진앨범 선택 이미지(1)",
        base64Image: "base64-data",
      },
    ]);
  });

  // [역할] 이 test callback은 모르는 action과 빠진 parameter가 공통 입력 오류 응답으로 바뀌는지 확인합니다.
  it("잘못된 action과 parameter를 error envelope로 반환한다", async () => {
    // 모르는 action과 필요한 params가 빠진 action을 모두 거절하는지 확인합니다. JSON 문법만 맞는다고 요청을 받아서는 안 됩니다.
    const dependencies = makeDependencies();
    const unknownAction = await dispatchBridgeMessage(
      JSON.stringify({ uuid: "bad-id", action: "unknownAction" }),
      dependencies,
    );
    const missingParameter = await dispatchBridgeMessage(
      JSON.stringify({ uuid: "toast-id", action: "showToastMessage" }),
      dependencies,
    );

    expect(unknownAction).toEqual({
      uuid: "bad-id",
      action: "unknownAction",
      result: "요청 형식 또는 Parameter 값이 올바르지 않습니다.",
      isError: true,
    });
    expect(missingParameter.isError).toBe(true);
  });

  // [역할] 이 test callback은 기기 기능이 낸 Error가 요청 정보를 보존한 실패 응답으로 바뀌는지 확인합니다.
  it("기기 기능 오류를 같은 envelope로 변환한다", async () => {
    const dependencies = makeDependencies();
    // [라이브러리] `mockRejectedValue`는 휴대폰 기능이 실패한 것처럼 Promise 오류를 만듭니다. dispatcher의 오류 처리 코드가 실행됩니다.
    dependencies.getPhotoImages.mockRejectedValue(
      // 사진 선택 취소처럼 실제 기능이 Error를 낸 경우입니다. 실패 응답에도 원래 uuid와 action이 남는지 확인합니다.
      new Error("사진 선택을 취소했습니다."),
    );

    const result = await dispatchBridgeMessage(
      JSON.stringify({ uuid: "photo-id", action: "getPhotoImages" }),
      dependencies,
    );

    expect(result).toEqual({
      uuid: "photo-id",
      action: "getPhotoImages",
      result: "사진 선택을 취소했습니다.",
      isError: true,
    });
  });
});

// =================================================================================================
