// [파일 역할] OS deep link query를 적용한 뒤 현재 route에서 완전히 지우고, 같은 Warm 입력도 다시 적용하는 navigation 계약을 확인합니다.
// [검증 경계] Expo Router Hook과 child component, native service를 가짜로 바꿉니다.
// 현재 route navigation 선택과 query snapshot 반복 처리를 확인하며 Android/iOS의 실제 cold·warm launch timing은 실기기에서 확인해야 합니다.
// [라이브러리] React Native Testing Library의 `render`는 mount 뒤 effect까지 실행해 query 처리 결과를 관찰하게 합니다.

// ========================================== 외부 의존성 ==========================================

import { render, waitFor } from "@testing-library/react-native";

import { DemoShell } from "@/src/components/DemoShell";

// =================================================================================================

// ====================================== test mock과 helper =======================================

// 현재 route와 전역 Router의 param 정리 명령을 분리해 어느 객체가 실제로 사용됐는지 기록합니다.
const mockCurrentRouteReplaceParams = jest.fn();
const mockGlobalRouterSetParams = jest.fn();
const mockUseLocalSearchParams = jest.fn();
const mockUseNavigation = jest.fn(() => ({
  replaceParams: mockCurrentRouteReplaceParams,
}));
const mockUseRouter = jest.fn(() => ({
  setParams: mockGlobalRouterSetParams,
}));
const mockSetSelectedTabIndex = jest.fn();
const mockWebTabLoadUrl = jest.fn();
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
    // [역할] Web tab mock은 imperative ref의 `loadUrl` 호출을 기록하되 실제 native WebView history는 실기기 경계에 남깁니다.
    WebTab: React.forwardRef<{ loadUrl: (url: string) => void }>(
      function MockWebTab(_props, forwardedRef) {
        React.useImperativeHandle(forwardedRef, () => ({
          loadUrl: mockWebTabLoadUrl,
        }));

        return null;
      },
    ),
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

  // [역할] 이 test callback은 deep link 적용 뒤 global Router가 아니라 mount된 현재 route의 params를 완전히 교체하는지 확인합니다.
  it("cold deep link query를 현재 route navigation으로 정리한다", async () => {
    await render(<DemoShell />);

    expect(mockSetSelectedTabIndex).toHaveBeenCalledWith(1);
    expect(mockWebTabLoadUrl).toHaveBeenCalledWith("https://m.nate.com/");
    expect(mockUseNavigation).toHaveBeenCalled();
    expect(mockCurrentRouteReplaceParams).toHaveBeenCalledWith({});
    expect(mockUseRouter).not.toHaveBeenCalled();
    expect(mockGlobalRouterSetParams).not.toHaveBeenCalled();
  });

  // [역할] 이 test callback은 처리 완료로 query가 사라진 뒤 같은 문자열이 다시 들어오면 Web tab 선택과 URL load가 한 번 더 실행되는지 확인합니다.
  it("같은 Web deep link의 Warm 재입력을 다시 적용한다", async () => {
    const deepLink =
      "mywebviewapp://webviewappdemo?target=1&url=m.nate.com";
    let currentDemoDeepLink: string | undefined = deepLink;
    mockUseLocalSearchParams.mockImplementation(() => ({
      demoDeepLink: currentDemoDeepLink,
    }));

    const screen = await render(<DemoShell />);

    // [라이브러리] 첫 `waitFor`는 Cold 입력의 다음 UI frame에서 param 교체가 예약대로 실행될 때까지 기다립니다.
    await waitFor(() => {
      expect(mockCurrentRouteReplaceParams).toHaveBeenCalledTimes(1);
    });

    // current route가 `replaceParams({})`를 반영한 다음 render를 query가 없는 snapshot으로 재현합니다.
    currentDemoDeepLink = undefined;
    await screen.rerender(<DemoShell />);

    // Android Warm link listener가 이전과 같은 URL을 다시 index query에 넣는 다음 render를 재현합니다.
    currentDemoDeepLink = deepLink;
    await screen.rerender(<DemoShell />);

    expect(mockSetSelectedTabIndex).toHaveBeenCalledTimes(2);
    expect(mockSetSelectedTabIndex).toHaveBeenNthCalledWith(1, 1);
    expect(mockSetSelectedTabIndex).toHaveBeenNthCalledWith(2, 1);
    expect(mockWebTabLoadUrl).toHaveBeenCalledTimes(2);
    expect(mockWebTabLoadUrl).toHaveBeenNthCalledWith(1, "https://m.nate.com/");
    expect(mockWebTabLoadUrl).toHaveBeenNthCalledWith(2, "https://m.nate.com/");
    // [라이브러리] `waitFor`는 두 번째 입력의 다음 UI frame이 실행될 때까지 param 정리 호출을 반복 확인합니다.
    await waitFor(() => {
      expect(mockCurrentRouteReplaceParams).toHaveBeenCalledTimes(2);
    });
  });
});

// =================================================================================================
