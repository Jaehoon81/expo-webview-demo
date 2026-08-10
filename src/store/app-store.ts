import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import { isTabIndex, type TabIndex } from "@/src/types/navigation";

const secureStorage: StateStorage = {
  async getItem(name) {
    try {
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
  selectedTabIndex: TabIndex;
  hasHydrated: boolean;
  setSelectedTabIndex: (index: TabIndex) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export type PersistedAppState = Pick<AppStore, "selectedTabIndex">;

export function partializeAppState(state: AppStore): PersistedAppState {
  return {
    selectedTabIndex: state.selectedTabIndex,
  };
}

export function mergePersistedAppState(
  persistedState: unknown,
  currentState: AppStore,
): AppStore {
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
        if (error) {
          console.warn("저장된 탭 설정을 복원하지 못했습니다.", error);
        }

        if (state) {
          state.setHasHydrated(true);
        } else {
          queueMicrotask(() => {
            useAppStore.setState({ hasHydrated: true });
          });
        }
      },
    },
  ),
);
