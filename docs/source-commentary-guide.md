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

여러 파일을 차례로 거치는 기능 흐름의 출발점이다. `FLOW-01`부터 `FLOW-09`까지 각 표식은 실제 앱 source 전체에서 한 번만 나온다.

### `[FLOW-NN / N단계]`

해당 기능 흐름에서 몇 번째 단계인지 나타낸다. 같은 flow와 단계 번호 조합도 실제 앱 source 전체에서 한 번만 사용한다.

단계 번호가 파일의 위에서 아래 순서와 항상 같지는 않다. 예를 들어 `useUsersQuery`는 파일 아래쪽에 있지만, 그 함수가 부르는 `fetchUsers`는 파일 위쪽에 있다. 이 문서에 적힌 순서대로 함수 이름을 검색하면 된다.

### `[FLOW-NN / 관련 코드]`

주요 단계는 아니지만 같은 규칙을 함께 사용하는 코드다. 같은 표식이 여러 파일에 나올 수 있다.

예:

- WebView와 FlatList가 같은 함수로 스크롤 방향을 계산함
- 사진·알림 service가 bridge 요청을 실제 휴대폰 기능으로 이어 줌
- 하나의 Query client가 받아 둔 사용자 목록을 계속 보관함

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
- 주요 `[FLOW-NN]`과 `[FLOW-NN / N단계]`는 실제 앱 source 전체에서 한 곳에만 둔다. 문법이나 library 설명이 같은 위치에 필요해도 FLOW 표식을 하나 더 만들지 않는다.
- 주석을 고치다가 실행 오류로 보이는 부분을 찾아도 같은 변경에 섞어 고치지 않는다. 어떤 화면과 함수에 영향이 있는지 먼저 따로 보고한다.

## 2. 먼저 따라갈 아홉 가지 흐름

처음에는 아래 순서대로 한 흐름씩 읽는 것을 권장한다. 한 flow 안에서는 링크를 열고 해당 `[FLOW-NN / N단계]`를 검색하면 된다.

### FLOW-01: 앱 시작과 마지막 탭 복원

목표는 Root navigation이 먼저 준비되고 SecureStore 복원이 끝난 뒤에만 실제 shell이 mount되는 이유를 이해하는 것이다.

1. [`app/_layout.tsx`](../app/_layout.tsx) — `[FLOW-01]`, `[FLOW-01 / 1단계]`
   - `QueryClientProvider`와 Root `Stack`의 위치를 확인한다.
   - hydration gate가 Root layout 전체를 막지 않는다는 점을 본다.
2. [`app/index.tsx`](../app/index.tsx) — `[FLOW-01 / 2단계]`
   - `hasHydrated` selector와 loading branch를 확인한다.
3. [`src/store/app-store.ts`](../src/store/app-store.ts) — `[FLOW-01 / 3단계]`
   - `secureStorage.getItem`과 persist key를 확인한다.
   - `partializeAppState`가 무엇을 저장하지 않는지도 본다.
4. 같은 파일 — `[FLOW-01 / 4단계]`
   - `mergePersistedAppState`의 runtime guard와 `onRehydrateStorage` 성공·실패 경로를 비교한다.
5. [`app/index.tsx`](../app/index.tsx) — `[FLOW-01 / 5단계]`
   - `DemoShell`이 hydration 이후 처음 mount되는 지점을 확인한다.

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

### FLOW-02: 탭 mount 수명, 전환과 재선택

목표는 “선택되지 않은 tab이 화면에서 보이지 않음”과 “component/WebView가 unmount됨”이 같은 말이 아님을 이해하는 것이다.

1. [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx) — `[FLOW-02]`, `[FLOW-02 / 1단계]`
   - persisted `selectedTabIndex`와 child ref 배열을 찾는다.
2. 같은 파일 — `[FLOW-02 / 2단계]`
   - 세 `WebTab`과 `NativeUsersScreen`이 조건문 바깥에서 항상 render되는 지점을 본다.
3. [`src/components/BottomTabBar.tsx`](../src/components/BottomTabBar.tsx) — `[FLOW-02 / 3단계]`
   - button은 index만 parent에 전달하고 reload 판단을 하지 않는다.
4. [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx) — `[FLOW-02 / 4단계]`
   - 다른 tab 선택은 Zustand index만 바꾼다.
5. 같은 파일 — `[FLOW-02 / 5단계]`
   - 현재 tab 재선택은 Web tab `reloadInitial`, native tab `refetch`로 분기한다.
6. [`src/components/WebTab.tsx`](../src/components/WebTab.tsx) — `[FLOW-02 / 6단계]`
   - error/history flag를 초기화하고 `reloadKey`를 증가시키는 것을 확인한다.

함께 읽을 파일:

- [`src/constants/tabs.ts`](../src/constants/tabs.ts): index·tag·label·최초 URL의 단일 순서
- [`src/types/navigation.ts`](../src/types/navigation.ts): `TabIndex`, `TabTag`, runtime guard
- [`src/components/WebTab.test.tsx`](../src/components/WebTab.test.tsx): inactive mount 유지와 reload remount 계약
- [`src/components/BottomTabBar.test.tsx`](../src/components/BottomTabBar.test.tsx): 선택 접근성 상태와 callback

Web tab은 `opacity: 0`과 input/accessibility 차단을 사용하며 `display: none`이나 조건부 render로 제거하지 않는다. native tab은 wrapper UI가 `display: none`이지만 component instance와 Query observer code는 tree에 남는다.

### FLOW-03: 일반 WebView navigation, history와 오류 복구

1. [`src/components/WebTab.tsx`](../src/components/WebTab.tsx) — `[FLOW-03]`, `[FLOW-03 / 1단계]`
   - `source`, `reloadKey`, progress/error state와 history ref를 역할별로 구분한다.
2. 같은 파일 — `[FLOW-03 / 2단계]`
   - `originWhitelist`, JavaScript·storage·cookie, multi-window와 `onShouldStartLoadWithRequest`를 본다.
3. [`src/services/url-router.ts`](../src/services/url-router.ts) — `[FLOW-03 / 3단계]`
   - URL을 실행하지 않고 `allow`, `block-http`, `external`, `ignore`, `deep-link` decision으로만 바꾸는 부분을 본다.
4. [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx) — `[FLOW-03 / 4단계]`
   - decision이 Alert, app tab 이동 또는 `Linking.openURL`로 실행되는 switch를 확인한다.
5. [`src/components/WebTab.tsx`](../src/components/WebTab.tsx) — `[FLOW-03 / 5단계]`
   - native navigation state의 `canGoBack`·`canGoForward`를 ref에 보관한다.
6. 같은 파일 — `[FLOW-03 / 6단계]`
   - `onError`와 `onHttpError`가 app overlay state로 바뀌는 경로를 본다.
7. 같은 파일 — `[FLOW-03 / 7단계]`
   - `다시 시도`와 `초기 화면`이 현재 URL reload와 최초 source reset으로 다른 이유를 확인한다.

`loadUrl`도 반드시 함께 읽는다.

- 첫 `onLoadEnd` 전: `source` state 교체
- 첫 load 후: `window.location.assign` 주입
- `reloadInitial`: key 변경으로 새 document

이 차이가 deep link와 bridge의 탭 이동 후 WebView history 유지 여부를 결정한다.

관련 test인 [`src/components/WebTab.test.tsx`](../src/components/WebTab.test.tsx)는 WebView 대역의 mount·props·callback을 확인한다. 실제 page load, cookie, native history와 gesture는 test 범위가 아니다.

### FLOW-04: 새 창 분류와 popup lifecycle

1. [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx) — `[FLOW-04 / 1단계]`
   - source tab index와 `targetUrl`을 함께 받는 이유를 본다.
2. [`src/services/url-router.ts`](../src/services/url-router.ts) — `[FLOW-04 / 2단계]`
   - parent, external, popup host/scheme 분류를 읽는다.
3. [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx) — `[FLOW-04 / 3단계]`
   - source history load, OS 외부 앱, `popupUrl` state로 실제 실행을 나눈다.
4. [`src/components/PopupWebView.tsx`](../src/components/PopupWebView.tsx) — `[FLOW-04]`, `[FLOW-04 / 4단계]`
   - URL 변경마다 popup history/error/key를 초기화하는 effect를 본다.
5. 같은 파일 — `[FLOW-04 / 5단계]`
   - popup 내부 navigation에도 일반 URL policy를 재사용한다.
6. 같은 파일 — `[FLOW-04 / 6단계]`
   - history back과 modal close의 우선순위를 확인한다.

추가 확인 지점:

- popup 내부 `SafeAreaProvider`와 top-only `SafeAreaView`
- popup 안의 또 다른 `window.open`을 중첩 modal로 만들지 않는 `handleOpenWindow`
- 오류 시 WebView container와 error content의 전환
- [`src/components/PopupWebView.test.tsx`](../src/components/PopupWebView.test.tsx)의 구조 검증 경계

### FLOW-05: Local HTML bridge 왕복과 기기 기능

이 흐름은 입력을 신뢰하지 않는 경계와 비동기 response가 원래 WebView로 돌아가는 과정을 함께 읽는다.

1. [`src/web/local-html.ts`](../src/web/local-html.ts) — `[FLOW-05]`, `[FLOW-05 / 1단계]`
   - template literal 내부 `sendNative`와 button `onclick`을 찾는다.
   - 이 파일의 문자열 내부는 실제 WebView payload이므로 TypeScript 설명 주석을 삽입하지 않는다는 `[주의]`도 읽는다.
2. [`src/components/WebTab.tsx`](../src/components/WebTab.tsx) — `[FLOW-05 / 2단계]`
   - `onMessage`가 string data를 shell로 올리고 Promise response를 받는다.
3. [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx) — `[FLOW-05 / 3단계]`
   - dispatcher에 현재 ref·state setter·service를 dependency로 주입한다.
4. [`src/bridge/schema.ts`](../src/bridge/schema.ts) — `[FLOW-05 / 4단계]`
   - strict discriminated union과 action별 tuple을 비교한다.
5. [`src/bridge/dispatcher.ts`](../src/bridge/dispatcher.ts) — `[FLOW-05 / 5단계]`
   - switch가 좁혀진 params를 dependency로 보내고 공통 envelope를 만드는 부분을 읽는다.
6. 대표 service인 [`src/services/device-id.ts`](../src/services/device-id.ts) — `[FLOW-05 / 6단계]`
   - SecureStore 우선, 없으면 UUID 생성, 실패 Promise cache 해제 순서를 본다.
7. [`src/components/WebTab.tsx`](../src/components/WebTab.tsx) — `[FLOW-05 / 7단계]`
   - response 이중 직렬화와 `injectJavaScript`를 확인한다.
8. [`src/web/local-html.ts`](../src/web/local-html.ts) 마지막 — `[FLOW-05 / 8단계]`
   - payload 내부 `calledByNative`가 error, UUID와 사진 result를 처리하는 방식을 본다.

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

### FLOW-06: System deep link, WebView deep link와 외부 앱

1. [`app/+native-intent.tsx`](../app/+native-intent.tsx) — `[FLOW-06 / 1단계]`
   - Expo Router system path hook이 모든 cold/warm path를 pure rewrite 함수로 보낸다.
2. [`src/services/native-intent.ts`](../src/services/native-intent.ts) — `[FLOW-06]`, `[FLOW-06 / 2단계]`
   - demo path만 canonical custom URL로 만들고 index query로 encode한다.
3. [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx) — `[FLOW-06 / 3단계]`
   - `useLocalSearchParams`가 query를 읽는다.
4. [`src/services/url-router.ts`](../src/services/url-router.ts) — `[FLOW-06 / 4단계]`
   - custom scheme과 Expo Go `/--/webviewappdemo`를 같은 `DemoDeepLink`로 parse한다.
5. [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx) — `[FLOW-06 / 5단계]`
   - tab 선택과 선택 URL load/refetch를 적용한다.
6. [`src/services/url-router.ts`](../src/services/url-router.ts) — `[FLOW-06 / 6단계]`
   - WebView 내부 custom scheme을 OS로 보내지 않고 app 동작으로 분류한다.
7. [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx) — `[FLOW-06 / 7단계]`
   - app이 처리하지 않는 외부 scheme의 `Linking.openURL`과 rejection 안내를 본다.

같이 볼 test:

- [`src/services/native-intent.test.ts`](../src/services/native-intent.test.ts)
- [`src/services/url-router.test.ts`](../src/services/url-router.test.ts)

두 suite는 URL 문자열 계약을 검증한다. package의 scheme registration, Android intent와 iOS app launch는 build·실기기 결과를 읽어야 한다.

### FLOW-07: Native 사용자 API, schema와 cache/refetch

1. [`src/components/NativeUsersScreen.tsx`](../src/components/NativeUsersScreen.tsx) — `[FLOW-07]`, `[FLOW-07 / 1단계]`
   - `active`가 Query `enabled`로 들어간다.
2. [`src/api/users.ts`](../src/api/users.ts) — `[FLOW-07 / 2단계]`
   - query key, stale time, retry 함수와 enabled를 확인한다.
3. 같은 파일의 `fetchUsers` — `[FLOW-07 / 3단계]`
   - AbortSignal, 10초 timeout과 `unknown` response를 본다.
4. [`src/schemas/user.ts`](../src/schemas/user.ts) — `[FLOW-07 / 4단계]`
   - Zod가 id/name/email을 검사하고 필요한 필드만 `User[]`로 만든다.
5. [`src/components/NativeUsersScreen.tsx`](../src/components/NativeUsersScreen.tsx) — `[FLOW-07 / 5단계]`
   - pending, error/retry, empty, list rendering을 비교한다.
6. 같은 파일 — `[FLOW-07 / 6단계]`
   - retry·재선택·pull-to-refresh가 공통 `refetch`를 거친다.
7. 같은 파일 — `[FLOW-07 / 7단계]`
   - iOS drag 종료 뒤 Alert 지연과 timer cleanup을 읽는다.

관련 test:

- [`src/api/users.test.ts`](../src/api/users.test.ts): retry policy만 검증
- [`src/schemas/user.test.ts`](../src/schemas/user.test.ts): runtime payload 계약만 검증
- [`src/components/NativeUsersScreen.test.tsx`](../src/components/NativeUsersScreen.test.tsx): mocked Query result 소비만 검증

세 suite의 결과를 합쳐도 실제 JSONPlaceholder HTTP 성공이나 TanStack Query의 기기 network timing을 자동으로 증명하지는 않는다.

### FLOW-08: Scroll·bridge·keyboard와 하단 탭

1. [`src/utils/scroll-direction.ts`](../src/utils/scroll-direction.ts) — `[FLOW-08 / 1단계]`
   - top 복귀, 8px threshold와 up/down 반환을 확인한다.
2. [`src/components/WebTab.tsx`](../src/components/WebTab.tsx) — `[FLOW-08 / 2단계]`
   - active WebView의 유효한 방향만 parent로 전달한다.
   - [`NativeUsersScreen`](../src/components/NativeUsersScreen.tsx)의 `[관련 코드]`도 비교한다.
3. [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx) — `[FLOW-08 / 3단계]`
   - bridge, scroll, keyboard 세 state의 AND 조건을 본다.
4. 같은 파일 — `[FLOW-08 / 4단계]`
   - safe-area를 포함한 translateY animation을 확인한다.
5. [`src/components/BottomTabBar.tsx`](../src/components/BottomTabBar.tsx) — `[FLOW-08 / 5단계]`
   - bottom inset의 소유자와 base height를 본다.

popup open/close, tab 선택, bridge show와 iOS error recovery도 scroll state를 복원할 수 있다. 단일 boolean로 합치지 않은 이유를 `DemoShell`의 각 setter caller를 검색해 확인한다.

### FLOW-09: Network 표시와 수동 복구

1. [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx) — `[FLOW-09]`, `[FLOW-09 / 1단계]`
   - `Network.useNetworkState()` 구독을 확인한다.
2. 같은 파일 — `[FLOW-09 / 2단계]`
   - `NONE`만 offline으로 판정하고 `UNKNOWN`은 제외한다.
3. [`src/components/NetworkStatusBanner.tsx`](../src/components/NetworkStatusBanner.tsx) — `[FLOW-09 / 3단계]`
   - banner의 mount와 accessibility alert를 본다.
4. [`src/query-client.ts`](../src/query-client.ts) — `[FLOW-09 / 4단계]`
   - reconnect 자동 refetch를 끈 정책을 확인한다.
5. [`src/components/WebTab.tsx`](../src/components/WebTab.tsx) — `[FLOW-09 / 5단계]`
   - 사용자가 현재 URL을 수동 retry하는 지점을 본다.

`PopupWebView`, `NativeUsersScreen`의 `[FLOW-09 / 관련 코드]`를 함께 읽으면 다음 세 상태가 독립적임을 확인할 수 있다.

- OS가 보고한 연결 상태
- WebView request 오류 state
- TanStack Query 오류 state

network banner가 사라지는 것은 기존 request 성공이나 자동 recovery의 증거가 아니다.

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
4. `[관련 코드]`를 읽어 다른 입력 경로가 있는지 확인한다.
5. 같은 이름의 test와 mock provider를 확인한다.
6. 실제 기기 주장이라면 날짜별 완료 문서의 해당 결과를 별도로 확인한다.

### source와 문서가 다를 때

실행 source와 설치 package/config를 먼저 현재 사실로 확인한다. 문서가 오래됐으면 과거 결과를 삭제하지 않고 최신 절이나 관련 설명만 보완한다. 주석을 읽다가 실제 결함 후보를 발견하면 주석 작업에 실행식 수정을 섞지 말고 별도 Impact Review와 검증 범위로 분리한다.
