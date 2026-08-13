# Expo WebView 데모 앱 구현 계획

- 작성일: 2026-08-07
- 대상 프로젝트: `my-webview-app`
- 대상 플랫폼: Android, iOS
- 기준 런타임: Expo SDK 54 / Expo Go 우선
- 상태: 1~4단계와 오프라인 후속 검증 완료, 5단계 진행 중

## 1. 목표와 기준

Android `WebViewAppDemo`와 iOS `WebViewAppDemo`의 사용자 기능을 Expo 기반 React Native 앱으로 컨버팅한다. 두 참고 앱의 OS별 표현 차이는 React Native 방식으로 통합하되, 사용자가 확인할 수 있는 기능과 흐름은 빠뜨리지 않는다.

안전한 기능 동등성을 기준으로 다음 원칙을 적용한다.

- 네 개 하단 탭, WebView 탐색, 팝업, 네이티브 bridge, 사진, 알림, deep link, 네이티브 API 목록을 모두 구현한다.
- SSL 인증서 무시, cleartext HTTP, ATS 전체 허용, 결제 앱별 package/scheme/store fallback은 복제하지 않는다.
- 알림과 사진 권한은 기능 사용 시점에만 요청하며, 거부해도 앱을 종료하지 않는다.
- 앱 이름과 slug는 `my-webview-app`, scheme은 `mywebviewapp`으로 유지한다.
- Android package와 iOS bundle identifier는 `com.jaehoon.mywebviewapp`을 사용한다.
- Expo Go에서 전체 핵심 기능을 검증하고, OS가 외부에서 `mywebviewapp://`을 실행하는 경로만 development build에서 별도로 검증한다.

## 2. 참고 프로젝트 적용 범위

### 참고 프로젝트 1

- Android: `D:\Development\Android\Workspaces\WebViewAppDemo`
- iOS: `D:\Development\iOS\Workspaces\WebViewAppDemo`

다음 기능을 동등하게 구현한다.

1. 네 개 하단 탭
   - `f0` / `메인화면`: 로컬 HTML
   - `f1` / `네이버`: `https://m.naver.com`
   - `f2` / `다음`: `https://m.daum.net`
   - `f3` / `네이티브`: 공개 API 목록
2. 탭 상태 유지, 마지막 선택 탭 저장, 현재 탭 재선택 시 reload/refetch
3. 아래 스크롤·키보드·bridge 요청에 따른 하단 탭 바 숨김 및 복원
4. 로컬 HTML의 Google, Bing 팝업, `tel`, `sms`, `mailto`, 자체 deep link
5. 다음 8개 bridge action
   - `getDeviceUUID`
   - `showToastMessage`
   - `showNotiMessage`
   - `reloadOtherTabs`
   - `goToAnotherTab`
   - `showBottomNaviView`
   - `hideBottomNaviView`
   - `getPhotoImages`
6. `calledByNative(message)` callback과 사진 두 장 미리보기
7. WebView progress, 팝업 back/close, 오류 및 재시도, 외부 앱 링크
8. Android hardware back과 두 번 눌러 종료, iOS back/forward UI 및 swipe
9. deep link의 `target`과 `url` 처리
10. 네이티브 목록의 최초 요청, 재요청, loading/error/empty/success 상태

### 참고 프로젝트 2

- Expo/React Native: `D:\Development\ReactNative\Workspaces\my-sample-app`

다음 구조만 선별해 적용한다.

- root `QueryClientProvider`
- API, schema, domain type 분리
- Axios `AbortSignal`과 10초 timeout
- 외부 응답을 `unknown`으로 받은 뒤 Zod 검증
- Zustand persist와 hydration gate
- Jest 및 React Native Testing Library 검증

React Hook Form은 입력 폼이 없어 제외하고, Expo SQLite도 구조화된 로컬 데이터나 오프라인 저장 요구가 없어 제외한다.

## 3. 아키텍처와 의존성

Expo Router는 유지하되 단일 route에서 사용자 정의 탭 셸을 렌더링한다.

- `app/_layout.tsx`: Query provider, hydration gate, 숨김 Stack header
- `app/index.tsx`: `DemoShell` 진입점
- `app/+native-intent.tsx`: OS에서 들어온 demo deep link를 index route로 안전하게 재작성
- `src/components`: 탭 셸, WebView, 팝업, 하단 탭 바, 네이티브 목록, snackbar
- `src/bridge`: request/response schema, dispatcher, bridge type
- `src/services`: device ID, 사진, 알림, URL/deep-link 처리
- `src/api`, `src/schemas`, `src/types`: JSONPlaceholder 사용자 조회
- `src/store`: 마지막 선택 탭과 hydration 상태

세 WebView는 동시에 mount하고 visibility만 전환한다. 이에 따라 탭을 오가도 페이지 history와 입력 상태가 유지되며, 다른 탭 reload 명령도 항상 ref에 접근할 수 있다.

도입 의존성은 다음과 같다.

- Expo SDK 호환 설치: `react-native-webview`, `expo-image-picker`, `expo-image-manipulator`, `expo-notifications`, `expo-secure-store`, `expo-crypto`, `expo-asset`
- 앱 라이브러리: TanStack Query, Axios, Zustand, Zod
- 테스트: Jest, `jest-expo`, React Native Testing Library

## 4. 기능별 구현

### 탭과 하단 탐색

- 네 탭의 순서, 한국어 label, 아이콘 의미를 보존한다.
- 선택 탭은 SecureStore 기반 Zustand persist로 저장한다.
- 현재 Web 탭을 재선택하면 최초 URL을 reload하고, 네이티브 탭은 사용자 Query를 refetch한다.
- WebView와 FlatList의 스크롤 방향에 따라 하단 바를 animation으로 숨기거나 표시한다.
- bridge visibility, scroll visibility, keyboard visibility를 독립 상태로 관리한다.

### WebView와 팝업

- 로컬 HTML은 별도 asset 파일 대신 TypeScript 문자열로 포함한다.
- JavaScript, DOM storage, cookies/cache, 다중 창, progress, iOS back-forward swipe를 사용한다.
- User-Agent suffix는 `my-webview-app(tab:fN)`이다.
- `https:`는 WebView에서 처리하고 `http:`는 차단 안내를 표시한다.
- `tel:`, `sms:`, `mailto:`는 외부 앱으로 전달한다.
- `instagram.com`, `facebook.com`, `twitter.com` 새 창은 외부 브라우저로 전달한다.
- 참고 앱의 네 기본 URL 새 창은 부모 WebView에서 열고, 나머지 HTTPS 새 창은 전체 화면 popup WebView로 연다.
- popup에는 progress, back, close를 제공한다.
- WebView 오류에는 실패 URL과 retry/back UI를 제공한다.

### Bridge 계약

Web에서 Native로 다음 형태를 전달한다.

```ts
type BridgeRequest = {
  uuid: string;
  action: BridgeAction;
  params?: string[];
};
```

Native에서 Web의 `calledByNative(message)`로 다음 형태를 반환한다.

```ts
type BridgeResponse<T = unknown> = {
  uuid: string;
  action: BridgeAction | string;
  result: T;
  isError: boolean;
};
```

- `showToastMessage`: `params[0]`을 표시하고 같은 문자열을 반환한다.
- `showNotiMessage`: `params[0]`은 title, `params[1]`은 body로 사용한다.
- `goToAnotherTab`: `params[0]`은 `f0`~`f3`, `params[1]`은 선택적 URL이다.
- `getPhotoImages`: `{ name, base64Image }[]`를 반환한다.
- 잘못된 JSON, action, parameter, 권한 거부, 취소도 같은 response envelope로 반환한다.

### 기기 UUID, 사진, 알림

- UUID는 SecureStore에 저장하고 없을 때 `Crypto.randomUUID()`로 생성한다.
- 사진은 최대 두 장을 선택하고, 긴 변을 최대 1000px로 비율 유지 축소한 뒤 PNG base64로 순차 변환한다.
- 로컬 알림만 사용한다. 기능 실행 시 권한을 요청하고 Android channel을 만든 뒤 단발 알림을 예약한다.
- Android는 `ToastAndroid`, iOS는 앱 내부 snackbar를 사용한다.

### 네이티브 사용자 목록

- API: `GET https://jsonplaceholder.typicode.com/users`
- 표시 항목: `id`, `name`, `email`
- Query key: `['users']`
- Axios timeout: 10초
- stale time: 5분
- 재시도: 응답 없는 네트워크 오류 또는 HTTP 5xx만 한 번
- 4xx, 취소, Zod 오류는 재시도하지 않는다.
- 최초 loading, empty, error/retry, success, pull-to-refresh를 제공한다.

### 플랫폼 탐색과 deep link

- Android back은 popup history, popup close, 현재 WebView history, 두 번 눌러 종료 순서로 처리한다.
- iOS Web 탭에는 back/forward 버튼과 swipe gesture를 제공한다.
- `mywebviewapp://webviewappdemo?target=1&url=m.nate.com`을 지원한다.
- WebView 안에서 누른 자체 scheme은 앱이 직접 가로채 Expo Go에서도 동일 탭 이동을 수행한다.
- 외부 custom-scheme launch는 development build에서 별도로 검증한다.

## 5. 검증 및 완료 기준

자동 검증:

```powershell
npx expo install --check
npx expo config --type public
npm run lint
npm run typecheck
npm test -- --runInBand
```

테스트 범위:

- bridge schema와 8개 action의 성공·실패 응답
- deep link target/URL parsing과 URL routing
- Axios 정상·schema 오류·timeout·5xx·4xx 처리
- 마지막 탭 hydration, 탭 재선택, 다른 탭 reload/refetch
- bridge·scroll·keyboard 조합의 하단 바 상태
- 이미지 resize 계산과 최대 두 장 제한
- Android back 우선순위

실제 기기 인수 조건:

- Android와 iOS에서 네 탭과 모든 WebView 흐름이 동작한다.
- Google 동일 창, Bing popup, 연락처 링크, 자체 deep link가 동작한다.
- 8개 bridge button이 모두 응답한다.
- 사진 허용·거부·취소·한 장·두 장을 확인한다.
- 알림 허용·거부와 foreground/background 표시를 확인한다.
- 네이티브 목록의 loading, 성공, 실패, retry, refresh를 확인한다.
- Android hardware back과 iOS back/forward를 확인한다.
- 검증 결과는 `확인됨`, `실패 상황 확인됨`, `미확인`으로 구분한다.

## 6. 범위 밖

- Expo web
- 원격 push token과 서버 push
- 로그인, 서버 저장, analytics
- React Hook Form, Expo SQLite
- HTTP cleartext, SSL 우회, 전체 ATS 허용
- 결제 앱별 설치 확인 및 store 이동 목록
- Git commit/push, EAS 계정 및 서명 작업

## 7. 구현 및 검증 결과

2026-08-07에 본 계획의 코드 구현을 완료했다. 구현 범위에는 사용자 정의 네 개 탭, 세 WebView의 mount 상태 유지, popup WebView, 8개 bridge action, UUID·사진·알림 서비스, deep link 재작성, JSONPlaceholder 사용자 목록과 Android/iOS 탐색 동작이 포함된다.

### 확인됨

| 검증 항목 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npm test -- --runInBand` | 10개 suite, 34개 test 통과 |
| `npx expo install --check` | 모든 의존성 정합성 통과 |
| `npx expo-doctor` | 18/18 checks 통과 |
| `npx expo config --type public` | SDK 54, Android/iOS, scheme 및 package/bundle identifier 확인 |
| Android Metro export | 통과 |
| iOS Metro export | 통과 |
| JSONPlaceholder 실제 endpoint | 사용자 10명 응답 확인 |
| 안전하지 않은 설정 정적 검색 | SSL 우회, cleartext 허용, 기존 dummy API 없음 |

자동 테스트로 다음 실패 상황도 확인했다.

- 잘못된 bridge action과 누락 parameter가 error envelope로 반환된다.
- 사진 선택 취소와 기기 기능 오류가 error envelope로 변환된다.
- 잘못된 사용자 API schema는 Zod에서 거부된다.
- 4xx·취소·schema 오류는 재시도하지 않고, 응답 없는 네트워크 오류와 5xx만 한 번 재시도한다.
- 범위를 벗어난 deep-link target과 HTTP target URL은 거부된다.
- 잘못된 persisted 탭 값은 기본 탭으로 복원된다.

### 실제 기기에서 미확인 (구현 직후 기준)

구현 직후에는 Windows 환경에서 Android SDK의 `adb.exe`만 확인되고 연결된 Android 기기와 iOS 실행 환경이 없었다. 아래 목록은 2026-08-07 실기기 검증을 시작하기 전의 미확인 기준이며, 이후 Android 결과는 8절과 날짜별 인계 문서에서 갱신한다.

- Expo Go에서 네 탭 전환과 포털 WebView 표시
- Google 동일 창과 Bing popup 표시
- 전화·문자·메일 외부 앱 실행
- Android hardware back 및 두 번 눌러 종료
- iOS back/forward button과 swipe
- 사진 권한 허용·거부·취소·한 장·두 장 결과
- 알림 권한 허용·거부와 foreground/background 표시
- 스크롤·키보드·bridge 요청에 따른 하단 바 animation
- 외부 OS에서 `mywebviewapp://`을 실행하는 development-build 경로

### 의존성 감사 참고

`npm audit --omit=dev`는 14개 moderate와 1개 high 항목을 보고한다. high 항목은 앱 runtime 코드가 아니라 Expo SDK 54의 `@expo/metro-config`가 제한하는 `postcss@8.4.49` build-tool 경로이며, npm이 제시하는 자동 수정은 Expo 57로의 major upgrade이다. 본 프로젝트의 SDK 54 고정 요구와 충돌하므로 `npm audit fix --force`는 실행하지 않았다. Expo SDK 54 범위의 `expo-doctor`와 의존성 정합성 검사는 모두 통과했다.

## 8. 2026-08-07 Android Expo Go 실기기 검증 갱신

상세 단계, 검증 방식, 수정 이력, 중단 지점과 차주 재개 순서는 [2026-08-07 Android Expo Go 실기기 검증 인계](./2026-08-07-android-expo-go-validation-handoff.md)를 기준으로 한다.

- LG `LM-V500N`, Android 12(API 31), Expo Go `54.0.8`에서 1~26단계를 진행했다.
- 네 탭, WebView 링크·popup·외부 앱·deep link, 알림, bridge action 대부분은 실제 기기에서 확인했다.
- `reloadOtherTabs`가 현재 URL만 새로고침하던 차이를 발견해 참고 Android/iOS 앱과 동일하게 다른 탭의 초기 URL을 다시 로드하도록 수정했고, 21단계 재검증을 통과했다.
- 로컬 HTML 버튼은 카테고리별 라이트 블루·그린·오렌지로 구분하고 touch 눌림 피드백을 추가했으며 사용자 확인을 통과했다.
- 사진 취소와 한 장 선택은 확인했지만, 두 장 선택 UI가 열리지 않고 첫 사진 선택 즉시 picker가 종료되어 27단계는 `실패 상황 확인됨`이다.
- 사진 두 장 문제는 아직 수정하지 않았다. 차주에는 27단계 원인 진단과 재검증부터 재개하며, 해결 전에는 다음 인수 단계로 넘어가지 않는다.
- 변경 후 `npm run typecheck`, `npm run lint`, `npm test -- --runInBand`를 실행했고 마지막 전체 결과는 10개 suite, 34개 test 통과다.

## 9. 2026-08-10 Android Expo Go 실기기 검증 완료

8절은 2026-08-07 중단 시점의 이력으로 보존한다. 최신 단계별 결과, 검증 방식, 원인 분석과 수정 내역은 [2026-08-10 Android Expo Go 실기기 검증 완료 보고서](./2026-08-10-android-expo-go-validation-completion.md)를 기준으로 한다.

- LG `LM-V500N`, Android 12(API 31), Expo Go `54.0.8`에서 Android Expo Go 1~40단계를 완료했다.
- 27단계는 앱 결함이 아니라 LG Android 12 DocumentsUI의 다중 선택 진입 방식 차이였다. 첫 사진을 길게 눌러 다중 선택 mode에 진입하는 절차로 25~27단계를 모두 통과했다.
- 사진 권한 거부·복원, WebView·네이티브 목록 scroll, 키보드, 마지막 탭 복원, 탭 재선택 reload/refetch, pull-to-refresh, Android back 우선순위, WebView·네이티브 오류와 retry를 실제 기기에서 확인했다.
- 로컬 HTML과 네이티브 목록의 하단 콘텐츠 가림, 네이티브 목록의 경계 scroll 방향 반전, 일반·popup WebView의 기본 오류 화면 노출을 수정하고 각각 실기기에서 재검증했다.
- 최종 자동 검증은 `npm test -- --runInBand` 10개 suite·35개 test, `npm run typecheck`, `npm run lint` 모두 통과다.
- 이 Android 완료 시점에는 iOS 실기기 전체 흐름과 외부 OS의 `mywebviewapp://` 직접 실행이 각각 iOS 환경과 development build가 필요해 미검증으로 남았다.

## 10. 2026-08-10 참고 앱 네트워크 동작 재대조 후 보완

9절까지의 Android 1~40단계 완료 기록은 당시 검증 이력으로 보존한다. 이후 Android/iOS 참고 앱의 네이티브 화면 생성 시점, `나머지 탭 리로드` 결과 팝업과 iOS 전역 네트워크 감시 동작을 현재 구현과 다시 비교해 다음 차이를 확인했다.

- 참고 앱은 네이티브 화면에 한 번도 진입하지 않았다면 메인 화면의 `나머지 탭 리로드`에서 네이티브 API를 미리 호출하지 않는다.
- 네이티브 화면이 한 번 활성화된 뒤에는 `나머지 탭 리로드`가 사용자 API도 다시 요청하고, 현재 탭이 메인 화면이어도 성공·실패 결과 팝업을 표시한다.
- 기존 Expo 구현은 네이티브 최초 진입 전에도 refetch했고, 비활성 상태에서 끝난 요청이 최초 진입 결과 팝업을 소모할 수 있었다.
- iOS 참고 앱의 전역 네트워크 modal은 종료·설정 이동을 강제하지만, Expo 샘플에는 사용 흐름을 막지 않는 공통 상태 배너가 더 적합하다고 판단했다.

보완 구현은 다음과 같다.

- `NativeUsersScreen`이 최초 활성화 여부를 기억하며, `reloadOtherTabs`, 네이티브 deep link와 네이티브 탭 이동은 활성화 이력이 있을 때만 명시적 refetch를 수행한다.
- 최초 진입 전 조건부 refetch는 건너뛰고, 탭이 실제 활성화되면 기존 TanStack Query의 최초 요청과 결과 팝업이 실행된다.
- 활성화 이후 `나머지 탭 리로드`, 네이티브 탭 재선택, pull-to-refresh와 오류 화면의 `다시 시도`는 새 요청의 성공·실패 결과를 팝업으로 알린다.
- Expo SDK 54 공식 문서에 맞춰 `expo-network~8.0.8`의 `useNetworkState()`를 사용한다.
- `NetworkStateType.NONE`일 때만 일반 탭과 전체 화면 popup 상단에 지속형 배너를 표시한다. `UNKNOWN`은 오프라인으로 판정하지 않는다.
- 네트워크 복원 시 배너만 자동으로 사라진다. 앱 종료, 설정 이동, 성공 popup, 사용자 API 자동 재요청과 cache invalidation은 수행하지 않는다.

자동 검증 결과는 다음과 같다.

| 명령 | 결과 |
|---|---|
| `npm test -- --runInBand` | 12개 suite, 39개 test 통과 |
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npx expo install --check` | 의존성 정합성 통과 |
| `npx expo-doctor` | 18/18 checks 통과 |

Android 표적 재검증은 LG `LM-V500N`, Android 12(API 31), Expo Go `54.0.8`에서 A-1~C-5 단계로 완료했다.

- cold start 후 네이티브 최초 진입 전 `나머지 탭 리로드`는 사용자 API와 결과 popup을 발생시키지 않았다. 네이티브 최초 진입 시에는 최초 조회 popup과 목록이 정상 표시됐다.
- 네이티브 활성화 이후 메인 화면의 `나머지 탭 리로드`는 사용자 API를 다시 요청해 메인 화면 위에 결과 popup을 표시했고, NATE로 변경했던 네이버 탭도 초기 `https://m.naver.com`으로 복원됐다.
- 일반 화면과 전체 화면 popup에서 단절 배너가 표시됐고, 네트워크 복원 시 배너만 제거됐다. popup과 네이티브 사용자 API는 자동 재요청되지 않았으며 각각 `다시 시도`를 눌렀을 때 정상 복구됐다.
- 오프라인 사용자 API refetch는 메인 화면 위에 `사용자 조회 실패`와 `Network Error`를 표시했고, 네이티브 오류 화면에서도 같은 오류와 retry를 확인했다.
- popup 오류 UI는 배너와 header 아래의 콘텐츠 중앙에 표시되고 WebView 기본 오류 화면은 나타나지 않았다. 네이티브 loading/error 묶음도 하단 탭 inset을 반영한 가시 영역 중앙에 표시됐다.

실기기 검증 중 설치된 `react-native-webview@13.15.0`의 내부 상태 계약을 추가로 확인했다. popup `onError`에서 `preventDefault()`를 호출하면 내부 상태가 `LOADING`에 머물러 흰 `renderLoading` 레이어가 배너와 header를 가렸다. 최종 구현은 popup event를 정상 `ERROR` 상태로 진행시키고 빈 `renderError`로 기본 오류 UI만 억제한다. 오류 중에는 `containerStyle`로 WebView 바깥 container를 숨겨 history와 ref를 유지하면서 앱 오류 UI가 전체 콘텐츠 영역을 차지하게 한다.

오프라인 실기기에서 source를 수정할 때는 Metro LAN 주소로 열린 Expo Go가 갱신 bundle을 받지 못한다. 이번 검증에서는 기존 `adb reverse tcp:8081 tcp:8081`을 사용해 `exp://127.0.0.1:8081`로 프로젝트를 다시 열고 최신 bundle을 확인했다. 이후 오프라인 재현에서도 같은 USB reverse 경로를 사용한다.

## 11. 2~5단계와 최종 인계 계획

2026-08-10 사용자의 최신 결정에 따라 GitHub 공개 저장소 생성과 초기 commit/push를 새 2단계로 편입하고, 기존 2~4단계는 3~5단계로 순연한다. 각 단계는 하나씩 진행하며, 한 단계의 완료 판정과 문서 갱신이 끝나기 전에는 다음 단계를 자동으로 시작하지 않는다. 상세한 Android 검증 이력과 새 세션 재개 기준은 [2026-08-10 Android Expo Go 실기기 검증 완료 보고서](./2026-08-10-android-expo-go-validation-completion.md)를 함께 기준으로 삼는다.

| 단계 | 작업 | 상태 | 시작 조건 | 완료 기준 |
|---|---|---|---|---|
| 2 | Public GitHub 저장소 생성과 의미별 초기 commit/push | 완료 | 공개 전 민감 정보 감사, 사용자의 빈 저장소 생성 | 단계·기능·의미별 commit과 1차 push, GitHub 결과 문서 갱신 commit과 2차 push, local/remote 일치 확인 |
| 3 | Android development build와 외부 custom scheme 검증 | 완료 | 2단계 완료, 사용자의 명시적 시작, build 방식·서명 범위 확인 | [2026-08-11 완료 문서](./2026-08-11-android-development-build-and-custom-scheme-validation.md)의 cold/warm custom scheme, 표적 회귀와 자동 검사 |
| 4 | iOS 실기기 전체 흐름 검증 | 완료 | EAS remote iOS build와 iPhone 11 설치·검증 환경 준비 | [2026-08-12 완료 문서](./2026-08-12-ios-eas-preview-build-and-device-validation.md)의 기능 동등성, iOS 고유 탐색·권한·lifecycle, Android 표적 회귀와 2026-08-13 오프라인 오류 복구 후속 검증 |
| 5 | 최종 인계 문서·source 주석·학습서 정리 | 진행 중 | 3~4단계 결과 확정 완료, 사용자의 명시적 시작 | 필수 문서와 주석 완성, 전체 검증, 후속 commit/push 및 원격 일치 확인 |

### 2단계: Public GitHub 저장소와 초기 이력

- 대상은 사용자가 생성한 빈 Public 저장소 `Jaehoon81/expo-webview-demo`다. Description은 사용자가 정했으며 GitHub에서 README, `.gitignore`, license를 자동 생성하지 않았다.
- 첫 commit 전에 working tree와 현재 index를 모두 검사한다. `reset-project` 이전 template의 staged/deleted 항목을 최종 tree와 일치시키고, secret·credential·개인정보·local tool 상태·generated output·사진 또는 진단 산출물이 포함되지 않도록 한다.
- 2026-08-10 1차 감사에서는 known token·API key·private key·credential 파일과 repository 사진·screenshot을 발견하지 않았다. 첫 commit 전에 Git 작성자 이메일을 repository-local GitHub `noreply`로 설정하고, local HTML의 demo 이메일을 예약 예제 주소로 교체했으며, 실제 LAN IP는 익명화하고 test host는 문서용 IP로 바꿨다. 다음 단계에 필요한 절대 reference path는 사용자 식별 정보가 없어 유지한다.
- `.claude/settings.json`, `.vscode/*`, `CLAUDE.md`, `AGENTS.md`에는 secret이 없지만 공개 저장소에 필요한 project guidance인지 판단한 뒤 포함한다. `.expo/`, `node_modules/`, generated `android/`·`ios/`, local env와 signing 파일은 ignore 상태를 재확인한다.
- commit은 실제 dependency와 caller 관계를 확인한 뒤 project/build 기반, runtime 기능, tests, 검증·계획 문서처럼 독립적으로 검토 가능한 단계·기능·의미 단위로 나눈다. 각 staged 묶음은 `git diff --cached --name-status`, `git diff --cached --stat`, `git diff --cached --check`로 확인한다.
- `npm test -- --runInBand`, `npm run typecheck`, `npm run lint`, `npx expo install --check`, `npx expo-doctor`를 통과한 뒤 초기 commit들을 `master`에 push한다.
- GitHub URL, visibility, commit 목록, 자동 검증과 원격 확인 결과를 계획서와 날짜별 GitHub handoff 문서에 반영하고 문서 commit을 추가 push한다. 마지막에는 local `HEAD`, clean worktree와 `git ls-remote --heads origin master`가 일치하는지 독립적으로 확인한다.

### 3단계: Android development build와 외부 custom scheme

- source, `app.json`, package 또는 build 설정을 변경하기 전에 [Expo SDK 54 문서](https://docs.expo.dev/versions/v54.0.0/)에서 development build, linking과 해당 package의 정확한 versioned 문서를 다시 확인한다.
- 로컬 native build와 EAS Build 중 어떤 경로를 사용할지, Expo 계정·project 연결·서명 정보가 필요한지를 실제 현재 상태로 조사한 뒤 사용자에게 범위와 수동 작업을 먼저 안내한다. EAS 연결, credential 생성·사용과 외부 서비스 변경은 승인 없이 수행하지 않는다.
- 설치된 development build를 외부 OS 진입점에서 실행해 `mywebviewapp://webviewappdemo?...`의 cold start와 실행 중 진입, 정상 target 전달, 잘못된 target 거부, 탭 선택과 WebView 상태를 확인한다.
- Expo Go에서 이미 통과한 Android 1~40단계를 전부 반복하지 않는다. build 방식이나 수정된 code/config가 영향을 주는 custom scheme, lifecycle, 권한, notification, 외부 앱 전환과 Android back 경로만 표적 회귀 검증한다.
- 변경 후 `npm test -- --runInBand`, `npm run typecheck`, `npm run lint`, `npx expo install --check`, `npx expo-doctor`를 실행하고 development build·실기기 결과를 별도 날짜 문서와 이 계획서에 기록한다.

### 4단계: iOS 실기기 전체 흐름

- `D:\Development\iOS\Workspaces\WebViewAppDemo`의 동작을 다시 기준으로 삼되, OS 특성에 따른 구현 차이와 공통 기능 계약을 분리해 비교한다.
- 네 탭과 상태 복원, 일반·popup WebView 탐색, popup history와 닫기, iOS back/forward button과 swipe, 외부 URL과 custom scheme, bridge action, 사진·알림 권한, scroll·keyboard에 따른 하단 탭, 네이티브 사용자 API, 전역 네트워크 배너와 수동 retry를 iPhone에서 확인한다.
- iOS에서만 발견한 차이는 영향 범위에 한정해 수정하고 관련 자동 검증과 영향받은 Android 표적 회귀만 수행한다. Android Expo Go 전체 인수 검증을 근거 없이 다시 시작하지 않는다.
- 사용한 build, iOS·Expo Go 또는 development build version, iPhone·iOS version, 단계별 실제 결과와 남은 제한을 별도 날짜 문서와 이 계획서에 기록한다.

2026-08-12 EAS internal Preview Build와 iPhone 11·iOS `18.7.8` 검증으로 위 범위를 완료했다. 2026-08-13에는 당시 누락된 실제 네트워크 단절을 후속 검증해 WebView 오류 화면 정렬, iOS 오프라인 retry 중 하단 탭 유지와 loading 정렬을 보완했고 Android·iPhone에서 모두 통과했다. build 이력, 발견 결함, source 수정, Android 표적 회귀와 전체 iOS 결과는 [iOS EAS Preview Build와 실기기 전체 흐름 검증 완료 문서](./2026-08-12-ios-eas-preview-build-and-device-validation.md)를 기준으로 한다.

### 5단계: 최종 인계 정리

#### 문서 산출물과 최종 점검

- `README.md`: Expo starter 문서를 실제 WebView 데모 앱 안내로 교체한다. 앱 목적과 주요 기능, SDK·실행 전제, 설치·Expo Go·development build 실행, 검사 명령, custom scheme, 주요 경로, 플랫폼별 검증 범위와 문서 링크를 현재 source 기준으로 작성한다.
- `AGENTS.md`: 반드시 `agents-md-improver` 스킬을 사용한다. 실제 source, config, scripts, tests, `.gitignore`와 문서를 먼저 조사하고 점수화된 품질 보고서와 정확한 수정 제안을 제시한다. 사용자의 명시적 승인 전에는 파일을 수정하지 않는다.
- `docs/architecture-internals.md`: `AGENTS.md`가 구조·흐름 중심 작업에서 읽도록 연결한다. 실제 디렉터리 지도와 파일 책임, app 시작과 provider, `DemoShell`·탭 lifecycle, WebView·popup·history·error·Android/iOS back, bridge request/response, deep link와 native intent, 사진·알림·device ID, Zustand 영속 상태, Axios·Zod·TanStack Query 사용자 API, network 배너, 하단 탭 animation과 검증 경계를 기술한다.
- `docs/source-commentary-guide.md`: source에 삽입한 `[파일 역할]`, `[FLOW-NN]`, `[FLOW-NN / N단계]`, `[FLOW-NN / 관련 코드]`, `[이유]`, `[주의]`, `[검증 경계]` 표식의 의미와 주요 흐름별 source 읽기 순서를 정리한다.
- `docs/learning-guide.md`: 참고 앱 `D:\Development\ReactNative\Workspaces\my-sample-app`의 학습서 구성을 참고하되 이 프로젝트 source와 실제 runtime 결과로 새로 작성한다. 앱 시작·상태 복원, 탭 전환·재선택·reload, local HTML bridge, 일반·popup WebView navigation과 오류 복구, deep link·외부 앱, 사진·알림·device ID, 사용자 API와 cache/refetch, network 단절·복원, scroll·keyboard·하단 탭 흐름을 source link와 함께 따라가도록 구성한다. 각 상태의 수명, caller/consumer, 데이터 변환, 실패·retry와 자동화·build·실기기 증거의 경계도 설명한다.
- `docs/implementation-plan.md`, 날짜별 검증·handoff 문서와 새 development build·iOS 결과 문서를 최종 source와 대조한다. 오래된 결과는 당시 이력으로 보존하고, 최신 기준과 대체 관계를 명시하며, local link·명령·경로·version·검증 수치가 실제와 일치하는지 확인한다.

#### 최종 source 주석 기준

- `app/`과 `src/`의 최종 production source를 파일 단위로 검토하고 참고 앱 수준의 한국어 설명 주석을 추가한다. test에는 mock이 증명하는 범위와 실제 native/runtime에서만 확인되는 경계가 혼동될 수 있는 곳에 `[검증 경계]`를 사용한다.
- 주석은 보이는 문법을 반복하지 않고 파일 책임, caller와 consumer, 입력·출력 변환, React state·Zustand persist·TanStack Query cache·WebView history의 수명, 비동기 순서, platform 차이와 선택 이유를 설명한다.
- 각 canonical `[FLOW-NN]`과 `[FLOW-NN / N단계]`는 source 전체에서 한 번만 사용하고, 여러 call site는 `[FLOW-NN / 관련 코드]`로 연결한다. identifier와 API 이름은 번역하거나 변경하지 않는다.
- 주석 작업은 동작 변경과 분리한다. 주석을 달며 결함을 발견하면 즉시 함께 고치지 않고 별도 영향 검토와 사용자 합의가 필요한 source 변경으로 보고한다.

#### 후속 Git commit과 최종 push 경계

- 2단계에서 Public remote와 초기 의미별 Git 이력을 확립한다. 3~5단계의 build/config, platform 수정·검증, source 주석과 문서 산출물도 단계와 의미별 commit으로 분리하고 하나의 거대한 최종 commit으로 합치지 않는다.
- 모든 commit 대상에 secret, signing credential, local Expo/IDE 상태와 generated output이 없는지 다시 확인한다. remote 설정이나 공개 범위가 달라지면 사용자의 승인을 받고, 인증 정보는 사용자에게 전달하도록 요구하거나 출력하지 않는다.
- 각 staged 묶음은 `git diff --cached --name-status`, `git diff --cached --stat`, `git diff --cached --check`로 확인하고 관련 자동 검증을 통과한 뒤 commit한다. push 후에는 local `HEAD`, working tree와 `git ls-remote --heads` 결과를 비교해 원격 반영을 독립적으로 확인한다.

### 새 세션 재개 규칙

1. root `AGENTS.md`, 이 계획서의 11절·최신 완료 절과 [Android Expo Go 완료 보고서](./2026-08-10-android-expo-go-validation-completion.md), [iOS 4단계 완료 문서](./2026-08-12-ios-eas-preview-build-and-device-validation.md)의 최신 인계 절을 끝까지 읽는다.
2. 현재 source, package, Git branch·HEAD·remote·worktree, Metro·Expo Go와 사용 가능한 build 환경을 다시 확인한다. 실기기 검증은 사용자가 해당 단계의 검증 기기로 명시한 기기만 사용하며, 단순히 연결되어 있다는 이유로 다른 기기를 조회·설치·실행 대상으로 삼지 않는다. 이 문서의 일시적 외부 상태를 현재 사실로 가정하지 않는다.
3. 완료된 2~4단계는 반복하지 않는다. 현재 미완료인 5단계의 목표, 완료 기준, 사용자 수동 작업, Codex 작업과 제외 범위를 먼저 설명하고 명시적인 시작을 기다린다.
4. source·package·build·config를 바꾸기 전에는 실제 caller와 consumer를 조사해 Impact Review를 제시하고 Expo 관련 구현은 exact SDK 54 공식 문서를 다시 읽는다.
5. 한 번에 한 단계만 진행한다. EAS·서명·원격 저장소·commit·push와 다음 단계는 사용자의 승인 없이 자동으로 시작하지 않는다.

새 세션에서 사용할 수 있는 요청문은 다음과 같다.

```text
D:\Development\ReactNative\Workspaces\my-webview-app에서 AGENTS.md,
docs/implementation-plan.md의 11절,
docs/2026-08-10-android-expo-go-validation-completion.md의 최신 인계 절을 읽고
현재 source·Git·runtime 상태를 다시 확인해줘.
완료된 2~4단계는 반복하지 말고 5단계의 목표·완료 기준·내가 할 작업·네가 할 작업·제외 범위를 먼저 설명하고,
아직 실제 변경이나 외부 작업은 시작하지 말고 내 시작 승인을 기다려줘.
```

## 12. 2026-08-10 Public GitHub 저장소와 초기 push 완료

상세 감사, commit 구성, 자동 검증, 1·2차 push와 새 세션 인계는 [Public GitHub 저장소와 초기 push handoff](./2026-08-10-github-repository-and-initial-push-handoff.md)를 기준으로 한다.

- Public 저장소 [Jaehoon81/expo-webview-demo](https://github.com/Jaehoon81/expo-webview-demo)를 생성하고 local `origin`에 연결했다.
- Git 작성자 email은 이 repository에만 GitHub ID 기반 `noreply`를 사용한다.
- known secret·credential, 선택 사진·screenshot과 unrelated device identifier가 없음을 확인했다. demo email, 실제 LAN IP와 test IP도 공개용 값으로 정리했다.
- `reset-project` 이전 staged/deleted 항목이 섞인 index를 빈 상태로 만든 뒤 현재 tree를 여섯 개 의미별 commit으로 구성했다.
- 1차 push 기준 local `HEAD`와 remote `master`는 `651151fba37d61f51adaf95225a19242e4fffe18`로 일치했고, GitHub logout 상태에서도 Public·`master`·6 commits를 확인했다.
- 공개 정리 후 `npm test -- --runInBand` 12개 suite·39개 test, typecheck, lint, dependency check와 Expo Doctor 18/18을 통과했다.
- 실제 프로젝트 README와 이 결과 문서를 별도 `Docs:` commit으로 2차 push하고 local/remote parity를 다시 확인해 2단계를 닫는다.

2단계 종료 당시 다음 작업은 3단계 Android development build와 외부 OS의 `mywebviewapp://webviewappdemo?...` 검증이었다. 이 문장은 당시 인계 이력이며 최신 완료 상태는 아래 15절을 우선한다.

## 13. 2026-08-11 Android development build와 외부 custom scheme 검증 완료

상세 build 선택, source 수정, APK 검사, 실기기 증거와 종료 상태는 [Android development build와 외부 custom scheme 검증 완료 문서](./2026-08-11-android-development-build-and-custom-scheme-validation.md)를 기준으로 한다.

- `expo-dev-client` launcher가 cold external intent보다 먼저 열리는 동작을 확인해 최종 dependency에서 제거하고, launcher-free local arm64 debug development build를 생성했다. EAS와 production signing은 사용하지 않았다.
- APK의 debug signature, zipalign, package, `arm64-v8a`, `MainActivity`와 `mywebviewapp` scheme을 확인하고 LG `LM-V500N`, Android 12(API 31)에 `adb install -r`로 설치했다.
- cold `target=1&url=m.nate.com`은 `LaunchState: COLD`, `MainActivity`, 네이버 탭 선택과 `https://m.nate.com/` 로드를 통과했다. 실행 중 `target=3`, 잘못된 `target=4`, `target=0`도 기존 instance 전달·탭 선택·오류 유지 기준을 통과했다.
- cold URI에서 Root `Stack` mount 전 `router.setParams`가 호출되는 결함을 발견해 hydration loading gate를 index route로 이동하고 회귀 테스트를 추가했다. persisted state 형식과 loading UX는 유지했다.
- 사진 권한·DocumentsUI 취소, local notification, `tel:` dialer 전환·복귀, Android 두 번-back만 표적 회귀했다. 완료된 Expo Go 1~40단계와 A-1~C-5는 반복하지 않았다.
- 최종 source에서 Jest 13 suites·40 tests, typecheck, lint, Expo dependency check와 Expo Doctor 18/18을 통과했다. npm audit의 moderate 12건·high 13건은 SDK major 변경과 분리해 기록만 남겼다.
- Metro가 꺼진 launcher-free debug APK에서 JavaScript bundle 로드 실패 뒤 앱 Window가 사라지고, 이 상태에서 Android back 입력이 약 10초간 포커스 Window를 기다리다가 `Application does not have a focused window` ANR로 이어지는 경로를 실제 `/data/anr` 기록으로 확인했다.
- 2026-08-12 사용자가 Metro를 실행하고 개인용 HTTPS 테스트 페이지에서 `target=1&url=m.nate.com`, `target=3`, 잘못된 `target=4` 링크 버튼을 직접 눌러 cold·warm·거부 흐름이 모두 정상임을 확인했다.
- 최초 자동 검증 종료 시 Metro, host `8081`, ADB reverse·forward와 기기 진단 임시 파일을 정리했다. generated `android/`와 debug APK는 계속 ignored 상태로 유지하며 Git에 포함하지 않는다.
- 2026-08-12 사용자가 3단계 source·test·문서의 commit/push를 승인했다. source·test와 문서를 의미별 commit으로 분리하고 원격 일치를 확인해 Git 반영을 닫는다.

3단계 종료 당시 다음 제품 단계는 iOS 실기기 4단계였다. 이 문장은 당시 인계 이력이며, 최신 완료 상태와 다음 작업은 아래 15절을 우선한다.

## 14. 2026-08-12 iOS EAS Preview Build와 실기기 전체 흐름 검증 완료

상세 환경, 2026-08-12 네 차례와 2026-08-13 후속 한 차례의 EAS build 이력, 발견 결함과 수정, Android 표적 회귀, iPhone 전체 결과와 제외 범위는 [iOS EAS Preview Build와 실기기 전체 흐름 검증 완료 문서](./2026-08-12-ios-eas-preview-build-and-device-validation.md)를 기준으로 한다.

- macOS를 사용할 수 없어 EAS remote iOS builder와 사용자의 iPhone 11·iOS `18.7.8`을 동등한 build·설치 환경으로 사용했다.
- 개인 Expo owner `jungjh0519`의 project와 internal `preview` profile을 연결하고, 사용자가 설정한 Apple Developer Program team의 remote credential로 ad hoc build를 생성했다. credential·UDID·IPA는 Git에 포함하지 않았다.
- 2026-08-12 당시 최종 build `108d6471-2b7d-4939-a910-3ac4061dfc2e`가 `FINISHED`됐고 iPhone 설치·실행과 artifact 접근을 확인했다.
- 초기 iPhone 검증에서 Web 탭 상태 손실, 네이버 content 재진입, popup safe area, 길게 유지한 pull-to-refresh와 local HTML 버튼 feedback 결함을 발견했다.
- WebView native hierarchy와 history 유지, 하단 탭 layer, modal-local safe area provider, iOS touch 종료 후 refresh 결과 알림, 즉시 색상 반전 button feedback으로 영향 범위만 수정했다.
- 수정 영향이 있는 Android 항목만 LG `LM-V500N`, Android 12에서 표적 회귀했고 두 차례 모두 전체 통과했다.
- iPhone에서 Google/Bing 탐색, back/forward·swipe·popup, `tel:`·`sms:`·`mailto:`, 자체 scheme와 cold/warm deep link, 8개 bridge action, local notification, 단일·복수 사진, 하단 탭 show/hide, 네이티브 사용자 목록·refresh와 당시 수행한 Android 동등 항목을 통과했다. 실제 network 단절 재현 누락은 아래 15절에서 보완했다.
- 2026-08-12 당시 source는 Jest 15 suites·47 tests, typecheck, lint, Expo dependency check와 Expo Doctor 18/18을 통과했다.
- build 설정, 세 기능 수정과 4단계 결과 문서를 5개 의미별 commit으로 `master`에 push했다. 첫 push 기준 local·tracking·`git ls-remote`·GitHub API는 `bada27e6372ece4991cb3c66bcc94e4f12a88481`로 일치했고 저장소는 `public`, default branch는 `master`였다.

4단계 기능·build·설치·실기기·Android 회귀 완료 기준은 충족했다. 다음 제품 단계는 5단계 `최종 인계 문서·source 주석·학습서 정리`이며, 이번 4단계 closeout과 GitHub 반영이 끝난 뒤 사용자의 별도 시작 지시를 기다린다.

## 15. 2026-08-13 WebView 오프라인 오류 복구 후속 완료

2026-08-12 iPhone 전체 검증 기록 중 실제 네트워크 단절 재현이 누락됐음을 사용자가 확인했다. 완료된 4단계를 임의로 반복하거나 5단계를 시작하지 않고, 누락 항목과 수정 영향만 Android와 iPhone에서 표적 검증했다.

- 네이버·다음 오류 overlay가 하단 탭과 safe-area를 제외한 가시 영역 중앙에 오도록 기존 `bottomBarHiddenOffset`을 `WebTab`에 전달했다.
- iOS는 오류 발생부터 성공 load까지 WKWebView의 합성 scroll event를 하단 탭 visibility에서 제외하고, 오류·retry·초기 화면에서 하단 탭을 표시 상태로 유지했다. Android scroll 경로는 그대로 유지했다.
- WebView loading과 오류 overlay가 같은 상·하 padding과 bottom inset을 사용하게 해 두 상태 전환 시 spinner·문구와 오류 묶음의 세로 기준을 맞췄다. 네이티브 탭 loading/error는 기존부터 같은 기준이었다.
- 사용자가 지정 Android 실기기에서 공통 수정과 Android 회귀를 모두 통과한 뒤 Metro를 종료했다.
- EAS internal Preview Build `681c24bd-c90e-4fc3-ba47-b8ff6efb8840`이 완료됐고, iPhone 11·iOS `18.7.8`에서 오프라인 반복 retry·초기 화면, 하단 탭 유지, loading 위치와 네트워크 복원 후 정상 동작을 모두 통과했다.
- 최종 source는 Jest 15 suites·50 tests, typecheck, lint, Expo dependency check와 Expo Doctor 18/18을 통과했다.
- source/test는 `073c2cad87ccd2b8dc6d91dd604fa631b4829fff`로 문서와 분리했다. package·native config·credential·외부 서비스 설정은 변경하지 않았다.

4단계의 누락된 network 실기 항목까지 보완됐고 차단 요소는 없다. 다음 미완료 제품 단계는 5단계 `최종 인계 문서·source 주석·학습서 정리`이며, 이번 후속 문서와 GitHub 원격 일치 확인을 마친 뒤에도 사용자의 별도 시작 지시를 기다린다.

## 16. 2026-08-13 5단계 최종 인계 정리 진행

사용자가 5단계 시작, `agents-md-improver` 제안 반영과 `docs/2026-08-13-step-5-final-handoff.md` 생성을 승인했다. 시작 전 local `master`, `HEAD`, `origin/master`, live remote `master`는 모두 `65f5b2d89850b9c72fca593deec579da3c39eae0`로 일치했고 worktree는 clean, Metro `8081`은 닫혀 있었다.

### 16.1 반영 범위

- 참고 앱 `D:\Development\ReactNative\Workspaces\my-sample-app`의 학습 문서와 유지관리 대상 화면·공용 TypeScript·test·Kotlin·Swift·module/tool config 37개 파일을 전체 대조했다.
- `agents-md-improver` 사전 감사의 `33/100 (D)` 보고서와 수정 제안을 사용자 승인 뒤 반영했다. 한글 `AGENTS.md`는 실제 command, architecture invariant, comment/FLOW, test, device/build, generated·secret와 Git 승인 경계를 연결했고 승인 후 재감사 기준 `92/100 (A)`로 개선했다. Repository에 없는 CI/PR 정책은 추측으로 만들지 않았다.
- `app/`과 `src/`의 production source 28개 모두에 `[파일 역할]`을 추가하고 `FLOW-01`~`FLOW-09`의 canonical 9개 흐름·56개 단계를 연결했다.
- test 15개 모두에 `[파일 역할]`과 `[검증 경계]`를 추가하고 WebView·Query·SecureStore·Alert·Platform mock이 증명하지 않는 실제 native/runtime 범위를 표시했다.
- `eslint.config.js`, `jest.setup.ts`에 tooling 책임과 mock 경계를 설명했다. `LOCAL_DEMO_HTML` template literal 내부 payload와 JSON config 값은 변경하지 않았다.
- 한글 [내부 구조와 동작](./architecture-internals.md), [소스 주석 읽기 안내서](./source-commentary-guide.md), [대화형 구현 학습서](./learning-guide.md)를 새로 작성했다.
- 학습서는 실제 source 흐름 8개 대단원·32개 서브 스텝으로 구성하고, 요청에 따라 범용 문법 백과, 독립적인 자동화/실기기 반복 장과 복습 mutation 실습을 제외했다. 사용자와 source 확인·질문을 아직 시작하지 않았으므로 학습 완료로 판정하지 않는다.
- README와 Android Expo Go, Android development build, iOS Preview Build 문서에는 과거 결과를 보존하며 최신 5단계 인계 link와 비반복 경계를 추가했다.

### 16.2 검증 결과

| 검사 | 결과 |
|---|---|
| Source 실행문 diff 감사 | `app/`, `src/`, test와 tooling config에서 추가·삭제된 non-comment line 각각 0 |
| Script syntax equivalence | 변경된 TypeScript/JavaScript 45/45가 주석·빈 JSX 주석 container 제외 시 동일 |
| FLOW 감사 | canonical `01`~`09` 각 1회, 단계 56개 각 1회, 중복 0 |
| Source/test coverage | production 28/28 `[파일 역할]`, test 15/15 `[파일 역할]`·`[검증 경계]` |
| Jest | 15 suites·50 tests 통과 |
| TypeScript | `npm run typecheck` 통과 |
| ESLint | `npm run lint` 통과 |
| Expo dependency | `npx expo install --check` 통과 |
| Expo public config | `npx expo config --type public` 통과 |
| Expo Doctor | 18/18 통과 |
| 공개 민감정보 | high-signal secret content와 sensitive filename 후보 각각 0 |
| Generated ignore | `.expo`, `/android`, `/ios`, `node_modules`, signing 확장자와 `expo-env.d.ts` ignore 확인 |
| Markdown 감사 | 전체 13개 파일의 깨진 local link·홀수 code fence·heading jump·trailing whitespace 각각 0 |
| Learning guide 구성 | 32개 서브 스텝, 제외 요청한 독립 반복 장 제목 0 |

Markdown 감사와 최종 `git diff --check`의 상세 결과는 [5단계 최종 인계](./2026-08-13-step-5-final-handoff.md)의 최신 검증 표를 우선한다.

### 16.3 제외와 남은 Git 경계

- Production 실행식, `package.json`, lockfile, `app.json`, `eas.json`, scheme, package/bundle identifier와 native config는 변경하지 않았다.
- 완료된 Android/iOS build·설치·실기기·EAS·서명 검증을 반복하지 않았고 새 external service 변경도 없다.
- 5단계 본문 산출물과 자동 감사에는 기술적 차단 요소가 없다.
- Commit/push는 별도 승인 전 수행하지 않는다. 현재 local `HEAD`, tracking ref와 remote는 시작 SHA를 유지하며 worktree의 5단계 변경은 미commit 상태다.
- 권장 경계는 source/test/tooling 주석과 문서·AGENTS/README/계획·handoff를 분리하고, 첫 push parity 확인 뒤 정확한 commit SHA와 최종 clean/remote 상태를 closeout 문서 commit으로 남기는 순서다.

따라서 5단계 상태는 **본문 작성과 자동 검증 완료, GitHub closeout 별도 승인 대기**다. Commit/push와 최종 remote parity가 끝나기 전에는 단계 전체를 완료로 바꾸지 않는다.
