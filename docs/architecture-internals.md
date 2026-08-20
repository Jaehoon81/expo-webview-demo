# Expo WebView 데모 내부 구조와 동작

이 문서는 `my-webview-app`의 현재 유지보수용 architecture 지도다. 기능 범위와 완료 상태는 [구현 계획서](./implementation-plan.md), source에 삽입한 canonical 흐름은 [소스 주석 읽기 안내서](./source-commentary-guide.md), 대화형 학습 순서는 [구현 학습서](./learning-guide.md)를 기준으로 한다.

과거 build·실기기 결과는 날짜별 완료 문서에 보존한다. 이 문서는 과거 이력을 반복하지 않고 현재 source가 어떤 책임과 수명을 갖는지 설명한다.

현재 production source의 runtime 흐름은 `FLOW-01`~`FLOW-09`의 유일한 시작 표식 9개와 고유 단계 233개로 연결된다. 같은 깊이에서 갈라지는 입력·기능·결과는 `N-A`, `N-B` branch로 표시하며, 이전 `[관련 코드]` 표식은 사용하지 않는다.

## 1. 저장소 경계와 기준 source

```text
app/
  _layout.tsx                 Root provider와 Expo Router Stack
  index.tsx                   Zustand hydration gate와 DemoShell 진입
  +native-intent.tsx          OS system path rewrite hook

src/
  api/                        JSONPlaceholder 요청과 Query hook
  bridge/                     WebView request schema, dispatcher, type
  components/                 탭 shell, WebView, popup, native 목록과 공용 UI
  constants/                  탭 순서와 최초 URL
  schemas/                    외부 runtime data 검증
  services/                   URL, device ID, 사진, 알림
  store/                      마지막 선택 탭 영속 상태
  types/                      탭과 사용자 domain type
  utils/                      image 크기와 scroll/back 순수 계산
  web/                        첫 탭에 전달하는 local HTML payload

docs/                         계획, architecture, 학습, 검증·handoff 기록
app.json                      app identity, scheme, plugin과 build 입력
eas.json                      EAS internal preview profile
package.json                  dependency, script와 Jest 설정
```

유지 대상과 생성 대상의 경계는 다음과 같다.

| 범위 | 소유권 | 규칙 |
|---|---|---|
| `app/`, `src/`, root config, `docs/` | 사람이 관리하는 기준 source | 기능과 문서 변경은 이 범위에서 검토한다. |
| `/android`, `/ios` | Expo Prebuild 또는 local native build가 만드는 generated project | `.gitignore` 대상이며 직접 고친 내용을 기준 source로 삼지 않는다. |
| `.expo/`, `dist/`, `web-build/` | local/generated output | 문서·commit·민감정보 감사 대상에서 제외한다. |
| `node_modules/` | lockfile에서 재설치하는 dependency output | package API 조사에는 읽을 수 있지만 직접 수정하지 않는다. |
| APK, IPA, signing credential, device log·screenshot | 외부/임시 artifact | 공개 Git에 넣지 않는다. |

`app.json`과 `eas.json`은 JSON이어서 inline 주석을 넣지 않는다. 설정의 의미는 이 문서와 [소스 주석 읽기 안내서](./source-commentary-guide.md)에서 설명한다.

## 2. 전체 runtime 흐름

앱 시작과 WebView bridge의 큰 흐름은 다음 두 축으로 나뉜다.

```text
OS/Expo Router
  └─ app/+native-intent.tsx (필요한 URL만 rewrite)
      └─ app/_layout.tsx (QueryClientProvider + Root Stack)
          └─ app/index.tsx (SecureStore hydration gate)
              └─ DemoShell
                  ├─ WebTab f0 / f1 / f2
                  ├─ NativeUsersScreen f3
                  ├─ BottomTabBar
                  ├─ PopupWebView
                  └─ NetworkStatusBanner / Snackbar
```

```text
LOCAL_DEMO_HTML
  └─ ReactNativeWebView.postMessage(JSON string)
      └─ WebTab.onMessage
          └─ onBridgeMessage prop
              └─ DemoShell의 tab.index closure
                  └─ DemoShell.handleBridgeMessage
                      └─ bridge schema → dispatcher → injected dependency
                          └─ BridgeResponse Promise fulfill
                              └─ handleBridgeMessage와 prop return을 역순으로 통과
                                  └─ WebTab.onMessage의 .then
                                      └─ WebTab.injectJavaScript
                                          └─ window.calledByNative(serialized response)
```

첫 축은 provider·route·화면 수명, 둘째 축은 신뢰할 수 없는 Web 입력과 native 기능의 왕복 경계다. 두 흐름은 `DemoShell`에서 만나지만 validation과 실제 기기 기능은 별도 module이 담당한다.

## 3. 앱 시작, provider와 hydration

### 3.1 Root layout

[`app/_layout.tsx`](../app/_layout.tsx)는 다음 세 요소만 소유한다.

1. app-wide [`queryClient`](../src/query-client.ts)를 받는 `QueryClientProvider`
2. light status bar
3. header를 숨긴 Expo Router `Stack`

Root `Stack`은 Zustand hydration과 관계없이 먼저 mount된다. 3단계 Android cold custom-scheme 검증에서 hydration loading이 Root layout 전체를 막으면 `router.setParams`가 navigation tree보다 먼저 호출되는 문제가 발견됐다. 현재는 loading gate가 index route 안에 있으므로 system path가 cold start로 들어와도 Root Stack이 먼저 존재한다.

Root Stack 선행 mount는 필요하지만 global imperative navigation ref의 `isReady()`까지 같은 시점에 보장하지는 않는다. 2026-08-20 Android에서 최근 앱 task 제거 뒤 custom scheme으로 cold start했을 때, `DemoShell`의 첫 passive effect가 Expo Router `NavigationContainer.onReady`보다 먼저 global `useRouter().setParams`를 호출해 같은 오류와 하얀 화면을 다시 만들었다. Cleanup 대상을 mount된 index route의 `useNavigation()` 객체로 옮긴 뒤에는 Cold 화면이 복구됐지만, 첫 effect에서 즉시 보낸 param 변경이 navigation state 초기화 중 반영되지 않아 같은 Web URL의 다음 Warm intent가 route 변경을 만들지 못하는 후속 race가 확인됐다. 현재는 mount commit 다음 `requestAnimationFrame`에서 current-route `replaceParams({})`로 params를 완전히 교체하고 effect cleanup에서 예약 frame을 취소한다. Global ref, Android 전용 branch와 retry state는 사용하지 않는다.

### 3.2 Zustand persist와 index gate

[`src/store/app-store.ts`](../src/store/app-store.ts)는 두 종류의 상태를 구분한다.

| 상태 | 초기값 | 저장 여부 | 소비자 |
|---|---:|---|---|
| `selectedTabIndex` | `0` | SecureStore에 저장 | `DemoShell`, `BottomTabBar` |
| `hasHydrated` | `false` | 저장하지 않음 | `app/index.tsx` |

Zustand `persist`는 `my-webview-app-settings` key로 JSON을 읽는다. `partializeAppState`는 `selectedTabIndex`만 남기고, `mergePersistedAppState`는 외부 저장값이 실제 `0`~`3` integer인지 다시 확인한다. 손상된 값은 현재 기본값 `0`을 유지한다.

`onRehydrateStorage`는 읽기 성공뿐 아니라 오류 또는 state 부재 경로에서도 `hasHydrated`를 `true`로 전환한다. 따라서 SecureStore 문제가 loading 화면을 영구 유지시키지는 않는다. 오류는 경고로 남고 app은 기본 탭으로 진행한다.

[`app/index.tsx`](../app/index.tsx)는 hydration 전 접근 가능한 progress UI만 표시한다. 완료 뒤 top safe area를 적용하고 `DemoShell`을 처음 mount한다. 하단 safe area는 `BottomTabBar`가 직접 소유한다.

### 3.3 Query client

[`src/query-client.ts`](../src/query-client.ts)의 singleton은 Root provider 수명 동안 유지된다. 사용자 목록 Query는 다음 자동 동작을 사용하지 않는다.

- reconnect 자동 refetch
- window focus 자동 refetch
- 공통 query·mutation retry

사용자 API의 제한된 한 번 retry는 [`src/api/users.ts`](../src/api/users.ts)가 query별 함수로 별도 지정한다. 연결 복귀 뒤 결과를 자동으로 바꾸지 않고 사용자가 화면의 retry, pull-to-refresh 또는 탭 재선택을 실행하게 하는 것이 이 데모의 관찰 가능한 계약이다.

## 4. `DemoShell`과 상태 수명

[`src/components/DemoShell.tsx`](../src/components/DemoShell.tsx)는 모든 기능을 직접 구현하는 화면이 아니라 이미 분리된 module을 조합하는 orchestration layer다.

### 4.1 소유 상태와 ref

| 값 | 종류 | 수명·역할 |
|---|---|---|
| `selectedTabIndex` | Zustand persisted state | app 재실행 뒤 복원되는 마지막 탭 |
| `bridgeBottomBarVisible` | React state | Web bridge의 show/hide 의도 |
| `scrollBottomBarVisible` | React state | active child의 scroll/popup 의도 |
| `keyboardVisible` | React state | platform keyboard event 동안의 hide 조건 |
| `popupUrl` | React state | null이면 닫힘, URL이면 한 popup session |
| `snackbarMessage` | React state | iOS toast 대체 메시지 |
| `webTabRefs` | imperative refs | mount된 세 WebView의 load/reload/history 명령 |
| `nativeUsersRef` | imperative ref | native 목록 refetch 명령 |
| `popupRef` | imperative ref | Android back이 popup history를 먼저 소비하기 위한 명령 |
| `lastBackPressRef` | mutable ref | render와 무관한 Android back 시간 기록 |
| `bottomBarTranslateY` | Animated value | 하단 바 native-driver 위치 |

React state는 표시를 다시 계산하고, ref는 최신 명령 상태를 보관하지만 값 변경 자체로 render하지 않는다. SecureStore의 persisted state, TanStack Query cache, WebView 내부 history도 각각 별도 수명이다.

### 4.2 mount를 유지하는 네 탭

`DemoShell`은 `TAB_DEFINITIONS.slice(0, 3)`으로 세 `WebTab`을 항상 만들고 그 뒤 `NativeUsersScreen`도 항상 같은 tree에 둔다.

- active WebView: opacity 기본값, pointer input과 accessibility 허용
- inactive WebView: `opacity: 0`, `pointerEvents="none"`, accessibility descendants 숨김
- `collapsable={false}`: React Native 최적화로 inactive wrapper가 native hierarchy에서 제거되지 않게 함
- native tab: component instance는 유지하지만 inactive UI는 `display: "none"`

이 구조 때문에 Web tab 전환만으로 document, form 값, cookie와 back/forward history가 초기화되지 않는다. 현재 Web tab을 다시 누른 경우에만 `reloadInitial()`이 key를 바꿔 새 WebView document를 만든다. native tab 재선택은 `refetch(true)`로 Query를 새로 요청한다.

`reloadOtherTabs` bridge action도 같은 ref를 사용한다. 요청을 보낸 WebView를 제외한 두 WebView를 최초 source로 되돌리고, native tab은 과거 활성화 이력이 있을 때만 refetch한다. 사용자가 한 번도 열지 않은 native tab의 첫 HTTP 요청을 background bridge가 시작하지 않게 하기 위함이다.

## 5. 일반 WebView navigation과 history

[`src/components/WebTab.tsx`](../src/components/WebTab.tsx)는 tab 하나의 다음 상태를 소유한다.

- 현재 `source`와 새 document를 만드는 `reloadKey`
- load progress와 표시할 `loadError`
- native WebView가 보고한 `canGoBack`·`canGoForward`
- 첫 document load 완료 여부
- native navigation callback이 마지막으로 보고한 현재 URL
- Android source를 기본 GET과 명시적 `GET` 형태로 번갈아 전달할 순서
- 직전 scroll offset
- iOS error recovery 중 합성 scroll 차단 여부

### 5.1 URL load 경계

`loadUrl(url)`은 호출 시점에 따라 다르게 동작한다.

| 시점 | 처리 | 이유 |
|---|---|---|
| 첫 document `onLoadEnd` 전 | `setSource({ uri: url })` | 아직 JavaScript를 주입할 document가 없음 |
| 첫 document load 후, Android | 기존 URL policy를 직접 호출한 뒤 현재 URL이면 `reload()`, 다른 허용 URL이면 같은 key의 `source` 변경 | app이 시작한 native `loadUrl()`은 policy callback을 자동 호출하지 않으므로 먼저 검사하고 native history에 새 navigation을 남김 |
| 첫 document load 후, iOS | `window.location.assign(url)` 주입 | 기존 WebView instance와 history를 유지 |
| 현재 탭 재선택 또는 초기 화면 | `reloadInitial()`로 key 증가 | error/history를 비우고 최초 source의 새 session 생성 |

iOS 주입 URL은 `JSON.stringify`로 JavaScript 문자열 literal을 만든다. bridge response도 response JSON을 다시 함수 인자용 JSON 문자열로 직렬화해 quote나 script 문자가 inject expression을 깨지 않게 한다.

Android에서는 React의 마지막 `source`와 native WebView의 현재 URL이 같은 수명이 아니다. 예를 들어 Naver에서 app 명령으로 Nate를 연 뒤 native Back으로 Naver에 돌아오면 React `source`는 여전히 Nate지만 native 현재 URL은 Naver다. 이때 Nate를 다시 요청해도 동일한 source object 내용이면 React Native가 native setter를 다시 실행하지 않을 수 있다. `WebTab`은 `onNavigationStateChange`의 URL을 `currentUrlRef`에 저장하고, 다른 target을 열 때 method 생략과 명시적 `GET`을 번갈아 사용한다. 두 표현은 모두 GET request지만 source prop 모양이 달라져 Back 뒤 같은 target 재호출도 RNWV Android의 `source` setter와 native `loadUrl()`에 다시 도달한다. WebView key는 바꾸지 않으므로 기존 history session은 유지된다.

### 5.2 navigation decision

[`src/services/url-router.ts`](../src/services/url-router.ts)는 실행 대신 decision만 반환한다.

| 입력 | decision | `DemoShell` 실행 |
|---|---|---|
| `https:` | `allow` | 현재 WebView에 허용 |
| `http:` | `block-http` | load 중단과 안전하지 않은 연결 안내 |
| demo custom scheme | `deep-link` | app tab/URL 이동 후 WebView load 중단 |
| `tel:`, `sms:`, `mailto:`, 기타 외부 scheme | `external` | `Linking.openURL`로 OS에 위임 |
| `about:blank`, `data:`, `blob:` | `allow` | WebView 내부 문서 흐름 허용 |
| parse할 수 없는 값 또는 기타 `about:` | `ignore` | 조용히 중단 |

`originWhitelist={["*"]}`는 모든 URL을 무조건 load한다는 뜻이 아니다. URL을 `onShouldStartLoadWithRequest`까지 전달하고 위 policy가 최종 boolean을 결정하게 한다. WebView의 `mixedContentMode="never"`도 함께 유지한다.

### 5.3 native WebView 자동 callback 계약

React가 `key`와 `source`를 commit하면 native WebView가 request를 시작한다. Android에서 app이 `source`로 시작한 native load는 `onShouldStartLoadWithRequest`를 자동 호출하지 않는다. 최초 상수 source는 이미 앱이 정한 값이고, document load 뒤 `loadUrl`이 만든 source 변경은 `FLOW-03 / 2-D단계`에서 parent policy를 먼저 직접 호출한다. 반면 page link·redirect 같은 WebView navigation은 등록된 callback의 `true`/`false`를 받은 뒤 계속하거나 중단한다.

이 프로젝트의 Expo SDK 54 권장·설치 version인 `react-native-webview` `13.15.0` 문서와 wrapper source에서 확인한 등록 callback 순서는 다음과 같다.

| lifecycle | app callback 순서 | source FLOW |
|---|---|---|
| load 시작 | `onLoadStart` → `onNavigationStateChange(start)`; `onLoadProgress`는 진행 중 반복 | FLOW-03 `8`, `9-A`, `9-B` |
| 성공 | `onLoad` → `onLoadEnd` → `onNavigationStateChange(end)` | FLOW-03 `10-A`~`12-A` |
| 일반 실패 | `onError` → `onLoadEnd` | FLOW-03 `10-B`, `11-B` |
| HTTP 오류 | 별도 `onHttpError`; 일반 finish event가 이어질 수 있음 | FLOW-03 `10-C` |
| Web message | page의 `postMessage` → `onMessage` | FLOW-05 `2`~`4` |
| 새 창 | page의 `window.open`/`_blank` → `onOpenWindow` | FLOW-04 `1`~`2` |

`onNavigationStateChange` callback 하나는 시작과 성공 종료 event를 모두 받으므로 history ref를 두 시점에 갱신한다. 이 표는 JavaScript callback contract이며 실제 Android/iOS native event timing의 실기기 증거와는 구분한다.

### 5.4 platform history

- Android hardware back은 `DemoShell`에서 popup → 현재 WebView → app exit 순서로 처리한다.
- iOS Web tab은 상단 back/forward button을 표시하며 WebView swipe gesture도 허용한다.
- `canGoBack`·`canGoForward`는 React state가 아니라 ref다. button/back handler가 눌린 순간 최신 native navigation state를 동기적으로 읽고 boolean을 반환하기 위함이다.
- 2026-08-20 LG `LM-V500N` Android 12 실기기에서 custom-scheme link와 bridge `goToAnotherTab` 두 경로 모두 Naver `history.length=1`에서 Nate `history.length=2`를 만들었고, hardware Back 뒤 app process를 유지하며 Naver로 복귀했다. Back 후 같은 Nate 재호출과 현재 Nate 재호출 reload도 각각 확인했다.

## 6. popup WebView

새 창 요청은 source `WebTab`이 URL과 source tab index를 `DemoShell`로 올린다. `classifyPopupUrl`의 결과는 다음과 같다.

| 분류 | 예 | 처리 |
|---|---|---|
| `parent` | local base URL, 네이버·다음·네이트 mobile host | source WebView의 `loadUrl`로 history에 이어서 load |
| `external` | Instagram·Facebook·Twitter host, 비 HTTPS | OS 외부 앱/브라우저 |
| `popup` | 그 외 HTTPS, 예: Bing | `popupUrl` state로 full-screen modal open |

[`src/components/PopupWebView.tsx`](../src/components/PopupWebView.tsx)는 root와 분리된 Modal native tree이므로 내부 `SafeAreaProvider`를 다시 만들고 top edge만 적용한다. bottom에는 별도 toolbar가 없으며 popup이 열려 있는 동안 root 하단 tab은 숨긴다.

popup 내부의 navigation도 일반 URL 정책을 다시 거친다. popup에서 또 발생한 `window.open`은 modal을 중첩하지 않고 현재 popup URL을 바꾸거나 외부 앱으로 보낸다.

`popupUrl` 변경 뒤 React commit이 reset effect와 새 WebView mount를 만들고, 그 뒤 native가 등록된 callback을 호출한다. Android 최초 popup `source`는 일반 tab과 마찬가지로 `onShouldStartLoadWithRequest`를 생략한다. 이후 `onLoadStart`·`onLoadProgress`·`onNavigationStateChange` 또는 `onError`·`onHttpError`가 popup 자신의 progress/history/error state만 갱신한다. 이 경로는 FLOW-04 `7`~`14-B`에 단계별로 표시돼 있다.

popup close/back 우선순위는 다음과 같다.

1. popup history가 있으면 `goBack()`
2. history가 없으면 popup close
3. header close button은 history와 무관하게 즉시 close
4. close 시 `popupUrl=null`, scroll 하단 바 visibility 복원

## 7. WebView load·오류 복구

일반 `WebTab`은 native 기본 오류 화면을 app overlay로 대체한다.

- `onError`: native description 보관, 기본 오류 UI 방지
- `onHttpError`: HTTP status와 description 보관
- `다시 시도`: 현재 WebView `reload()`
- `초기 화면`: error/history/load flag를 초기화하고 최초 source로 새 document 생성

`DemoShell`이 계산한 `BOTTOM_TAB_BASE_HEIGHT + safe-area bottom`을 `WebTab`과 `NativeUsersScreen`에 전달한다. loading과 error content의 bottom padding에 같은 값을 더해 absolute 하단 바가 겹치지 않는 실제 가시 영역 중앙을 맞춘다.

iOS WKWebView는 offline retry·초기 화면 전환 중 실제 사용자 gesture가 아닌 scroll event를 보낼 수 있다. `iosErrorRecoveryRef`는 오류 발생부터 다음 성공 `onLoad`까지 이 합성 scroll을 하단 바 visibility에서 제외한다. Android scroll 경로는 이 조건을 사용하지 않는다.

popup은 실패 시 WebView container를 숨기고 별도 retry/close content를 표시한다. popup error와 일반 tab error는 서로 다른 session state이며 한쪽 오류가 다른 tab을 덮지 않는다.

## 8. Bridge request와 response

### 8.1 신뢰 경계

local HTML이 보내는 값도 runtime에서는 외부 입력으로 취급한다. [`src/bridge/schema.ts`](../src/bridge/schema.ts)는 `action`을 판별 property로 하는 strict Zod union을 사용한다.

```ts
type BridgeResponse<T = unknown> = {
  uuid: string;
  action: BridgeAction | string;
  result: T;
  isError: boolean;
};
```

잘못된 JSON, unknown action, 누락·오류 parameter는 dependency를 호출하지 않는다. 가능한 경우 `readBridgeEnvelope`가 원래 `uuid`와 `action`만 보존하고, 그마저 읽을 수 없으면 `unknown`을 사용한다.

[`src/bridge/dispatcher.ts`](../src/bridge/dispatcher.ts)는 Expo API와 React component를 직접 import하지 않는다. `DemoShell`이 현재 refs, state setter와 service 함수를 `BridgeDependencies`로 주입한다. 이 구조는 action 분기를 unit test할 수 있게 하고 UI/native 구현 수명과 dispatcher를 분리한다.

### 8.2 request와 response의 왕복

Bridge는 dispatcher 호출까지만 내려가는 단방향 흐름이 아니다. `BridgeResponse`가 fulfill된 뒤 같은 caller chain을 역순으로 올라가 원래 sender WebView에 돌아오는 것까지 하나의 계약이다.

```text
FLOW-05
1 request 생성 → 2 postMessage → 3 onMessage 자동 callback
→ 4 WebTab.onBridgeMessage(data)
→ 5 DemoShell tab.index closure → 6 handleBridgeMessage
→ 7~13 parse·action dependency·공통 envelope
→ 14 dispatchBridgeMessage Promise fulfill
→ 15 handleBridgeMessage가 같은 Promise return
→ closure와 prop return을 역순으로 통과
→ 16 WebTab의 .then(response)
→ 17 injectBridgeResponse → 18 calledByNative parse → 19 종료
```

`onMessage` 안의 `void`는 React Native event callback의 반환값을 버릴 뿐, `onBridgeMessage(...).then(...)`의 실행을 취소하지 않는다. tab index closure 때문에 dependency는 sender를 식별하고, `.then` closure 때문에 response는 tab state가 중간에 바뀌어도 요청을 보낸 원래 `WebTab` instance에 주입된다.

### 8.3 action별 책임

| Action | 입력 | 실행 주체 | 성공 result |
|---|---|---|---|
| `getDeviceUUID` | 없음 | `device-id.ts` | UUID string |
| `showToastMessage` | message | Android `ToastAndroid` / iOS `Snackbar` | message |
| `showNotiMessage` | title, optional body | `notification-service.ts` | title |
| `reloadOtherTabs` | 없음 | `DemoShell` child refs | 빈 string |
| `goToAnotherTab` | tab tag, URL | `DemoShell`, URL normalizer | 빈 string |
| `showBottomNaviView` | 없음 | bridge visibility state | 빈 string |
| `hideBottomNaviView` | 없음 | bridge visibility state | 빈 string |
| `getPhotoImages` | 없음 | `photo-service.ts` | `{ name, base64Image }[]` |

dependency가 던진 `Error`도 같은 envelope의 `isError: true`로 바뀐다. WebView는 성공과 실패 모두 `calledByNative(message)` 한 callback에서 처리한다.

## 9. Device ID, 사진과 알림

### 9.1 Device ID

[`src/services/device-id.ts`](../src/services/device-id.ts)는 OS serial·advertising ID를 읽지 않는다. `Crypto.randomUUID()`로 앱 자체 demo UUID를 만들고 `my-webview-app-device-id` key로 SecureStore에 저장한다.

module-level `deviceIdPromise`는 같은 process에서 동시 요청이 하나의 읽기/생성 작업을 공유하게 한다. 실패한 Promise는 cache에서 제거해 다음 bridge 호출이 다시 시도할 수 있다.

### 9.2 사진

[`src/services/photo-service.ts`](../src/services/photo-service.ts)의 순서는 다음과 같다.

1. 기존 media library 권한 확인
2. 필요할 때만 권한 요청
3. 최대 두 장 multi-select picker open
4. 취소·빈 선택은 Error
5. 긴 변이 1000px를 넘는 경우 한 축만 지정해 비율 유지 resize
6. 각 사진을 순차 render하고 PNG base64 생성
7. 사진 이름과 base64 배열 반환

순차 처리는 여러 큰 원본의 render/base64 memory 사용이 동시에 겹치는 것을 피한다. 선택 image는 runtime response에만 존재하며 repository나 SecureStore에 저장하지 않는다.

### 9.3 local notification

[`src/services/notification-service.ts`](../src/services/notification-service.ts)는 remote push token·server push를 사용하지 않는다.

1. process-wide foreground handler를 한 번 구성
2. Android에서 `webview-demo` channel 생성
3. 사용 시점에 notification 권한 확인·요청
4. 아직 예약된 같은 demo source 알림만 취소
5. 1초 뒤 한 번 실행되는 local notification 예약
6. DemoShell mount 동안 수신/응답 listener 유지
7. notification tap 또는 app active 시 badge를 0으로 정리

listener cleanup은 DemoShell unmount 때 수행한다. handler flag와 listener subscription은 서로 다른 수명이다.

## 10. Deep link와 외부 앱

동일한 demo deep link에는 두 진입 경로가 있다.

### 10.1 OS에서 app으로 진입

```text
mywebviewapp://webviewappdemo?target=1&url=m.nate.com
  → app/+native-intent.tsx
  → rewriteIncomingSystemPath
  → /?demoDeepLink=<encoded canonical URL>
  → DemoShell useLocalSearchParams
  → parseDemoDeepLink
  → applyDeepLink
  → next UI frame requestAnimationFrame
  → current index route navigation.replaceParams({})
```

`applyDeepLink`는 tab을 먼저 선택하고, Web tab에 URL이 있으면 기존 instance의 `loadUrl`을 호출한다. 처리한 query는 다음 UI frame에 `useNavigation()`이 반환한 현재 index route의 `replaceParams({})`로 완전히 제거한다. 이 한 frame 지연은 Cold 첫 route commit 뒤 cleanup을 보장해 같은 OS URL이 Warm 상태에서 다시 들어왔을 때 새 query 변경으로 인식되게 한다. Effect가 frame 전에 정리되면 `cancelAnimationFrame`으로 예약을 취소한다. Global `useRouter().setParams`는 cold mount에서 navigation ref 준비를 가정하므로 이 cleanup에 사용하지 않는다.

OS 입력은 FLOW-06 `1-A`~`6-A`, 일반 WebView 입력은 `1-B`~`3-B`, popup 입력은 `1-C`·`3-C`를 거친 뒤 공통 `7`단계 handler와 `8`단계 parser에 합류한다. invalid 입력은 `9-A`에서 state 변경 없이 끝나고, valid 입력은 `9-B`→`10`→Web `11-A` 또는 native `11-B`로 갈라진 뒤 `12`에서 boolean을 caller에 반환하고 `13-A`~`13-C`에서 종료한다. app이 처리하지 않는 외부 scheme만 `2-D`→`3-D Linking.openURL`→`4-D`에서 별도로 종료한다.

### 10.2 WebView 내부에서 app으로 이동

WebView가 같은 custom scheme을 누르면 `classifyNavigationUrl`이 즉시 `deep-link`로 분류한다. OS로 내보냈다가 다시 들어오지 않고 `DemoShell.applyDeepLink`를 직접 호출하므로 Expo Go에서도 같은 탭 이동 계약을 확인할 수 있다.

외부 OS가 `mywebviewapp://`을 앱에 전달하는 package/scheme 등록과 cold/warm launch는 Expo Go 내부 link test로 대신할 수 없다. 이 경계는 Android development build와 iOS Preview Build 실기기 결과를 따른다.

`Linking.openURL`의 성공은 대상 앱이 실제로 처리할 수 있는지에 달려 있다. rejection은 공통 Alert로 끝내며 앱이 설치되지 않은 경우를 crash로 확대하지 않는다.

## 11. 네이티브 사용자 목록과 Query cache

[`src/components/NativeUsersScreen.tsx`](../src/components/NativeUsersScreen.tsx)의 `active` prop은 Query `enabled`로 전달된다. app 시작 시 f3가 선택되지 않았다면 첫 HTTP 요청도 시작하지 않는다.

```text
NativeUsersScreen(active)
  → useUsersQuery(enabled)로 Query observer 등록
      ├─ enabled=false: observer/cache 유지, queryFn 자동 호출 없음
      └─ enabled=true이고 fetch 필요: TanStack Query가 queryFn 자동 호출
          → Axios GET /users (AbortSignal, 10s timeout)
              → parseUsersResponse(unknown)
                  → User[] 또는 error
                      → TanStack Query cache ['users'] 갱신
                          → observer 통지 → React 재render
                              → pending / error / empty / list UI
```

FLOW-07의 `3`~`10`단계가 이 library callback과 consumer 순서를 고정한다. 최초 결과 effect는 `11-A`·`11-B`에서 한 번만 Alert를 내고, retry button·tab 재선택·pull-to-refresh·bridge는 `12-A`~`12-D`에서 공통 `13`단계 `refetch()`로 합류한다.

retry 정책은 다음과 같다.

| 실패 | 자동 retry |
|---|---|
| response 없는 network error | 한 번 |
| HTTP 5xx | 한 번 |
| HTTP 4xx | 없음 |
| Abort/cancel | 없음 |
| Zod parsing error | 없음 |

iOS pull 결과는 request 완료와 `onScrollEndDrag` 중 어느 event가 먼저인지에 따라 두 경로가 된다. request가 먼저면 `15-B → 16-A pending → 17 drag 종료 → 15-B 재진입 → 16-B timer → 18 Alert`, drag가 먼저면 `17 → 15-B → 16-B → 18`이다. Android와 일반 retry는 `15-A`에서 즉시 Alert를 표시한다. 화면은 `19`에서 최신 Query cache를 유지하며 종료한다.

성공 data는 5분 동안 fresh다. 그러나 사용자가 pull-to-refresh, 오류 retry 또는 현재 native tab을 재선택하면 `refetch()`를 명시적으로 호출한다.

최초 active fetch 결과는 한 번만 Alert로 알린다. 이후 사용자가 시작한 refetch는 해당 명령 경로가 결과를 알린다. iOS pull-to-refresh 중에는 손을 떼기 전 Alert가 native refresh gesture와 경쟁하지 않도록 drag 종료 뒤 300ms 지연하며, component unmount 때 timer를 취소한다.

## 12. 하단 탭 visibility와 safe area

하단 바의 실제 표시식은 다음과 같다.

```ts
bridgeBottomBarVisible && scrollBottomBarVisible && !keyboardVisible
```

각 입력의 소유자가 다르다.

| 입력 | 변경 주체 | 복원 계기 |
|---|---|---|
| bridge visibility | local HTML bridge action | `showBottomNaviView` 또는 새 tab 선택 |
| scroll visibility | active WebView/FlatList, popup | 위 scroll, tab 선택, popup close |
| keyboard visibility | platform keyboard event | keyboard hide event |

`getScrollDirection`은 8px 미만 변화는 무시하고, 이전 offset이 양수인데 현재가 top 이하이면 즉시 `up`을 반환한다. inactive child의 scroll은 `WebTab`이 parent로 보내지 않는다.

`BottomTabBar`는 bottom safe-area padding을 직접 적용한다. `DemoShell`은 base height 60과 inset의 합을 animation 이동 거리 및 child content bottom inset으로 함께 사용한다. 숨김은 `translateY`로 수행하고 `pointerEvents="none"`을 함께 적용해 화면 밖 tab이 입력을 받지 않게 한다.

## 13. Network 상태와 복구 경계

`Network.useNetworkState()`의 `type === NONE`만 명시적 offline으로 판정한다. 초기 `UNKNOWN`은 offline으로 표시하지 않는다.

`NetworkStatusBanner`는 전역 연결 상태 안내일 뿐 request 성공 여부의 원본이 아니다.

- WebView 실패: 각 `WebTab` 또는 `PopupWebView`가 오류를 소유
- 사용자 API 실패: TanStack Query result가 오류를 소유
- network 복원: banner는 사라지지만 실패한 request를 자동 재실행하지 않음
- recovery: WebView retry/초기 화면, API retry/pull/reselect를 사용자가 실행

이 분리는 “연결되어 있음”을 “서버·URL 요청 성공”으로 잘못 해석하지 않게 한다.

## 14. Android와 iOS platform 경계

| 기능 | Android | iOS |
|---|---|---|
| Web history UI | hardware back | 상단 back/forward + swipe |
| app exit | 2초 안에 back 두 번 | OS 기본 app lifecycle |
| bridge toast | `ToastAndroid` | app 내부 `Snackbar` |
| keyboard event | `keyboardDidShow/Hide` | `keyboardWillShow/Hide` |
| WebView error scroll | 일반 scroll 경로 유지 | 성공 load 전 합성 scroll 차단 |
| pull refresh Alert | 결과 직후 | drag 종료 뒤 지연 |
| notification channel | `webview-demo` 필요 | channel 없음 |
| OS deep-link Cold cleanup·동일 Warm 재입력 | 다음 UI frame의 current-route `useNavigation().replaceParams({})`; task 제거 Cold와 동일 Web URL Warm 재호출 통과 | 같은 공통 TypeScript 경로 사용; 수정 전 사용자 Cold 확인은 정상, 수정 뒤 새 build·실기기 검증은 미수행 |

공통 TypeScript source라도 native WebView, keyboard, notification, safe area와 gesture timing은 platform runtime에 의존한다. 조건문 test는 JS branch를 확인할 뿐 실제 native event timing을 증명하지 않는다.

## 15. Config와 build 입력

### `package.json`

- entry: `expo-router/entry`
- Expo SDK: `~54.0.35`
- React Native: `0.81.5`
- React: `19.1.0`
- WebView: `13.15.0`
- Jest preset: `jest-expo`
- `@/` alias: repository root

2026-08-20 설치 기준은 `expo@54.0.36`, `expo-constants@18.0.13`, `jest-expo@54.0.17`이다. 현재 Expo SDK 54 metadata는 각각 `~54.0.37`, `~18.0.14`, `~54.0.18`을 권장하므로 `npx expo install --check`와 `npx expo-doctor`는 이 세 patch mismatch만 보고한다. Android history 수정은 package·lockfile·native config를 바꾸지 않았으며 dependency 갱신은 별도 범위다.

### `app.json`

- app name/slug: `my-webview-app`
- scheme: `mywebviewapp`
- Android package/iOS bundle identifier: `com.jaehoon.mywebviewapp`
- plugins: Router, SplashScreen, Notifications, ImagePicker, SecureStore, Asset
- ImagePicker는 사진 설명만 선언하고 camera·microphone permission은 사용하지 않는다.
- EAS project owner와 public project ID는 build 연결 metadata이며 signing credential이 아니다.

### `eas.json`

`preview` profile은 `distribution: "internal"`만 지정한다. App Store/TestFlight/production 배포 설정이 아니다.

package, plugin, app identity, native config를 바꾸면 기존 설치 binary와 JavaScript source의 호환 경계를 다시 검토하고 development/preview build 필요 여부를 판단해야 한다.

## 16. 자동 test가 고정한 계약

현재 16개 suite·55개 test는 다음 좁은 계약을 고정한다.

- DemoShell의 OS deep-link 적용과 current-route query cleanup 선택
- bridge action dispatch와 error envelope
- URL/deep-link parsing과 system path rewrite
- user schema와 retry policy
- Zustand persisted field와 invalid value fallback
- WebTab mount 유지, iOS `location.assign`, Android URL policy·native source·Back 뒤 같은 target 재호출·현재 URL reload, error inset와 platform recovery branch
- NativeUsersScreen activation/refetch와 pull result timing branch
- BottomTabBar, NetworkStatusBanner, Popup safe-area component contract
- image size, scroll/back 순수 함수
- local HTML의 action/DOM/CSS 정적 존재

Jest의 SecureStore·Query Hook·WebView·Alert·bridge dependency mock은 실제 기기 기능을 대체한다. 따라서 test 통과를 다음 주장으로 확대하지 않는다.

- 실제 WebView page/history/cookie 동작
- OS custom scheme cold/warm launch
- 사진 권한·picker·image encode 결과
- local notification tray와 lifecycle
- 실제 network 단절·복원
- Android/iOS safe area, keyboard, gesture와 hardware back

이 범위는 날짜별 build·실기기 문서에 있는 실제 증거와 결합해 판단한다.

## 17. 변경 영향 지도

| 변경하려는 것 | 먼저 확인할 caller·consumer | 최소 검증 방향 |
|---|---|---|
| tab index/tag/order | tabs constant, navigation type, bridge schema, deep link, refs, tests | typecheck + 관련 tests + tab/runtime 표적 확인 |
| WebView mount/history | DemoShell mapping, WebTab key/ref, popup, Android/iOS navigation | WebTab tests + 양 platform history 표적 확인 |
| bridge action | local HTML, types, schema, dispatcher, DemoShell dependency, callback | dispatcher/local HTML tests + 해당 기기 기능 |
| custom scheme | app config, native intent, URL parser, DemoShell params/current-route navigation | parsing·DemoShell tests + 새 binary 여부 + cold/warm 실기기 |
| 사진/알림 | app plugin, service, dispatcher, permissions | pure tests + build 필요 여부 + 권한 실기기 |
| user API/cache | type, schema, Axios, Query client, screen | schema/retry/screen tests + 실제 network 표적 확인 |
| persist state | Zustand type, partialize/merge, hydration gate | store/index tests + app restart 확인 |
| bottom inset/visibility | scroll utility, children callbacks, animation, popup, keyboard | component tests + Android/iOS layout·gesture 확인 |

source·config 동작을 바꾸기 전에는 실제 caller와 consumer를 다시 조사해 Impact Review를 제시한다. 주석이나 문서에서 결함 후보를 발견해도 같은 변경에 조용히 섞지 않고 별도 source 변경으로 분리한다.
