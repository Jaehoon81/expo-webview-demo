// [파일 역할] WebView 탭 하나를 화면에 띄우고, 그 탭에서 연 웹 문서와 방문 기록을 관리합니다.
// [FLOW-03] WebView가 URL을 열려고 하면 먼저 허용 여부를 확인합니다.
// 열린 뒤에는 방문 기록과 오류 화면을 관리하며, 실패하면 다시 시도하거나 첫 화면으로 돌아갑니다.
// [검증 경계] component test에서는 WebView를 가짜로 바꿉니다. 따라서 props와 callback 연결만 확인합니다.
// 실제 iOS·Android WebView의 방문 기록과 인터넷 연결은 확인하지 못합니다.
// [라이브러리] React의 ref는 값이 바뀌어도 화면을 다시 그리지 않아야 할 때 씁니다. state는 진행률과 오류처럼 화면에 보여 줄 값에 씁니다.

// ========================================== 외부 의존성 ==========================================

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
// [라이브러리] `react-native-webview`의 WebView는 휴대폰 안의 웹 화면을 React component로 사용할 수 있게 해 줍니다.
// 웹 쪽 message도 callback으로 받을 수 있습니다.
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

// =================================================================================================

// ======================================== 외부 type 계약 =========================================

export type WebTabHandle = {
  // DemoShell에는 아래 필요한 명령만 열어 줍니다. 실제 WebView 객체는 이 파일 안에서만 다룹니다.
  // [역할] `reloadInitial`은 이 탭의 방문 기록을 버리고 최초 화면을 새 WebView로 엽니다.
  reloadInitial: () => void;
  // [역할] `loadUrl`은 받은 URL을 현재 WebView에서 열거나 첫 source로 예약합니다.
  loadUrl: (url: string) => void;
  // [역할] `goBack`은 뒤로 갈 기록이 있을 때만 이동하고 성공 여부를 돌려줍니다.
  goBack: () => boolean;
  // [역할] `goForward`는 앞으로 갈 기록이 있을 때만 이동하고 성공 여부를 돌려줍니다.
  goForward: () => boolean;
  // [역할] `canGoBack`은 현재 WebView에 뒤로 갈 기록이 있는지 알려 줍니다.
  canGoBack: () => boolean;
  // [역할] `canGoForward`는 현재 WebView에 앞으로 갈 기록이 있는지 알려 줍니다.
  canGoForward: () => boolean;
  // [역할] `injectBridgeResponse`는 앱의 bridge 처리 결과를 이 탭의 웹 문서로 보냅니다.
  injectBridgeResponse: (response: BridgeResponse) => void;
};

// DemoShell이 건네는 callback입니다. URL 처리, bridge 처리, 하단 탭 표시 판단은 WebTab이 직접 결정하지 않고 DemoShell에 알립니다.
type WebTabProps = {
  tag: TabTag;
  active: boolean;
  bottomContentInset: number;
  initialSource: WebViewSource;
  // [역할] `onBridgeMessage`는 WebView message를 DemoShell에 보내고 처리 결과를 받습니다.
  onBridgeMessage: (message: string) => Promise<BridgeResponse>;
  // [역할] `onNavigationRequest`는 URL을 이 WebView에서 열어도 되는지 DemoShell에 묻습니다.
  onNavigationRequest: (url: string) => boolean;
  // [역할] `onOpenWindow`는 `window.open`의 대상 URL을 DemoShell에 알립니다.
  onOpenWindow: (url: string) => void;
  // [역할] `onScrollDirection`은 사용자가 스크롤한 방향을 DemoShell에 알립니다.
  onScrollDirection: (direction: ScrollDirection) => void;
};

// WebView 오류에서 화면에 필요한 제목과 설명만 따로 보관합니다. 원래 event 객체 전체를 오래 들고 있지 않습니다.
type LoadError = {
  title: string;
  description: string;
};

// =================================================================================================

// ======================================= WebTab component ========================================

// [역할] `WebTab`은 탭 하나의 WebView, 방문 기록, bridge, loading과 오류 화면을 함께 관리합니다.
// [문법] `forwardRef<Handle, Props>`에서 첫 type은 ref로 꺼내 쓸 명령 모양이고, 둘째 type은 이 component가 받을 props 모양입니다.
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

  // ===================================== WebView 상태와 ref ======================================

  // ----------------------------------------- 명령용 ref ------------------------------------------

  // [역할] `useRef<WebView>`는 실제 WebView 명령을 부를 객체를 화면이 다시 그려져도 계속 보관합니다.
  // [라이브러리] 이 ref를 통해 실제 WebView의 `reload`, 뒤로 가기, 앞으로 가기, JavaScript 실행 기능을 부릅니다.
  const webViewRef = useRef<WebView>(null);
  // 다음 ref들은 여러 callback이 같은 최신 값을 읽게 합니다. 값이 바뀌어도 그 이유만으로 화면을 다시 그리지는 않습니다.
  // [역할] `canGoBackRef`는 뒤로 가기 가능 여부의 최신 값을 기억합니다.
  const canGoBackRef = useRef(false);
  // [역할] `canGoForwardRef`는 앞으로 가기 가능 여부의 최신 값을 기억합니다.
  const canGoForwardRef = useRef(false);
  // [역할] `hasLoadedDocumentRef`는 JavaScript를 실행할 웹 문서가 준비됐는지 기억합니다.
  // 첫 웹 문서가 열렸는지 기억합니다. `loadUrl`은 이 값에 따라 URL을 미리 저장할지, 열린 문서에서 바로 이동할지 정합니다.
  const hasLoadedDocumentRef = useRef(false);
  // [역할] `previousScrollOffsetRef`는 다음 스크롤 방향을 계산할 직전 세로 위치를 기억합니다.
  // 직전에 스크롤한 세로 위치입니다. 다음 위치와 비교해 위로 움직였는지 아래로 움직였는지 알아냅니다.
  const previousScrollOffsetRef = useRef(0);
  // [역할] `iosErrorRecoveryRef`는 iOS가 만든 임시 scroll event를 무시할 기간을 표시합니다.
  // iOS가 오류 화면을 바꾸는 동안 스스로 만든 scroll event를 무시할지 표시합니다. 새 문서의 `onLoad`가 오면 다시 해제합니다.
  const iosErrorRecoveryRef = useRef(false);

  // -----------------------------------------------------------------------------------------------

  // ----------------------------------------- 화면 state ------------------------------------------

  // [FLOW-03 / 1단계] source와 reloadKey는 어떤 웹 문서를 열지 정합니다.
  // ref는 방문 기록과 스크롤 값을 기억하고, state는 화면에 보일 진행률과 오류를 관리합니다.
  // [역할] `useState<WebViewSource>`는 현재 WebView가 열 source를 보관하고 변경합니다.
  // [문법] `useState<WebViewSource>`는 source에 WebView가 알아듣는 값만 넣을 수 있게 type을 정합니다.
  const [source, setSource] = useState<WebViewSource>(initialSource);
  // [역할] `useState`의 reloadKey는 WebView를 완전히 새로 만들 횟수를 보관합니다.
  // reloadKey가 바뀌면 React는 같은 자리에 있는 WebView도 새 component로 만듭니다. 방문 기록까지 처음부터 다시 시작하려고 쓰는 값입니다.
  const [reloadKey, setReloadKey] = useState(0);
  // [역할] `useState`의 progress는 현재 웹 문서를 얼마나 불러왔는지 보관합니다.
  const [progress, setProgress] = useState(0);
  // [역할] `useState<LoadError | null>`은 현재 오류 안내 내용이나 오류 없음 상태를 보관합니다.
  // progress가 바뀌면 진행 표시줄을, loadError가 바뀌면 오류 안내 화면을 다시 그립니다.
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  // 하단 탭 막대에 가리지 않도록 loading 화면과 오류 화면 아래에도 같은 높이의 여백을 둡니다.
  const centeredContentInsetStyle = {
    paddingBottom: bottomContentInset + 24,
  };

  // -----------------------------------------------------------------------------------------------

  // ===============================================================================================

  // ====================================== 내부 helper 함수 =======================================

  // -------------------------------------- bridge 응답 전달 ---------------------------------------

  // [라이브러리] `useCallback`은 화면을 다시 그려도 같은 함수 객체를 이어서 쓰게 합니다. ref 명령과 Promise `.then`이 불필요하게 바뀌지 않도록 합니다.
  // [역할] `injectBridgeResponse`는 앱의 bridge 응답을 안전한 JavaScript 호출문으로 만들어 WebView에 실행시킵니다.
  const injectBridgeResponse = useCallback((response: BridgeResponse) => {
    // [FLOW-05 / 7단계] bridge 응답을 WebView 안의 JavaScript 함수에 전달합니다.
    // 따옴표나 script 문자가 실행할 코드를 망가뜨리지 않도록 두 번 문자열로 바꿉니다.
    // 첫 `JSON.stringify`는 응답 객체를 JSON 글로 만듭니다. 두 번째는 그 글을 JavaScript 문자열 안에 안전하게 넣을 수 있게 만듭니다.
    const serializedResponse = JSON.stringify(response);
    const functionArgument = JSON.stringify(serializedResponse);
    // [문법] `?.` optional chaining은 WebView가 아직 만들어지지 않았으면 `injectJavaScript`를 부르지 않고 넘어갑니다.
    webViewRef.current?.injectJavaScript(
      `window.calledByNative && window.calledByNative(${functionArgument}); true;`,
    );
  }, []);

  // -----------------------------------------------------------------------------------------------

  // ---------------------------------------- iOS 오류 복구 ----------------------------------------

  // [역할] `preserveBottomBarDuringIosErrorRecovery`는 iOS 오류 전환 중 잘못된 scroll event를 막고 하단 탭을 복구합니다.
  const preserveBottomBarDuringIosErrorRecovery = useCallback(() => {
    // iOS가 오류 화면과 다시 불러오기를 오갈 때 만든 scroll event를 잠시 무시하도록 표시합니다. 사용자가 손으로 한 스크롤과 섞이지 않게 합니다.
    if (Platform.OS !== "ios") {
      // Android에서는 이 임시 처리가 필요하지 않으므로 아래 값을 바꾸지 않습니다.
      return;
    }

    iosErrorRecoveryRef.current = true;

    if (active) {
      // 지금 보이는 탭에서 오류가 났을 때만 하단 탭 막대를 다시 보이게 합니다. 숨겨진 탭의 오류는 공통 화면을 움직이지 않습니다.
      onScrollDirection("up");
    }
  }, [active, onScrollDirection]);

  // -----------------------------------------------------------------------------------------------

  // --------------------------------------- 최초 화면 복원 ----------------------------------------

  // [역할] `reloadInitial`은 오류와 방문 기록 값을 초기화하고 최초 source의 새 WebView를 만들도록 준비합니다.
  const reloadInitial = useCallback(() => {
    // [FLOW-02 / 6단계] 사용자가 현재 탭을 다시 누르면 오류와 방문 기록 값을 지웁니다. key도 바꿔 첫 source부터 새 WebView로 엽니다.
    setLoadError(null);
    canGoBackRef.current = false;
    canGoForwardRef.current = false;
    hasLoadedDocumentRef.current = false;
    setSource(initialSource);
    // [역할] 이 state updater는 React가 가진 최신 reloadKey에 1을 더해 새 WebView 생성을 요청합니다.
    // [문법] `setReloadKey((value) => value + 1)`은 오래된 값이 아니라 React가 가진 최신 값에 1을 더합니다.
    setReloadKey((current) => current + 1);
  }, [initialSource]);

  // -----------------------------------------------------------------------------------------------

  // ===============================================================================================

  // ===================================== DemoShell 공개 명령 =====================================

  // [역할] `useImperativeHandle`의 callback은 DemoShell이 ref로 사용할 명령 객체를 만들어 줍니다.
  // [라이브러리] `useImperativeHandle`은 DemoShell의 ref에 실제 WebView 전체가 아니라 아래 명령만 넣어 줍니다.
  useImperativeHandle(
    forwardedRef,
    () => ({
      reloadInitial,
      // [역할] `loadUrl`은 문서 준비 여부에 따라 source를 바꾸거나 현재 방문 기록에 URL을 이어 엽니다.
      loadUrl(url) {
        // 새 URL로 이동하기 전에 이전 웹 문서의 오류 안내부터 지웁니다.
        setLoadError(null);

        if (hasLoadedDocumentRef.current) {
          // 웹 문서가 이미 열려 있으면 `location.assign`을 실행합니다. 같은 WebView를 쓰므로 기존 뒤로 가기 기록이 남습니다.
          const serializedUrl = JSON.stringify(url);
          // `JSON.stringify`로 URL의 따옴표를 안전하게 처리합니다. 끝의 `true;`는 WebView가 실행 결과를 분명하게 받도록 붙입니다.
          webViewRef.current?.injectJavaScript(
            `window.location.assign(${serializedUrl}); true;`,
          );
          return;
        }

        // 첫 웹 문서가 열리기 전에는 JavaScript를 실행할 대상이 없습니다. 대신 source에 URL을 넣어 WebView가 그 주소로 시작하게 합니다.
        setSource({ uri: url });
      },
      // [역할] `goBack`은 뒤로 갈 기록이 있을 때 WebView를 한 페이지 뒤로 이동시킵니다.
      goBack() {
        // 뒤로 갈 방문 기록이 있을 때만 WebView에 명령을 보냅니다. 없으면 false를 돌려 DemoShell이 앱 종료 같은 다음 처리를 할 수 있게 합니다.
        if (!canGoBackRef.current) {
          return false;
        }
        webViewRef.current?.goBack();
        return true;
      },
      // [역할] `goForward`는 앞으로 갈 기록이 있을 때 WebView를 한 페이지 앞으로 이동시킵니다.
      goForward() {
        // 앞으로 가기도 저장해 둔 방문 기록 값을 먼저 확인합니다. 갈 수 없으면 WebView에 명령을 보내지 않습니다.
        if (!canGoForwardRef.current) {
          return false;
        }
        webViewRef.current?.goForward();
        return true;
      },
      // [역할] `canGoBack`은 저장해 둔 최신 뒤로 가기 가능 여부를 바로 돌려줍니다.
      canGoBack: () => canGoBackRef.current,
      // [역할] `canGoForward`는 저장해 둔 최신 앞으로 가기 가능 여부를 바로 돌려줍니다.
      canGoForward: () => canGoForwardRef.current,
      injectBridgeResponse,
    }),
    // 아래 함수 가운데 하나가 실제로 바뀔 때만 DemoShell이 받는 ref 명령 묶음을 새로 만듭니다.
    [injectBridgeResponse, reloadInitial],
  );

  // ===============================================================================================

  // ====================================== WebView 화면 출력 ======================================

  // [역할] `WebTab`의 return은 탭 표시 상태, WebView와 오류 복구 화면을 하나의 화면 구조로 만듭니다.
  // [문법] 아래 조건식은 아직 여는 중일 때만 진행 표시줄을, 오류가 있을 때만 오류 안내를 만듭니다.
  return (
    // active가 false여도 WebView를 없애지 않습니다. 투명하게 만들고 터치만 막아 웹 문서, 방문 기록, 입력 중인 form 값을 그대로 둡니다.
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

      {/* [FLOW-03 / 2단계] [라이브러리]
          아래 props는 JavaScript, 웹 저장소, cookie, 새 창처럼 이 WebView에서 사용할 기능을 정합니다.
          `originWhitelist={["*"]}`는 모든 scheme을 먼저 이 WebView callback으로 보냅니다.
          실제로 열지는 `onShouldStartLoadWithRequest`가 돌려주는 true 또는 false로 정합니다. */}
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

        // [역할] `renderLoading`은 WebView가 문서를 여는 동안 보여 줄 loading 화면을 만듭니다.
        renderLoading={() => (
          <View style={[styles.loading, centeredContentInsetStyle]}>
            <ActivityIndicator size="large" />
            <Text style={styles.loadingText}>웹 페이지를 불러오고 있습니다.</Text>
          </View>
        )}

        // --------------------------------- load 진행과 방문 기록 ---------------------------------

        // [역할] `onLoadStart`는 새 URL을 열기 시작할 때 진행률을 처음 값으로 되돌립니다.
        onLoadStart={() => {
          // 새 주소를 열기 시작하면 이전 진행률을 0으로 되돌립니다.
          setProgress(0);
        }}
        // [역할] `onLoadProgress`는 WebView가 알려 준 진행률을 화면 state에 저장합니다.
        onLoadProgress={(event) => {
          // WebView가 보내는 0부터 1 사이 진행률을 state에 넣어 위 표시줄의 너비를 바꿉니다.
          setProgress(event.nativeEvent.progress);
        }}
        // [역할] `onLoad`는 iOS에서 새 문서가 실제로 열리면 임시 scroll 차단을 해제합니다.
        onLoad={() => {
          // [라이브러리] iOS에서 `onLoad`가 오면 새 웹 문서가 실제로 열렸다는 뜻입니다. 이때 임시로 무시하던 scroll event를 다시 받습니다.
          if (Platform.OS === "ios") {
            iosErrorRecoveryRef.current = false;
          }
        }}
        // [역할] `onLoadEnd`는 첫 문서가 준비됐다고 기록하고 진행률을 완료 값으로 바꿉니다.
        onLoadEnd={() => {
          // 첫 문서를 다 연 뒤부터 `loadUrl`은 source를 새로 만들지 않습니다. 현재 WebView 안에서 이동해 방문 기록을 이어 갑니다.
          hasLoadedDocumentRef.current = true;
          setProgress(1);
        }}
        // [역할] `onNavigationStateChange`는 뒤로·앞으로 가기 가능 여부의 최신 값을 저장합니다.
        onNavigationStateChange={(navigationState) => {
          // [FLOW-03 / 5단계] WebView가 알려 준 뒤로 가기·앞으로 가기 가능 여부를 ref에 저장합니다. toolbar와 Android back은 이 값을 바로 확인합니다.
          canGoBackRef.current = navigationState.canGoBack;
          canGoForwardRef.current = navigationState.canGoForward;
        }}

        // -----------------------------------------------------------------------------------------

        // ----------------------------------- bridge와 URL 이동 -----------------------------------

        // [역할] `onMessage`는 웹 문서의 bridge 요청을 DemoShell로 보내고 완료된 응답을 다시 WebView에 넣습니다.
        onMessage={(event) => {
          // [FLOW-05 / 2단계] WebView가 보낸 문자열 message를 DemoShell에 전달합니다. 처리가 끝난 응답은 다시 이 탭의 WebView로 보냅니다.
          // [문법] 앞의 `void`는 이 event callback이 Promise를 밖으로 돌려주지 않는다는 뜻입니다. `.then`은 응답을 받은 뒤에만 WebView로 보내게 합니다.
          void onBridgeMessage(event.nativeEvent.data).then(
            injectBridgeResponse,
          );
        }}
        // [역할] `onShouldStartLoadWithRequest`는 URL을 열어도 되는지 DemoShell의 판단 결과를 WebView에 돌려줍니다.
        onShouldStartLoadWithRequest={(request) =>
          // 이 파일은 URL을 직접 판단하지 않습니다. DemoShell이 검사한 뒤 알려 주는 true 또는 false만 WebView에 돌려줍니다.
          onNavigationRequest(request.url)
        }
        // [역할] `onOpenWindow`는 웹 문서가 새 창으로 열려는 URL을 DemoShell에 전달합니다.
        onOpenWindow={(event) => {
          // [FLOW-04 / 관련 코드] 웹 페이지가 `window.open`을 부르면 여기서 새 화면을 만들지 않습니다. URL과 현재 탭 번호를 DemoShell에 넘깁니다.
          onOpenWindow(event.nativeEvent.targetUrl);
        }}

        // -----------------------------------------------------------------------------------------

        // ----------------------------------- 스크롤과 하단 탭 ------------------------------------

        // [역할] `onScroll`은 스크롤 방향을 계산하고 현재 탭의 유효한 움직임만 DemoShell에 알립니다.
        onScroll={(event) => {
          // scroll event에서 현재 세로 위치만 꺼냅니다. 직전 위치와 함께 계산 함수에 보내 움직인 방향을 구합니다.
          const currentOffset = event.nativeEvent.contentOffset.y;
          const direction = getScrollDirection(
            previousScrollOffsetRef.current,
            currentOffset,
          );
          previousScrollOffsetRef.current = currentOffset;

          // iOS에서는 오류 안내가 보이거나 다시 여는 중이면 WebView가 스스로 만든 scroll event로 봅니다.
          const ignoreIosErrorScroll =
            Platform.OS === "ios" &&
            (loadError !== null || iosErrorRecoveryRef.current);

          if (active && direction && !ignoreIosErrorScroll) {
            // [FLOW-08 / 2단계] 지금 보이는 WebView에서 사용자가 충분히 스크롤했을 때만 그 방향을 DemoShell에 알립니다.
            onScrollDirection(direction);
          }
        }}

        // -----------------------------------------------------------------------------------------

        // --------------------------------------- 오류 감지 ---------------------------------------

        // [역할] `onError`는 WebView가 URL을 열지 못한 내용을 앱 오류 화면에 저장합니다.
        onError={(event) => {
          // [FLOW-03 / 6단계] WebView가 주소를 열지 못하면 기본 오류 페이지 대신 앱의 오류 안내에 쓸 내용을 저장합니다. iOS에서는 하단 탭 막대도 다시 보이게 합니다.
          // [FLOW-09 / 관련 코드] 위쪽 offline banner는 휴대폰 연결 상태만 알려 줍니다. 실제 웹 주소 열기 실패 내용은 이 탭이 따로 보관합니다.
          event.preventDefault();
          preserveBottomBarDuringIosErrorRecovery();
          setLoadError({
            title: "웹 페이지를 열 수 없습니다.",
            description: event.nativeEvent.description,
          });
        }}
        // [역할] `onHttpError`는 HTTP 상태 코드 오류를 같은 앱 오류 화면 모양으로 저장합니다.
        onHttpError={(event) => {
          // HTTP 상태 코드 오류도 같은 오류 안내 화면에 보여 줍니다. iOS에서 scroll event를 잠시 무시하는 처리도 함께 시작합니다.
          preserveBottomBarDuringIosErrorRecovery();
          setLoadError({
            title: `HTTP ${event.nativeEvent.statusCode} 오류`,
            description:
              event.nativeEvent.description || "서버 요청에 실패했습니다.",
          });
        }}

        // -----------------------------------------------------------------------------------------

      />

      {loadError ? (
        <View
          accessibilityRole="alert"
          style={[styles.errorOverlay, centeredContentInsetStyle]}
        >
          <Text style={styles.errorTitle}>{loadError.title}</Text>
          <Text style={styles.errorDescription}>{loadError.description}</Text>
          <View style={styles.errorActions}>
            {/* [FLOW-03 / 7단계]
                다시 시도는 실패한 현재 URL을 다시 엽니다.
                초기 화면은 방문 기록을 버리고 이 탭의 첫 source부터 새로 엽니다. */}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                // [역할] 다시 시도 callback은 오류를 지우고 현재 WebView URL을 다시 불러옵니다.
                // [FLOW-09 / 5단계] 인터넷 연결이 돌아와도 자동으로 다시 열지 않습니다. 사용자가 이 버튼을 눌렀을 때 현재 URL을 다시 엽니다.
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
                // [역할] 초기 화면 callback은 방문 기록을 버리고 이 탭의 최초 source로 돌아갑니다.
                // 초기 화면 버튼도 iOS의 임시 scroll event를 먼저 막습니다. 그 뒤 WebView key를 바꿔 새 WebView를 만듭니다.
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

  // ===============================================================================================

});

// =================================================================================================

// ========================================== 화면 style ===========================================

// 아래 style은 탭, 진행 표시줄, 오류 안내를 어디에 놓을지만 정합니다. 웹 문서와 방문 기록은 위의 state와 ref가 관리합니다.
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

// =================================================================================================
