// [파일 역할] full-screen popup이 modal 내부 SafeAreaProvider와 top-only inset 경계를 만드는지 구조 검증합니다.
// [검증 경계] WebView는 View 대역이며 실제 Modal native tree·page load·history·back·safe-area pixel 결과는 실기기 증거가 필요합니다.
import { render } from "@testing-library/react-native";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { PopupWebView } from "@/src/components/PopupWebView";

jest.mock("react-native-webview", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View: MockView } = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );

  return {
    // WebView의 native 구현 없이 받은 props만 host View에 노출합니다.
    WebView: React.forwardRef(function MockWebView(props, _ref) {
      return React.createElement(MockView, props);
    }),
  };
});

describe("PopupWebView", () => {
  it("popup header에 top safe area만 적용한다", async () => {
    const view = await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, right: 0, bottom: 34, left: 0 },
        }}
      >
        <View>
          <PopupWebView
            classifyNavigation={() => ({ type: "allow" })}
            networkOffline={false}
            onClose={jest.fn()}
            onDeepLink={jest.fn()}
            url="https://www.bing.com"
          />
        </View>
      </SafeAreaProvider>,
    );

    const safeAreaViews = view.container.queryAll(
      // SafeAreaView가 edges={["top"]}을 native edge mode props로 변환한 결과를 찾습니다.
      (instance) =>
        instance.props.edges?.top === "additive" &&
        instance.props.edges?.right === "off" &&
        instance.props.edges?.bottom === "off" &&
        instance.props.edges?.left === "off",
    );
    const modalSafeAreaProviders = view.container.queryAll(
      // root test provider와 popup-local provider 두 개가 모두 존재하는지 provider callback으로 식별합니다.
      (instance) => typeof instance.props.onInsetsChange === "function",
    );

    expect(safeAreaViews).toHaveLength(1);
    expect(modalSafeAreaProviders).toHaveLength(2);
  });
});
