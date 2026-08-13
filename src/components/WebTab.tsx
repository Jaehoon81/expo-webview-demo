import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import type {
  WebViewSource,
} from "react-native-webview/lib/WebViewTypes";

import type { BridgeResponse } from "@/src/bridge/types";
import type { TabTag } from "@/src/types/navigation";
import {
  getScrollDirection,
  type ScrollDirection,
} from "@/src/utils/scroll-direction";

export type WebTabHandle = {
  reloadInitial: () => void;
  loadUrl: (url: string) => void;
  goBack: () => boolean;
  goForward: () => boolean;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  injectBridgeResponse: (response: BridgeResponse) => void;
};

type WebTabProps = {
  tag: TabTag;
  active: boolean;
  bottomContentInset: number;
  initialSource: WebViewSource;
  onBridgeMessage: (message: string) => Promise<BridgeResponse>;
  onNavigationRequest: (url: string) => boolean;
  onOpenWindow: (url: string) => void;
  onScrollDirection: (direction: ScrollDirection) => void;
};

type LoadError = {
  title: string;
  description: string;
};

export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    tag,
    active,
    bottomContentInset,
    initialSource,
    onBridgeMessage,
    onNavigationRequest,
    onOpenWindow,
    onScrollDirection,
  },
  forwardedRef,
) {
  const webViewRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  const canGoForwardRef = useRef(false);
  const hasLoadedDocumentRef = useRef(false);
  const previousScrollOffsetRef = useRef(0);
  const iosErrorRecoveryRef = useRef(false);
  const [source, setSource] = useState<WebViewSource>(initialSource);
  const [reloadKey, setReloadKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const centeredContentInsetStyle = {
    paddingBottom: bottomContentInset + 24,
  };

  const injectBridgeResponse = useCallback((response: BridgeResponse) => {
    const serializedResponse = JSON.stringify(response);
    const functionArgument = JSON.stringify(serializedResponse);
    webViewRef.current?.injectJavaScript(
      `window.calledByNative && window.calledByNative(${functionArgument}); true;`,
    );
  }, []);

  const preserveBottomBarDuringIosErrorRecovery = useCallback(() => {
    if (Platform.OS !== "ios") {
      return;
    }

    iosErrorRecoveryRef.current = true;

    if (active) {
      onScrollDirection("up");
    }
  }, [active, onScrollDirection]);

  const reloadInitial = useCallback(() => {
    setLoadError(null);
    canGoBackRef.current = false;
    canGoForwardRef.current = false;
    hasLoadedDocumentRef.current = false;
    setSource(initialSource);
    setReloadKey((current) => current + 1);
  }, [initialSource]);

  useImperativeHandle(
    forwardedRef,
    () => ({
      reloadInitial,
      loadUrl(url) {
        setLoadError(null);

        if (hasLoadedDocumentRef.current) {
          const serializedUrl = JSON.stringify(url);
          webViewRef.current?.injectJavaScript(
            `window.location.assign(${serializedUrl}); true;`,
          );
          return;
        }

        setSource({ uri: url });
      },
      goBack() {
        if (!canGoBackRef.current) {
          return false;
        }
        webViewRef.current?.goBack();
        return true;
      },
      goForward() {
        if (!canGoForwardRef.current) {
          return false;
        }
        webViewRef.current?.goForward();
        return true;
      },
      canGoBack: () => canGoBackRef.current,
      canGoForward: () => canGoForwardRef.current,
      injectBridgeResponse,
    }),
    [injectBridgeResponse, reloadInitial],
  );

  return (
    <View
      accessibilityElementsHidden={!active}
      collapsable={false}
      importantForAccessibility={active ? "auto" : "no-hide-descendants"}
      pointerEvents={active ? "auto" : "none"}
      style={[styles.container, !active && styles.inactive]}
      testID={`web-tab-${tag}`}
    >
      {progress > 0 && progress < 1 ? (
        <View style={styles.progressTrack}>
          <View style={[styles.progressValue, { width: `${progress * 100}%` }]} />
        </View>
      ) : null}

      <WebView
        key={reloadKey}
        ref={webViewRef}
        source={source}
        style={styles.webView}
        testID={`web-view-${tag}`}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        javaScriptCanOpenWindowsAutomatically
        setSupportMultipleWindows
        allowsBackForwardNavigationGestures
        applicationNameForUserAgent={`my-webview-app(tab:${tag})`}
        mixedContentMode="never"
        webviewDebuggingEnabled={__DEV__}
        startInLoadingState
        renderLoading={() => (
          <View style={[styles.loading, centeredContentInsetStyle]}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>웹 페이지를 불러오고 있습니다.</Text>
          </View>
        )}
        onLoadStart={() => {
          setProgress(0);
        }}
        onLoadProgress={(event) => {
          setProgress(event.nativeEvent.progress);
        }}
        onLoad={() => {
          if (Platform.OS === "ios") {
            iosErrorRecoveryRef.current = false;
          }
        }}
        onLoadEnd={() => {
          hasLoadedDocumentRef.current = true;
          setProgress(1);
        }}
        onNavigationStateChange={(navigationState) => {
          canGoBackRef.current = navigationState.canGoBack;
          canGoForwardRef.current = navigationState.canGoForward;
        }}
        onMessage={(event) => {
          void onBridgeMessage(event.nativeEvent.data).then(
            injectBridgeResponse,
          );
        }}
        onShouldStartLoadWithRequest={(request) =>
          onNavigationRequest(request.url)
        }
        onOpenWindow={(event) => {
          onOpenWindow(event.nativeEvent.targetUrl);
        }}
        onScroll={(event) => {
          const currentOffset = event.nativeEvent.contentOffset.y;
          const direction = getScrollDirection(
            previousScrollOffsetRef.current,
            currentOffset,
          );
          previousScrollOffsetRef.current = currentOffset;

          const ignoreIosErrorScroll =
            Platform.OS === "ios" &&
            (loadError !== null || iosErrorRecoveryRef.current);

          if (active && direction && !ignoreIosErrorScroll) {
            onScrollDirection(direction);
          }
        }}
        onError={(event) => {
          event.preventDefault();
          preserveBottomBarDuringIosErrorRecovery();
          setLoadError({
            title: "웹 페이지를 열 수 없습니다.",
            description: event.nativeEvent.description,
          });
        }}
        onHttpError={(event) => {
          preserveBottomBarDuringIosErrorRecovery();
          setLoadError({
            title: `HTTP ${event.nativeEvent.statusCode} 오류`,
            description:
              event.nativeEvent.description || "서버 요청에 실패했습니다.",
          });
        }}
      />

      {loadError ? (
        <View
          accessibilityRole="alert"
          style={[styles.errorOverlay, centeredContentInsetStyle]}
        >
          <Text style={styles.errorTitle}>{loadError.title}</Text>
          <Text style={styles.errorDescription}>{loadError.description}</Text>
          <View style={styles.errorActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                preserveBottomBarDuringIosErrorRecovery();
                setLoadError(null);
                webViewRef.current?.reload();
              }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>다시 시도</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                preserveBottomBarDuringIosErrorRecovery();
                reloadInitial();
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>초기 화면</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
  },
  inactive: {
    opacity: 0,
  },
  webView: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  progressTrack: {
    zIndex: 2,
    height: 3,
    backgroundColor: "#E2E8F0",
  },
  progressValue: {
    height: 3,
    backgroundColor: "#4F46E5",
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    color: "#475569",
    fontSize: 14,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  errorTitle: {
    color: "#0F172A",
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
  },
  errorDescription: {
    marginTop: 8,
    color: "#64748B",
    fontSize: 14,
    textAlign: "center",
  },
  errorActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  primaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: "#4F46E5",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  secondaryButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#334155",
    fontWeight: "700",
  },
});
