// [파일 역할] 마지막으로 선택한 탭을 SecureStore에 저장하고, 저장값을 모두 읽었는지도 Zustand에서 알려 줍니다.
// [검증 경계] Jest에서는 SecureStore를 가짜로 바꿉니다. 값 합치기와 상태 변경만 확인할 수 있습니다.
// 실제 기기 보안 저장소와 앱 재실행 뒤 복원은 이 test가 증명하지 않습니다.
// [라이브러리] SecureStore는 문자열을 기기 보안 저장소에 보관합니다. Zustand `persist`가 저장과 복원을 연결합니다.

// ========================================== 외부 의존성 ==========================================

import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

import { isTabIndex, type TabIndex } from "@/src/types/navigation";

// =================================================================================================

// ====================================== SecureStore adapter ======================================

// [문법] `StateStorage` type은 아래 객체가 문자열 읽기·쓰기·삭제 함수 세 개를 갖추게 합니다.
const secureStorage: StateStorage = {
  // [역할] `getItem`은 Zustand가 요청한 이름의 문자열을 SecureStore에서 읽고, 실패하면 기본값 경로를 위해 `null`을 돌려줍니다.
  // [문법] 객체 안의 `async getItem`은 SecureStore 읽기가 끝날 때까지 기다릴 수 있는 함수입니다.
  async getItem(name) {
    try {
      // [FLOW-01 / 2-A단계] Zustand `persist`가 `name`을 넘겨 이 adapter를 호출하면 SecureStore read Promise를 기다립니다.
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      // [FLOW-01 / 3-A단계] read가 실패하면 이 branch가 `null`을 반환해 저장값이 없는 경우와 같은 기본 state 경로로 합류합니다.
      // 읽기에 실패하면 `null`을 돌려줍니다. 그러면 Zustand는 저장값이 없는 경우처럼 기본 탭을 사용합니다.
      console.warn("저장된 탭 설정을 읽지 못했습니다.", error);
      return null;
    }
  },
  // [역할] `setItem`은 Zustand가 만든 JSON 문자열을 같은 이름으로 SecureStore에 저장합니다.
  async setItem(name, value) {
    try {
      // [FLOW-02 / 11-A단계] `persist`가 만든 JSON을 이 adapter에 넘기면 SecureStore write가 끝날 때까지 기다려 다음 실행의 복원값을 남깁니다.
      // Zustand가 JSON 문자열로 바꾼 설정을 SecureStore에 그대로 저장합니다.
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.warn("탭 설정을 저장하지 못했습니다.", error);
    }
  },
  // [역할] `removeItem`은 Zustand가 초기화를 요청한 이름의 저장값을 SecureStore에서 지웁니다.
  async removeItem(name) {
    try {
      // Zustand가 설정 초기화를 요청하면 같은 이름으로 저장된 값을 SecureStore에서 지웁니다.
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.warn("저장된 탭 설정을 삭제하지 못했습니다.", error);
    }
  },
};

// =================================================================================================

// ======================================= Zustand 저장 type =======================================

export type AppStore = {
  // `selectedTabIndex`만 앱을 다시 실행해도 남습니다. `hasHydrated`는 앱을 켤 때마다 false에서 시작합니다.
  selectedTabIndex: TabIndex;
  hasHydrated: boolean;
  // [역할] `setSelectedTabIndex`는 현재 탭 번호를 바꾸고 persist 저장 대상으로 전달하는 함수 계약입니다.
  setSelectedTabIndex: (index: TabIndex) => void;
  // [역할] `setHasHydrated`는 SecureStore 읽기가 끝났음을 현재 실행의 state에 기록하는 함수 계약입니다.
  setHasHydrated: (hasHydrated: boolean) => void;
};

// [문법] `Pick`은 AppStore에서 `selectedTabIndex` 하나만 골라 저장용 type을 만듭니다.
export type PersistedAppState = Pick<AppStore, "selectedTabIndex">;

// =================================================================================================

// ======================================= 저장값 변환 함수 ========================================

// [역할] `partializeAppState`는 전체 Zustand state에서 앱 재실행 뒤에도 남길 탭 번호만 골라냅니다.
export function partializeAppState(state: AppStore): PersistedAppState {
  // [FLOW-02 / 10-A단계] `selectedTabIndex` 변경을 감지한 `persist`가 이 함수를 호출해 저장할 탭 번호만 JSON 대상으로 고릅니다.
  // [이유] `hasHydrated`와 상태 변경 함수는 현재 실행에서만 필요하므로 저장하지 않습니다.
  // 다음 실행에 지난 완료 상태나 함수를 잘못 불러오지 않게 합니다.
  return {
    selectedTabIndex: state.selectedTabIndex,
  };
}

// [역할] `mergePersistedAppState`는 외부 저장값의 탭 번호를 검사한 뒤 현재 state와 안전하게 합칩니다.
export function mergePersistedAppState(
  persistedState: unknown,
  currentState: AppStore,
): AppStore {
  // 저장소에서 읽은 값은 TypeScript가 만든 값이 아니므로 0~3인지 다시 확인해야 합니다.
  // [문법] `?.`는 값이 null이면 속성을 읽지 않고 candidate를 `undefined`로 둡니다.
  const candidate = (persistedState as Partial<PersistedAppState> | null)
    ?.selectedTabIndex;

  // [FLOW-01 / 4-A단계] JSON 복원값의 `selectedTabIndex`가 정수 0~3이면 현재 기본값을 그 저장값으로 교체합니다.
  // [FLOW-01 / 4-B단계] 값이 없거나 손상됐거나 범위를 벗어나면 현재 기본 탭을 유지한 채 같은 완료 callback으로 진행합니다.
  return {
    // [문법] `...currentState`로 현재 상태와 함수들을 먼저 복사한 뒤, 검사한 탭 번호만 아래에서 바꿉니다.
    ...currentState,
    selectedTabIndex:
      typeof candidate === "number" && isTabIndex(candidate)
        ? candidate
        : currentState.selectedTabIndex,
  };
}

// =================================================================================================

// ====================================== Zustand store 생성 =======================================

// [라이브러리] `create<AppStore>()`는 이 store가 AppStore 모양을 따라야 한다고 Zustand에 알려 줍니다.
// 이어지는 `persist(...)`가 그 store에 저장 기능을 붙입니다.
// [FLOW-01 / 1-A단계] 이 module이 평가되면 Zustand store를 만들고 `persist`가 비동기 rehydration을 자동으로 시작합니다.
export const useAppStore = create<AppStore>()(
  persist(
    // [문법] Zustand가 준 `set`으로 필요한 값만 바꾸는 함수를 만듭니다.
    // `{ selectedTabIndex }`는 key와 변수 이름이 같을 때 쓰는 짧은 객체 문법입니다.
    // [역할] store 생성 callback은 초기값과 두 상태 변경 함수를 하나의 Zustand state 객체로 만듭니다.
    (set) => ({
      selectedTabIndex: 0,
      hasHydrated: false,
      // [역할] `setSelectedTabIndex` callback은 받은 탭 번호만 현재 Zustand state에 반영합니다.
      // [FLOW-02 / 9-A단계] 다른 탭 branch가 이 setter를 호출하면 Zustand가 index를 갱신하고 구독 중인 `DemoShell`과 `persist`에 변경을 알립니다.
      setSelectedTabIndex: (selectedTabIndex) => set({ selectedTabIndex }),
      // [역할] `setHasHydrated` callback은 저장값 읽기 완료 여부만 현재 Zustand state에 반영합니다.
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      // 이 이름으로 SecureStore 안에서 앱 설정 문자열을 찾습니다.
      name: "my-webview-app-settings",
      // [라이브러리] `createJSONStorage`는 Zustand 객체를 JSON 문자열로 바꾸고, 읽을 때 다시 객체로 바꿉니다.
      // [역할] storage callback은 persist가 실제 문자열을 읽고 쓸 SecureStore adapter를 돌려줍니다.
      storage: createJSONStorage<PersistedAppState>(() => secureStorage),
      partialize: partializeAppState,
      merge: mergePersistedAppState,
      // [문법] 첫 `() =>`가 저장값 읽기가 끝날 때 실행할 둘째 함수 `(state, error) =>`를 돌려줍니다.
      // [역할] 바깥 `onRehydrateStorage` callback은 저장값 읽기가 끝난 뒤 실행할 완료 함수를 준비합니다.
      // [역할] 안쪽 완료 callback은 성공·손상·실패 어느 경우에도 loading을 끝낼 수 있도록 `hasHydrated`를 바꿉니다.
      onRehydrateStorage: () => (state, error) => {
        // [FLOW-01 / 5단계] storage Promise가 끝나면 `persist`가 이 완료 callback을 자동 호출해 성공·대체·실패 경로를 합칩니다.
        if (error) {
          console.warn("저장된 탭 설정을 복원하지 못했습니다.", error);
        }

        if (state) {
          // [FLOW-01 / 5-A단계] 복원된 store가 있으면 그 store의 setter가 `hasHydrated`를 즉시 true로 바꿉니다.
          // store를 정상적으로 받았으면 준비된 상태 변경 함수로 `hasHydrated`를 true로 바꿉니다.
          state.setHasHydrated(true);
        } else {
          // [FLOW-01 / 5-B단계] store 인자가 없으면 microtask가 singleton store를 직접 갱신해 같은 완료 상태를 만듭니다.
          // store를 받지 못했으면 이 완료 함수가 끝난 직후 store를 직접 갱신합니다.
          // [라이브러리] `queueMicrotask`는 현재 함수가 모두 끝난 다음, 다음 일반 작업보다 먼저 안쪽 함수를 실행합니다.
          // [역할] microtask callback은 현재 복원 callback이 끝난 직후 store의 loading 완료 값을 직접 바꿉니다.
          queueMicrotask(() => {
            useAppStore.setState({ hasHydrated: true });
          });
        }
      },
    },
  ),
);

// =================================================================================================
