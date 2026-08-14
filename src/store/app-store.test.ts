// [파일 역할] Zustand가 선택한 탭 번호만 저장하는지 확인합니다. 저장된 탭 번호가 잘못됐을 때 안전한 기본값을 쓰는지도 검사합니다.
// [검증 경계] SecureStore의 가짜 함수조차 부르지 않습니다. 실제 암호화 저장, 저장값 다시 읽기, 앱 재시작은 확인하지 않습니다.
// [라이브러리] Jest의 가짜 탭 변경 함수와 값 비교를 사용합니다.
// Zustand 밖으로 꺼낸 `partializeAppState`와 `mergePersistedAppState`만 직접 실행합니다.

// ========================================== 외부 의존성 ==========================================

import {
  mergePersistedAppState,
  partializeAppState,
  type AppStore,
} from "@/src/store/app-store";

// =================================================================================================

// ====================================== test mock과 helper =======================================

// [역할] `makeCurrentState`는 저장값 합치기 test에 쓸 기본 Zustand state와 가짜 변경 함수를 새로 만듭니다.
function makeCurrentState(): AppStore {
  // 저장값을 합친 뒤에도 남아 있어야 할 현재 state와 탭 변경 함수를 가진 가짜 값입니다.
  // [문법] 이 함수는 부를 때마다 새 객체와 새 가짜 함수를 돌려줍니다. test끼리 같은 객체와 호출 기록을 공유하지 않습니다.
  return {
    selectedTabIndex: 0,
    hasHydrated: false,
    setSelectedTabIndex: jest.fn(),
    setHasHydrated: jest.fn(),
  };
}

// =================================================================================================

// ========================================== test cases ===========================================

// [역할] `describe` callback은 저장 대상 선택과 저장값 합치기 규칙 test를 한 묶음으로 실행합니다.
describe("app store persistence", () => {
  // [역할] 이 test callback은 전체 state에서 마지막 선택 탭만 저장 대상으로 남기는지 확인합니다.
  it("마지막 선택 탭만 저장한다", () => {
    // [문법] object spread로 기본 state를 복사하고, 이 test에 필요한 두 property만 다른 값으로 바꿉니다.
    const state = {
      ...makeCurrentState(),
      // [문법] `as const`는 2를 아무 number가 아니라 값이 정확히 2인 type으로 유지합니다. TabIndex로 안전하게 사용할 수 있습니다.
      selectedTabIndex: 2 as const,
      hasHydrated: true,
    };

    // 저장 결과에는 탭 번호만 있어야 합니다. hasHydrated와 탭 변경 함수가 섞이지 않는지 객체 전체를 비교합니다.
    expect(partializeAppState(state)).toEqual({ selectedTabIndex: 2 });
  });

  // [역할] 이 test callback은 올바른 탭은 복원하고 손상된 번호는 현재 기본값을 유지하는지 확인합니다.
  it("유효한 탭은 복원하고 손상된 값은 기본값으로 되돌린다", () => {
    // 같은 합치기 함수에 올바른 탭 번호와 범위를 벗어난 번호를 각각 넣어 두 결과를 비교합니다.
    expect(
      mergePersistedAppState(
        { selectedTabIndex: 3 },
        makeCurrentState(),
      ).selectedTabIndex,
    ).toBe(3);
    expect(
      mergePersistedAppState(
        { selectedTabIndex: 9 },
        makeCurrentState(),
      ).selectedTabIndex,
    ).toBe(0);
  });
});

// =================================================================================================
