// [파일 역할] 공통 정의의 네 tab, 선택 접근성 상태와 press callback index를 component 수준에서 검증합니다.
// [검증 경계] SafeAreaProvider에는 fixture inset을 주지만 native device의 실제 inset·animation·persist 변경은 확인하지 않습니다.
import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { BottomTabBar } from "@/src/components/BottomTabBar";

describe("BottomTabBar", () => {
  it("네 탭과 선택 상태를 표시하고 선택 callback을 호출한다", async () => {
    const onSelect = jest.fn();

    await render(
      <SafeAreaProvider
        // iPhone 형태의 고정 metric으로 provider 의존성을 충족하되 이 test는 padding pixel을 assertion하지 않습니다.
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 47, right: 0, bottom: 34, left: 0 },
        }}
      >
        <BottomTabBar onSelect={onSelect} selectedIndex={0} />
      </SafeAreaProvider>,
    );

    expect(screen.getAllByRole("tab")).toHaveLength(4);
    expect(screen.getByRole("tab", { name: "메인화면" })).toBeSelected();

    await fireEvent.press(screen.getByRole("tab", { name: "네이티브" }));
    expect(onSelect).toHaveBeenCalledWith(3);
  });
});
