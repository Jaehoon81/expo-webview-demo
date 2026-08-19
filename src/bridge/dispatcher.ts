// [파일 역할] 검사한 bridge 요청에 맞는 앱 기능을 골라 실행하고, 결과를 항상 같은 응답 모양으로 만듭니다.
// [검증 경계] 단위 test는 가짜 실행 함수가 어떻게 호출됐고 어떤 응답이 나왔는지만 확인합니다.
// 실제 권한 화면, 알림, 사진 선택, WebView JavaScript 실행은 기기에서 확인해야 합니다.
// [라이브러리] `ZodError`인지 확인해 입력 형식 오류와 기기 기능 오류를 서로 다른 문구로 바꿉니다.

// ========================================== 외부 의존성 ==========================================

import { ZodError } from "zod";

import { parseBridgeRequest, readBridgeEnvelope } from "@/src/bridge/schema";
import type {
  BridgeDependencies,
  BridgeResponse,
} from "@/src/bridge/types";

// =================================================================================================

// ====================================== bridge 응답 helper =======================================

// [역할] `success`는 action마다 다른 결과를 공통 성공 응답 모양으로 감쌉니다.
// [문법] `T`에는 action마다 다른 result type이 들어갑니다. 그 값을 유지한 채 같은 성공 응답 모양을 만듭니다.
function success<T>(
  uuid: string,
  action: string,
  result: T,
): BridgeResponse<T> {
  // [FLOW-05 / 13-A단계] dependency branch가 끝나면 `success`가 원래 uuid·action·result를 공통 성공 envelope로 합칩니다.
  // 어느 action이 성공해도 uuid, action, result, isError 순서를 같은 모양으로 맞춥니다.
  return {
    uuid,
    action,
    result,
    isError: false,
  };
}

// 실패 응답의 result에는 사용자가 읽을 오류 문자열만 넣습니다.
// [역할] `failure`는 입력 검사나 기기 기능 오류를 공통 실패 응답 모양으로 감쌉니다.
function failure(
  uuid: string,
  action: string,
  result: string,
): BridgeResponse<string> {
  // [FLOW-05 / 13-B단계] validation 또는 dependency 오류 branch는 `failure`가 fallback uuid·action과 message를 공통 실패 envelope로 합칩니다.
  return {
    uuid,
    action,
    result,
    isError: true,
  };
}

// =================================================================================================

// ======================================= bridge dispatcher =======================================

// [역할] `dispatchBridgeMessage`는 요청을 검사하고 action에 맞는 실행 함수를 부른 뒤 공통 응답을 돌려줍니다.
// [문법] `async`를 사용해 바로 끝나는 화면 작업과 기다려야 하는 기기 작업을 모두 Promise 응답으로 맞춥니다.
// [FLOW-05 / 14단계] 각 `return`의 envelope가 이 async 함수의 Promise를 fulfill해 `handleBridgeMessage` 반환 경로를 거슬러 올라갑니다.
export async function dispatchBridgeMessage(
  message: string,
  dependencies: BridgeDependencies,
): Promise<BridgeResponse> {
  // 전체 검사를 시작하기 전에 uuid와 action만 먼저 읽습니다. 나중에 실패해도 어느 요청인지 돌려주기 위해서입니다.
  // [FLOW-05 / 7단계] 먼저 `readBridgeEnvelope`가 실패 응답에도 보존할 수 있는 uuid·action만 별도로 읽습니다.
  const fallback = readBridgeEnvelope(message);

  // 요청 검사와 실제 기능 실행을 같은 `try` 안에 둡니다. 어느 단계에서 실패해도 같은 실패 응답으로 바꿉니다.
  try {
    const request = parseBridgeRequest(message);

    // [FLOW-05 / 9단계] validation을 통과한 `request.action`이 switch case 하나를 선택하고 그 dependency 완료를 기다립니다.
    // [문법] `switch`가 action별로 나누므로 각 `case` 안에서는 그 action에 맞는 params 모양을 사용할 수 있습니다.
    switch (request.action) {
      case "getDeviceUUID":
        // [FLOW-05 / 10-A단계] UUID branch는 `getDeviceUUID()` Promise를 await한 문자열을 success result로 넘깁니다.
        // UUID를 읽거나 새로 저장하는 작업이 끝난 뒤 그 문자열을 성공 결과에 넣습니다.
        return success(
          request.uuid,
          request.action,
          await dependencies.getDeviceUUID(),
        );
      case "showToastMessage":
        // [FLOW-05 / 10-B단계] toast branch는 첫 params를 UI dependency에 넘기고 완료 뒤 같은 message를 result로 씁니다.
        // 함수가 바로 끝나면 다음 줄로 가고, Promise를 돌려주면 `await`가 끝날 때까지 기다립니다.
        await dependencies.showToastMessage(request.params[0]);
        return success(request.uuid, request.action, request.params[0]);
      case "showNotiMessage":
        // [FLOW-05 / 10-C단계] notification branch는 검사된 title·optional body로 local 예약 dependency를 await합니다.
        // Zod가 검사했으므로 첫 값은 알림 제목이고, 둘째 값은 있을 수도 있는 본문입니다.
        await dependencies.showNotiMessage(
          request.params[0],
          request.params[1],
        );
        return success(request.uuid, request.action, request.params[0]);
      case "reloadOtherTabs":
        // [FLOW-05 / 10-D단계] reload branch는 sender를 아는 DemoShell dependency가 다른 child 작업을 끝낼 때까지 await합니다.
        // 다른 탭을 새로 고친 뒤 WebView에 돌려줄 별도 값은 없어 빈 문자열을 넣습니다.
        await dependencies.reloadOtherTabs();
        return success(request.uuid, request.action, "");
      case "goToAnotherTab":
        // [FLOW-05 / 10-E단계] tab 이동 branch는 검사된 tag·URL을 DemoShell dependency에 넘기고 완료를 await합니다.
        // dispatcher는 검사한 tag와 URL만 전달합니다. 실제 탭 이동과 URL 확인은 DemoShell이 맡습니다.
        await dependencies.goToAnotherTab(
          request.params[0],
          request.params[1],
        );
        return success(request.uuid, request.action, "");
      case "showBottomNaviView":
        // [FLOW-05 / 10-F단계] 하단 탭 show branch는 같은 visibility dependency를 `true`로 동기 호출합니다.
        // React 상태를 바꾸는 함수는 바로 끝나지만 다른 action과 같은 성공 응답을 돌려줍니다.
        dependencies.setBottomNaviVisible(true);
        return success(request.uuid, request.action, "");
      case "hideBottomNaviView":
        // [FLOW-05 / 10-G단계] 하단 탭 hide branch는 visibility dependency를 `false`로 동기 호출합니다.
        // 보이기와 숨기기는 같은 함수에 true 또는 false만 다르게 전달합니다.
        dependencies.setBottomNaviVisible(false);
        return success(request.uuid, request.action, "");
      case "getPhotoImages":
        // [FLOW-05 / 10-H단계] 사진 branch는 권한·picker·변환 dependency가 돌려주는 배열을 await해 result로 넘깁니다.
        // 사진 선택과 크기 변경이 모두 끝난 배열을 한 번에 성공 결과로 보냅니다.
        return success(
          request.uuid,
          request.action,
          await dependencies.getPhotoImages(),
        );
    }
  } catch (error) {
    // [FLOW-05 / 12-B단계] JSON/Zod 검사나 어느 dependency의 throw/reject도 이 catch로 합류해 사용자용 message를 고릅니다.
    // Zod 오류의 자세한 내부 위치는 숨기고 쉬운 입력 형식 오류 문구로 바꿉니다.
    // 기기 기능이 만든 일반 Error라면 그 message를 사용하고, 둘 다 아니면 알 수 없는 오류로 표시합니다.
    // [문법] `instanceof`로 오류 종류를 하나씩 확인하고 중첩 삼항 연산자로 세 문구 중 하나를 고릅니다.
    const message =
      error instanceof ZodError
        ? "요청 형식 또는 Parameter 값이 올바르지 않습니다."
        : error instanceof Error
          ? error.message
          : "알 수 없는 오류입니다.";

    return failure(fallback.uuid, fallback.action, message);
  }
}

// =================================================================================================
