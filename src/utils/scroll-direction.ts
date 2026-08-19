// [파일 역할] 스크롤이 위·아래 중 어느 쪽인지와 Android 뒤로가기를 연속 두 번 눌렀는지 계산합니다.
// [문법] string literal union을 사용해 ScrollDirection에는 `"up"`과 `"down"`만 넣을 수 있습니다.
export type ScrollDirection = "up" | "down";

// ======================================= 스크롤 방향 계산 ========================================

// [역할] `getScrollDirection`은 이전·현재 위치 차이가 기준을 넘을 때만 위 또는 아래 방향을 돌려줍니다.
export function getScrollDirection(
  previousOffset: number,
  currentOffset: number,
  threshold = 8,
): ScrollDirection | null {
  // `null`은 아직 방향을 정할 만큼 움직이지 않았다는 뜻입니다. 맨 위로 돌아온 경우는 먼저 따로 처리합니다.
  if (currentOffset <= 0 && previousOffset > 0) {
    // [FLOW-08 / 2-A단계] helper는 top 복귀를 즉시 `up`, 8px 미만을 `null`, 나머지를 delta 부호의 `up/down`으로 반환합니다.
    return "up";
  }

  // 현재 위치에서 이전 위치를 빼면 양수는 아래로, 음수는 위로 움직였다는 뜻입니다.
  const delta = currentOffset - previousOffset;
  // [라이브러리] `Math.abs`는 음수 부호를 없애 실제로 움직인 거리만 비교하게 합니다.
  if (Math.abs(delta) < threshold) {
    // 아주 작은 움직임은 무시해 하단 바가 자주 위아래로 흔들리지 않게 합니다.
    return null;
  }

  // [문법] 삼항 연산자는 delta가 양수면 `"down"`, 아니면 `"up"`을 돌려줍니다.
  return delta > 0 ? "down" : "up";
}

// =================================================================================================

// ==================================== Android 뒤로 가기 계산 =====================================

// [역할] `isDoubleBackPress`는 두 번째 뒤로 가기가 정해진 시간 안에 들어왔는지 확인합니다.
export function isDoubleBackPress(
  previousPressTime: number,
  currentPressTime: number,
  windowMs = 2_000,
): boolean {
  // [문법] `windowMs`를 생략하면 2초를 사용합니다. `&&` 양쪽 조건이 모두 맞아야 true가 됩니다.
  // 첫 번째 입력은 종료 조건이 아닙니다. 두 번째 입력이 정해진 시간 안에 들어왔는지만 확인합니다.
  return previousPressTime > 0 && currentPressTime - previousPressTime <= windowMs;
}

// =================================================================================================
