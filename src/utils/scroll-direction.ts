export type ScrollDirection = "up" | "down";

export function getScrollDirection(
  previousOffset: number,
  currentOffset: number,
  threshold = 8,
): ScrollDirection | null {
  if (currentOffset <= 0 && previousOffset > 0) {
    return "up";
  }

  const delta = currentOffset - previousOffset;
  if (Math.abs(delta) < threshold) {
    return null;
  }

  return delta > 0 ? "down" : "up";
}

export function isDoubleBackPress(
  previousPressTime: number,
  currentPressTime: number,
  windowMs = 2_000,
): boolean {
  return previousPressTime > 0 && currentPressTime - previousPressTime <= windowMs;
}
