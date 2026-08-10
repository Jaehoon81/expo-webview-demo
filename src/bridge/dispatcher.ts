import { ZodError } from "zod";

import { parseBridgeRequest, readBridgeEnvelope } from "@/src/bridge/schema";
import type {
  BridgeDependencies,
  BridgeResponse,
} from "@/src/bridge/types";

function success<T>(
  uuid: string,
  action: string,
  result: T,
): BridgeResponse<T> {
  return {
    uuid,
    action,
    result,
    isError: false,
  };
}

function failure(
  uuid: string,
  action: string,
  result: string,
): BridgeResponse<string> {
  return {
    uuid,
    action,
    result,
    isError: true,
  };
}

export async function dispatchBridgeMessage(
  message: string,
  dependencies: BridgeDependencies,
): Promise<BridgeResponse> {
  const fallback = readBridgeEnvelope(message);

  try {
    const request = parseBridgeRequest(message);

    switch (request.action) {
      case "getDeviceUUID":
        return success(
          request.uuid,
          request.action,
          await dependencies.getDeviceUUID(),
        );
      case "showToastMessage":
        await dependencies.showToastMessage(request.params[0]);
        return success(request.uuid, request.action, request.params[0]);
      case "showNotiMessage":
        await dependencies.showNotiMessage(
          request.params[0],
          request.params[1],
        );
        return success(request.uuid, request.action, request.params[0]);
      case "reloadOtherTabs":
        await dependencies.reloadOtherTabs();
        return success(request.uuid, request.action, "");
      case "goToAnotherTab":
        await dependencies.goToAnotherTab(
          request.params[0],
          request.params[1],
        );
        return success(request.uuid, request.action, "");
      case "showBottomNaviView":
        dependencies.setBottomNaviVisible(true);
        return success(request.uuid, request.action, "");
      case "hideBottomNaviView":
        dependencies.setBottomNaviVisible(false);
        return success(request.uuid, request.action, "");
      case "getPhotoImages":
        return success(
          request.uuid,
          request.action,
          await dependencies.getPhotoImages(),
        );
    }
  } catch (error) {
    const message =
      error instanceof ZodError
        ? "요청 형식 또는 Parameter 값이 올바르지 않습니다."
        : error instanceof Error
          ? error.message
          : "알 수 없는 오류입니다.";

    return failure(fallback.uuid, fallback.action, message);
  }
}
