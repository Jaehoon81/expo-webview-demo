# Expo WebView 데모 소스 주석 읽기 안내서

이 문서는 사용자가 설명을 기다리지 않고 실제 source를 직접 열어 흐름을 따라가기 위한 안내서다. 전체 구조를 먼저 보고 싶으면 [내부 구조와 동작](./architecture-internals.md), Codex와 한 서브 스텝씩 대화하며 학습하려면 [구현 학습서](./learning-guide.md)를 사용한다.

source identifier, API 이름과 path는 원문 그대로 읽고, 한국어 주석은 “이 줄이 보이는 문법”보다 책임·이유·수명·경계를 설명하는 보조 지도다.

## 1. 주석 표식

### `[파일 역할]`

파일이 어느 계층에 있고 어떤 책임을 끝까지 소유하는지 설명한다. 파일을 처음 열면 import보다 이 표식을 먼저 읽는다.

예:

```ts
// [파일 역할] 한 WebView tab의 document/history, imperative navigation,
// bridge 왕복, progress·오류·scroll 상태를 소유합니다.
```

이 문장은 `WebTab`이 URL 정책·기기 기능까지 직접 구현한다는 뜻이 아니다. URL policy는 service, bridge action은 dispatcher와 주입 dependency, 전체 조합은 `DemoShell`이 맡는다.

### `[FLOW-NN]`

여러 파일을 통과하는 canonical 흐름의 시작 표식이다. `FLOW-01`부터 `FLOW-09`까지 각 표식은 production source 전체에서 한 번만 존재한다.

### `[FLOW-NN / N단계]`

canonical 흐름 안에서 실제로 다음 파일·함수로 이동할 지점을 나타낸다. 같은 flow와 단계 번호 조합도 production source 전체에서 한 번만 사용한다.

단계가 source 파일의 위에서 아래 순서와 항상 같지는 않다. 예를 들어 `useUsersQuery`는 파일 아래쪽에 있고 그 안에서 호출하는 `fetchUsers`는 파일 위쪽에 있다. 이 문서의 순서대로 symbol을 찾아가면 된다.

### `[FLOW-NN / 관련 코드]`

canonical 단계는 아니지만 같은 계약을 공유하는 다른 caller·consumer다. 같은 표식은 여러 곳에 있을 수 있다.

예:

- WebView와 FlatList가 같은 scroll helper를 사용함
- 사진·알림 service가 bridge dispatcher dependency로 연결됨
- Query client singleton이 사용자 cache를 보존함

### `[이유]`

더 단순해 보이는 다른 방법 대신 현재 구조를 택한 근거를 설명한다. 이 표식을 읽을 때는 “이 선택을 없애면 어떤 caller가 깨지는가”를 함께 확인한다.

### `[주의]`

문자열·index·native contract, generated file, lifecycle처럼 겉보기보다 변경 파급이 큰 지점을 표시한다.

### `[검증 경계]`

현재 test나 함수가 확인하는 범위와 실제 WebView·OS·기기에서만 알 수 있는 범위를 분리한다. 특히 test의 mock을 production 성공 증거로 확대하지 않기 위한 표식이다.

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

15개 test 파일은 모두 첫 두 줄에 `[파일 역할]`과 `[검증 경계]`가 있다. test를 읽을 때 다음 순서를 사용한다.

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

두 파일에는 inline `[파일 역할]`과 `[검증 경계]` 또는 참고 문서가 있다. Jest setup의 SecureStore mock을 실제 저장 성공으로 해석하지 않는다.

## 6. 주석에서 의도적으로 제외한 것

다음에는 설명을 반복하지 않았다.

- 이름만으로 분명한 StyleSheet 색상·margin·font 값
- JSX 닫기 tag, import 하나마다의 의미
- type이 이미 그대로 말하는 단순 field
- package-lock dependency metadata
- JSON 안의 비표준 comment
- generated `/android`, `/ios`, `.expo`, build output
- `LOCAL_DEMO_HTML` template literal 내부의 TypeScript 설명 주석

특히 local HTML 문자열 안에 설명 comment를 넣으면 WebView가 받는 payload가 바뀐다. 그 파일은 문자열 바깥의 `[파일 역할]`과 FLOW 표식, 이 안내서, 정적 test로 설명한다.

## 7. 혼자 읽을 때 권장 순서

### 첫 번째 통독

1. [내부 구조와 동작](./architecture-internals.md)의 1~4절
2. `FLOW-01` — 앱이 안전하게 시작하는 이유
3. `FLOW-02` — 화면과 instance 수명
4. `FLOW-03`·`FLOW-04` — 일반/popup WebView
5. `FLOW-05` — bridge 왕복
6. `FLOW-06` — deep link와 OS 경계
7. `FLOW-07` — native API와 cache
8. `FLOW-08`·`FLOW-09` — cross-cutting UI/network 상태
9. 관심 flow의 test와 `[검증 경계]`

### 한 기능만 조사할 때

1. 해당 canonical `[FLOW-NN]`을 찾는다.
2. 이 문서의 단계 링크를 따라간다.
3. 각 함수의 caller와 consumer를 `rg`로 검색한다.
4. `[관련 코드]`를 읽어 다른 입력 경로가 있는지 확인한다.
5. 같은 이름의 test와 mock provider를 확인한다.
6. 실제 기기 주장이라면 날짜별 완료 문서의 해당 결과를 별도로 확인한다.

### source와 문서가 다를 때

실행 source와 설치 package/config를 먼저 현재 사실로 확인한다. 문서가 오래됐으면 과거 결과를 삭제하지 않고 최신 절이나 관련 설명만 보완한다. 주석을 읽다가 실제 결함 후보를 발견하면 주석 작업에 실행식 수정을 섞지 말고 별도 Impact Review와 검증 범위로 분리한다.
