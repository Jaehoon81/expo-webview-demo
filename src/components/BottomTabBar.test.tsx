import { fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { BottomTabBar } from "@/src/components/BottomTabBar";

describe("BottomTabBar", () => {
  it("네 탭과 선택 상태를 표시하고 선택 callback을 호출한다", async () => {
    const onSelect = jest.fn();

    await render(
      <SafeAreaProvider
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
