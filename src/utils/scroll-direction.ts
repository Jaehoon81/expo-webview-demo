// [파일 역할] WebView·FlatList가 공유하는 scroll 방향 판정과 Android 이중 back 시간 경계를 순수 함수로 제공합니다.
export type ScrollDirection = "up" | "down";

export function getScrollDirection(
  previousOffset: number,
  currentOffset: number,
  threshold = 8,
): ScrollDirection | null {
  if (currentOffset <= 0 && previousOffset > 0) {
    // [FLOW-08 / 1단계] 목록이 맨 위로 돌아오면 threshold와 무관하게 하단 탭을 다시 보여야 합니다.
    return "up";
  }

  const delta = currentOffset - previousOffset;
  if (Math.abs(delta) < threshold) {
    // 작은 흔들림은 방향 변경으로 보내지 않아 하단 바 animation의 잦은 반전을 줄입니다.
    return null;
  }

  return delta > 0 ? "down" : "up";
}

export function isDoubleBackPress(
  previousPressTime: number,
  currentPressTime: number,
  windowMs = 2_000,
): boolean {
  // 첫 입력 시각 0은 종료 조건이 아니며 두 번째 입력만 지정 window 안인지 비교합니다.
  return previousPressTime > 0 && currentPressTime - previousPressTime <= windowMs;
}
