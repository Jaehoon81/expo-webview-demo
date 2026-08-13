// [파일 역할] 검증된 bridge request를 주입된 app 기능에 dispatch하고 모든 결과를 하나의 response envelope로 정규화합니다.
// [검증 경계] 단위 test는 dependency spy와 response 계약을 확인하며 실제 권한 UI·알림·사진 picker·WebView 주입은 runtime 경계입니다.
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
  // success/failure helper가 모든 action에서 uuid·action·isError 모양을 동일하게 유지합니다.
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
  // parse 전에 fallback envelope를 읽어 invalid params나 dependency 예외에도 요청 식별자를 돌려줄 수 있게 합니다.
  const fallback = readBridgeEnvelope(message);

  try {
    const request = parseBridgeRequest(message);

    // [FLOW-05 / 5단계] discriminated union이 좁힌 action별 params를 대응 dependency에 전달하고 Promise 완료까지 기다립니다.
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
        // 동기 React state setter도 다른 비동기 action과 같은 envelope로 즉시 완료합니다.
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
    // Zod 오류는 내부 path를 노출하지 않고 사용자용 형식 오류로, 기기 기능 Error는 의도된 message로 변환합니다.
    const message =
      error instanceof ZodError
        ? "요청 형식 또는 Parameter 값이 올바르지 않습니다."
        : error instanceof Error
          ? error.message
          : "알 수 없는 오류입니다.";

    return failure(fallback.uuid, fallback.action, message);
  }
}
