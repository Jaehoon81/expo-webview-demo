import type { TabTag } from "@/src/types/navigation";

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
  uuid: string;
  action: BridgeAction | string;
  result: T;
  isError: boolean;
};

export type BridgeDependencies = {
  getDeviceUUID: () => Promise<string>;
  showToastMessage: (message: string) => void | Promise<void>;
  showNotiMessage: (title: string, body?: string) => Promise<void>;
  reloadOtherTabs: () => void | Promise<void>;
  goToAnotherTab: (targetTab: TabTag, targetUrl: string) => void | Promise<void>;
  setBottomNaviVisible: (visible: boolean) => void;
  getPhotoImages: () => Promise<PhotoResult[]>;
};
