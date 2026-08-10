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
  const networkState = Network.useNetworkState();
  const { demoDeepLink } = useLocalSearchParams<{
    demoDeepLink?: string | string[];
  }>();
  const selectedTabIndex = useAppStore((state) => state.selectedTabIndex);
  const setSelectedTabIndex = useAppStore(
    (state) => state.setSelectedTabIndex,
  );
  const webTabRefs = useRef<(WebTabHandle | null)[]>([]);
  const nativeUsersRef = useRef<NativeUsersScreenHandle>(null);
  const popupRef = useRef<PopupWebViewHandle>(null);
  const lastBackPressRef = useRef(0);
  const bottomBarTranslateY = useRef(new Animated.Value(0)).current;
  const [bridgeBottomBarVisible, setBridgeBottomBarVisible] = useState(true);
  const [scrollBottomBarVisible, setScrollBottomBarVisible] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [popupUrl, setPopupUrl] = useState<string | null>(null);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  const bottomBarVisible =
    bridgeBottomBarVisible && scrollBottomBarVisible && !keyboardVisible;
  const bottomBarHiddenOffset = BOTTOM_TAB_BASE_HEIGHT + insets.bottom;
  const networkOffline =
    networkState.type === Network.NetworkStateType.NONE;

  useEffect(() => {
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
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
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
      setSelectedTabIndex(tabIndex);
      setScrollBottomBarVisible(true);

      if (targetUrl && tabIndex < 3) {
        webTabRefs.current[tabIndex]?.loadUrl(targetUrl);
      } else if (tabIndex === 3) {
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
    router.setParams({ demoDeepLink: undefined });
  }, [demoDeepLink, handleDeepLinkUrl, router]);

  const openExternalUrl = useCallback((url: string) => {
    void Linking.openURL(url).catch(showLinkingError);
  }, []);

  const handleNavigationRequest = useCallback(
    (url: string): boolean => {
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
      const decision = classifyPopupUrl(url);

      if (decision.type === "parent") {
        webTabRefs.current[sourceTabIndex]?.loadUrl(decision.url);
        return;
      }

      if (decision.type === "external") {
        openExternalUrl(decision.url);
        return;
      }

      setPopupUrl(decision.url);
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
    setBridgeBottomBarVisible(visible);
    if (visible) {
      setScrollBottomBarVisible(true);
    }
  }, []);

  const handleBridgeMessage = useCallback(
    (sourceTabIndex: TabIndex, message: string): Promise<BridgeResponse> =>
      dispatchBridgeMessage(message, {
        getDeviceUUID: getOrCreateDeviceId,
        showToastMessage,
        showNotiMessage: showDemoNotification,
        reloadOtherTabs: async () => {
          for (let index = 0; index < 3; index += 1) {
            if (index !== sourceTabIndex) {
              webTabRefs.current[index]?.reloadInitial();
            }
          }
          await nativeUsersRef.current?.refetchIfActivated(true);
        },
        goToAnotherTab: async (targetTab: TabTag, targetUrl: string) => {
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
        if (index < 3) {
          webTabRefs.current[index]?.reloadInitial();
        } else {
          void nativeUsersRef.current?.refetch(true);
        }
        return;
      }

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
        {TAB_DEFINITIONS.slice(0, 3).map((tab) => (
          <WebTab
            active={selectedTabIndex === tab.index}
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
  },
});
