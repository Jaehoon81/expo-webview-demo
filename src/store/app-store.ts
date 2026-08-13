// [파일 역할] 마지막 선택 탭은 SecureStore에 영속화하고 hydration 완료 여부는 runtime에만 두는 Zustand store입니다.
// [검증 경계] Jest에서는 SecureStore를 mock하므로 merge·action 계약은 검증하지만 실제 암호화 저장소와 앱 재시작 복원은 실기기 경계입니다.
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import { isTabIndex, type TabIndex } from "@/src/types/navigation";

const secureStorage: StateStorage = {
  async getItem(name) {
    try {
      // [FLOW-01 / 3단계] persist middleware가 저장된 JSON 문자열을 SecureStore에서 비동기로 읽습니다.
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      console.warn("저장된 탭 설정을 읽지 못했습니다.", error);
      return null;
    }
  },
  async setItem(name, value) {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.warn("탭 설정을 저장하지 못했습니다.", error);
    }
  },
  async removeItem(name) {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.warn("저장된 탭 설정을 삭제하지 못했습니다.", error);
    }
  },
};

export type AppStore = {
  // selectedTabIndex만 재실행 뒤에도 남고 hasHydrated는 매 process 시작마다 false에서 출발합니다.
  selectedTabIndex: TabIndex;
  hasHydrated: boolean;
  setSelectedTabIndex: (index: TabIndex) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export type PersistedAppState = Pick<AppStore, "selectedTabIndex">;

export function partializeAppState(state: AppStore): PersistedAppState {
  // [이유] loading 제어용 hasHydrated와 action 함수는 저장하지 않아 stale runtime 상태가 복원되지 않습니다.
  return {
    selectedTabIndex: state.selectedTabIndex,
  };
}

export function mergePersistedAppState(
  persistedState: unknown,
  currentState: AppStore,
): AppStore {
  // persistedState는 local storage에서 온 runtime 값이므로 type assertion만 믿지 않고 index 범위를 다시 검사합니다.
  const candidate = (persistedState as Partial<PersistedAppState> | null)
    ?.selectedTabIndex;

  return {
    ...currentState,
    selectedTabIndex:
      typeof candidate === "number" && isTabIndex(candidate)
        ? candidate
        : currentState.selectedTabIndex,
  };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      selectedTabIndex: 0,
      hasHydrated: false,
      setSelectedTabIndex: (selectedTabIndex) => set({ selectedTabIndex }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: "my-webview-app-settings",
      storage: createJSONStorage<PersistedAppState>(() => secureStorage),
      partialize: partializeAppState,
      merge: mergePersistedAppState,
      onRehydrateStorage: () => (state, error) => {
        // [FLOW-01 / 4단계] 성공·손상·읽기 실패 모두 loading에 갇히지 않도록 마지막에 완료 신호를 올립니다.
        if (error) {
          console.warn("저장된 탭 설정을 복원하지 못했습니다.", error);
        }

        if (state) {
          state.setHasHydrated(true);
        } else {
          // store instance를 받지 못한 실패 경로는 현재 callback stack 밖에서 singleton을 직접 갱신합니다.
          queueMicrotask(() => {
            useAppStore.setState({ hasHydrated: true });
          });
        }
      },
    },
  ),
);
