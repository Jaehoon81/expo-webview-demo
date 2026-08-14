// [파일 역할] 하단에 탭 네 개가 나오고, 선택한 탭의 접근성 값과 누른 탭 번호가 올바른지 확인합니다.
// [검증 경계] `SafeAreaProvider`에는 정해 둔 가짜 여백을 줍니다. 실제 휴대폰 여백, animation, 저장된 탭 변경은 확인하지 않습니다.
// [라이브러리] React Native Testing Library의 `render`는 test용 화면을 만듭니다.
// role로 탭을 찾고 `fireEvent.press`로 사용자가 누른 상황을 만듭니다.

// ========================================== 외부 의존성 ==========================================

import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { BottomTabBar } from "@/src/components/BottomTabBar";

// =================================================================================================

// ========================================== test cases ===========================================

// [역할] `describe` callback은 하단 탭 표시와 선택 전달을 확인하는 test를 한 묶음으로 실행합니다.
describe("BottomTabBar", () => {
  // [역할] 이 test callback은 탭 네 개, 현재 선택 접근성 값과 누른 탭 번호 callback을 확인합니다.
  it("네 탭과 선택 상태를 표시하고 선택 callback을 호출한다", async () => {
    // [라이브러리] `jest.fn`은 하단 탭 막대가 어떤 TabIndex를 전달했는지 기록하는 가짜 함수입니다.
    const onSelect = jest.fn();

    // [문법] `SafeAreaProvider`의 여는 tag와 닫는 tag 사이에 검사할 component를 넣습니다. 실제 앱처럼 안전 여백 값을 받을 수 있습니다.
    await render(
      <SafeAreaProvider
        // iPhone과 비슷한 고정 화면 크기와 여백을 줍니다. 이 test에서는 정확한 padding 숫자까지 비교하지 않습니다.
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, right: 0, bottom: 34, left: 0 },
        }}
      >
        <BottomTabBar onSelect={onSelect} selectedIndex={0} />
      </SafeAreaProvider>,
    );

    // 접근성 role이 tab인 항목을 찾아 네 개인지 확인하고, 현재 탭에 selected가 표시됐는지도 확인합니다.
    expect(screen.getAllByRole("tab")).toHaveLength(4);
    expect(screen.getByRole("tab", { name: "메인화면" })).toBeSelected();

    await fireEvent.press(screen.getByRole("tab", { name: "네이티브" }));
    expect(onSelect).toHaveBeenCalledWith(3);
  });
});

// =================================================================================================
