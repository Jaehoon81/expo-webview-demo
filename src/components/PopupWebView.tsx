// [파일 역할] 새 창으로 열 주소를 화면 전체 modal WebView에 보여 줍니다. 그 안의 방문 기록, 진행률, 오류, 닫기를 관리합니다.
// [FLOW-04 / 7단계] `DemoShell`의 `popupUrl` 변경이 새 props render를 만들고 `Modal.visible`과 effect 입력을 갱신합니다.
// 사용자는 modal 안에서 뒤로 가거나 modal을 닫을 수 있습니다.
// [검증 경계] test에서는 WebView를 가짜로 바꾸고 화면에 건넨 값을 확인합니다.
// 실제 웹 페이지 열기, 화면 가장자리 여백, 손동작, 외부 앱 전환은 실기기에서 확인해야 합니다.
// [라이브러리] React의 ref, effect, state는 modal이 열린 동안 필요한 값을 관리합니다.
// React Native `Modal`은 기존 화면 위에 별도의 휴대폰 화면 영역을 만듭니다.

// ========================================== 외부 의존성 ==========================================

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
// [라이브러리] Expo Linking은 WebView가 열지 않을 scheme을 휴대폰에 설치된 다른 앱으로 보냅니다.
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

// =================================================================================================

// ======================================== 외부 type 계약 =========================================

export type PopupWebViewHandle = {
  // DemoShell에는 popup 안에서 뒤로 갔는지만 알려 줍니다. 실제 WebView 객체는 이 파일 밖으로 내보내지 않습니다.
  // [역할] `goBack`은 popup 방문 기록을 실제로 이동했는지 boolean으로 알려 주는 공개 함수 계약입니다.
  goBack: () => boolean;
};

// DemoShell이 URL을 주면 modal을 열고, null을 주면 닫습니다. 따라서 이 값 하나가 modal의 열림과 닫힘을 함께 나타냅니다.
type PopupWebViewProps = {
  url: string | null;
  // [역할] `onClose`는 popup을 닫고 뒤 화면의 하단 탭을 복구해 달라고 DemoShell에 알리는 함수 계약입니다.
  onClose: () => void;
  // [역할] `classifyNavigation`은 popup 안의 URL을 WebView·앱 탭·외부 앱 처리로 나누는 함수 계약입니다.
  classifyNavigation: (url: string) => NavigationDecision;
  // [역할] `onDeepLink`는 popup 안에서 누른 앱 전용 주소를 DemoShell의 탭 이동으로 전달하는 함수 계약입니다.
  onDeepLink: (url: string) => void;
  networkOffline: boolean;
};

// =================================================================================================

// ==================================== PopupWebView component =====================================

// [역할] `PopupWebView`는 modal WebView 하나의 URL·방문 기록·loading·오류와 닫기 동작을 관리합니다.
// [문법] 줄이 나뉘어 있어도 `forwardRef<Handle, Props>` 한 표현입니다. 첫 type은 ref 명령, 둘째 type은 props 모양을 정합니다.
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

  // ===================================== WebView 상태와 ref ======================================

  // 첫 ref는 실제 WebView 명령을 부를 때 씁니다. 둘째 ref는 뒤로 갈 기록이 있는지 기억하며, 값이 바뀌어도 화면을 다시 그리지 않습니다.
  // [역할] `webViewRef`는 popup WebView의 뒤로 가기와 다시 불러오기 명령을 부를 객체를 보관합니다.
  const webViewRef = useRef<WebView>(null);
  // [역할] `canGoBackRef`는 popup 안에 뒤로 갈 방문 기록이 있는지 최신 값을 기억합니다.
  const canGoBackRef = useRef(false);
  // currentUrl은 지금 modal이 보여 주는 주소입니다. popup 안에서 다시 `window.open`이 불리면 modal을 더 만들지 않고 이 주소만 바꿉니다.
  // [역할] `currentUrl` state는 현재 popup WebView가 열 주소 또는 닫힌 상태의 `null`을 보관합니다.
  const [currentUrl, setCurrentUrl] = useState<string | null>(url);
  // key가 바뀌면 이전 WebView와 방문 기록을 버리고 새 WebView를 만듭니다. DemoShell이 새 URL을 줄 때 사용합니다.
  // [역할] `webViewKey` state는 새 popup URL마다 이전 방문 기록을 버린 WebView를 다시 만들게 합니다.
  const [webViewKey, setWebViewKey] = useState(0);
  // progress는 주소를 여는 정도이고, errorMessage는 실패 안내입니다. 새 URL을 받으면 둘 다 처음 값으로 되돌립니다.
  // [역할] `progress` state는 현재 popup 문서를 얼마나 불러왔는지 진행 표시줄에 제공합니다.
  const [progress, setProgress] = useState(0);
  // [역할] `errorMessage` state는 popup URL 열기 실패 문장 또는 오류 없음의 `null`을 보관합니다.
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ===============================================================================================

  // ================================= popup lifecycle과 공개 명령 =================================

  // [라이브러리] `useEffect`는 DemoShell이 준 `url`이 바뀐 뒤 실행됩니다. 새 URL에 맞춰 modal 안의 값을 다시 준비합니다.
  // [역할] `useEffect` callback은 새 popup URL이나 닫힘 값에 맞춰 방문 기록·오류·WebView key를 초기화합니다.
  useEffect(() => {
    // [FLOW-04 / 8단계] React commit 뒤 이 effect가 자동 실행되어 history·error를 지우고 `currentUrl`과 새 WebView key를 저장합니다.
    canGoBackRef.current = false;
    setCurrentUrl(url);
    setErrorMessage(null);
    // [문법] `setWebViewKey((value) => value + 1)`은 React가 가진 최신 key에 1을 더합니다. 새 key 때문에 WebView도 새로 만들어집니다.
    // [역할] state updater callback은 가장 최신 WebView key에 1을 더해 새 popup WebView를 요청합니다.
    setWebViewKey((current) => current + 1);
  }, [url]);

  // [라이브러리] `useImperativeHandle`로 DemoShell에는 `goBack` 명령 하나만 줍니다.
  // 명령은 뒤로 갔으면 true, 갈 수 없으면 false를 바로 돌려줍니다.
  // [역할] `useImperativeHandle` factory는 DemoShell이 사용할 popup 뒤로 가기 명령 객체를 만듭니다.
  useImperativeHandle(forwardedRef, () => ({
    // Android의 기기 뒤로 가기 버튼이 먼저 popup 방문 기록을 확인할 수 있도록 결과를 바로 알려 줍니다.
    // [역할] `goBack`은 방문 기록이 있을 때만 popup WebView를 뒤로 보내고 성공 여부를 돌려줍니다.
    goBack() {
      if (!canGoBackRef.current) {
        // false이면 popup 안에서 뒤로 갈 수 없다는 뜻입니다. DemoShell은 modal 닫기처럼 다음 동작을 이어서 합니다.
        return false;
      }
      webViewRef.current?.goBack();
      return true;
    },
  }));

  // ===============================================================================================

  // ======================================= URL 처리 helper =======================================

  // 다른 앱으로 URL을 보내지 못한 경우는 웹 페이지 오류와 다릅니다. 그래서 popup 오류 화면 대신 Alert로 바로 알려 줍니다.
  // [역할] `openExternalUrl`은 URL을 OS의 다른 앱으로 보내고 실패하면 공통 Alert를 보여 줍니다.
  const openExternalUrl = (targetUrl: string) => {
    // [문법] 앞의 `void`는 이곳에서 Promise 결과값을 돌려주지 않는다는 뜻입니다. 실패한 경우만 `.catch`에서 Alert로 보여 줍니다.
    // [역할] 실패 처리 callback은 외부 앱이 URL을 열지 못한 경우 사용자에게 Alert로 알려 줍니다.
    void Linking.openURL(targetUrl).catch(() => {
      Alert.alert("외부 앱 실행 실패", "요청한 링크를 열 수 없습니다.");
    });
  };

  // [역할] `shouldStartRequest`는 popup 안의 URL 분류를 실행하고 WebView가 계속 열어도 되는지 돌려줍니다.
  const shouldStartRequest = (targetUrl: string): boolean => {
    // [FLOW-04 / 10-A단계] Android 최초 load를 제외한 popup navigation에서 native callback이 이 함수를 거쳐 공통 classifier를 호출합니다.
    const decision = classifyNavigation(targetUrl);

    // [문법] `switch (decision.type)`은 type 값에 맞는 경우 하나를 고릅니다.
    // 각 case 안에서는 그 경우에 있는 `url` 또는 `value`를 안전하게 쓸 수 있습니다.
    switch (decision.type) {
      case "allow":
        // [FLOW-04 / 11-A단계] `allow`는 true를 native popup WebView에 반환해 load event를 계속합니다.
        // HTTPS처럼 WebView가 직접 열어도 되는 경우에만 true를 돌려줍니다.
        return true;
      case "ignore":
        // [FLOW-04 / 11-B단계] `ignore`는 false를 반환해 popup navigation을 부수 효과 없이 종료합니다.
        return false;
      case "block-http":
        // [FLOW-04 / 11-C단계] `block-http`는 Alert를 표시하고 false로 load를 차단합니다.
        Alert.alert(
          "안전하지 않은 연결",
          "이 데모 앱은 HTTPS 주소만 WebView에서 엽니다.",
        );
        return false;
      case "deep-link":
        // [FLOW-04 / 11-D단계] `deep-link`는 parent callback을 호출하고 false를 반환해 FLOW-06 적용·popup 닫기 branch로 넘깁니다.
        // [FLOW-06 / 1-C단계] popup navigation에서 app scheme을 분류한 이 branch가 `onDeepLink(targetUrl)` 입력을 시작합니다.
        // 이 앱의 deep link이면 DemoShell에 탭 이동을 요청합니다. popup WebView는 그 URL을 열지 않습니다.
        onDeepLink(targetUrl);
        return false;
      case "external":
        // [FLOW-04 / 11-E단계] `external`은 OS로 URL을 보내고 false를 반환해 popup WebView load를 종료합니다.
        openExternalUrl(decision.url);
        return false;
    }
  };

  // [역할] `handleOpenWindow`는 popup 안의 새 창 URL을 외부 앱으로 보내거나 현재 popup 주소로 바꿉니다.
  const handleOpenWindow = (targetUrl: string) => {
    // [FLOW-04 / 10-D단계] popup document의 또 다른 `window.open` event는 이 함수에서 중첩 Modal 대신 새 decision으로 분기합니다.
    // popup 안에서 또 `window.open`이 불려도 modal을 하나 더 만들지 않습니다. 외부 앱으로 보내거나 현재 popup 주소를 바꿉니다.
    const decision = classifyPopupUrl(targetUrl);

    if (decision.type === "external") {
      // [FLOW-04 / 11-F단계] 내부 새 창의 external branch는 OS로 보내고 현재 popup session은 유지합니다.
      // 다른 앱에서 열 주소나 HTTPS가 아닌 주소는 현재 WebView에 넣지 않습니다.
      openExternalUrl(decision.url);
      return;
    }

    // [FLOW-04 / 11-G단계] parent 또는 popup branch는 `currentUrl`만 바꿔 같은 Modal 안에서 새 source navigation을 시작합니다.
    // 원래 탭에서 열었든 popup 안에서 열었든, 내부 웹 주소라면 현재 popup의 source만 바꿉니다.
    setCurrentUrl(decision.url);
  };

  // ===============================================================================================

  // ======================================= modal 화면 출력 =======================================

  // [역할] `PopupWebView`의 return은 modal header, WebView, 진행률과 오류 복구 화면을 하나로 만듭니다.
  // [라이브러리] `Modal`의 `visible`이 true이면 화면을 엽니다. Android 기기 뒤로 가기 버튼을 누르면 `onRequestClose`가 불립니다.
  return (
    <Modal
      animationType="slide"
      onRequestClose={() => {
        // [역할] `onRequestClose` callback은 popup 방문 기록을 먼저 뒤로 보내고 기록이 없을 때만 modal을 닫습니다.
        // [FLOW-04 / 16-A단계] Android가 Modal back을 요청하면 React Native가 이 callback을 자동 호출하고 history 또는 `onClose`로 분기합니다.
        if (!canGoBackRef.current) {
          // popup 안에 뒤로 갈 기록이 없으면 DemoShell의 닫기 함수를 부릅니다. 그 함수가 url을 null로 바꿉니다.
          onClose();
        } else {
          webViewRef.current?.goBack();
        }
      }}
      presentationStyle="fullScreen"
      visible={url !== null}
    >
      <SafeAreaProvider>
        {/* [라이브러리]
            Modal은 기존 화면과 별도의 화면 영역에 만들어집니다.
            `SafeAreaProvider`를 안에 한 번 더 두어 상단 상태 표시줄에 가리지 않을 여백을 다시 계산합니다. */}
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          <NetworkStatusBanner visible={networkOffline} />

          <View style={styles.header}>
            <Pressable
              accessibilityLabel="팝업 뒤로가기"
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => {
                // [역할] header 뒤로 가기 callback은 popup 방문 기록을 이동하고 기록이 없으면 안내를 보여 줍니다.
                // 위쪽 뒤로 가기 버튼은 popup의 방문 기록만 이동합니다. 뒤로 갈 곳이 없으면 Alert로 알려 줍니다.
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
            {/* [FLOW-04 / 16-C단계] header 닫기 press는 history를 보지 않고 `onClose`를 직접 호출해 공통 close state로 합류합니다. */}
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
          {/* [라이브러리]
              WebView가 기본으로 보여 주는 오류 화면은 비웁니다.
              대신 아래 앱 오류 화면에서 다시 시도와 닫기 버튼을 함께 보여 줍니다. */}
          {/* [FLOW-04 / 9단계] `currentUrl`이 있으면 React가 새 key와 source의 popup WebView를 mount해 native 최초 load를 시작합니다. */}
          {/* [FLOW-04 / 10-B단계] Android 최초 `source` load는 `onShouldStartLoadWithRequest`를 생략하고 stage 12의 native load callback으로 바로 진행합니다. */}
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

              // ------------------------------- WebView load와 이동 -------------------------------

              // [역할] `renderLoading` callback은 popup 문서를 여는 동안 보여 줄 가운데 loading 화면을 만듭니다.
              renderLoading={() => (
                <View style={styles.loading}>
                  <ActivityIndicator size="large" />
                </View>
              )}
              // [역할] `renderError` callback은 native 기본 오류 화면 대신 빈 View를 돌려 앱 오류 화면만 남깁니다.
              renderError={() => <View />}
              onLoadStart={() => {
                // [FLOW-04 / 12-A단계] 허용된 popup load가 시작되면 native event를 받은 library가 이 callback을 호출해 progress를 0으로 만듭니다.
                // [역할] `onLoadStart` callback은 새 popup URL을 열기 시작할 때 진행률을 0으로 되돌립니다.
                // 현재 WebView가 새 주소를 열기 시작할 때마다 진행률을 0으로 되돌립니다.
                setProgress(0);
              }}
              onLoadProgress={(event) => {
                // [FLOW-04 / 12-B단계] load 중 progress event마다 이 callback이 반복 실행되어 popup 진행 표시줄을 갱신합니다.
                // [역할] `onLoadProgress` callback은 WebView가 알려 준 진행률을 화면 state에 저장합니다.
                setProgress(event.nativeEvent.progress);
              }}
              onNavigationStateChange={(navigationState) => {
                // [FLOW-04 / 12-C단계] library가 load 시작·종료 navigation 값을 전달할 때마다 최신 `canGoBack`을 ref에 저장합니다.
                // [FLOW-09 / 9-B단계] popup retry 뒤에도 실제 native navigation/error callback만 popup request 결과를 바꿉니다.
                // [역할] `onNavigationStateChange` callback은 popup의 최신 뒤로 가기 가능 여부를 ref에 저장합니다.
                // WebView가 알려 준 뒤로 가기 가능 여부를 ref에 저장합니다. 위쪽 버튼과 기기 뒤로 가기가 이 값을 바로 읽습니다.
                canGoBackRef.current = navigationState.canGoBack;
              }}
              // [역할] `onShouldStartLoadWithRequest` callback은 새 URL을 공통 popup navigation 규칙으로 검사합니다.
              onShouldStartLoadWithRequest={(request) =>
                shouldStartRequest(request.url)
              }
              onOpenWindow={(event) => {
                // [역할] `onOpenWindow` callback은 popup 안의 새 창 URL을 현재 popup 또는 외부 앱 처리로 전달합니다.
                // [FLOW-04 / 10-C단계] native WebView가 popup 내부 새 창을 감지하면 이 callback이 `targetUrl`을 `handleOpenWindow`에 넘깁니다.
                // popup 안의 `window.open`도 위와 같은 URL 규칙으로 처리합니다. 새 modal을 겹쳐 만들지는 않습니다.
                handleOpenWindow(event.nativeEvent.targetUrl);
              }}

              // -----------------------------------------------------------------------------------

              // -------------------------------- WebView 오류 감지 --------------------------------

              onError={(event) => {
                // [역할] `onError` callback은 popup URL 열기 실패 문장을 앱 오류 화면 state에 저장합니다.
                // [FLOW-04 / 13-B단계] native load 실패 callback은 실제 request 설명을 `errorMessage`에 저장합니다.
                // [FLOW-09 / 6-B단계] popup request error도 공통 connection banner와 별도 state로 이 component가 보관합니다.
                setErrorMessage(event.nativeEvent.description);
              }}
              onHttpError={(event) => {
                // [역할] `onHttpError` callback은 HTTP 상태 코드와 설명을 같은 popup 오류 문장으로 저장합니다.
                // [FLOW-04 / 13-C단계] HTTP error callback은 status와 설명을 합쳐 같은 error state branch로 보냅니다.
                // HTTP 상태 코드와 WebView 설명을 한 문장으로 합쳐 같은 오류 화면에 보여 줍니다.
                setErrorMessage(
                  `HTTP ${event.nativeEvent.statusCode}: ${event.nativeEvent.description}`,
                );
              }}

              // -----------------------------------------------------------------------------------

            />
          ) : null}

          {/* [FLOW-04 / 13-A단계] 종료(성공): error가 없으면 같은 Modal·WebView가 document와 history를 계속 소유합니다. */}
          {/* [FLOW-04 / 14-B단계] 종료(실패 대기): React가 WebView container를 숨기고 retry 또는 close 입력을 기다리는 error UI를 표시합니다. */}
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
                    // [역할] 다시 시도 callback은 오류를 지우고 현재 popup URL을 같은 WebView에서 다시 불러옵니다.
                    // [FLOW-04 / 15-A단계] retry press는 error를 지우고 native `reload()`를 호출해 popup load callback 단계로 되돌아갑니다.
                    // [FLOW-09 / 8-B단계] popup도 reconnect 자동 실행 없이 이 press에서만 현재 URL request를 다시 시작합니다.
                    // 사용자가 다시 시도를 누르면 오류 안내를 지우고 현재 주소를 WebView에서 다시 엽니다.
                    setErrorMessage(null);
                    webViewRef.current?.reload();
                  }}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryButtonText}>다시 시도</Text>
                </Pressable>
                {/* [FLOW-04 / 15-B단계] error UI의 닫기 press도 `onClose`를 호출해 공통 close state로 합류합니다. */}
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

  // ===============================================================================================

});

// =================================================================================================

// ========================================== 화면 style ===========================================

// 아래 style은 화면 전체 modal 안에서 header, 진행 표시줄, WebView, 오류 안내를 어디에 놓을지 정합니다.
// 열린 동안의 값은 위 state와 ref가 관리합니다.
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

// =================================================================================================
