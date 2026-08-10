import {
  getScrollDirection,
  isDoubleBackPress,
} from "@/src/utils/scroll-direction";

describe("scroll and back navigation utilities", () => {
  it("8px 이상 이동할 때만 방향을 반환한다", () => {
    expect(getScrollDirection(0, 4)).toBeNull();
    expect(getScrollDirection(0, 12)).toBe("down");
    expect(getScrollDirection(40, 20)).toBe("up");
    expect(getScrollDirection(10, 0)).toBe("up");
  });

  it("2초 안의 두 번째 back press만 종료 조건으로 인정한다", () => {
    expect(isDoubleBackPress(1_000, 2_500)).toBe(true);
    expect(isDoubleBackPress(1_000, 3_001)).toBe(false);
    expect(isDoubleBackPress(0, 1_000)).toBe(false);
  });
});
