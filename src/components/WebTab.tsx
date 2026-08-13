// [파일 역할] 한 WebView tab의 document/history, imperative navigation, bridge 왕복, progress·오류·scroll 상태를 소유합니다.
// [FLOW-03] 일반 WebView 흐름은 source load, URL 정책 결정, history 갱신, 오류 표시와 retry/초기화로 이어집니다.
// [검증 경계] component test는 WebView를 mock하므로 prop·callback 계약은 확인하지만 실제 WKWebView/Android WebView history·network load는 증명하지 않습니다.
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
  // DemoShell이 ref로 호출할 수 있는 명령만 공개하고 WebView instance 자체는 component 안에 숨깁니다.
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
  // [FLOW-03 / 1단계] source와 reloadKey는 document 수명, refs는 history/scroll의 최신 명령 상태, React state는 표시 상태를 맡습니다.
  const [source, setSource] = useState<WebViewSource>(initialSource);
  const [reloadKey, setReloadKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const centeredContentInsetStyle = {
    paddingBottom: bottomContentInset + 24,
  };

  const injectBridgeResponse = useCallback((response: BridgeResponse) => {
    // [FLOW-05 / 7단계] response 객체를 안전한 JS 문자열 인자로 이중 직렬화해 quote/script 문자가 실행문을 깨지 않게 합니다.
    const serializedResponse = JSON.stringify(response);
    const functionArgument = JSON.stringify(serializedResponse);
    webViewRef.current?.injectJavaScript(
      `window.calledByNative && window.calledByNative(${functionArgument}); true;`,
    );
  }, []);

  const preserveBottomBarDuringIosErrorRecovery = useCallback(() => {
    // iOS error/reload 전환이 만드는 합성 scroll을 실제 사용자 scroll과 분리하는 짧은 lifecycle flag입니다.
    if (Platform.OS !== "ios") {
      return;
    }

    iosErrorRecoveryRef.current = true;

    if (active) {
      onScrollDirection("up");
    }
  }, [active, onScrollDirection]);

  const reloadInitial = useCallback(() => {
    // [FLOW-02 / 6단계] 현재 탭 재선택은 error/history/load flag를 비우고 key를 바꿔 최초 source의 새 WebView document를 만듭니다.
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
          // 이미 열린 document에는 location.assign을 주입해 기존 WebView instance와 back history를 보존합니다.
          const serializedUrl = JSON.stringify(url);
          webViewRef.current?.injectJavaScript(
            `window.location.assign(${serializedUrl}); true;`,
          );
          return;
        }

        // 첫 document load 전에는 inject target이 없으므로 source state에 URL을 예약합니다.
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
    // active가 false여도 unmount하지 않고 absolute layer를 투명·비입력 상태로 유지해 page/history/form state를 보존합니다.
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

      {/* [FLOW-03 / 2단계] 모든 scheme을 callback까지 전달한 뒤 onShouldStartLoadWithRequest 정책이 실제 허용 주체를 결정합니다. */}
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
          // load end 뒤부터 loadUrl은 source 교체가 아니라 현재 document history에 이어서 이동할 수 있습니다.
          hasLoadedDocumentRef.current = true;
          setProgress(1);
        }}
        onNavigationStateChange={(navigationState) => {
          // [FLOW-03 / 5단계] native WebView가 보고한 최신 history 가능 여부를 ref에 저장해 platform back/forward 명령이 동기 boolean을 반환합니다.
          canGoBackRef.current = navigationState.canGoBack;
          canGoForwardRef.current = navigationState.canGoForward;
        }}
        onMessage={(event) => {
          // [FLOW-05 / 2단계] WebView string message를 shell dispatcher로 보내고 완료된 공통 response를 같은 tab에 주입합니다.
          void onBridgeMessage(event.nativeEvent.data).then(
            injectBridgeResponse,
          );
        }}
        onShouldStartLoadWithRequest={(request) =>
          // URL 자체의 parsing·정책은 service/shell에 위임하고 WebView에는 최종 허용 boolean만 돌려줍니다.
          onNavigationRequest(request.url)
        }
        onOpenWindow={(event) => {
          // [FLOW-04 / 관련 코드] window.open target은 이 component에서 새 WebView를 만들지 않고 source tab 정보와 함께 shell에 전달합니다.
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
            // [FLOW-08 / 2단계] active WebView의 threshold를 넘은 사용자 scroll 방향만 shell visibility 계산에 전달합니다.
            onScrollDirection(direction);
          }
        }}
        onError={(event) => {
          // [FLOW-03 / 6단계] native load 실패를 기본 오류 page 대신 app overlay data로 바꾸고 iOS visibility 복구를 시작합니다.
          // [FLOW-09 / 관련 코드] offline banner와 별개로 실제 WebView request 실패 내용은 이 tab이 보관합니다.
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
            {/* [FLOW-03 / 7단계] retry는 현재 URL, 초기 화면은 최초 source라는 서로 다른 복구 경계를 제공합니다. */}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                // [FLOW-09 / 5단계] network 복원만으로 자동 reload하지 않고 사용자가 이 retry를 눌러 현재 request를 다시 실행합니다.
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
