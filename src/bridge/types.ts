// [파일 역할] WebView와 앱이 주고받는 action 이름, 응답 모양, 사진 결과, 실행 함수 모양을 정합니다.
// [문법] `import type`은 TypeScript 검사에만 쓰입니다. 실행되는 JavaScript에는 import가 남지 않습니다.

// ========================================== 외부 의존성 ==========================================

import type { TabTag } from "@/src/types/navigation";

// =================================================================================================

// ====================================== action과 응답 type =======================================

// [문법] `as const`로 고정한 배열에서 BridgeAction type을 만듭니다. 배열에 있는 여덟 문자열만 허용됩니다.
// [주의] 이 배열, local HTML의 action 문자열, Zod schema는 항상 같은 목록이어야 합니다.
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
  // WebView 화면은 name을 사진 이름으로, base64Image를 실제 이미지 내용으로 사용합니다.
  name: string;
  base64Image: string;
};

// [문법] `T`에는 action마다 다른 result type이 들어갑니다. 생략하면 `unknown`이라 확인 없이 바로 쓸 수 없습니다.
export type BridgeResponse<T = unknown> = {
  // 요청 때 받은 uuid와 action을 그대로 돌려줘 WebView가 어느 요청의 결과인지 구분하게 합니다.
  uuid: string;
  action: BridgeAction | string;
  result: T;
  isError: boolean;
};

// =================================================================================================

// ===================================== bridge 실행 함수 type =====================================

export type BridgeDependencies = {
  // [이유] dispatcher는 Expo API나 React 값을 직접 가져오지 않습니다. DemoShell이 실제 실행 함수를 전달합니다.
  // 이렇게 하면 dispatcher는 action을 고르는 일만 맡고 test에서는 가짜 함수를 넣을 수 있습니다.
  // [문법] `void | Promise<void>`는 바로 끝나는 함수와 기다려야 하는 함수를 모두 받을 수 있다는 뜻입니다.
  // [역할] `getDeviceUUID`는 앱에서 사용할 UUID를 읽거나 만들어 돌려주는 함수 계약입니다.
  getDeviceUUID: () => Promise<string>;
  // [역할] `showToastMessage`는 짧은 안내 문장을 현재 운영체제 화면에 보여 주는 함수 계약입니다.
  showToastMessage: (message: string) => void | Promise<void>;
  // [역할] `showNotiMessage`는 제목과 선택 본문으로 local 알림을 예약하는 함수 계약입니다.
  showNotiMessage: (title: string, body?: string) => Promise<void>;
  // [역할] `reloadOtherTabs`는 요청을 보낸 탭을 제외한 나머지 탭을 새로 고치는 함수 계약입니다.
  reloadOtherTabs: () => void | Promise<void>;
  // [역할] `goToAnotherTab`은 검사할 탭 tag와 URL을 실제 화면 이동 코드에 전달하는 함수 계약입니다.
  goToAnotherTab: (targetTab: TabTag, targetUrl: string) => void | Promise<void>;
  // [역할] `setBottomNaviVisible`은 bridge가 요청한 하단 탭 표시 여부를 화면 state에 반영하는 함수 계약입니다.
  setBottomNaviVisible: (visible: boolean) => void;
  // [역할] `getPhotoImages`는 선택과 변환을 마친 사진 배열을 돌려주는 함수 계약입니다.
  getPhotoImages: () => Promise<PhotoResult[]>;
};

// =================================================================================================
