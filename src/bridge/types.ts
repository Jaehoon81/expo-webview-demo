// [파일 역할] WebView bridge의 action 이름, 공통 response, 사진 결과와 dispatcher 의존성 계약을 정의합니다.
import type { TabTag } from "@/src/types/navigation";

// 이 배열이 TypeScript BridgeAction의 단일 기준이며 local HTML의 action 문자열·Zod schema와 함께 맞아야 합니다.
export const BRIDGE_ACTIONS = [
  "getDeviceUUID",
  "showToastMessage",
  "showNotiMessage",
  "reloadOtherTabs",
  "goToAnotherTab",
  "showBottomNaviView",
  "hideBottomNaviView",
  "getPhotoImages",
] as const;

export type BridgeAction = (typeof BRIDGE_ACTIONS)[number];

export type PhotoResult = {
  name: string;
  base64Image: string;
};

export type BridgeResponse<T = unknown> = {
  // request uuid와 action을 그대로 돌려줘 web callback이 여러 비동기 요청의 결과를 구분할 수 있습니다.
  uuid: string;
  action: BridgeAction | string;
  result: T;
  isError: boolean;
};

export type BridgeDependencies = {
  // [이유] dispatcher가 Expo API나 React state를 직접 import하지 않고 실제 실행 함수를 주입받아 action 분기만 담당합니다.
  getDeviceUUID: () => Promise<string>;
  showToastMessage: (message: string) => void | Promise<void>;
  showNotiMessage: (title: string, body?: string) => Promise<void>;
  reloadOtherTabs: () => void | Promise<void>;
  goToAnotherTab: (targetTab: TabTag, targetUrl: string) => void | Promise<void>;
  setBottomNaviVisible: (visible: boolean) => void;
  getPhotoImages: () => Promise<PhotoResult[]>;
};
