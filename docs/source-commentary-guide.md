# Expo WebView 데모 소스 주석 읽기 안내서

이 문서는 사용자가 설명을 기다리지 않고 실제 source를 직접 열어 흐름을 따라가기 위한 안내서다. 전체 구조를 먼저 보고 싶으면 [내부 구조와 동작](./architecture-internals.md), Codex와 한 서브 스텝씩 대화하며 학습하려면 [구현 학습서](./learning-guide.md)를 사용한다.

변수명, 함수명, API 이름, 문법 이름과 path는 source에 적힌 원문 그대로 읽는다. 그 밖의 설명은 처음 코드를 보는 사람도 바로 이해할 수 있는 한국어로 쓴다. 전문 용어가 꼭 필요하면 같은 문장이나 바로 다음 문장에서 “누가, 언제, 무엇을 하는지”를 쉬운 말로 풀어 준다. `[역할]`, `[문법]`과 `[라이브러리]`는 그 설명을 찾는 표식이다.

주석은 코드에 보이는 글자를 그대로 읽어 주는 사전이 아니다. 코드만 봐서는 알기 어려운 책임, 선택 이유, 값이 남는 기간, 실행 순서, 실제 기기에서만 확인할 수 있는 범위를 설명한다.

## 1. 주석 표식

### `[파일 역할]`

이 파일이 무슨 일을 하고, 누가 이 파일을 사용하며, 결과를 어디로 보내는지 설명한다. 파일을 처음 열면 import보다 이 표식을 먼저 읽는다.

예:

```ts
// [파일 역할] WebView 탭 하나를 화면에 띄우고,
// 그 탭에서 연 웹 문서와 방문 기록을 관리합니다.
```

이 문장은 `WebTab`이 URL 검사와 휴대폰 기능까지 모두 직접 만든다는 뜻이 아니다. URL은 service가 검사하고, bridge 요청은 dispatcher가 알맞은 기능으로 보낸다. `DemoShell`은 이 파일들을 서로 이어 준다.

### `[역할]`

함수 하나가 어떤 입력을 받아 무엇을 하고, 결과를 어디에 전달하는지 짧게 요약한다. 함수 선언, React component, `useEffect`·`useCallback` callback, event·listener·timer·cleanup callback, 배열 변환 함수와 test callback도 각각 자기 `[역할]`을 갖는다.

예:

```ts
// [역할] `handleNavigationRequest`는 URL 검사 결과를 실제 허용·차단·외부 앱 동작으로 실행합니다.
const handleNavigationRequest = useCallback((url: string): boolean => {
  // ...
}, []);
```

함수 type만 선언하는 field도 다른 파일이 그 함수를 어떤 목적으로 건네야 하는지 중요하면 `[역할]`로 설명한다. state·ref처럼 함수는 아니지만 이후 함수를 이해하는 기준값도 필요할 때 같은 표식을 사용할 수 있다. 그래서 `[역할]` 개수는 실제 함수 개수보다 많을 수 있다.

`onPress={handlePress}`처럼 이미 설명한 함수를 그대로 넘기는 줄에는 같은 설명을 반복하지 않는다. 새 arrow function이나 callback을 그 자리에서 만들었을 때는 그 callback이 추가로 맡은 일을 설명한다.

### `[문법]`

현재 줄을 이해하는 데 필요한 TypeScript, JavaScript, React 문법을 설명한다. `as const`, generic, optional chaining, 구조 분해처럼 이름을 그대로 써야 정확한 문법은 원문을 유지한다. 그 뒤에는 이 코드에서 값이나 실행 순서가 실제로 어떻게 달라지는지 쉬운 한국어로 설명한다.

예:

```ts
// [문법] `z.infer<typeof requestSchema>`는 requestSchema가 검사하는 값의 모양을
// TypeScript type으로도 가져옵니다. 검사 규칙과 type을 따로 두 번 적지 않아도 됩니다.
```

`const`가 값을 선언한다거나 `return`이 값을 돌려준다는 식으로 눈에 보이는 코드만 되풀이하지 않는다. 같은 문법이 같은 뜻으로 반복되면 첫 설명을 다시 붙이지 않는다. 다만 같은 문법이라도 값이 남는 기간이나 실행 순서가 달라지면 그 차이를 다시 설명한다.

### `[라이브러리]`

React, React Native, Expo SDK 54 package와 project library가 이 코드에서 해 주는 일을 설명한다. 예를 들어 Hook이 언제 event를 듣기 시작하고 멈추는지, WebView callback이 언제 오는지, TanStack Query가 받은 값을 얼마나 보관하는지처럼 일반 문법만으로 알 수 없는 동작을 풀어 쓴다.

예:

```ts
// [라이브러리] `useImperativeHandle`은 DemoShell의 ref에 실제 WebView 전체가 아니라
// 이 화면에서 허용한 명령만 넣어 줍니다.
```

import마다 package 소개를 반복하지 않는다. 같은 library라도 이 코드에서 맡은 일이 달라지거나, event 듣기를 멈추는 시점과 보관한 값이 사라지는 시점이 중요할 때 다시 설명한다.

### 기능 구분선

한 파일의 코드와 주석이 길어지면 기능과 의미가 같은 범위를 시작·종료 구분선으로 묶는다. 큰 책임은 `=`, 큰 책임 안의 작은 단계는 `-`를 사용한다.

```ts
// ====================================== WebView 상태와 ref =======================================

// 같은 큰 책임에 속한 코드

// =================================================================================================

  // ------------------------------------------ 오류 감지 ------------------------------------------

  // 큰 책임 안의 작은 단계에 속한 코드

  // -----------------------------------------------------------------------------------------------
```

- 시작 구분선 가운데에는 해당 범위를 대표하는 짧은 keyword를 쓴다.
- 종료 구분선에는 keyword를 반복하지 않고 같은 기호만 쓴다.
- 모든 시작 구분선은 같은 단계의 종료 구분선과 짝을 이룬다.
- 시작·종료 구분선 위아래에는 빈 줄을 한 줄씩 둔다.
- 들여쓰기를 포함해 화면에서 보이는 전체 길이를 100칸으로 맞춘다. 한글은 영문보다 넓게 보이므로 글자 수가 아니라 실제 표시 폭을 기준으로 한다.
- 짧은 파일은 실제 책임 수만큼만 나눈다. JSX 닫기 tag나 style property처럼 의미가 새로 생기지 않는 곳에는 구분선을 늘리지 않는다.

### `[FLOW-NN]`

여러 파일을 차례로 거치는 기능 흐름의 유일한 시작 표식이다. 주석 본문은 반드시 `시작:`으로 실제 최초 caller 또는 자동 실행 주체를 밝힌다. `FLOW-01`부터 `FLOW-09`까지 각 표식은 production source 전체에서 한 번만 나온다.

### `[FLOW-NN / N단계]`

해당 기능 흐름의 공통 직렬 경로에서 몇 번째 단계인지 나타낸다. 같은 flow와 단계 번호 조합은 production source 전체에서 한 번만 사용한다. 종료점은 주석 본문에 `종료:` 또는 `종료(분기 이름):`을 적어 다음 사용자 입력을 기다리는지, 다른 FLOW로 넘기는지도 함께 밝힌다.

### `[FLOW-NN / N-A단계]`

같은 `N`단계에서 서로 다른 입력, 기능 또는 결과로 갈라지는 동급 branch다. 예를 들어 `FLOW-05 / 10-A`~`10-H`는 dispatcher의 action별 branch이고, `FLOW-03 / 10-A`~`10-C`는 WebView 성공·일반 오류·HTTP 오류 callback이다. 알파벳은 우선순위가 아니라 서로 다른 인과 경로를 뜻하며, 각 조합도 production source 전체에서 한 번만 사용한다.

단계 번호가 파일의 위에서 아래 순서와 항상 같지는 않다. React, Expo Router, `react-native-webview`, TanStack Query가 등록된 callback을 나중에 자동 호출하거나, 호출 결과가 Promise를 따라 caller로 되돌아가기 때문이다. 이 문서의 단계 지도에서 현재 branch를 선택한 뒤 같은 FLOW 표식을 검색한다.

### `[FLOW-NN / 관련 코드]`

이전 주석 체계에서 여러 call site를 한 표식으로 묶을 때 쓰던 형식이다. 현재 production source에는 남아 있지 않다. 실제로 값이나 control을 전달하는 caller·consumer는 모두 고유한 숫자 또는 `N-A` branch 단계로 승격해, 검색 중 인과 관계가 생략되지 않게 한다.

### `[이유]`

현재 방법을 선택한 이유를 설명한다. 이 표식을 읽을 때는 “이 처리를 지우면 어떤 화면이나 함수가 잘못되는가”를 함께 확인한다.

### `[주의]`

문자열, 탭 번호, 휴대폰 동작 규칙, 자동 생성 파일처럼 작은 수정도 예상 밖의 결과를 낼 수 있는 곳을 표시한다.

### `[검증 경계]`

현재 test나 함수가 어디까지 확인하는지 설명한다. 가짜 WebView와 가짜 함수를 사용한 test 결과를 실제 휴대폰 성공으로 잘못 이해하지 않도록, 실기기에서만 확인할 부분도 함께 적는다.

### 표식 운영 계약

현재 inline 주석 대상은 `app/`·`src/`의 TypeScript/TSX 43개와 `jest.setup.ts`·`eslint.config.js`를 합한 45개다. 이 가운데 production source는 28개, test는 15개, tooling entry는 2개다. JSON, lockfile, generated source와 build output은 이 수에 포함하지 않는다.

- 45개 대상은 모두 `[파일 역할]`로 시작한다. 15개 test는 `[검증 경계]`도 함께 둔다.
- 실제 함수와 Hook·event·listener·timer·cleanup·test callback에는 각각 가까운 위치에 `[역할]` 요약을 둔다.
- 기능 범위는 keyword가 있는 시작 구분선과 keyword가 없는 종료 구분선을 짝지어 표시한다. 큰 범위는 `=`, 그 안의 작은 범위는 `-`를 사용한다.
- `[문법]`과 `[라이브러리]`는 처음 보는 사람이 바로 다음 코드를 이해할 수 있도록 실제 코드 앞이나 같은 의미 묶음에 둔다.
- 함수가 누가 준 값을 받고 어디로 보내는지, state·ref·Query 보관값이 언제 사라지는지, 비동기 작업이 어떤 순서로 끝나는지, Android와 iOS가 왜 다른지를 짧은 문장으로 설명한다.
- `lifecycle`, `runtime`, `dependency`, `caller`, `consumer`, `branch`, `fixture`, `mock` 같은 개발 용어만으로 설명을 끝내지 않는다. 꼭 써야 하면 같은 문장에서 쉬운 뜻과 이 코드의 실제 동작을 붙인다.
- 한 문장에는 가능하면 한 가지 핵심만 둔다. 문장이 길어지면 “누가 하는가”, “언제 하는가”, “왜 필요한가”로 나눈다.
- 동일한 JSX 구조, 명백한 style property, 단순 field와 닫는 괄호는 줄마다 반복하지 않는다. 여러 줄이 하나의 계약이면 한 주석으로 묶는다.
- 현재 production source에는 시작 표식 9개와 고유 단계 표식 233개, 총 242개의 FLOW 표식이 있다. 단계 중복과 `[관련 코드]` 표식은 0개다.
- `[FLOW-NN]`, `[FLOW-NN / N단계]`, `[FLOW-NN / N-A단계]`는 production source 전체에서 한 곳에만 둔다. 문법이나 library 설명이 같은 위치에 필요해도 FLOW 표식을 하나 더 만들지 않는다.
- FLOW 표식이 있는 줄은 그 단계의 caller·입력·출력 또는 종료를 설명하는 독립 문장을 가져야 한다. `[문법]`, `[라이브러리]` 같은 비-FLOW 표식을 같은 줄에 붙여 단계 설명을 대신하지 않는다.
- 자동 callback에는 React·Expo Router·native WebView·TanStack Query 중 누가 언제 호출하는지 적고, callback이 받은 값과 다음 consumer를 같은 단계에서 연결한다.
- Promise 반환 경로는 호출 방향뿐 아니라 fulfill된 값이 어느 `return`과 prop을 역순으로 거쳐 최종 `.then`까지 도달하는지도 별도 단계로 적는다.
- 주석을 고치다가 실행 오류로 보이는 부분을 찾아도 같은 변경에 섞어 고치지 않는다. 어떤 화면과 함수에 영향이 있는지 먼저 따로 보고한다.

## 2. 먼저 따라갈 아홉 가지 흐름

처음에는 아래 순서대로 한 흐름씩 읽는 것을 권장한다. 한 flow 안에서는 링크를 열고 해당 `[FLOW-NN / N단계]` 또는 `[FLOW-NN / N-A단계]`를 검색한다. `→`는 반드시 이어지는 호출·반환이고, `├`와 `└`는 같은 단계에서 선택되거나 병행되는 branch다.

### FLOW-01: 앱 시작과 마지막 탭 복원

목표는 Root navigation 준비와 SecureStore 복원이 어디서 병행되고, 두 경로가 합쳐진 뒤에만 실제 shell이 mount되는 이유를 이해하는 것이다.

```text
[시작]
├─ 1-A store module 평가 → 2-A SecureStore read → 3-A read 실패
└─ 1-B RootLayout 자동 render → 2-B selector 구독 → 3-B loading 유지
   4-A 유효 탭 복원 / 4-B 기본 탭 유지
→ 5 onRehydrateStorage 완료 callback → 5-A 또는 5-B hasHydrated=true
→ 6 IndexScreen 자동 재render → 7 DemoShell mount → 8 복원 index 소비 → 9 종료
```

Source 단계 지도:

- [`app/_layout.tsx`](../app/_layout.tsx): 시작, `1-B`
- [`src/store/app-store.ts`](../src/store/app-store.ts): `1-A`, `2-A`, `3-A`, `4-A`·`4-B`, `5`, `5-A`·`5-B`
- [`app/index.tsx`](../app/index.tsx): `2-B`, `3-B`, `6`, `7`
- [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx): `8`, `9` 종료

읽으면서 구분할 수 있어야 하는 상태는 세 가지다.

| 상태 | 위치 | 수명 |
|---|---|---|
| 마지막 선택 탭 | Zustand + SecureStore | app 재실행 뒤 복원 |
| hydration 완료 여부 | Zustand runtime | process 시작마다 다시 계산 |
| 사용자 API cache | QueryClient | 현재 provider/process 수명 |

관련 test:

- [`src/store/app-store.test.ts`](../src/store/app-store.test.ts)
- [`src/components/IndexScreen.test.tsx`](../src/components/IndexScreen.test.tsx)

두 test는 pure merge와 화면 gate를 확인한다. 실제 SecureStore read와 cold custom-scheme navigation 순서는 mock 밖의 build·실기기 경계다.

#### 실제 소스로 따라가는 FLOW-01 핵심 경로

아래 발췌는 SecureStore에 저장된 `selectedTabIndex`가 유효하고, Zustand의 `onRehydrateStorage` 완료 callback이 복원된 store를 정상적으로 받는 경로를 따른다. 모든 예외 branch를 반복하지 않고 `1-A → 2-A → 4-A → 5 → 5-A`와 `1-B → 2-B → 3-B`가 `6`에서 합류해 `9`에서 끝나는 중심 인과 관계만 연결한다. 따라서 read 실패인 `3-A`, 기본값 유지인 `4-B`, store 인자가 없는 fallback인 `5-B`는 위의 기존 단계 지도와 source 링크에서 별도로 확인한다.

**[FLOW-01] 시작** — [`app/_layout.tsx:2`](../app/_layout.tsx#L2)

```tsx
// [파일 역할] 앱 전체의 가장 바깥 틀입니다. 화면들이 함께 쓸 Query 저장소와 화면 이동 Stack을 만듭니다.
// [FLOW-01] 시작: Expo Router가 앱 module을 준비하면 Root tree 구성과 저장된 탭 복원이 함께 시작됩니다.

// ... import와 module 준비 코드 생략 ...

export default function RootLayout() {
  // ... Root tree 구성은 1-B단계 발췌에서 이어짐 ...
}
```

↓ **Expo Router가 module graph를 준비하면 같은 시작점에서 저장 복원 A 경로와 화면 준비 B 경로가 갈라져 병행된다.**

##### A 경로: SecureStore에서 마지막 탭 복원

**[FLOW-01 / 1-A단계]** — [`src/store/app-store.ts:113-121`](../src/store/app-store.ts#L113-L121)

```ts
// [FLOW-01 / 1-A단계] 이 module이 평가되면 Zustand store를 만들고 `persist`가 비동기 rehydration을 자동으로 시작합니다.
export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      selectedTabIndex: 0,
      hasHydrated: false,
      // ... 상태 변경 setter 생략 ...
    }),
    {
      // ... storage, merge와 완료 callback 설정 생략 ...
    },
  ),
);
```

↓ **`persist`가 store의 초기값을 만든 직후 등록된 storage adapter에 저장 문자열을 요청한다.**

**[FLOW-01 / 2-A단계]** — [`src/store/app-store.ts:22-25`](../src/store/app-store.ts#L22-L25)

```ts
const secureStorage: StateStorage = {
  async getItem(name) {
    try {
      // [FLOW-01 / 2-A단계] Zustand `persist`가 `name`을 넘겨 이 adapter를 호출하면 SecureStore read Promise를 기다립니다.
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      // ... 3-A단계 read 실패 처리 생략 ...
    }
  },
  // ... setItem과 removeItem method 생략 ...
};
```

↓ **Promise가 정상 완료되면 `createJSONStorage`가 문자열을 JSON 값으로 복원하고, `mergePersistedAppState`가 외부 값을 현재 store와 합친다.**

**[FLOW-01 / 4-A단계]** — [`src/store/app-store.ts:95-104`](../src/store/app-store.ts#L95-L104)

```ts
export function mergePersistedAppState(
  persistedState: unknown,
  currentState: AppStore,
): AppStore {
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
```

↓ **유효한 `candidate`가 `selectedTabIndex`가 된 뒤 storage Promise가 끝나면, Zustand가 등록해 둔 완료 callback을 자동 호출한다.**

**[FLOW-01 / 5단계]** — [`src/store/app-store.ts:139-143`](../src/store/app-store.ts#L139-L143)

```ts
export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // ... 초기 state와 setter 생략 ...
    }),
    {
      // ... storage, partialize와 merge 설정 생략 ...
      onRehydrateStorage: () => (state, error) => {
        // [FLOW-01 / 5단계] storage Promise가 끝나면 `persist`가 이 완료 callback을 자동 호출해 성공·대체·실패 경로를 합칩니다.
        if (error) {
          console.warn("저장된 탭 설정을 복원하지 못했습니다.", error);
        }
        // ... 5-A와 5-B 완료 branch 생략 ...
      },
    },
  ),
);
```

↓ **이 핵심 경로에서는 복원된 `state`가 있으므로 5-A branch가 선택된다.**

**[FLOW-01 / 5-A단계]** — [`src/store/app-store.ts:145-148`](../src/store/app-store.ts#L145-L148)

```ts
export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // ... 초기 state와 setter 생략 ...
    }),
    {
      // ... storage와 merge 설정 생략 ...
      onRehydrateStorage: () => (state, error) => {
        // ... error 기록 처리 생략 ...
        if (state) {
          // [FLOW-01 / 5-A단계] 복원된 store가 있으면 그 store의 setter가 `hasHydrated`를 즉시 true로 바꿉니다.
          // store를 정상적으로 받았으면 준비된 상태 변경 함수로 `hasHydrated`를 true로 바꿉니다.
          state.setHasHydrated(true);
        } else {
          // ... 5-B단계 fallback 처리 생략 ...
        }
      },
    },
  ),
);
```

↓ **병행 경로 확인:** A 경로가 SecureStore Promise를 기다리는 동안, B 경로는 Root Stack을 먼저 mount하고 `hasHydrated`를 구독한 채 loading 화면에서 기다린다.

##### B 경로: Root Stack 준비와 hydration gate

**[FLOW-01 / 1-B단계]** — [`app/_layout.tsx:20-30`](../app/_layout.tsx#L20-L30)

```tsx
export default function RootLayout() {
  // [FLOW-01 / 1-B단계] Expo Router가 `RootLayout`을 호출하면 이 return이 Query provider와 Root `Stack`을 먼저 mount합니다.
  // Root Stack은 저장값을 읽기 전에 먼저 만듭니다. 그래야 앱을 주소로 열어도 이동할 화면이 이미 준비돼 있습니다.
  // [라이브러리] `headerShown: false`는 Stack이 자동으로 만드는 위쪽 제목 표시줄만 숨깁니다.
  // 앱이 직접 만든 하단 탭과 popup에는 영향을 주지 않습니다.
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
```

↓ **Root `Stack`이 index route를 render하면 `IndexScreen`이 runtime 완료 값 하나만 구독한다.**

**[FLOW-01 / 2-B단계]** — [`app/index.tsx:18-22`](../app/index.tsx#L18-L22)

```tsx
export default function IndexScreen() {
  // [FLOW-01 / 2-B단계] Root `Stack`이 `IndexScreen`을 render하면 selector가 `hasHydrated`를 구독합니다.
  // [라이브러리] 이 selector는 store 전체가 아니라 `hasHydrated` 하나만 지켜봅니다.
  // [역할] selector callback은 Zustand state에서 저장값 읽기 완료 여부만 골라냅니다.
  const hasHydrated = useAppStore((state) => state.hasHydrated);

  // ... 3-B단계 loading gate와 6~7단계 완료 화면 생략 ...
}
```

↓ **A 경로가 끝나기 전에는 초기값 `false`이므로 실제 shell을 만들지 않고 loading branch에서 return한다.**

**[FLOW-01 / 3-B단계]** — [`app/index.tsx:24-39`](../app/index.tsx#L24-L39)

```tsx
export default function IndexScreen() {
  const hasHydrated = useAppStore((state) => state.hasHydrated);

  // [FLOW-01 / 3-B단계] SecureStore read가 끝나기 전의 `false`는 이 loading branch를 선택해 `DemoShell` mount를 보류합니다.
  // [문법] 아직 준비되지 않았으면 여기서 바로 return합니다. 그래서 로딩 화면과 실제 화면이 함께 나타나지 않습니다.
  if (!hasHydrated) {
    // [이유] 로딩 화면을 Root Stack 안에 두면 주소로 앱을 처음 열어도 Stack이 먼저 준비됩니다.
    // [라이브러리] `accessibilityRole="progressbar"`는 화면 읽기 도구에 현재 작업이 진행 중이라고 알려 줍니다.
    return (
      <View
        accessibilityLabel="저장된 앱 설정을 불러오는 중"
        accessibilityRole="progressbar"
        style={styles.centered}
      >
        <ActivityIndicator size="large" />
        <Text style={styles.message}>앱 설정을 불러오고 있습니다.</Text>
      </View>
    );
  }

  // ... 6~7단계 hydration 완료 화면 생략 ...
}
```

↓ **A 경로의 5-A가 `hasHydrated=true`를 publish하면 두 경로가 합류한다. 구독 중인 `IndexScreen`은 React에 의해 자동 재render되고 loading 조기 return을 벗어난다.**

##### 합류 경로: 복원값 소비와 종료

**[FLOW-01 / 6단계 → 7단계]** — [`app/index.tsx:41-49`](../app/index.tsx#L41-L49)

```tsx
export default function IndexScreen() {
  // ... 2-B단계 selector와 3-B단계 loading branch 생략 ...

  // [FLOW-01 / 6단계] Zustand가 구독자에게 `hasHydrated=true`를 알리면 React가 이 화면을 다시 render해 loading branch를 벗어납니다.
  // [FLOW-01 / 7단계] React는 이 return의 `DemoShell`을 처음 mount하고 복원된 탭을 소비하는 다음 단계로 넘깁니다.
  // [라이브러리] `edges={["top"]}`은 위쪽 안전 여백만 이곳에서 넣겠다는 뜻입니다.
  // 아래쪽 여백은 BottomTabBar가 기기에 맞춰 따로 계산합니다.
  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <DemoShell />
    </SafeAreaView>
  );
}
```

↓ **처음 mount된 `DemoShell`은 merge가 끝난 같은 Zustand store에서 복원된 탭 번호를 읽는다.**

**[FLOW-01 / 8단계]** — [`src/components/DemoShell.tsx:126-130`](../src/components/DemoShell.tsx#L126-L130)

```tsx
export function DemoShell() {
  // ... 다른 Hook과 runtime state 선언 생략 ...

  // [FLOW-01 / 8단계] mount된 `DemoShell`의 selector가 복원됐거나 기본값인 `selectedTabIndex`를 처음 읽습니다.
  // [FLOW-02 / 1단계] 같은 selector 값이 네 child의 `active` prop과 하단 버튼의 `selectedIndex`를 정하는 기준이 됩니다.
  // [라이브러리] Zustand에서 탭 번호와 탭 변경 함수를 따로 읽습니다. 필요한 값이 바뀔 때만 이 화면을 다시 그리게 합니다.
  // [역할] 첫 Zustand selector callback은 현재 선택된 탭 번호만 store에서 꺼냅니다.
  const selectedTabIndex = useAppStore((state) => state.selectedTabIndex);

  // ... 나머지 state, effect, handler와 JSX return 생략 ...
}
```

↓ **`selectedTabIndex`는 네 child를 없애고 다시 만드는 조건이 아니라, 어느 child가 처음 활성 상태인지 정하는 prop 비교값이 된다.**

**[FLOW-01 / 9단계 — Web 탭 종료 지점]** — [`src/components/DemoShell.tsx:672-684`](../src/components/DemoShell.tsx#L672-L684)

```tsx
export function DemoShell() {
  // ... Hook, state, effect와 handler 생략 ...
  const selectedTabIndex = useAppStore((state) => state.selectedTabIndex);
  // ... 나머지 state, 계산값, ref, effect와 handler 생략 ...

  return (
    <View style={styles.container}>
      {/* ... network banner와 iOS toolbar 생략 ... */}

      <View style={styles.content}>
        {/* [역할] `map` callback은 앞의 세 탭 정의를 항상 mount된 `WebTab` 세 개로 바꿉니다.
            [FLOW-01 / 9단계] 종료: 복원된 index로 네 child의 최초 active 상태를 정하면 앱 시작·복원 흐름이 끝납니다.
            [FLOW-02 / 3단계] React가 이 `map` callback을 실행해 세 tab definition을 항상 mount되는 `WebTab` props로 각각 전달합니다.
            [FLOW-02 / 12-A단계] 종료(다른 탭): Zustand update 뒤 이 map이 새 active props로 다시 render되지만 기존 child identity는 유지합니다.
            [문법]
            `slice(...).map(...)`은 세 WebTab을 차례로 모두 만듭니다.
            바로 아래 NativeUsersScreen도 조건문 밖에서 항상 만듭니다.
            탭을 바꿀 때 네 화면을 없애지 않고, active props로 보임과 터치만 바꿉니다. */}
        {TAB_DEFINITIONS.slice(0, 3).map((tab) => (
          <WebTab
            active={selectedTabIndex === tab.index}
            bottomContentInset={bottomBarHiddenOffset}
            /* ... FLOW-01과 직접 관계없는 나머지 WebTab props 생략 ... */
          />
        ))}

        {/* ... NativeUsersScreen은 다음 발췌에서 이어짐 ... */}
      </View>

      {/* ... 하단 탭, Snackbar와 popup 생략 ... */}
    </View>
  );
}
```

↓ **같은 단계의 Native consumer:** 같은 9단계에서 native 탭도 항상 mount되고, 복원값이 `3`일 때만 최초 active가 된다.

**[FLOW-01 / 9단계 — Native 탭 종료 지점]** — [`src/components/DemoShell.tsx:672-679`](../src/components/DemoShell.tsx#L672-L679), [`src/components/DemoShell.tsx:719-722`](../src/components/DemoShell.tsx#L719-L722)

```tsx
export function DemoShell() {
  // ... Hook, state, effect와 handler 생략 ...
  const selectedTabIndex = useAppStore((state) => state.selectedTabIndex);
  // ... 나머지 state, 계산값, ref, effect와 handler 생략 ...

  return (
    <View style={styles.container}>
      {/* ... network banner와 iOS toolbar 생략 ... */}

      <View style={styles.content}>
        {/* [역할] `map` callback은 앞의 세 탭 정의를 항상 mount된 `WebTab` 세 개로 바꿉니다.
            [FLOW-01 / 9단계] 종료: 복원된 index로 네 child의 최초 active 상태를 정하면 앱 시작·복원 흐름이 끝납니다.
            [FLOW-02 / 3단계] React가 이 `map` callback을 실행해 세 tab definition을 항상 mount되는 `WebTab` props로 각각 전달합니다.
            [FLOW-02 / 12-A단계] 종료(다른 탭): Zustand update 뒤 이 map이 새 active props로 다시 render되지만 기존 child identity는 유지합니다.
            [문법]
            `slice(...).map(...)`은 세 WebTab을 차례로 모두 만듭니다.
            바로 아래 NativeUsersScreen도 조건문 밖에서 항상 만듭니다.
            탭을 바꿀 때 네 화면을 없애지 않고, active props로 보임과 터치만 바꿉니다. */}
        {/* ... WebTab 세 개의 map 출력 생략 ... */}

        {/* [FLOW-07 / 1단계] DemoShell render가 항상 이 component를 만들고 선택 index를 `active` prop으로 전달합니다. */}
        <NativeUsersScreen
          active={selectedTabIndex === 3}
          bottomContentInset={bottomBarHiddenOffset}
          /* ... FLOW-01과 직접 관계없는 나머지 NativeUsersScreen props 생략 ... */
        />
      </View>

      {/* ... 하단 탭, Snackbar와 popup 생략 ... */}
    </View>
  );
}
```

↓ **종료:** 복원된 index가 Web 탭 세 개와 native 탭 하나의 최초 `active`를 결정한다. 네 child가 모두 mount된 뒤 앱 시작·복원 책임은 끝나고, 이후 탭 수명과 전환은 `FLOW-02`가 이어받는다.

### FLOW-02: 탭 mount 수명, 전환과 재선택

목표는 “선택되지 않은 tab이 화면에서 보이지 않음”과 “component/WebView가 unmount됨”이 같은 말이 아니며, 다른 tab 선택과 현재 tab 재선택의 종료점도 서로 다름을 이해하는 것이다.

```text
[시작] 1 selectedTabIndex 구독 → 2 공통 tab 배열 → 3 child map
├─ 4-A Web ref / 4-B native ref 저장 → 5-A / 5-B inactive 표시만 차단
└─ 6 button press → 7 handleTabSelect
   ├─ 8-A 다른 tab → 9-A Zustand setter → 10-A partialize → 11-A SecureStore write → 12-A 종료
   ├─ 8-B Web 재선택 → 9-B reloadInitial → 10-B 새 WebView → 11-B 종료 후 FLOW-03
   └─ 8-C native 재선택 → 9-C 종료 후 FLOW-07 refetch
```

Source 단계 지도:

- [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx): 시작, `1`, `3`, `4-A`, `7`, `8-A`·`8-B`·`8-C`, `9-C`, `12-A`
- [`src/constants/tabs.ts`](../src/constants/tabs.ts): `2`
- [`src/components/WebTab.tsx`](../src/components/WebTab.tsx): `4-A`, `5-A`, `9-B`, `10-B`, `11-B`
- [`src/components/NativeUsersScreen.tsx`](../src/components/NativeUsersScreen.tsx): `4-B`, `5-B`
- [`src/components/BottomTabBar.tsx`](../src/components/BottomTabBar.tsx): `6`
- [`src/store/app-store.ts`](../src/store/app-store.ts): `9-A`, `10-A`, `11-A`

함께 읽을 파일:

- [`src/constants/tabs.ts`](../src/constants/tabs.ts): index·tag·label·최초 URL의 단일 순서
- [`src/types/navigation.ts`](../src/types/navigation.ts): `TabIndex`, `TabTag`, runtime guard
- [`src/components/WebTab.test.tsx`](../src/components/WebTab.test.tsx): inactive mount 유지와 reload remount 계약
- [`src/components/BottomTabBar.test.tsx`](../src/components/BottomTabBar.test.tsx): 선택 접근성 상태와 callback

Web tab은 `opacity: 0`과 input/accessibility 차단을 사용하며 `display: none`이나 조건부 render로 제거하지 않는다. native tab은 wrapper UI가 `display: none`이지만 component instance와 Query observer code는 tree에 남는다.

#### 실제 소스로 따라가는 FLOW-02 핵심 경로

아래 발췌는 `DemoShell`이 세 `WebTab`을 항상 mount한 뒤 사용자가 현재 탭과 다른 Web 탭을 누르는 경로를 따른다. `1 → 2 → 3 → 4-A → 5-A`에서 mount 수명을 확인하고, `6 → 7 → 8-A → 9-A → 10-A → 11-A`의 변경·저장 뒤 같은 `3`단계 render가 `12-A` 종료점으로 다시 실행되는 인과관계를 연결한다. 현재 Web 탭 재선택의 `8-B`~`11-B`, native 탭 재선택의 `8-C`·`9-C`, native ref·wrapper의 `4-B`·`5-B`는 위의 기존 단계 지도에서 별도로 확인한다.

**[FLOW-02] 시작** — [`src/components/DemoShell.tsx:1-2`](../src/components/DemoShell.tsx#L1-L2)

```tsx
// [파일 역할] 앱의 중심 화면입니다. 네 탭, popup, bridge, deep link, 기기 뒤로 가기, 하단 탭 막대, 인터넷 연결 안내를 서로 이어 줍니다.
// [FLOW-02] 시작: `DemoShell` mount 뒤 네 탭을 모두 유지하고, 사용자의 탭 누름을 전환 또는 재선택 branch로 나눕니다.

// ... import와 module helper 생략 ...

export function DemoShell() {
  // ... 탭 state 구독과 child render는 다음 발췌에서 이어짐 ...
}
```

↓ **React가 `DemoShell`을 render하면 먼저 Zustand selector가 현재 index를 구독하고, 이 값이 child와 하단 버튼에 함께 전달될 기준이 된다.**

**[FLOW-02 / 1단계]** — [`src/components/DemoShell.tsx:126-130`](../src/components/DemoShell.tsx#L126-L130)

```tsx
export function DemoShell() {
  // ... 다른 Hook 입력 생략 ...

  // [FLOW-01 / 8단계] mount된 `DemoShell`의 selector가 복원됐거나 기본값인 `selectedTabIndex`를 처음 읽습니다.
  // [FLOW-02 / 1단계] 같은 selector 값이 네 child의 `active` prop과 하단 버튼의 `selectedIndex`를 정하는 기준이 됩니다.
  // [라이브러리] Zustand에서 탭 번호와 탭 변경 함수를 따로 읽습니다. 필요한 값이 바뀔 때만 이 화면을 다시 그리게 합니다.
  // [역할] 첫 Zustand selector callback은 현재 선택된 탭 번호만 store에서 꺼냅니다.
  const selectedTabIndex = useAppStore((state) => state.selectedTabIndex);

  // ... setter, ref와 JSX return 생략 ...
}
```

↓ **`DemoShell`과 `BottomTabBar`는 서로 다른 배열을 만들지 않고 같은 `TAB_DEFINITIONS`를 읽으므로 index·tag·표시 순서가 일치한다.**

**[FLOW-02 / 2단계]** — [`src/constants/tabs.ts:29-39`](../src/constants/tabs.ts#L29-L39)

```ts
// [문법] `readonly`는 이 배열을 사용하는 코드가 `push`나 `splice`로 탭 순서를 바꾸지 못하게 합니다.
export const TAB_DEFINITIONS: readonly TabDefinition[] = [
  // [FLOW-02 / 2단계] `DemoShell`과 `BottomTabBar`가 이 같은 배열을 읽어 화면, 버튼, ref의 index·tag 순서를 맞춥니다.
  {
    index: 0,
    tag: "f0",
    label: "메인화면",
    icon: "home-outline",
    selectedIcon: "home",
    initialUrl: null,
  },
  // ... 나머지 Web 탭 두 개와 native 탭 정의 생략 ...
];
```

↓ **React는 배열 앞의 세 정의를 조건부 render가 아닌 `map`으로 모두 `WebTab`에 전달한다. 같은 block은 최초 mount에서는 `3`, Zustand 변경 뒤 재render에서는 `12-A` 종료점 역할을 한다.**

**[FLOW-02 / 3단계·12-A단계]** — [`src/components/DemoShell.tsx:672-683`](../src/components/DemoShell.tsx#L672-L683)

```tsx
export function DemoShell() {
  // ... state, effect와 handler 생략 ...
  const selectedTabIndex = useAppStore((state) => state.selectedTabIndex);
  // ... 나머지 state, 계산값, ref, effect와 handler 생략 ...

  return (
    <View style={styles.container}>
      {/* ... 상단 UI 생략 ... */}

      <View style={styles.content}>
        {/* [역할] `map` callback은 앞의 세 탭 정의를 항상 mount된 `WebTab` 세 개로 바꿉니다.
            [FLOW-01 / 9단계] 종료: 복원된 index로 네 child의 최초 active 상태를 정하면 앱 시작·복원 흐름이 끝납니다.
            [FLOW-02 / 3단계] React가 이 `map` callback을 실행해 세 tab definition을 항상 mount되는 `WebTab` props로 각각 전달합니다.
            [FLOW-02 / 12-A단계] 종료(다른 탭): Zustand update 뒤 이 map이 새 active props로 다시 render되지만 기존 child identity는 유지합니다.
            [문법]
            `slice(...).map(...)`은 세 WebTab을 차례로 모두 만듭니다.
            바로 아래 NativeUsersScreen도 조건문 밖에서 항상 만듭니다.
            탭을 바꿀 때 네 화면을 없애지 않고, active props로 보임과 터치만 바꿉니다. */}
        {TAB_DEFINITIONS.slice(0, 3).map((tab) => (
          <WebTab
            active={selectedTabIndex === tab.index}
            /* ... FLOW-02와 직접 관계없는 props 생략 ... */
          />
        ))}

        {/* ... 항상 mount되는 NativeUsersScreen 생략 ... */}
      </View>
      {/* ... 하단 tab, Snackbar와 PopupWebView 생략 ... */}
    </View>
  );
}
```

↓ **각 `WebTab`이 commit되면 ref callback은 그 child의 명령 객체를 같은 index 칸에 저장한다. 탭 전환은 이 ref나 child identity를 제거하지 않는다.**

**[FLOW-02 / 4-A단계]** — [`src/components/DemoShell.tsx:709-714`](../src/components/DemoShell.tsx#L709-L714)

```tsx
export function DemoShell() {
  // ... state와 handler 생략 ...

  return (
    <View style={styles.container}>
      {/* ... network banner와 iOS toolbar 생략 ... */}
      <View style={styles.content}>
        {TAB_DEFINITIONS.slice(0, 3).map((tab) => (
          <WebTab
            /* ... 다른 props 생략 ... */
            ref={(value) => {
              // [역할] WebTab ref callback은 만들어지거나 사라진 탭의 공개 명령을 같은 index 위치에 저장합니다.
              // [FLOW-02 / 4-A단계] React가 각 WebTab을 commit하면 이 ref callback을 호출해 공개 명령을 같은 index 칸에 저장합니다.
              // WebTab이 만들어지면 해당 index에 ref 명령을 저장하고, 사라지면 null을 저장합니다.
              webTabRefs.current[tab.index] = value;
            }}
            /* ... tag prop 생략 ... */
          />
        ))}
        {/* ... 항상 mount되는 NativeUsersScreen 생략 ... */}
      </View>
      {/* ... 하단 tab, Snackbar와 PopupWebView 생략 ... */}
    </View>
  );
}
```

↓ **inactive Web 탭도 tree에서 제거되지 않는다. `active` prop은 wrapper의 opacity·pointer·accessibility만 바꿔 document와 history를 보존한다.**

**[FLOW-02 / 5-A단계]** — [`src/components/WebTab.tsx:315-325`](../src/components/WebTab.tsx#L315-L325)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  { tag, active, /* ... 나머지 props 생략 ... */ },
  forwardedRef,
) {
  // ... WebView state, ref와 명령 생략 ...

  return (
    <View
      accessibilityElementsHidden={!active}
      collapsable={false}
      importantForAccessibility={active ? "auto" : "no-hide-descendants"}
      pointerEvents={active ? "auto" : "none"}
      style={[styles.container, !active && styles.inactive]}
      testID={`web-tab-${tag}`}
    >
      {/* [FLOW-02 / 5-A단계] React는 inactive WebTab도 unmount하지 않고 이 wrapper의 표시·입력·접근성만 바꿉니다. */}
      {/* ... progress, WebView와 error UI 생략 ... */}
    </View>
  );
});
```

↓ **사용자가 다른 하단 버튼을 누르면 React Native가 해당 `Pressable.onPress`를 호출하고 배열에 있던 `tab.index`를 parent의 `onSelect`로 올린다.**

**[FLOW-02 / 6단계]** — [`src/components/BottomTabBar.tsx:50-67`](../src/components/BottomTabBar.tsx#L50-L67)

```tsx
export function BottomTabBar({
  selectedIndex,
  onSelect,
}: BottomTabBarProps) {
  // ... safe-area 계산 생략 ...

  return (
    <View
      accessibilityRole="tablist"
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      {TAB_DEFINITIONS.map((tab) => {
        // [역할] `map` callback은 탭 정의 하나를 선택 상태와 누름 동작을 가진 버튼 하나로 바꿉니다.
        // [문법] `map`은 탭 정의 하나를 `Pressable` 하나로 바꿔 네 버튼 배열을 만듭니다.
        const selected = selectedIndex === tab.index;

        // `key`에 고정된 tag를 넣어 React가 다시 그릴 때도 같은 탭 버튼임을 알아보게 합니다.
        // style 함수의 `pressed`는 누르는 동안만 true입니다. `&&` 뒤 style도 그때만 추가됩니다.
        return (
          <Pressable
            accessibilityLabel={tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={tab.tag}
            onPress={() => {
              // [역할] `onPress` callback은 이 버튼의 탭 번호만 DemoShell의 선택 함수에 전달합니다.
              // [FLOW-02 / 6단계] 사용자가 버튼을 누르면 React Native가 `onPress`를 호출하고 이 callback은 `onSelect(tab.index)`를 실행합니다.
              onSelect(tab.index);
            }}
            /* ... style prop 생략 ... */
          >
            {/* ... icon과 label 생략 ... */}
          </Pressable>
        );
      })}
    </View>
  );
}
```

↓ **`onSelect`는 `DemoShell.handleTabSelect`를 가리킨다. callback은 전달받은 index를 현재 index와 비교하고, 이 핵심 경로에서는 서로 다르므로 재선택 branch를 건너뛰어 Zustand setter를 호출한다.**

**[FLOW-02 / 7단계 → 8-A단계]** — [`src/components/DemoShell.tsx:534-559`](../src/components/DemoShell.tsx#L534-L559)

```tsx
export function DemoShell() {
  // ... state와 ref 선언 생략 ...

  // [역할] `handleTabSelect`는 다른 탭 선택과 현재 탭 재선택을 구분해 탭 변경 또는 새로 고침을 실행합니다.
  const handleTabSelect = useCallback(
    (index: TabIndex) => {
      // [FLOW-02 / 7단계] `BottomTabBar.onSelect`가 이 callback을 호출하면 먼저 scroll 숨김을 풀고 현재 index와 비교합니다.
      // [FLOW-08 / 1-D단계] 탭 선택 event는 새 화면이 이전 화면의 scroll 숨김을 이어받지 않도록 scroll 표시 state를 true로 만듭니다.
      // 탭을 누르면 스크롤 때문에 숨었던 하단 탭 막대를 먼저 다시 보이게 합니다.
      setScrollBottomBarVisible(true);

      if (index === selectedTabIndex) {
        // ... 8-B Web 재선택과 8-C native 재선택 branch 생략 ...
        return;
      }

      // [FLOW-02 / 8-A단계] 다른 탭 branch는 `setSelectedTabIndex(index)`를 호출해 Zustand 변경·재render·persist 경로를 시작합니다.
      setSelectedTabIndex(index);
    },
    [selectedTabIndex, setSelectedTabIndex],
  );

  // ... JSX return 생략 ...
}
```

↓ **Zustand setter는 새 index만 state에 반영한다. Zustand는 selector 구독자인 `DemoShell`과 `persist` middleware에 같은 변경을 각각 알린다.**

**[FLOW-02 / 9-A단계]** — [`src/store/app-store.ts:119-124`](../src/store/app-store.ts#L119-L124)

```ts
export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      selectedTabIndex: 0,
      hasHydrated: false,
      // [역할] `setSelectedTabIndex` callback은 받은 탭 번호만 현재 Zustand state에 반영합니다.
      // [FLOW-02 / 9-A단계] 다른 탭 branch가 이 setter를 호출하면 Zustand가 index를 갱신하고 구독 중인 `DemoShell`과 `persist`에 변경을 알립니다.
      setSelectedTabIndex: (selectedTabIndex) => set({ selectedTabIndex }),
      // ... hydration setter 생략 ...
    }),
    // ... persist option 생략 ...
  ),
);
```

↓ **`persist`는 전체 runtime state를 저장하지 않고 `partializeAppState`를 호출해 다음 실행에도 필요한 `selectedTabIndex` 하나만 고른다.**

**[FLOW-02 / 10-A단계]** — [`src/store/app-store.ts:75-83`](../src/store/app-store.ts#L75-L83)

```ts
// [역할] `partializeAppState`는 전체 Zustand state에서 앱 재실행 뒤에도 남길 탭 번호만 골라냅니다.
export function partializeAppState(state: AppStore): PersistedAppState {
  // [FLOW-02 / 10-A단계] `selectedTabIndex` 변경을 감지한 `persist`가 이 함수를 호출해 저장할 탭 번호만 JSON 대상으로 고릅니다.
  // [이유] `hasHydrated`와 상태 변경 함수는 현재 실행에서만 필요하므로 저장하지 않습니다.
  // 다음 실행에 지난 완료 상태나 함수를 잘못 불러오지 않게 합니다.
  return {
    selectedTabIndex: state.selectedTabIndex,
  };
}
```

↓ **Zustand가 선택값을 JSON 문자열로 만든 뒤 storage adapter의 `setItem`에 key와 문자열을 넘긴다. adapter는 SecureStore write Promise가 끝날 때까지 기다린다.**

**[FLOW-02 / 11-A단계]** — [`src/store/app-store.ts:33-42`](../src/store/app-store.ts#L33-L42)

```ts
const secureStorage: StateStorage = {
  // ... getItem 생략 ...

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

  // ... removeItem 생략 ...
};
```

↓ **종료:** 같은 state 변경으로 `DemoShell`도 재render된다. 앞서 본 `3`단계 `map`이 기존 child identity와 ref는 유지한 채 새 `active` 비교값만 전달하면 `12-A`에서 다른 탭 전환이 끝난다. SecureStore write는 다음 app 실행의 FLOW-01 복원 입력으로 남는다.

### FLOW-03: 일반 WebView navigation, history와 오류 복구

이 FLOW는 app이 요청을 만드는 단계, native WebView가 자동 callback을 호출하는 단계, 성공·실패 후 사용자 recovery 단계까지 한 session으로 연결한다.

```text
[시작] 1 WebTab state/ref 준비
├─ 2-A 첫 document 전 source 교체
├─ 2-B iOS 열린 document에 location.assign 주입
├─ 2-C reloadInitial로 새 key
├─ 2-D Android 열린 document의 URL policy 직접 호출
│  ├─ 2-E policy false면 변경 없이 종료
│  ├─ 2-F 현재 URL과 같으면 native reload로 종료
│  └─ 2-G 허용된 다른 URL을 같은 key의 native source load로 요청
→ 3 React commit과 native request
├─ 4-A onShouldStartLoadWithRequest → 5 parent handler → 6 classifier → 7-A~7-E decision
└─ 4-B Android 최초 source는 policy callback 생략
→ 8 onLoadStart
├─ 9-A onNavigationStateChange(start)
└─ 9-B onLoadProgress 반복
├─ 10-A onLoad → 11-A onLoadEnd → 12-A onNavigationStateChange(end) → 13-A 성공 종료
├─ 10-B onError → 11-B onLoadEnd → 13-B 실패 대기
└─ 10-C onHttpError → 일반 finish event가 이어질 수 있음 → 13-B 실패 대기
   14-A retry / 14-B 초기 화면 / 14-C back / 14-D forward가 새 navigation을 시작
```

Source 단계 지도:

- [`src/components/WebTab.tsx`](../src/components/WebTab.tsx): 시작, `1`, `2`, `2-A`~`2-G`, `3`, `4-A`·`4-B`, `8`, `9-A`·`9-B`, `10-A`·`10-B`·`10-C`, `11-A`·`11-B`, `12-A`, `13-A`·`13-B`, `14-A`~`14-D`
- [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx): `5`, `7-A`~`7-E`
- [`src/services/url-router.ts`](../src/services/url-router.ts): `6`

`loadUrl`의 첫 document `2-A`, iOS 열린 document `2-B`, Android 열린 document `2-D`~`2-G`와 `reloadInitial`의 `2-C` 차이가 deep link와 bridge 탭 이동 뒤 WebView history 유지 여부를 결정한다. Android의 app-initiated `source` load는 최초 load뿐 아니라 열린 document에서 `2-G`가 만든 load도 `4-A`를 자동으로 거치지 않으므로, `2-D`가 같은 parent policy를 먼저 직접 호출한다는 점도 함께 읽는다.

관련 test인 [`src/components/WebTab.test.tsx`](../src/components/WebTab.test.tsx)는 WebView 대역의 mount·props·callback을 확인한다. 실제 page load, cookie, native history와 gesture는 test 범위가 아니다.

#### 실제 소스로 따라가는 FLOW-03 핵심 경로

아래 발췌는 iOS에서 아직 완료된 document가 없는 `WebTab.loadUrl(httpsUrl)` 호출이 `2-A`에서 `source`를 정하고, `onShouldStartLoadWithRequest`가 전달되는 navigation에서 classifier의 `allow`를 받아 성공하는 경로를 따른다. Android에서 최초 source가 policy callback을 생략하는 `4-B`, 열린 document의 `2-D`~`2-G`, iOS 기존 document의 `2-B`, 새 key를 만드는 `2-C`, 차단·deep link·external인 `7-B`~`7-E`, 실패·사용자 recovery인 `10-B`~`14-D`는 위의 기존 단계 지도와 뒤의 Android 보강 경로에서 별도로 확인한다.

**[FLOW-03] 시작** — [`src/components/WebTab.tsx:1-2`](../src/components/WebTab.tsx#L1-L2)

```tsx
// [파일 역할] WebView 탭 하나를 화면에 띄우고, 그 탭에서 연 웹 문서와 방문 기록을 관리합니다.
// [FLOW-03] 시작: React가 `source`를 native WebView에 전달하거나 기존 document에 이동 명령을 보내면 navigation 흐름이 시작됩니다.

// ... import와 type 선언 생략 ...

export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    // ... WebTab props 생략 ...
  },
  forwardedRef,
) {
  // ... source state와 WebView callback은 다음 발췌에서 이어짐 ...
});
```

↓ **`WebTab` render는 parent가 준 `initialSource`를 현재 native session의 source로 저장하고, 같은 session의 key·progress·error state를 함께 준비한다.**

**[FLOW-03 / 1단계]** — [`src/components/WebTab.tsx:136-148`](../src/components/WebTab.tsx#L136-L148)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    tag,
    active,
    // ... bottomContentInset 생략 ...
    initialSource,
    // ... callback props 생략 ...
  },
  forwardedRef,
) {
  // ... 명령 ref 생략 ...

  // [FLOW-03 / 1단계] `WebTab` render는 `initialSource`로 `source`를 만들고 state·ref를 해당 WebView session의 기준값으로 준비합니다.
  // ref는 방문 기록과 스크롤 값을 기억하고, state는 화면에 보일 진행률과 오류를 관리합니다.
  // [역할] `useState<WebViewSource>`는 현재 WebView가 열 source를 보관하고 변경합니다.
  // [문법] `useState<WebViewSource>`는 source에 WebView가 알아듣는 값만 넣을 수 있게 type을 정합니다.
  const [source, setSource] = useState<WebViewSource>(initialSource);
  // [역할] `useState`의 reloadKey는 WebView를 완전히 새로 만들 횟수를 보관합니다.
  // reloadKey가 바뀌면 React는 같은 자리에 있는 WebView도 새 component로 만듭니다. 방문 기록까지 처음부터 다시 시작하려고 쓰는 값입니다.
  const [reloadKey, setReloadKey] = useState(0);
  // [역할] `useState`의 progress는 현재 웹 문서를 얼마나 불러왔는지 보관합니다.
  const [progress, setProgress] = useState(0);
  // [역할] `useState<LoadError | null>`은 현재 오류 안내 내용이나 오류 없음 상태를 보관합니다.
  // progress가 바뀌면 진행 표시줄을, loadError가 바뀌면 오류 안내 화면을 다시 그립니다.
  const [loadError, setLoadError] = useState<LoadError | null>(null);

  // ... 공개 명령과 JSX return 생략 ...
});
```

↓ **이 핵심 경로에서 parent가 `loadUrl(httpsUrl)`을 부를 때 아직 `onLoadEnd`를 받은 document가 없으므로 JavaScript를 주입하지 않고 `setSource({ uri })`를 선택한다.**

**[FLOW-03 / 2-A단계]** — [`src/components/WebTab.tsx:275-277`](../src/components/WebTab.tsx#L275-L277)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    // ... WebTab props 생략 ...
  },
  forwardedRef,
) {
  // ... state와 helper 생략 ...

  useImperativeHandle(
    forwardedRef,
    () => ({
      reloadInitial,
      // [역할] `loadUrl`은 문서 준비 여부에 따라 source를 바꾸거나 현재 방문 기록에 URL을 이어 엽니다.
      loadUrl(url) {
        // 새 URL로 이동하기 전에 이전 웹 문서의 오류 안내부터 지웁니다.
        setLoadError(null);

        if (hasLoadedDocumentRef.current) {
          if (Platform.OS === "android") {
            // ... Android FLOW-03 2-D~2-G native source 분기 생략 ...
          }

          // [이유] Android branch는 위에서 모두 반환하므로 기존 `location.assign` 경로는 iOS WebView history 방식을 그대로 유지합니다.
          // [FLOW-03 / 2-B단계] 준비된 document가 있으면 `location.assign(url)`을 주입해 같은 native instance와 history에서 이동합니다.
          // 웹 문서가 이미 열려 있으면 `location.assign`을 실행합니다. 같은 WebView를 쓰므로 기존 뒤로 가기 기록이 남습니다.
          const serializedUrl = JSON.stringify(url);
          // `JSON.stringify`로 URL의 따옴표를 안전하게 처리합니다. 끝의 `true;`는 WebView가 실행 결과를 분명하게 받도록 붙입니다.
          webViewRef.current?.injectJavaScript(
            `window.location.assign(${serializedUrl}); true;`,
          );
          return;
        }

        // [FLOW-03 / 2-A단계] 아직 완료 callback을 받은 document가 없으면 `setSource({ uri })`가 다음 React render의 최초 native load를 정합니다.
        // 첫 웹 문서가 열리기 전에는 JavaScript를 실행할 대상이 없습니다. 대신 source에 URL을 넣어 WebView가 그 주소로 시작하게 합니다.
        setSource({ uri: url });
      },
      // ... history 명령 생략 ...
    }),
    // ... dependency 생략 ...
  );
  // ... 나머지 imperative handle, effect와 JSX return 생략 ...
});
```

↓ **`setSource`가 React 재render를 요청하면 `WebTab`은 등록할 기능·callback과 현재 `source`·`key`를 하나의 native `WebView` props로 만들고, React commit 뒤 platform request가 시작된다.**

**[FLOW-03 / 2단계 → 3단계]** — [`src/components/WebTab.tsx:332-343`](../src/components/WebTab.tsx#L332-L343)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    tag,
    active,
    // ... 나머지 props 생략 ...
  },
  forwardedRef,
) {
  // ... state와 callback 생략 ...

  return (
    // active가 false여도 WebView를 없애지 않습니다. 투명하게 만들고 터치만 막아 웹 문서, 방문 기록, 입력 중인 form 값을 그대로 둡니다.
    <View
      /* ... accessibility, collapsable과 pointer props 생략 ... */
      style={[styles.container, !active && styles.inactive]}
      testID={`web-tab-${tag}`}
    >
      {/* ... progress UI 생략 ... */}
      {/* [FLOW-03 / 2단계] WebTab render가 아래 기능·callback props를 구성하고 `source`·`key`와 함께 stage 3의 native WebView에 전달합니다.
          [라이브러리]
          아래 props는 JavaScript, 웹 저장소, cookie, 새 창처럼 이 WebView에서 사용할 기능을 정합니다.
          `originWhitelist={["*"]}`는 모든 scheme을 먼저 이 WebView callback으로 보냅니다.
          실제로 열지는 `onShouldStartLoadWithRequest`가 돌려주는 true 또는 false로 정합니다. */}
      {/* [FLOW-02 / 10-B단계] React는 증가한 `reloadKey`를 다른 identity로 보고 이전 WebView를 unmount한 뒤 최초 source의 새 instance를 mount합니다. */}
      {/* [FLOW-03 / 4-B단계] Android 최초 `source` load는 `onShouldStartLoadWithRequest`를 생략하므로 이 앱이 직접 만든 initial source가 바로 native load로 진행합니다. */}
      {/* [FLOW-03 / 3단계] React가 이 `key`와 `source`를 native WebView에 commit하면 platform이 해당 URL request를 시작합니다. */}
      <WebView
        key={reloadKey}
        ref={webViewRef}
        source={source}
        /* ... 나머지 WebView props 생략 ... */
      />
      {/* ... error overlay 생략 ... */}
    </View>
  );
});
```

↓ **이 iOS source navigation처럼 native policy event가 제공되는 요청에서는 `react-native-webview`가 policy prop을 자동 호출한다. Web document가 직접 시작한 Android navigation도 이 callback을 거치지만, app이 `source` prop으로 시작한 Android `2-A`·`2-G` 요청은 거치지 않으므로 뒤의 `2-D`가 policy를 직접 호출한다. callback 자체는 URL을 판단하지 않고 parent의 `onNavigationRequest(url)` 반환값을 native에 그대로 돌려준다.**

**[FLOW-03 / 4-A단계]** — [`src/components/WebTab.tsx:423-429`](../src/components/WebTab.tsx#L423-L429)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    tag,
    active,
    // ... bottomContentInset, initialSource와 onBridgeMessage 생략 ...
    onNavigationRequest,
    // ... onOpenWindow와 onScrollDirection 생략 ...
  },
  forwardedRef,
) {
  // ... state와 helper 생략 ...

  return (
    // active가 false여도 WebView를 없애지 않습니다. 투명하게 만들고 터치만 막아 웹 문서, 방문 기록, 입력 중인 form 값을 그대로 둡니다.
    <View
      /* ... accessibility, collapsable과 pointer props 생략 ... */
      style={[styles.container, !active && styles.inactive]}
      testID={`web-tab-${tag}`}
    >
      {/* ... progress UI 생략 ... */}
      <WebView
        /* ... 앞선 props 생략 ... */
        // [역할] `onShouldStartLoadWithRequest`는 URL을 열어도 되는지 DemoShell의 판단 결과를 WebView에 돌려줍니다.
        onShouldStartLoadWithRequest={(request) =>
          // [FLOW-03 / 4-A단계] Android 최초 load를 제외한 navigation 요청에서 library가 이 prop을 호출하면 URL을 parent policy에 보내고 boolean을 native에 반환합니다.
          // [FLOW-06 / 1-B단계] 요청 URL이 app scheme일 수도 있으므로 같은 callback이 WebView deep-link 입력의 시작점도 됩니다.
          // 이 파일은 URL을 직접 판단하지 않습니다. DemoShell이 검사한 뒤 알려 주는 true 또는 false만 WebView에 돌려줍니다.
          onNavigationRequest(request.url)
        }
        /* ... 뒤의 props 생략 ... */
      />
      {/* ... error overlay 생략 ... */}
    </View>
  );
});
```

↓ **`DemoShell`의 prop consumer는 URL을 pure classifier에 넘기고 decision이 돌아올 때까지 boolean 반환을 보류한다.**

**[FLOW-03 / 5단계]** — [`src/components/DemoShell.tsx:359-363`](../src/components/DemoShell.tsx#L359-L363)

```tsx
export function DemoShell() {
  // ... state와 다른 handler 생략 ...

  // [역할] `handleNavigationRequest`는 일반 WebView URL 분류 결과를 실제 허용·차단·탭 이동·외부 앱 동작으로 실행합니다.
  const handleNavigationRequest = useCallback(
    (url: string): boolean => {
      // [FLOW-03 / 5단계] `WebTab.onNavigationRequest`가 이 함수를 호출하면 URL을 pure classifier에 넘겨 decision을 받습니다.
      const decision = classifyNavigationUrl(url);
      // ... decision switch는 7-A단계 발췌에서 이어짐 ...
    },
    [applyDeepLink, openExternalUrl],
  );
  // ... 나머지 handler, effect와 JSX 생략 ...
}
```

↓ **classifier는 app deep link 여부를 먼저 배제한 뒤 `new URL(url)`로 scheme을 읽는다. 선택한 HTTPS 입력은 `allow` decision으로 변환된다.**

**[FLOW-03 / 6단계]** — [`src/services/url-router.ts:150-155`](../src/services/url-router.ts#L150-L155)

```ts
export function classifyNavigationUrl(url: string): NavigationDecision {
  // ... 내부 문서와 app deep link 분류 생략 ...

  try {
    // [FLOW-03 / 6단계] classifier는 URL을 parse해 `allow`, `block-http`, `external`, `ignore` decision 중 하나로만 반환합니다.
    const parsed = new URL(url);

    if (parsed.protocol === "https:") {
      return { type: "allow" };
    }

    // ... HTTP, 외부 scheme와 ignore branch 생략 ...
  } catch {
    return { type: "ignore" };
  }
}
```

↓ **`allow`가 `DemoShell`로 돌아오면 switch는 `true`를 반환한다. 이 값은 prop 반환 경로를 거슬러 native WebView에 도착해 request 계속 여부가 된다.**

**[FLOW-03 / 7-A단계]** — [`src/components/DemoShell.tsx:365-371`](../src/components/DemoShell.tsx#L365-L371)

```tsx
export function DemoShell() {
  // ... state, 계산값, ref와 앞선 handler 생략 ...
  const handleNavigationRequest = useCallback(
    (url: string): boolean => {
      const decision = classifyNavigationUrl(url);

      // [문법] `switch (decision.type)`은 URL 검사 결과에 맞는 case 하나를 고릅니다.
      // 마지막에는 WebView가 계속 열어도 되는지 true 또는 false로 돌려줍니다.
      switch (decision.type) {
        case "allow":
          // [FLOW-03 / 7-A단계] `allow`는 true를 native WebView까지 돌려줘 stage 8의 load event를 계속하게 합니다.
          // true를 돌려주는 이 경우에만 WebView가 해당 URL을 계속 엽니다.
          return true;
        // ... 나머지 decision case 생략 ...
      }
    },
    [applyDeepLink, openExternalUrl],
  );
  // ... 나머지 handler, effect와 JSX 생략 ...
}
```

↓ **native가 load를 시작하면 library가 `onLoadStart`를 한 번 호출하고, 진행 중에는 `onLoadProgress`를 반복 호출해 React progress state를 바꾼다.**

**[FLOW-03 / 8단계·9-B단계]** — [`src/components/WebTab.tsx:370-380`](../src/components/WebTab.tsx#L370-L380)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    tag,
    active,
    // ... 나머지 props 생략 ...
  },
  forwardedRef,
) {
  // ... state와 helper 생략 ...

  return (
    // active가 false여도 WebView를 없애지 않습니다. 투명하게 만들고 터치만 막아 웹 문서, 방문 기록, 입력 중인 form 값을 그대로 둡니다.
    <View
      /* ... accessibility, collapsable과 pointer props 생략 ... */
      style={[styles.container, !active && styles.inactive]}
      testID={`web-tab-${tag}`}
    >
      {/* ... progress UI 생략 ... */}
      <WebView
        /* ... 앞선 props 생략 ... */
        // [역할] `onLoadStart`는 새 URL을 열기 시작할 때 진행률을 처음 값으로 되돌립니다.
        onLoadStart={() => {
          // [FLOW-03 / 8단계] 허용된 load가 시작되면 native event를 받은 library가 이 prop을 자동 호출하고 progress를 0으로 돌립니다.
          // 새 주소를 열기 시작하면 이전 진행률을 0으로 되돌립니다.
          setProgress(0);
        }}
        // [역할] `onLoadProgress`는 WebView가 알려 준 진행률을 화면 state에 저장합니다.
        onLoadProgress={(event) => {
          // [FLOW-03 / 9-B단계] load 중 native progress event마다 이 callback이 반복 호출되어 표시줄 state를 0~1 값으로 갱신합니다.
          // WebView가 보내는 0부터 1 사이 진행률을 state에 넣어 위 표시줄의 너비를 바꿉니다.
          setProgress(event.nativeEvent.progress);
        }}
        /* ... 뒤의 props 생략 ... */
      />
      {/* ... error overlay 생략 ... */}
    </View>
  );
});
```

↓ **같은 load session의 시작과 완료 시점에 library는 `onNavigationStateChange`도 호출한다. 이 한 prop은 `9-A`에서 시작 history snapshot, `12-A`에서 완료 snapshot을 같은 ref에 덮어쓴다.**

**[FLOW-03 / 9-A단계·12-A단계]** — [`src/components/WebTab.tsx:399-406`](../src/components/WebTab.tsx#L399-L406)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    tag,
    active,
    // ... 나머지 props 생략 ...
  },
  forwardedRef,
) {
  // ... state와 helper 생략 ...

  return (
    // active가 false여도 WebView를 없애지 않습니다. 투명하게 만들고 터치만 막아 웹 문서, 방문 기록, 입력 중인 form 값을 그대로 둡니다.
    <View
      /* ... accessibility, collapsable과 pointer props 생략 ... */
      style={[styles.container, !active && styles.inactive]}
      testID={`web-tab-${tag}`}
    >
      {/* ... progress UI 생략 ... */}
      <WebView
        /* ... 앞선 props 생략 ... */
        // [역할] `onNavigationStateChange`는 뒤로·앞으로 가기 가능 여부의 최신 값을 저장합니다.
        onNavigationStateChange={(navigationState) => {
          // [FLOW-03 / 9-A단계] library는 `onLoadStart` 뒤 같은 시작 navigation 값을 이 prop에 전달해 history ref를 갱신합니다.
          // [FLOW-03 / 12-A단계] 성공 시에는 `onLoad`와 `onLoadEnd` 뒤 완료 navigation 값으로 같은 ref를 한 번 더 갱신합니다.
          // Android 공개 명령은 이 URL과 다음 target을 비교해 native load와 same-URL reload를 구분합니다.
          currentUrlRef.current = navigationState.url;
          canGoBackRef.current = navigationState.canGoBack;
          canGoForwardRef.current = navigationState.canGoForward;
        }}
        /* ... 뒤의 props 생략 ... */
      />
      {/* ... error overlay 생략 ... */}
    </View>
  );
});
```

↓ **성공하면 native library가 `onLoad`로 실제 document 성공을 알린 뒤 `onLoadEnd`를 호출한다. 첫 callback은 iOS recovery 차단을 풀고, 둘째 callback은 document 준비 ref와 progress를 완료한다.**

**[FLOW-03 / 10-A단계 → 11-A단계]** — [`src/components/WebTab.tsx:382-398`](../src/components/WebTab.tsx#L382-L398)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    tag,
    active,
    // ... 나머지 props 생략 ...
  },
  forwardedRef,
) {
  // ... state와 helper 생략 ...

  return (
    // active가 false여도 WebView를 없애지 않습니다. 투명하게 만들고 터치만 막아 웹 문서, 방문 기록, 입력 중인 form 값을 그대로 둡니다.
    <View
      /* ... accessibility, collapsable과 pointer props 생략 ... */
      style={[styles.container, !active && styles.inactive]}
      testID={`web-tab-${tag}`}
    >
      {/* ... progress UI 생략 ... */}
      <WebView
        /* ... 앞선 props 생략 ... */
        // [역할] `onLoad`는 iOS에서 새 문서가 실제로 열리면 임시 scroll 차단을 해제합니다.
        onLoad={() => {
          // [FLOW-03 / 10-A단계] native load 성공 시 library가 먼저 `onLoad`를 호출해 iOS error-recovery scroll 차단을 해제합니다.
          // [FLOW-09 / 9-A단계] 수동 retry 뒤 이 success callback이 와야 WebView recovery가 실제로 확인되며 banner 변화만으로는 실행되지 않습니다.
          // [라이브러리] iOS에서 `onLoad`가 오면 새 웹 문서가 실제로 열렸다는 뜻입니다. 이때 임시로 무시하던 scroll event를 다시 받습니다.
          if (Platform.OS === "ios") {
            iosErrorRecoveryRef.current = false;
          }
        }}
        // [역할] `onLoadEnd`는 첫 문서가 준비됐다고 기록하고 진행률을 완료 값으로 바꿉니다.
        onLoadEnd={() => {
          // [FLOW-03 / 11-A단계] 성공 path에서는 같은 finish event의 다음 callback인 `onLoadEnd`가 document 준비 ref와 progress를 완료합니다.
          // [FLOW-03 / 11-B단계] 일반 load 실패 path에서도 library가 `onError` 다음에 이 callback을 호출하므로 같은 완료값을 기록합니다.
          // 첫 문서를 다 연 뒤부터 `loadUrl`은 source를 새로 만들지 않습니다. 현재 WebView 안에서 이동해 방문 기록을 이어 갑니다.
          hasLoadedDocumentRef.current = true;
          setProgress(1);
        }}
        /* ... 뒤의 props 생략 ... */
      />
      {/* ... error overlay 생략 ... */}
    </View>
  );
});
```

↓ **`onLoad`·`onLoadEnd` 뒤 앞서 본 `onNavigationStateChange`가 완료 snapshot으로 한 번 더 실행된다. React render에서 `loadError`가 없으므로 WebView를 숨길 error overlay가 선택되지 않는다.**

**[FLOW-03 / 13-A단계]** — [`src/components/WebTab.tsx:493-497`](../src/components/WebTab.tsx#L493-L497)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    tag,
    active,
    // ... 나머지 props 생략 ...
  },
  forwardedRef,
) {
  // ... state와 callback 생략 ...

  return (
    // active가 false여도 WebView를 없애지 않습니다. 투명하게 만들고 터치만 막아 웹 문서, 방문 기록, 입력 중인 form 값을 그대로 둡니다.
    <View
      /* ... accessibility, collapsable과 pointer props 생략 ... */
      style={[styles.container, !active && styles.inactive]}
      testID={`web-tab-${tag}`}
    >
      {/* ... progress UI 생략 ... */}
      <WebView
        /* ... 성공한 document의 props 생략 ... */
      />

      {/* [FLOW-03 / 13-A단계] 종료(성공): finish callback 뒤 `loadError`가 없으면 준비된 document와 최신 history ref를 유지합니다. */}
      {/* [FLOW-02 / 11-B단계] 종료(Web 재선택): 새 WebView mount 뒤의 실제 page lifecycle은 FLOW-03에 넘깁니다. */}
      {loadError ? (
        <View
          accessibilityRole="alert"
          style={[styles.errorOverlay, centeredContentInsetStyle]}
        >
          {/* ... 실패 overlay 내용 생략 ... */}
        </View>
      ) : null}
    </View>
  );
});
```

↓ **종료:** 성공한 native document는 같은 `WebTab` instance 안에 남고 `hasLoadedDocumentRef=true`, `progress=1`, 최신 URL·back/forward ref를 유지한다. 이후 `loadUrl`은 iOS에서는 `2-B`의 `location.assign`, Android에서는 `2-D`의 policy 확인 뒤 `2-F`의 same-URL reload 또는 `2-G`의 native source load를 선택한다.

#### 실제 소스로 따라가는 FLOW-03 Android 열린 document 보강 경로

아래 발췌는 Android에서 네이버 document가 이미 열린 뒤 app 명령이 네이트 URL을 요청하고, 같은 `WebView`의 native history에 새 항목을 쌓은 다음 hardware Back으로 네이버에 돌아오는 핵심 경로다. 최초 document의 `2-A`, iOS의 `2-B`, 새 session을 만드는 `2-C`, policy 차단·동일 URL인 `2-E`·`2-F`와 error recovery branch는 위의 단계 지도와 앞선 핵심 경로로 남겨 둔다.

**[FLOW-03 / 2-D단계]** — [`src/components/WebTab.tsx:237-239`](../src/components/WebTab.tsx#L237-L239)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    // ... WebTab props 생략 ...
  },
  forwardedRef,
) {
  // ... state, ref와 helper 생략 ...

  useImperativeHandle(
    forwardedRef,
    () => ({
      // ... reloadInitial 생략 ...
      loadUrl(url) {
        // 새 URL로 이동하기 전에 이전 웹 문서의 오류 안내부터 지웁니다.
        setLoadError(null);

        if (hasLoadedDocumentRef.current) {
          if (Platform.OS === "android") {
            // [FLOW-03 / 2-D단계] Android의 app-initiated native load는 policy callback을 자동 호출하지 않으므로 기존 parent URL 판단을 먼저 직접 요청합니다.
            // [주의] `source` 변경은 native `loadUrl()`로 이어지지만 Android는 그 요청에 `onShouldStartLoadWithRequest`를 다시 호출하지 않습니다.
            const shouldStartLoad = onNavigationRequest(url);

            // ... FLOW-03 2-E~2-G branch 생략 ...
          }

          // ... iOS FLOW-03 2-B branch 생략 ...
        }

        // ... 최초 document FLOW-03 2-A branch 생략 ...
      },
      // ... history 명령 생략 ...
    }),
    // ... dependency 생략 ...
  );
  // ... effect와 JSX return 생략 ...
});
```

↓ **Android의 app-initiated `source` load에는 native `onShouldStartLoadWithRequest`가 다시 오지 않으므로 `loadUrl`이 `onNavigationRequest(url)`을 직접 호출한다. 이 prop은 `DemoShell`의 tab별 closure를 거쳐 기존 `5`~`7`단계 classifier와 side effect를 그대로 사용하고, 그 boolean이 `shouldStartLoad`로 돌아온다.**

**[FLOW-03 / 2-E단계·2-F단계]** — [`src/components/WebTab.tsx:240-248`](../src/components/WebTab.tsx#L240-L248)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    // ... WebTab props 생략 ...
  },
  forwardedRef,
) {
  // ... state, ref와 helper 생략 ...

  useImperativeHandle(
    forwardedRef,
    () => ({
      // ... reloadInitial 생략 ...
      loadUrl(url) {
        // ... error 초기화와 Android 분기 진입 생략 ...

        const shouldStartLoad = onNavigationRequest(url);
        if (!shouldStartLoad) {
          // [FLOW-03 / 2-E단계] 종료(Android 차단): policy가 false이면 source·history·reload 명령을 바꾸지 않고 caller로 돌아갑니다.
          return;
        }

        if (currentUrlRef.current === url) {
          // [FLOW-03 / 2-F단계] 종료(Android 동일 URL): RNWV의 same-URL source no-op 대신 native `reload()`로 현재 문서를 다시 요청합니다.
          webViewRef.current?.reload();
          return;
        }

        // ... 허용된 다른 URL의 FLOW-03 2-G branch 생략 ...
      },
      // ... history 명령 생략 ...
    }),
    // ... dependency 생략 ...
  );
  // ... effect와 JSX return 생략 ...
});
```

↓ **policy가 `false`면 `2-E`에서 React state와 native history를 전혀 바꾸지 않는다. `true`이면서 `currentUrlRef`와 target이 같으면 `2-F`가 native `reload()`만 호출한다. 이 경로의 네이버→네이트 요청은 허용된 다른 URL이므로 두 종료 branch를 통과해 `2-G`로 이어진다.**

**[FLOW-03 / 2-G단계]** — [`src/components/WebTab.tsx:251-261`](../src/components/WebTab.tsx#L251-L261)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    // ... WebTab props 생략 ...
  },
  forwardedRef,
) {
  // ... state, ref와 helper 생략 ...

  useImperativeHandle(
    forwardedRef,
    () => ({
      // ... reloadInitial 생략 ...
      loadUrl(url) {
        // ... FLOW-03 2-D~2-F 판단 생략 ...

        // [FLOW-03 / 2-G단계] 허용된 다른 URL은 같은 key의 `source`만 바꿔 RNWV Android의 native `loadUrl()`과 history event를 시작합니다.
        // [이유] page-side `location.assign` 대신 참고 앱과 같은 native load 경로를 사용해야 Android back history가 이전 문서를 가리킵니다.
        // native Back 뒤에는 현재 URL만 이전 문서가 되고 React의 source는 target에 남습니다. 같은 target을 다시 눌러도 prop update가 생기도록 동등한 GET 표기를 번갈아 씁니다.
        androidSourceUsesExplicitGetRef.current =
          !androidSourceUsesExplicitGetRef.current;
        setSource(
          androidSourceUsesExplicitGetRef.current
            ? { uri: url, method: "GET" }
            : { uri: url },
        );
        return;
      },
      // ... history 명령 생략 ...
    }),
    // ... dependency 생략 ...
  );
  // ... effect와 JSX return 생략 ...
});
```

↓ **React state의 URI는 네이트로 바뀌지만 `reloadKey`는 그대로다. GET 생략형과 명시형은 같은 request를 뜻하면서도 native Back 뒤 React의 이전 `source`가 네이트에 남아 있을 때 다음 동일 target 요청을 새 prop 변경으로 전달한다. React commit은 아래 `source`를 RNWV Android의 native `loadUrl()`로 보내고 기존 WebView history에 네이트를 추가한다.**

**[FLOW-03 / 2단계 → 3단계 → 8단계 → 9-B단계]** — [`src/components/WebTab.tsx:332-380`](../src/components/WebTab.tsx#L332-L380)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    tag,
    active,
    // ... 나머지 props 생략 ...
  },
  forwardedRef,
) {
  // ... state와 callback 생략 ...

  return (
    // active가 false여도 WebView를 없애지 않습니다. 투명하게 만들고 터치만 막아 웹 문서, 방문 기록, 입력 중인 form 값을 그대로 둡니다.
    <View
      /* ... wrapper props 생략 ... */
    >
      {/* ... progress UI 생략 ... */}

      {/* [FLOW-03 / 2단계] WebTab render가 아래 기능·callback props를 구성하고 `source`·`key`와 함께 stage 3의 native WebView에 전달합니다.
          [라이브러리]
          아래 props는 JavaScript, 웹 저장소, cookie, 새 창처럼 이 WebView에서 사용할 기능을 정합니다.
          `originWhitelist={["*"]}`는 모든 scheme을 먼저 이 WebView callback으로 보냅니다.
          실제로 열지는 `onShouldStartLoadWithRequest`가 돌려주는 true 또는 false로 정합니다. */}
      {/* [FLOW-02 / 10-B단계] React는 증가한 `reloadKey`를 다른 identity로 보고 이전 WebView를 unmount한 뒤 최초 source의 새 instance를 mount합니다. */}
      {/* [FLOW-03 / 4-B단계] Android 최초 `source` load는 `onShouldStartLoadWithRequest`를 생략하므로 이 앱이 직접 만든 initial source가 바로 native load로 진행합니다. */}
      {/* [FLOW-03 / 3단계] React가 이 `key`와 `source`를 native WebView에 commit하면 platform이 해당 URL request를 시작합니다. */}
      <WebView
        key={reloadKey}
        ref={webViewRef}
        source={source}
        /* ... WebView 기능 props 생략 ... */
        // [역할] `onLoadStart`는 새 URL을 열기 시작할 때 진행률을 처음 값으로 되돌립니다.
        onLoadStart={() => {
          // [FLOW-03 / 8단계] 허용된 load가 시작되면 native event를 받은 library가 이 prop을 자동 호출하고 progress를 0으로 돌립니다.
          // 새 주소를 열기 시작하면 이전 진행률을 0으로 되돌립니다.
          setProgress(0);
        }}
        // [역할] `onLoadProgress`는 WebView가 알려 준 진행률을 화면 state에 저장합니다.
        onLoadProgress={(event) => {
          // [FLOW-03 / 9-B단계] load 중 native progress event마다 이 callback이 반복 호출되어 표시줄 state를 0~1 값으로 갱신합니다.
          // WebView가 보내는 0부터 1 사이 진행률을 state에 넣어 위 표시줄의 너비를 바꿉니다.
          setProgress(event.nativeEvent.progress);
        }}
        /* ... 뒤의 props 생략 ... */
      />
      {/* ... error overlay 생략 ... */}
    </View>
  );
});
```

↓ **native load가 성공하면 앞선 핵심 경로의 `10-A`·`11-A`를 거치고, RNWV가 `onNavigationStateChange`에 네이트 URL과 `canGoBack=true`를 전달한다. callback은 현재 URL과 history 가능 여부를 ref에 함께 저장한다.**

**[FLOW-03 / 9-A단계·12-A단계]** — [`src/components/WebTab.tsx:399-406`](../src/components/WebTab.tsx#L399-L406)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    // ... WebTab props 생략 ...
  },
  forwardedRef,
) {
  // ... state와 callback 생략 ...

  return (
    <View /* ... wrapper props 생략 ... */>
      {/* ... progress UI 생략 ... */}
      <WebView
        /* ... 앞선 props 생략 ... */
        // [역할] `onNavigationStateChange`는 뒤로·앞으로 가기 가능 여부의 최신 값을 저장합니다.
        onNavigationStateChange={(navigationState) => {
          // [FLOW-03 / 9-A단계] library는 `onLoadStart` 뒤 같은 시작 navigation 값을 이 prop에 전달해 history ref를 갱신합니다.
          // [FLOW-03 / 12-A단계] 성공 시에는 `onLoad`와 `onLoadEnd` 뒤 완료 navigation 값으로 같은 ref를 한 번 더 갱신합니다.
          // Android 공개 명령은 이 URL과 다음 target을 비교해 native load와 same-URL reload를 구분합니다.
          currentUrlRef.current = navigationState.url;
          canGoBackRef.current = navigationState.canGoBack;
          canGoForwardRef.current = navigationState.canGoForward;
        }}
        /* ... 뒤의 props 생략 ... */
      />
      {/* ... error overlay 생략 ... */}
    </View>
  );
});
```

↓ **사용자가 hardware Back을 누르면 [`DemoShell.tsx:585-590`](../src/components/DemoShell.tsx#L585-L590)의 Android listener가 현재 tab ref의 `goBack()`을 먼저 호출한다. `canGoBackRef=true`이므로 아래 명령은 native history를 네이트에서 네이버로 한 칸 이동시키고 `true`를 반환하며, caller는 앱 종료 안내로 내려가지 않는다.**

**[FLOW-03 / 14-C단계]** — [`src/components/WebTab.tsx:279-287`](../src/components/WebTab.tsx#L279-L287)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    // ... WebTab props 생략 ...
  },
  forwardedRef,
) {
  // ... state, ref와 helper 생략 ...

  useImperativeHandle(
    forwardedRef,
    () => ({
      // ... reloadInitial과 loadUrl 생략 ...
      // [역할] `goBack`은 뒤로 갈 기록이 있을 때 WebView를 한 페이지 뒤로 이동시킵니다.
      goBack() {
        // [FLOW-03 / 14-C단계] toolbar나 Android back caller가 이 명령을 부르면 최신 ref를 검사해 가능한 경우 native `goBack()`을 실행합니다.
        // 뒤로 갈 방문 기록이 있을 때만 WebView에 명령을 보냅니다. 없으면 false를 돌려 DemoShell이 앱 종료 같은 다음 처리를 할 수 있게 합니다.
        if (!canGoBackRef.current) {
          return false;
        }
        webViewRef.current?.goBack();
        return true;
      },
      // ... goForward 생략 ...
    }),
    // ... dependency 생략 ...
  );
  // ... effect와 JSX return 생략 ...
});
```

↓ **종료:** native Back 완료 event가 `onNavigationStateChange`를 다시 호출해 `currentUrlRef=네이버`, `canGoBack=false`로 갱신한다. 2026-08-20 지정 Android 실기기에서는 custom scheme과 local bridge 두 진입 경로 모두 네이버→네이트가 history length `1→2`가 되고 첫 hardware Back이 네이버로 돌아가며 process를 유지했다. Back 뒤 같은 네이트 target 재요청, 현재 네이트 동일 URL reload, history가 없는 첫 Back의 종료 안내도 각각 확인했다. 이는 연결 상태 banner나 iOS path의 판정이 아니라 Android 열린 document native history 경로의 실기기 증거다.

### FLOW-04: 새 창 분류와 popup lifecycle

```text
[시작] native WebView가 window.open/_blank 감지
→ 1 WebTab.onOpenWindow 자동 callback → 2 parent prop → 3 index closure
→ 4 DemoShell handler → 5 popup classifier
├─ 6-A parent: source WebTab.loadUrl 뒤 FLOW-03
├─ 6-B external: FLOW-06 OS branch에서 종료
└─ 6-C popup state → 7 props render → 8 reset effect → 9 popup WebView mount
   ├─ 10-A onShouldStartLoadWithRequest / 10-B Android 최초 callback 생략
   │  └─ 11-A~11-E URL decision
   └─ 10-C nested onOpenWindow → 10-D handler → 11-F 또는 11-G
→ 12-A load start / 12-B progress / 12-C navigation state
├─ 13-A 성공 종료
└─ 13-B 일반 오류 / 13-C HTTP 오류 → 14-B 실패 대기
   ├─ 15-A retry로 load callback 복귀
   └─ 15-B error close
16-A Modal back / 16-B hardware back / 16-C header close → 17 공통 close → 18 종료
```

Source 단계 지도:

- [`src/components/WebTab.tsx`](../src/components/WebTab.tsx): 시작, `1`, `2`
- [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx): `3`, `4`, `6-A`·`6-B`·`6-C`, `16-B`, `17`, `18`
- [`src/services/url-router.ts`](../src/services/url-router.ts): `5`
- [`src/components/PopupWebView.tsx`](../src/components/PopupWebView.tsx): `7`~`9`, `10-A`~`10-D`, `11-A`~`11-G`, `12-A`~`12-C`, `13-A`~`13-C`, `14-B`, `15-A`·`15-B`, `16-A`·`16-C`

추가 확인 지점:

- popup 내부 `SafeAreaProvider`와 top-only `SafeAreaView`
- popup 안의 또 다른 `window.open`을 중첩 modal로 만들지 않는 `handleOpenWindow`
- 오류 시 WebView container와 error content의 전환
- [`src/components/PopupWebView.test.tsx`](../src/components/PopupWebView.test.tsx)의 구조 검증 경계

#### 실제 소스로 따라가는 FLOW-04 핵심 경로

아래 발췌는 일반 Web tab의 web document가 `window.open` 또는 `_blank`로 알려지지 않은 HTTPS URL을 열고, 사용자가 popup header의 닫기 button을 누르는 대표 경로를 따른다. `1 → 2 → 3 → 4 → 5 → 6-C → 7 → 8 → 9 → 10-A → 11-A → 12-A·12-B·12-C → 13-A → 16-C → 17 → 18`만 연결한다. 알려진 parent URL인 `6-A`, OS로 넘기는 `6-B`, popup 안의 nested `window.open`인 `10-C·10-D`, 차단·deep link·외부 URL인 `11-B`~`11-G`, 오류·retry인 `13-B·13-C·14-B·15-A·15-B`, Modal·hardware back인 `16-A·16-B`는 위의 기존 단계 지도와 source 링크에서 별도로 확인한다.

**[FLOW-04] 시작** — [`src/components/WebTab.tsx:3`](../src/components/WebTab.tsx#L3)

```tsx
// [파일 역할] WebView 탭 하나를 화면에 띄우고, 그 탭에서 연 웹 문서와 방문 기록을 관리합니다.
// [FLOW-03] 시작: React가 `source`를 native WebView에 전달하거나 기존 document에 이동 명령을 보내면 navigation 흐름이 시작됩니다.
// [FLOW-04] 시작: web document의 `window.open` 또는 `_blank` link를 native WebView가 감지하면 새 창 분류 흐름이 시작됩니다.

// ... import와 type 선언 생략 ...

export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    // ... WebTab props 생략 ...
  },
  forwardedRef,
) {
  // ... WebView state, ref와 callback 생략 ...
});
```

↓ **현재 web document가 새 browsing context를 요청하면 native WebView가 이를 감지한다. `react-native-webview`가 `onOpenWindow` prop을 자동 호출하고, event의 `targetUrl`이 parent prop의 인수가 된다.**

**[FLOW-04 / 1단계 → 2단계]** — [`src/components/WebTab.tsx:430-435`](../src/components/WebTab.tsx#L430-L435)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    tag,
    active,
    // ... bottomContentInset부터 onNavigationRequest까지의 props 생략 ...
    onOpenWindow,
    // ... onScrollDirection 생략 ...
  },
  forwardedRef,
) {
  // ... state와 helper 생략 ...

  return (
    // active가 false여도 WebView를 없애지 않습니다. 투명하게 만들고 터치만 막아 웹 문서, 방문 기록, 입력 중인 form 값을 그대로 둡니다.
    <View
      /* ... accessibility, collapsable과 pointer props 생략 ... */
      style={[styles.container, !active && styles.inactive]}
      testID={`web-tab-${tag}`}
    >
      {/* ... progress UI 생략 ... */}
      <WebView
        /* ... 앞선 props 생략 ... */
        // [역할] `onOpenWindow`는 웹 문서가 새 창으로 열려는 URL을 DemoShell에 전달합니다.
        onOpenWindow={(event) => {
          // [FLOW-04 / 1단계] `window.open`을 감지한 `react-native-webview`가 이 prop을 자동 호출하고 `targetUrl`을 event로 전달합니다.
          // [FLOW-04 / 2단계] 이 callback은 새 화면을 만들지 않고 `onOpenWindow(targetUrl)`을 호출해 parent로 올립니다.
          onOpenWindow(event.nativeEvent.targetUrl);
        }}
        /* ... 뒤의 props 생략 ... */
      />
      {/* ... error overlay 생략 ... */}
    </View>
  );
});
```

↓ **`WebTab`은 URL만 parent에 올린다. `DemoShell`이 각 tab을 만들 때 닫아 둔 closure가 해당 WebTab의 `tab.index`를 같은 URL에 붙여 source tab을 식별한다.**

**[FLOW-04 / 3단계]** — [`src/components/DemoShell.tsx:699-703`](../src/components/DemoShell.tsx#L699-L703)

```tsx
export function DemoShell() {
  // ... state와 handler 생략 ...

  return (
    <View style={styles.container}>
      {/* ... network banner와 iOS toolbar 생략 ... */}
      <View style={styles.content}>
        {TAB_DEFINITIONS.slice(0, 3).map((tab) => (
          <WebTab
            /* ... 다른 props 생략 ... */
            onOpenWindow={(url) => {
              // [역할] `onOpenWindow` callback은 새 창 URL과 이 WebTab의 번호를 popup 분류 함수에 전달합니다.
              // [FLOW-04 / 3단계] `WebTab` prop callback이 URL을 돌려주면 closure의 `tab.index`를 붙여 `handleOpenWindow`를 호출합니다.
              handleOpenWindow(tab.index, url);
            }}
            /* ... 다른 props 생략 ... */
          />
        ))}
        {/* ... NativeUsersScreen 생략 ... */}
      </View>
      {/* ... 하단 tab, Snackbar와 popup 생략 ... */}
    </View>
  );
}
```

↓ **closure가 만든 `(sourceTabIndex, url)` 쌍은 `handleOpenWindow`로 들어간다. handler는 화면을 바로 열지 않고 먼저 pure classifier의 decision을 기다린다.**

**[FLOW-04 / 4단계]** — [`src/components/DemoShell.tsx:398-402`](../src/components/DemoShell.tsx#L398-L402)

```tsx
export function DemoShell() {
  // ... state와 다른 handler 생략 ...

  // [역할] `handleOpenWindow`는 새 창 URL과 source 탭을 받아 원래 탭·외부 앱·popup 중 알맞은 곳에서 엽니다.
  const handleOpenWindow = useCallback(
    (sourceTabIndex: TabIndex, url: string) => {
      // [FLOW-04 / 4단계] source index를 붙인 callback이 이 함수를 호출하면 URL을 popup classifier에 넘깁니다.
      const decision = classifyPopupUrl(url);

      // ... parent와 external branch 및 popup state 변경 생략 ...
    },
    [openExternalUrl],
  );
  // ... 나머지 handler, effect와 JSX 생략 ...
}
```

↓ **classifier는 URL을 parse하고 social host와 기존 tab에서 이어 열 known parent URL을 먼저 배제한다. 선택한 입력이 그 어느 쪽도 아닌 HTTPS이므로 `popup` decision과 원래 URL을 반환한다.**

**[FLOW-04 / 5단계]** — [`src/services/url-router.ts:178-213`](../src/services/url-router.ts#L178-L213)

```ts
// [역할] `classifyPopupUrl`은 새 창 URL을 원래 탭·외부 앱·앱 안 popup 처리 중 하나로 나눕니다.
export function classifyPopupUrl(url: string): PopupDecision {
  try {
    // [FLOW-04 / 5단계] `classifyPopupUrl`은 host와 scheme을 검사해 `parent`, `external`, `popup` decision 하나를 반환합니다.
    const parsed = new URL(url);
    // host를 소문자로 바꿔 대문자 사용으로 주소 규칙을 피해 가지 못하게 합니다.
    const hostname = parsed.hostname.toLowerCase();

    // [문법] `some`은 소셜 domain 목록 중 하나라도 현재 host와 맞으면 바로 true를 돌려줍니다.
    // [역할] 첫 `some` callback은 현재 host가 소셜 domain 하나와 같은 계열인지 차례로 확인합니다.
    if (SOCIAL_HOSTS.some((domain) => isHostOrSubdomain(hostname, domain))) {
      return { type: "external", url };
    }

    // local HTML 주소와 세 mobile 사이트는 새 popup 대신 현재 WebView에서 이어 엽니다.
    const isKnownParentUrl =
      url.startsWith(LOCAL_WEB_BASE_URL) ||
      // [역할] 둘째 `some` callback은 현재 host가 원래 탭에서 이어 열 mobile site인지 확인합니다.
      ["m.naver.com", "m.daum.net", "m.nate.com"].some((domain) =>
        isHostOrSubdomain(hostname, domain),
      );

    if (isKnownParentUrl) {
      // 참고 앱과 같은 주요 mobile 주소는 별도 창을 만들지 않고 현재 WebView 방문 기록에 이어 엽니다.
      return { type: "parent", url };
    }

    if (parsed.protocol === "https:") {
      return { type: "popup", url };
    }

    // ... 다른 scheme의 external 반환 생략 ...
  } catch {
    return { type: "external", url };
  }
}
```

↓ **`popup` decision이 caller로 돌아오면 두 앞 branch를 건너뛴다. URL을 `popupUrl` state에 저장하고 뒤 화면의 하단 tab 입력을 막기 위해 scroll 표시 state도 false로 바꾼다.**

**[FLOW-04 / 6-C단계]** — [`src/components/DemoShell.tsx:417-424`](../src/components/DemoShell.tsx#L417-L424)

```tsx
export function DemoShell() {
  // ... state, 계산값, ref와 앞선 handler 생략 ...
  const handleOpenWindow = useCallback(
    (sourceTabIndex: TabIndex, url: string) => {
      // ... decision 계산과 6-A·6-B 조기 반환 생략 ...

      // [FLOW-04 / 6-C단계] `popup` decision은 `popupUrl`과 scroll 숨김 state를 바꿔 React의 modal render를 요청합니다.
      // [FLOW-08 / 1-E단계] popup open은 뒤 화면의 scroll 표시 state를 false로 바꾸고 공통 하단 탭 계산을 다시 시작합니다.
      setPopupUrl(decision.url);
      // popup이 열린 동안 뒤의 하단 탭 막대를 숨깁니다. 보이지 않는 막대가 터치를 받지 않게 합니다.
      setScrollBottomBarVisible(false);
    },
    [openExternalUrl],
  );

  // ... 나머지 handler와 JSX 생략 ...
}
```

↓ **React가 state update를 commit하면 `PopupWebView`는 새 `url` prop으로 다시 render된다. `Modal.visible`은 `url !== null`이 되어 modal을 열고, 같은 prop은 lifecycle effect의 입력이 된다.**

**[FLOW-04 / 7단계]** — [`src/components/PopupWebView.tsx:2`](../src/components/PopupWebView.tsx#L2)

```tsx
// [파일 역할] 새 창으로 열 주소를 화면 전체 modal WebView에 보여 줍니다. 그 안의 방문 기록, 진행률, 오류, 닫기를 관리합니다.
// [FLOW-04 / 7단계] `DemoShell`의 `popupUrl` 변경이 새 props render를 만들고 `Modal.visible`과 effect 입력을 갱신합니다.

// ... import와 type 선언 생략 ...

export const PopupWebView = forwardRef<
  PopupWebViewHandle,
  PopupWebViewProps
>(function PopupWebView(
  {
    url,
    // ... 나머지 props 생략 ...
  },
  forwardedRef,
) {
  // ... state, effect와 handler 생략 ...

  return (
    <Modal
      /* ... animation과 close props 생략 ... */
      visible={url !== null}
    >
      <SafeAreaProvider>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          {/* ... network banner, header, progress와 webContent 생략 ... */}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
});
```

↓ **새 props가 화면에 반영된 뒤 React가 `url` dependency의 effect를 자동 실행한다. 이전 popup의 history·error를 비우고 `currentUrl`을 갱신하며 key를 증가시켜 새 WebView identity를 준비한다.**

**[FLOW-04 / 8단계]** — [`src/components/PopupWebView.tsx:107-117`](../src/components/PopupWebView.tsx#L107-L117)

```tsx
export const PopupWebView = forwardRef<
  PopupWebViewHandle,
  PopupWebViewProps
>(function PopupWebView(
  {
    url,
    // ... 나머지 props 생략 ...
  },
  forwardedRef,
) {
  // ... WebView state와 ref 생략 ...

  // [라이브러리] `useEffect`는 DemoShell이 준 `url`이 바뀐 뒤 실행됩니다. 새 URL에 맞춰 modal 안의 값을 다시 준비합니다.
  // [역할] `useEffect` callback은 새 popup URL이나 닫힘 값에 맞춰 방문 기록·오류·WebView key를 초기화합니다.
  useEffect(() => {
    // [FLOW-04 / 8단계] React commit 뒤 이 effect가 자동 실행되어 history·error를 지우고 `currentUrl`과 새 WebView key를 저장합니다.
    canGoBackRef.current = false;
    setCurrentUrl(url);
    setErrorMessage(null);
    // [문법] `setWebViewKey((value) => value + 1)`은 React가 가진 최신 key에 1을 더합니다. 새 key 때문에 WebView도 새로 만들어집니다.
    // [역할] state updater callback은 가장 최신 WebView key에 1을 더해 새 popup WebView를 요청합니다.
    setWebViewKey((current) => current + 1);
  }, [url]);

  // ... 공개 명령, handler와 JSX 생략 ...
});
```

↓ **effect의 state update로 다시 render되면 `currentUrl`이 truthy이므로 React가 증가한 `key`와 URL `source`를 가진 native WebView를 mount한다. 이 mount가 최초 popup request를 시작한다.**

**[FLOW-04 / 9단계]** — [`src/components/PopupWebView.tsx:279-290`](../src/components/PopupWebView.tsx#L279-L290)

```tsx
export const PopupWebView = forwardRef<
  PopupWebViewHandle,
  PopupWebViewProps
>(function PopupWebView(
  {
    url,
    // ... 나머지 props 생략 ...
  },
  forwardedRef,
) {
  // ... state, effect와 handler 생략 ...

  return (
    <Modal
      /* ... animation과 close props 생략 ... */
      visible={url !== null}
    >
      <SafeAreaProvider>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          {/* ... network banner, header와 progress 생략 ... */}
          <View style={styles.webContent}>
            {/* [FLOW-04 / 9단계] `currentUrl`이 있으면 React가 새 key와 source의 popup WebView를 mount해 native 최초 load를 시작합니다. */}
            {/* [FLOW-04 / 10-B단계] Android 최초 `source` load는 `onShouldStartLoadWithRequest`를 생략하고 stage 12의 native load callback으로 바로 진행합니다. */}
            {currentUrl ? (
              <WebView
                key={webViewKey}
                ref={webViewRef}
                source={{ uri: currentUrl }}
                containerStyle={
                  errorMessage !== null
                    ? styles.hiddenWebViewContainer
                    : undefined
                }
                /* ... 나머지 WebView props 생략 ... */
              />
            ) : null}
            {/* ... error UI 생략 ... */}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
});
```

↓ **Android 최초 `source` load가 아닌 policy callback이 제공되는 platform·navigation에서는 `react-native-webview`가 `onShouldStartLoadWithRequest`를 자동 호출한다. callback의 URL은 `shouldStartRequest`를 거쳐 공통 navigation classifier로 들어간다.**

**[FLOW-04 / 10-A단계 → 11-A단계]** — [`src/components/PopupWebView.tsx:149-160`](../src/components/PopupWebView.tsx#L149-L160), [`src/components/PopupWebView.tsx:333-336`](../src/components/PopupWebView.tsx#L333-L336)

```tsx
export const PopupWebView = forwardRef<
  PopupWebViewHandle,
  PopupWebViewProps
>(function PopupWebView(
  {
    url,
    // ... 앞선 props 생략 ...
    classifyNavigation,
    // ... 나머지 props 생략 ...
  },
  forwardedRef,
) {
  // ... state, effect와 앞선 handler 생략 ...

  // [역할] `shouldStartRequest`는 popup 안의 URL 분류를 실행하고 WebView가 계속 열어도 되는지 돌려줍니다.
  const shouldStartRequest = (targetUrl: string): boolean => {
    // [FLOW-04 / 10-A단계] Android 최초 load를 제외한 popup navigation에서 native callback이 이 함수를 거쳐 공통 classifier를 호출합니다.
    const decision = classifyNavigation(targetUrl);

    // [문법] `switch (decision.type)`은 type 값에 맞는 경우 하나를 고릅니다.
    // 각 case 안에서는 그 경우에 있는 `url` 또는 `value`를 안전하게 쓸 수 있습니다.
    switch (decision.type) {
      case "allow":
        // [FLOW-04 / 11-A단계] `allow`는 true를 native popup WebView에 반환해 load event를 계속합니다.
        // HTTPS처럼 WebView가 직접 열어도 되는 경우에만 true를 돌려줍니다.
        return true;
      // ... case "ignore"부터 case "external"까지 sibling branch 생략 ...
    }
  };

  // ... handleOpenWindow과 나머지 handler 생략 ...

  return (
    <Modal
      /* ... animation과 close props 생략 ... */
      visible={url !== null}
    >
      <SafeAreaProvider>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          {/* ... network banner, header와 progress 생략 ... */}
          <View style={styles.webContent}>
            {currentUrl ? (
              <WebView
                /* ... 앞선 WebView props 생략 ... */
                // [역할] `onShouldStartLoadWithRequest` callback은 새 URL을 공통 popup navigation 규칙으로 검사합니다.
                onShouldStartLoadWithRequest={(request) =>
                  shouldStartRequest(request.url)
                }
                /* ... 뒤의 WebView props 생략 ... */
              />
            ) : null}
            {/* ... error UI 생략 ... */}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
});
```

↓ **선택한 HTTPS URL은 `allow`로 분류되어 true가 native WebView로 돌아간다. request가 계속되면 library가 native event를 받아 load 시작 callback, 반복 progress callback, 시작·종료 navigation-state callback을 호출한다.**

**[FLOW-04 / 12-A단계 → 12-B단계 → 12-C단계]** — [`src/components/PopupWebView.tsx:315-332`](../src/components/PopupWebView.tsx#L315-L332)

```tsx
export const PopupWebView = forwardRef<
  PopupWebViewHandle,
  PopupWebViewProps
>(function PopupWebView(
  {
    url,
    // ... 나머지 props 생략 ...
  },
  forwardedRef,
) {
  // ... state, ref와 handler 생략 ...

  return (
    <Modal
      /* ... animation과 close props 생략 ... */
      visible={url !== null}
    >
      <SafeAreaProvider>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          {/* ... network banner, header와 progress 생략 ... */}
          <View style={styles.webContent}>
            {currentUrl ? (
              <WebView
                /* ... 앞선 WebView props 생략 ... */
                onLoadStart={() => {
                  // [FLOW-04 / 12-A단계] 허용된 popup load가 시작되면 native event를 받은 library가 이 callback을 호출해 progress를 0으로 만듭니다.
                  // [역할] `onLoadStart` callback은 새 popup URL을 열기 시작할 때 진행률을 0으로 되돌립니다.
                  // 현재 WebView가 새 주소를 열기 시작할 때마다 진행률을 0으로 되돌립니다.
                  setProgress(0);
                }}
                onLoadProgress={(event) => {
                  // [FLOW-04 / 12-B단계] load 중 progress event마다 이 callback이 반복 실행되어 popup 진행 표시줄을 갱신합니다.
                  // [역할] `onLoadProgress` callback은 WebView가 알려 준 진행률을 화면 state에 저장합니다.
                  setProgress(event.nativeEvent.progress);
                }}
                onNavigationStateChange={(navigationState) => {
                  // [FLOW-04 / 12-C단계] library가 load 시작·종료 navigation 값을 전달할 때마다 최신 `canGoBack`을 ref에 저장합니다.
                  // [FLOW-09 / 9-B단계] popup retry 뒤에도 실제 native navigation/error callback만 popup request 결과를 바꿉니다.
                  // [역할] `onNavigationStateChange` callback은 popup의 최신 뒤로 가기 가능 여부를 ref에 저장합니다.
                  // WebView가 알려 준 뒤로 가기 가능 여부를 ref에 저장합니다. 위쪽 버튼과 기기 뒤로 가기가 이 값을 바로 읽습니다.
                  canGoBackRef.current = navigationState.canGoBack;
                }}
                /* ... 뒤의 WebView props 생략 ... */
              />
            ) : null}
            {/* ... error UI 생략 ... */}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
});
```

↓ **native load가 오류 없이 끝나면 `errorMessage`는 null을 유지한다. React는 별도 완료 화면으로 바꾸지 않고 같은 Modal·WebView instance와 그 안의 document·history를 계속 보존한다.**

**[FLOW-04 / 13-A단계]** — [`src/components/PopupWebView.tsx:368`](../src/components/PopupWebView.tsx#L368)

```tsx
export const PopupWebView = forwardRef<
  PopupWebViewHandle,
  PopupWebViewProps
>(function PopupWebView(
  {
    url,
    // ... 나머지 props 생략 ...
  },
  forwardedRef,
) {
  // ... state, ref, effect와 handler 생략 ...

  return (
    <Modal
      /* ... animation과 close props 생략 ... */
      visible={url !== null}
    >
      <SafeAreaProvider>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          {/* ... network banner, header와 progress 생략 ... */}
          <View style={styles.webContent}>
            {/* ... 성공한 WebView branch 생략 ... */}
            {/* [FLOW-04 / 13-A단계] 종료(성공): error가 없으면 같은 Modal·WebView가 document와 history를 계속 소유합니다. */}
            {/* ... errorMessage가 있을 때만 표시하는 실패 UI 생략 ... */}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
});
```

↓ **성공한 document를 보는 동안 사용자가 header 닫기 button을 누르면 React Native의 `Pressable`이 `onPress={onClose}`를 호출한다. 이 branch는 popup history를 검사하지 않고 `DemoShell`이 내려 준 공통 close callback으로 곧바로 돌아간다.**

**[FLOW-04 / 16-C단계]** — [`src/components/PopupWebView.tsx:252-261`](../src/components/PopupWebView.tsx#L252-L261)

```tsx
export const PopupWebView = forwardRef<
  PopupWebViewHandle,
  PopupWebViewProps
>(function PopupWebView(
  {
    url,
    onClose,
    // ... 나머지 props 생략 ...
  },
  forwardedRef,
) {
  // ... state와 handler 생략 ...

  return (
    <Modal
      /* ... animation과 close props 생략 ... */
      visible={url !== null}
    >
      <SafeAreaProvider>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          {/* ... network banner 생략 ... */}
          <View style={styles.header}>
            {/* ... popup 뒤로 가기 button과 title 생략 ... */}
            {/* [FLOW-04 / 16-C단계] header 닫기 press는 history를 보지 않고 `onClose`를 직접 호출해 공통 close state로 합류합니다. */}
            <Pressable
              accessibilityLabel="팝업 닫기"
              accessibilityRole="button"
              hitSlop={10}
              onPress={onClose}
              style={styles.headerButton}
            >
              <Ionicons color="#0F172A" name="close" size={26} />
            </Pressable>
          </View>
          {/* ... progress와 webContent 생략 ... */}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
});
```

↓ **`onClose` prop은 `DemoShell.closePopup`이다. callback은 `popupUrl`을 null로 만들고 popup 때문에 false였던 scroll 표시 state를 true로 복구하는 두 update를 같은 종료 지점에서 요청한다.**

**[FLOW-04 / 17단계]** — [`src/components/DemoShell.tsx:430-437`](../src/components/DemoShell.tsx#L430-L437)

```tsx
export function DemoShell() {
  // ... popup open handler 생략 ...

  // popup을 닫을 때 URL을 null로 바꾸고 하단 탭 막대도 다시 보이게 하는 공통 함수입니다.
  // [역할] `closePopup`은 popup URL을 비우고 popup 때문에 숨겼던 하단 탭을 다시 보이게 합니다.
  const closePopup = useCallback(() => {
    // [FLOW-04 / 17단계] 어느 닫기 branch든 이 함수로 합류해 `popupUrl=null`과 하단 탭 복구 state를 함께 저장합니다.
    // [FLOW-08 / 2-E단계] popup close는 scroll 표시 state를 true로 복구한 뒤 최종 AND 계산에 다시 합류합니다.
    setPopupUrl(null);
    setScrollBottomBarVisible(true);
  }, []);

  // ... 나머지 handler와 JSX 생략 ...
}
```

↓ **React가 `popupUrl=null`을 commit하면 `PopupWebView.url`도 null로 다시 전달된다. `Modal.visible`이 false가 되고 stage 8 effect가 닫힘 값에 맞춰 `currentUrl`, history와 error state를 초기화한다.**

**[FLOW-04 / 18단계] 종료** — [`src/components/DemoShell.tsx:758-775`](../src/components/DemoShell.tsx#L758-L775)

```tsx
export function DemoShell() {
  // ... state, 계산값, ref, effect와 handler 생략 ...

  return (
    <View style={styles.container}>
      {/* ... 다른 화면과 공통 UI 생략 ... */}
      <PopupWebView
        classifyNavigation={classifyNavigationUrl}
        networkOffline={networkOffline}
        onClose={closePopup}
        onDeepLink={(url) => {
          // ... popup deep-link branch 생략 ...
        }}
        ref={popupRef}
        url={popupUrl}
      />
      {/* [FLOW-09 / 10단계] 종료: banner visibility와 각 WebView·Query 결과가 서로 독립된 최신 상태로 남아 다음 event를 기다립니다. */}
      {/* [FLOW-04 / 18단계] 종료: `popupUrl=null` render가 Modal을 숨기고 PopupWebView effect가 session state를 닫힘 값으로 초기화합니다. */}
    </View>
  );
}
```

↓ **종료:** `DemoShell.popupUrl=null`, 복구된 하단 tab 표시 입력, 닫힌 `Modal`, 초기화된 popup session state가 남는다. popup 안의 성공 document와 history는 더 이상 사용자에게 노출되지 않으며, 이후 일반 Web tab navigation은 다시 FLOW-03이 담당한다.

### FLOW-05: Local HTML bridge 왕복과 기기 기능

이 흐름은 입력을 신뢰하지 않는 경계와 비동기 response가 원래 WebView로 돌아가는 과정을 함께 읽는다.

```text
[시작] button onclick → 1 sendNative request 생성 → 2 postMessage
→ 3 native WebTab.onMessage 자동 callback → 4 onBridgeMessage(data)
→ 5 DemoShell index closure → 6 handleBridgeMessage → 7 fallback field 읽기
→ 8 JSON/Zod validation → 9 action switch
├─ 10-A~10-H action 선택 → 11-A~11-H dependency 실행 → 필요한 12-A/12-C/12-H 완료
└─ validation/dependency 오류 → 12-B catch
→ 13-A success / 13-B failure envelope → 14 dispatcher Promise fulfill
→ 15 handleBridgeMessage return → prop과 closure를 역순으로 통과
→ 16 WebTab의 .then(response) → 17 injectJavaScript
→ 18 calledByNative parse → 19 화면 반영 후 종료
```

`onMessage`의 `void`는 React Native event callback 자체가 Promise를 반환하지 않게 할 뿐이다. `onBridgeMessage(...)`가 만든 Promise와 그 `.then(...)`은 취소되지 않으며, `14`~`17`단계가 response를 원래 sender WebView로 돌려보낸다.

Source 단계 지도:

- [`src/web/local-html.ts`](../src/web/local-html.ts): 시작, `1`, `2`, `18`, `19`
- [`src/components/WebTab.tsx`](../src/components/WebTab.tsx): `3`, `4`, `16`, `17`
- [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx): `5`, `6`, `11-B`, `11-D`~`11-G`, `15`
- [`src/bridge/schema.ts`](../src/bridge/schema.ts): `8`
- [`src/bridge/dispatcher.ts`](../src/bridge/dispatcher.ts): `7`, `9`, `10-A`~`10-H`, `12-B`, `13-A`·`13-B`, `14`
- [`src/services/device-id.ts`](../src/services/device-id.ts): `11-A`, `12-A`
- [`src/services/notification-service.ts`](../src/services/notification-service.ts): `11-C`, `12-C`
- [`src/services/photo-service.ts`](../src/services/photo-service.ts): `11-H`, `12-H`

`local-html.ts`의 template literal 내부는 실제 WebView payload이므로 FLOW 설명은 문자열 바깥에만 둔다.

8개 action의 전체 계약은 다음 파일을 함께 대조한다.

1. [`src/bridge/types.ts`](../src/bridge/types.ts) `BRIDGE_ACTIONS`
2. [`src/bridge/schema.ts`](../src/bridge/schema.ts) action별 input
3. [`src/bridge/dispatcher.ts`](../src/bridge/dispatcher.ts) 실행과 result
4. [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx) dependency 구현
5. [`src/web/local-html.ts`](../src/web/local-html.ts) sender와 callback

기기 service:

- [`src/services/device-id.ts`](../src/services/device-id.ts)
- [`src/services/photo-service.ts`](../src/services/photo-service.ts)
- [`src/services/notification-service.ts`](../src/services/notification-service.ts)
- [`src/utils/image-size.ts`](../src/utils/image-size.ts)
- [`src/components/Snackbar.tsx`](../src/components/Snackbar.tsx)

[`src/bridge/dispatcher.test.ts`](../src/bridge/dispatcher.test.ts)는 dependency mock과 response만, [`src/web/local-html.test.ts`](../src/web/local-html.test.ts)는 payload 문자열의 정적 존재만 검증한다. 권한 UI와 실제 OS 결과는 이 둘로 확인되지 않는다.

#### 실제 소스로 따라가는 FLOW-05 핵심 경로

아래 발췌는 Local HTML의 `getDeviceUUID` button을 처음 눌러 저장된 device ID가 아직 없는 성공 경로를 따른다. `시작 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10-A → 11-A → 12-A → 13-A → 14 → 15 → 16 → 17 → 18 → 19`를 연결하고, dispatcher의 나머지 action `10-B`~`10-H`, 각 dependency인 `11-B`~`11-H`, notification·photo 완료인 `12-C·12-H`, validation·dependency 실패인 `12-B·13-B`는 위의 기존 단계 지도와 source 링크에서 별도로 확인한다. `12-A` 안에서도 저장된 UUID를 즉시 반환하는 branch와 동시 요청의 shared Promise 재사용은 source에 함께 보이지만, 화살표 설명은 `SecureStore`에 값이 없어 생성·저장하는 첫 요청을 기준으로 한다.

**[FLOW-05] 시작** — [`src/web/local-html.ts:2`](../src/web/local-html.ts#L2), [`src/web/local-html.ts:226`](../src/web/local-html.ts#L226)

```ts
// [파일 역할] 첫 WebView에 넣을 학습용 웹 문서입니다. HTML·CSS·JavaScript와 bridge 버튼 8개가 들어 있습니다.
// [FLOW-05] 시작: 사용자가 bridge 버튼을 누르면 WebView DOM이 해당 `onclick`에서 `sendNative(...)`를 호출합니다.
// [FLOW-05 / 1단계] `sendNative`는 새 uuid와 전달받은 action·params로 request 객체를 만듭니다.
// [FLOW-05 / 2단계] 같은 함수가 request를 `JSON.stringify`한 문자열 하나로 `ReactNativeWebView.postMessage`에 전달합니다.

// ... payload 바깥의 역할 설명 생략 ...

export const LOCAL_DEMO_HTML = `<!doctype html>
<!-- ... FLOW-05와 직접 관계없는 head와 앞선 section 생략 ... -->
    <section class="card device-actions">
      <h2>기기와 메시지</h2>
      <button ontouchstart="" onclick="showMobileType()">스마트폰 종류 출력 요청</button>
      <button ontouchstart="" onclick="sendNative('getDeviceUUID', undefined, '')">기기 고유번호 전달 요청</button>
<!-- ... 뒤의 button과 markup 생략 ... -->
</html>`;
```

↓ **사용자 tap을 받은 WebView DOM이 `onclick`을 실행한다. `action='getDeviceUUID'`, `params=undefined`, `uuid=''`가 payload 안의 실제 `sendNative` parameter가 된다. 빈 문자열 uuid는 `undefined`가 아니므로 이 요청은 새 임시 UUID를 만들지 않고 `''`를 그대로 사용한다.**

**[FLOW-05 / 1단계 → 2단계]** — [`src/web/local-html.ts:3-4`](../src/web/local-html.ts#L3-L4), [`src/web/local-html.ts:144-149`](../src/web/local-html.ts#L144-L149)

```ts
// [FLOW-05 / 1단계] `sendNative`는 새 uuid와 전달받은 action·params로 request 객체를 만듭니다.
// [FLOW-05 / 2단계] 같은 함수가 request를 `JSON.stringify`한 문자열 하나로 `ReactNativeWebView.postMessage`에 전달합니다.

// ... payload 바깥의 역할 설명 생략 ...

export const LOCAL_DEMO_HTML = `<!doctype html>
<!-- ... HTML과 CSS 생략 ... -->
    <script>
      // ... getUuidV4 helper 생략 ...
      function sendNative(action, params, uuid) {
        var request = { uuid: uuid === undefined ? getUuidV4() : uuid, action: action };
        if (params !== undefined) {
          request.params = params;
        }
        window.ReactNativeWebView.postMessage(JSON.stringify(request));
      }
<!-- ... 나머지 payload JavaScript와 markup 생략 ... -->
</html>`;
```

↓ **`request`는 `{ uuid: '', action: 'getDeviceUUID' }`가 되고 `params` field는 생략된다. `postMessage`가 이 객체를 JSON 문자열 하나로 native bridge에 넘기면 `react-native-webview`가 sender WebView의 `onMessage` prop을 자동 호출한다.**

**[FLOW-05 / 3단계 → 4단계]** — [`src/components/WebTab.tsx:413-421`](../src/components/WebTab.tsx#L413-L421)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    tag,
    active,
    // ... bottomContentInset과 initialSource 생략 ...
    onBridgeMessage,
    // ... 나머지 callback props 생략 ...
  },
  forwardedRef,
) {
  // ... state, ref와 helper 생략 ...

  return (
    // active가 false여도 WebView를 없애지 않습니다. 투명하게 만들고 터치만 막아 웹 문서, 방문 기록, 입력 중인 form 값을 그대로 둡니다.
    <View
      /* ... accessibility, collapsable과 pointer props 생략 ... */
      style={[styles.container, !active && styles.inactive]}
      testID={`web-tab-${tag}`}
    >
      {/* ... progress UI 생략 ... */}
      <WebView
        /* ... 앞선 props 생략 ... */
        // [역할] `onMessage`는 웹 문서의 bridge 요청을 DemoShell로 보내고 완료된 응답을 다시 WebView에 넣습니다.
        onMessage={(event) => {
          // [FLOW-05 / 3단계] web page가 `postMessage`를 호출하면 native bridge가 이 `onMessage` prop을 자동 호출해 같은 문자열을 `data`로 줍니다.
          // [FLOW-05 / 4단계] callback은 `onBridgeMessage(data)`를 호출하고 반환된 Promise에 response consumer인 `.then`을 등록합니다.
          // [FLOW-05 / 16단계] 그 Promise가 `BridgeResponse`로 fulfilled되면 `.then`이 `injectBridgeResponse(response)`를 호출합니다.
          // [문법] 앞의 `void`는 이 event callback이 Promise를 밖으로 돌려주지 않는다는 뜻입니다. `.then`은 응답을 받은 뒤에만 WebView로 보내게 합니다.
          void onBridgeMessage(event.nativeEvent.data).then(
            injectBridgeResponse,
          );
        }}
        /* ... 뒤의 props 생략 ... */
      />
      {/* ... error overlay 생략 ... */}
    </View>
  );
});
```

↓ **`onMessage` event callback은 native에 Promise를 반환하지 않지만, 내부에서는 `onBridgeMessage(data)`가 돌려줄 Promise에 `.then(injectBridgeResponse)`를 먼저 등록한다. 요청 방향에서는 같은 JSON 문자열이 `DemoShell` prop closure로 올라간다.**

**[FLOW-05 / 5단계]** — [`src/components/DemoShell.tsx:692-697`](../src/components/DemoShell.tsx#L692-L697)

```tsx
export function DemoShell() {
  // ... state와 handler 생략 ...

  return (
    <View style={styles.container}>
      {/* ... network banner와 iOS toolbar 생략 ... */}
      <View style={styles.content}>
        {TAB_DEFINITIONS.slice(0, 3).map((tab) => (
          <WebTab
            /* ... 앞선 props 생략 ... */
            onBridgeMessage={(message) =>
              // [역할] `onBridgeMessage` callback은 message와 source 탭 번호를 bridge 연결 함수에 함께 전달합니다.
              // [FLOW-05 / 5단계] 이 closure가 `tab.index`를 붙여 `handleBridgeMessage(index, message)`를 호출하고 그 Promise를 WebTab에 반환합니다.
              // 어느 탭에서 message가 왔는지 알 수 있도록 현재 index도 함께 전달합니다.
              handleBridgeMessage(tab.index, message)
            }
            /* ... 뒤의 props 생략 ... */
          />
        ))}
        {/* ... NativeUsersScreen 생략 ... */}
      </View>
      {/* ... 하단 tab, Snackbar와 popup 생략 ... */}
    </View>
  );
}
```

↓ **closure가 source tab index `0`을 붙인 뒤 `handleBridgeMessage(0, message)`를 호출한다. concise arrow function이라 이 handler의 Promise는 새 Promise로 감싸지지 않고 WebTab으로 그대로 반환될 예정이며, 먼저 dispatcher에 실제 service dependency가 주입된다.**

**[FLOW-05 / 6단계]** — [`src/components/DemoShell.tsx:476-485`](../src/components/DemoShell.tsx#L476-L485)

```tsx
export function DemoShell() {
  // ... service callback과 ref 준비 생략 ...

  // [역할] `handleBridgeMessage`는 source 탭 정보와 앱 기능들을 dispatcher에 연결하고 완료 응답 Promise를 돌려줍니다.
  const handleBridgeMessage = useCallback(
    (sourceTabIndex: TabIndex, message: string): Promise<BridgeResponse> =>
      // [FLOW-05 / 6단계] `handleBridgeMessage`는 message와 현재 service·ref·state dependency 객체를 `dispatchBridgeMessage`에 전달합니다.
      // [FLOW-05 / 15단계] 중간 변환 없이 dispatcher Promise를 그대로 return하므로 prop callback을 거쳐 원래 WebTab의 `.then`까지 역순으로 전달됩니다.
      // [문법] 중괄호 없는 arrow function은 `dispatchBridgeMessage(...)`의 Promise를 바로 돌려줍니다.
      // WebTab의 `.then`은 이 작업이 끝날 때까지 기다립니다.
      dispatchBridgeMessage(message, {
        // 사진과 알림 service 함수는 그대로 건넵니다. React 화면 값을 바꿔야 하는 요청만 아래에서 짧은 연결 함수를 만듭니다.
        getDeviceUUID: getOrCreateDeviceId,
        // ... FLOW-05의 다른 dependency 구현 생략 ...
        setBottomNaviVisible,
        getPhotoImages: selectPhotoImages,
      }),
    // [문법] dependency 배열에는 이 함수 안에서 직접 쓰는 callback과 Zustand 함수를 넣습니다. 값이 바뀌면 연결 함수도 새로 만듭니다.
    [setBottomNaviVisible, setSelectedTabIndex, showToastMessage],
  );

  // ... 나머지 handler와 JSX 생략 ...
}
```

↓ **`dispatchBridgeMessage(message, dependencies)`가 호출되면 async dispatcher가 실행된다. 성공 경로에서도 먼저 `readBridgeEnvelope`로 uuid와 action fallback을 읽고, 이어진 `try` 안에서 전체 validation을 시작한다.**

**[FLOW-05 / 7단계]** — [`src/bridge/dispatcher.ts:57-70`](../src/bridge/dispatcher.ts#L57-L70)

```ts
// [역할] `dispatchBridgeMessage`는 요청을 검사하고 action에 맞는 실행 함수를 부른 뒤 공통 응답을 돌려줍니다.
// [문법] `async`를 사용해 바로 끝나는 화면 작업과 기다려야 하는 기기 작업을 모두 Promise 응답으로 맞춥니다.
// [FLOW-05 / 14단계] 각 `return`의 envelope가 이 async 함수의 Promise를 fulfill해 `handleBridgeMessage` 반환 경로를 거슬러 올라갑니다.
export async function dispatchBridgeMessage(
  message: string,
  dependencies: BridgeDependencies,
): Promise<BridgeResponse> {
  // 전체 검사를 시작하기 전에 uuid와 action만 먼저 읽습니다. 나중에 실패해도 어느 요청인지 돌려주기 위해서입니다.
  // [FLOW-05 / 7단계] 먼저 `readBridgeEnvelope`가 실패 응답에도 보존할 수 있는 uuid·action만 별도로 읽습니다.
  const fallback = readBridgeEnvelope(message);

  // 요청 검사와 실제 기능 실행을 같은 `try` 안에 둡니다. 어느 단계에서 실패해도 같은 실패 응답으로 바꿉니다.
  try {
    const request = parseBridgeRequest(message);
    // ... action switch 생략 ...
  } catch (error) {
    // ... 공통 실패 envelope 생성 생략 ...
  }
}
```

↓ **fallback read 뒤 같은 `message`가 `parseBridgeRequest`로 전달된다. `JSON.parse` 결과가 strict Zod discriminated union을 통과해야만 typed `BridgeRequest`로 dispatcher에 돌아온다.**

**[FLOW-05 / 8단계]** — [`src/bridge/schema.ts:84-89`](../src/bridge/schema.ts#L84-L89)

```ts
// ... action별 strict Zod schema 선언 생략 ...

// [역할] `parseBridgeRequest`는 WebView 문자열을 JSON으로 읽고 action별 규칙을 모두 통과한 요청만 돌려줍니다.
export function parseBridgeRequest(message: string): BridgeRequest {
  // [FLOW-05 / 8단계] dispatcher가 이 함수를 호출하면 JSON parse 뒤 strict Zod union으로 uuid·action·action별 params를 검사합니다.
  // 검사 전 값이 앱 기능으로 넘어가지 않게 한 줄에서 이어 처리합니다. 실패는 dispatcher가 공통 오류로 바꿉니다.
  return bridgeRequestSchema.parse(JSON.parse(message));
}
```

↓ **검사된 request의 `action`이 `getDeviceUUID`이므로 switch가 `10-A`를 고른다. dispatcher는 주입된 `getOrCreateDeviceId()`를 호출하고 그 Promise가 UUID 문자열로 fulfill될 때까지 `await`에서 멈춘다.**

**[FLOW-05 / 9단계 → 10-A단계]** — [`src/bridge/dispatcher.ts:72-82`](../src/bridge/dispatcher.ts#L72-L82)

```ts
export async function dispatchBridgeMessage(
  message: string,
  dependencies: BridgeDependencies,
): Promise<BridgeResponse> {
  // ... fallback read 생략 ...

  try {
    const request = parseBridgeRequest(message);

    // [FLOW-05 / 9단계] validation을 통과한 `request.action`이 switch case 하나를 선택하고 그 dependency 완료를 기다립니다.
    // [문법] `switch`가 action별로 나누므로 각 `case` 안에서는 그 action에 맞는 params 모양을 사용할 수 있습니다.
    switch (request.action) {
      case "getDeviceUUID":
        // [FLOW-05 / 10-A단계] UUID branch는 `getDeviceUUID()` Promise를 await한 문자열을 success result로 넘깁니다.
        // UUID를 읽거나 새로 저장하는 작업이 끝난 뒤 그 문자열을 성공 결과에 넣습니다.
        return success(
          request.uuid,
          request.action,
          await dependencies.getDeviceUUID(),
        );
      // ... 다른 action case 생략 ...
    }
  } catch (error) {
    // ... 실패 response 생략 ...
  }
}
```

↓ **`dependencies.getDeviceUUID`는 `DemoShell`이 넣은 `getOrCreateDeviceId`다. module-scope `deviceIdPromise`가 아직 null인 첫 요청에서는 `loadDeviceId()`를 한 번 시작하고, 완료될 그 Promise를 dispatcher에 반환한다.**

**[FLOW-05 / 11-A단계]** — [`src/services/device-id.ts:42-58`](../src/services/device-id.ts#L42-L58)

```ts
// ... SecureStore와 module-scope deviceIdPromise 선언 생략 ...

// [역할] `getOrCreateDeviceId`는 동시에 들어온 요청들이 진행 중인 UUID 작업 하나를 함께 기다리게 합니다.
export function getOrCreateDeviceId(): Promise<string> {
  // [FLOW-05 / 11-A단계] UUID dependency가 이 함수를 호출하면 진행 중 Promise를 재사용하거나 `loadDeviceId()`를 한 번 시작합니다.
  // 여러 WebView가 동시에 요청해도 진행 중인 Promise 하나를 함께 기다립니다. 그래서 서로 다른 UUID가 생기지 않습니다.
  if (!deviceIdPromise) {
    // [역할] 실패 처리 callback은 끝나지 못한 Promise를 cache에서 지우고 같은 오류를 호출자에게 다시 보냅니다.
    deviceIdPromise = loadDeviceId().catch((error) => {
      // 실패한 Promise는 지웁니다. 저장소 문제가 해결된 뒤 다음 요청이 다시 시도할 수 있게 하기 위해서입니다.
      deviceIdPromise = null;
      // [문법] `throw error`는 잡은 오류를 숨기지 않고 다시 밖으로 보냅니다.
      // dispatcher는 이 오류를 WebView가 받을 공통 실패 응답으로 바꿉니다.
      throw error;
    });
  }

  return deviceIdPromise;
}
```

↓ **shared Promise 안의 `loadDeviceId`가 SecureStore read를 await한다. 선택한 첫 요청에서는 `storedDeviceId`가 없으므로 `Crypto.randomUUID()` 결과를 만들고 `setItemAsync` 저장 완료까지 기다린 뒤 같은 문자열을 반환한다.**

**[FLOW-05 / 12-A단계]** — [`src/services/device-id.ts:24-40`](../src/services/device-id.ts#L24-L40)

```ts
// [역할] `loadDeviceId`는 저장된 UUID를 읽고, 없으면 새 UUID를 만들어 저장한 뒤 돌려줍니다.
// [문법] `async` 함수는 문자열을 바로 주는 대신 `Promise<string>`으로 돌려줍니다.
// `await` 중 오류가 나면 이 함수를 부른 쪽에서도 실패한 Promise로 받습니다.
async function loadDeviceId(): Promise<string> {
  // [FLOW-05 / 12-A단계] shared Promise 안에서 SecureStore read를 await하고 저장값 반환 또는 UUID 생성·저장 branch를 끝낸 뒤 dispatcher로 돌려줍니다.
  const storedDeviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

  if (storedDeviceId) {
    // 이미 저장된 값이 있으면 새 UUID를 만들거나 다시 저장하지 않습니다.
    return storedDeviceId;
  }

  // [라이브러리] `Crypto.randomUUID()`는 UUID를 바로 만들지만 SecureStore 저장은 끝날 때까지 기다려야 합니다.
  const deviceId = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
  return deviceId;
}
```

↓ **`setItemAsync`가 끝나면 `loadDeviceId`의 Promise가 새 UUID로 fulfill되고, shared `deviceIdPromise`와 dispatcher의 `await dependencies.getDeviceUUID()`도 같은 문자열로 차례로 재개된다. dispatcher는 보존된 request uuid·action과 이 result를 `success`에 넘긴다.**

**[FLOW-05 / 13-A단계]** — [`src/bridge/dispatcher.ts:20-35`](../src/bridge/dispatcher.ts#L20-L35)

```ts
// [역할] `success`는 action마다 다른 결과를 공통 성공 응답 모양으로 감쌉니다.
// [문법] `T`에는 action마다 다른 result type이 들어갑니다. 그 값을 유지한 채 같은 성공 응답 모양을 만듭니다.
function success<T>(
  uuid: string,
  action: string,
  result: T,
): BridgeResponse<T> {
  // [FLOW-05 / 13-A단계] dependency branch가 끝나면 `success`가 원래 uuid·action·result를 공통 성공 envelope로 합칩니다.
  // 어느 action이 성공해도 uuid, action, result, isError 순서를 같은 모양으로 맞춥니다.
  return {
    uuid,
    action,
    result,
    isError: false,
  };
}
```

↓ **`success`의 `{ uuid: '', action: 'getDeviceUUID', result: 새 UUID, isError: false }`가 `return success(...)`의 반환값이 된다. `dispatchBridgeMessage`가 `async`이므로 이 return은 stage 6에서 받은 dispatcher Promise를 그 `BridgeResponse`로 fulfill한다.**

**[FLOW-05 / 14단계]** — [`src/bridge/dispatcher.ts:57-82`](../src/bridge/dispatcher.ts#L57-L82)

```ts
// [역할] `dispatchBridgeMessage`는 요청을 검사하고 action에 맞는 실행 함수를 부른 뒤 공통 응답을 돌려줍니다.
// [문법] `async`를 사용해 바로 끝나는 화면 작업과 기다려야 하는 기기 작업을 모두 Promise 응답으로 맞춥니다.
// [FLOW-05 / 14단계] 각 `return`의 envelope가 이 async 함수의 Promise를 fulfill해 `handleBridgeMessage` 반환 경로를 거슬러 올라갑니다.
export async function dispatchBridgeMessage(
  message: string,
  dependencies: BridgeDependencies,
): Promise<BridgeResponse> {
  // ... fallback read와 parse 생략 ...

  try {
    // ... request parse 생략 ...
    switch (request.action) {
      case "getDeviceUUID":
        // [FLOW-05 / 10-A단계] UUID branch는 `getDeviceUUID()` Promise를 await한 문자열을 success result로 넘깁니다.
        // UUID를 읽거나 새로 저장하는 작업이 끝난 뒤 그 문자열을 성공 결과에 넣습니다.
        return success(
          request.uuid,
          request.action,
          await dependencies.getDeviceUUID(),
        );
      // ... 다른 action case 생략 ...
    }
  } catch (error) {
    // ... 실패 response 생략 ...
  }
}
```

↓ **fulfill된 Promise는 새 변환 없이 `handleBridgeMessage`의 concise arrow return으로 돌아간다. 즉 이 handler는 response 객체를 먼저 꺼내는 것이 아니라 dispatcher가 만든 동일한 Promise를 caller에게 돌려준 상태였고, 이제 그 Promise가 완료된다.**

**[FLOW-05 / 15단계 — `handleBridgeMessage` 반환]** — [`src/components/DemoShell.tsx:476-483`](../src/components/DemoShell.tsx#L476-L483)

```tsx
export function DemoShell() {
  // ... state와 dependency callback 생략 ...

  // [역할] `handleBridgeMessage`는 source 탭 정보와 앱 기능들을 dispatcher에 연결하고 완료 응답 Promise를 돌려줍니다.
  const handleBridgeMessage = useCallback(
    (sourceTabIndex: TabIndex, message: string): Promise<BridgeResponse> =>
      // [FLOW-05 / 6단계] `handleBridgeMessage`는 message와 현재 service·ref·state dependency 객체를 `dispatchBridgeMessage`에 전달합니다.
      // [FLOW-05 / 15단계] 중간 변환 없이 dispatcher Promise를 그대로 return하므로 prop callback을 거쳐 원래 WebTab의 `.then`까지 역순으로 전달됩니다.
      // [문법] 중괄호 없는 arrow function은 `dispatchBridgeMessage(...)`의 Promise를 바로 돌려줍니다.
      // WebTab의 `.then`은 이 작업이 끝날 때까지 기다립니다.
      dispatchBridgeMessage(message, {
        // ... dependency 객체 생략 ...
      }),
    [setBottomNaviVisible, setSelectedTabIndex, showToastMessage],
  );

  // ... JSX 생략 ...
}
```

↓ **그 Promise는 `DemoShell` render 때 만든 `onBridgeMessage` closure의 `handleBridgeMessage(...)` 표현식에서도 그대로 반환되어, 이 prop을 호출했던 원래 `WebTab.onMessage` 위치까지 한 단계 더 역순으로 도착한다.**

**[FLOW-05 / 5단계 — prop closure 반환 경로]** — [`src/components/DemoShell.tsx:692-697`](../src/components/DemoShell.tsx#L692-L697)

```tsx
export function DemoShell() {
  // ... state와 handler 생략 ...

  return (
    <View style={styles.container}>
      {/* ... network banner와 iOS toolbar 생략 ... */}
      <View style={styles.content}>
        {TAB_DEFINITIONS.slice(0, 3).map((tab) => (
          <WebTab
            /* ... 앞선 props 생략 ... */
            onBridgeMessage={(message) =>
              // [역할] `onBridgeMessage` callback은 message와 source 탭 번호를 bridge 연결 함수에 함께 전달합니다.
              // [FLOW-05 / 5단계] 이 closure가 `tab.index`를 붙여 `handleBridgeMessage(index, message)`를 호출하고 그 Promise를 WebTab에 반환합니다.
              // 어느 탭에서 message가 왔는지 알 수 있도록 현재 index도 함께 전달합니다.
              handleBridgeMessage(tab.index, message)
            }
            /* ... 뒤의 props 생략 ... */
          />
        ))}
        {/* ... NativeUsersScreen 생략 ... */}
      </View>
      {/* ... 하단 tab, Snackbar와 popup 생략 ... */}
    </View>
  );
}
```

↓ **이제 stage 4에서 이미 등록해 둔 `.then`의 input Promise가 `BridgeResponse`로 fulfilled된다. JavaScript microtask가 response consumer인 `injectBridgeResponse`를 호출하며, 앞의 `void`는 이 내부 chain을 없애거나 취소하지 않는다.**

**[FLOW-05 / 16단계]** — [`src/components/WebTab.tsx:413-421`](../src/components/WebTab.tsx#L413-L421)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    tag,
    active,
    // ... bottomContentInset과 initialSource 생략 ...
    onBridgeMessage,
    // ... 나머지 callback props 생략 ...
  },
  forwardedRef,
) {
  // ... state, ref와 helper 생략 ...

  return (
    // active가 false여도 WebView를 없애지 않습니다. 투명하게 만들고 터치만 막아 웹 문서, 방문 기록, 입력 중인 form 값을 그대로 둡니다.
    <View
      /* ... accessibility, collapsable과 pointer props 생략 ... */
      style={[styles.container, !active && styles.inactive]}
      testID={`web-tab-${tag}`}
    >
      {/* ... progress UI 생략 ... */}
      <WebView
        /* ... 앞선 props 생략 ... */
        // [역할] `onMessage`는 웹 문서의 bridge 요청을 DemoShell로 보내고 완료된 응답을 다시 WebView에 넣습니다.
        onMessage={(event) => {
          // [FLOW-05 / 3단계] web page가 `postMessage`를 호출하면 native bridge가 이 `onMessage` prop을 자동 호출해 같은 문자열을 `data`로 줍니다.
          // [FLOW-05 / 4단계] callback은 `onBridgeMessage(data)`를 호출하고 반환된 Promise에 response consumer인 `.then`을 등록합니다.
          // [FLOW-05 / 16단계] 그 Promise가 `BridgeResponse`로 fulfilled되면 `.then`이 `injectBridgeResponse(response)`를 호출합니다.
          // [문법] 앞의 `void`는 이 event callback이 Promise를 밖으로 돌려주지 않는다는 뜻입니다. `.then`은 응답을 받은 뒤에만 WebView로 보내게 합니다.
          void onBridgeMessage(event.nativeEvent.data).then(
            injectBridgeResponse,
          );
        }}
        /* ... 뒤의 props 생략 ... */
      />
      {/* ... error overlay 생략 ... */}
    </View>
  );
});
```

↓ **`.then`이 response를 `injectBridgeResponse` parameter로 넣는다. helper는 객체를 JSON 문자열로 만든 뒤 그 문자열을 JavaScript string literal로 한 번 더 escape하고, sender WebView ref에 `calledByNative(...)` 실행문을 주입한다.**

**[FLOW-05 / 17단계]** — [`src/components/WebTab.tsx:164-173`](../src/components/WebTab.tsx#L164-L173)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    // ... WebTab props 생략 ...
  },
  forwardedRef,
) {
  // ... state와 ref 생략 ...

  // [라이브러리] `useCallback`은 화면을 다시 그려도 같은 함수 객체를 이어서 쓰게 합니다. ref 명령과 Promise `.then`이 불필요하게 바뀌지 않도록 합니다.
  // [역할] `injectBridgeResponse`는 앱의 bridge 응답을 안전한 JavaScript 호출문으로 만들어 WebView에 실행시킵니다.
  const injectBridgeResponse = useCallback((response: BridgeResponse) => {
    // [FLOW-05 / 17단계] `.then`이 이 함수를 호출하면 응답 객체를 두 번 직렬화하고 `injectJavaScript` 명령을 native WebView에 보냅니다.
    // 따옴표나 script 문자가 실행할 코드를 망가뜨리지 않도록 두 번 문자열로 바꿉니다.
    // 첫 `JSON.stringify`는 응답 객체를 JSON 글로 만듭니다. 두 번째는 그 글을 JavaScript 문자열 안에 안전하게 넣을 수 있게 만듭니다.
    const serializedResponse = JSON.stringify(response);
    const functionArgument = JSON.stringify(serializedResponse);
    // [문법] `?.` optional chaining은 WebView가 아직 만들어지지 않았으면 `injectJavaScript`를 부르지 않고 넘어갑니다.
    webViewRef.current?.injectJavaScript(
      `window.calledByNative && window.calledByNative(${functionArgument}); true;`,
    );
  }, []);

  // ... 나머지 helper와 JSX 생략 ...
});
```

↓ **native WebView가 주입된 script를 실행하면 `window.calledByNative(serializedResponse)`가 Web page 함수 호출로 이어진다. 첫 `JSON.parse`가 다시 response 객체를 만들고, 선택한 성공 action은 UUID alert branch를 실행한 뒤 `"complete"`를 반환한다.**

**[FLOW-05 / 18단계 → 19단계] 종료** — [`src/web/local-html.ts:171-205`](../src/web/local-html.ts#L171-L205), [`src/web/local-html.ts:249-250`](../src/web/local-html.ts#L249-L250)

```ts
// ... payload 바깥의 역할 설명 생략 ...

export const LOCAL_DEMO_HTML = `<!doctype html>
<!-- ... FLOW-05와 직접 관계없는 HTML 생략 ... -->
    <script>
      // ... getUuidV4, sendNative와 앞선 bridge JavaScript 생략 ...
      function calledByNative(message) {
        var data = JSON.parse(message);
        console.log("uuid: " + data.uuid);
        console.log("action: " + data.action);
        console.log("result: ", data.result);
        console.log("isError: " + data.isError);

        if (data.isError) {
          alert(data.result);
          return "complete";
        }

        if (data.action === "getDeviceUUID") {
          alert(data.result);
        } else if (data.action === "getPhotoImages") {
          for (var resetIndex = 1; resetIndex <= 2; resetIndex++) {
            var resetImage = document.getElementById("image" + resetIndex);
            var resetName = document.getElementById("photo" + resetIndex + "_name");
            resetImage.removeAttribute("src");
            resetImage.style.display = "none";
            resetName.value = "";
          }

          for (var index = 0; index < data.result.length; index++) {
            var imageData = data.result[index];
            var imageElement = document.getElementById("image" + (index + 1));
            imageElement.src = "data:image/png;base64," + imageData.base64Image;
            imageElement.style.display = "block";

            var textElement = document.getElementById("photo" + (index + 1) + "_name");
            textElement.value = "사진이름: " + imageData.name;
          }
        }

        return "complete";
      }
    </script>
<!-- ... 뒤의 body markup 생략 ... -->
</html>`;
// [FLOW-05 / 18단계] injected script가 WebView 안에서 `calledByNative(serializedResponse)`를 호출하면 함수가 JSON을 parse합니다.
// [FLOW-05 / 19단계] 종료: `calledByNative`가 오류 Alert 또는 action별 UUID·사진 UI를 반영하고 `"complete"`를 반환합니다.
```

↓ **종료:** 사용자에게 새 UUID가 Alert로 표시되고 Web page callback은 `"complete"`를 반환한다. 생성된 ID는 SecureStore와 module-scope shared Promise에 남아 이후 요청에서 재사용된다. 이 bridge 왕복은 sender WebView 안에서 끝나며, 별도의 tab navigation이 필요할 때만 다른 FLOW의 책임으로 이어진다.

### FLOW-06: System deep link, WebView deep link와 외부 앱

```text
[시작]
├─ OS: 1-A redirectSystemPath 자동 호출 → 2-A rewrite → 3-A index route → 4-A Router 소비
│      → 5-A query snapshot → 6-A effect
├─ 일반 WebView: 1-B policy callback → 2-B parser → 3-B deep-link decision
├─ popup: 1-C popup decision → 3-C parent callback
└─ 외부 scheme: 2-D common opener → 3-D Linking.openURL → 4-D 종료
OS/WebView/popup 입력 → 7 common handler → 8 parseDemoDeepLink
├─ 9-A invalid 종료
└─ 9-B valid → 10 applyDeepLink
   ├─ 11-A Web target → FLOW-03
   └─ 11-B native target → FLOW-07
→ 12 boolean caller 반환 → 13-A OS / 13-B WebView / 13-C popup 종료
```

Source 단계 지도:

- [`src/services/native-intent.ts`](../src/services/native-intent.ts): 시작, `3-A`
- [`app/+native-intent.tsx`](../app/+native-intent.tsx): `1-A`, `2-A`, `4-A`
- [`src/components/WebTab.tsx`](../src/components/WebTab.tsx): `1-B`
- [`src/components/PopupWebView.tsx`](../src/components/PopupWebView.tsx): `1-C`
- [`src/services/url-router.ts`](../src/services/url-router.ts): `2-B`, `3-B`, `8`
- [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx): `2-D`, `3-C`·`3-D`, `4-D`, `5-A`, `6-A`, `7`, `9-A`·`9-B`, `10`, `11-A`·`11-B`, `12`, `13-A`~`13-C`

같이 볼 test:

- [`src/services/native-intent.test.ts`](../src/services/native-intent.test.ts)
- [`src/services/url-router.test.ts`](../src/services/url-router.test.ts)

두 suite는 URL 문자열 계약을 검증한다. package의 scheme registration, Android intent와 iOS app launch는 build·실기기 결과를 읽어야 한다.

#### 실제 소스로 따라가는 FLOW-06 핵심 경로

아래 발췌의 대표 경로는 OS가 `mywebviewapp://webviewappdemo?target=1&url=m.nate.com`을 전달해 두 번째 Web tab을 선택하고 HTTPS URL을 여는 `1-A → 2-A → 3-A → 4-A → 5-A → 6-A → 7 → 8 → 9-B → 10 → 11-A → 12 → 13-A`다. invalid 입력 `9-A`, native target `11-B`, popup `1-C·3-C·13-C`, 외부 scheme `2-D·3-D·4-D`는 위의 기존 단계 지도와 source 링크에서 별도로 확인한다.

현재 source를 실제 호출 기준으로 보면 OS와 popup은 `handleDeepLinkUrl`을 호출하지만, 일반 WebView는 `classifyNavigationUrl` 안에서 같은 `parseDemoDeepLink`를 호출한 뒤 `deep-link` decision consumer가 `applyDeepLink`를 직접 호출한다. 따라서 세 입력이 단일 handler 하나를 모두 통과한다고 단순화하지 않고, 아래에서는 WebView B 입구를 함께 발췌해 **공통 parser `parseDemoDeepLink`와 공통 적용 함수 `applyDeepLink`라는 두 합류 지점**을 표시한다.

**[FLOW-06] 시작** — [`src/services/native-intent.ts:2`](../src/services/native-intent.ts#L2)

```ts
// [파일 역할] OS와 Expo Go가 서로 다른 모양으로 준 demo 주소를 첫 화면이 읽는 한 가지 모양으로 바꿉니다.
// [FLOW-06] 시작: app deep link는 OS path, 일반 WebView, popup 중 하나에서 들어오고 외부 scheme은 별도 OS branch로 들어옵니다.

// ... file scope 설명 생략 ...

export function rewriteIncomingSystemPath(path: string): string {
  // ... OS path 변환은 3-A단계 발췌에서 이어짐 ...
}
```

↓ **사용자가 OS에서 custom scheme을 열면 Expo Router가 화면 route를 확정하기 전에 `redirectSystemPath`를 cold·warm launch 모두에서 자동 호출한다. 받은 원문 `path`는 pure rewrite 함수의 parameter로 그대로 들어간다.**

**[FLOW-06 / 1-A단계 → 2-A단계 → 4-A단계]** — [`app/+native-intent.tsx:14-25`](../app/+native-intent.tsx#L14-L25)

```ts
// [역할] `redirectSystemPath`는 Expo Router가 건넨 OS 주소를 앱 첫 화면에서 읽을 주소로 바꿉니다.
// [문법] `{ path }`는 전달받은 객체에서 path만 꺼내 같은 이름의 변수로 만드는 구조 분해 문법입니다.
// 뒤의 type에는 이 함수가 함께 받는 `initial`도 적어 전체 입력 모양을 보여 줍니다.
export function redirectSystemPath({ path }: {
  path: string;
  initial: boolean;
}): string {
  // [FLOW-06 / 1-A단계] OS URL을 route로 확정하기 전에 Expo Router가 cold·warm 모두 이 hook을 자동 호출합니다.
  // [FLOW-06 / 2-A단계] hook은 받은 `path`를 pure `rewriteIncomingSystemPath(path)`에 그대로 전달합니다.
  // [FLOW-06 / 4-A단계] 반환된 route 문자열은 Expo Router가 소비해 Root `Stack`의 index query 또는 원래 route로 연결합니다.
  return rewriteIncomingSystemPath(path);
}
```

↓ **rewrite 함수는 OS URL을 parse해 demo host/path인지 확인하고 query를 canonical custom URL로 복사한다. 선택한 valid demo 입력은 내부 URL 전체가 encode된 `/?demoDeepLink=...` route 문자열로 바뀐다.**

**[FLOW-06 / 3-A단계]** — [`src/services/native-intent.ts:6-35`](../src/services/native-intent.ts#L6-L35)

```ts
// [역할] `rewriteIncomingSystemPath`는 demo 주소만 canonical custom URL을 담은 index query로 바꿉니다.
// [문법] `try/catch`로 URL 해석 오류를 잡아 앱이 멈추지 않게 합니다. 잘못된 주소는 안전한 첫 화면으로 보냅니다.
export function rewriteIncomingSystemPath(path: string): string {
  try {
    // [라이브러리] 표준 `URL`에 기준 주소를 주면 전체 주소와 `/settings` 같은 상대 주소를 같은 방식으로 읽을 수 있습니다.
    // 원래 주소 뒤의 query 값은 아래 기준 주소로 그대로 옮깁니다.
    const url = new URL(path, "mywebviewapp://app.home");
    // [문법] 정규식 `/\/$/`은 문자열 맨 끝의 `/` 하나만 찾아 없앱니다.
    const normalizedPath = url.pathname.replace(/\/$/, "");
    const isDemoDeepLink =
      url.hostname === "webviewappdemo" ||
      normalizedPath.endsWith("/webviewappdemo");

    if (!isDemoDeepLink) {
      // demo 주소가 아니면 바꾸지 않고 Expo Router가 원래대로 처리하게 합니다.
      return path;
    }

    const canonicalUrl = new URL("mywebviewapp://webviewappdemo");
    // [라이브러리] `URLSearchParams.forEach`로 query 값을 하나씩 읽고 `append`로 새 주소에 붙입니다.
    // 같은 이름이 여러 번 나온 값도 빠뜨리지 않습니다.
    // [역할] `forEach` callback은 원래 query의 key와 값을 canonical URL에 같은 순서로 옮깁니다.
    url.searchParams.forEach((value, key) => {
      canonicalUrl.searchParams.append(key, value);
    });

    // [FLOW-06 / 3-A단계] demo path이면 query를 canonical custom URL에 복사하고 전체를 encode한 index route 문자열로 반환합니다.
    // [문법] `encodeURIComponent`는 주소 안의 `?`와 `&`를 글자로 바꿉니다.
    // 그래서 안쪽 주소가 바깥 route의 query 구분자로 잘못 읽히지 않습니다.
    return `/?demoDeepLink=${encodeURIComponent(canonicalUrl.toString())}`;
  } catch {
    // URL로 읽을 수 없는 값은 앱에 실제로 존재하는 첫 화면 `/`로 보냅니다.
    return "/";
  }
}
```

↓ **`redirectSystemPath`가 이 문자열을 반환하면 Expo Router가 이를 소비해 Root `Stack`의 index route를 유지하면서 `demoDeepLink` query를 갱신한다. `useLocalSearchParams`가 decode된 query snapshot을 반환하고 `DemoShell`을 다시 render한다.**

**[FLOW-06 / 5-A단계]** — [`src/components/DemoShell.tsx:112-125`](../src/components/DemoShell.tsx#L112-L125)

```tsx
export function DemoShell() {
  // ... 앞선 Hook 생략 ...

  // Router는 한 번 처리한 deep link query를 현재 route에서 지울 때 사용합니다. 같은 값이 다시 실행되는 일을 막습니다.
  // [역할] `useRouter`는 처리한 deep link query를 현재 route에서 지울 명령을 제공합니다.
  const router = useRouter();
  // [FLOW-09 / 1단계] `DemoShell` render가 `useNetworkState`를 호출하면 Expo가 연결 상태 구독을 만들고 현재 snapshot을 반환합니다.
  // [라이브러리] 화면이 사라지면 연결 감시는 library가 정리합니다. 이 값은 인터넷 연결 여부일 뿐, 각 웹·API 요청의 성공을 뜻하지 않습니다.
  // [역할] `useNetworkState`는 휴대폰의 현재 연결 종류를 계속 알려 줘 공통 offline 안내에 사용하게 합니다.
  const networkState = Network.useNetworkState();
  // [FLOW-09 / 2단계] OS 연결 snapshot이 바뀌면 Hook이 구독 중인 `DemoShell`을 다시 render해 아래 offline 계산을 반복합니다.
  // [FLOW-06 / 5-A단계] Router가 index query를 갱신하면 `useLocalSearchParams`가 새 `demoDeepLink` snapshot을 반환해 render를 일으킵니다.
  // [문법] 이 객체 type은 같은 query가 한 번 오면 string, 여러 번 오면 string[]일 수 있음을 나타냅니다.
  // [역할] `useLocalSearchParams`는 OS에서 들어와 index route에 저장된 deep link query를 읽습니다.
  const { demoDeepLink } = useLocalSearchParams<{
    demoDeepLink?: string | string[];
  }>();

  // ... 나머지 Hook, handler와 JSX 생략 ...
}
```

↓ **React가 query 변경 render를 commit한 뒤 `demoDeepLink` dependency의 effect를 자동 실행한다. 배열이면 첫 값을 고르고, 선택한 문자열을 OS 경로의 `handleDeepLinkUrl(incomingUrl)` 호출에 넣는다.**

**[FLOW-06 / 6-A단계]** — [`src/components/DemoShell.tsx:330-349`](../src/components/DemoShell.tsx#L330-L349)

```tsx
export function DemoShell() {
  // ... deep-link parser와 적용 handler 생략 ...

  // 앱을 처음 열었을 때와 이미 실행 중일 때 들어온 route query를 한 번 처리하는 effect입니다. 처리한 값은 바로 지웁니다.
  // [역할] 이 `useEffect` callback은 route query의 deep link를 한 번 적용하고 같은 값이 반복되지 않도록 지웁니다.
  useEffect(() => {
    // [FLOW-06 / 6-A단계] React commit 뒤 query dependency가 바뀌면 이 effect가 자동 실행되어 첫 문자열을 골라 공통 handler에 보냅니다.
    // [문법] 같은 query가 여러 개라 배열이면 첫 값만 사용합니다. string 하나이면 그 값을 그대로 사용합니다.
    const incomingUrl = Array.isArray(demoDeepLink)
      ? demoDeepLink[0]
      : demoDeepLink;

    if (!incomingUrl) {
      // query가 없거나 빈 글이면 탭을 바꾸지 않고 끝냅니다.
      return;
    }

    handleDeepLinkUrl(incomingUrl);
    // 같은 query가 다음 화면 그리기 때 또 실행되지 않도록 처리한 직후 route param을 지웁니다.
    // [FLOW-06 / 13-A단계] 종료(OS): 적용 시도 직후 query를 지워 다음 render에서 같은 OS 입력이 반복되지 않게 합니다.
    router.setParams({ demoDeepLink: undefined });
    // [문법] dependency 배열의 함수, router, query 가운데 하나가 바뀔 때만 effect가 다시 확인합니다.
  }, [demoDeepLink, handleDeepLinkUrl, router]);

  // ... 나머지 handler와 JSX 생략 ...
}
```

↓ **여기서 잠시 같은 흐름의 일반 WebView B 입구를 함께 본다. native navigation이 app scheme을 요청하면 `react-native-webview`가 policy prop을 자동 호출하고, URL을 `DemoShell.onNavigationRequest`에 전달해 boolean 반환을 기다린다.**

**[FLOW-06 / 1-B단계 — 일반 WebView 입구]** — [`src/components/WebTab.tsx:423-429`](../src/components/WebTab.tsx#L423-L429)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    tag,
    active,
    // ... bottomContentInset, initialSource와 onBridgeMessage 생략 ...
    onNavigationRequest,
    // ... onOpenWindow와 onScrollDirection 생략 ...
  },
  forwardedRef,
) {
  // ... state와 handler 생략 ...

  return (
    // active가 false여도 WebView를 없애지 않습니다. 투명하게 만들고 터치만 막아 웹 문서, 방문 기록, 입력 중인 form 값을 그대로 둡니다.
    <View
      /* ... accessibility, collapsable과 pointer props 생략 ... */
      style={[styles.container, !active && styles.inactive]}
      testID={`web-tab-${tag}`}
    >
      {/* ... progress UI 생략 ... */}
      <WebView
        /* ... 앞선 props 생략 ... */
        // [역할] `onShouldStartLoadWithRequest`는 URL을 열어도 되는지 DemoShell의 판단 결과를 WebView에 돌려줍니다.
        onShouldStartLoadWithRequest={(request) =>
          // [FLOW-03 / 4-A단계] Android 최초 load를 제외한 navigation 요청에서 library가 이 prop을 호출하면 URL을 parent policy에 보내고 boolean을 native에 반환합니다.
          // [FLOW-06 / 1-B단계] 요청 URL이 app scheme일 수도 있으므로 같은 callback이 WebView deep-link 입력의 시작점도 됩니다.
          // 이 파일은 URL을 직접 판단하지 않습니다. DemoShell이 검사한 뒤 알려 주는 true 또는 false만 WebView에 돌려줍니다.
          onNavigationRequest(request.url)
        }
        /* ... 뒤의 props 생략 ... */
      />
      {/* ... error overlay 생략 ... */}
    </View>
  );
});
```

↓ **WebView URL은 `handleNavigationRequest`를 거쳐 classifier로 들어간다. classifier는 다른 scheme 분류보다 먼저 `parseDemoDeepLink(url)`을 호출하므로, OS 경로가 곧 호출할 것과 동일한 parser가 B 입구의 첫 합류 지점이 된다.**

**[FLOW-06 / 2-B단계 → 3-B단계 — 공통 parser의 WebView caller]** — [`src/services/url-router.ts:132-148`](../src/services/url-router.ts#L132-L148)

```ts
export function classifyNavigationUrl(url: string): NavigationDecision {
  // WebView가 내부에서 만드는 빈 문서와 data/blob 문서는 허용합니다. 외부 인터넷 주소와 따로 처리합니다.
  if (
    url === "about:blank" ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return { type: "allow" };
  }

  // 일반 주소를 나누기 전에 이 앱의 deep link인지 먼저 확인해 앱 안 탭 이동으로 보냅니다.
  // [FLOW-06 / 2-B단계] 일반 WebView classifier는 다른 scheme 분류보다 먼저 app deep link parser를 호출합니다.
  const deepLink = parseDemoDeepLink(url);
  if (deepLink) {
    // [FLOW-06 / 3-B단계] parser 성공값은 `deep-link` decision으로 돌아가 DemoShell의 적용 branch와 WebView load 차단을 함께 선택합니다.
    return { type: "deep-link", value: deepLink };
  }

  // ... HTTPS, HTTP, external과 ignore 분류 생략 ...
}
```

↓ **대표 OS 경로로 돌아오면 effect가 넘긴 canonical URL은 `handleDeepLinkUrl` parameter가 된다. 이 handler도 문자열을 다시 해석하지 않고 동일한 `parseDemoDeepLink(url)` 함수에 그대로 전달한다.**

**[FLOW-06 / 7단계 — OS·popup handler 입구]** — [`src/components/DemoShell.tsx:303-308`](../src/components/DemoShell.tsx#L303-L308)

```tsx
export function DemoShell() {
  // ... applyDeepLink 선언 생략 ...

  // [역할] `handleDeepLinkUrl`은 URL을 deep link로 검사하고 성공하면 적용하며 실패하면 선택적으로 안내합니다.
  const handleDeepLinkUrl = useCallback(
    (url: string, showInvalidAlert = true): boolean => {
      // [문법] showInvalidAlert의 default 값은 true입니다. 따로 값을 주지 않으면 잘못된 deep link 안내를 보여 줍니다.
      // [FLOW-06 / 7단계] OS query 또는 popup URL을 받은 공통 handler가 문자열을 `parseDemoDeepLink`에 전달합니다.
      const deepLink = parseDemoDeepLink(url);
      // ... invalid·valid branch와 반환 생략 ...
    },
    [applyDeepLink],
  );
  // ... 나머지 handler, effect와 JSX 생략 ...
}
```

↓ **두 caller의 문자열은 같은 pure parser에서 custom scheme/Expo Go 모양, target 정수 0~3, 선택 URL의 HTTPS 조건으로 검증된다. 선택한 `target=1&url=m.nate.com`은 `{ tabIndex: 1, targetUrl: 'https://m.nate.com/' }` 형태로 정규화되어 반환된다.**

**[FLOW-06 / 8단계 — 첫 번째 공통 합류]** — [`src/services/url-router.ts:79-125`](../src/services/url-router.ts#L79-L125)

```ts
// [역할] `parseDemoDeepLink`는 custom scheme이나 Expo Go 주소에서 검사된 탭 번호와 선택 URL을 꺼냅니다.
export function parseDemoDeepLink(value: string): DemoDeepLink | null {
  // 외부 문자열이 잘못돼도 오류를 밖으로 던지지 않고 `null`을 돌려줍니다.
  try {
    // [FLOW-06 / 8단계] 공통 parser가 custom scheme과 Expo Go 모양을 읽고 target index·optional HTTPS URL을 runtime 검사합니다.
    const url = new URL(value);
    const isCustomScheme =
      url.protocol === "mywebviewapp:" && url.hostname === "webviewappdemo";
    const isExpoGo =
      (url.protocol === "exp:" || url.protocol === "exps:") &&
      url.pathname.replace(/\/$/, "").endsWith("/--/webviewappdemo");

    if (!isCustomScheme && !isExpoGo) {
      return null;
    }

    // [라이브러리] `URLSearchParams.get`은 값이 없으면 null을 돌려줘 빈 문자열과 구분할 수 있습니다.
    const targetValue = url.searchParams.get("target");
    if (targetValue === null) {
      return null;
    }

    // [문법] `Number`로 query 문자열을 숫자로 바꿉니다. 이것만으로 0~3이라고 믿지는 않습니다.
    const targetNumber = Number(targetValue);
    // 주소의 값은 원래 문자열이므로 숫자로 바꾼 뒤 정수 0~3인지 `isTabIndex`로 다시 확인합니다.
    if (!isTabIndex(targetNumber)) {
      return null;
    }

    const rawTargetUrl = url.searchParams.get("url");
    // [문법] 이동할 URL이 없으면 `null`을 유지하고, 있으면 HTTPS 주소로 바꿀 수 있는지 확인합니다.
    const targetUrl =
      rawTargetUrl === null ? null : normalizeHttpsUrl(rawTargetUrl);

    // URL이 함께 왔다면 올바른 HTTPS 주소만 허용합니다. deep link로 HTTP 차단 규칙을 피해 갈 수 없습니다.
    if (rawTargetUrl !== null && targetUrl === null) {
      return null;
    }

    return {
      tabIndex: targetNumber,
      targetUrl,
    };
  } catch {
    return null;
  }
}
```

↓ **OS caller의 handler는 non-null 결과로 `9-B`를 선택해 `applyDeepLink(deepLink)`를 동기 호출한다. 호출이 돌아오면 true를 반환한다. 이 boolean은 OS effect에서 별도로 사용하지 않지만, 같은 handler를 쓰는 popup caller에서는 close 여부가 된다.**

**[FLOW-06 / 9-B단계 → 12단계 — OS handler의 적용 호출과 반환]** — [`src/components/DemoShell.tsx:303-328`](../src/components/DemoShell.tsx#L303-L328)

```tsx
export function DemoShell() {
  // ... applyDeepLink 선언 생략 ...

  // [역할] `handleDeepLinkUrl`은 URL을 deep link로 검사하고 성공하면 적용하며 실패하면 선택적으로 안내합니다.
  const handleDeepLinkUrl = useCallback(
    (url: string, showInvalidAlert = true): boolean => {
      // [문법] showInvalidAlert의 default 값은 true입니다. 따로 값을 주지 않으면 잘못된 deep link 안내를 보여 줍니다.
      // [FLOW-06 / 7단계] OS query 또는 popup URL을 받은 공통 handler가 문자열을 `parseDemoDeepLink`에 전달합니다.
      const deepLink = parseDemoDeepLink(url);
      if (!deepLink) {
        // [FLOW-06 / 9-A단계] invalid branch는 선택적으로 Alert를 표시하고 false를 반환해 tab 변경과 popup close를 막습니다.
        // parser가 null을 돌려주면 잘못된 deep link입니다. 필요하면 Alert를 띄우고 false를 돌려 WebView 이동도 멈춥니다.
        if (showInvalidAlert) {
          Alert.alert(
            "잘못된 링크",
            "탭 번호 또는 URL 형식을 확인해 주세요.",
          );
        }
        return false;
      }

      // [FLOW-06 / 9-B단계] valid branch는 검사된 객체로 `applyDeepLink`를 호출하고 caller에 true를 반환합니다.
      applyDeepLink(deepLink);
      // [FLOW-06 / 12단계] 동기 state/ref 호출이 돌아오면 true를 OS effect·WebView policy·popup caller에 반환합니다. native refetch Promise 완료를 기다리는 값은 아닙니다.
      // true는 deep link 검사와 실제 탭 이동을 모두 마쳤다는 뜻입니다.
      return true;
    },
    [applyDeepLink],
  );
  // ... 나머지 handler, effect와 JSX 생략 ...
}
```

↓ **일반 WebView B 경로에서는 classifier의 `deep-link` decision이 `handleNavigationRequest`로 돌아온다. 이 consumer는 이미 검증된 `decision.value`를 `applyDeepLink`에 직접 넘겨 OS 경로와 두 번째로 합류하고, false를 native WebView까지 반환해 custom scheme 자체의 web load를 막는다.**

**[FLOW-06 / 13-B단계 — WebView의 공통 적용 합류]** — [`src/components/DemoShell.tsx:382-387`](../src/components/DemoShell.tsx#L382-L387)

```tsx
export function DemoShell() {
  // ... applyDeepLink와 다른 handler 생략 ...

  const handleNavigationRequest = useCallback(
    (url: string): boolean => {
      const decision = classifyNavigationUrl(url);

      switch (decision.type) {
        // ... allow, ignore와 HTTP branch 생략 ...
        case "deep-link":
          // [FLOW-03 / 7-D단계] `deep-link`는 WebView load를 false로 끝내고 검사된 값을 FLOW-06의 app 탭 이동으로 넘깁니다.
          // URL 검사기가 이미 만든 deep link 값을 그대로 탭 이동에 씁니다. 같은 문자열을 다시 검사하지 않습니다.
          applyDeepLink(decision.value);
          // [FLOW-06 / 13-B단계] 종료(WebTab): app state/ref 적용 뒤 false가 원래 WebView까지 돌아가 custom scheme의 web load를 중단합니다.
          return false;
        // ... external branch 생략 ...
      }
    },
    [applyDeepLink, openExternalUrl],
  );
  // ... 나머지 handler, effect와 JSX 생략 ...
}
```

↓ **두 입력이 공유하는 `applyDeepLink`는 검사된 `tabIndex=1`을 Zustand에 저장하고 하단 tab 표시 입력을 복구한다. `targetUrl`이 있고 Web target이므로 항상 mount되어 있던 두 번째 `WebTab` ref의 `loadUrl('https://m.nate.com/')`을 호출한다.**

**[FLOW-06 / 10단계 → 11-A단계 — 두 번째 공통 합류]** — [`src/components/DemoShell.tsx:281-301`](../src/components/DemoShell.tsx#L281-L301)

```tsx
export function DemoShell() {
  // ... state, ref와 앞선 callback 생략 ...

  // [역할] `applyDeepLink`는 검사된 탭을 선택하고 선택 URL이 있으면 이미 만든 해당 화면에서 엽니다.
  // [문법] parameter의 `{ tab, url }`은 검사를 마친 deep link 객체에서 두 값을 바로 꺼내는 구조 분해입니다. url은 없을 수도 있습니다.
  const applyDeepLink = useCallback(
    ({ tabIndex, targetUrl }: DemoDeepLink) => {
      // [FLOW-06 / 10단계] valid `DemoDeepLink`를 받은 공통 적용 함수가 Zustand tab과 scroll 표시 state를 먼저 갱신합니다.
      setSelectedTabIndex(tabIndex);
      setScrollBottomBarVisible(true);

      if (targetUrl && tabIndex < 3) {
        // [FLOW-06 / 11-A단계] Web target branch는 이미 mount된 해당 `WebTab` ref의 `loadUrl(targetUrl)`로 FLOW-03을 시작합니다.
        // [문법] `?.` optional chaining은 WebTab의 ref가 아직 준비되지 않았으면 `loadUrl`을 부르지 않고 넘어갑니다.
        webTabRefs.current[tabIndex]?.loadUrl(targetUrl);
      } else if (tabIndex === 3) {
        // [FLOW-06 / 11-B단계] native target branch는 active render로 첫 Query를 허용하고 방문 이력이 있으면 refetch Promise도 시작합니다.
        // 네이티브 탭을 처음 열면 active가 true가 되어 첫 Query 요청이 시작됩니다. 전에 열어 본 탭이면 ref 명령으로 사용자도 다시 요청합니다.
        void nativeUsersRef.current?.refetchIfActivated(true);
      }
    },
    // [문법] 이 `useCallback`은 Zustand의 `setActiveTab`을 사용합니다. 자식 ref의 최신 값은 실행할 때 `.current`에서 읽습니다.
    [setSelectedTabIndex],
  );

  // ... 나머지 deep-link handler와 JSX 생략 ...
}
```

↓ **`loadUrl` 호출은 선택 WebView에서 FLOW-03을 시작하지만 URL load 완료를 이 deep-link 함수가 await하지는 않는다. `applyDeepLink`가 동기로 돌아오면 `handleDeepLinkUrl`은 true를 반환하고, OS effect는 그 값을 사용하지 않은 채 바로 처리 완료 cleanup을 수행한다.**

**[FLOW-06 / 13-A단계] 종료** — [`src/components/DemoShell.tsx:344-349`](../src/components/DemoShell.tsx#L344-L349)

```tsx
export function DemoShell() {
  // ... query snapshot과 deep-link handler 생략 ...

  useEffect(() => {
    // ... incomingUrl 선택과 빈 query 조기 반환 생략 ...

    handleDeepLinkUrl(incomingUrl);
    // 같은 query가 다음 화면 그리기 때 또 실행되지 않도록 처리한 직후 route param을 지웁니다.
    // [FLOW-06 / 13-A단계] 종료(OS): 적용 시도 직후 query를 지워 다음 render에서 같은 OS 입력이 반복되지 않게 합니다.
    router.setParams({ demoDeepLink: undefined });
    // [문법] dependency 배열의 함수, router, query 가운데 하나가 바뀔 때만 effect가 다시 확인합니다.
  }, [demoDeepLink, handleDeepLinkUrl, router]);

  // ... 나머지 handler와 JSX 생략 ...
}
```

↓ **종료:** route query는 `undefined`로 지워져 같은 OS event의 재실행을 막고, Zustand에는 선택 tab `1`이 남는다. 두 번째 `WebTab`은 기존 instance를 유지한 채 target URL navigation을 FLOW-03에서 계속 처리한다. 일반 WebView B 경로라면 같은 적용 결과 뒤 policy false가 원래 native WebView로 돌아가 custom-scheme load만 중단한다.

### FLOW-07: Native 사용자 API, schema와 cache/refetch

```text
[시작] 항상 mount된 NativeUsersScreen
→ 1 parent active prop → 2 useUsersQuery(active) → 3 useQuery observer 등록
├─ 4-A inactive: 자동 query function 호출 안 함
├─ 4-C active commit: 방문 ref를 열어 bridge refresh 허용
└─ 4-B Query가 queryFn 자동 호출 → 5 Axios GET
   ├─ 6-A success unknown → 7 Zod parse → 8 cache/observer → 9 render → 10 result effect
   │  └─ 11-A 최초 error / 11-B 최초 success Alert
   └─ 6-B retry callback → 한 번 재요청 / 6-C retry 종료 → 8 error cache
12-A error button / 12-B tab 재선택 / 12-C pull / 12-D bridge
→ 13 공통 refetch await → 14 결과 Alert 값 구성
├─ 15-A 일반·Android 즉시 Alert
└─ 15-B iOS helper
   ├─ drag 중: 16-A 보류 → 17 onScrollEndDrag → 15-B 재진입
   └─ drag 종료: 16-B timer → 18 Alert
→ 19 최신 cache 화면에서 종료
```

request가 먼저 끝나면 `15-B → 16-A → 17 → 15-B → 16-B → 18`이고, 손을 먼저 놓으면 `17 → 15-B → 16-B → 18`이다. 이 두 순서가 같은 ref와 timer helper로 합류한다.

Source 단계 지도:

- [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx): `1`, `12-B`
- [`src/components/NativeUsersScreen.tsx`](../src/components/NativeUsersScreen.tsx): 시작, `2`, `4-C`, `9`~`11`, `12-A`·`12-C`·`12-D`, `13`~`19`
- [`src/api/users.ts`](../src/api/users.ts): `3`, `4-A`·`4-B`, `5`, `6-A`~`6-C`
- [`src/schemas/user.ts`](../src/schemas/user.ts): `7`
- [`src/query-client.ts`](../src/query-client.ts): `8`

관련 test:

- [`src/api/users.test.ts`](../src/api/users.test.ts): retry policy만 검증
- [`src/schemas/user.test.ts`](../src/schemas/user.test.ts): runtime payload 계약만 검증
- [`src/components/NativeUsersScreen.test.tsx`](../src/components/NativeUsersScreen.test.tsx): mocked Query result 소비만 검증

세 suite의 결과를 합쳐도 실제 JSONPlaceholder HTTP 성공이나 TanStack Query의 기기 network timing을 자동으로 증명하지는 않는다.

#### 실제 소스로 따라가는 FLOW-07 핵심 경로

아래 발췌는 Native tab을 처음 선택해 `active=true`가 되고 `['users']` cache가 아직 없는 상태에서 JSONPlaceholder가 올바른 사용자 배열을 반환하는 성공 경로 `시작 → 1 → 2 → 3 → 4-B → 5 → 6-A → 7 → 8 → 9 → 10 → 11-B → 19`를 따른다. inactive observer인 `4-A`, 이후 bridge refresh gate만 여는 `4-C`, retry·error인 `6-B·6-C·11-A`, 네 수동 refresh 입력과 platform별 결과 알림인 `12-A`~`18`은 위의 기존 단계 지도와 source 링크에서 별도로 확인한다. 첫 활성화라도 fresh cache가 이미 있다면 TanStack Query가 `4-B`의 새 network request를 생략할 수 있으므로, 이번 대표 경로는 앱 실행 후 cache가 비어 있는 최초 활성화를 기준으로 한다.

**[FLOW-07] 시작** — [`src/components/NativeUsersScreen.tsx:2`](../src/components/NativeUsersScreen.tsx#L2)

```tsx
// [파일 역할] 사용자 목록을 보여 주는 네이티브 탭입니다. 처음 불러오기, 다시 불러오기, 당겨서 새로 고침, 성공·실패 안내를 관리합니다.
// [FLOW-07] 시작: React가 항상 mount된 native 탭을 render하면 `active` 값으로 Query observer와 최초 request 여부를 정합니다.

// ... import, type과 UserRow 생략 ...

export const NativeUsersScreen = forwardRef<
  NativeUsersScreenHandle,
  NativeUsersScreenProps
>(function NativeUsersScreen(
  { active, bottomContentInset, onScrollDirection },
  forwardedRef,
) {
  // ... Query와 화면 출력은 다음 단계에서 이어짐 ...
});
```

↓ **사용자가 Native tab을 선택해 Zustand의 `selectedTabIndex`가 `3`이 되면 `DemoShell`이 다시 render된다. React는 component를 새로 mount하지 않고 항상 있던 `NativeUsersScreen`에 `active=true`를 새 prop snapshot으로 전달한다.**

**[FLOW-07 / 1단계]** — [`src/components/DemoShell.tsx:719-728`](../src/components/DemoShell.tsx#L719-L728)

```tsx
export function DemoShell() {
  // ... selectedTabIndex, child ref와 handler 생략 ...

  return (
    <View style={styles.container}>
      {/* ... network banner와 iOS toolbar 생략 ... */}
      <View style={styles.content}>
        {/* ... 항상 mount된 WebTab 세 개 생략 ... */}
        {/* [FLOW-07 / 1단계] DemoShell render가 항상 이 component를 만들고 선택 index를 `active` prop으로 전달합니다. */}
        <NativeUsersScreen
          active={selectedTabIndex === 3}
          bottomContentInset={bottomBarHiddenOffset}
          onScrollDirection={(direction) => {
            // [역할] native 목록 scroll callback은 현재 방향을 하단 탭의 표시 여부 boolean으로 바꿉니다.
            // [FLOW-08 / 4-B단계] active FlatList callback이 보낸 방향도 같은 scroll 표시 setter로 합류합니다.
            setScrollBottomBarVisible(direction === "up");
          }}
          ref={nativeUsersRef}
        />
      </View>
      {/* ... 하단 tab, Snackbar와 popup 생략 ... */}
    </View>
  );
}
```

↓ **React가 child function을 다시 호출하면 `active=true`가 `useUsersQuery(active)`의 argument가 된다. component는 Hook이 돌려주는 observer result를 `usersQuery`로 받아 같은 render의 상태 분기와 이후 effect에서 소비한다.**

**[FLOW-07 / 2단계]** — [`src/components/NativeUsersScreen.tsx:100-115`](../src/components/NativeUsersScreen.tsx#L100-L115)

```tsx
// [역할] `NativeUsersScreen`은 사용자 Query 상태, 다시 요청, pull-to-refresh와 목록 화면을 함께 관리합니다.
// [문법] `forwardRef<Handle, Props>`에서 첫 type은 DemoShell이 ref로 부를 명령이고, 둘째 type은 이 화면이 받을 props입니다.
export const NativeUsersScreen = forwardRef<
  NativeUsersScreenHandle,
  NativeUsersScreenProps
>(function NativeUsersScreen(
  { active, bottomContentInset, onScrollDirection },
  forwardedRef,
) {

  // ====================================== Query 상태와 ref =======================================

  // [FLOW-07 / 2단계] component render가 `useUsersQuery(active)`를 호출해 현재 active 값을 Query의 `enabled` 입력으로 전달합니다.
  // 이 값은 Query가 지금 보관 중인 사용자와 요청 상태입니다. 탭을 숨겨도 component를 없애지 않으므로 같은 Query 결과를 계속 사용합니다.
  // [역할] `useUsersQuery`는 현재 탭 활성 여부에 맞춰 사용자 요청 상태와 보관된 결과를 제공합니다.
  const usersQuery = useUsersQuery(active);

  // ... lifecycle, refetch와 JSX 생략 ...
});
```

↓ **custom Hook은 `queryKey=['users']`와 `enabled=true`를 shared QueryClient에 등록한다. cache가 비어 있으므로 TanStack Query가 observer를 pending 상태로 만들고 `queryFn({ signal })`을 자동 호출한다.**

**[FLOW-07 / 3단계 → 4-B단계]** — [`src/api/users.ts:71-89`](../src/api/users.ts#L71-L89)

```ts
// [라이브러리] 같은 `queryKey`를 쓰는 화면은 `useQuery`에 저장된 사용자 목록을 함께 봅니다.
// 화면이 잠시 사라져도 Query 저장소의 값은 바로 없어지지 않습니다.
// [역할] `useUsersQuery`는 사용자 요청 규칙을 TanStack Query에 연결하고 현재 요청 상태와 결과를 돌려줍니다.
export function useUsersQuery(
  enabled = true,
): UseQueryResult<User[], Error> {
  // [FLOW-07 / 3단계] custom Hook은 key·enabled·queryFn·staleTime·retry를 `useQuery`에 등록하고 observer result를 caller에 반환합니다.
  // [FLOW-07 / 4-A단계] `enabled=false`이면 observer와 기존 cache는 유지하지만 TanStack Query가 query function을 자동 호출하지 않습니다.
  return useQuery({
    queryKey: usersKeys.all,
    enabled,
    // [문법] `{ signal }`은 Query가 준 객체에서 취소 신호만 꺼내 `fetchUsers`에 전달합니다.
    // [역할] `queryFn` callback은 Query의 취소 신호를 실제 사용자 API 함수에 전달합니다.
    // [FLOW-07 / 4-B단계] `enabled=true`이고 fetch가 필요하면 TanStack Query가 이 `queryFn`을 자동 호출해 signal을 `fetchUsers`에 전달합니다.
    queryFn: ({ signal }) => fetchUsers(signal),
    staleTime: USERS_STALE_TIME_MS,
    retry: shouldRetryUsersRequest,
  });
}
```

↓ **TanStack Query가 만든 `AbortSignal`은 `fetchUsers(signal)` parameter로 전달된다. Axios가 HTTPS GET을 시작하고 10초 timeout 또는 signal 취소와 경쟁하며, 선택한 경로에서는 HTTP success response를 돌려준다.**

**[FLOW-07 / 5단계 → 6-A단계]** — [`src/api/users.ts:29-41`](../src/api/users.ts#L29-L41)

```ts
// [역할] `fetchUsers`는 사용자 API를 요청하고, 응답을 검사한 `User[]`만 돌려줍니다.
// [문법] `signal?`의 `?`는 이 값을 생략해도 된다는 뜻입니다. Query가 부를 때는 요청 취소 신호를 넣습니다.
export async function fetchUsers(signal?: AbortSignal): Promise<User[]> {
  // [FLOW-07 / 5단계] Query function이 이 함수를 호출하면 AbortSignal과 10초 timeout으로 Axios GET을 시작합니다.
  const response = await axios.get<unknown>(USERS_ENDPOINT, {
    signal,
    timeout: 10_000,
  });

  // HTTP 요청이 성공해도 내용이 올바르다는 보장은 없습니다. Zod 검사를 통과한 User 배열만 돌려줍니다.
  // [FLOW-07 / 6-A단계] HTTP success의 `unknown` data는 바로 쓰지 않고 `parseUsersResponse`로 보내 runtime validation을 시작합니다.
  return parseUsersResponse(response.data);
}
```

↓ **Axios response의 generic이 `unknown`이므로 HTTP 2xx만으로 화면 data가 되지 않는다. `parseUsersResponse`가 배열의 모든 항목을 Zod로 검사하고, 각 항목에서 앱 계약인 `id·name·email`만 골라 새 `User[]`를 만든다.**

**[FLOW-07 / 7단계]** — [`src/schemas/user.ts:32-45`](../src/schemas/user.ts#L32-L45)

```ts
// ... jsonPlaceholderUserSchema와 배열 schema 선언 생략 ...

// [역할] `parseUsersResponse`는 외부 응답을 검사하고 화면에서 쓸 세 field만 가진 `User[]`로 바꿉니다.
// [문법] 입력 type을 `unknown`으로 두면 검사 전에는 `input.id`처럼 값을 바로 사용할 수 없습니다.
// 외부 응답을 실수로 믿고 쓰지 않게 하는 장치입니다.
export function parseUsersResponse(input: unknown): User[] {
  // [FLOW-07 / 7단계] Zod가 배열의 모든 항목을 검사한 뒤 map이 id·name·email만 가진 `User[]`를 API 함수로 반환합니다.
  // [문법] `map` 안의 `{ id, name, email }`은 사용자 객체에서 세 값을 꺼냅니다.
  // 반환하는 `{ id, name, email }`은 같은 이름을 key와 값으로 쓰는 짧은 객체 문법입니다.
  // [역할] `map` callback은 검사를 마친 사용자 한 명에서 앱이 필요한 id, name, email만 골라냅니다.
  return jsonPlaceholderUsersSchema.parse(input).map(({ id, name, email }) => ({
    id,
    name,
    email,
  }));
}
```

↓ **검사된 `User[]`가 `fetchUsers`의 Promise, 이어서 `queryFn` Promise를 fulfill한다. 앱의 singleton QueryClient가 이를 `['users']` entry의 success data로 저장하고 그 key를 관찰 중인 `NativeUsersScreen` observer에 변경을 알린다.**

**[FLOW-07 / 8단계]** — [`src/query-client.ts:12-37`](../src/query-client.ts#L12-L37)

```ts
// [역할] `createQueryClient`는 앱이 사용할 Query 저장소와 자동 재요청 기본 규칙을 새로 만듭니다.
// [문법] `: QueryClient`는 이 함수가 언제나 QueryClient를 만들어 돌려준다고 TypeScript에 알려 줍니다.
export function createQueryClient(): QueryClient {
  // [이유] 만드는 함수를 따로 내보내면 test가 앱에서 쓰는 QueryClient와 별개의 새 저장소를 만들 수 있습니다.
  return new QueryClient({
    defaultOptions: {
      queries: {
        // [FLOW-09 / 7단계] reconnect event가 와도 이 false 정책이 Query 자동 refetch를 막아 명시적 사용자 입력을 기다립니다.
        // 사용자가 다시 시도하거나 새로 고침을 선택했을 때 요청합니다.
        refetchOnReconnect: false,
        // 모바일 앱은 웹 브라우저와 화면 활성 방식이 다르므로 window focus를 새 요청 신호로 쓰지 않습니다.
        refetchOnWindowFocus: false,
        // 모든 요청을 몰래 재시도하지 않습니다. 필요한 요청만 각 API에서 재시도 규칙을 직접 정합니다.
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// [FLOW-07 / 8단계] 성공 data 또는 error를 받은 QueryClient가 `['users']` cache를 갱신하고 observer에게 알려 component 재render를 요청합니다.
// [문법] 파일 바깥쪽의 `const`는 이 파일을 처음 가져올 때 한 번만 만들어집니다.
// 같은 앱 실행 중 이 파일을 가져오는 코드는 모두 이 QueryClient 하나를 함께 씁니다.
export const queryClient = createQueryClient();
```

↓ **observer notification은 `usersQuery` snapshot을 success data로 바꾸고 React가 component를 다시 render하게 한다. `renderContent`는 pending과 error early return을 지나 `FlatList.data=usersQuery.data`를 선택하며, 각 배열 항목은 `UserRow`의 `user` prop이 된다.**

**[FLOW-07 / 9단계]** — [`src/components/NativeUsersScreen.tsx:323-373`](../src/components/NativeUsersScreen.tsx#L323-L373)

```tsx
export const NativeUsersScreen = forwardRef<
  NativeUsersScreenHandle,
  NativeUsersScreenProps
>(function NativeUsersScreen(
  { active, bottomContentInset, onScrollDirection },
  forwardedRef,
) {
  // ... usersQuery, lifecycle와 refresh handler 생략 ...

  // [역할] `renderContent`는 Query 상태에 맞는 loading·오류·빈 목록·사용자 목록 중 하나를 만듭니다.
  const renderContent = () => {
    // [FLOW-07 / 9단계] Query observer가 알린 state로 React가 다시 render하고 pending·error·empty·list branch 하나를 선택합니다.
    // [FLOW-09 / 9-C단계] 수동 refetch 결과가 Query cache에 반영된 뒤에만 이 branch가 error 또는 새 data UI로 바뀝니다.
    // [문법] 각 early return은 해당 화면을 돌려준 뒤 함수를 바로 끝냅니다. 여러 상태 화면이 한꺼번에 겹치지 않습니다.
    if (usersQuery.isPending) {
      // ... loading early return 생략 ...
    }

    // ... error early return 생략 ...

    // [라이브러리] `FlatList`는 data의 각 사용자를 한 줄씩 보여 줍니다. 당겨서 새로 고침과 스크롤 event도 callback으로 알려 줍니다.
    // `keyExtractor`는 숫자인 사용자 id를 React가 목록 항목을 구별할 문자열 key로 바꿉니다.
    return (
      <FlatList
        data={usersQuery.data}
        // [역할] `keyExtractor` callback은 사용자 숫자 id를 React가 구별할 문자열 key로 바꿉니다.
        keyExtractor={(item) => String(item.id)}
        // [역할] `renderItem` callback은 사용자 한 명을 `UserRow` component로 바꿉니다.
        renderItem={({ item }) => <UserRow user={item} />}
        /* ... empty state, refresh와 scroll props 생략 ... */
      />
    );
  };

  // ... component return 생략 ...
});
```

↓ **success list render가 commit된 뒤 Query result dependency의 effect를 React가 자동 실행한다. 첫 active 결과이고 아직 알리지 않았으므로 ref를 먼저 true로 만들고 success branch의 완료 Alert를 한 번만 표시한다.**

**[FLOW-07 / 10단계 → 11-B단계]** — [`src/components/NativeUsersScreen.tsx:162-187`](../src/components/NativeUsersScreen.tsx#L162-L187)

```tsx
export const NativeUsersScreen = forwardRef<
  NativeUsersScreenHandle,
  NativeUsersScreenProps
>(function NativeUsersScreen(
  { active, /* ... 나머지 props 생략 ... */ },
  forwardedRef,
) {
  // ... usersQuery와 ref 선언 생략 ...

  // 첫 요청이 끝났고 탭도 보이는지 함께 확인합니다. 조건이 맞으면 첫 결과를 한 번만 Alert로 알립니다.
  // [역할] 이 `useEffect` callback은 첫 사용자 요청이 끝난 뒤 성공 또는 실패 Alert를 한 번만 보여 줍니다.
  useEffect(() => {
    // [FLOW-07 / 10단계] Query result가 바뀐 commit 뒤 이 effect가 자동 실행되어 최초 active 결과를 한 번 알릴지 검사합니다.
    if (
      !active ||
      !usersQuery.isFetched ||
      handledInitialResultRef.current
    ) {
      // 탭이 숨겨졌거나 요청 중이거나 이미 알렸다면 아무 Alert도 띄우지 않습니다.
      return;
    }

    handledInitialResultRef.current = true;

    // 탭을 처음 열어 받은 결과만 자동으로 알려 줍니다. 그다음 결과는 사용자가 다시 불러오기를 시작했을 때만 알려 줍니다.
    if (usersQuery.isError) {
      // [FLOW-07 / 11-A단계] 최초 error branch는 cache의 Error message로 실패 Alert를 표시합니다.
      // 실패했다면 Query가 정리해 둔 Error 문장을 첫 실패 Alert에 보여 줍니다.
      Alert.alert("사용자 조회 실패", usersQuery.error.message);
    } else {
      // [FLOW-07 / 11-B단계] 최초 success branch는 완료 Alert를 표시하고 같은 결과의 중복 Alert를 막습니다.
      Alert.alert("사용자 조회 완료", "사용자 목록을 불러왔습니다.");
    }
  // [문법] dependency 배열에는 이 effect가 읽는 active와 Query 상태를 모두 넣습니다. 이 가운데 값이 바뀌면 조건을 다시 확인합니다.
  }, [active, usersQuery.error, usersQuery.isError, usersQuery.isFetched]);

  // ... refresh handler와 JSX 생략 ...
});
```

↓ **Alert와 별개로 Query cache의 `User[]`는 observer에 유지된다. parent가 tab을 바꿔도 component는 unmount되지 않고 wrapper만 숨겨지므로, 화면은 같은 cache branch와 `renderContent()` 결과를 다음 명시적 refresh 또는 active 변화까지 보존한다.**

**[FLOW-07 / 19단계] 종료** — [`src/components/NativeUsersScreen.tsx:422-443`](../src/components/NativeUsersScreen.tsx#L422-L443)

```tsx
export const NativeUsersScreen = forwardRef<
  NativeUsersScreenHandle,
  NativeUsersScreenProps
>(function NativeUsersScreen(
  { active, /* ... 나머지 props 생략 ... */ },
  forwardedRef,
) {
  // ... Query observer, lifecycle와 renderContent 생략 ...

  // [역할] `NativeUsersScreen`의 return은 component를 유지한 채 active 값으로 표시·입력만 전환합니다.
  // 다른 탭으로 가도 이 component와 Query 연결을 없애지 않고 화면만 숨깁니다. 받아 둔 사용자와 방문 여부를 그대로 유지합니다.
  return (
    // [FLOW-02 / 5-B단계] React는 inactive native 탭도 unmount하지 않고 wrapper의 표시·입력·접근성만 바꿉니다.
    <View
      accessibilityElementsHidden={!active}
      importantForAccessibility={active ? "auto" : "no-hide-descendants"}
      pointerEvents={active ? "auto" : "none"}
      style={[styles.container, !active && styles.hidden]}
    >
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.headerTitle}>
          사용자 목록
        </Text>
        <Text style={styles.headerDescription}>
          JSONPlaceholder 공개 API에서 가져온 데이터입니다.
        </Text>
      </View>
      <View style={styles.content}>{renderContent()}</View>
      {/* [FLOW-07 / 19단계] 종료: 화면은 최신 Query cache branch를 표시하고 다음 명시적 refresh 또는 active 변화까지 observer를 유지합니다. */}
    </View>
  );

  // ===============================================================================================

});
```

↓ **종료:** `['users']` cache에는 runtime validation을 통과한 `User[]`와 success metadata가 남고, observer가 연결된 `NativeUsersScreen`은 `FlatList → UserRow`로 그 배열을 표시한다. network 연결 snapshot이 아니라 실제 Axios·Zod·Query 결과가 이 화면 상태를 결정한다.

### FLOW-08: Scroll·bridge·keyboard와 하단 탭

```text
[시작] 하단 탭 표시를 바꾸는 event
├─ 1-A WebView scroll / 1-B FlatList scroll → 2-A 방향 계산 → 3-A / 3-B child callback
├─ 1-C keyboard open / 2-C keyboard close
├─ 1-D tab 선택
├─ 1-E popup open / 2-E popup close
├─ 1-F iOS WebView error recovery
└─ 1-G bridge show/hide → 2-B bridge state
scroll 출력 → 4-A / 4-B parent setter
모든 입력 state → 5 AND 계산 → 6 animation effect → 7 위치·pointer input
→ 8 safe-area padding → 9 종료
```

Source 단계 지도:

- [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx): 시작, `1-C`~`1-E`, `1-G`, `2-B`·`2-C`·`2-E`, `4-A`·`4-B`, `5`~`7`, `9`
- [`src/components/WebTab.tsx`](../src/components/WebTab.tsx): `1-A`, `1-F`, `3-A`
- [`src/components/NativeUsersScreen.tsx`](../src/components/NativeUsersScreen.tsx): `1-B`, `3-B`
- [`src/utils/scroll-direction.ts`](../src/utils/scroll-direction.ts): `2-A`
- [`src/components/BottomTabBar.tsx`](../src/components/BottomTabBar.tsx): `8`

popup open/close, tab 선택, bridge show와 iOS error recovery도 scroll state를 복원할 수 있다. 단일 boolean로 합치지 않은 이유를 `DemoShell`의 각 setter caller를 검색해 확인한다.

#### 실제 소스로 따라가는 FLOW-08 핵심 경로

아래 발췌는 현재 active WebView에서 이전 offset보다 8px 이상 아래로 scroll해 하단 tab을 숨기는 대표 경로 `시작 → 1-A → 2-A → 3-A → 4-A → 5 → 6 → 7 → 8 → 9`를 따른다. Native `FlatList`의 병렬 입력 `1-B·3-B`, keyboard `1-C·2-C`, tab 선택 `1-D`, popup `1-E·2-E`, iOS error recovery `1-F`, bridge `1-G·2-B`는 위의 기존 단계 지도와 source 링크에서 별도로 확인한다. 다만 이 대체 입력들이 최종 결과에 미치는 인과관계를 놓치지 않도록 stage 5 발췌에서 `bridgeBottomBarVisible`, `scrollBottomBarVisible`, `keyboardVisible`의 실제 state 선언과 AND 합류를 모두 표시한다. 선택한 순간의 다른 입력은 bridge가 표시를 허용하고 keyboard가 닫혀 있으며 popup도 닫혀 있다고 가정한다.

**[FLOW-08] 시작** — [`src/components/DemoShell.tsx:3`](../src/components/DemoShell.tsx#L3)

```tsx
// [파일 역할] 앱의 중심 화면입니다. 네 탭, popup, bridge, deep link, 기기 뒤로 가기, 하단 탭 막대, 인터넷 연결 안내를 서로 이어 줍니다.
// [FLOW-02] 시작: `DemoShell` mount 뒤 네 탭을 모두 유지하고, 사용자의 탭 누름을 전환 또는 재선택 branch로 나눕니다.
// [FLOW-08] 시작: WebView·FlatList scroll, bridge, keyboard와 popup event가 각자 하단 탭 표시 state를 바꾸기 시작합니다.

// ... import와 file scope 상수 생략 ...

export function DemoShell() {
  // ... 하단 tab 입력 state와 child callback은 다음 단계에서 이어짐 ...
}
```

↓ **web document가 아래로 움직이면 native WebView가 scroll event를 만들고 `react-native-webview`가 `onScroll` prop을 자동 호출한다. callback은 event의 현재 y offset과 ref에 보관된 직전 offset을 `getScrollDirection`에 전달한 뒤 ref를 최신 값으로 교체한다.**

**[FLOW-08 / 1-A단계]** — [`src/components/WebTab.tsx:441-460`](../src/components/WebTab.tsx#L441-L460)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    tag,
    active,
    // ... bottomContentInset부터 onOpenWindow까지의 props 생략 ...
    onScrollDirection,
  },
  forwardedRef,
) {
  // ... state, ref, effect와 handler 생략 ...

  return (
    // active가 false여도 WebView를 없애지 않습니다. 투명하게 만들고 터치만 막아 웹 문서, 방문 기록, 입력 중인 form 값을 그대로 둡니다.
    <View
      /* ... accessibility, collapsable과 pointer props 생략 ... */
      style={[styles.container, !active && styles.inactive]}
      testID={`web-tab-${tag}`}
    >
      {/* ... progress UI 생략 ... */}
      <WebView
        /* ... 앞선 props 생략 ... */
        // [역할] `onScroll`은 스크롤 방향을 계산하고 현재 탭의 유효한 움직임만 DemoShell에 알립니다.
        onScroll={(event) => {
          // [FLOW-08 / 1-A단계] native WebView가 scroll event를 보내면 library가 이 prop을 자동 호출하고 현재 offset을 전달합니다.
          // scroll event에서 현재 세로 위치만 꺼냅니다. 직전 위치와 함께 계산 함수에 보내 움직인 방향을 구합니다.
          const currentOffset = event.nativeEvent.contentOffset.y;
          const direction = getScrollDirection(
            previousScrollOffsetRef.current,
            currentOffset,
          );
          previousScrollOffsetRef.current = currentOffset;

          // iOS에서는 오류 안내가 보이거나 다시 여는 중이면 WebView가 스스로 만든 scroll event로 봅니다.
          const ignoreIosErrorScroll =
            Platform.OS === "ios" &&
            (loadError !== null || iosErrorRecoveryRef.current);

          if (active && direction && !ignoreIosErrorScroll) {
            // [FLOW-08 / 3-A단계] helper 결과가 있고 active이며 iOS recovery가 아닐 때만 `onScrollDirection(direction)`을 호출합니다.
            onScrollDirection(direction);
          }
        }}
        /* ... 뒤의 props 생략 ... */
      />
      {/* ... error overlay 생략 ... */}
    </View>
  );
});
```

↓ **`getScrollDirection(previousOffset, currentOffset)`는 pure 함수다. 선택한 입력은 top 복귀가 아니고 delta 절댓값이 threshold 이상이며 delta가 양수이므로 `"down"`을 caller에 반환한다.**

**[FLOW-08 / 2-A단계]** — [`src/utils/scroll-direction.ts:7-29`](../src/utils/scroll-direction.ts#L7-L29)

```ts
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
```

↓ **`"down"`이 중단돼 있던 `onScroll` callback의 `direction`이 된다. 현재 tab이 active이고 iOS error recovery 중이 아니므로 guard를 통과해 parent prop `onScrollDirection("down")`을 호출한다.**

**[FLOW-08 / 3-A단계]** — [`src/components/WebTab.tsx:441-460`](../src/components/WebTab.tsx#L441-L460)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    tag,
    active,
    // ... bottomContentInset부터 onOpenWindow까지의 props 생략 ...
    onScrollDirection,
  },
  forwardedRef,
) {
  // ... state, ref, effect와 handler 생략 ...

  return (
    // active가 false여도 WebView를 없애지 않습니다. 투명하게 만들고 터치만 막아 웹 문서, 방문 기록, 입력 중인 form 값을 그대로 둡니다.
    <View
      /* ... accessibility, collapsable과 pointer props 생략 ... */
      style={[styles.container, !active && styles.inactive]}
      testID={`web-tab-${tag}`}
    >
      {/* ... progress UI 생략 ... */}
      <WebView
        /* ... 앞선 props 생략 ... */
        // [역할] `onScroll`은 스크롤 방향을 계산하고 현재 탭의 유효한 움직임만 DemoShell에 알립니다.
        onScroll={(event) => {
          // [FLOW-08 / 1-A단계] native WebView가 scroll event를 보내면 library가 이 prop을 자동 호출하고 현재 offset을 전달합니다.
          // scroll event에서 현재 세로 위치만 꺼냅니다. 직전 위치와 함께 계산 함수에 보내 움직인 방향을 구합니다.
          const currentOffset = event.nativeEvent.contentOffset.y;
          const direction = getScrollDirection(
            previousScrollOffsetRef.current,
            currentOffset,
          );
          previousScrollOffsetRef.current = currentOffset;

          // iOS에서는 오류 안내가 보이거나 다시 여는 중이면 WebView가 스스로 만든 scroll event로 봅니다.
          const ignoreIosErrorScroll =
            Platform.OS === "ios" &&
            (loadError !== null || iosErrorRecoveryRef.current);

          if (active && direction && !ignoreIosErrorScroll) {
            // [FLOW-08 / 3-A단계] helper 결과가 있고 active이며 iOS recovery가 아닐 때만 `onScrollDirection(direction)`을 호출합니다.
            onScrollDirection(direction);
          }
        }}
        /* ... 뒤의 props 생략 ... */
      />
      {/* ... error overlay 생략 ... */}
    </View>
  );
});
```

↓ **`DemoShell`이 각 WebTab을 만들 때 닫아 둔 prop closure가 `direction === "up"`을 계산한다. `"down"`은 false가 되어 `setScrollBottomBarVisible(false)` state update를 요청한다.**

**[FLOW-08 / 4-A단계]** — [`src/components/DemoShell.tsx:704-708`](../src/components/DemoShell.tsx#L704-L708)

```tsx
export function DemoShell() {
  // ... state와 handler 생략 ...

  return (
    <View style={styles.container}>
      {/* ... network banner와 iOS toolbar 생략 ... */}
      <View style={styles.content}>
        {TAB_DEFINITIONS.slice(0, 3).map((tab) => (
          <WebTab
            /* ... 앞선 props 생략 ... */
            onScrollDirection={(direction) => {
              // [역할] WebTab scroll callback은 현재 방향을 하단 탭의 표시 여부 boolean으로 바꿉니다.
              // [FLOW-08 / 4-A단계] active WebTab callback이 보낸 `up/down`을 이 setter가 scroll 표시 boolean으로 바꿉니다.
              setScrollBottomBarVisible(direction === "up");
            }}
            /* ... 뒤의 props 생략 ... */
          />
        ))}
        {/* ... NativeUsersScreen 생략 ... */}
      </View>
      {/* ... 하단 tab, Snackbar와 popup 생략 ... */}
    </View>
  );
}
```

↓ **React가 scroll state update로 `DemoShell`을 다시 render한다. bridge state는 true, scroll state는 false, keyboard state는 false이므로 세 실제 입력의 `true && false && !false`가 최종 `bottomBarVisible=false`가 된다. popup은 별도 네 번째 AND 항이 아니라 open/close 때 scroll state를 false/true로 바꾸는 caller다.**

**[FLOW-08 / 5단계]** — [`src/components/DemoShell.tsx:160-182`](../src/components/DemoShell.tsx#L160-L182)

```tsx
export function DemoShell() {
  // ... Hook과 ref 선언 생략 ...

  // bridge 요청, 스크롤, keyboard는 각각 하단 탭 막대를 숨길 수 있으므로 state를 따로 둡니다. 한 이유가 다른 이유의 값을 덮어쓰지 않습니다.
  // 이 state가 바뀌면 막대의 위치와 터치 가능 여부를 다시 그립니다.
  // [역할] `bridgeBottomBarVisible` state는 WebView bridge가 요청한 하단 탭 표시 여부를 보관합니다.
  const [bridgeBottomBarVisible, setBridgeBottomBarVisible] = useState(true);
  // [역할] `scrollBottomBarVisible` state는 현재 화면 스크롤과 popup 상태가 허용한 하단 탭 표시 여부를 보관합니다.
  const [scrollBottomBarVisible, setScrollBottomBarVisible] = useState(true);
  // [역할] `keyboardVisible` state는 keyboard가 열려 하단 탭을 잠시 숨겨야 하는지 보관합니다.
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // popupUrl이 null이면 popup을 닫고, snackbarMessage가 null이면 iOS Snackbar를 보여 주지 않습니다.
  // 두 화면은 서로 따로 열리고 닫힙니다.
  // [역할] `popupUrl` state는 popup을 닫을 `null` 또는 현재 popup에서 열 URL을 보관합니다.
  const [popupUrl, setPopupUrl] = useState<string | null>(null);
  // [역할] `snackbarMessage` state는 iOS Snackbar에 보여 줄 bridge 안내 또는 숨김 상태의 `null`을 보관합니다.
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  // [FLOW-08 / 5단계] 어느 입력 state든 바뀌어 React가 다시 render하면 세 조건을 AND로 합쳐 최종 표시 여부를 계산합니다.
  // [문법] `&&`와 `!`로 기존 state 세 개를 합쳐 계산합니다. 같은 뜻의 state를 하나 더 만들지 않습니다.
  // [역할] `bottomBarVisible`은 세 숨김 이유를 합쳐 지금 하단 탭을 보여 줄 수 있는지 계산합니다.
  const bottomBarVisible =
    bridgeBottomBarVisible && scrollBottomBarVisible && !keyboardVisible;
  // 탭 막대 자체 높이에 휴대폰 아래 안전 여백을 더합니다. 이 값은 막대를 숨길 이동 거리이면서 자식 화면이 비워 둘 아래 여백입니다.
  // [역할] `bottomBarHiddenOffset`은 하단 탭 전체를 숨길 거리와 자식 화면이 비워 둘 높이를 계산합니다.
  const bottomBarHiddenOffset = BOTTOM_TAB_BASE_HEIGHT + insets.bottom;

  // ... network 계산, effect와 JSX 생략 ...
}
```

↓ **이 render가 commit된 뒤 React가 `bottomBarVisible` dependency의 effect를 자동 실행한다. false는 `toValue=bottomBarHiddenOffset`으로 바뀌고, 같은 `Animated.Value`를 180ms 동안 native driver에서 아래로 이동시킨다.**

**[FLOW-08 / 6단계]** — [`src/components/DemoShell.tsx:196-211`](../src/components/DemoShell.tsx#L196-L211)

```tsx
export function DemoShell() {
  // ... bottomBarVisible, bottomBarHiddenOffset와 Animated.Value 준비 생략 ...

  // [라이브러리] `useEffect`는 표시 여부나 높이가 바뀌면 하단 탭 막대 animation을 시작합니다.
  // [역할] 이 `useEffect` callback은 하단 탭 표시 여부와 높이에 맞는 새 animation을 시작합니다.
  useEffect(() => {
    // [FLOW-08 / 6단계] React commit 뒤 이 effect가 자동 실행되어 최종 boolean을 0 또는 전체 높이의 animation 목표값으로 바꿉니다.
    // `Animated.timing(...).start()`는 현재 위치에서 새 위치까지 180ms 동안 움직입니다.
    Animated.timing(bottomBarTranslateY, {
      toValue: bottomBarVisible ? 0 : bottomBarHiddenOffset,
      duration: 180,
      useNativeDriver: true,
    }).start();
    // [문법] dependency 배열의 세 값 가운데 하나가 바뀌면 같은 `Animated.Value`에 새 위치를 적용합니다.
  }, [
    bottomBarHiddenOffset,
    bottomBarTranslateY,
    bottomBarVisible,
  ]);

  // ... 다른 effect와 JSX 생략 ...
}
```

↓ **같은 false는 animation과 별도로 render된 wrapper의 `pointerEvents="none"`을 즉시 선택한다. 따라서 막대가 내려가는 도중에도 보이지 않는 tab이 touch를 받지 않으며, `translateY`는 effect가 갱신하는 같은 `bottomBarTranslateY`를 읽는다.**

**[FLOW-08 / 7단계]** — [`src/components/DemoShell.tsx:732-748`](../src/components/DemoShell.tsx#L732-L748)

```tsx
export function DemoShell() {
  // ... state, ref, handler와 effect 생략 ...

  return (
    <View style={styles.container}>
      {/* ... network banner, iOS toolbar와 네 child 화면 생략 ... */}
      {/* [라이브러리]
          `Animated.View`를 투명하게만 만드는 대신 화면 아래로 옮깁니다.
          숨긴 동안에는 pointerEvents도 막아 보이지 않는 막대가 터치를 받지 않게 합니다. */}
      {/* [FLOW-08 / 7단계] animation 값은 native driver가 막대를 이동시키고 같은 boolean이 숨은 막대의 pointer input도 차단합니다. */}
      <Animated.View
        pointerEvents={bottomBarVisible ? "auto" : "none"}
        style={[
          styles.bottomBar,
          { transform: [{ translateY: bottomBarTranslateY }] },
        ]}
      >
        <BottomTabBar
          onSelect={handleTabSelect}
          selectedIndex={selectedTabIndex}
        />
        {/* [FLOW-08 / 9단계] 종료: bar 위치·pointer input과 child bottom inset이 같은 safe-area 포함 높이로 안정됩니다. */}
      </Animated.View>
      {/* ... iOS Snackbar와 PopupWebView 생략 ... */}
    </View>
  );
}
```

↓ **wrapper 안의 `BottomTabBar`도 같은 safe-area context snapshot을 읽는다. `insets.bottom`을 실제 container padding에 적용하므로, DemoShell이 계산한 `60 + insets.bottom` 숨김 거리와 화면에 그려진 bar 전체 높이가 일치한다.**

**[FLOW-08 / 8단계]** — [`src/components/BottomTabBar.tsx:31-49`](../src/components/BottomTabBar.tsx#L31-L49)

```tsx
// [역할] `BottomTabBar`는 탭 정의 네 개를 버튼으로 보여 주고 선택한 번호를 부모 화면에 알립니다.
// [문법] 함수 입력의 `{ selectedIndex, onSelect }`는 props 객체에서 두 값을 바로 꺼내는 구조 분해입니다.
export function BottomTabBar({
  selectedIndex,
  onSelect,
}: BottomTabBarProps) {
  // [라이브러리] `useSafeAreaInsets`는 현재 기기의 안전 여백을 읽습니다. 회전하면 새 여백으로 화면을 다시 그립니다.
  // [역할] `useSafeAreaInsets`는 현재 기기의 아래 안전 여백을 하단 탭 높이 계산에 제공합니다.
  const insets = useSafeAreaInsets();

  // --------------------------------------- 탭 버튼 만들기 ----------------------------------------

  // [FLOW-08 / 8단계] `BottomTabBar`는 같은 safe-area bottom을 실제 padding으로 적용해 animation 거리와 보이는 높이를 맞춥니다.
  // DemoShell은 내용 높이와 이 여백을 더해 바를 숨길 거리와 화면 아래 여백을 계산합니다.
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      {/* ... 네 tab Pressable 생략 ... */}
    </View>
  );
}
```

↓ **`bottomBarHiddenOffset`은 막대에만 쓰이지 않고 항상 mount된 WebTab 세 개와 Native screen의 `bottomContentInset` prop으로도 전달된다. bar가 숨거나 다시 나타나도 각 child의 loading·error·list content는 동일한 safe-area 포함 높이를 아래 여백 계약으로 유지한다.**

**[FLOW-08 / 9단계] 종료** — [`src/components/DemoShell.tsx:681-747`](../src/components/DemoShell.tsx#L681-L747)

```tsx
export function DemoShell() {
  // ... state, 계산값, ref, handler와 effect 생략 ...

  return (
    <View style={styles.container}>
      {/* ... network banner와 iOS toolbar 생략 ... */}
      <View style={styles.content}>
        {TAB_DEFINITIONS.slice(0, 3).map((tab) => (
          <WebTab
            active={selectedTabIndex === tab.index}
            bottomContentInset={bottomBarHiddenOffset}
            /* ... initialSource, key, callback, ref와 tag props 생략 ... */
          />
        ))}

        {/* [FLOW-07 / 1단계] DemoShell render가 항상 이 component를 만들고 선택 index를 `active` prop으로 전달합니다. */}
        <NativeUsersScreen
          active={selectedTabIndex === 3}
          bottomContentInset={bottomBarHiddenOffset}
          /* ... callback과 ref props 생략 ... */
        />
      </View>

      {/* [라이브러리]
          `Animated.View`를 투명하게만 만드는 대신 화면 아래로 옮깁니다.
          숨긴 동안에는 pointerEvents도 막아 보이지 않는 막대가 터치를 받지 않게 합니다. */}
      {/* [FLOW-08 / 7단계] animation 값은 native driver가 막대를 이동시키고 같은 boolean이 숨은 막대의 pointer input도 차단합니다. */}
      <Animated.View
        pointerEvents={bottomBarVisible ? "auto" : "none"}
        style={[
          styles.bottomBar,
          { transform: [{ translateY: bottomBarTranslateY }] },
        ]}
      >
        <BottomTabBar
          onSelect={handleTabSelect}
          selectedIndex={selectedTabIndex}
        />
        {/* [FLOW-08 / 9단계] 종료: bar 위치·pointer input과 child bottom inset이 같은 safe-area 포함 높이로 안정됩니다. */}
      </Animated.View>
      {/* ... iOS Snackbar와 PopupWebView 생략 ... */}
    </View>
  );
}
```

↓ **종료:** 아래 방향 scroll의 결과로 `scrollBottomBarVisible=false`, `bottomBarVisible=false`, wrapper `pointerEvents="none"`, animation 목표값 `60 + insets.bottom`이 일관되게 남는다. child content도 같은 `bottomContentInset`을 유지하며, 이후 위 방향 scroll·tab 선택·popup close·bridge show처럼 scroll state를 복구하는 입력이 오면 동일한 AND 계산으로 다시 표시 여부를 판단한다.

### FLOW-09: Network 표시와 수동 복구

```text
[시작] useNetworkState 구독 → 1 현재 snapshot → 2 변경 시 자동 render → 3 offline 계산
→ 4 root·popup banner prop
├─ 5-A confirmed offline banner mount
└─ 5-B online/UNKNOWN banner unmount
WebView·popup·Query request 오류는 별도로 6-A / 6-B / 6-C에 남음
→ 7 reconnect 자동 Query refetch 차단
→ 8-A / 8-B / 8-C 사용자 retry
→ 9-A / 9-B / 9-C 실제 request callback·cache만 결과 갱신
→ 10 종료
```

Source 단계 지도:

- [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx): 시작, `1`~`4`, `10`
- [`src/components/NetworkStatusBanner.tsx`](../src/components/NetworkStatusBanner.tsx): `5-A`, `5-B`
- [`src/components/WebTab.tsx`](../src/components/WebTab.tsx): `6-A`, `8-A`, `9-A`
- [`src/components/PopupWebView.tsx`](../src/components/PopupWebView.tsx): `6-B`, `8-B`, `9-B`
- [`src/components/NativeUsersScreen.tsx`](../src/components/NativeUsersScreen.tsx): `6-C`, `8-C`, `9-C`
- [`src/query-client.ts`](../src/query-client.ts): `7`

이 세 component와 banner 단계를 함께 읽으면 다음 세 상태가 독립적임을 확인할 수 있다.

- OS가 보고한 연결 상태
- WebView request 오류 state
- TanStack Query 오류 state

network banner가 사라지는 것은 기존 request 성공이나 자동 recovery의 증거가 아니다.

#### 실제 소스로 따라가는 FLOW-09 핵심 경로

아래 발췌는 active WebView request가 연결 단절 중 실패해 자체 오류 화면을 보유하고, OS snapshot으로 offline banner가 표시된 뒤 연결이 돌아와도 자동 reload하지 않으며 사용자가 `다시 시도`를 눌러 native success callback으로 복구를 확인하는 대표 경로 `시작 → 1 → 2 → 3 → 4 → 5-A → 6-A → 5-B·7 → 8-A → 9-A → 10`을 따른다. popup의 병렬 상태 `6-B·8-B·9-B`와 Native Query의 `6-C·8-C·9-C`는 위의 기존 단계 지도와 source 링크에서 별도로 확인한다. OS snapshot 변경과 WebView request failure는 서로를 호출하는 단일 직렬 chain이 아니므로 실제 도착 순서는 고정하지 않고, 두 독립 상태가 화면에서 동시에 관찰되는 지점부터 수동 복구를 연결한다.

**[FLOW-09] 시작** — [`src/components/DemoShell.tsx:4`](../src/components/DemoShell.tsx#L4)

```tsx
// [파일 역할] 앱의 중심 화면입니다. 네 탭, popup, bridge, deep link, 기기 뒤로 가기, 하단 탭 막대, 인터넷 연결 안내를 서로 이어 줍니다.
// [FLOW-02] 시작: `DemoShell` mount 뒤 네 탭을 모두 유지하고, 사용자의 탭 누름을 전환 또는 재선택 branch로 나눕니다.
// [FLOW-08] 시작: WebView·FlatList scroll, bridge, keyboard와 popup event가 각자 하단 탭 표시 state를 바꾸기 시작합니다.
// [FLOW-09] 시작: `useNetworkState`가 OS 연결 상태를 구독하되 WebView·Query request 결과와는 별도 흐름으로 관리합니다.

// ... import와 file scope 상수 생략 ...

export function DemoShell() {
  // ... network snapshot과 child request state의 연결은 다음 단계에서 이어짐 ...
}
```

↓ **`DemoShell` render가 Expo Network Hook을 호출하면 library가 OS 연결 상태 구독을 만들고 현재 snapshot을 반환한다. 이후 OS snapshot이 바뀌면 Hook이 subscriber update를 보내 같은 component를 자동으로 다시 render한다.**

**[FLOW-09 / 1단계 → 2단계]** — [`src/components/DemoShell.tsx:115-119`](../src/components/DemoShell.tsx#L115-L119)

```tsx
export function DemoShell() {
  // ... 앞선 Hook 생략 ...

  // [FLOW-09 / 1단계] `DemoShell` render가 `useNetworkState`를 호출하면 Expo가 연결 상태 구독을 만들고 현재 snapshot을 반환합니다.
  // [라이브러리] 화면이 사라지면 연결 감시는 library가 정리합니다. 이 값은 인터넷 연결 여부일 뿐, 각 웹·API 요청의 성공을 뜻하지 않습니다.
  // [역할] `useNetworkState`는 휴대폰의 현재 연결 종류를 계속 알려 줘 공통 offline 안내에 사용하게 합니다.
  const networkState = Network.useNetworkState();
  // [FLOW-09 / 2단계] OS 연결 snapshot이 바뀌면 Hook이 구독 중인 `DemoShell`을 다시 render해 아래 offline 계산을 반복합니다.

  // ... 다른 Hook, state와 JSX 생략 ...
}
```

↓ **선택한 offline snapshot의 `type`이 명확히 `NetworkStateType.NONE`이므로 render 중 파생값 `networkOffline=true`가 된다. 초기 `UNKNOWN`은 offline으로 단정하지 않으며 false다.**

**[FLOW-09 / 3단계]** — [`src/components/DemoShell.tsx:183-186`](../src/components/DemoShell.tsx#L183-L186)

```tsx
export function DemoShell() {
  // ... networkState와 다른 계산값 생략 ...

  // [FLOW-09 / 3단계] Hook snapshot의 `type`이 명확히 `NONE`인 경우만 offline으로 바꾸고 `UNKNOWN`은 false로 둡니다.
  // [역할] `networkOffline`은 확인된 연결 종류가 `NONE`인지 공통 배너용 boolean으로 바꿉니다.
  const networkOffline =
    networkState.type === Network.NetworkStateType.NONE;

  // ... effect, handler와 JSX 생략 ...
}
```

↓ **React는 이 boolean을 root `NetworkStatusBanner.visible`과 popup의 `networkOffline` prop에 전달한다. 이 prop 전달은 WebTab의 `loadError`나 Query cache를 쓰거나 지우지 않는다.**

**[FLOW-09 / 4단계]** — [`src/components/DemoShell.tsx:626-631`](../src/components/DemoShell.tsx#L626-L631), [`src/components/DemoShell.tsx:758-760`](../src/components/DemoShell.tsx#L758-L760)

```tsx
export function DemoShell() {
  // ... state와 handler 생략 ...

  // [역할] `DemoShell`의 return은 네 탭, 공통 network 안내, 하단 탭, Snackbar와 popup을 한 화면에 배치합니다.
  // 네 탭 화면, 하단 탭 막대, iOS Snackbar, popup을 함께 만듭니다. state와 active props로 보이거나 숨기는 시점을 정합니다.
  return (
    <View style={styles.container}>
      {/* [FLOW-09 / 4단계] 계산한 boolean을 root banner와 popup banner에 전달하되 child request state는 덮어쓰지 않습니다. */}
      <NetworkStatusBanner visible={networkOffline} />

      {/* ... toolbar, 네 child 화면, 하단 tab과 Snackbar 생략 ... */}

      <PopupWebView
        classifyNavigation={classifyNavigationUrl}
        networkOffline={networkOffline}
        /* ... 나머지 popup props 생략 ... */
      />
    </View>
  );
}
```

↓ **`visible=true`를 받은 banner component는 offline branch를 선택해 접근성 alert를 mount한다. 이 component는 `visible` 이외의 request state를 받지 않으므로 WebView/API 성공 여부를 판단할 수 없다.**

**[FLOW-09 / 5-A단계]** — [`src/components/NetworkStatusBanner.tsx:21-47`](../src/components/NetworkStatusBanner.tsx#L21-L47)

```tsx
// [역할] `NetworkStatusBanner`는 offline일 때만 연결 안내를 접근성 alert와 함께 보여 줍니다.
export function NetworkStatusBanner({
  visible,
}: NetworkStatusBannerProps) {
  // [문법] 보일 필요가 없으면 `null`을 return합니다. 이때 React는 안내 View를 만들지 않습니다.
  if (!visible) {
    // [FLOW-09 / 5-B단계] online 또는 UNKNOWN branch는 `null`을 반환해 banner만 unmount하고 기존 request 결과는 유지합니다.
    return null;
  }

  // [FLOW-09 / 5-A단계] confirmed offline branch는 accessibility alert banner를 mount하지만 개별 request 성공 여부는 판단하지 않습니다.
  // [라이브러리] `accessibilityLiveRegion="polite"`와 alert role은 새 안내를 화면 읽기 도구가 읽게 합니다.
  return (
    <View
      accessible
      accessibilityLabel="네트워크 연결 없음"
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={styles.container}
    >
      <Ionicons color="#9A3412" name="cloud-offline-outline" size={19} />
      <Text style={styles.message}>
        네트워크에 연결되어 있지 않습니다.
      </Text>
    </View>
  );
}
```

↓ **이와 독립적으로 native WebView request가 실패하면 `react-native-webview`가 `onError`를 자동 호출한다. callback은 기본 error UI를 막고 이 WebTab 소유의 `loadError` state를 만든다. banner의 boolean은 이 handler의 입력도, 이 state의 대체값도 아니다.**

**[FLOW-09 / 6-A단계]** — [`src/components/WebTab.tsx:467-478`](../src/components/WebTab.tsx#L467-L478)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    tag,
    active,
    // ... 나머지 props 생략 ...
  },
  forwardedRef,
) {
  // ... state, ref, effect와 handler 생략 ...

  return (
    // active가 false여도 WebView를 없애지 않습니다. 투명하게 만들고 터치만 막아 웹 문서, 방문 기록, 입력 중인 form 값을 그대로 둡니다.
    <View
      /* ... accessibility, collapsable과 pointer props 생략 ... */
      style={[styles.container, !active && styles.inactive]}
      testID={`web-tab-${tag}`}
    >
      {/* ... progress UI 생략 ... */}
      <WebView
        /* ... load와 navigation props 생략 ... */
        // [역할] `onError`는 WebView가 URL을 열지 못한 내용을 앱 오류 화면에 저장합니다.
        onError={(event) => {
          // [FLOW-03 / 10-B단계] native load 실패 시 library가 이 callback을 호출하고, 기본 error UI를 막은 뒤 app error state를 만듭니다.
          // [FLOW-08 / 1-F단계] iOS 오류 branch는 recovery ref를 켜고 active 탭의 `onScrollDirection("up")`도 호출해 하단 탭을 복구합니다.
          // [FLOW-09 / 6-A단계] 이 `loadError`는 network banner와 별개인 실제 WebView request 결과로 이 탭에 남습니다.
          event.preventDefault();
          preserveBottomBarDuringIosErrorRecovery();
          setLoadError({
            title: "웹 페이지를 열 수 없습니다.",
            description: event.nativeEvent.description,
          });
        }}
        /* ... 뒤의 props 생략 ... */
      />
      {/* ... error overlay 생략 ... */}
    </View>
  );
});
```

↓ **이후 OS snapshot이 online type으로 바뀌면 stage 2 render와 stage 3 계산이 반복되어 `networkOffline=false`가 된다. banner는 null을 반환해 unmount되지만, 별도 `WebTab.loadError`는 그대로이므로 오류 overlay와 `다시 시도` button은 남는다.**

**[FLOW-09 / 5-B단계]** — [`src/components/NetworkStatusBanner.tsx:21-29`](../src/components/NetworkStatusBanner.tsx#L21-L29)

```tsx
// [역할] `NetworkStatusBanner`는 offline일 때만 연결 안내를 접근성 alert와 함께 보여 줍니다.
export function NetworkStatusBanner({
  visible,
}: NetworkStatusBannerProps) {
  // [문법] 보일 필요가 없으면 `null`을 return합니다. 이때 React는 안내 View를 만들지 않습니다.
  if (!visible) {
    // [FLOW-09 / 5-B단계] online 또는 UNKNOWN branch는 `null`을 반환해 banner만 unmount하고 기존 request 결과는 유지합니다.
    return null;
  }

  // ... confirmed offline banner branch 생략 ...
}
```

↓ **Native API 쪽도 같은 책임 경계를 유지한다. QueryClient의 app-wide policy가 `refetchOnReconnect=false`이므로 reconnect event만으로 `['users']` query function을 자동 호출하지 않고, 기존 data/error cache가 명시적 사용자 입력을 기다린다.**

**[FLOW-09 / 7단계]** — [`src/query-client.ts:12-32`](../src/query-client.ts#L12-L32)

```ts
// [역할] `createQueryClient`는 앱이 사용할 Query 저장소와 자동 재요청 기본 규칙을 새로 만듭니다.
// [문법] `: QueryClient`는 이 함수가 언제나 QueryClient를 만들어 돌려준다고 TypeScript에 알려 줍니다.
export function createQueryClient(): QueryClient {
  // [이유] 만드는 함수를 따로 내보내면 test가 앱에서 쓰는 QueryClient와 별개의 새 저장소를 만들 수 있습니다.
  return new QueryClient({
    defaultOptions: {
      queries: {
        // [FLOW-09 / 7단계] reconnect event가 와도 이 false 정책이 Query 자동 refetch를 막아 명시적 사용자 입력을 기다립니다.
        // 사용자가 다시 시도하거나 새로 고침을 선택했을 때 요청합니다.
        refetchOnReconnect: false,
        // 모바일 앱은 웹 브라우저와 화면 활성 방식이 다르므로 window focus를 새 요청 신호로 쓰지 않습니다.
        refetchOnWindowFocus: false,
        // 모든 요청을 몰래 재시도하지 않습니다. 필요한 요청만 각 API에서 재시도 규칙을 직접 정합니다.
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
```

↓ **대표 WebView 복구는 사용자가 오류 overlay의 `다시 시도`를 누를 때만 시작한다. React Native가 `Pressable.onPress`를 호출하면 callback이 iOS recovery guard를 준비하고 오류 overlay state를 우선 지운 뒤 현재 native WebView의 `reload()` 명령을 실행한다.**

**[FLOW-09 / 8-A단계]** — [`src/components/WebTab.tsx:493-530`](../src/components/WebTab.tsx#L493-L530)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    tag,
    active,
    // ... 나머지 props 생략 ...
  },
  forwardedRef,
) {
  // ... state, ref, effect와 handler 생략 ...

  return (
    // active가 false여도 WebView를 없애지 않습니다. 투명하게 만들고 터치만 막아 웹 문서, 방문 기록, 입력 중인 form 값을 그대로 둡니다.
    <View
      /* ... accessibility, collapsable과 pointer props 생략 ... */
      style={[styles.container, !active && styles.inactive]}
      testID={`web-tab-${tag}`}
    >
      {/* ... progress UI 생략 ... */}
      {/* ... WebView 생략 ... */}
      {/* [FLOW-03 / 13-A단계] 종료(성공): finish callback 뒤 `loadError`가 없으면 준비된 document와 최신 history ref를 유지합니다. */}
      {/* [FLOW-02 / 11-B단계] 종료(Web 재선택): 새 WebView mount 뒤의 실제 page lifecycle은 FLOW-03에 넘깁니다. */}
      {loadError ? (
        <View
          accessibilityRole="alert"
          style={[styles.errorOverlay, centeredContentInsetStyle]}
        >
          <Text style={styles.errorTitle}>{loadError.title}</Text>
          <Text style={styles.errorDescription}>{loadError.description}</Text>
          <View style={styles.errorActions}>
            {/* [FLOW-03 / 13-B단계] 종료(실패 대기): React가 error overlay를 보여 주고 사용자의 retry 또는 초기화 입력을 기다립니다.
                다시 시도는 실패한 현재 URL을 다시 엽니다.
                초기 화면은 방문 기록을 버리고 이 탭의 첫 source부터 새로 엽니다. */}
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                // [역할] 다시 시도 callback은 오류를 지우고 현재 WebView URL을 다시 불러옵니다.
                // [FLOW-03 / 14-A단계] 사용자가 `다시 시도`를 누르면 error를 지우고 native `reload()`를 호출해 load callback 흐름으로 되돌아갑니다.
                // [FLOW-09 / 8-A단계] 연결 복구만으로는 실행되지 않으며 이 명시적 press가 현재 URL request를 다시 시작합니다.
                preserveBottomBarDuringIosErrorRecovery();
                setLoadError(null);
                webViewRef.current?.reload();
              }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>다시 시도</Text>
            </Pressable>
            {/* ... 초기 화면 button 생략 ... */}
          </View>
        </View>
      ) : null}
    </View>
  );
});
```

↓ **`reload()`가 새 native request를 시작하면 FLOW-03의 load callbacks가 다시 실행된다. 선택한 성공 경로에서는 `onLoadStart`와 progress event 뒤 `onLoad`가 도착해 실제 document 성공을 확인하고, `onLoadEnd`가 document 준비 ref와 progress를 완료한다. banner가 사라진 시점에는 이 callback들이 실행되지 않았다.**

**[FLOW-09 / 9-A단계]** — [`src/components/WebTab.tsx:370-398`](../src/components/WebTab.tsx#L370-L398)

```tsx
export const WebTab = forwardRef<WebTabHandle, WebTabProps>(function WebTab(
  {
    tag,
    active,
    // ... 나머지 props 생략 ...
  },
  forwardedRef,
) {
  // ... state, ref, effect와 handler 생략 ...

  return (
    // active가 false여도 WebView를 없애지 않습니다. 투명하게 만들고 터치만 막아 웹 문서, 방문 기록, 입력 중인 form 값을 그대로 둡니다.
    <View
      /* ... accessibility, collapsable과 pointer props 생략 ... */
      style={[styles.container, !active && styles.inactive]}
      testID={`web-tab-${tag}`}
    >
      {/* ... progress UI 생략 ... */}
      <WebView
        /* ... 앞선 props 생략 ... */
        // [역할] `onLoadStart`는 새 URL을 열기 시작할 때 진행률을 처음 값으로 되돌립니다.
        onLoadStart={() => {
          // [FLOW-03 / 8단계] 허용된 load가 시작되면 native event를 받은 library가 이 prop을 자동 호출하고 progress를 0으로 돌립니다.
          // 새 주소를 열기 시작하면 이전 진행률을 0으로 되돌립니다.
          setProgress(0);
        }}
        // [역할] `onLoadProgress`는 WebView가 알려 준 진행률을 화면 state에 저장합니다.
        onLoadProgress={(event) => {
          // [FLOW-03 / 9-B단계] load 중 native progress event마다 이 callback이 반복 호출되어 표시줄 state를 0~1 값으로 갱신합니다.
          // WebView가 보내는 0부터 1 사이 진행률을 state에 넣어 위 표시줄의 너비를 바꿉니다.
          setProgress(event.nativeEvent.progress);
        }}
        // [역할] `onLoad`는 iOS에서 새 문서가 실제로 열리면 임시 scroll 차단을 해제합니다.
        onLoad={() => {
          // [FLOW-03 / 10-A단계] native load 성공 시 library가 먼저 `onLoad`를 호출해 iOS error-recovery scroll 차단을 해제합니다.
          // [FLOW-09 / 9-A단계] 수동 retry 뒤 이 success callback이 와야 WebView recovery가 실제로 확인되며 banner 변화만으로는 실행되지 않습니다.
          // [라이브러리] iOS에서 `onLoad`가 오면 새 웹 문서가 실제로 열렸다는 뜻입니다. 이때 임시로 무시하던 scroll event를 다시 받습니다.
          if (Platform.OS === "ios") {
            iosErrorRecoveryRef.current = false;
          }
        }}
        // [역할] `onLoadEnd`는 첫 문서가 준비됐다고 기록하고 진행률을 완료 값으로 바꿉니다.
        onLoadEnd={() => {
          // [FLOW-03 / 11-A단계] 성공 path에서는 같은 finish event의 다음 callback인 `onLoadEnd`가 document 준비 ref와 progress를 완료합니다.
          // [FLOW-03 / 11-B단계] 일반 load 실패 path에서도 library가 `onError` 다음에 이 callback을 호출하므로 같은 완료값을 기록합니다.
          // 첫 문서를 다 연 뒤부터 `loadUrl`은 source를 새로 만들지 않습니다. 현재 WebView 안에서 이동해 방문 기록을 이어 갑니다.
          hasLoadedDocumentRef.current = true;
          setProgress(1);
        }}
        /* ... 뒤의 props 생략 ... */
      />
      {/* ... error overlay 생략 ... */}
    </View>
  );
});
```

↓ **native success 뒤 WebTab은 `loadError=null`인 document 화면과 완료 progress를 유지한다. `DemoShell`의 network boolean, 각 WebView/popup local state, TanStack Query cache는 서로를 덮어쓰지 않은 채 각 최신 event 결과로 남는다.**

**[FLOW-09 / 10단계] 종료** — [`src/components/DemoShell.tsx:626-631`](../src/components/DemoShell.tsx#L626-L631), [`src/components/DemoShell.tsx:758-775`](../src/components/DemoShell.tsx#L758-L775)

```tsx
export function DemoShell() {
  // ... networkOffline, child state와 handler 생략 ...

  // [역할] `DemoShell`의 return은 네 탭, 공통 network 안내, 하단 탭, Snackbar와 popup을 한 화면에 배치합니다.
  // 네 탭 화면, 하단 탭 막대, iOS Snackbar, popup을 함께 만듭니다. state와 active props로 보이거나 숨기는 시점을 정합니다.
  return (
    <View style={styles.container}>
      {/* [FLOW-09 / 4단계] 계산한 boolean을 root banner와 popup banner에 전달하되 child request state는 덮어쓰지 않습니다. */}
      <NetworkStatusBanner visible={networkOffline} />

      {/* ... 항상 유지되는 WebTab·Native screen과 공통 UI 생략 ... */}

      <PopupWebView
        classifyNavigation={classifyNavigationUrl}
        networkOffline={networkOffline}
        onClose={closePopup}
        onDeepLink={(url) => {
          // ... popup deep-link branch 생략 ...
        }}
        ref={popupRef}
        url={popupUrl}
      />
      {/* [FLOW-09 / 10단계] 종료: banner visibility와 각 WebView·Query 결과가 서로 독립된 최신 상태로 남아 다음 event를 기다립니다. */}
      {/* [FLOW-04 / 18단계] 종료: `popupUrl=null` render가 Modal을 숨기고 PopupWebView effect가 session state를 닫힘 값으로 초기화합니다. */}
    </View>
  );
}
```

↓ **종료:** 현재 OS snapshot이 online이면 banner만 사라지고, 대표 WebView는 사용자의 retry 뒤 native `onLoad`가 실제로 도착했기 때문에 성공 document로 복구된다. Native Query가 과거 error였다면 이 WebView 성공과 무관하게 cache error를 계속 유지하며, 사용자가 해당 화면의 명시적 retry/refetch를 실행해야만 `9-C` 결과로 바뀐다.

## 3. Production source 파일 지도

### `app/`

| 파일 | 읽을 책임 |
|---|---|
| [`app/_layout.tsx`](../app/_layout.tsx) | Root Query provider와 Stack |
| [`app/index.tsx`](../app/index.tsx) | hydration loading과 shell 진입 |
| [`app/+native-intent.tsx`](../app/+native-intent.tsx) | system URL rewrite hook |

### `src/components/`

| 파일 | 읽을 책임 |
|---|---|
| [`DemoShell.tsx`](../src/components/DemoShell.tsx) | 전체 orchestration, platform back, child refs |
| [`WebTab.tsx`](../src/components/WebTab.tsx) | 일반 WebView document/history/error/bridge |
| [`PopupWebView.tsx`](../src/components/PopupWebView.tsx) | modal WebView session |
| [`NativeUsersScreen.tsx`](../src/components/NativeUsersScreen.tsx) | Query UI와 refresh lifecycle |
| [`BottomTabBar.tsx`](../src/components/BottomTabBar.tsx) | 네 tab 표시와 safe area |
| [`NetworkStatusBanner.tsx`](../src/components/NetworkStatusBanner.tsx) | offline 안내 |
| [`Snackbar.tsx`](../src/components/Snackbar.tsx) | iOS bridge toast 대체 UI |

### `src/bridge/`, `src/services/`

| 파일 | 읽을 책임 |
|---|---|
| [`bridge/types.ts`](../src/bridge/types.ts) | action·response·dependency type |
| [`bridge/schema.ts`](../src/bridge/schema.ts) | JSON runtime validation |
| [`bridge/dispatcher.ts`](../src/bridge/dispatcher.ts) | action dispatch와 error normalization |
| [`services/url-router.ts`](../src/services/url-router.ts) | URL/deep-link/popup policy |
| [`services/native-intent.ts`](../src/services/native-intent.ts) | system path canonicalization |
| [`services/device-id.ts`](../src/services/device-id.ts) | app UUID의 storage와 in-flight cache |
| [`services/photo-service.ts`](../src/services/photo-service.ts) | 사진 권한·선택·변환 |
| [`services/notification-service.ts`](../src/services/notification-service.ts) | local notification lifecycle |

### Data·state·utility·web

| 파일 | 읽을 책임 |
|---|---|
| [`api/users.ts`](../src/api/users.ts) | Axios와 Query policy |
| [`schemas/user.ts`](../src/schemas/user.ts) | 외부 사용자 data validation |
| [`types/user.ts`](../src/types/user.ts) | 내부 사용자 shape |
| [`store/app-store.ts`](../src/store/app-store.ts) | tab persist와 hydration |
| [`query-client.ts`](../src/query-client.ts) | app-wide Query 기본 정책 |
| [`constants/tabs.ts`](../src/constants/tabs.ts) | tab 순서와 표시 metadata |
| [`types/navigation.ts`](../src/types/navigation.ts) | index/tag domain과 변환 |
| [`utils/image-size.ts`](../src/utils/image-size.ts) | resize 입력 계산 |
| [`utils/scroll-direction.ts`](../src/utils/scroll-direction.ts) | scroll/back 계산 |
| [`web/local-html.ts`](../src/web/local-html.ts) | WebView payload와 web-side bridge |

## 4. Test를 읽을 때의 경계

15개 test 파일은 모두 첫 두 줄에 `[파일 역할]`과 `[검증 경계]`가 있고, helper·mock factory·`describe`·`it`·`act`·`waitFor` callback에는 `[역할]`이 있다. fixture·mock·event·matcher의 낯선 문법과 library 동작에는 `[문법]`·`[라이브러리]` 설명이 이어진다. test를 읽을 때 다음 순서를 사용한다.

1. 무엇을 실제 production 함수로 import하는지 본다.
2. `jest.mock`이 어느 계층을 교체하는지 본다.
3. fixture가 실제 runtime 객체 전체인지 최소 shape인지 본다.
4. event가 native에서 온 것이 아니라 `fireEvent`로 만든 것인지 본다.
5. assertion이 실행 결과, dependency 호출, props 또는 문자열 존재 중 무엇인지 구분한다.

| Test 유형 | 확인하는 것 | 확인하지 않는 것 |
|---|---|---|
| pure function | schema, URL, retry, size, scroll 계산 | UI와 native runtime |
| dispatcher + dependency mock | action/params/envelope | 실제 Expo API와 WebView callback |
| component + Hook mock | 화면 branch와 command 호출 | HTTP/Query cache 구현 |
| component + WebView mock | prop/callback/remount | native engine/history/network |
| local HTML string test | action·DOM·CSS 문자열 존재 | browser DOM/event 실행 |
| SecureStore mock | JS persist adapter 소비 | keychain/keystore와 재시작 |

Platform 값을 `jest.replaceProperty(Platform, "OS", ...)`로 바꾼 test는 Android/iOS 조건부 JavaScript branch를 실행한다. 실제 Android/iOS event timing과 native component를 실행하는 것은 아니다.

## 5. JSON·package·tool 설정 읽기

### `package.json`

- `main`: Expo Router entry
- scripts: start, Android/iOS Metro launcher, lint, typecheck, Jest
- `dependencies`: runtime에 bundle되는 package
- `devDependencies`: compile/lint/test 도구
- `jest`: preset, setup, `.expo` 제외와 `@/` alias

`package-lock.json`은 정확한 dependency graph를 재현하는 generated lockfile이다. 학습할 때 전체를 위에서 아래로 읽지 말고 package version 확인이 필요할 때만 검색한다.

### `app.json`

다음 값은 서로 연결된 build contract다.

- `scheme: "mywebviewapp"` ↔ native intent와 URL parser
- Android package/iOS bundle identifier ↔ 설치 앱 identity
- `plugins` ↔ generated native project에 반영될 기능
- ImagePicker permission text ↔ 실제 OS 권한 prompt
- `extra.eas.projectId`, `owner` ↔ EAS project 연결 metadata

JSON 값을 바꾸는 것은 문서 주석 수정이 아니라 native/build config 변경이다.

### `eas.json`

`preview.distribution = internal`은 현재 iOS ad hoc Preview Build에 사용한 profile이다. production release profile을 의미하지 않는다.

### `tsconfig.json`

- Expo base config 확장
- strict TypeScript
- `@/*`를 repository root로 연결
- `.expo/types`와 `expo-env.d.ts` 포함

`.expo/types`와 `expo-env.d.ts`는 generated/ignored source이므로 직접 관리하지 않는다.

### `jest.setup.ts`, `eslint.config.js`

두 파일에는 inline `[파일 역할]`, `[역할]`, `[문법]`, `[라이브러리]`와 `[검증 경계]` 또는 참고 문서가 있다. Jest setup의 SecureStore mock을 실제 저장 성공으로 해석하지 않고, ESLint flat config와 CommonJS module 문법을 production runtime code로 오해하지 않는다.

## 6. 주석에서 의도적으로 제외한 것

다음에는 설명을 반복하지 않았다.

- 이름만으로 분명한 StyleSheet 색상·margin·font 값
- JSX 닫기 tag, import 하나마다의 의미
- type이 이미 그대로 말하는 단순 field
- package-lock dependency metadata
- JSON 안의 비표준 comment
- generated `/android`, `/ios`, `.expo`, build output
- `LOCAL_DEMO_HTML` template literal 내부의 TypeScript 설명 주석

특히 local HTML 문자열 안에 설명 comment나 구분선을 넣으면 WebView가 받는 payload가 바뀐다. 그 파일은 문자열 바깥의 `[파일 역할]`, payload 함수별 `[역할]`, 시작·종료 구분선과 FLOW 표식, 이 안내서, 정적 test로 설명한다.

## 7. 혼자 읽을 때 권장 순서

### 첫 번째 통독

1. [내부 구조와 동작](./architecture-internals.md)의 1~4절
2. 각 파일의 `[파일 역할]`을 읽고 `=` 큰 구분선과 `-` 작은 구분선 제목으로 찾을 범위를 정한다.
3. 범위 안의 `[역할]`을 먼저 읽어 각 함수가 무엇을 하는지 파악한 뒤 낯선 `[문법]`·`[라이브러리]`를 실제 코드 한 줄과 대조한다.
4. `FLOW-01` — 앱이 안전하게 시작하는 이유
5. `FLOW-02` — 화면과 instance 수명
6. `FLOW-03`·`FLOW-04` — 일반/popup WebView
7. `FLOW-05` — bridge 왕복
8. `FLOW-06` — deep link와 OS 경계
9. `FLOW-07` — native API와 cache
10. `FLOW-08`·`FLOW-09` — cross-cutting UI/network 상태
11. 관심 flow의 test와 `[검증 경계]`

### 한 기능만 조사할 때

1. 해당 canonical `[FLOW-NN]`을 찾는다.
2. 이 문서의 단계 링크를 따라간다.
3. 각 함수의 caller와 consumer를 `rg`로 검색한다.
4. 같은 숫자의 `N-A`, `N-B` branch를 모두 읽어 다른 입력·결과 경로가 있는지 확인한다. 현재 source에는 `[관련 코드]` 표식이 없다.
5. 같은 이름의 test와 mock provider를 확인한다.
6. 실제 기기 주장이라면 날짜별 완료 문서의 해당 결과를 별도로 확인한다.

### source와 문서가 다를 때

실행 source와 설치 package/config를 먼저 현재 사실로 확인한다. 문서가 오래됐으면 과거 결과를 삭제하지 않고 최신 절이나 관련 설명만 보완한다. 주석을 읽다가 실제 결함 후보를 발견하면 주석 작업에 실행식 수정을 섞지 말고 별도 Impact Review와 검증 범위로 분리한다.
