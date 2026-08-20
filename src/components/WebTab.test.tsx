// [파일 역할] 탭을 숨겨도 WebView가 남는지 확인합니다. URL 열기, 방문 기록 명령, 오류 화면 여백, iOS·Android 오류 복구 차이도 검사합니다.
// [검증 경계] `react-native-webview`를 가짜 View로 바꿉니다.
// props, callback, 새로 만들어지는 시점만 확인하며 실제 웹 페이지와 방문 기록은 실기기에서 확인해야 합니다.
// [라이브러리] Testing Library로 화면과 event를 다룹니다.
// Jest의 가짜 WebView는 받은 props, callback, ref 명령, 만들어지고 사라진 횟수를 기록합니다.

// ========================================== 외부 의존성 ==========================================

import { createRef, type Ref } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native";
import { Platform, StyleSheet } from "react-native";

import { WebTab, type WebTabHandle } from "@/src/components/WebTab";

// =================================================================================================

// ====================================== test mock과 helper =======================================

// 가짜 함수 네 개가 WebView가 만들어지고 사라진 횟수와 실제 코드가 보낸 명령을 기록합니다.
const mockWebViewDidMount = jest.fn();
const mockWebViewDidUnmount = jest.fn();
const mockInjectJavaScript = jest.fn();
const mockReload = jest.fn();

// [라이브러리] 실제 WebView 대신 기본 View를 돌려줍니다. 다만 실제 코드가 쓰는 ref 함수와 시작·정리 시점은 같은 모양으로 만듭니다.
// [역할] mock factory callback은 실제 WebView 대신 props·ref 명령·mount 횟수를 기록할 가짜 module을 만듭니다.
jest.mock("react-native-webview", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );

  return {
    // [문법] 가짜 `forwardRef`도 받은 ref를 `useImperativeHandle`에 연결합니다. 화면용 View와 밖에서 부를 명령을 나눕니다.
    WebView: React.forwardRef(function MockWebView(props, ref) {
      // [역할] `MockWebView`는 실제 웹 엔진 없이 WebView props와 공개 명령, mount lifecycle을 흉내 냅니다.
      // 실제 WebTab이 부르는 `injectJavaScript`와 `reload`만 가짜 함수로 제공합니다.
      React.useImperativeHandle(
        ref,
        // [역할] `useImperativeHandle` factory는 WebTab이 부를 JavaScript 주입과 reload mock 명령을 만듭니다.
        () => ({
          injectJavaScript: mockInjectJavaScript,
          reload: mockReload,
        }),
        [],
      );
      // [역할] `useEffect` callback은 가짜 WebView mount를 기록하고 unmount 기록 함수를 cleanup으로 등록합니다.
      React.useEffect(() => {
        // 가짜 WebView가 만들어지면 첫 함수를 부릅니다. 사라질 때는 반환한 정리 함수가 두 번째 기록을 남깁니다.
        mockWebViewDidMount();
        return mockWebViewDidUnmount;
      }, []);

      return React.createElement(View, props);
    }),
  };
});

// 모든 test가 반복해서 주는 WebTab props를 이 함수에 모읍니다. 각 test에서 바꿔 볼 값만 parameter로 받습니다.
// [역할] `renderWebTab`은 공통 가짜 props와 test별 active·ref·아래 여백으로 `WebTab` 화면을 만듭니다.
function renderWebTab(
  active: boolean,
  onScrollDirection = jest.fn(),
  forwardedRef?: Ref<WebTabHandle>,
  bottomContentInset = 0,
) {
  // 각 test는 active, 스크롤 기록 함수, ref, 아래 여백만 바꿉니다. 나머지 props는 같은 가짜 함수를 씁니다.
  return (
    <WebTab
      active={active}
      bottomContentInset={bottomContentInset}
      initialSource={{ uri: "https://example.com" }}
      onBridgeMessage={jest.fn().mockResolvedValue({})}
      // [역할] navigation mock callback은 이 test들의 모든 WebView URL 이동을 허용합니다.
      onNavigationRequest={jest.fn(() => true)}
      onOpenWindow={jest.fn()}
      onScrollDirection={onScrollDirection}
      ref={forwardedRef}
      tag="f1"
    />
  );
}

// Android URL 명령 test는 실제 DemoShell policy와 같은 boolean callback을 직접 관찰해야 하므로 별도 helper로 만듭니다.
// [역할] `renderWebTabWithNavigationPolicy`는 test가 지정한 URL 허용 함수를 ref 명령과 함께 WebTab에 전달합니다.
function renderWebTabWithNavigationPolicy(
  onNavigationRequest: (url: string) => boolean,
  forwardedRef: Ref<WebTabHandle>,
) {
  return (
    <WebTab
      active
      bottomContentInset={0}
      initialSource={{ uri: "https://example.com" }}
      onBridgeMessage={jest.fn().mockResolvedValue({})}
      onNavigationRequest={onNavigationRequest}
      onOpenWindow={jest.fn()}
      onScrollDirection={jest.fn()}
      ref={forwardedRef}
      tag="f1"
    />
  );
}

// =================================================================================================

// ========================================== test cases ===========================================

// [역할] `describe` callback은 WebTab mount·scroll·URL load·오류 복구 계약 test를 한 묶음으로 실행합니다.
describe("WebTab", () => {
  // [역할] `beforeEach` callback은 각 test 전에 네 WebView mock 함수의 이전 호출 기록을 지웁니다.
  beforeEach(() => {
    // 같은 가짜 함수 객체는 유지하되, 각 test 전에 이전 호출 기록만 지웁니다.
    mockWebViewDidMount.mockClear();
    mockWebViewDidUnmount.mockClear();
    mockInjectJavaScript.mockClear();
    mockReload.mockClear();
  });

  // [역할] 이 test callback은 비활성 탭이 unmount되지 않고 표시와 입력만 꺼지는지 확인합니다.
  it("비활성 탭도 native hierarchy에 유지하되 투명하게 표시한다", async () => {
    const view = await render(renderWebTab(false));
    const inactiveTab = screen.getByTestId("web-tab-f1", {
      includeHiddenElements: true,
    });
    // [라이브러리] `StyleSheet.flatten`은 style 배열을 한 객체로 합칩니다. 최종 opacity와 display 값을 쉽게 비교할 수 있습니다.
    const inactiveStyle = StyleSheet.flatten(inactiveTab.props.style);

    expect(inactiveStyle.display).toBeUndefined();
    expect(inactiveStyle.zIndex).toBeUndefined();
    expect(inactiveStyle.opacity).toBe(0);
    expect(inactiveTab.props.collapsable).toBe(false);
    expect(inactiveTab.props.pointerEvents).toBe("none");

    // 같은 화면에서 active만 true로 바꿔 다시 보여 줍니다. WebView를 없앴다가 새로 만들지 않는지 확인합니다.
    // 가짜 WebView가 만들어진 횟수가 그대로인지 확인해 화면 표시와 터치만 바뀌었다는 점을 검사합니다.
    await view.rerender(renderWebTab(true));

    const activeTab = screen.getByTestId("web-tab-f1");
    const activeStyle = StyleSheet.flatten(activeTab.props.style);

    expect(activeStyle.opacity).toBeUndefined();
    expect(activeTab.props.pointerEvents).toBe("auto");
  });

  // [역할] 이 test callback은 비활성 WebView scroll은 무시하고 활성 탭 방향만 부모에 전달하는지 확인합니다.
  it("active 탭의 scroll만 하단 탭 visibility에 전달한다", async () => {
    const onScrollDirection = jest.fn();
    const view = await render(renderWebTab(false, onScrollDirection));
    const webView = screen.getByTestId("web-view-f1", {
      includeHiddenElements: true,
    });

    // [라이브러리] 실제 scroll callback과 같은 `nativeEvent.contentOffset` 모양을 가짜 View에 전달합니다.
    await fireEvent.scroll(webView, {
      nativeEvent: { contentOffset: { y: 20 } },
    });
    expect(onScrollDirection).not.toHaveBeenCalled();

    await view.rerender(renderWebTab(true, onScrollDirection));
    await fireEvent.scroll(screen.getByTestId("web-view-f1"), {
      nativeEvent: { contentOffset: { y: 0 } },
    });

    expect(onScrollDirection).toHaveBeenCalledWith("up");
  });

  // [역할] 이 test callback은 첫 document가 열리기 전 `loadUrl`이 새 source로 예약되는지 확인합니다.
  it("첫 document load 전 loadUrl은 source에 예약한다", async () => {
    // `onLoadEnd` 전에는 JavaScript를 실행할 웹 문서가 없습니다. 이때 ref의 `loadUrl`을 부르는 경우를 만듭니다.
    // [라이브러리] `createRef`를 사용해 실제 DemoShell처럼 WebTab의 명령을 부릅니다.
    const webTabRef = createRef<WebTabHandle>();
    await render(renderWebTab(true, jest.fn(), webTabRef));

    expect(mockWebViewDidMount).toHaveBeenCalledTimes(1);

    // `act` 안에서 ref 명령을 불러 source 변경이 화면에 반영된 뒤 결과를 확인합니다.
    // [역할] 첫 `act` callback은 document load 전 공개 `loadUrl` 명령을 실행해 source 변경을 반영합니다.
    await act(() => {
      webTabRef.current?.loadUrl("https://m.naver.com/target");
    });

    expect(screen.getByTestId("web-view-f1").props.source).toEqual({
      uri: "https://m.naver.com/target",
    });
    expect(mockWebViewDidMount).toHaveBeenCalledTimes(1);
    expect(mockWebViewDidUnmount).not.toHaveBeenCalled();
    expect(mockInjectJavaScript).not.toHaveBeenCalled();
  });

  // [역할] 이 test callback은 첫 load 뒤 `loadUrl`이 기존 history를 잇고 초기화 명령만 WebView를 다시 만드는지 확인합니다.
  it("load 완료 후 반복 loadUrl은 기존 WebView의 history에 이어서 탐색한다", async () => {
    // [검증 경계] 기존 `location.assign` 계약은 iOS JavaScript branch로 고정해 Android native source 분기와 따로 확인합니다.
    jest.replaceProperty(Platform, "OS", "ios");
    const webTabRef = createRef<WebTabHandle>();
    await render(renderWebTab(true, jest.fn(), webTabRef));
    const webView = screen.getByTestId("web-view-f1");

    // 가짜 WebView의 `onLoadEnd`를 직접 불러 첫 웹 문서가 열린 상태로 바꿉니다.
    await fireEvent(webView, "loadEnd");

    // 같은 URL을 두 번 열어도 source를 바꾸지 않고 `location.assign`을 두 번 실행해야 합니다. 그래야 같은 WebView 방문 기록에 이어집니다.
    // [역할] 둘째 `act` callback은 load 뒤 같은 WebView에서 URL 이동 명령을 두 번 실행합니다.
    await act(() => {
      webTabRef.current?.loadUrl("https://m.naver.com/target");
      webTabRef.current?.loadUrl("https://m.naver.com/target");
    });

    expect(mockInjectJavaScript).toHaveBeenNthCalledWith(
      1,
      'window.location.assign("https://m.naver.com/target"); true;',
    );
    expect(mockInjectJavaScript).toHaveBeenNthCalledWith(
      2,
      'window.location.assign("https://m.naver.com/target"); true;',
    );
    expect(screen.getByTestId("web-view-f1").props.source).toEqual({
      uri: "https://example.com",
    });
    expect(mockWebViewDidMount).toHaveBeenCalledTimes(1);
    expect(mockWebViewDidUnmount).not.toHaveBeenCalled();

    // [역할] 셋째 `act` callback은 공개 초기화 명령을 실행해 새 WebView mount를 요청합니다.
    await act(() => {
      // `reloadInitial`은 key를 바꿔 WebView를 새로 만드는 명령입니다. 그래서 이때만 만들어진 횟수가 늘어야 합니다.
      webTabRef.current?.reloadInitial();
    });

    expect(mockWebViewDidMount).toHaveBeenCalledTimes(2);
    expect(mockWebViewDidUnmount).toHaveBeenCalledTimes(1);
  });

  // [역할] 이 test callback은 Android의 허용된 다른 URL이 policy를 거쳐 같은 WebView의 native source로 전달되는지 확인합니다.
  it("Android load 완료 후 다른 URL은 policy를 거쳐 native source로 연다", async () => {
    // 실제 Android WebView 대신 JavaScript 분기와 React source 변경, mount 수명만 확인합니다.
    jest.replaceProperty(Platform, "OS", "android");
    // [역할] 허용 policy mock callback은 다른 HTTPS URL을 native source로 계속 열 수 있게 true를 돌려줍니다.
    const onNavigationRequest = jest.fn(() => true);
    const webTabRef = createRef<WebTabHandle>();
    await render(
      renderWebTabWithNavigationPolicy(onNavigationRequest, webTabRef),
    );
    let webView = screen.getByTestId("web-view-f1");

    // native callback이 현재 URL과 document 준비 완료를 알린 뒤 DemoShell과 같은 ref 명령을 실행합니다.
    await fireEvent(webView, "navigationStateChange", {
      canGoBack: false,
      canGoForward: false,
      url: "https://example.com",
    });
    await fireEvent(webView, "loadEnd");

    // [역할] Android 다른 URL `act` callback은 공개 ref 명령의 policy 확인과 source 갱신을 한 번에 반영합니다.
    await act(() => {
      webTabRef.current?.loadUrl("https://m.nate.com");
    });
    webView = screen.getByTestId("web-view-f1");

    expect(onNavigationRequest).toHaveBeenCalledWith("https://m.nate.com");
    expect(webView.props.source).toEqual({
      uri: "https://m.nate.com",
      method: "GET",
    });
    expect(mockWebViewDidMount).toHaveBeenCalledTimes(1);
    expect(mockWebViewDidUnmount).not.toHaveBeenCalled();
    expect(mockInjectJavaScript).not.toHaveBeenCalled();
    expect(mockReload).not.toHaveBeenCalled();
  });

  // [역할] 이 test callback은 native Back 뒤 React source와 현재 URL이 달라져도 같은 target 재호출이 새 source prop으로 전달되는지 확인합니다.
  it("Android Back 뒤 같은 target 재호출도 native source를 다시 전달한다", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    // [역할] 반복 호출 허용 policy mock callback은 두 Nate 요청이 모두 Android source 분기까지 진행되게 합니다.
    const onNavigationRequest = jest.fn(() => true);
    const webTabRef = createRef<WebTabHandle>();
    await render(
      renderWebTabWithNavigationPolicy(onNavigationRequest, webTabRef),
    );
    let webView = screen.getByTestId("web-view-f1");

    await fireEvent(webView, "navigationStateChange", {
      canGoBack: false,
      canGoForward: false,
      url: "https://example.com",
    });
    await fireEvent(webView, "loadEnd");

    // [역할] 첫 URL 명령 `act` callback은 Nate를 명시적 GET source로 전달합니다.
    await act(() => {
      webTabRef.current?.loadUrl("https://m.nate.com");
    });
    webView = screen.getByTestId("web-view-f1");
    expect(webView.props.source).toEqual({
      uri: "https://m.nate.com",
      method: "GET",
    });

    // native history가 Naver로 돌아왔지만 React source는 Nate인 실기기 상태를 callback으로 재현합니다.
    await fireEvent(webView, "navigationStateChange", {
      canGoBack: false,
      canGoForward: true,
      url: "https://example.com",
    });

    // [역할] 두 번째 URL 명령 `act` callback은 같은 Nate를 기본 GET 모양으로 바꿔 native source setter를 다시 호출하게 합니다.
    await act(() => {
      webTabRef.current?.loadUrl("https://m.nate.com");
    });

    expect(onNavigationRequest).toHaveBeenNthCalledWith(
      1,
      "https://m.nate.com",
    );
    expect(onNavigationRequest).toHaveBeenNthCalledWith(
      2,
      "https://m.nate.com",
    );
    expect(screen.getByTestId("web-view-f1").props.source).toEqual({
      uri: "https://m.nate.com",
    });
    expect(mockWebViewDidMount).toHaveBeenCalledTimes(1);
    expect(mockWebViewDidUnmount).not.toHaveBeenCalled();
    expect(mockInjectJavaScript).not.toHaveBeenCalled();
    expect(mockReload).not.toHaveBeenCalled();
  });

  // [역할] 이 test callback은 Android app-initiated URL도 기존 navigation policy가 거부하면 아무 load 명령도 만들지 않는지 확인합니다.
  it("Android loadUrl은 policy가 거부한 URL을 source와 history에 넣지 않는다", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    // [역할] 차단 policy mock callback은 HTTP URL을 거부하는 DemoShell 결과처럼 false를 돌려줍니다.
    const onNavigationRequest = jest.fn(() => false);
    const webTabRef = createRef<WebTabHandle>();
    await render(
      renderWebTabWithNavigationPolicy(onNavigationRequest, webTabRef),
    );
    const webView = screen.getByTestId("web-view-f1");

    await fireEvent(webView, "navigationStateChange", {
      canGoBack: false,
      canGoForward: false,
      url: "https://example.com",
    });
    await fireEvent(webView, "loadEnd");

    // [역할] Android 차단 URL `act` callback은 공개 ref 명령이 source나 native 명령을 만들지 않는지 확인할 입력을 보냅니다.
    await act(() => {
      webTabRef.current?.loadUrl("http://m.naver.com");
    });

    expect(onNavigationRequest).toHaveBeenCalledWith("http://m.naver.com");
    expect(screen.getByTestId("web-view-f1").props.source).toEqual({
      uri: "https://example.com",
    });
    expect(mockInjectJavaScript).not.toHaveBeenCalled();
    expect(mockReload).not.toHaveBeenCalled();
  });

  // [역할] 이 test callback은 Android의 현재 URL 재호출이 RNWV source no-op 대신 명시적 reload 한 번으로 이어지는지 확인합니다.
  it("Android loadUrl은 현재 URL과 같으면 native reload를 실행한다", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    // [역할] 동일 URL 허용 policy mock callback은 reload 분기까지 진행할 수 있게 true를 돌려줍니다.
    const onNavigationRequest = jest.fn(() => true);
    const webTabRef = createRef<WebTabHandle>();
    await render(
      renderWebTabWithNavigationPolicy(onNavigationRequest, webTabRef),
    );
    const webView = screen.getByTestId("web-view-f1");

    await fireEvent(webView, "navigationStateChange", {
      canGoBack: true,
      canGoForward: false,
      url: "https://example.com",
    });
    await fireEvent(webView, "loadEnd");

    // [역할] Android 동일 URL `act` callback은 공개 ref 명령을 불러 RNWV same-source no-op 대신 reload를 선택하게 합니다.
    await act(() => {
      webTabRef.current?.loadUrl("https://example.com");
    });

    expect(onNavigationRequest).toHaveBeenCalledWith("https://example.com");
    expect(mockReload).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("web-view-f1").props.source).toEqual({
      uri: "https://example.com",
    });
    expect(mockWebViewDidMount).toHaveBeenCalledTimes(1);
    expect(mockWebViewDidUnmount).not.toHaveBeenCalled();
    expect(mockInjectJavaScript).not.toHaveBeenCalled();
  });

  // [역할] 이 test callback은 loading과 오류 화면이 같은 하단 탭 여백을 사용해 중앙에 놓이는지 확인합니다.
  it("오류 화면은 하단 탭 inset을 제외한 영역의 중앙에 표시한다", async () => {
    // Platform 값만 Android로 바꿉니다. 실제 Android WebView를 실행하지 않고 JavaScript 조건문만 그 경우로 들어갑니다.
    jest.replaceProperty(Platform, "OS", "android");
    await render(renderWebTab(true, jest.fn(), undefined, 80));
    const preventDefault = jest.fn();
    const webView = screen.getByTestId("web-view-f1");
    // WebView가 받은 `renderLoading` 함수를 직접 불러 loading 화면에도 같은 아래 여백이 있는지 확인합니다.
    const loadingStyle = StyleSheet.flatten(
      webView.props.renderLoading().props.style,
    );

    // 실제 WebView 오류 event와 같은 `preventDefault`와 description을 오류 callback에 전달합니다.
    await fireEvent(webView, "error", {
      nativeEvent: { description: "네트워크에 연결할 수 없습니다." },
      preventDefault,
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(loadingStyle).toMatchObject({ padding: 24, paddingBottom: 104 });
    expect(
      StyleSheet.flatten(
        screen.getByText("웹 페이지를 열 수 없습니다.").parent?.props.style,
      ),
    ).toMatchObject({ padding: 24, paddingBottom: 104 });
  });

  // [역할] 이 test callback은 iOS 오류 복구 중 합성 scroll을 무시하고 성공 load 뒤 다시 받는지 확인합니다.
  it("iOS 오류 복구 중에는 합성 scroll로 하단 탭을 숨기지 않는다", async () => {
    // `Platform.OS`만 iOS로 바꿔 WebTab 안의 iOS 조건문을 실행합니다.
    jest.replaceProperty(Platform, "OS", "ios");
    const onScrollDirection = jest.fn();
    await render(renderWebTab(true, onScrollDirection));
    let webView = screen.getByTestId("web-view-f1");

    await fireEvent(webView, "error", {
      nativeEvent: { description: "네트워크에 연결할 수 없습니다." },
      preventDefault: jest.fn(),
    });
    expect(onScrollDirection).toHaveBeenLastCalledWith("up");

    // 오류가 나자마자 기록된 `up`은 먼저 지웁니다. 다시 시도한 뒤 들어오는 새 scroll event만 따로 확인합니다.
    onScrollDirection.mockClear();
    await fireEvent.press(screen.getByRole("button", { name: "다시 시도" }));
    expect(mockReload).toHaveBeenCalledTimes(1);
    expect(onScrollDirection).toHaveBeenLastCalledWith("up");

    onScrollDirection.mockClear();
    await fireEvent.scroll(webView, {
      nativeEvent: { contentOffset: { y: 20 } },
    });
    expect(onScrollDirection).not.toHaveBeenCalled();

    await fireEvent(webView, "error", {
      nativeEvent: { description: "네트워크에 연결할 수 없습니다." },
      preventDefault: jest.fn(),
    });
    onScrollDirection.mockClear();

    await fireEvent.press(screen.getByRole("button", { name: "초기 화면" }));
    expect(mockWebViewDidMount).toHaveBeenCalledTimes(2);
    expect(onScrollDirection).toHaveBeenLastCalledWith("up");

    onScrollDirection.mockClear();
    // 초기 화면 명령은 key를 바꿔 새 WebView를 만듭니다. 따라서 새로 만들어진 가짜 View를 다시 찾습니다.
    webView = screen.getByTestId("web-view-f1");
    await fireEvent.scroll(webView, {
      nativeEvent: { contentOffset: { y: 40 } },
    });
    expect(onScrollDirection).not.toHaveBeenCalled();

    await fireEvent(webView, "load");
    // 성공한 `onLoad` 뒤에는 임시 scroll 무시가 끝납니다. 같은 scroll event가 다시 실제 방향으로 전달되는지 확인합니다.
    await fireEvent.scroll(webView, {
      nativeEvent: { contentOffset: { y: 60 } },
    });
    expect(onScrollDirection).toHaveBeenCalledWith("down");
  });

  // [역할] 이 test callback은 Android 오류 재시도 뒤 scroll 방향 전달이 iOS 차단 없이 유지되는지 확인합니다.
  it("Android 오류 재시도는 기존 scroll visibility 경로를 유지한다", async () => {
    // 같은 오류, 다시 시도, 스크롤 순서를 Android에서도 실행합니다. iOS에서만 필요한 scroll 무시가 Android에 적용되지 않는지 확인합니다.
    jest.replaceProperty(Platform, "OS", "android");
    const onScrollDirection = jest.fn();
    await render(renderWebTab(true, onScrollDirection));
    const webView = screen.getByTestId("web-view-f1");

    await fireEvent(webView, "error", {
      nativeEvent: { description: "네트워크에 연결할 수 없습니다." },
      preventDefault: jest.fn(),
    });
    await fireEvent.press(screen.getByRole("button", { name: "다시 시도" }));

    expect(mockReload).toHaveBeenCalledTimes(1);
    expect(onScrollDirection).not.toHaveBeenCalled();

    await fireEvent.scroll(webView, {
      nativeEvent: { contentOffset: { y: 20 } },
    });
    expect(onScrollDirection).toHaveBeenCalledWith("down");
  });
});

// =================================================================================================
