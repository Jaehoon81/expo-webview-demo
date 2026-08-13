// [파일 역할] 네 tab instance와 popup, bridge, deep link, platform navigation, 하단 바·network 상태를 연결하는 app orchestration shell입니다.
// [FLOW-02] 탭 흐름은 영속 index를 읽고 네 화면을 모두 mount한 뒤 선택 전환 또는 현재 탭 재선택 reload로 이어집니다.
// [FLOW-08] 하단 바 흐름은 scroll·bridge·keyboard 신호를 독립 보관하고 모두 표시를 허용할 때만 animation으로 보여줍니다.
// [FLOW-09] network 흐름은 OS 연결 상태를 전역 배너로 알리되 WebView와 API의 실패·수동 retry 상태는 각 component가 소유합니다.
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

function showLinkingError(): void {
  Alert.alert("외부 앱 실행 실패", "요청한 링크를 열 수 없습니다.");
}

function clearBadgeSafely(): void {
  void clearApplicationBadge().catch((error) => {
    console.warn("앱 배지를 초기화하지 못했습니다.", error);
  });
}

export function DemoShell() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // [FLOW-09 / 1단계] expo-network Hook이 OS network state 변경을 구독해 shell을 다시 render합니다.
  const networkState = Network.useNetworkState();
  // [FLOW-06 / 3단계] native-intent rewrite가 index query로 옮긴 canonical URL을 cold/warm 진입 모두 여기서 읽습니다.
  const { demoDeepLink } = useLocalSearchParams<{
    demoDeepLink?: string | string[];
  }>();
  // [FLOW-02 / 1단계] hydration이 끝난 persisted index를 선택 상태의 기준으로 사용합니다.
  const selectedTabIndex = useAppStore((state) => state.selectedTabIndex);
  const setSelectedTabIndex = useAppStore(
    (state) => state.setSelectedTabIndex,
  );
  // ref는 render를 일으키지 않고 이미 mount된 child의 reload/history API를 호출하기 위한 runtime handle입니다.
  const webTabRefs = useRef<(WebTabHandle | null)[]>([]);
  const nativeUsersRef = useRef<NativeUsersScreenHandle>(null);
  const popupRef = useRef<PopupWebViewHandle>(null);
  const lastBackPressRef = useRef(0);
  const bottomBarTranslateY = useRef(new Animated.Value(0)).current;
  // bridge, scroll, keyboard는 서로 덮어쓰지 않도록 원인별 state로 분리합니다.
  const [bridgeBottomBarVisible, setBridgeBottomBarVisible] = useState(true);
  const [scrollBottomBarVisible, setScrollBottomBarVisible] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [popupUrl, setPopupUrl] = useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  // [FLOW-08 / 3단계] 세 조건이 모두 true인 경우에만 하단 바가 실제 입력을 받고 보입니다.
  const bottomBarVisible =
    bridgeBottomBarVisible && scrollBottomBarVisible && !keyboardVisible;
  const bottomBarHiddenOffset = BOTTOM_TAB_BASE_HEIGHT + insets.bottom;
  // [FLOW-09 / 2단계] 명시적인 NONE만 offline으로 표시하며 초기 UNKNOWN을 단절로 오판하지 않습니다.
  const networkOffline =
    networkState.type === Network.NetworkStateType.NONE;

  useEffect(() => {
    // [FLOW-08 / 4단계] safe-area를 포함한 전체 높이만큼 native-driver translateY를 이동합니다.
    Animated.timing(bottomBarTranslateY, {
      toValue: bottomBarVisible ? 0 : bottomBarHiddenOffset,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [
    bottomBarHiddenOffset,
    bottomBarTranslateY,
    bottomBarVisible,
  ]);

  useEffect(() => {
    // iOS는 keyboard animation 전 event, Android는 실제 표시 후 event를 사용해 platform 제공 시점에 맞춥니다.
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      // DemoShell unmount 뒤 listener가 state를 갱신하지 않도록 두 platform event subscription을 정리합니다.
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    // notification handler는 service가 process에서 한 번만 구성하고 event subscription은 DemoShell mount 수명을 따릅니다.
    configureNotificationHandler();
    const unsubscribeNotifications = subscribeToNotificationEvents();
    clearBadgeSafely();

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState) => {
        if (nextState === "active") {
          clearBadgeSafely();
        }
      },
    );

    return () => {
      unsubscribeNotifications();
      appStateSubscription.remove();
    };
  }, []);

  const applyDeepLink = useCallback(
    ({ tabIndex, targetUrl }: DemoDeepLink) => {
      // [FLOW-06 / 5단계] 검증된 target tab을 선택하고 URL이 있으면 이미 mount된 WebView history에 load합니다.
      setSelectedTabIndex(tabIndex);
      setScrollBottomBarVisible(true);

      if (targetUrl && tabIndex < 3) {
        webTabRefs.current[tabIndex]?.loadUrl(targetUrl);
      } else if (tabIndex === 3) {
        // native tab target은 과거에 활성화된 적이 없어도 강제 조회할 수 있도록 일반 refetch가 아닌 조건부 handle을 사용합니다.
        void nativeUsersRef.current?.refetchIfActivated(true);
      }
    },
    [setSelectedTabIndex],
  );

  const handleDeepLinkUrl = useCallback(
    (url: string, showInvalidAlert = true): boolean => {
      const deepLink = parseDemoDeepLink(url);
      if (!deepLink) {
        if (showInvalidAlert) {
          Alert.alert(
            "잘못된 링크",
            "탭 번호 또는 URL 형식을 확인해 주세요.",
          );
        }
        return false;
      }

      applyDeepLink(deepLink);
      return true;
    },
    [applyDeepLink],
  );

  useEffect(() => {
    const incomingUrl = Array.isArray(demoDeepLink)
      ? demoDeepLink[0]
      : demoDeepLink;

    if (!incomingUrl) {
      return;
    }

    handleDeepLinkUrl(incomingUrl);
    // 같은 query가 다음 render에서 다시 적용되지 않도록 처리 직후 route param을 제거합니다.
    router.setParams({ demoDeepLink: undefined });
  }, [demoDeepLink, handleDeepLinkUrl, router]);

  const openExternalUrl = useCallback((url: string) => {
    // [FLOW-06 / 7단계] app이 처리하지 않는 scheme은 OS에 위임하고 등록 앱 부재/rejection은 공통 안내로 끝냅니다.
    void Linking.openURL(url).catch(showLinkingError);
  }, []);

  const handleNavigationRequest = useCallback(
    (url: string): boolean => {
      // [FLOW-03 / 4단계] 순수 URL decision을 WebView 허용, 차단 안내, app deep link, OS 외부 앱 동작으로 실행합니다.
      const decision = classifyNavigationUrl(url);

      switch (decision.type) {
        case "allow":
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
          applyDeepLink(decision.value);
          return false;
        case "external":
          openExternalUrl(decision.url);
          return false;
      }
    },
    [applyDeepLink, openExternalUrl],
  );

  const handleOpenWindow = useCallback(
    (sourceTabIndex: TabIndex, url: string) => {
      // [FLOW-04 / 1단계] source WebView의 window.open target과 tab index를 받아 새 창 처리 주체를 고릅니다.
      const decision = classifyPopupUrl(url);

      // [FLOW-04 / 3단계] 알려진 parent URL은 source history, 외부 scheme/host는 OS, 나머지 HTTPS는 modal state로 보냅니다.
      if (decision.type === "parent") {
        webTabRefs.current[sourceTabIndex]?.loadUrl(decision.url);
        return;
      }

      if (decision.type === "external") {
        openExternalUrl(decision.url);
        return;
      }

      setPopupUrl(decision.url);
      // popup이 열린 동안 겹치는 하단 tab 입력을 막기 위해 scroll visibility도 숨깁니다.
      setScrollBottomBarVisible(false);
    },
    [openExternalUrl],
  );

  const closePopup = useCallback(() => {
    setPopupUrl(null);
    setScrollBottomBarVisible(true);
  }, []);

  const showToastMessage = useCallback((message: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.LONG);
      return;
    }

    setSnackbarMessage(message);
  }, []);

  const dismissSnackbar = useCallback(() => {
    setSnackbarMessage(null);
  }, []);

  const setBottomNaviVisible = useCallback((visible: boolean) => {
    // [FLOW-08 / 관련 코드] bridge의 명시적 show는 이전 scroll hide도 해제하지만 keyboard hide 조건을 우회하지 않습니다.
    setBridgeBottomBarVisible(visible);
    if (visible) {
      setScrollBottomBarVisible(true);
    }
  }, []);

  const handleBridgeMessage = useCallback(
    (sourceTabIndex: TabIndex, message: string): Promise<BridgeResponse> =>
      // [FLOW-05 / 3단계] shell이 현재 refs·state setter·Expo service를 dependency로 묶어 순수 dispatcher에 주입합니다.
      dispatchBridgeMessage(message, {
        getDeviceUUID: getOrCreateDeviceId,
        showToastMessage,
        showNotiMessage: showDemoNotification,
        reloadOtherTabs: async () => {
          // 요청을 보낸 WebView를 제외한 두 WebView는 초기 source로, 활성화 이력이 있는 native tab은 Query refetch로 되돌립니다.
          for (let index = 0; index < 3; index += 1) {
            if (index !== sourceTabIndex) {
              webTabRefs.current[index]?.reloadInitial();
            }
          }
          await nativeUsersRef.current?.refetchIfActivated(true);
        },
        goToAnotherTab: async (targetTab: TabTag, targetUrl: string) => {
          // schema를 통과한 tag라도 변환 결과와 HTTPS URL을 실행 직전에 다시 확인해 dependency 경계를 지킵니다.
          const targetIndex = tabTagToIndex(targetTab);
          const normalizedUrl = normalizeHttpsUrl(targetUrl);

          if (targetIndex === null || normalizedUrl === null) {
            throw new Error("이동할 탭 또는 URL이 올바르지 않습니다.");
          }

          setSelectedTabIndex(targetIndex);
          setScrollBottomBarVisible(true);

          if (targetIndex < 3) {
            webTabRefs.current[targetIndex]?.loadUrl(normalizedUrl);
          } else {
            await nativeUsersRef.current?.refetchIfActivated(true);
          }
        },
        setBottomNaviVisible,
        getPhotoImages: selectPhotoImages,
      }),
    [setBottomNaviVisible, setSelectedTabIndex, showToastMessage],
  );

  const handleTabSelect = useCallback(
    (index: TabIndex) => {
      setScrollBottomBarVisible(true);

      if (index === selectedTabIndex) {
        // [FLOW-02 / 5단계] 현재 tab 재선택은 WebView 최초 source reset 또는 native Query 강제 refetch라는 명시적 refresh 동작입니다.
        if (index < 3) {
          webTabRefs.current[index]?.reloadInitial();
        } else {
          void nativeUsersRef.current?.refetch(true);
        }
        return;
      }

      // [FLOW-02 / 4단계] 다른 tab 선택은 index만 persist store에 기록하며 child instance 자체는 unmount하지 않습니다.
      setSelectedTabIndex(index);
    },
    [selectedTabIndex, setSelectedTabIndex],
  );

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        // Android back 우선순위는 popup history/close → 현재 WebView history → 2초 이중 입력 종료입니다.
        if (popupUrl !== null) {
          if (!popupRef.current?.goBack()) {
            closePopup();
          }
          return true;
        }

        if (
          selectedTabIndex < 3 &&
          webTabRefs.current[selectedTabIndex]?.goBack()
        ) {
          return true;
        }

        const currentTime = Date.now();
        if (isDoubleBackPress(lastBackPressRef.current, currentTime)) {
          BackHandler.exitApp();
          return true;
        }

        lastBackPressRef.current = currentTime;
        ToastAndroid.show(
          "한 번 더 누르면 앱이 종료됩니다.",
          ToastAndroid.LONG,
        );
        return true;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [closePopup, popupUrl, selectedTabIndex]);

  const activeTab = TAB_DEFINITIONS[selectedTabIndex];

  return (
    <View style={styles.container}>
      <NetworkStatusBanner visible={networkOffline} />

      {Platform.OS === "ios" && selectedTabIndex < 3 ? (
        <View style={styles.navigationToolbar}>
          <Pressable
            accessibilityLabel="웹 페이지 뒤로가기"
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
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
        {/* [FLOW-02 / 2단계] 세 WebTab과 NativeUsersScreen을 항상 같은 tree에 두고 active prop으로 표시·입력만 전환합니다. */}
        {TAB_DEFINITIONS.slice(0, 3).map((tab) => (
          <WebTab
            active={selectedTabIndex === tab.index}
            bottomContentInset={bottomBarHiddenOffset}
            initialSource={
              tab.index === 0
                ? { html: LOCAL_DEMO_HTML, baseUrl: LOCAL_WEB_BASE_URL }
                : { uri: tab.initialUrl as string }
            }
            key={tab.tag}
            onBridgeMessage={(message) =>
              handleBridgeMessage(tab.index, message)
            }
            onNavigationRequest={handleNavigationRequest}
            onOpenWindow={(url) => {
              handleOpenWindow(tab.index, url);
            }}
            onScrollDirection={(direction) => {
              // [FLOW-08 / 관련 코드] 활성 child가 올린 방향만 scroll visibility state로 변환합니다.
              setScrollBottomBarVisible(direction === "up");
            }}
            ref={(value) => {
              webTabRefs.current[tab.index] = value;
            }}
            tag={tab.tag}
          />
        ))}

        <NativeUsersScreen
          active={selectedTabIndex === 3}
          bottomContentInset={bottomBarHiddenOffset}
          onScrollDirection={(direction) => {
            setScrollBottomBarVisible(direction === "up");
          }}
          ref={nativeUsersRef}
        />
      </View>

      {/* opacity가 아니라 화면 밖 translation을 쓰므로 숨김 중에는 pointerEvents도 함께 차단합니다. */}
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
          if (handleDeepLinkUrl(url)) {
            closePopup();
          }
        }}
        ref={popupRef}
        url={popupUrl}
      />
    </View>
  );
}

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
