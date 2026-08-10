import { dispatchBridgeMessage } from "@/src/bridge/dispatcher";
import type { BridgeDependencies } from "@/src/bridge/types";

function makeDependencies(): jest.Mocked<BridgeDependencies> {
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

describe("dispatchBridgeMessage", () => {
  it("getDeviceUUID 결과를 기존 envelope로 반환한다", async () => {
    const dependencies = makeDependencies();
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

    expect(dependencies.showToastMessage).toHaveBeenCalledWith("토스트");
    expect(dependencies.showNotiMessage).toHaveBeenCalledWith("제목", "본문");
  });

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

  it("사진 결과 배열을 반환한다", async () => {
    const dependencies = makeDependencies();
    const result = await dispatchBridgeMessage(
      JSON.stringify({ uuid: "photo-id", action: "getPhotoImages" }),
      dependencies,
    );

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

  it("잘못된 action과 parameter를 error envelope로 반환한다", async () => {
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

  it("기기 기능 오류를 같은 envelope로 변환한다", async () => {
    const dependencies = makeDependencies();
    dependencies.getPhotoImages.mockRejectedValue(
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
