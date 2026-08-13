# iOS EAS Preview Build와 실기기 전체 흐름 검증 완료

- 완료일: 2026-08-12
- 후속 오프라인 회귀 완료일: 2026-08-13
- 구현 계획 단계: 4단계 `iOS 실기기 전체 흐름 검증`
- 기준 branch·시작 SHA: `master`, `330586de1c5745cf73624c116f13d016e6864ae5`
- 기준 remote: `origin/master`, 시작 시 local과 일치
- 참고 iOS 앱: `D:\Development\iOS\Workspaces\WebViewAppDemo`
- 관련 계획: [implementation-plan.md](./implementation-plan.md) 11절·14~15절

## 1. 목표와 완료 판정

4단계의 목표는 Windows에서 구현한 Expo SDK 54 WebView 데모를 실제 iPhone에 설치하고, 참고 iOS 앱의 사용자 기능과 iOS 고유 탐색·권한·lifecycle 계약이 동일하게 동작하는지 확인하는 것이었다. macOS를 임의로 대체했다고 간주하지 않고, EAS Build의 원격 iOS build 환경과 사용자의 iPhone 실기기 검증을 결합한 동등한 검증 경로를 사용했다.

다음 완료 기준을 모두 충족했다.

- EAS internal distribution용 iOS Preview Build를 실제 Apple Developer Program team credential로 생성한다.
- 지정한 iPhone 11에 설치해 첫 실행과 네 개 탭을 확인한다.
- 참고 iOS 앱과 공통인 WebView·popup·외부 앱·bridge·사진·알림·탭 제어·deep link·네이티브 사용자 목록 흐름을 확인한다.
- iOS back/forward UI, swipe, safe area, pull-to-refresh와 앱 lifecycle처럼 iOS에서만 판단할 수 있는 항목을 확인한다.
- 발견한 결함은 영향 범위만 수정하고 관련 자동 검사와 Android 표적 회귀를 통과한다.
- 확인 결과를 `확인됨`, `미확인`, `차단 요소`로 분리하고 source/test/config와 문서의 Git 경계를 남긴다.

2026-08-12 사용자는 핵심 시나리오, 수정하면서 추가한 시나리오, 앞서 Android에서 수행했던 전체 인수 항목을 iPhone에서 동일하게 검증했고 모두 통과했다고 최종 확정했다. 따라서 4단계 기능·build·설치·실기기 완료 기준은 충족했다.

다만 2026-08-13 사용자가 이전 iPhone 인수 과정에서 실제 네트워크 단절 재현을 빠뜨렸음을 확인했다. 이 항목은 당시 통과로 소급하지 않고 별도 후속 회귀로 다시 수행했으며, 발견한 WebView 오류 화면 정렬과 iOS 오프라인 retry 중 하단 탭 문제를 수정한 뒤 Android와 iPhone에서 모두 통과했다. 최신 판정은 이 문서 11절을 함께 기준으로 한다.

## 2. 실제 환경과 외부 경계

| 항목 | 실제 값과 판정 |
|---|---|
| 로컬 작업 환경 | Windows, macOS·로컬 Xcode 사용 불가 |
| 동등한 iOS build 환경 | EAS Build 원격 iOS builder |
| Expo SDK | `54.0.0` 계열, project dependency `expo ~54.0.35` |
| React Native | `0.81.5` |
| EAS CLI | `21.8.0` |
| Expo owner·project | 개인 계정 `jungjh0519`, `@jungjh0519/my-webview-app` |
| EAS profile | `preview`, `distribution: internal` |
| app version | `1.0.0` |
| iOS build version | `1` |
| bundle identifier | `com.jaehoon.mywebviewapp` |
| 실기기 | iPhone 11 |
| iOS | `18.7.8` |
| Android 표적 회귀 | LG `LM-V500N`, Android 12(API 31) |

사용자가 EAS iOS credential 설정을 완료했고, 이후 build는 Expo server의 기존 remote credential과 등록된 iPhone provisioning을 사용했다. 인증서 serial, provisioning identifier, 기기 UDID와 signing secret은 공개 문서와 Git에 기록하지 않았다. App Store Connect, TestFlight, production 배포 credential, universal link와 원격 push notification 설정은 변경하지 않았다.

## 3. EAS 연결과 build 이력

`app.json`에는 `owner: jungjh0519`와 EAS `projectId`를 연결했고, 새 `eas.json`에는 internal distribution용 `preview` profile만 추가했다. package, bundle identifier, scheme과 runtime dependency는 변경하지 않았다.

| Build ID | 결과 | 용도와 판정 |
|---|---|---|
| `a6c69bf5-4bab-46b6-8e6f-49db09327301` | `FINISHED` | 초기 Preview Build. 설치·첫 실행·네 탭 확인에 사용했으나 후속 source 수정 전 산출물이므로 최종 판정에서는 대체됐다. |
| `8bdba63f-a73d-4061-8829-6491f639fb89` | `CANCELED` | 사용자가 Preview Build 전 대기를 요청한 시점에 최종 source가 아닌 build를 계속 사용하지 않도록 취소했다. 설치·검증 산출물로 사용하지 않았다. |
| `8c1a3857-008c-42b0-928d-bb91dfa5f973` | `FINISHED` | WebView 탭 lifecycle·history와 Android 회귀 수정이 포함된 중간 build. iPhone 검증에서 popup safe area와 길게 유지한 pull-to-refresh 문제를 발견했다. |
| `108d6471-2b7d-4939-a910-3ac4061dfc2e` | `FINISHED` | 2026-08-12 당시 최종 Preview Build. 수정된 popup inset, refresh lifecycle과 HTML 버튼 feedback을 포함하며 당시 iPhone 전체 검증을 통과했으나, 이후 실제 네트워크 단절 항목 누락이 확인돼 후속 build로 대체됐다. |
| `681c24bd-c90e-4fc3-ba47-b8ff6efb8840` | `FINISHED` | 2026-08-13 최종 Preview Build. WebView 오류 화면·loading 정렬과 iOS 오프라인 retry 중 하단 탭 유지를 포함하며 Android 표적 회귀와 iPhone 후속 검증을 통과했다. |

현재 최종 build 페이지는 [EAS Build 681c24bd](https://expo.dev/accounts/jungjh0519/projects/my-webview-app/builds/681c24bd-c90e-4fc3-ba47-b8ff6efb8840)이다. internal artifact는 EAS의 만료 정책을 따르므로 영구 배포 URL로 간주하지 않는다. 최종 제출 직후 artifact가 HTTP 200으로 내려오는 것과 실제 iPhone 설치·실행을 각각 확인했다.

EAS CLI는 `cli.appVersionSource`가 향후 필수가 된다는 경고와 `ios.infoPlist.ITSAppUsesNonExemptEncryption` 미설정 경고를 표시했다. 두 항목은 이번 ad hoc Preview 설치를 막지 않았으며, App Store/TestFlight를 시작할 때 실제 암호화 사용 범위와 version source 정책을 결정한 뒤 별도로 처리한다. 이번 4단계에서는 추측으로 값을 추가하지 않았다.

## 4. 실기기에서 발견한 결함과 수정 과정

### 4.1 iOS Web 탭 header

메인화면·네이버·다음 Web 탭에 제목과 `<`, `>`가 있는 header가 보이는 것은 참고 iOS 앱의 back/forward UX를 반영한 의도된 구현으로 확인했다. Android에는 이 iOS 전용 header가 표시되지 않는다.

### 4.2 탭 전환 시 WebView 상태 손실과 Android 하단 탭 가림

초기 iPhone 검증에서는 네이티브 탭을 제외한 Web 탭이 탭을 누를 때마다 다시 로드되고, 다른 탭으로 이동했다 돌아와도 이전 페이지와 history를 유지하지 못했다. 같은 탭을 재선택할 때만 초기화하고 다른 탭 전환에서는 상태를 보존한다는 계약에 실패한 것이다.

- inactive `WebTab`을 `display: none`으로 제거하지 않고 native hierarchy에 둔 채 `opacity: 0`, `pointerEvents: none`, `collapsable: false`로 유지했다.
- inactive WebView의 scroll event가 하단 탭 visibility를 바꾸지 않도록 active 탭의 event만 전달했다.
- 이미 document가 load된 WebView의 후속 `loadUrl`은 React `source` 교체 대신 같은 native WebView 안에서 `window.location.assign(...)`을 실행해 history를 이어갔다.
- 이 변경 직후 Android에서 보이지 않는 full-screen WebView layer가 하단 탭을 덮는 회귀를 발견해 `DemoShell` 하단 탭 layer에 명시적 `zIndex`를 부여했다.

Android에서 탭 표시·전환·재선택·상태 유지·하단 탭 scroll show/hide를 다시 확인했고 모두 통과했다. iPhone에서도 다른 탭 왕복 시 상태 유지와 같은 탭 재선택 초기화를 통과했다.

### 4.3 네이버 content 내부 버튼과 history 재진입

네이버 content 화면의 자체 뒤로가기·음소거·닫기 버튼이 반응하지 않거나, content에서 `<`로 메인으로 돌아온 뒤 같은 content를 다시 선택하면 반응하지 않는 현상을 Android와 iOS에서 확인했다. 이미 load된 WebView를 `source` 변경으로 다시 구성하던 경로를 같은 native WebView의 실제 navigation으로 바꿔 page event와 history를 유지했다.

수정 후 Android와 iPhone에서 content 진입, page 내부 버튼, 뒤로가기, 같은 content 재진입과 반복 동작을 모두 확인했다.

### 4.4 popup header safe area

Android에서 popup header가 status bar 영역으로 올라가는 문제를 먼저 발견해 `react-native-safe-area-context`의 top edge를 적용했다. 중간 iOS build에서는 `Modal` 내부가 별도의 safe-area provider 경계 없이 parent 값을 사용해 iPhone popup header가 status bar와 겹쳤다.

`PopupWebView`의 full-screen `Modal` 안에 `SafeAreaProvider`를 두고 `SafeAreaView edges={["top"]}`를 적용했다. bottom inset은 WebView content에 중복 적용하지 않았다. Android 표적 회귀와 iPhone 최종 build 모두 header 위치, 뒤로가기와 닫기를 통과했다.

### 4.5 iOS pull-to-refresh touch lifecycle

iPhone 네이티브 탭에서 목록을 아래로 당긴 채 손을 놓지 않으면 request가 먼저 끝나고 결과 `Alert`가 떠서, `onScrollEndDrag`가 끝나기 전에 touch 흐름을 가로챘다. `OK` 후에도 spinner와 overscroll 위치가 남는 현상이었다. 빠르게 당겼다가 바로 놓을 때는 재현되지 않았다.

- iOS pull-to-refresh만 drag 종료 전 결과 알림을 보류한다.
- 손을 놓고 controlled `refreshing` 상태와 native bounce가 정리된 뒤 알림을 표시한다.
- timer는 unmount 시 정리한다.
- Android pull-to-refresh와 ref 기반 reload는 기존 즉시 알림 경로를 유지한다.

자동 테스트에서 iOS는 drag 종료 전 alert 미표시, Android는 기존 즉시 alert를 각각 고정했다. Android 표적 회귀와 iPhone의 빠른 pull·길게 유지한 pull을 모두 통과했다.

### 4.6 local HTML 버튼 press feedback

메인화면의 기기와 메시지·탭 제어·사진 버튼은 iOS에서 눌림 feedback이 보이지 않았고 Android에서는 `transition`, `transform`, shadow 조합이 무겁게 느껴졌다.

- 90ms transition, 이동·축소 transform과 눌림 shadow를 제거했다.
- 카테고리별 밝은 배경색과 진한 글자색을 `:active`에서 서로 반전한다.
- iOS WebKit에서도 touch-down 즉시 `:active`가 적용되도록 실제 9개 `<button>`에 빈 `ontouchstart` handler를 추가했다.
- 기존 `onclick`, bridge payload와 접근 가능한 focus outline은 유지했다.

Android와 iPhone에서 9개 버튼의 즉시 색상 반전·즉시 복귀와 기존 기능을 모두 통과했다.

## 5. 자동 검사와 Android 표적 회귀

2026-08-12 당시 source에서 다음 자동 검사를 다시 실행했다.

| 검사 | 결과 |
|---|---|
| `npm test -- --runInBand` | 15 suites, 47 tests 통과 |
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npx expo install --check` | dependencies up to date |
| `npx expo-doctor` | 18/18 통과 |
| `git diff --check` | 통과 |

완료된 Android 전체 인수 검증을 처음부터 반복하지 않고 수정 영향만 두 차례 표적 회귀했다.

1. WebView lifecycle·history와 layer 수정 후 탭 표시, 탭 상태 유지·재선택, 네이버 content 버튼·재진입, popup, 하단 탭 scroll show/hide를 확인했다.
2. 최종 iOS 수정 후 local HTML 9개 버튼 feedback·기능, Bing popup header와 네이티브 pull-to-refresh를 확인했다.

사용자는 두 표적 회귀의 모든 항목이 LG `LM-V500N`, Android 12에서 성공했고 특이사항이 없다고 확정했다. 최종 Android 확인 뒤 Metro `8081`을 종료하고 `adb reverse tcp:8081`을 제거한 상태에서 iOS EAS Build를 진행했다.

## 6. iPhone 최종 검증 결과

최종 build 설치 뒤 사용자는 Codex가 제안한 핵심 시나리오, 수정 과정에서 추가한 회귀 시나리오, Android에서 진행했던 나머지 전체 검증 항목을 iPhone에서 동일하게 수행했다.

| 영역 | 실제 확인 항목 | 결과 |
|---|---|---|
| 설치·기본 UI | 설치, 첫 실행, 네 개 탭, iOS Web 탭 header | 통과 |
| 탭 lifecycle | 다른 탭 왕복 시 WebView 상태·history 유지, 같은 탭 재선택 시 초기화 | 통과 |
| 일반·popup WebView | Google/Bing, 검색, back/forward, swipe, popup history·뒤로가기·닫기 | 통과 |
| page 내부 interaction | 네이버 content 버튼, 뒤로가기 후 같은 content 재진입과 반복 동작 | 통과 |
| 외부 앱 | `tel:`, `sms:`, `mailto:` 전환과 앱 복귀 | 통과 |
| 자체 scheme·deep link | `WebViewAppDemo` 호출, cold/warm 앱 진입, target 탭·URL 전달, 잘못된 target 거부 | 통과 |
| bridge 기본 | 스마트폰 종류, 기기 고유번호, toast 대체 snackbar, local notification | 통과 |
| bridge 탭 제어 | 나머지 탭 reload, 다른 탭 이동·URL load, 하단 탭 show/hide | 통과 |
| 사진 | 권한 흐름, 단일·복수 이미지 전달, 이름·이미지 표시, 취소·재시도 | 통과 |
| 네이티브 사용자 목록 | 최초 조회, scroll, reload, 빠른 pull과 길게 유지한 pull-to-refresh, spinner 복귀 | 통과 |
| 하단 탭·화면 lifecycle | scroll·keyboard에 따른 show/hide, tab 전환과 상태 복원 | 통과 |
| network·오류 복구 | network 배너, WebView/API 오류 표시, retry·초기 화면과 하단 탭 유지 | 2026-08-13 후속 통과 |

2026-08-12 표에는 network·오류 복구가 통과로 정리됐지만, 사용자가 2026-08-13 실제 네트워크 단절 재현이 누락됐음을 확인했다. 위 행은 후속 build와 실기기 검증으로 보완한 최신 판정이며, 당시 수행하지 않은 항목을 자동 검사만으로 통과 처리한 것이 아니다.

## 7. 확인됨·미확인·차단 요소

### 확인됨

- EAS internal iOS Preview Build 생성, artifact 제공, iPhone 11 설치·첫 실행
- 참고 iOS 앱과 공통인 사용자 기능과 iOS 고유 navigation·safe area·touch lifecycle
- Android 수정 영향 표적 회귀
- source/test/config 자동 검사와 공개 전 credential·기기 식별자 감사
- 네트워크 단절 상태의 WebView 오류 화면, retry·초기 화면, loading 전환과 iOS 하단 탭 유지

### 미확인 또는 4단계 제외

- 로컬 macOS/Xcode build·debug: macOS를 사용할 수 없어 수행하지 않음
- App Store Connect upload, TestFlight, production release signing과 심사
- Universal Links/App Links, remote push notification service와 실제 원격 payload
- iPad, iPhone 11 이외 기기와 iOS version matrix
- EAS artifact 만료 뒤 재설치와 장기 운영 관찰

### 차단 요소

4단계 완료를 막는 차단 요소는 없다. macOS 부재는 EAS remote build와 iPhone runtime 검증으로 build·설치 목표를 충족했지만, 로컬 Xcode debugging을 확인했다는 의미는 아니다.

## 8. Git 경계

source/test/config는 다음 의미 단위로 분리했다.

| Commit | 의미 |
|---|---|
| `427c5dec697f0de8526c4f3629dc15a82aa1725b` | `Build: iOS EAS Preview 연결 설정` |
| `7043ac5787d26786afec7cede4895b4451d4f398` | `Fix: WebView 탭 상태와 탐색 history 유지` |
| `963fe2cae4e4ff490dabcc62931ff740c15a1ae0` | `Fix: iOS popup inset과 새로고침 lifecycle 보정` |
| `552fc65d7d5de38403bae393b5bd6beedaffa130` | `Fix: WebView HTML 버튼 눌림 피드백 개선` |
| `073c2cad87ccd2b8dc6d91dd604fa631b4829fff` | `Fix: WebView 오프라인 오류 화면과 복구 보정` |

`app.json`의 공개 EAS project 연결과 `eas.json`만 build commit에 포함했다. remote signing credential, generated `ios/`·`android/`, `.expo/`, IPA, APK, log, screenshot과 실기기 identifier는 Git에 포함하지 않았다. 이 문서와 기존 계획·handoff의 상태 갱신은 source commit과 분리한 `Docs:` commit으로 반영한다.

## 9. GitHub 1차 반영 결과

4단계 시작 기준 local `HEAD`, `origin/master`와 `git ls-remote`는 모두 `330586de1c5745cf73624c116f13d016e6864ae5`였고 worktree는 clean이었다. 4단계에서 만든 build 설정과 기능 수정 4개 commit, 본 완료 결과 문서 commit을 `master`에 fast-forward push했다.

| 순서 | Commit | 의미 |
|---|---|---|
| 1 | `427c5dec697f0de8526c4f3629dc15a82aa1725b` | EAS Preview 연결 설정 |
| 2 | `7043ac5787d26786afec7cede4895b4451d4f398` | WebView 탭 상태·history 유지 |
| 3 | `963fe2cae4e4ff490dabcc62931ff740c15a1ae0` | iOS popup inset·refresh lifecycle |
| 4 | `552fc65d7d5de38403bae393b5bd6beedaffa130` | local HTML 버튼 feedback |
| 5 | `bada27e6372ece4991cb3c66bcc94e4f12a88481` | 4단계 완료 결과와 인계 문서 |

첫 push 뒤 local `HEAD`, `origin/master`, `git ls-remote --heads origin master`와 unauthenticated GitHub REST API의 `master` SHA가 모두 `bada27e6372ece4991cb3c66bcc94e4f12a88481`로 일치했고 ahead/behind는 `0 0`이었다. GitHub API에서 저장소 `Jaehoon81/expo-webview-demo`가 `public`, default branch가 `master`임도 다시 확인했다.

첫 push 확인 중 README의 iOS 상태와 자동 test 수치가 4단계 이전 값인 것을 발견했다. README의 현재 검증 상태·문서 link와 본 GitHub 결과 기록은 기능 변경과 분리한 후속 `Docs:` commit으로 반영한다. 후속 commit의 정확한 SHA와 최종 parity는 Git history와 closeout 보고를 기준으로 한다.

## 10. 종료 상태와 다음 단계

4단계는 완료됐다. 다음 제품 단계는 5단계 `최종 인계 문서·source 주석·학습서 정리`다. 이번 closeout은 4단계 source·test·build config·검증 문서와 GitHub 반영까지만 수행하며, 5단계의 README·AGENTS·architecture·source commentary·learning guide 작업은 사용자의 별도 시작 지시 전에는 시작하지 않는다.

## 11. 2026-08-13 오프라인 오류 복구 후속 검증

### 11.1 발견한 차이와 source 수정

이전 iPhone 전체 검증에서 실제 네트워크 단절 항목이 빠진 것을 확인한 뒤 네이버·다음 탭을 오프라인으로 다시 검증했다.

- WebView 오류 overlay는 전체 탭 영역의 중앙에 있었지만 하단 탭이 absolute layer로 겹쳐 실제 보이는 영역에서는 제목·내용·버튼 묶음이 아래로 치우쳐 보였다. `DemoShell`이 이미 계산하던 `60 + safe-area bottom`을 `WebTab`에 전달하고, 오류 overlay의 bottom padding에 반영해 Android와 iOS의 가시 영역 중앙을 맞췄다.
- iOS에서 오프라인 상태로 `다시 시도` 또는 `초기 화면`을 누르면 WKWebView가 load 전환 중 보낸 scroll event가 하단 탭 숨김으로 해석됐다. 오류 발생부터 성공 `onLoad`까지 iOS 오류 복구 ref로 합성 scroll 전달을 막고, 오류·retry·초기 화면에서는 하단 탭 표시를 유지했다. 성공 뒤에는 ref를 해제해 정상 scroll show/hide로 복귀한다. Android 경로는 이 iOS 조건 밖에 유지했다.
- `renderLoading`의 spinner와 `웹 페이지를 불러오고 있습니다.` 묶음에는 하단 탭 inset이 없어서 오류 화면과 전환될 때 세로 위치가 달랐다. loading과 오류 overlay가 같은 `padding: 24`와 같은 bottom inset style을 사용하도록 맞췄다.
- 네이티브 사용자 목록의 loading과 오류 화면은 기존부터 같은 `centeredContentStyle`과 `bottomContentInset + 24`를 사용하므로 추가 source 변경이 필요하지 않았다.

### 11.2 자동·Android·iPhone 검증

| 검증 | 결과 |
|---|---|
| Jest | 15 suites, 50 tests 통과 |
| TypeScript | `npm run typecheck` 통과 |
| ESLint | `npm run lint` 통과 |
| Expo dependency | `npx expo install --check` 통과 |
| Expo Doctor | 18/18 통과 |
| Android 표적 회귀 | 오류 화면 위치, retry·초기 화면, loading 전환과 기존 하단 탭 동작 모두 통과 |
| iOS 최종 build | `681c24bd-c90e-4fc3-ba47-b8ff6efb8840`, `FINISHED`, internal `preview` |
| iPhone 11·iOS `18.7.8` | 네이버·다음 오프라인 오류 위치, 두 버튼의 반복 실패, 하단 탭 유지, loading 위치, 네트워크 복원 후 정상 load와 scroll 동작 모두 통과 |

사용자는 먼저 Android에서 요청한 수정 사항을 모두 확인하고 통과를 확정했다. 이어 현재 최종 EAS build를 iPhone에 설치해 같은 항목을 실기 검증했고 모두 통과했다고 확정했다. build 성공이나 자동 테스트만으로 실기기 성공을 대신 판정하지 않았다.

### 11.3 최신 경계와 다음 시작점

- source/test는 `073c2cad87ccd2b8dc6d91dd604fa631b4829fff`로 문서와 분리했다.
- 새 package, native config, EAS profile과 credential 변경은 없다. 기존 remote credential과 등록 기기를 재사용했으며 signing identifier, 기기 identifier와 IPA는 Git에 기록하지 않는다.
- EAS의 `cli.appVersionSource` 향후 필수화와 `ios.infoPlist.ITSAppUsesNonExemptEncryption` 미설정 경고는 이번 ad hoc Preview Build를 막지 않았다. App Store/TestFlight 범위에서 실제 정책을 정하기 전에는 추측으로 config를 추가하지 않는다.
- Android용 새 APK는 만들지 않았고 Metro runtime에서 영향 범위만 재검증한 뒤 Metro `8081`을 종료했다.
- 4단계의 누락된 network 실기 항목까지 보완됐으며 차단 요소는 없다. 다음 미완료 제품 단계는 여전히 5단계이고, 이 문서·GitHub closeout 뒤 사용자의 별도 시작 지시를 기다린다.

## 12. 2026-08-13 5단계 시작과 문서 인계

사용자가 5단계 `최종 인계 문서·source 주석·학습서 정리`를 승인했다. 새 작업은 한글 architecture, canonical FLOW source 주석, 독립 source 안내서와 대화형 학습 자료 정리에 한정하며 iOS production 실행식, `app.json`, `eas.json`, remote credential과 설치 Preview Build를 변경하지 않는다.

따라서 EAS build·설치·iPhone 전체 흐름과 11절 오프라인 후속 검증은 반복하지 않는다. 5단계 산출물·자동 검사·공개 감사와 Git closeout의 최신 상태는 [2026-08-13 5단계 최종 인계](./2026-08-13-step-5-final-handoff.md)를 우선한다. App Store Connect, TestFlight, production signing, local Xcode와 기기 matrix는 계속 제외 범위다.

## 13. 2026-08-13 5단계 완료와 최종 경계

사용자가 5단계 결과 검토 뒤 commit/push와 전체 문서 정합성 감사를 승인했다. Source·test·tooling 주석은 `c13dbaebad4e4a09a79fa78be1e33819585e0cff`, `AGENTS.md`·README·architecture·학습·인계 본문은 `095d42817ba8df7ce87a722ba4f9ab6bf95720b9`로 분리했다. 첫 push 뒤 local·tracking·live remote와 GitHub API의 `master`가 `095d42817ba8df7ce87a722ba4f9ab6bf95720b9`로 일치했다.

마지막 `Docs: 5단계 GitHub closeout 기록` commit은 `docs/`의 과거 snapshot과 최신 우선 관계만 정리한다. EAS build, credential, signing, package/native config, 설치 앱과 iPhone runtime은 변경하거나 다시 검증하지 않았다. 따라서 이 문서의 iOS·Android 실기기 증거와 제외 범위는 그대로 유지되며, 현재 제품·Git 상태는 [5단계 최종 인계](./2026-08-13-step-5-final-handoff.md)를 우선한다.
