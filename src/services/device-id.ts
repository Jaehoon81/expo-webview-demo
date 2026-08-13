// [파일 역할] 앱 설치 저장소에 UUID를 한 번 만들고 SecureStore와 process-level Promise cache에서 재사용합니다.
// [검증 경계] 이 값은 앱이 만든 demo identifier이며 OS hardware identifier가 아닙니다.
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const DEVICE_ID_KEY = "my-webview-app-device-id";

let deviceIdPromise: Promise<string> | null = null;

async function loadDeviceId(): Promise<string> {
  // [FLOW-05 / 6단계] 저장값을 우선 반환하고 없을 때만 random UUID를 생성해 다음 실행을 위해 보관합니다.
  const storedDeviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

  if (storedDeviceId) {
    return storedDeviceId;
  }

  const deviceId = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

export function getOrCreateDeviceId(): Promise<string> {
  // 동시에 여러 WebView가 요청해도 하나의 in-flight Promise를 공유해 서로 다른 UUID가 생성되는 경쟁을 막습니다.
  if (!deviceIdPromise) {
    deviceIdPromise = loadDeviceId().catch((error) => {
      // 실패 Promise를 영구 cache하지 않아 권한·storage 문제가 해소된 뒤 다음 호출이 다시 시도할 수 있습니다.
      deviceIdPromise = null;
      throw error;
    });
  }

  return deviceIdPromise;
}
