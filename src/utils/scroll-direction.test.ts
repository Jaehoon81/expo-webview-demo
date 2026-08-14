// [파일 역할] 스크롤 거리가 기준을 넘을 때만 방향을 알려 주는지 확인합니다. Android 뒤로 가기를 2초 안에 두 번 눌렀는지도 계산합니다.
// [검증 경계] 실제 손동작 event 횟수, `Animated.View` 움직임, `BackHandler.exitApp` 실행은 확인하지 않습니다.
// [라이브러리] 휴대폰 기능이 필요 없는 계산 함수 두 개를 직접 부르고, Jest로 null·문자열·boolean 결과를 비교합니다.

// ========================================== 외부 의존성 ==========================================

import {
  getScrollDirection,
  isDoubleBackPress,
} from "@/src/utils/scroll-direction";

// =================================================================================================

// ========================================== test cases ===========================================

// [역할] `describe` callback은 scroll 방향과 Android 두 번 뒤로 가기 계산 test를 한 묶음으로 실행합니다.
describe("scroll and back navigation utilities", () => {
  // [역할] 이 test callback은 작은 움직임은 무시하고 위·아래·맨 위 복귀 방향을 올바르게 돌려주는지 확인합니다.
  it("8px 이상 이동할 때만 방향을 반환한다", () => {
    // 아주 조금 움직인 경우, 아래로 움직인 경우, 위로 움직인 경우, 맨 위로 돌아온 경우를 하나씩 비교합니다.
    // 결과가 차례로 null, down, up, 맨 위에서 강제로 up인지 확인합니다.
    expect(getScrollDirection(0, 4)).toBeNull();
    expect(getScrollDirection(0, 12)).toBe("down");
    expect(getScrollDirection(40, 20)).toBe("up");
    expect(getScrollDirection(10, 0)).toBe("up");
  });

  // [역할] 이 test callback은 첫 입력이 있고 2초 안에 들어온 두 번째 back만 종료 조건이 되는지 확인합니다.
  it("2초 안의 두 번째 back press만 종료 조건으로 인정한다", () => {
    // [문법] 숫자의 `_`는 값에 영향을 주지 않습니다. `1_999`를 1999처럼 계산하면서 자릿수만 읽기 쉽게 나눕니다.
    expect(isDoubleBackPress(1_000, 2_500)).toBe(true);
    expect(isDoubleBackPress(1_000, 3_001)).toBe(false);
    expect(isDoubleBackPress(0, 1_000)).toBe(false);
  });
});

// =================================================================================================
