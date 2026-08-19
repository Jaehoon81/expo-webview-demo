// [파일 역할] 이 앱 설치본을 구분할 UUID를 한 번 만들고, 다음 요청과 앱 재실행에서도 같은 값을 사용합니다.
// [검증 경계] 이 값은 demo 앱이 직접 만든 번호입니다. 휴대폰의 고유 하드웨어 번호가 아닙니다.
// [라이브러리] `Crypto.randomUUID()`가 UUID 문자열을 만들고 SecureStore가 기기의 보안 저장소에 보관합니다.

// ========================================== 외부 의존성 ==========================================

import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

// =================================================================================================

// ======================================== device ID 상태 =========================================

const DEVICE_ID_KEY = "my-webview-app-device-id";

// [문법] 이 변수는 함수 밖에 있으므로 앱의 JavaScript가 실행되는 동안 함께 사용됩니다.
// `Promise<string> | null`은 UUID를 읽는 중인 Promise 또는 아직 시작하지 않았다는 null을 담습니다.
let deviceIdPromise: Promise<string> | null = null;

// =================================================================================================

// ======================================== device ID 함수 =========================================

// [역할] `loadDeviceId`는 저장된 UUID를 읽고, 없으면 새 UUID를 만들어 저장한 뒤 돌려줍니다.
// [문법] `async` 함수는 문자열을 바로 주는 대신 `Promise<string>`으로 돌려줍니다.
// `await` 중 오류가 나면 이 함수를 부른 쪽에서도 실패한 Promise로 받습니다.
async function loadDeviceId(): Promise<string> {
  // [FLOW-05 / 12-A단계] shared Promise 안에서 SecureStore read를 await하고 저장값 반환 또는 UUID 생성·저장 branch를 끝낸 뒤 dispatcher로 돌려줍니다.
  const storedDeviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

  if (storedDeviceId) {
    // 이미 저장된 값이 있으면 새 UUID를 만들거나 다시 저장하지 않습니다.
    return storedDeviceId;
  }

  // [라이브러리] `Crypto.randomUUID()`는 UUID를 바로 만들지만 SecureStore 저장은 끝날 때까지 기다려야 합니다.
  const deviceId = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

// [역할] `getOrCreateDeviceId`는 동시에 들어온 요청들이 진행 중인 UUID 작업 하나를 함께 기다리게 합니다.
export function getOrCreateDeviceId(): Promise<string> {
  // [FLOW-05 / 11-A단계] UUID dependency가 이 함수를 호출하면 진행 중 Promise를 재사용하거나 `loadDeviceId()`를 한 번 시작합니다.
  // 여러 WebView가 동시에 요청해도 진행 중인 Promise 하나를 함께 기다립니다. 그래서 서로 다른 UUID가 생기지 않습니다.
  if (!deviceIdPromise) {
    // [역할] 실패 처리 callback은 끝나지 못한 Promise를 cache에서 지우고 같은 오류를 호출자에게 다시 보냅니다.
    deviceIdPromise = loadDeviceId().catch((error) => {
      // 실패한 Promise는 지웁니다. 저장소 문제가 해결된 뒤 다음 요청이 다시 시도할 수 있게 하기 위해서입니다.
      deviceIdPromise = null;
      // [문법] `throw error`는 잡은 오류를 숨기지 않고 다시 밖으로 보냅니다.
      // dispatcher는 이 오류를 WebView가 받을 공통 실패 응답으로 바꿉니다.
      throw error;
    });
  }

  return deviceIdPromise;
}

// =================================================================================================
