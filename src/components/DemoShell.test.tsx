// [파일 역할] OS deep link query를 적용한 뒤 현재 route에서 한 번만 지우는 navigation 계약을 확인합니다.
// [검증 경계] Expo Router Hook과 child component, native service를 가짜로 바꿉니다.
// 현재 route navigation 선택과 state 적용만 확인하며 Android/iOS의 실제 cold launch timing은 실기기에서 확인해야 합니다.
// [라이브러리] React Native Testing Library의 `render`는 mount 뒤 effect까지 실행해 query 처리 결과를 관찰하게 합니다.

// ========================================== 외부 의존성 ==========================================

import { render } from "@testing-library/react-native";

import { DemoShell } from "@/src/components/DemoShell";

// =================================================================================================

// ====================================== test mock과 helper =======================================

// 현재 route와 전역 Router의 param 정리 명령을 분리해 어느 객체가 실제로 사용됐는지 기록합니다.
const mockCurrentRouteSetParams = jest.fn();
const mockGlobalRouterSetParams = jest.fn();
const mockUseLocalSearchParams = jest.fn();
const mockUseNavigation = jest.fn(() => ({
  setParams: mockCurrentRouteSetParams,
}));
const mockUseRouter = jest.fn(() => ({
  setParams: mockGlobalRouterSetParams,
}));
const mockSetSelectedTabIndex = jest.fn();
const mockUnsubscribeNotifications = jest.fn();

// [라이브러리] Expo Router mock은 cold launch query와 두 navigation API를 test가 직접 구분하게 합니다.
jest.mock("expo-router", () => ({
  // [역할] local search param mock Hook은 test가 지정한 index query snapshot을 반환합니다.
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  // [역할] current route navigation mock Hook은 mount된 index route의 param 정리 명령을 제공합니다.
  useNavigation: () => mockUseNavigation(),
  // [검증 경계] global Router mock은 회귀로 `useRouter`를 다시 사용하면 호출 기록에 남게 합니다.
  useRouter: () => mockUseRouter(),
}));

// [라이브러리] network Hook은 연결된 고정 snapshot을 반환해 deep link와 무관한 banner branch를 안정시킵니다.
jest.mock("expo-network", () => ({
  NetworkStateType: { NONE: "NONE", WIFI: "WIFI" },
  useNetworkState: () => ({
    isConnected: true,
    isInternetReachable: true,
    type: "WIFI",
  }),
}));

// [라이브러리] safe-area mock은 provider 없이도 DemoShell의 하단 높이 계산에 필요한 네 값을 제공합니다.
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, left: 0, right: 0, top: 0 }),
}));

// [역할] Zustand mock은 selector가 읽는 현재 tab과 setter만 제공해 deep link 적용 결과를 기록합니다.
jest.mock("@/src/store/app-store", () => ({
  useAppStore: (selector: (state: unknown) => unknown) =>
    selector({
      selectedTabIndex: 0,
      setSelectedTabIndex: mockSetSelectedTabIndex,
    }),
}));

// 화면 child는 이 test의 route query 계약과 관계없으므로 mount 구조만 남기고 native/WebView 동작은 만들지 않습니다.
jest.mock("@/src/components/BottomTabBar", () => ({
  BOTTOM_TAB_BASE_HEIGHT: 58,
  BottomTabBar: () => null,
}));
jest.mock("@/src/components/NativeUsersScreen", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    // [역할] native screen mock은 ref를 받을 수 있는 빈 component로 실제 Query 요청을 막습니다.
    NativeUsersScreen: React.forwardRef(function MockNativeUsersScreen() {
      return null;
    }),
  };
});
jest.mock("@/src/components/NetworkStatusBanner", () => ({
  NetworkStatusBanner: () => null,
}));
jest.mock("@/src/components/PopupWebView", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    // [역할] popup mock은 ref를 받을 수 있는 빈 component로 실제 WebView lifecycle을 제외합니다.
    PopupWebView: React.forwardRef(function MockPopupWebView() {
      return null;
    }),
  };
});
jest.mock("@/src/components/Snackbar", () => ({
  Snackbar: () => null,
}));
jest.mock("@/src/components/WebTab", () => {
  const React = jest.requireActual<typeof import("react")>("react");

  return {
    // [역할] Web tab mock은 ref를 받을 수 있는 빈 component로 URL load와 native history를 실기기 경계에 남깁니다.
    WebTab: React.forwardRef(function MockWebTab() {
      return null;
    }),
  };
});

// deep link effect와 함께 mount되는 service effect는 native side effect 없이 같은 Promise·cleanup 모양만 반환합니다.
jest.mock("@/src/services/notification-service", () => ({
  clearApplicationBadge: jest.fn().mockResolvedValue(undefined),
  configureNotificationHandler: jest.fn(),
  showDemoNotification: jest.fn().mockResolvedValue(undefined),
  subscribeToNotificationEvents: () => mockUnsubscribeNotifications,
}));
jest.mock("@/src/services/device-id", () => ({
  getOrCreateDeviceId: jest.fn().mockResolvedValue("test-device-id"),
}));
jest.mock("@/src/services/photo-service", () => ({
  selectPhotoImages: jest.fn().mockResolvedValue([]),
}));

// =================================================================================================

// ========================================== test cases ===========================================

// [역할] `describe` callback은 OS deep link query의 적용과 정리 객체 선택을 확인하는 test를 실행합니다.
describe("DemoShell deep link query cleanup", () => {
  // [역할] `beforeEach` callback은 이전 호출 기록을 지우고 cold launch와 같은 첫 query snapshot을 준비합니다.
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocalSearchParams.mockReturnValue({
      demoDeepLink:
        "mywebviewapp://webviewappdemo?target=1&url=m.nate.com",
    });
  });

  // [역할] 이 test callback은 deep link 적용 뒤 global Router가 아니라 mount된 현재 route의 param을 지우는지 확인합니다.
  it("cold deep link query를 현재 route navigation으로 정리한다", async () => {
    await render(<DemoShell />);

    expect(mockSetSelectedTabIndex).toHaveBeenCalledWith(1);
    expect(mockUseNavigation).toHaveBeenCalled();
    expect(mockCurrentRouteSetParams).toHaveBeenCalledWith({
      demoDeepLink: undefined,
    });
    expect(mockUseRouter).not.toHaveBeenCalled();
    expect(mockGlobalRouterSetParams).not.toHaveBeenCalled();
  });
});

// =================================================================================================
