import { createRef, type Ref } from "react";
import {
  act,
  fireEvent,
  render,
  screen,
} from "@testing-library/react-native";
import { Platform, StyleSheet } from "react-native";

import { WebTab, type WebTabHandle } from "@/src/components/WebTab";

const mockWebViewDidMount = jest.fn();
const mockWebViewDidUnmount = jest.fn();
const mockInjectJavaScript = jest.fn();
const mockReload = jest.fn();

jest.mock("react-native-webview", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );

  return {
    WebView: React.forwardRef(function MockWebView(props, ref) {
      React.useImperativeHandle(
        ref,
        () => ({
          injectJavaScript: mockInjectJavaScript,
          reload: mockReload,
        }),
        [],
      );
      React.useEffect(() => {
        mockWebViewDidMount();
        return mockWebViewDidUnmount;
      }, []);

      return React.createElement(View, props);
    }),
  };
});

function renderWebTab(
  active: boolean,
  onScrollDirection = jest.fn(),
  forwardedRef?: Ref<WebTabHandle>,
  bottomContentInset = 0,
) {
  return (
    <WebTab
      active={active}
      bottomContentInset={bottomContentInset}
      initialSource={{ uri: "https://example.com" }}
      onBridgeMessage={jest.fn().mockResolvedValue({})}
      onNavigationRequest={jest.fn(() => true)}
      onOpenWindow={jest.fn()}
      onScrollDirection={onScrollDirection}
      ref={forwardedRef}
      tag="f1"
    />
  );
}

describe("WebTab", () => {
  beforeEach(() => {
    mockWebViewDidMount.mockClear();
    mockWebViewDidUnmount.mockClear();
    mockInjectJavaScript.mockClear();
    mockReload.mockClear();
  });

  it("비활성 탭도 native hierarchy에 유지하되 투명하게 표시한다", async () => {
    const view = await render(renderWebTab(false));
    const inactiveTab = screen.getByTestId("web-tab-f1", {
      includeHiddenElements: true,
    });
    const inactiveStyle = StyleSheet.flatten(inactiveTab.props.style);

    expect(inactiveStyle.display).toBeUndefined();
    expect(inactiveStyle.zIndex).toBeUndefined();
    expect(inactiveStyle.opacity).toBe(0);
    expect(inactiveTab.props.collapsable).toBe(false);
    expect(inactiveTab.props.pointerEvents).toBe("none");

    await view.rerender(renderWebTab(true));

    const activeTab = screen.getByTestId("web-tab-f1");
    const activeStyle = StyleSheet.flatten(activeTab.props.style);

    expect(activeStyle.opacity).toBeUndefined();
    expect(activeTab.props.pointerEvents).toBe("auto");
  });

  it("active 탭의 scroll만 하단 탭 visibility에 전달한다", async () => {
    const onScrollDirection = jest.fn();
    const view = await render(renderWebTab(false, onScrollDirection));
    const webView = screen.getByTestId("web-view-f1", {
      includeHiddenElements: true,
    });

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

  it("첫 document load 전 loadUrl은 source에 예약한다", async () => {
    const webTabRef = createRef<WebTabHandle>();
    await render(renderWebTab(true, jest.fn(), webTabRef));

    expect(mockWebViewDidMount).toHaveBeenCalledTimes(1);

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

  it("load 완료 후 반복 loadUrl은 기존 WebView의 history에 이어서 탐색한다", async () => {
    const webTabRef = createRef<WebTabHandle>();
    await render(renderWebTab(true, jest.fn(), webTabRef));
    const webView = screen.getByTestId("web-view-f1");

    await fireEvent(webView, "loadEnd");

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

    await act(() => {
      webTabRef.current?.reloadInitial();
    });

    expect(mockWebViewDidMount).toHaveBeenCalledTimes(2);
    expect(mockWebViewDidUnmount).toHaveBeenCalledTimes(1);
  });

  it("오류 화면은 하단 탭 inset을 제외한 영역의 중앙에 표시한다", async () => {
    jest.replaceProperty(Platform, "OS", "android");
    await render(renderWebTab(true, jest.fn(), undefined, 80));
    const preventDefault = jest.fn();
    const webView = screen.getByTestId("web-view-f1");
    const loadingStyle = StyleSheet.flatten(
      webView.props.renderLoading().props.style,
    );

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

  it("iOS 오류 복구 중에는 합성 scroll로 하단 탭을 숨기지 않는다", async () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const onScrollDirection = jest.fn();
    await render(renderWebTab(true, onScrollDirection));
    let webView = screen.getByTestId("web-view-f1");

    await fireEvent(webView, "error", {
      nativeEvent: { description: "네트워크에 연결할 수 없습니다." },
      preventDefault: jest.fn(),
    });
    expect(onScrollDirection).toHaveBeenLastCalledWith("up");

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
    webView = screen.getByTestId("web-view-f1");
    await fireEvent.scroll(webView, {
      nativeEvent: { contentOffset: { y: 40 } },
    });
    expect(onScrollDirection).not.toHaveBeenCalled();

    await fireEvent(webView, "load");
    await fireEvent.scroll(webView, {
      nativeEvent: { contentOffset: { y: 60 } },
    });
    expect(onScrollDirection).toHaveBeenCalledWith("down");
  });

  it("Android 오류 재시도는 기존 scroll visibility 경로를 유지한다", async () => {
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
