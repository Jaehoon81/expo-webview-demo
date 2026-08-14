# Expo WebView 데모 구현 학습서

이 문서는 `my-webview-app`의 실제 source를 Codex와 대화하며 한 단계씩 배우기 위한 기준 자료다. 무엇을 구현했는지는 [구현 계획서](./implementation-plan.md), 앱 전체가 어떻게 나뉘는지는 [내부 구조와 동작](./architecture-internals.md), 혼자 source를 읽는 순서는 [소스 주석 읽기 안내서](./source-commentary-guide.md)에서 확인한다.

이 학습서는 React Native의 모든 내용을 다루는 교재가 아니다. 이 앱에서 실제로 사용하는 provider, state, WebView, bridge, 휴대폰 기능, Query가 서로 어떻게 이어지는지 이해하는 데 필요한 내용만 설명한다.

현재 source에는 처음 코드를 보는 사람을 위한 `[역할]`, `[문법]`과 `[라이브러리]` 주석이 있다. 문법이나 API 이름은 정확성을 위해 원문을 유지하지만, 바로 옆에서 그 함수가 실제로 무엇을 하고 왜 필요한지 쉬운 한국어로 설명한다. 큰 기능은 `=` 구분선, 그 안의 작은 단계는 `-` 구분선으로 시작과 끝을 표시한다. 모든 기호를 줄마다 되풀이하지 않고, 값이 바뀌는 방법과 남는 기간, 함수가 불리는 순서, 실제 휴대폰 기능과 이어지는 지점을 중심으로 읽는다. 자세한 표식 규칙과 혼자 읽는 순서는 [소스 주석 읽기 안내서의 주석 표식](./source-commentary-guide.md#1-주석-표식)을 따른다.

## 이 학습서를 대화에서 사용하는 방법

학습은 문서 전체를 한 번에 읽고 완료 처리하는 방식이 아니다.

1. 사용자가 시작할 대단원 또는 서브 스텝을 정한다.
2. Codex는 해당 단락과 연결된 현재 source를 다시 대조한다.
3. 한 번에 하나의 서브 스텝만 다음 형식으로 대화창에 제시한다.
   - 학습 목표
   - 이 코드가 project 안에서 맡은 일
   - 실제 source path와 필요한 코드
   - 해당 코드의 구분선과 `[역할]`·`[문법]`·`[라이브러리]` 표식이 project 안에서 갖는 의미
   - data, event, state가 만들어지고 사라지는 시점의 예시
   - 사용자가 직접 확인할 지점
   - 핵심 요약
4. 사용자는 연결된 source를 직접 읽고 질문한다.
5. 질문 중 설명이 틀렸거나 빠졌다고 느끼면 source 근거를 다시 확인한다.
6. 확인된 설명 보완은 이 문서의 관련 단락에 기존 내용을 보존하며 추가한다.
7. source 동작을 고쳐야 한다면 학습 문서 수정과 섞지 않는다. 영향 확인, 승인, 검증을 별도 작업으로 나눈다.
8. 사용자가 해당 서브 스텝의 질문을 마쳤다고 명시하기 전에는 다음 단계로 넘어가지 않는다.

대화 내용 전체를 문서에 복제하지 않는다. 이후에도 다시 참고할 가치가 있는 project 사실, 정확해진 설명, source link와 책임 경계만 반영한다.

source를 직접 대조할 때는 다음 순서를 사용한다.

1. `[파일 역할]`에서 이 파일을 누가 사용하고, 이 파일이 어떤 결과를 돌려주는지 먼저 확인한다.
2. `=` 큰 구분선에서 찾을 기능을 고르고, 필요하면 그 안의 `-` 작은 구분선으로 범위를 좁힌다. keyword가 없는 같은 기호의 종료 구분선까지가 한 범위다.
3. `[역할]`에서 각 함수와 callback이 받는 값, 하는 일과 결과를 보내는 곳을 먼저 파악한다.
4. `[문법]` 바로 다음 코드에서 값과 type이 실제로 어떻게 달라지는지 말해 본다.
5. `[라이브러리]`에서 event를 언제 듣고 멈추는지, Query 값은 언제까지 남는지, 휴대폰 기능은 어느 함수에서 불리는지 찾는다.
6. `[FLOW-NN / N단계]`를 따라 다음 파일로 이동하고 `[관련 코드]`에서 같은 규칙을 쓰는 다른 코드를 확인한다.
7. `[이유]`, `[주의]`, `[검증 경계]`로 현재 방법을 택한 이유와 test가 실제 기기에서 확인하지 못한 부분을 구분한다.

이 구성에서는 다음 내용을 별도 반복 단원으로 만들지 않는다.

- 범용 TypeScript·React 문법 백과
- 자동화와 실기기 검증 차이를 다시 나열하는 독립 장
- source를 임시로 고치는 복습 실습

필요한 함수 책임, 문법과 library 계약, 증거 범위는 해당 source를 읽는 바로 그 단락에서 구분선과 `[역할]`·`[문법]`·`[라이브러리]`·`[검증 경계]`를 대조하며 짧게 설명한다.

## 1. 프로젝트 지도와 책임 분리

### 1-1. Route source와 기능 source를 구분하기

#### 학습 목표

Expo Router가 수집하는 route와 route가 사용하는 일반 TypeScript module을 구분하고, 기능을 찾을 때 어느 폴더부터 열어야 하는지 판단한다.

#### 핵심 source

- [`app/_layout.tsx`](../app/_layout.tsx)
- [`app/index.tsx`](../app/index.tsx)
- [`app/+native-intent.tsx`](../app/+native-intent.tsx)
- [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx)

`app/`에는 현재 세 파일만 있다. `_layout.tsx`는 provider와 Stack, `index.tsx`는 단일 화면 route, `+native-intent.tsx`는 Expo Router의 특별 system path hook이다.

실제 기능 대부분은 `src/`에 있다. 이 앱은 네 개의 사용자 tab을 Expo Router route 네 개로 만들지 않고, 단일 index route 안의 `DemoShell`이 직접 조합한다.

```text
Expo Router가 소유하는 경계
  app/_layout.tsx
  app/index.tsx
  app/+native-intent.tsx

DemoShell이 조합하는 화면 경계
  WebTab f0
  WebTab f1
  WebTab f2
  NativeUsersScreen f3
  PopupWebView
  BottomTabBar
```

이 선택의 결과는 두 가지다.

1. tab 전환이 route push/pop이 아니므로 세 WebView instance를 동시에 유지할 수 있다.
2. deep link의 `target`도 Router route가 아니라 `DemoShell` 내부 `selectedTabIndex`로 변환해야 한다.

#### Source에서 확인할 지점

1. `app/index.tsx`가 `DemoShell` 하나만 render하는지 본다.
2. `DemoShell`에서 `TAB_DEFINITIONS.slice(0, 3).map(...)`과 `NativeUsersScreen`을 찾는다.
3. `app/`에 tab별 route 파일이 없는지 확인한다.

#### 대화에서 확인할 질문

- Expo Router Stack과 app 내부 tab shell은 각각 어떤 navigation history를 소유하는가?
- f1에서 f2로 바꿀 때 route가 바뀌지 않는 것이 WebView state 유지에 어떤 영향을 주는가?

### 1-2. 계층별 책임과 의존 방향

#### 학습 목표

`DemoShell`이 모든 일을 하는 거대한 service가 아니라 UI event와 분리된 module을 연결하는 orchestration layer임을 이해한다.

| 계층 | 실제 책임 | 대표 파일 |
|---|---|---|
| route/provider | app tree와 진입 순서 | `app/_layout.tsx`, `app/index.tsx` |
| orchestration | child ref, state와 service 연결 | `DemoShell.tsx` |
| UI component | 표시 상태와 사용자의 interaction | `WebTab`, `PopupWebView`, `NativeUsersScreen` |
| policy/pure logic | URL, resize, scroll, retry 판단 | `url-router.ts`, `image-size.ts`, `scroll-direction.ts`, `users.ts` |
| runtime validation | 신뢰할 수 없는 data shape 검사 | `bridge/schema.ts`, `schemas/user.ts` |
| native service adapter | Expo API 호출 순서와 lifecycle | photo, notification, device ID service |
| state/cache | persisted tab과 server cache | Zustand store, QueryClient |
| web payload | WebView 안에서 실행되는 HTML/JS | `local-html.ts` |

의존 방향의 대표 예는 bridge다.

```text
WebTab → DemoShell → dispatchBridgeMessage
                       ↑ dependency interface
         DemoShell이 service/ref/state setter를 주입
```

dispatcher가 `expo-image-picker`나 `ToastAndroid`를 직접 import하면 action 분기와 platform 구현이 결합된다. 현재는 `BridgeDependencies`를 받으므로 dispatcher test가 dependency mock만으로 request/response 계약을 확인할 수 있다.

#### Source에서 확인할 지점

- [`src/bridge/types.ts`](../src/bridge/types.ts)의 `BridgeDependencies`
- [`src/bridge/dispatcher.ts`](../src/bridge/dispatcher.ts)의 함수 인자
- [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx)의 `handleBridgeMessage`

#### 대화에서 확인할 질문

- validation과 실제 기기 기능 실행을 같은 함수에 두지 않은 이유는 무엇인가?
- 새로운 bridge action 하나를 추가하면 어느 계층을 함께 바꿔야 하는가?

### 1-3. 여섯 가지 상태 수명 구분하기

이 앱을 이해할 때 가장 중요한 것은 “state”라는 한 단어로 모든 값을 묶지 않는 것이다.

| 상태 종류 | 예 | 변경 시 render | app 재실행 뒤 유지 |
|---|---|---:|---:|
| React state | popup URL, load error, progress | 예 | 아니오 |
| React ref | WebView handle, history 가능 여부, back 시각 | 아니오 | 아니오 |
| Zustand persisted state | selected tab | 예 | 예 |
| Zustand runtime state | hydration 완료 | 예 | 아니오 |
| TanStack Query cache | `['users']` data/error/freshness | subscriber에 따라 예 | 아니오 |
| WebView 내부 state | document, form, cookie, history | native WebView 내부 | binary/app 정책에 따라 다르나 app state와 별개 |

여기에 SecureStore와 OS notification/picker가 app 바깥의 native 상태를 추가로 갖는다.

예를 들어 f1 WebView의 URL history는 Zustand에 저장되지 않는다. tab을 가렸다 다시 보여도 같은 WebView instance라서 남는 것이며, app process를 끝낸 뒤 복원하는 계약은 아니다.

#### Source에서 확인할 지점

- `DemoShell`의 `useState`와 `useRef`를 두 묶음으로 구분한다.
- `app-store.ts`의 `partializeAppState`가 무엇만 저장하는지 본다.
- `WebTab`의 `reloadKey`와 history ref가 어떤 event에서 바뀌는지 본다.

## 2. 앱 시작, Root Stack과 hydration

### 2-1. Root tree가 먼저 만들어지는 순서

#### 학습 목표

앱의 화면보다 먼저 필요한 provider가 무엇이며, 왜 Root Stack을 hydration 뒤로 미루지 않는지 이해한다.

현재 Root tree는 다음과 같다.

```tsx
<QueryClientProvider client={queryClient}>
  <StatusBar style="dark" />
  <Stack screenOptions={{ headerShown: false }} />
</QueryClientProvider>
```

`Stack`은 route content를 render하는 navigation container다. `DemoShell`이 아직 보이지 않아도 Stack 자체는 존재한다.

3단계 Android cold deep link에서 과거 구조는 hydration loading 때문에 Root `Stack`을 mount하지 않았다. system URL에서 만든 query를 `router.setParams`가 적용하려 할 때 navigation tree가 없어 문제가 됐다. 현재 loading gate를 `app/index.tsx`로 옮겨 다음 순서를 보장한다.

```text
Root Stack mount
  → index route render
    → hydration loading 또는 DemoShell
```

#### Source 대조

1. [`app/_layout.tsx`](../app/_layout.tsx)의 `[FLOW-01 / 1단계]`
2. [`app/index.tsx`](../app/index.tsx)의 loading branch
3. [`src/components/IndexScreen.test.tsx`](../src/components/IndexScreen.test.tsx)의 DemoShell mock

Index screen test는 loading 전후 UI 순서를 확인하지만 Root navigation과 actual custom scheme을 실행하지는 않는다. 이 제한은 test의 `[검증 경계]`에서 바로 확인한다.

### 2-2. SecureStore hydration의 성공·손상·실패

#### 학습 목표

저장된 JSON을 TypeScript type만 믿지 않고 runtime에서 다시 검사하며, storage 실패가 loading deadlock이 되지 않는 경로를 읽는다.

`PersistedAppState`는 `selectedTabIndex` 하나뿐이다.

```ts
export type PersistedAppState = Pick<AppStore, "selectedTabIndex">;
```

하지만 storage의 값은 runtime에서 `unknown`이다. 과거 version, 손상된 JSON 또는 수동 변조는 TypeScript compile을 거치지 않는다. `mergePersistedAppState`는 candidate가 number이고 `isTabIndex`를 통과할 때만 복원한다.

상태별 결과는 다음과 같다.

| storage 결과 | 선택 tab | hydration 완료 |
|---|---:|---:|
| 유효한 `0`~`3` | 저장값 | true |
| 범위 밖 값 | 현재 기본값 | true |
| read error | 현재 기본값, warning | true |
| callback state 부재 | 현재 기본값 | microtask에서 true |

`queueMicrotask` 경로는 rehydration callback이 store instance를 받지 못한 경우 현재 callback stack 밖에서 singleton state를 갱신한다.

#### Source 대조

- [`src/store/app-store.ts`](../src/store/app-store.ts) `secureStorage`, `partializeAppState`, `mergePersistedAppState`, `onRehydrateStorage`
- [`src/store/app-store.test.ts`](../src/store/app-store.test.ts)

#### 대화에서 확인할 질문

- `hasHydrated`를 저장하면 왜 잘못된 loading skip이 생길 수 있는가?
- SecureStore failure를 throw해 앱 전체를 중단하지 않고 기본 tab으로 진행하는 tradeoff는 무엇인가?

### 2-3. QueryClient가 Root에 있는 이유

`QueryClient`는 remote/server state cache를 관리한다. 이 앱에서는 사용자 목록 하나만 사용하지만 Root singleton으로 두어 `NativeUsersScreen`의 render visibility와 cache 수명을 분리한다.

공통 설정은 자동 동작을 최소화한다.

```ts
queries: {
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
  retry: false,
}
```

사용자 query는 자신의 `retry: shouldRetryUsersRequest`를 지정하므로 공통 `retry: false`를 좁게 override한다. reconnect나 focus만으로 성공 Alert가 갑자기 나타나는 것을 피하고, 사용자가 직접 retry/refetch한 결과를 관찰한다.

#### Source 대조

- [`src/query-client.ts`](../src/query-client.ts)
- [`src/api/users.ts`](../src/api/users.ts) `useUsersQuery`
- [`app/_layout.tsx`](../app/_layout.tsx) provider

## 3. 네 tab과 하단 navigation

### 3-1. Index, tag와 definition의 관계

`TabIndex`는 UI/ref 배열용 `0 | 1 | 2 | 3`, `TabTag`는 bridge 호환용 `f0 | f1 | f2 | f3`다.

[`src/constants/tabs.ts`](../src/constants/tabs.ts)의 `TAB_DEFINITIONS`는 다음 값을 한 행에 묶는다.

- index
- bridge tag
- 한국어 label
- unselected/selected icon
- Web tab의 최초 URL

`tabTagToIndex`가 unknown string을 받을 수 있는 이유는 bridge의 runtime data에서 출발하기 때문이다. schema가 `f0`~`f3`를 검사하지만 실제 실행 경계에서도 null을 처리해 URL과 tab을 함께 방어한다.

#### Source에서 직접 대조할 것

1. `TAB_TAGS` 배열과 `TabTag` indexed access type
2. `isTabIndex`의 integer/range 검사
3. `TAB_DEFINITIONS`의 배열 순서
4. `DemoShell`의 `webTabRefs.current[tab.index]`

순서를 바꾸면서 index, tag 또는 schema 중 하나만 바꾸면 잘못된 WebView ref를 제어할 수 있다.

### 3-2. Inactive WebView를 unmount하지 않기

`WebTab` root는 active 여부에 따라 다음 네 가지를 함께 바꾼다.

```text
visual: opacity
touch: pointerEvents
accessibility: accessibilityElementsHidden / importantForAccessibility
native hierarchy: collapsable=false
```

단순히 opacity만 0으로 만들면 보이지 않는 WebView가 touch나 screen reader focus를 받을 수 있다. 반대로 조건부 render로 제거하면 history와 page state가 사라진다. 현재 구조는 state 유지와 입력 차단을 동시에 맞춘다.

`NativeUsersScreen`은 inactive일 때 `display: none`을 사용하지만 parent가 component 자체를 조건부로 제거하지 않는다. component ref와 activation 이력은 남고 Query의 `enabled`만 active에 따라 달라진다.

#### Source 대조

- [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx) `[FLOW-02 / 2단계]`
- [`src/components/WebTab.tsx`](../src/components/WebTab.tsx) root View props
- [`src/components/NativeUsersScreen.tsx`](../src/components/NativeUsersScreen.tsx) root View와 `hidden`
- [`src/components/WebTab.test.tsx`](../src/components/WebTab.test.tsx) 첫 test

### 3-3. 다른 tab 선택과 현재 tab 재선택

두 interaction은 이름은 비슷하지만 effect가 다르다.

| interaction | Zustand | WebView | Native Query |
|---|---|---|---|
| 다른 tab 선택 | 새 index 저장 | 기존 instance를 보이게 함 | active에 따라 최초 query 가능 |
| 현재 Web tab 재선택 | 같은 index | 최초 source의 새 document | 해당 없음 |
| 현재 native tab 재선택 | 같은 index | 해당 없음 | 강제 refetch와 결과 Alert |

`handleTabSelect`는 항상 scroll visibility를 true로 복원한다. 이전 tab의 아래 scroll 때문에 새 tab의 하단 navigation까지 숨겨져 시작하지 않게 한다.

Web tab `reloadInitial`은 다음 상태를 모두 초기화한다.

- load error
- back/forward 가능 ref
- document loaded ref
- source
- key

key가 바뀌면 React가 같은 위치의 WebView를 새 instance로 만든다. 일반 tab 전환에는 key를 바꾸지 않는다.

### 3-4. 하단 bar의 세 입력과 safe area

하단 bar는 단일 `visible` setter 하나로 관리하지 않는다.

```ts
const bottomBarVisible =
  bridgeBottomBarVisible && scrollBottomBarVisible && !keyboardVisible;
```

원인을 분리하면 다음 충돌을 피할 수 있다.

- bridge가 hide한 상태에서 scroll up만으로 다시 보이는 문제
- keyboard가 열린 상태에서 bridge show가 입력 영역을 덮는 문제
- popup close 뒤 scroll hide 상태가 남는 문제

`BottomTabBar`가 실제 bottom inset padding을 소유하고, `DemoShell`은 `60 + insets.bottom`을 animation 이동 거리와 child content inset으로 재사용한다.

#### Source 대조

- [`src/utils/scroll-direction.ts`](../src/utils/scroll-direction.ts)
- [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx)의 세 visibility state와 keyboard effect
- [`src/components/BottomTabBar.tsx`](../src/components/BottomTabBar.tsx)

#### 대화에서 확인할 질문

- bridge show가 scroll state도 true로 만드는 반면 keyboard state는 우회하지 않는 이유는 무엇인가?
- child loading/error에 bottom inset을 전달하지 않으면 시각적 중심이 왜 달라지는가?

## 4. 일반·popup WebView와 platform navigation

### 4-1. WebTab이 소유하는 document와 명령

`WebTabHandle`은 parent가 호출할 수 있는 최소 명령 집합이다.

```ts
reloadInitial()
loadUrl(url)
goBack()
goForward()
canGoBack()
canGoForward()
injectBridgeResponse(response)
```

parent는 native `WebView` ref 자체를 알지 못한다. 이 경계 덕분에 first-load 처리, history ref와 response escaping을 `WebTab` 안에서 일관되게 유지한다.

`loadUrl`의 핵심은 첫 document load 여부다.

```text
before onLoadEnd  → source state 변경
after onLoadEnd   → location.assign 주입
reloadInitial     → key 변경과 최초 source
```

첫 load 이후 source prop을 계속 바꾸는 대신 `location.assign`을 쓰므로 native WebView instance와 history chain을 유지한다.

### 4-2. URL policy와 실행 분리

[`src/services/url-router.ts`](../src/services/url-router.ts)는 Alert, Linking, WebView ref를 import하지 않는다. URL을 `NavigationDecision`으로만 분류한다.

이 분리는 같은 policy를 일반 `WebTab`과 `PopupWebView`에서 재사용하게 한다. 실제 실행은 각 component의 context에 따라 달라진다.

예를 들어 `deep-link` decision은 일반 tab에서는 `applyDeepLink`, popup에서는 `onDeepLink`를 호출한 뒤 popup을 닫는 흐름으로 이어진다.

`http:`를 `https:`로 몰래 바꾸지 않는 것도 중요하다. 사용자가 명시한 HTTP target은 차단하고, scheme 없는 `m.nate.com` 같은 bridge/deep-link 입력만 `normalizeHttpsUrl`이 HTTPS로 보완한다.

### 4-3. History와 Android/iOS back

`onNavigationStateChange`가 주는 `canGoBack`·`canGoForward`는 화면에 직접 표시하는 state가 아니다. hardware/button event가 발생했을 때 즉시 읽을 명령 상태이므로 ref에 둔다.

Android back 우선순위:

1. popup이 열려 있고 history 있음 → popup back
2. popup이 열려 있고 history 없음 → popup close
3. 선택 Web tab history 있음 → tab back
4. 그 외 첫 back → 종료 안내와 시각 기록
5. 2초 안의 두 번째 back → `BackHandler.exitApp()`

iOS는 hardware back이 없으므로 Web tab 위에 back/forward toolbar를 표시하고 swipe gesture를 허용한다. history가 없는 button은 Alert를 표시한다.

[`src/utils/scroll-direction.ts`](../src/utils/scroll-direction.ts)의 `isDoubleBackPress` test는 시간 계산만 확인한다. 실제 app exit와 platform navigation은 JavaScript pure test 범위를 벗어난다.

### 4-4. 새 창이 parent, external, popup으로 나뉘는 이유

`window.open`이 항상 popup modal을 만드는 것은 아니다.

- local/네이버/다음/네이트 mobile URL: source WebView에서 이어서 load
- social host 또는 non-HTTPS: OS 외부 처리
- 그 외 HTTPS: full-screen popup

source tab index를 함께 전달해야 parent decision이 어느 WebView history에 URL을 추가할지 알 수 있다.

`PopupWebView`는 Modal 내부 native tree라 root safe-area context만 믿지 않고 자체 `SafeAreaProvider`를 둔다. popup 내부에서 다시 `window.open`이 발생해도 modal을 계속 중첩하지 않고 현재 popup URL을 바꾼다.

### 4-5. Loading, 오류와 iOS recovery lifecycle

일반 WebView의 loading과 error overlay는 같은 bottom inset을 받는다. absolute 하단 bar가 차지하는 영역을 빼고 spinner 또는 error action 묶음이 중앙에 보이게 한다.

오류 뒤 두 버튼은 의미가 다르다.

- `다시 시도`: 현재 URL과 history context에서 `reload()`
- `초기 화면`: tab 최초 source와 새 WebView instance

iOS error recovery ref는 다음 구간에만 true다.

```text
onError / onHttpError
  → retry 또는 초기 화면
    → WKWebView가 보낼 수 있는 합성 scroll 무시
      → 성공 onLoad
        → 정상 scroll 전달 재개
```

Android에서는 이 ref 조건을 적용하지 않는다. Platform test는 조건부 JavaScript 경로를 확인하고, 실제 WKWebView event가 어떤 시점에 오는지는 iPhone 후속 검증 기록이 근거다.

#### Source 대조

- [`src/components/WebTab.tsx`](../src/components/WebTab.tsx)
- [`src/components/PopupWebView.tsx`](../src/components/PopupWebView.tsx)
- [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx) navigation/back
- [`src/services/url-router.ts`](../src/services/url-router.ts)

## 5. WebView bridge와 기기 기능

### 5-1. Web request envelope와 runtime schema

local HTML의 `sendNative`는 다음 모양의 JSON 문자열을 보낸다.

```ts
{
  uuid: string,
  action: string,
  params?: unknown
}
```

TypeScript `BridgeAction`은 compile-time 도움이고 WebView에서 온 JSON을 runtime에 보장하지 않는다. Zod schema가 실제 경계다.

`z.discriminatedUnion("action", ...)`은 action 값에 따라 params tuple을 함께 좁힌다.

- no params: undefined optional
- toast: 길이 1의 string tuple
- notification: 길이 1 또는 2 tuple
- tab 이동: enum tag와 non-empty URL string

`strictObject`는 선언하지 않은 추가 field도 거부한다.

### 5-2. Dispatcher와 dependency injection

dispatcher는 먼저 fallback envelope를 읽은 뒤 schema parse를 시도한다. parse가 실패해도 유효한 uuid/action 문자열이 있었다면 error response에 보존한다.

```text
valid request
  → dependency 실행
  → success(uuid, action, result)

invalid request 또는 dependency Error
  → failure(fallback uuid, fallback action, message)
```

Zod error의 세부 path를 WebView에 그대로 노출하지 않고 공통 사용자 문구로 바꾼다. 기기 service가 의도적으로 던진 `Error`는 message를 유지해 권한 거부·취소 이유를 표시한다.

#### Source 대조

- [`src/bridge/types.ts`](../src/bridge/types.ts)
- [`src/bridge/schema.ts`](../src/bridge/schema.ts)
- [`src/bridge/dispatcher.ts`](../src/bridge/dispatcher.ts)
- [`src/bridge/dispatcher.test.ts`](../src/bridge/dispatcher.test.ts)

### 5-3. Response를 원래 WebView로 돌려보내기

`WebTab.onMessage`는 자신이 받은 message를 parent callback으로 보낸다. `DemoShell`의 callback은 source tab index를 closure로 알고 있으므로 reloadOtherTabs에서 sender를 제외할 수 있다.

response injection은 두 번 직렬화한다.

1. response object → JSON text
2. JSON text → JavaScript 함수 인자 string literal

최종 expression은 개념적으로 다음과 같다.

```js
window.calledByNative && window.calledByNative("{...escaped JSON...}"); true;
```

두 번째 `JSON.stringify`가 없으면 response 안의 quote나 줄바꿈이 injected JavaScript source를 깨뜨릴 수 있다. 마지막 `true;`는 WebView injection expression이 명시적으로 완료되게 한다.

web payload의 `calledByNative`는 `isError`를 먼저 처리하고, 성공 action에 따라 UUID Alert 또는 사진 DOM 갱신을 수행한다.

### 5-4. Device ID의 의미와 cache

이 앱의 UUID는 device hardware ID가 아니다.

```text
SecureStore key 있음 → 저장 UUID 반환
없음 → Crypto.randomUUID → SecureStore 저장 → 반환
```

module-level Promise cache는 동시에 두 WebView가 요청해도 하나의 read/create만 실행하게 한다. Error로 끝난 Promise는 cache에서 제거해 이후 호출이 다시 시도할 수 있다.

학습 중 “기기 고유번호”라는 UI 문구와 실제 보안·식별 의미를 구분해야 한다. app local demo identifier이며 reinstall, storage 정책과 OS에 따라 수명이 달라질 수 있다.

### 5-5. 사진 권한, 크기 제한과 base64

사진 service는 app 시작 시 권한을 요청하지 않는다. bridge action 시점에 현재 권한을 읽고 필요하면 요청한다.

picker 결과는 최대 두 장으로 제한하고, JavaScript에서도 `.slice(0, MAX_SELECTION)`으로 다시 상한을 둔다. 각 asset은 다음 순서로 처리한다.

```text
width/height 검사
  → 긴 변 1000 초과 시 한 축 resize
    → renderAsync
      → PNG saveAsync(base64)
        → { name, base64Image }
```

작은 image에서 width/height 둘 다 null인 것은 크기를 0으로 만들라는 뜻이 아니라 resize operation을 생략하라는 신호다. 한 축만 지정하면 manipulator가 종횡비를 유지한다.

사진을 순차 처리하는 이유는 여러 원본의 render와 base64 allocation이 동시에 겹치지 않게 하기 위해서다. 취소와 base64 부재는 부분 성공으로 숨기지 않고 전체 Error가 된다.

### 5-6. Local notification과 platform toast

notification service는 remote push를 구현하지 않는다. local one-shot notification만 예약한다.

Android 순서는 channel 생성이 권한 확인보다 먼저다. Android 13에서 notification channel이 permission prompt의 선행 조건이 될 수 있기 때문이다.

예약 전에는 `content.data.source === "webview-demo"`인 pending 알림만 취소한다. 다른 기능의 알림과 이미 전달된 tray item까지 전체 삭제하지 않는다.

수명도 구분한다.

- notification handler: process에서 한 번
- received/response listeners: DemoShell mount 동안
- scheduled notification: OS scheduler가 소유
- badge: app active와 notification tap에서 0으로 정리

Toast는 Android `ToastAndroid`, iOS `Snackbar`로 통합한다. Snackbar timer는 message 변경이나 unmount 때 cleanup해 이전 timer가 새 message를 닫지 않게 한다.

#### Source 대조

- [`src/services/device-id.ts`](../src/services/device-id.ts)
- [`src/services/photo-service.ts`](../src/services/photo-service.ts)
- [`src/services/notification-service.ts`](../src/services/notification-service.ts)
- [`src/components/Snackbar.tsx`](../src/components/Snackbar.tsx)
- [`src/web/local-html.ts`](../src/web/local-html.ts)

## 6. Deep link와 외부 URL

### 6-1. OS system path를 index query로 바꾸기

Expo Router의 [`app/+native-intent.tsx`](../app/+native-intent.tsx)는 incoming path를 route로 해석하기 전 호출된다. 구현은 pure `rewriteIncomingSystemPath`에 위임한다.

demo URL이면 query를 보존한 canonical URL을 만든 뒤 전체를 encode한다.

```text
mywebviewapp://webviewappdemo?target=1&url=m.nate.com
  ↓
/?demoDeepLink=mywebviewapp%3A%2F%2Fwebviewappdemo%3F...
```

관련 없는 route는 원문을 유지한다. URL syntax가 깨진 입력은 존재하는 `/`로 보낸다.

Root Stack이 먼저 mount되고 index route가 query를 받는 순서는 2단원의 hydration 구조와 연결된다.

### 6-2. Custom scheme과 Expo Go URL을 하나로 parse하기

`parseDemoDeepLink`는 두 모양을 허용한다.

- `mywebviewapp://webviewappdemo?...`
- `exp://host/--/webviewappdemo?...`

둘 다 내부에서는 다음 값으로 정규화된다.

```ts
type DemoDeepLink = {
  tabIndex: TabIndex;
  targetUrl: string | null;
};
```

`target`은 반드시 있고 `0`~`3` integer여야 한다. `url`은 선택이지만 제공했다면 HTTPS로 정규화 가능해야 한다.

`DemoShell.applyDeepLink`는 tab을 선택하고 Web tab URL 또는 native refetch를 적용한다. route query는 처리 뒤 제거해 같은 입력이 render마다 반복되지 않게 한다.

### 6-3. WebView 내부 link와 OS 외부 앱

같은 custom scheme을 WebView 안에서 누르면 URL classifier가 app deep link로 가로챈다. 이 경우 OS intent round-trip 없이 같은 `applyDeepLink`를 호출한다.

`tel:`, `sms:`, `mailto:`와 기타 외부 scheme은 `Linking.openURL`로 OS에 맡긴다. app이 없거나 OS가 거부해 Promise가 reject되면 공통 Alert를 표시한다.

중요한 차이는 다음과 같다.

| 경로 | 확인하는 것 |
|---|---|
| WebView 내부 custom scheme | app JavaScript parsing과 tab 적용 |
| Expo Go `/--/` URL | Expo Go 모양 parsing |
| 외부 OS custom scheme | 설치 binary의 scheme 등록과 cold/warm launch |

앞의 두 경로가 성공해도 마지막 경로를 자동으로 증명하지 않는다. 이 구분은 별도 검증 장을 만들지 않고 deep link 자체를 이해할 때 함께 기억한다.

#### Source 대조

- [`app/+native-intent.tsx`](../app/+native-intent.tsx)
- [`src/services/native-intent.ts`](../src/services/native-intent.ts)
- [`src/services/url-router.ts`](../src/services/url-router.ts)
- [`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx) params/apply/openExternal

## 7. 사용자 API와 TanStack Query

### 7-1. 요청을 tab 활성화까지 미루기

`NativeUsersScreen`은 항상 component tree에 있지만 `useUsersQuery(active)`를 호출한다. Query `enabled=false`는 현재 observer가 자동 request를 시작하지 않게 한다.

별도로 `hasActivatedRef`를 두는 이유는 bridge `reloadOtherTabs`다. component가 mount돼 있다는 사실만으로 사용자가 native tab을 본 적 있다고 판단하지 않는다. `refetchIfActivated`는 활성화 이력이 없으면 아무 요청도 하지 않는다.

현재 native tab을 직접 재선택할 때는 사용자가 화면을 보고 있으므로 일반 `refetch(true)`를 호출한다.

### 7-2. Axios 응답을 unknown으로 받고 Zod로 좁히기

Axios generic을 `unknown`으로 지정하면 compile 시점에 `response.data`를 User 배열로 바로 사용할 수 없다.

```text
Axios response.data: unknown
  → jsonPlaceholderUsersSchema.parse
    → id positive integer
    → trimmed non-empty name
    → trimmed email
      → { id, name, email }[]
```

외부 response의 phone, company 등 사용하지 않는 field는 내부 User 객체에 복사하지 않는다. 화면과 cache가 필요한 data shape를 작게 유지한다.

Zod parsing error는 Axios error가 아니므로 retry policy가 반복하지 않는다. 같은 invalid payload를 다시 받아도 회복 가능성이 낮기 때문이다.

### 7-3. Retry, stale time과 수동 refetch

Query key는 `['users']`, stale time은 5분이다. 자동 retry는 다음 경우에 한 번만 허용한다.

- response가 없는 network error
- HTTP 5xx

HTTP 4xx, cancel, non-Axios error는 retry하지 않는다. `failureCount >= 1`이면 위 허용 case도 더 반복하지 않는다.

`AbortSignal`을 Axios에 전달해 Query observer가 request를 취소할 수 있고, 별도로 10초 timeout도 둔다. cancel은 실패 Alert나 재시도 연쇄를 만들지 않는 policy다.

stale time이 남아 있어도 `refetch()`를 직접 호출하면 network 요청을 수행할 수 있다. 이 앱의 tab 재선택과 pull-to-refresh는 사용자의 명시적 refresh이므로 fresh cache만 보여주는 것으로 끝내지 않는다.

### 7-4. Query result와 iOS pull lifecycle

화면은 Query result를 다음 순서로 render한다.

1. `isPending`: progress UI
2. `isError`: message와 retry button
3. 성공 data: empty 또는 FlatList

최초 active fetch가 끝났을 때는 `handledInitialResultRef`로 한 번만 자동 Alert를 표시한다. 이후 명시적 refetch는 refetch 함수의 await 결과를 사용해 별도 Alert를 만든다.

iOS pull-to-refresh에서는 refetch Promise가 손을 떼기 전에 끝날 수 있다. Alert가 gesture와 refresh control을 가로막지 않도록 drag 중이면 결과를 ref에 대기시키고 `onScrollEndDrag` 뒤 timer로 표시한다. Android는 즉시 표시한다.

component unmount 시 timer cleanup이 없으면 이미 사라진 tab tree 위에 늦은 Alert가 뜰 수 있다.

#### Source 대조

- [`src/api/users.ts`](../src/api/users.ts)
- [`src/schemas/user.ts`](../src/schemas/user.ts)
- [`src/types/user.ts`](../src/types/user.ts)
- [`src/components/NativeUsersScreen.tsx`](../src/components/NativeUsersScreen.tsx)
- 관련 test 세 파일의 첫 `[검증 경계]`

## 8. Network, event cleanup과 cross-cutting 상태

### 8-1. 연결 상태와 request 결과를 분리하기

`Network.useNetworkState()`가 `NONE`을 보고할 때 banner를 표시한다. `UNKNOWN`은 app 초기화 중일 수 있어 offline으로 취급하지 않는다.

연결 상태와 실제 request 결과는 독립적이다.

- network가 있어도 DNS, TLS, server, Zod parsing은 실패할 수 있다.
- network가 복원돼도 이미 error state인 WebView/Query가 자동 성공으로 바뀌지는 않는다.
- banner는 연결 상태 안내이고 error content는 request 결과다.

따라서 복원 순서는 보통 다음과 같다.

```text
network restored
  → banner unmount
  → 기존 WebView/Query error는 유지
  → 사용자가 retry/refetch
  → 실제 request 결과로 UI 갱신
```

### 8-2. Scroll signal과 iOS 합성 event

WebView와 FlatList는 같은 `getScrollDirection` helper를 사용하지만 offset 기준은 component별 ref가 보관한다.

- 8px 미만: null
- 아래 이동: down
- 위 이동: up
- top 복귀: 즉시 up

inactive WebView는 scroll callback을 parent로 전달하지 않는다. 화면 뒤의 WebView activity가 현재 하단 bar를 움직이는 것을 막는다.

iOS error recovery 동안의 scroll은 또 다른 필터를 거친다. 방향 자체가 계산돼도 `iosErrorRecoveryRef`가 true이면 parent로 보내지 않는다. 성공 load 뒤에는 같은 path가 다시 허용된다.

### 8-3. Effect와 listener cleanup 연결하기

이 앱에는 서로 다른 event source가 있다.

| Event source | 등록 위치 | cleanup |
|---|---|---|
| keyboard show/hide | DemoShell effect | 두 subscription remove |
| notification received/response | notification service, DemoShell effect | service가 반환한 cleanup |
| AppState change | DemoShell effect | subscription remove |
| Android hardware back | DemoShell effect | subscription remove |
| Snackbar timer | Snackbar effect | clearTimeout |
| iOS pull Alert timer | NativeUsersScreen effect | clearTimeout |

dependency array가 바뀌면 effect cleanup 뒤 다시 등록될 수 있다. 특히 hardware back effect는 `popupUrl`과 `selectedTabIndex`의 최신 값을 closure로 가져야 하므로 해당 값이 바뀔 때 listener를 교체한다.

반대로 notification/keyboard listener는 mount 동안 한 번이고 callback이 외부 mutable state를 직접 참조하지 않으므로 빈 dependency array를 사용한다.

### 8-4. 전체 흐름을 한 event로 연결하기

마지막으로 local HTML에서 `goToAnotherTab`을 누르는 한 event를 모든 수명과 연결해 본다.

```text
Web DOM button
  → postMessage request string
  → WebTab onMessage
  → DemoShell dependency injection
  → Zod action/tuple validation
  → dispatcher goToAnotherTab
  → tag → index, target URL → HTTPS normalization
  → Zustand selected tab 변경
  → existing WebTab.loadUrl 또는 NativeUsersScreen.refetch
  → BridgeResponse
  → original source WebView calledByNative
```

이 한 흐름 안에서도 다음 state는 합쳐지지 않는다.

- source WebView의 request uuid
- target tab의 selected Zustand state
- target WebView의 document/history
- native tab이라면 Query cache/refetch
- bridge response를 받는 원래 source WebView

#### 대화에서 확인할 질문

- target WebView와 response를 받는 source WebView가 왜 다를 수 있는가?
- bridge 요청 중 tab state가 바뀌어도 source tab callback이 올바르게 돌아가는 근거는 무엇인가?
- network가 끊긴 상태에서 tab 이동 response 성공과 target page load 실패가 동시에 가능할까?

## 대화형 학습 시작점

처음 학습한다면 `1-1 Route source와 기능 source를 구분하기`부터 시작한다. 이미 특정 결함이나 기능을 조사하고 있다면 해당 단원으로 바로 들어갈 수 있지만, Codex는 그 서브 스텝을 설명하기 전에 연결된 선행 state 수명을 짧게 확인한다.

학습 완료 여부는 이 문서를 읽었다는 사실만으로 추정하지 않는다. 각 서브 스텝에서 실제 source 대조와 질문을 마친 뒤 사용자가 명시적으로 확인한 경우에만 완료로 기록한다.
