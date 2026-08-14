// [파일 역할] 화면 전체 popup 안에 별도 `SafeAreaProvider`가 있고, 위쪽 안전 여백만 적용하는지 component 구조를 확인합니다.
// [검증 경계] WebView는 가짜 View입니다. 실제 Modal 화면, 웹 페이지 열기, 방문 기록, 뒤로 가기, 휴대폰 여백의 pixel 결과는 실기기에서 확인해야 합니다.
// [라이브러리] Testing Library가 만든 화면과 고정 `SafeAreaProvider` 값으로 modal 안의 provider와 edges props만 확인합니다.

// ========================================== 외부 의존성 ==========================================

import { render } from "@testing-library/react-native";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { PopupWebView } from "@/src/components/PopupWebView";

// =================================================================================================

// ====================================== test mock과 helper =======================================

// [라이브러리] 실제 WebView module을 가짜 View로 바꿉니다. 받은 props는 남지만 실제 웹 엔진은 실행되지 않습니다.
// [역할] mock factory callback은 실제 WebView 대신 받은 props를 보존하는 가짜 View module을 만듭니다.
jest.mock("react-native-webview", () => {
  // [문법] `requireActual<typeof import(...)>`은 실제 module을 가져오면서 export의 type도 유지합니다.
  const React = jest.requireActual<typeof import("react")>("react");
  const { View: MockView } = jest.requireActual<typeof import("react-native")>(
    "react-native",
  );

  return {
    // 실제 WebView 기능 없이 받은 props만 가짜 View에 그대로 붙입니다.
    // `_ref` 앞의 밑줄은 `forwardRef`가 주는 parameter이지만 이 test에서는 쓰지 않는다는 표시입니다.
    WebView: React.forwardRef(function MockWebView(props, _ref) {
      // [역할] `MockWebView`는 실제 웹 엔진 없이 WebView props를 찾을 수 있는 `MockView`로 바꿉니다.
      // [라이브러리] `React.createElement`는 WebView가 받은 props를 가짜 `MockView`에 그대로 전달합니다.
      return React.createElement(MockView, props);
    }),
  };
});

// =================================================================================================

// ========================================== test cases ===========================================

// [역할] `describe` callback은 popup 안의 safe-area provider와 top edge 계약 test를 실행합니다.
describe("PopupWebView", () => {
  // [역할] 이 test callback은 root와 modal provider가 함께 있고 popup에는 top edge만 적용되는지 확인합니다.
  it("popup header에 top safe area만 적용한다", async () => {
    // 앱 바깥쪽 provider와 Modal 안의 popup용 provider가 함께 있는 실제 component 구조를 만듭니다.
    const view = await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, right: 0, bottom: 34, left: 0 },
        }}
      >
        <View>
          <PopupWebView
            // [역할] `classifyNavigation` callback은 이 layout test의 모든 URL을 WebView 허용 결과로 고정합니다.
            classifyNavigation={() => ({ type: "allow" })}
            networkOffline={false}
            onClose={jest.fn()}
            onDeepLink={jest.fn()}
            url="https://www.bing.com"
          />
        </View>
      </SafeAreaProvider>,
    );

    // [라이브러리] `container.queryAll`은 글자나 role로 찾을 수 없는 내부 여백 props를 조건 함수로 찾습니다.
    const safeAreaViews = view.container.queryAll(
      // `SafeAreaView`의 `edges={["top"]}`이 내부 props에서 위쪽만 켠 값으로 바뀌었는지 찾습니다.
      // [역할] 첫 query predicate callback은 top만 켜진 popup `SafeAreaView`를 찾습니다.
      (instance) =>
        instance.props.edges?.top === "additive" &&
        instance.props.edges?.right === "off" &&
        instance.props.edges?.bottom === "off" &&
        instance.props.edges?.left === "off",
    );
    const modalSafeAreaProviders = view.container.queryAll(
      // 앱 바깥쪽 provider와 popup 안 provider, 두 개가 모두 있는지 provider callback으로 찾습니다.
      // [역할] 둘째 query predicate callback은 insets 변경 함수를 가진 `SafeAreaProvider`들을 찾습니다.
      (instance) => typeof instance.props.onInsetsChange === "function",
    );

    // 위쪽만 적용한 `SafeAreaView`는 하나, provider는 두 개여야 의도한 여백 구조입니다.
    expect(safeAreaViews).toHaveLength(1);
    expect(modalSafeAreaProviders).toHaveLength(2);
  });
});

// =================================================================================================
