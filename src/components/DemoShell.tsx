// [파일 역할] 앱의 중심 화면입니다. 네 탭, popup, bridge, deep link, 기기 뒤로 가기, 하단 탭 막대, 인터넷 연결 안내를 서로 이어 줍니다.
// [FLOW-02] 저장해 둔 탭 번호를 읽고 네 화면을 모두 미리 만듭니다. 다른 탭을 누르면 화면만 바꾸고, 현재 탭을 다시 누르면 그 탭을 새로 고칩니다.
// [FLOW-08] 스크롤, bridge 요청, keyboard가 하단 탭 막대를 숨길 수 있습니다. 세 이유를 따로 기억하고, 모두 보여도 될 때만 animation으로 올립니다.
// [FLOW-09] 휴대폰의 인터넷 연결 상태는 공통 배너로 알립니다. 실제 WebView나 API 요청 실패와 다시 시도는 각 화면이 따로 관리합니다.
// [라이브러리] React Hook은 이 화면에서 쓸 값과 함수를 관리합니다.
// React Native API는 animation, keyboard, 앱 상태, Android 뒤로 가기 기능을 제공합니다.

// ========================================== 외부 의존성 ==========================================

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Animated,
  AppState,
  BackHandler,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
// [라이브러리] Expo Linking은 URL을 다른 앱으로 보냅니다. Network는 휴대폰 연결 상태를 알려 주고, Router는 route의 query 값을 읽고 지웁니다.
import * as Linking from "expo-linking";
import * as Network from "expo-network";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { dispatchBridgeMessage } from "@/src/bridge/dispatcher";
import type { BridgeResponse } from "@/src/bridge/types";
import {
  BOTTOM_TAB_BASE_HEIGHT,
  BottomTabBar,
} from "@/src/components/BottomTabBar";
import {
  NativeUsersScreen,
  type NativeUsersScreenHandle,
} from "@/src/components/NativeUsersScreen";
import { NetworkStatusBanner } from "@/src/components/NetworkStatusBanner";
import {
  PopupWebView,
  type PopupWebViewHandle,
} from "@/src/components/PopupWebView";
import { Snackbar } from "@/src/components/Snackbar";
import { WebTab, type WebTabHandle } from "@/src/components/WebTab";
import { TAB_DEFINITIONS } from "@/src/constants/tabs";
import { getOrCreateDeviceId } from "@/src/services/device-id";
import {
  clearApplicationBadge,
  configureNotificationHandler,
  showDemoNotification,
  subscribeToNotificationEvents,
} from "@/src/services/notification-service";
import { selectPhotoImages } from "@/src/services/photo-service";
import {
  classifyNavigationUrl,
  classifyPopupUrl,
  LOCAL_WEB_BASE_URL,
  normalizeHttpsUrl,
  parseDemoDeepLink,
  type DemoDeepLink,
} from "@/src/services/url-router";
import { useAppStore } from "@/src/store/app-store";
import {
  tabTagToIndex,
  type TabIndex,
  type TabTag,
} from "@/src/types/navigation";
import { isDoubleBackPress } from "@/src/utils/scroll-direction";
import { LOCAL_DEMO_HTML } from "@/src/web/local-html";

// =================================================================================================

// ======================================= 공통 helper 함수 ========================================

// [역할] `showLinkingError`는 OS가 외부 URL을 열지 못한 모든 경우에 같은 실패 Alert를 보여 줍니다.
// 다른 앱에서 URL을 열지 못한 모든 경우에 같은 안내를 보여 주는 함수입니다.
function showLinkingError(): void {
  Alert.alert("외부 앱 실행 실패", "요청한 링크를 열 수 없습니다.");
}

// [역할] `clearBadgeSafely`는 알림 badge 초기화를 시작하고 실패를 기록하되 다른 화면 동작은 계속하게 합니다.
function clearBadgeSafely(): void {
  // [문법] 앞의 `void`는 이곳에서 Promise 결과값을 돌려주지 않는다는 뜻입니다. 실패는 `.catch`에서 기록해 다른 앱 동작을 멈추지 않게 합니다.
  // [역할] 실패 처리 callback은 badge 초기화 오류를 console에 남기고 Promise 오류가 조용히 사라지지 않게 합니다.
  void clearApplicationBadge().catch((error) => {
    console.warn("앱 배지를 초기화하지 못했습니다.", error);
  });
}

// =================================================================================================

// ====================================== DemoShell component ======================================

// [역할] `DemoShell`은 네 탭과 popup, bridge, deep link, 알림, 뒤로 가기와 하단 탭 표시를 서로 연결합니다.
export function DemoShell() {

  // ==================================== runtime 입력과 state =====================================

  // ---------------------------------------- 외부 Hook 값 -----------------------------------------

  // [라이브러리] 이 Hook은 휴대폰 화면 아래의 안전 여백을 알려 줍니다. 값이 바뀌면 하단 탭 막대 높이와 각 화면의 아래 여백도 다시 계산합니다.
  // [역할] `useSafeAreaInsets`는 하단 탭 높이와 각 화면 아래 여백에 쓸 기기 안전 여백을 제공합니다.
  const insets = useSafeAreaInsets();
  // Router는 한 번 처리한 deep link query를 현재 route에서 지울 때 사용합니다. 같은 값이 다시 실행되는 일을 막습니다.
  // [역할] `useRouter`는 처리한 deep link query를 현재 route에서 지울 명령을 제공합니다.
  const router = useRouter();
  // [FLOW-09 / 1단계] expo-network Hook은 휴대폰 연결 상태가 바뀌면 새 값을 주고, 이 화면은 그 값으로 다시 그려집니다.
  // [라이브러리] 화면이 사라지면 연결 감시는 library가 정리합니다. 이 값은 인터넷 연결 여부일 뿐, 각 웹·API 요청의 성공을 뜻하지 않습니다.
  // [역할] `useNetworkState`는 휴대폰의 현재 연결 종류를 계속 알려 줘 공통 offline 안내에 사용하게 합니다.
  const networkState = Network.useNetworkState();
  // [FLOW-06 / 3단계] 앱을 처음 열었든 이미 실행 중이든, native-intent가 index query로 옮긴 deep link URL은 여기서 읽습니다.
  // [문법] 이 객체 type은 같은 query가 한 번 오면 string, 여러 번 오면 string[]일 수 있음을 나타냅니다.
  // [역할] `useLocalSearchParams`는 OS에서 들어와 index route에 저장된 deep link query를 읽습니다.
  const { demoDeepLink } = useLocalSearchParams<{
    demoDeepLink?: string | string[];
  }>();
  // [FLOW-02 / 1단계] 저장소 읽기가 끝난 뒤, 전에 선택해 둔 탭 번호를 현재 탭으로 사용합니다.
  // [라이브러리] Zustand에서 탭 번호와 탭 변경 함수를 따로 읽습니다. 필요한 값이 바뀔 때만 이 화면을 다시 그리게 합니다.
  // [역할] 첫 Zustand selector callback은 현재 선택된 탭 번호만 store에서 꺼냅니다.
  const selectedTabIndex = useAppStore((state) => state.selectedTabIndex);
  // [역할] 둘째 Zustand selector callback은 선택 탭을 바꿀 함수만 store에서 꺼냅니다.
  const setSelectedTabIndex = useAppStore(
    (state) => state.setSelectedTabIndex,
  );

  // -----------------------------------------------------------------------------------------------

  // ------------------------------------------ 명령 ref -------------------------------------------

  // ref를 사용해 이미 만들어진 자식 화면의 새로 고침과 방문 기록 명령을 부릅니다. ref 값이 바뀌어도 화면은 다시 그리지 않습니다.
  // 배열 위치가 TabIndex와 같도록 맞췄습니다. 그래서 탭 번호로 세 WebTab의 ref를 바로 찾을 수 있습니다.
  // [역할] `webTabRefs`는 세 WebTab의 load·reload·history 명령을 탭 번호와 같은 배열 위치에 보관합니다.
  const webTabRefs = useRef<(WebTabHandle | null)[]>([]);
  // 네이티브 탭과 popup에서도 각 component가 밖에 열어 둔 명령만 ref로 받습니다.
  // [역할] `nativeUsersRef`는 사용자 탭의 다시 요청 명령을 보관합니다.
  const nativeUsersRef = useRef<NativeUsersScreenHandle>(null);
  // [역할] `popupRef`는 Android 뒤로 가기가 먼저 확인할 popup 방문 기록 명령을 보관합니다.
  const popupRef = useRef<PopupWebViewHandle>(null);
  // Android 뒤로 가기 버튼을 마지막으로 누른 시각입니다. 화면에 보여 줄 값이 아니므로 ref에 둡니다.
  // [역할] `lastBackPressRef`는 Android에서 직전에 뒤로 가기를 누른 시각을 기억합니다.
  const lastBackPressRef = useRef(0);
  // [라이브러리] `Animated.Value`는 `useRef(...).current`로 한 번만 만듭니다. 화면을 다시 그려도 같은 animation 값을 이어서 씁니다.
  // [역할] `bottomBarTranslateY`는 하단 탭 막대의 현재 세로 animation 위치를 component 수명 동안 보관합니다.
  const bottomBarTranslateY = useRef(new Animated.Value(0)).current;

  // -----------------------------------------------------------------------------------------------

  // ------------------------------------- 화면 state와 계산값 -------------------------------------

  // bridge 요청, 스크롤, keyboard는 각각 하단 탭 막대를 숨길 수 있으므로 state를 따로 둡니다. 한 이유가 다른 이유의 값을 덮어쓰지 않습니다.
  // 이 state가 바뀌면 막대의 위치와 터치 가능 여부를 다시 그립니다.
  // [역할] `bridgeBottomBarVisible` state는 WebView bridge가 요청한 하단 탭 표시 여부를 보관합니다.
  const [bridgeBottomBarVisible, setBridgeBottomBarVisible] = useState(true);
  // [역할] `scrollBottomBarVisible` state는 현재 화면 스크롤과 popup 상태가 허용한 하단 탭 표시 여부를 보관합니다.
  const [scrollBottomBarVisible, setScrollBottomBarVisible] = useState(true);
  // [역할] `keyboardVisible` state는 keyboard가 열려 하단 탭을 잠시 숨겨야 하는지 보관합니다.
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // popupUrl이 null이면 popup을 닫고, snackbarMessage가 null이면 iOS Snackbar를 보여 주지 않습니다.
  // 두 화면은 서로 따로 열리고 닫힙니다.
  // [역할] `popupUrl` state는 popup을 닫을 `null` 또는 현재 popup에서 열 URL을 보관합니다.
  const [popupUrl, setPopupUrl] = useState<string | null>(null);
  // [역할] `snackbarMessage` state는 iOS Snackbar에 보여 줄 bridge 안내 또는 숨김 상태의 `null`을 보관합니다.
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  // [FLOW-08 / 3단계] 스크롤과 bridge가 표시를 허용하고 keyboard도 닫혀 있을 때만 하단 탭 막대를 보여 주고 터치를 받습니다.
  // [문법] `&&`와 `!`로 기존 state 세 개를 합쳐 계산합니다. 같은 뜻의 state를 하나 더 만들지 않습니다.
  // [역할] `bottomBarVisible`은 세 숨김 이유를 합쳐 지금 하단 탭을 보여 줄 수 있는지 계산합니다.
  const bottomBarVisible =
    bridgeBottomBarVisible && scrollBottomBarVisible && !keyboardVisible;
  // 탭 막대 자체 높이에 휴대폰 아래 안전 여백을 더합니다. 이 값은 막대를 숨길 이동 거리이면서 자식 화면이 비워 둘 아래 여백입니다.
  // [역할] `bottomBarHiddenOffset`은 하단 탭 전체를 숨길 거리와 자식 화면이 비워 둘 높이를 계산합니다.
  const bottomBarHiddenOffset = BOTTOM_TAB_BASE_HEIGHT + insets.bottom;
  // [FLOW-09 / 2단계] 연결 종류가 분명히 NONE일 때만 offline으로 봅니다. 아직 확인 중인 UNKNOWN은 끊긴 상태로 잘못 표시하지 않습니다.
  // [역할] `networkOffline`은 확인된 연결 종류가 `NONE`인지 공통 배너용 boolean으로 바꿉니다.
  const networkOffline =
    networkState.type === Network.NetworkStateType.NONE;

  // -----------------------------------------------------------------------------------------------

  // ===============================================================================================

  // ====================================== lifecycle effect =======================================

  // -------------------------------------- 하단 탭 animation --------------------------------------

  // [라이브러리] `useEffect`는 표시 여부나 높이가 바뀌면 하단 탭 막대 animation을 시작합니다.
  // [역할] 이 `useEffect` callback은 하단 탭 표시 여부와 높이에 맞는 새 animation을 시작합니다.
  useEffect(() => {
    // [FLOW-08 / 4단계] 숨길 때는 안전 여백까지 포함한 막대 전체 높이만큼 아래로 옮깁니다. 보일 때는 원래 위치인 0으로 돌아옵니다.
    // `Animated.timing(...).start()`는 현재 위치에서 새 위치까지 180ms 동안 움직입니다.
    Animated.timing(bottomBarTranslateY, {
      toValue: bottomBarVisible ? 0 : bottomBarHiddenOffset,
      duration: 180,
      useNativeDriver: true,
    }).start();
    // [문법] dependency 배열의 세 값 가운데 하나가 바뀌면 같은 `Animated.Value`에 새 위치를 적용합니다.
  }, [
    bottomBarHiddenOffset,
    bottomBarTranslateY,
    bottomBarVisible,
  ]);

  // -----------------------------------------------------------------------------------------------

  // -------------------------------------- keyboard listener --------------------------------------

  // DemoShell이 만들어질 때 keyboard event를 듣기 시작하고, 사라질 때 듣기를 멈춥니다.
  // [역할] 이 `useEffect` callback은 운영체제에 맞는 keyboard 열기·닫기 listener 두 개를 등록합니다.
  useEffect(() => {
    // iOS는 keyboard가 움직이기 전 event를, Android는 실제로 보인 뒤 event를 사용합니다. 각 운영체제가 안정적으로 주는 시점에 맞춘 선택입니다.
    // [문법] ternary는 `Platform.OS`에 따라 사용할 event 이름 하나를 고릅니다.
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    // [라이브러리] `Keyboard.addListener`가 돌려준 값의 `remove`를 나중에 불러야 event 듣기가 끝납니다.
    const showSubscription = Keyboard.addListener(showEvent, () => {
      // [역할] keyboard 열기 listener callback은 하단 탭을 숨기도록 `keyboardVisible`을 true로 바꿉니다.
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      // [역할] keyboard 닫기 listener callback은 하단 탭을 다시 판단하도록 `keyboardVisible`을 false로 바꿉니다.
      setKeyboardVisible(false);
    });

    // [역할] 정리 callback은 DemoShell이 사라지거나 listener를 다시 붙이기 전에 keyboard listener 두 개를 제거합니다.
    return () => {
      // DemoShell이 사라지면 keyboard 열기와 닫기 event를 모두 더는 듣지 않게 합니다.
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // -----------------------------------------------------------------------------------------------

  // ---------------------------------- 알림과 AppState listener -----------------------------------

  // 알림 설정, 알림 event 두 개, 앱 상태 event, badge 지우기를 한 `useEffect`에서 시작하고 함께 정리합니다.
  // [역할] 이 `useEffect` callback은 알림 설정·listener·badge 초기화와 AppState listener를 함께 시작합니다.
  useEffect(() => {
    // 알림을 화면에 표시하는 공통 규칙은 service가 앱 실행 중 한 번만 설정합니다. 알림 event 듣기는 DemoShell이 보이는 동안만 유지합니다.
    configureNotificationHandler();
    const unsubscribeNotifications = subscribeToNotificationEvents();
    clearBadgeSafely();

    // [라이브러리] AppState가 active가 되면 앱이 배경에서 다시 앞에 왔다는 뜻입니다. 이때 남아 있는 앱 badge를 지웁니다.
    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState) => {
        // [역할] AppState listener callback은 앱이 다시 active가 되는 순간 남은 badge를 안전하게 지웁니다.
        if (nextState === "active") {
          clearBadgeSafely();
        }
      },
    );

    // [역할] 정리 callback은 DemoShell이 사라질 때 알림 listener와 AppState listener를 모두 제거합니다.
    return () => {
      // DemoShell이 사라지면 알림 event 두 개와 AppState event를 모두 더는 듣지 않게 합니다.
      unsubscribeNotifications();
      appStateSubscription.remove();
    };
  }, []);

  // -----------------------------------------------------------------------------------------------

  // ===============================================================================================

  // ================================= deep link와 URL navigation ==================================

  // [역할] `applyDeepLink`는 검사된 탭을 선택하고 선택 URL이 있으면 이미 만든 해당 화면에서 엽니다.
  // [문법] parameter의 `{ tab, url }`은 검사를 마친 deep link 객체에서 두 값을 바로 꺼내는 구조 분해입니다. url은 없을 수도 있습니다.
  const applyDeepLink = useCallback(
    ({ tabIndex, targetUrl }: DemoDeepLink) => {
      // [FLOW-06 / 5단계] 검사한 탭으로 이동합니다. URL도 있으면 이미 만들어 둔 그 탭의 WebView에서 주소를 엽니다.
      setSelectedTabIndex(tabIndex);
      setScrollBottomBarVisible(true);

      if (targetUrl && tabIndex < 3) {
        // [문법] `?.` optional chaining은 WebTab의 ref가 아직 준비되지 않았으면 `loadUrl`을 부르지 않고 넘어갑니다.
        webTabRefs.current[tabIndex]?.loadUrl(targetUrl);
      } else if (tabIndex === 3) {
        // 네이티브 탭을 처음 열면 active가 true가 되어 첫 Query 요청이 시작됩니다. 전에 열어 본 탭이면 ref 명령으로 사용자도 다시 요청합니다.
        void nativeUsersRef.current?.refetchIfActivated(true);
      }
    },
    // [문법] 이 `useCallback`은 Zustand의 `setActiveTab`을 사용합니다. 자식 ref의 최신 값은 실행할 때 `.current`에서 읽습니다.
    [setSelectedTabIndex],
  );

  // [역할] `handleDeepLinkUrl`은 URL을 deep link로 검사하고 성공하면 적용하며 실패하면 선택적으로 안내합니다.
  const handleDeepLinkUrl = useCallback(
    (url: string, showInvalidAlert = true): boolean => {
      // [문법] showInvalidAlert의 default 값은 true입니다. 따로 값을 주지 않으면 잘못된 deep link 안내를 보여 줍니다.
      const deepLink = parseDemoDeepLink(url);
      if (!deepLink) {
        // parser가 null을 돌려주면 잘못된 deep link입니다. 필요하면 Alert를 띄우고 false를 돌려 WebView 이동도 멈춥니다.
        if (showInvalidAlert) {
          Alert.alert(
            "잘못된 링크",
            "탭 번호 또는 URL 형식을 확인해 주세요.",
          );
        }
        return false;
      }

      applyDeepLink(deepLink);
      // true는 deep link 검사와 실제 탭 이동을 모두 마쳤다는 뜻입니다.
      return true;
    },
    [applyDeepLink],
  );

  // 앱을 처음 열었을 때와 이미 실행 중일 때 들어온 route query를 한 번 처리하는 effect입니다. 처리한 값은 바로 지웁니다.
  // [역할] 이 `useEffect` callback은 route query의 deep link를 한 번 적용하고 같은 값이 반복되지 않도록 지웁니다.
  useEffect(() => {
    // [문법] 같은 query가 여러 개라 배열이면 첫 값만 사용합니다. string 하나이면 그 값을 그대로 사용합니다.
    const incomingUrl = Array.isArray(demoDeepLink)
      ? demoDeepLink[0]
      : demoDeepLink;

    if (!incomingUrl) {
      // query가 없거나 빈 글이면 탭을 바꾸지 않고 끝냅니다.
      return;
    }

    handleDeepLinkUrl(incomingUrl);
    // 같은 query가 다음 화면 그리기 때 또 실행되지 않도록 처리한 직후 route param을 지웁니다.
    router.setParams({ demoDeepLink: undefined });
    // [문법] dependency 배열의 함수, router, query 가운데 하나가 바뀔 때만 effect가 다시 확인합니다.
  }, [demoDeepLink, handleDeepLinkUrl, router]);

  // [라이브러리] 여러 URL 처리 함수가 같은 Expo Linking 함수를 쓰도록 `useCallback`으로 한 번 감쌉니다.
  // [역할] `openExternalUrl`은 앱 밖 URL을 OS에 보내고 실패하면 공통 외부 앱 Alert를 보여 줍니다.
  const openExternalUrl = useCallback((url: string) => {
    // [FLOW-06 / 7단계] 이 앱이 처리하지 않을 scheme은 휴대폰의 다른 앱으로 보냅니다. 열 앱이 없거나 실패하면 공통 Alert를 보여 줍니다.
    void Linking.openURL(url).catch(showLinkingError);
  }, []);

  // [역할] `handleNavigationRequest`는 일반 WebView URL 분류 결과를 실제 허용·차단·탭 이동·외부 앱 동작으로 실행합니다.
  const handleNavigationRequest = useCallback(
    (url: string): boolean => {
      // [FLOW-03 / 4단계] URL 검사 결과에 따라 WebView에서 열기, 차단 안내, 앱 탭 이동, 다른 앱에서 열기 가운데 하나를 실행합니다.
      const decision = classifyNavigationUrl(url);

      // [문법] `switch (decision.type)`은 URL 검사 결과에 맞는 case 하나를 고릅니다.
      // 마지막에는 WebView가 계속 열어도 되는지 true 또는 false로 돌려줍니다.
      switch (decision.type) {
        case "allow":
          // true를 돌려주는 이 경우에만 WebView가 해당 URL을 계속 엽니다.
          return true;
        case "ignore":
          return false;
        case "block-http":
          Alert.alert(
            "안전하지 않은 연결",
            "이 데모 앱은 HTTPS 주소만 WebView에서 엽니다.",
          );
          return false;
        case "deep-link":
          // URL 검사기가 이미 만든 deep link 값을 그대로 탭 이동에 씁니다. 같은 문자열을 다시 검사하지 않습니다.
          applyDeepLink(decision.value);
          return false;
        case "external":
          openExternalUrl(decision.url);
          return false;
      }
    },
    [applyDeepLink, openExternalUrl],
  );

  // [역할] `handleOpenWindow`는 새 창 URL과 source 탭을 받아 원래 탭·외부 앱·popup 중 알맞은 곳에서 엽니다.
  const handleOpenWindow = useCallback(
    (sourceTabIndex: TabIndex, url: string) => {
      // [FLOW-04 / 1단계] WebView가 `window.open`으로 보낸 URL과 현재 탭 번호를 받습니다. URL을 어디에서 열지 여기서 정합니다.
      const decision = classifyPopupUrl(url);

      // [FLOW-04 / 3단계] 현재 웹사이트와 같은 주소는 원래 탭에서 엽니다. 외부 앱 주소는 휴대폰에 맡기고, 나머지 HTTPS 주소는 popup으로 엽니다.
      if (decision.type === "parent") {
        // 원래 탭의 `loadUrl`을 불러 같은 WebView에서 엽니다. 따라서 그 탭의 방문 기록이 이어집니다.
        webTabRefs.current[sourceTabIndex]?.loadUrl(decision.url);
        return;
      }

      if (decision.type === "external") {
        openExternalUrl(decision.url);
        return;
      }

      setPopupUrl(decision.url);
      // popup이 열린 동안 뒤의 하단 탭 막대를 숨깁니다. 보이지 않는 막대가 터치를 받지 않게 합니다.
      setScrollBottomBarVisible(false);
    },
    [openExternalUrl],
  );

  // ===============================================================================================

  // ================================== popup과 공통 UI callback ===================================

  // popup을 닫을 때 URL을 null로 바꾸고 하단 탭 막대도 다시 보이게 하는 공통 함수입니다.
  // [역할] `closePopup`은 popup URL을 비우고 popup 때문에 숨겼던 하단 탭을 다시 보이게 합니다.
  const closePopup = useCallback(() => {
    setPopupUrl(null);
    setScrollBottomBarVisible(true);
  }, []);

  // bridge의 같은 toast 요청을 Android에서는 `ToastAndroid`, iOS에서는 React `Snackbar`로 보여 줍니다.
  // [역할] `showToastMessage`는 같은 bridge 문장을 Android Toast 또는 iOS Snackbar로 나누어 보여 줍니다.
  const showToastMessage = useCallback((message: string) => {
    if (Platform.OS === "android") {
      // [라이브러리] `ToastAndroid`는 Android가 제공하는 짧은 안내입니다. 함수를 부르면 즉시 휴대폰 화면에 나타납니다.
      ToastAndroid.show(message, ToastAndroid.LONG);
      return;
    }

    // iOS에서는 message state를 바꿔 Snackbar를 화면에 만듭니다. Snackbar가 3초 뒤 스스로 닫힐 timer를 관리합니다.
    setSnackbarMessage(message);
  }, []);

  // [역할] `dismissSnackbar`는 iOS Snackbar message를 비워 화면과 자동 닫기 timer를 함께 없앱니다.
  const dismissSnackbar = useCallback(() => {
    // message를 null로 바꾸면 Snackbar가 화면에서 사라지고, 안에서 사용하던 timer도 정리됩니다.
    setSnackbarMessage(null);
  }, []);

  // [역할] `setBottomNaviVisible`은 bridge 표시 요청을 저장하고 show 요청이면 이전 scroll 숨김도 함께 풉니다.
  const setBottomNaviVisible = useCallback((visible: boolean) => {
    // [FLOW-08 / 관련 코드] bridge가 하단 탭 막대를 보이라고 하면 이전 스크롤 숨김도 풉니다. 다만 keyboard가 열려 있으면 계속 숨깁니다.
    setBridgeBottomBarVisible(visible);
    if (visible) {
      // bridge의 show 요청은 사용자의 이전 스크롤 때문에 숨겨진 상태도 함께 풉니다.
      setScrollBottomBarVisible(true);
    }
  }, []);

  // ===============================================================================================

  // ========================================= bridge 연결 =========================================

  // [역할] `handleBridgeMessage`는 source 탭 정보와 앱 기능들을 dispatcher에 연결하고 완료 응답 Promise를 돌려줍니다.
  const handleBridgeMessage = useCallback(
    (sourceTabIndex: TabIndex, message: string): Promise<BridgeResponse> =>
      // [FLOW-05 / 3단계] dispatcher가 실제 휴대폰 기능을 부를 수 있도록 사진, 알림, 기기 ID, 탭 이동 함수를 한 객체로 건넵니다.
      // [문법] 중괄호 없는 arrow function은 `dispatchBridgeMessage(...)`의 Promise를 바로 돌려줍니다.
      // WebTab의 `.then`은 이 작업이 끝날 때까지 기다립니다.
      dispatchBridgeMessage(message, {
        // 사진과 알림 service 함수는 그대로 건넵니다. React 화면 값을 바꿔야 하는 요청만 아래에서 짧은 연결 함수를 만듭니다.
        getDeviceUUID: getOrCreateDeviceId,
        showToastMessage,
        showNotiMessage: showDemoNotification,
        // [역할] `reloadOtherTabs` callback은 요청한 WebView를 제외한 탭들을 새로 고치고 방문한 native 탭도 다시 요청합니다.
        reloadOtherTabs: async () => {
          // 요청을 보낸 탭은 그대로 둡니다. 다른 WebView 두 개는 첫 화면으로 돌리고, 전에 연 적 있는 네이티브 탭은 사용자를 다시 요청합니다.
          // [문법] `for` loop는 세 WebView 탭 번호를 차례로 돕니다. message를 보낸 탭 번호만 `continue`로 건너뜁니다.
          for (let index = 0; index < 3; index += 1) {
            if (index !== sourceTabIndex) {
              webTabRefs.current[index]?.reloadInitial();
            }
          }
          // 네이티브 탭 ref가 아직 없으면 이 줄은 바로 끝납니다. 있으면 사용자 다시 요청이 끝날 때까지 `await`로 기다립니다.
          await nativeUsersRef.current?.refetchIfActivated(true);
        },
        // [역할] `goToAnotherTab` callback은 bridge의 탭 tag와 URL을 다시 확인한 뒤 화면 이동과 URL load를 실행합니다.
        goToAnotherTab: async (targetTab: TabTag, targetUrl: string) => {
          // schema 검사를 통과한 tag라도 실제 탭 번호로 바뀌는지 다시 확인합니다. URL도 HTTPS인지 확인한 뒤에만 화면을 바꿉니다.
          const targetIndex = tabTagToIndex(targetTab);
          const normalizedUrl = normalizeHttpsUrl(targetUrl);

          if (targetIndex === null || normalizedUrl === null) {
            // 이 마지막 확인이 실패하면 Error를 던집니다. dispatcher가 요청의 uuid와 action을 넣은 공통 실패 응답으로 바꿉니다.
            throw new Error("이동할 탭 또는 URL이 올바르지 않습니다.");
          }

          setSelectedTabIndex(targetIndex);
          setScrollBottomBarVisible(true);

          if (targetIndex < 3) {
            // Web 탭이면 기존 WebView에서 URL을 열어 방문 기록을 잇습니다. 네이티브 탭이면 방문 여부를 확인한 뒤 사용자를 다시 요청합니다.
            webTabRefs.current[targetIndex]?.loadUrl(normalizedUrl);
          } else {
            await nativeUsersRef.current?.refetchIfActivated(true);
          }
        },
        setBottomNaviVisible,
        getPhotoImages: selectPhotoImages,
      }),
    // [문법] dependency 배열에는 이 함수 안에서 직접 쓰는 callback과 Zustand 함수를 넣습니다. 값이 바뀌면 연결 함수도 새로 만듭니다.
    [setBottomNaviVisible, setSelectedTabIndex, showToastMessage],
  );

  // ===============================================================================================

  // ===================================== tab과 Android back ======================================

  // [역할] `handleTabSelect`는 다른 탭 선택과 현재 탭 재선택을 구분해 탭 변경 또는 새로 고침을 실행합니다.
  const handleTabSelect = useCallback(
    (index: TabIndex) => {
      // 탭을 누르면 스크롤 때문에 숨었던 하단 탭 막대를 먼저 다시 보이게 합니다.
      setScrollBottomBarVisible(true);

      if (index === selectedTabIndex) {
        // [FLOW-02 / 5단계] 현재 탭을 다시 누르면 사용자가 새로 고치기를 원한 것으로 봅니다. WebView는 첫 화면으로, 네이티브 탭은 사용자 재요청으로 이어집니다.
        if (index < 3) {
          // 탭 번호 0부터 2까지는 WebView이고, 3은 사용자 목록입니다. 그래서 서로 다른 ref 명령을 부릅니다.
          webTabRefs.current[index]?.reloadInitial();
        } else {
          void nativeUsersRef.current?.refetch(true);
        }
        return;
      }

      // [FLOW-02 / 4단계] 다른 탭을 누르면 선택한 번호만 Zustand 저장소에 기록합니다. 기존 탭 화면은 없애지 않고 숨기기만 합니다.
      setSelectedTabIndex(index);
    },
    [selectedTabIndex, setSelectedTabIndex],
  );

  // Android에서만 기기 뒤로 가기 버튼을 듣습니다. popup이나 현재 탭이 바뀌면 새 값을 읽는 함수로 다시 연결합니다.
  // [역할] 이 `useEffect` callback은 Android에서 popup·WebView·앱 종료 순서의 hardware back listener를 등록합니다.
  useEffect(() => {
    if (Platform.OS !== "android") {
      // iOS에는 이 Android용 처리를 등록하지 않습니다. 화면의 toolbar와 iOS 기본 뒤로 가기 동작을 사용합니다.
      return;
    }

    // [라이브러리] Android back callback이 true를 돌려주면 앱이 버튼을 처리했다는 뜻이라 운영체제의 기본 동작은 실행되지 않습니다.
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        // [역할] hardware back callback은 popup history, 현재 WebView history, 두 번 누른 앱 종료를 차례로 처리합니다.
        // Android 뒤로 가기는 popup 안에서 뒤로 가기 또는 닫기, 현재 WebView 뒤로 가기, 2초 안에 한 번 더 눌러 앱 종료 순서로 처리합니다.
        if (popupUrl !== null) {
          // popup 안에서 뒤로 갈 기록이 없을 때만 popup을 닫습니다.
          if (!popupRef.current?.goBack()) {
            closePopup();
          }
          return true;
        }

        if (
          selectedTabIndex < 3 &&
          webTabRefs.current[selectedTabIndex]?.goBack()
        ) {
          // 현재 WebView에서 한 페이지 뒤로 갔다면 여기서 끝냅니다. 앱 종료 안내로 넘어가지 않습니다.
          return true;
        }

        // [라이브러리] `Date.now()`는 현재 시각을 millisecond 숫자로 줍니다. 직전에 누른 시각과 비교해 2초 안에 다시 눌렀는지 확인합니다.
        const currentTime = Date.now();
        if (isDoubleBackPress(lastBackPressRef.current, currentTime)) {
          // 2초 안에 누른 두 번째 뒤로 가기만 Android의 앱 종료 함수를 부릅니다.
          BackHandler.exitApp();
          return true;
        }

        // 첫 번째라면 누른 시각을 저장하고, 한 번 더 누르면 종료된다는 Toast를 보여 줍니다.
        lastBackPressRef.current = currentTime;
        ToastAndroid.show(
          "한 번 더 누르면 앱이 종료됩니다.",
          ToastAndroid.LONG,
        );
        return true;
      },
    );

    // [역할] 정리 callback은 값이 바뀌어 새 listener를 붙이거나 화면이 사라질 때 이전 Android back listener를 제거합니다.
    return () => {
      // 현재 값이 바뀌어 새 listener를 붙이기 전이나 DemoShell이 사라질 때, 이전 back listener를 제거합니다.
      subscription.remove();
    };
  }, [closePopup, popupUrl, selectedTabIndex]);

  // ===============================================================================================

  // ========================================== 화면 출력 ==========================================

  // [역할] `activeTab`은 현재 탭 번호와 같은 정의를 찾아 iOS toolbar의 제목과 icon 기준을 제공합니다.
  // 저장된 탭 번호는 이미 올바른 TabIndex인지 검사했습니다. 같은 순서의 배열에서 iOS toolbar 제목을 바로 찾습니다.
  const activeTab = TAB_DEFINITIONS[selectedTabIndex];

  // [역할] `DemoShell`의 return은 네 탭, 공통 network 안내, 하단 탭, Snackbar와 popup을 한 화면에 배치합니다.
  // 네 탭 화면, 하단 탭 막대, iOS Snackbar, popup을 함께 만듭니다. state와 active props로 보이거나 숨기는 시점을 정합니다.
  return (
    <View style={styles.container}>
      <NetworkStatusBanner visible={networkOffline} />

      {Platform.OS === "ios" && selectedTabIndex < 3 ? (
        // iOS의 Web 탭에서만 위쪽 뒤로 가기와 앞으로 가기 버튼을 보여 줍니다. 이동할 기록이 없으면 Alert로 알려 줍니다.
        <View style={styles.navigationToolbar}>
          <Pressable
            accessibilityLabel="웹 페이지 뒤로가기"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              // [역할] iOS 뒤로 가기 callback은 현재 WebView history를 이동하고 기록이 없으면 안내를 보여 줍니다.
              // `goBack()`이 false이면 WebView 안에 뒤로 갈 방문 기록이 없다는 뜻입니다.
              if (!webTabRefs.current[selectedTabIndex]?.goBack()) {
                Alert.alert("알림", "이전 페이지가 없습니다.");
              }
            }}
            style={styles.navigationButton}
          >
            <Ionicons color="#0F172A" name="chevron-back" size={24} />
          </Pressable>
          <Text numberOfLines={1} style={styles.navigationTitle}>
            {activeTab.label}
          </Text>
          <Pressable
            accessibilityLabel="웹 페이지 앞으로가기"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              // [역할] iOS 앞으로 가기 callback은 현재 WebView history를 이동하고 기록이 없으면 안내를 보여 줍니다.
              // `goForward()`도 바로 true 또는 false를 돌려주는 같은 규칙을 사용합니다.
              if (!webTabRefs.current[selectedTabIndex]?.goForward()) {
                Alert.alert("알림", "다음 페이지가 없습니다.");
              }
            }}
            style={styles.navigationButton}
          >
            <Ionicons color="#0F172A" name="chevron-forward" size={24} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.content}>
        {/* [역할] `map` callback은 앞의 세 탭 정의를 항상 mount된 `WebTab` 세 개로 바꿉니다.
            [FLOW-02 / 2단계] [문법]
            `slice(...).map(...)`은 세 WebTab을 차례로 모두 만듭니다.
            바로 아래 NativeUsersScreen도 조건문 밖에서 항상 만듭니다.
            탭을 바꿀 때 네 화면을 없애지 않고, active props로 보임과 터치만 바꿉니다. */}
        {TAB_DEFINITIONS.slice(0, 3).map((tab) => (
          <WebTab
            active={selectedTabIndex === tab.index}
            bottomContentInset={bottomBarHiddenOffset}
            initialSource={
              // 첫 탭에는 앱 안의 HTML을 넣고, 나머지 탭에는 인터넷 URL을 넣습니다. WebView source가 허용하는 두 모양 가운데 하나입니다.
              tab.index === 0
                ? { html: LOCAL_DEMO_HTML, baseUrl: LOCAL_WEB_BASE_URL }
                : { uri: tab.initialUrl as string }
            }
            key={tab.tag}
            onBridgeMessage={(message) =>
              // [역할] `onBridgeMessage` callback은 message와 source 탭 번호를 bridge 연결 함수에 함께 전달합니다.
              // 어느 탭에서 message가 왔는지 알 수 있도록 현재 index도 함께 전달합니다.
              handleBridgeMessage(tab.index, message)
            }
            onNavigationRequest={handleNavigationRequest}
            onOpenWindow={(url) => {
              // [역할] `onOpenWindow` callback은 새 창 URL과 이 WebTab의 번호를 popup 분류 함수에 전달합니다.
              handleOpenWindow(tab.index, url);
            }}
            onScrollDirection={(direction) => {
              // [역할] WebTab scroll callback은 현재 방향을 하단 탭의 표시 여부 boolean으로 바꿉니다.
              // [FLOW-08 / 관련 코드] 지금 보이는 탭이 알려 준 스크롤 방향만 하단 탭 막대의 표시 여부로 바꿉니다.
              setScrollBottomBarVisible(direction === "up");
            }}
            ref={(value) => {
              // [역할] WebTab ref callback은 만들어지거나 사라진 탭의 공개 명령을 같은 index 위치에 저장합니다.
              // WebTab이 만들어지면 해당 index에 ref 명령을 저장하고, 사라지면 null을 저장합니다.
              webTabRefs.current[tab.index] = value;
            }}
            tag={tab.tag}
          />
        ))}

        <NativeUsersScreen
          active={selectedTabIndex === 3}
          bottomContentInset={bottomBarHiddenOffset}
          onScrollDirection={(direction) => {
            // [역할] native 목록 scroll callback은 현재 방향을 하단 탭의 표시 여부 boolean으로 바꿉니다.
            setScrollBottomBarVisible(direction === "up");
          }}
          ref={nativeUsersRef}
        />
      </View>

      {/* [라이브러리]
          `Animated.View`를 투명하게만 만드는 대신 화면 아래로 옮깁니다.
          숨긴 동안에는 pointerEvents도 막아 보이지 않는 막대가 터치를 받지 않게 합니다. */}
      <Animated.View
        pointerEvents={bottomBarVisible ? "auto" : "none"}
        style={[
          styles.bottomBar,
          { transform: [{ translateY: bottomBarTranslateY }] },
        ]}
      >
        <BottomTabBar
          onSelect={handleTabSelect}
          selectedIndex={selectedTabIndex}
        />
      </Animated.View>

      {Platform.OS === "ios" ? (
        // Android 안내는 `ToastAndroid`가 맡으므로 React Snackbar는 iOS에서만 만듭니다.
        <Snackbar
          message={snackbarMessage}
          onDismiss={dismissSnackbar}
        />
      ) : null}

      <PopupWebView
        classifyNavigation={classifyNavigationUrl}
        networkOffline={networkOffline}
        onClose={closePopup}
        onDeepLink={(url) => {
          // [역할] popup deep-link callback은 앱 탭 이동이 성공했을 때만 현재 popup을 닫습니다.
          // popup에서 받은 앱 deep link를 실제로 처리했을 때만 현재 popup을 닫습니다.
          if (handleDeepLinkUrl(url)) {
            closePopup();
          }
        }}
        ref={popupRef}
        url={popupUrl}
      />
    </View>
  );

  // ===============================================================================================

}

// =================================================================================================

// ========================================== 화면 style ===========================================

// 아래 style은 전체 화면, iOS toolbar, 하단 탭 막대의 위치와 모양만 정합니다.
// 탭 화면과 Query 값, WebView 방문 기록은 위 state와 ref가 관리합니다.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  navigationToolbar: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  navigationButton: {
    width: 52,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  navigationTitle: {
    flex: 1,
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  bottomBar: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 2,
  },
});

// =================================================================================================
