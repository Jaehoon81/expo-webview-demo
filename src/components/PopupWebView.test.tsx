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
      (instance) =>
        instance.props.edges?.top === "additive" &&
        instance.props.edges?.right === "off" &&
        instance.props.edges?.bottom === "off" &&
        instance.props.edges?.left === "off",
    );
    const modalSafeAreaProviders = view.container.queryAll(
      (instance) => typeof instance.props.onInsetsChange === "function",
    );

    expect(safeAreaViews).toHaveLength(1);
    expect(modalSafeAreaProviders).toHaveLength(2);
  });
});
