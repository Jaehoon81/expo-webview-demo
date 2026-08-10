import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const DEVICE_ID_KEY = "my-webview-app-device-id";

let deviceIdPromise: Promise<string> | null = null;

async function loadDeviceId(): Promise<string> {
  const storedDeviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

  if (storedDeviceId) {
    return storedDeviceId;
  }

  const deviceId = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  return deviceId;
}

export function getOrCreateDeviceId(): Promise<string> {
  if (!deviceIdPromise) {
    deviceIdPromise = loadDeviceId().catch((error) => {
      deviceIdPromise = null;
      throw error;
    });
  }

  return deviceIdPromise;
}
