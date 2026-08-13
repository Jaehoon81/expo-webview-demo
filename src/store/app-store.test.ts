// [파일 역할] Zustand persist의 저장 대상 축소와 손상된 selectedTabIndex merge fallback을 순수 함수로 검증합니다.
// [검증 경계] 공통 SecureStore mock조차 호출하지 않으므로 암호화 저장·rehydration callback·앱 재시작은 확인하지 않습니다.
import {
  mergePersistedAppState,
  partializeAppState,
  type AppStore,
} from "@/src/store/app-store";

function makeCurrentState(): AppStore {
  // persist merge가 유지해야 할 현재 runtime state/action을 포함한 기준 fixture입니다.
  return {
    selectedTabIndex: 0,
    hasHydrated: false,
    setSelectedTabIndex: jest.fn(),
    setHasHydrated: jest.fn(),
  };
}

describe("app store persistence", () => {
  it("마지막 선택 탭만 저장한다", () => {
    const state = {
      ...makeCurrentState(),
      selectedTabIndex: 2 as const,
      hasHydrated: true,
    };

    // hasHydrated와 action 함수가 persisted JSON에 섞이지 않는 정확한 객체를 비교합니다.
    expect(partializeAppState(state)).toEqual({ selectedTabIndex: 2 });
  });

  it("유효한 탭은 복원하고 손상된 값은 기본값으로 되돌린다", () => {
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
