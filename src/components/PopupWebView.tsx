import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import {
  SafeAreaProvider,
  SafeAreaView,
} from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import {
  classifyPopupUrl,
  type NavigationDecision,
} from "@/src/services/url-router";
import { NetworkStatusBanner } from "@/src/components/NetworkStatusBanner";

export type PopupWebViewHandle = {
  goBack: () => boolean;
};

type PopupWebViewProps = {
  url: string | null;
  onClose: () => void;
  classifyNavigation: (url: string) => NavigationDecision;
  onDeepLink: (url: string) => void;
  networkOffline: boolean;
};

export const PopupWebView = forwardRef<
  PopupWebViewHandle,
  PopupWebViewProps
>(function PopupWebView(
  {
    url,
    onClose,
    classifyNavigation,
    onDeepLink,
    networkOffline,
  },
  forwardedRef,
) {
  const webViewRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  const [currentUrl, setCurrentUrl] = useState<string | null>(url);
  const [webViewKey, setWebViewKey] = useState(0);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    canGoBackRef.current = false;
    setCurrentUrl(url);
    setErrorMessage(null);
    setWebViewKey((current) => current + 1);
  }, [url]);

  useImperativeHandle(forwardedRef, () => ({
    goBack() {
      if (!canGoBackRef.current) {
        return false;
      }
      webViewRef.current?.goBack();
      return true;
    },
  }));

  const openExternalUrl = (targetUrl: string) => {
    void Linking.openURL(targetUrl).catch(() => {
      Alert.alert("외부 앱 실행 실패", "요청한 링크를 열 수 없습니다.");
    });
  };

  const shouldStartRequest = (targetUrl: string): boolean => {
    const decision = classifyNavigation(targetUrl);

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
        onDeepLink(targetUrl);
        return false;
      case "external":
        openExternalUrl(decision.url);
        return false;
    }
  };

  const handleOpenWindow = (targetUrl: string) => {
    const decision = classifyPopupUrl(targetUrl);

    if (decision.type === "external") {
      openExternalUrl(decision.url);
      return;
    }

    setCurrentUrl(decision.url);
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={() => {
        if (!canGoBackRef.current) {
          onClose();
        } else {
          webViewRef.current?.goBack();
        }
      }}
      presentationStyle="fullScreen"
      visible={url !== null}
    >
      <SafeAreaProvider>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          <NetworkStatusBanner visible={networkOffline} />

          <View style={styles.header}>
            <Pressable
              accessibilityLabel="팝업 뒤로가기"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => {
                if (canGoBackRef.current) {
                  webViewRef.current?.goBack();
                } else {
                  Alert.alert("알림", "이전 페이지가 없습니다.");
                }
              }}
              style={styles.headerButton}
            >
              <Ionicons color="#0F172A" name="arrow-back" size={24} />
            </Pressable>
            <Text numberOfLines={1} style={styles.title}>
              팝업 웹 페이지
            </Text>
            <Pressable
              accessibilityLabel="팝업 닫기"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onClose}
              style={styles.headerButton}
            >
              <Ionicons color="#0F172A" name="close" size={26} />
            </Pressable>
          </View>

          {progress > 0 && progress < 1 ? (
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressValue,
                  { width: `${progress * 100}%` },
                ]}
              />
            </View>
          ) : null}

          <View style={styles.webContent}>
          {currentUrl ? (
            <WebView
              key={webViewKey}
              ref={webViewRef}
              source={{ uri: currentUrl }}
              containerStyle={
                errorMessage !== null
                  ? styles.hiddenWebViewContainer
                  : undefined
              }
              style={styles.webView}
              originWhitelist={["*"]}
              javaScriptEnabled
              domStorageEnabled
              cacheEnabled
              sharedCookiesEnabled
              thirdPartyCookiesEnabled
              javaScriptCanOpenWindowsAutomatically
              setSupportMultipleWindows
              allowsBackForwardNavigationGestures
              mixedContentMode="never"
              webviewDebuggingEnabled={__DEV__}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.loading}>
                  <ActivityIndicator size="large" />
                </View>
              )}
              renderError={() => <View />}
              onLoadStart={() => {
                setProgress(0);
              }}
              onLoadProgress={(event) => {
                setProgress(event.nativeEvent.progress);
              }}
              onNavigationStateChange={(navigationState) => {
                canGoBackRef.current = navigationState.canGoBack;
              }}
              onShouldStartLoadWithRequest={(request) =>
                shouldStartRequest(request.url)
              }
              onOpenWindow={(event) => {
                handleOpenWindow(event.nativeEvent.targetUrl);
              }}
              onError={(event) => {
                setErrorMessage(event.nativeEvent.description);
              }}
              onHttpError={(event) => {
                setErrorMessage(
                  `HTTP ${event.nativeEvent.statusCode}: ${event.nativeEvent.description}`,
                );
              }}
            />
          ) : null}

          {errorMessage ? (
            <View accessibilityRole="alert" style={styles.errorContent}>
              <Text style={styles.errorTitle}>
                팝업 페이지를 열 수 없습니다.
              </Text>
              <Text style={styles.errorMessage}>{errorMessage}</Text>
              <View style={styles.errorActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setErrorMessage(null);
                    webViewRef.current?.reload();
                  }}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryButtonText}>다시 시도</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={onClose}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>닫기</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },
  headerButton: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  progressTrack: {
    height: 3,
    backgroundColor: "#E2E8F0",
  },
  progressValue: {
    height: 3,
    backgroundColor: "#4F46E5",
  },
  webContent: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  hiddenWebViewContainer: {
    display: "none",
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  errorContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  errorTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  errorMessage: {
    marginTop: 8,
    color: "#64748B",
    textAlign: "center",
  },
  errorActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 8,
    backgroundColor: "#4F46E5",
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  closeButton: {
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
  },
  closeButtonText: {
    color: "#334155",
    fontWeight: "700",
  },
});
