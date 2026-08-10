import {
  mergePersistedAppState,
  partializeAppState,
  type AppStore,
} from "@/src/store/app-store";

function makeCurrentState(): AppStore {
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
