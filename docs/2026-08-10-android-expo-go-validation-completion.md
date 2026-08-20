# Android Expo Go 실기기 검증 완료 보고서

- 완료일: 2026-08-10
- 프로젝트: `D:\Development\ReactNative\Workspaces\my-webview-app`
- 기준 계획서: [implementation-plan.md](./implementation-plan.md)
- 이전 기록: [2026-08-07 Android Expo Go 실기기 검증 인계](./2026-08-07-android-expo-go-validation-handoff.md)
- 검증 플랫폼: Android Expo Go
- 최종 상태: Android Expo Go 범위 1~40단계 통과

## 1. 완료 범위와 남은 경계

LG `LM-V500N`, Android 12(API 31), Expo Go `54.0.8`에서 Android Expo Go 인수 범위를 완료했다. 네 개 탭, WebView 탐색과 popup, 외부 앱 링크, 자체 deep link, bridge, 사진, 알림, 네이티브 사용자 목록, 하단 탭 animation, 키보드, 상태 복원, 오류·retry와 Android hardware back을 실제 기기에서 확인했다.

다음 항목은 이번 완료 판정에 포함하지 않는다.

- iOS 실기기 전체 흐름: Android 완료 당시 Windows 환경이므로 미검증
- 외부 OS에서 `mywebviewapp://`을 직접 실행하는 경로: Expo Go 제약 때문에 development build에서 별도 검증 필요
- 원격 push notification: 데모 요구사항은 로컬 알림이며 원격 push는 범위 밖
- Git commit/push: 수행하지 않고 기존 `reset-project` 이후 작업 상태를 보존

## 2. 검증 환경

| 항목 | 값 |
|---|---|
| Android 기기 | LG `LM-V500N` |
| Android | 12 / API 31 |
| Expo Go | `54.0.8` |
| Expo SDK | 54 |
| 연결 | USB ADB, `tcp:8081` reverse |
| Metro | 로컬 `8081` |
| 사진 picker | Android DocumentsUI `PickActivity` |
| 네트워크 실패 검증 | 비행기 모드 전환 후 원상 복원 |

사진 권한과 네트워크는 검증 종료 전에 모두 복원했다. 사진 원문과 base64 본문은 로그에 남기지 않았다.

## 3. 단계별 최종 결과

### 1~24단계와 버튼 UI

2026-08-07에 다음 범위를 통과했고 이번 검증에서도 관련 회귀가 발견되지 않았다.

| 단계 | 검증 항목 | 최종 결과 |
|---:|---|---|
| 1~4 | 로컬 HTML, 네이버, 다음, 네이티브 사용자 목록 최초 표시 | 통과 |
| 5~8 | Google 동일 WebView, Android back, Bing popup 열기·닫기 | 통과 |
| 9~11 | `tel:`, `sms:`, `mailto:` 외부 앱 전달 | 통과 |
| 12~13 | 자체 deep link와 popup 내부 history | 통과 |
| 14~16 | 기기 타입, UUID 지속성, Android Toast | 통과 |
| 17~20 | foreground/background 로컬 알림, 알림 응답, 권한 거부·복원 | 통과 |
| 21 | `reloadOtherTabs`로 다른 탭을 초기 URL로 복원 | 수정 후 통과 |
| UI-A | 카테고리별 버튼 색상과 touch 눌림 피드백 | 수정 후 통과 |
| 22~24 | 다른 탭 이동, 하단 탭 bridge 숨김·복원 | 통과 |

### 25~40단계

| 단계 | 검증 항목 | 최종 결과 |
|---:|---|---|
| 25 | 사진 picker 취소와 error callback | 통과 |
| 26 | 사진 한 장 변환·미리보기와 두 번째 영역 초기화 | 통과 |
| 27 | 사진 두 장 선택·변환·미리보기 | 통과 |
| 28 | 사진 권한 거부 오류, 권한 복원, 복원 후 picker 취소 | 통과 |
| 29 | WebView scroll 방향에 따른 하단 탭 숨김·복원 | 통과 |
| 30 | 네이티브 `FlatList` scroll 방향과 마지막 행 하단 여백 | 수정 후 통과 |
| 31 | 키보드 표시·해제에 따른 하단 탭 숨김·복원 | 통과 |
| 32 | Expo Go cold restart 후 마지막 선택 탭 복원 | 통과 |
| 33 | 현재 Web 탭 재선택 시 초기 URL reload | 통과 |
| 34 | 현재 네이티브 탭 재선택 시 사용자 API refetch | 통과 |
| 35 | 네이티브 목록 pull-to-refresh | 통과 |
| 36 | popup history → popup 닫기 → WebView history → 두 번 눌러 종료 우선순위 | 통과 |
| 37 | 일반 WebView 네트워크 오류, 커스텀 오류 UI, retry, 초기 화면 | 수정 후 통과 |
| 38 | HTTP 탐색 차단 알림과 기존 HTTPS/로컬 화면 유지 | 통과 |
| 39 | 네이티브 최초 요청 실패, `Network Error`, retry 복구 | 통과 |
| 40 | popup WebView 네트워크 오류, 커스텀 오류 UI, retry, 닫기 | 수정 후 통과 |

## 4. 검증 진행 방식

한 번에 한 판정만 수행하는 단계식 방식으로 진행했다.

1. Codex가 검증 목적, 사용자 동작, 기대 결과를 한 단계씩 안내했다.
2. 사용자가 실제 기기에서 동작한 뒤 관찰 결과를 답했다.
3. 실패나 추가 문제가 있으면 다음 단계로 넘어가지 않고 원인 진단과 최소 수정을 먼저 수행했다.
4. 수정 후 관련 이전 단계까지 다시 검증했다.
5. Codex는 ADB foreground/권한/네트워크 상태, Metro log, UIAutomator text와 WebView CDP를 보조 증거로 사용했다.
6. WebView 오류와 HTTP 차단은 production UI를 추가하지 않고 CDP에서 예약된 실패 URL 또는 HTTP 이동을 요청해 결정적으로 재현했다.
7. source 변경 전에는 Impact Review를 수행하고 변경 후 Jest, TypeScript, lint를 실행했다.

실기기 관찰과 자동 증거를 구분했다. 자동 검사 통과만으로 runtime 성공을 판정하지 않았고, 최종 통과는 사용자의 실제 화면 확인까지 완료된 경우에만 기록했다.

## 5. 발견 문제와 조치

### 다른 탭 초기 URL reload

- 증상: NATE로 변경된 네이버 탭이 `나머지 탭 리로드` 후에도 NATE에 머물렀다.
- 원인: 현재 URL에 `reload()`만 수행했다.
- 조치: `src/components/DemoShell.tsx`에서 다른 WebView의 `reloadInitial()`을 호출하도록 변경했다.
- 결과: 21단계 재검증 통과.

### 로컬 HTML 버튼 UI

- 증상: 버튼의 눌림 피드백이 약하고 퍼플 계열 색상이 무거웠다.
- 조치: `src/web/local-html.ts`에서 기기·메시지, 탭 제어, 사진 카테고리를 라이트 블루·그린·오렌지로 구분하고 touch active 효과를 추가했다.
- 결과: 사용자 UI 확인 통과.

### 사진 두 장 선택

- 최초 증상: 첫 사진을 짧게 누르면 picker가 즉시 종료되어 한 장만 표시됐다.
- 진단: `expo-image-picker`의 `allowsMultipleSelection: true`, `selectionLimit: 2` 전달은 정상이었다. LG Android 12 DocumentsUI에서는 첫 사진을 길게 눌러 다중 선택 mode에 들어간 뒤 두 번째 사진을 짧게 누르고 `열기`를 선택해야 했다.
- 조치: 앱 source 수정 없이 기기 picker 조작 절차를 확정했다.
- 결과: 25~27단계 재검증 통과. 두 PNG data URL, 두 미리보기와 두 이름 영역을 확인했다.

### 사진 섹션 마지막 이름 영역 가림

- 증상: 두 번째 사진 아래 이름 영역이 절대 배치 하단 탭에 가려졌다.
- 원인: 로컬 HTML `body` 하단 여백 `48px`이 실제 하단 탭 `60px + safe-area`보다 작았다.
- 조치: `src/web/local-html.ts`의 하단 padding을 `120px`로 늘리고 정적 계약 테스트를 추가했다.
- 결과: 마지막 콘텐츠가 하단 탭 위에 정상 노출됨.

### 네이티브 목록 scroll 방향 반전과 마지막 행 가림

- 증상: 손가락을 위로 움직인 뒤 하단 탭이 다시 나타나고, 아래로 움직인 뒤 숨었다. 마지막 사용자 카드도 하단 탭에 가려졌다.
- 진단: 목록의 짧은 scroll 범위에서 경계 보정 이벤트가 `7 → 101 → 92`처럼 반대 delta를 만들었고, 연속 event 간 offset 비교가 마지막 상태를 뒤집었다.
- 조치: `src/components/NativeUsersScreen.tsx`에서 매 event의 이전 offset이 아니라 `onScrollBeginDrag`의 시작 offset을 기준으로 방향을 유지했다. `DemoShell`이 계산한 `60px + safe-area`를 전달해 목록 하단에 해당 높이와 기본 여백을 추가했다.
- 결과: 손가락 위 숨김, 아래 복원, 경계 이후 상태 유지와 마지막 카드 비가림을 모두 확인했다.

### WebView 기본 오류 화면 노출

- 증상: 일반 WebView와 popup WebView에서 앱 커스텀 오류 UI 대신 `react-native-webview` 기본 영문 오류 화면이 표시됐다.
- 원인: 설치된 `react-native-webview@13.15.0`은 `onError` callback 이후 event가 취소되지 않으면 내부 `ERROR` 상태와 `defaultRenderError`를 표시한다. 실패 후 내부 오류 문서의 `onLoadStart`가 앱 오류 상태도 지웠다.
- 조치: 일반 `WebTab`은 `onError`에서 `event.preventDefault()`를 호출하고, `onLoadStart`에서는 오류 상태를 지우지 않도록 변경했다. popup은 후속 네트워크 배너 검증에서 이 방식이 내부 `LOADING` 상태를 유지한다는 점을 확인해 `preventDefault()`를 제거하고 빈 `renderError`로 기본 오류 UI만 억제하는 방식으로 최종 변경했다. 오류는 retry, 초기 화면, popup 닫기 같은 명시적 복구 경로에서만 해제한다.
- 결과: 일반 WebView와 popup 모두 커스텀 오류 UI, retry와 복구 동작 통과.

## 6. 최종 자동 검증

| 명령 | 결과 |
|---|---|
| `npm test -- --runInBand` | 10개 suite, 35개 test 통과 |
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |

Jest에는 Node의 `punycode` deprecation warning이 출력됐지만 test 실패는 없었다.

## 7. 다음 작업

Android Expo Go 핵심 검증은 완료됐다. 다음 검증은 환경이 준비될 때 별도 세션으로 수행한다.

1. macOS와 iOS 실기기에서 전체 흐름 확인
2. development build 생성 후 외부 OS에서 `mywebviewapp://webviewappdemo?...` 직접 실행
3. 필요하면 Android development build에서도 Expo Go와의 차이만 표적 재검증

새 세션에서는 이 문서와 [implementation-plan.md](./implementation-plan.md)를 먼저 읽고, Android에서 이미 통과한 1~40단계를 근거 없이 반복하지 않는다.

이 절은 Android 1~40단계 완료 당시의 다음 작업 기록이다. 2026-08-10 후속 보완과 사용자가 확정한 최신 2~5단계 인계 범위는 9절을 우선한다.

## 8. 완료 후 참고 앱 재대조에 따른 후속 보완

이 절은 1~40단계 완료 이후 추가 비교에서 발견한 차이와 2026-08-10 후속 구현을 기록한다. 앞 절의 통과 판정은 당시 source와 runtime에 대한 이력으로 유지하며, 이번 변경의 실기기 판정으로 소급하지 않는다.

### 발견한 차이

- 참고 Android/iOS 앱은 네이티브 화면이 아직 생성·활성화되지 않았다면 메인 화면의 `나머지 탭 리로드`에서 네이티브 API를 요청하지 않는다.
- 한 번 활성화된 네이티브 화면은 이후 `나머지 탭 리로드` 대상에 포함되며, 메인 화면 위에서도 API 성공·실패 popup이 표시된다.
- 기존 Expo 구현은 활성화 이력과 무관하게 네이티브 refetch를 호출했고, 비활성 상태에서 완료된 결과가 최초 진입 popup을 소모할 수 있었다.
- iOS 참고 앱에는 전역 네트워크 차단 modal이 있지만 Android 참고 앱에는 같은 전역 UI가 없다.

### 반영한 권장안

- `NativeUsersScreen`에 최초 활성화 이력을 추가하고, 최초 진입 전 조건부 refetch는 건너뛰도록 했다.
- 최초 진입은 활성화된 Query가 직접 요청하고 결과 popup을 표시한다. 활성화 이후 `나머지 탭 리로드`는 사용자 API도 refetch하고 결과 popup을 표시한다.
- 오류 화면의 `다시 시도`도 성공·실패 결과를 알리도록 기존 silent refetch를 수정했다.
- [Expo SDK 54 Network 공식 문서](https://docs.expo.dev/versions/v54.0.0/sdk/network/)에 맞는 `expo-network~8.0.8`을 설치했다.
- `NetworkStateType.NONE`일 때 일반 탭과 전체 화면 popup에 종료·설정 강제가 없는 지속형 배너를 표시하고, 복원 시 즉시 제거한다. `UNKNOWN`은 오프라인으로 오인하지 않으며 자동 API 재요청도 하지 않는다.

### 자동 검증

| 명령 | 결과 |
|---|---|
| `npm test -- --runInBand` | 12개 suite, 39개 test 통과 |
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npx expo install --check` | 의존성 정합성 통과 |
| `npx expo-doctor` | 18/18 checks 통과 |

신규 테스트는 비활성 조회 결과 보존, 최초 활성화 전·후 조건부 refetch, 오류 retry 결과 popup, 배너 표시 조건과 native loading/error 하단 inset을 검증한다.

### Android 실기기 표적 재검증 완료

LG `LM-V500N`, Android 12(API 31), Expo Go `54.0.8`에서 A-1~C-5를 한 판정씩 진행했다.

- A-1~A-2: 네이티브 최초 진입 전 `나머지 탭 리로드`는 사용자 API popup을 만들지 않았고, 최초 진입에서만 `사용자 목록을 불러왔습니다.` popup과 목록이 표시됐다.
- A-3~A-5: 네이티브 활성화 이후 메인 화면의 `나머지 탭 리로드`는 `사용자 목록을 새로 불러왔습니다.` popup을 표시했고, NATE로 변경된 네이버 탭을 `https://m.naver.com`으로 복원했다.
- B-1~B-4: 일반 화면과 popup에서 단절 배너를 확인했다. 네트워크 복원은 배너만 제거하고 Bing을 자동 재요청하지 않았으며, 사용자가 `다시 시도`를 누른 뒤 정상 복구됐다.
- C-1~C-5: 활성화된 사용자 API의 오프라인 refetch가 메인 화면 위에 `사용자 조회 실패`와 `Network Error`를 표시했다. 네이티브 오류 화면에서 네트워크를 복원해도 목록과 성공 popup은 자동으로 나타나지 않았고, `다시 시도` 후에만 정상 복구됐다.

### 표적 검증 중 추가 발견과 최종 조치

#### popup 배너와 header 가림

- 증상: 오프라인 popup 오류 화면에서 단절 배너와 뒤로가기·`팝업 웹 페이지`·닫기 header가 보이지 않았다.
- 근본 원인: 설치된 `react-native-webview@13.15.0`의 `onLoadingError`는 앱의 `onError` 호출 후 event가 prevent되면 내부 `viewState`를 `ERROR`로 바꾸지 않는다. popup의 `preventDefault()` 때문에 흰 `renderLoading` 레이어가 `LOADING` 상태로 남아 앞선 배너와 header를 가렸다.
- 최종 조치: popup에서는 `preventDefault()`를 제거하고 빈 `renderError`로 라이브러리 기본 오류 화면만 숨겼다. 앱 오류 상태에서는 `containerStyle`로 WebView 바깥 container를 숨겨 WebView mount·history·ref는 유지하고 오류 UI가 전체 콘텐츠 영역을 차지하게 했다.
- 결과: 단절 배너, popup header, 중앙 정렬된 커스텀 오류 UI와 두 버튼이 함께 표시되고 기본 오류 화면은 나타나지 않았다. 복원 후 수동 retry도 통과했다.

#### 네이티브 loading/error 중앙 위치

- 증상: 네이티브 오류 묶음이 화면 중앙보다 아래에 표시됐다.
- 원인: 목록에는 하단 탭 inset이 적용됐지만 loading/error의 중앙 정렬 영역은 절대 배치 하단 탭 아래까지 포함했다.
- 조치: `bottomContentInset`을 loading/error 영역의 하단 padding에도 반영해 실제 가시 영역 중앙으로 보정했다.
- 결과: 단절 배너와 native header를 유지한 상태에서 오류 묶음이 header와 하단 탭 사이 중앙에 표시되고 탭과 겹치지 않았다.

#### 오프라인 중 Metro bundle 갱신

- 진단 과정에서 기기가 오프라인인데 Expo Go가 `exp://<LAN_IP>:8081` LAN 주소로 열려 있어 source 수정 bundle을 받지 못했다. 이 때문에 초기 재검증은 수정 전 bundle을 반복 확인했다.
- 기존 `adb reverse tcp:8081 tcp:8081`을 확인한 뒤 `exp://127.0.0.1:8081`로 프로젝트를 다시 열어 최신 bundle을 로드했다.
- 이후 오프라인 실기기 수정·재검증에서는 USB reverse 주소를 사용한다.

### 후속 보완 최종 자동 검증

| 명령 | 결과 |
|---|---|
| `npm test -- --runInBand` | 12개 suite, 39개 test 통과 |
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npx expo install --check` | 의존성 정합성 통과 |
| `npx expo-doctor` | 18/18 checks 통과 |

## 9. 2~5단계와 새 세션 인계

Android Expo Go 구현·검증과 A-1~C-5 후속 표적 검증은 완료됐다. 2026-08-10 사용자의 최신 결정에 따라 Public GitHub 저장소와 초기 이력을 새 2단계로 편입하고 기존 작업을 3~5단계로 순연한다. 이후 작업은 [implementation-plan.md](./implementation-plan.md) 11절의 계약을 기준으로 한다.

| 단계 | 작업 | 상태 | 핵심 완료 증거 |
|---|---|---|---|
| 2 | Public GitHub 저장소 생성과 의미별 초기 commit/push | 완료 | [GitHub 초기 push handoff](./2026-08-10-github-repository-and-initial-push-handoff.md)의 공개 감사, 의미별 이력과 원격 일치 |
| 3 | Android development build와 외부 custom scheme 검증 | 완료 | [2026-08-11 완료 문서](./2026-08-11-android-development-build-and-custom-scheme-validation.md)의 cold/warm 진입, 표적 회귀, Metro-off ANR과 사용자 HTTPS 링크 검증 |
| 4 | iOS 실기기 전체 흐름 검증 | 완료 | [2026-08-12 iOS 완료 문서](./2026-08-12-ios-eas-preview-build-and-device-validation.md)의 EAS Preview Build, iPhone 전체 결과, Android 표적 회귀와 2026-08-13 network 후속 검증 |
| 5 | 최종 인계 문서·source 주석·학습서 정리 | 대기 | 문서·주석·학습서 정합성, 전체 검사, 후속 commit/push와 원격 일치 |

2026-08-12 후속 갱신으로 3단계와 4단계를 완료 처리했다. 아래의 2단계 공개 감사와 일시적 상태는 2026-08-10 당시 이력으로 보존하며, 최신 상태는 [implementation-plan.md](./implementation-plan.md) 16절, 이 문서 13절과 [5단계 최종 인계](./2026-08-13-step-5-final-handoff.md)를 우선한다.

### 2단계 Public 공개 전 감사 상태

- known token·API key·private key·credential 파일과 repository 사진·screenshot은 발견되지 않았다.
- Git 작성자 이메일은 repository-local GitHub ID 기반 `noreply` 주소로 설정했다. 전역 Git 설정은 변경하지 않았다.
- local HTML의 demo 이메일은 `demo@example.com`으로 교체했다. 전화번호는 명백한 placeholder pattern을 유지한다.
- `package-lock.json`의 이메일 유사 값은 npm dependency maintainer metadata이며 사용자 정보가 아니다.
- `.claude/settings.json`, `.vscode/*`, `CLAUDE.md`, `AGENTS.md`에는 secret이 없다. 포함 여부는 공개 저장소에서 필요한 project guidance인지에 따라 결정한다.
- 실제 LAN IP는 `<LAN_IP>`로 익명화하고 test host는 문서용 `192.0.2.10`으로 교체했다. 다음 단계에 필요한 로컬 reference path는 사용자 식별 정보가 없어 유지한다.

### 5단계 필수 산출물

- Expo starter 상태인 `README.md`를 실제 프로젝트 개요·실행·검사·경로·검증 안내로 교체한다.
- `agents-md-improver` 스킬로 실제 저장소를 조사하고 품질 보고서와 수정안을 먼저 제시한 뒤, 사용자 승인 후 root `AGENTS.md`를 생성 수준으로 보완한다.
- `AGENTS.md`와 연결되는 `docs/architecture-internals.md`에 디렉터리 구조, module 책임, WebView·bridge·탭·native API·network·navigation·상태 수명과 검증 경계를 상세히 기록한다.
- 참고 프로젝트 `D:\Development\ReactNative\Workspaces\my-sample-app` 수준으로 최종 source에 역할·이유·주의·검증 경계와 canonical `FLOW` 주석을 추가하고, `docs/source-commentary-guide.md`에서 source 탐색 순서를 연결한다.
- `docs/learning-guide.md`를 만들어 주요 기능과 데이터 흐름을 실제 source link로 처음부터 끝까지 따라갈 수 있게 설명한다.
- 구현 계획서, Android 완료 보고서, development build·iOS 결과와 최종 handoff의 명령·link·version·검증 수치를 source와 다시 대조한다.
- 2단계에서 만들어진 Public Git 이력 이후의 build, iOS, source 주석과 문서 변경도 단계·기능·의미별 commit으로 나누고 push 결과를 독립적으로 확인한다.

### 현재 확인한 일시적 상태

2026-08-10 이 문서 갱신 시점의 재확인 결과는 다음과 같다. 새 세션에서는 외부 상태가 바뀔 수 있으므로 반드시 다시 확인한다.

- Git branch: `master`
- Git `HEAD`: 1차 push 기준 `651151fba37d61f51adaf95225a19242e4fffe18`, 결과 문서 commit은 2차 push 대상
- Git remote: `origin`을 `https://github.com/Jaehoon81/expo-webview-demo.git`에 연결
- worktree/index: 최초 index 재구성 후 1차 push 시점 clean, 결과 문서 갱신만 2차 commit 대상으로 분리
- GitHub 저장소: Public [Jaehoon81/expo-webview-demo](https://github.com/Jaehoon81/expo-webview-demo), default branch `master`
- Metro port 8081: 닫힘
- Expo Go process: 중지
- `adb reverse tcp:8081`: 제거됨
- 현재 연결된 Android 기기는 충전 목적의 별도 기기이며 이 프로젝트의 검증 대상이 아니다. 사용자가 특정 단계를 위한 검증 기기로 명시하기 전에는 조회·설치·실행에 사용하지 않는다.

### 새 세션 시작 순서

1. root `AGENTS.md`, [implementation-plan.md](./implementation-plan.md) 11절·최신 완료 절과 이 문서 10~11절을 끝까지 읽는다.
2. source, package, Git, Metro·Expo Go와 build 환경을 실제로 다시 확인한다. 실기기는 사용자가 해당 단계의 검증 대상으로 명시한 경우에만 사용한다.
3. 완료된 2~4단계는 반복하지 않고, 현재 미완료인 5단계의 목표·완료 기준·사용자 수동 작업·Codex 작업·제외 범위를 먼저 제시한다.
4. Android Expo Go 1~40단계와 A-1~C-5를 근거 없이 반복하지 않고, 변경 영향이 있는 항목만 표적 회귀 검증한다.
5. source/config 변경, EAS·서명, Git commit/push와 다음 단계는 각각 필요한 조사와 사용자 승인을 거쳐 별도로 시작한다.

권장 재개 요청문은 다음과 같다.

```text
D:\Development\ReactNative\Workspaces\my-webview-app에서 AGENTS.md,
docs/implementation-plan.md의 11절과 최신 완료 절,
docs/2026-08-10-android-expo-go-validation-completion.md의 최신 인계 절을 읽고
현재 source·Git·runtime 상태를 다시 확인해줘.
완료된 2~4단계는 반복하지 말고 5단계의 목표·완료 기준·내가 할 작업·네가 할 작업·제외 범위를 먼저 설명하고,
아직 실제 변경이나 외부 작업은 시작하지 말고 내 시작 승인을 기다려줘.
```

## 10. 2026-08-12 iOS 4단계 완료와 최신 인계

Android Expo Go와 development build 결과는 이전 절의 이력으로 유지한다. 후속 4단계에서는 macOS 없이 EAS internal Preview Build를 생성하고 iPhone 11·iOS `18.7.8`에서 참고 iOS 앱과 Android 동등 전체 흐름을 검증했다.

- EAS owner·project는 개인 계정 `jungjh0519`의 `@jungjh0519/my-webview-app`을 사용했다.
- 2026-08-12 당시 최종 iOS build `108d6471-2b7d-4939-a910-3ac4061dfc2e`가 완료됐고 설치·첫 실행·네 탭을 확인했다.
- Web 탭 상태·history, Android 하단 탭 layer, 네이버 content 재진입, popup safe area, iOS pull-to-refresh와 local HTML 버튼 feedback을 수정했다.
- 수정된 Android 범위는 LG `LM-V500N`, Android 12에서 두 차례 표적 회귀해 모두 통과했다.
- 사용자는 iPhone에서 Google/Bing, 일반·popup 탐색, 외부 앱, 자체 scheme·deep link, bridge 8종, notification, 단일·복수 사진, 하단 탭, 네이티브 사용자 목록과 Android에서 수행했던 나머지 항목을 통과했다고 확정했다. 당시 요약에 포함된 실제 network 단절 재현은 누락된 것으로 2026-08-13 확인돼 아래 11절에서 별도로 보완했다.
- 최종 자동 검사는 Jest 15 suites·47 tests, typecheck, lint, Expo dependency check와 Expo Doctor 18/18을 통과했다.

상세 결과는 [iOS EAS Preview Build와 실기기 전체 흐름 검증 완료 문서](./2026-08-12-ios-eas-preview-build-and-device-validation.md)를 따른다. 다음 미완료 단계는 5단계 `최종 인계 문서·source 주석·학습서 정리`다. 4단계 closeout 이후 5단계는 사용자의 별도 시작 지시를 기다린다.

## 11. 2026-08-13 WebView 오프라인 후속 회귀와 최신 인계

이전 iPhone 검증에서 빠진 실제 네트워크 단절을 재현해 다음 후속 수정과 표적 검증을 완료했다.

- 네이버·다음 오류 화면과 WebView loading에 하단 탭·safe-area inset을 반영해 두 상태의 세로 중심 기준을 맞췄다.
- iOS에서 오프라인 retry·초기 화면 중 발생하는 합성 scroll event가 하단 탭을 숨기지 않도록 오류 복구 lifecycle을 분리했다. Android visibility 경로는 유지했다.
- source/test는 `073c2cad87ccd2b8dc6d91dd604fa631b4829fff`로 분리했고, Jest 15 suites·50 tests, typecheck, lint, Expo dependency check와 Expo Doctor 18/18을 통과했다.
- 사용자는 지정 Android 실기기에서 오류 위치, retry·초기 화면, loading 전환과 하단 탭 동작을 모두 통과했다고 확정했다. 새 Android APK는 만들지 않았고 Metro runtime 검증 뒤 `8081`을 종료했다.
- iOS internal Preview Build `681c24bd-c90e-4fc3-ba47-b8ff6efb8840`을 iPhone 11에 설치해 같은 오프라인 항목과 네트워크 복원 뒤 정상 load·scroll을 모두 통과했다.

상세 원인, build와 iPhone 결과는 [iOS EAS Preview Build와 실기기 전체 흐름 검증 완료 문서](./2026-08-12-ios-eas-preview-build-and-device-validation.md) 11절을 따른다. 4단계의 누락 항목까지 보완됐고 다음 미완료 제품 단계는 5단계다. 이번 문서·GitHub closeout은 5단계를 시작하는 것이 아니며 사용자의 별도 시작 지시를 기다린다.

## 12. 2026-08-13 5단계 시작과 최종 인계

사용자가 5단계 시작, `agents-md-improver` 감사 제안 반영과 새 최종 handoff 작성을 승인했다. 현재 작업은 완료된 Android Expo Go·development build·iOS Preview Build와 오프라인 실기기 검증을 반복하지 않고 source 주석·architecture·학습 자료와 최종 정합성에 한정한다.

- `AGENTS.md`는 실제 source·config·scripts·tests·`.gitignore` 감사와 사전 품질 보고서·수정 제안 승인을 거쳐 한글 project 지침으로 보완한다.
- 현재 production source 전체에 파일 책임과 canonical `FLOW-01`~`FLOW-09`를 연결하고 test에는 mock 검증 경계를 명시한다.
- 새 architecture, source commentary와 대화형 learning guide는 [2026-08-13 5단계 최종 인계](./2026-08-13-step-5-final-handoff.md)를 기준으로 한다.
- 이번 주석·문서 작업은 production 실행식, package·app/EAS config와 native build 입력을 변경하지 않으며 build·설치·실기기·EAS·서명 작업을 수행하지 않는다.
- Commit/push와 원격 일치 확인은 변경·검증 결과를 먼저 제시한 뒤 사용자의 별도 승인 대상으로 유지한다.

따라서 이 문서의 Android 결과는 과거 완료 증거로 그대로 유효하며, 최신 제품 단계 상태는 구현 계획서 16절과 5단계 최종 인계를 우선한다.

## 13. 2026-08-13 5단계 완료와 GitHub closeout

사용자가 5단계 결과 검토 뒤 의미별 commit/push와 전체 `docs/` stale 감사를 승인했다. 완료된 Android build·설치·실기기 검증은 반복하지 않고 주석·문서와 Git 경계만 닫았다.

| Commit | 의미 |
|---|---|
| `c13dbaebad4e4a09a79fa78be1e33819585e0cff` | Production·test·tooling의 파일 역할, 검증 경계와 canonical FLOW 주석 |
| `095d42817ba8df7ce87a722ba4f9ab6bf95720b9` | 한글 `AGENTS.md`, architecture·source commentary·learning guide와 5단계 본문 인계 |

두 commit의 첫 push 뒤 local `HEAD`, `origin/master`, `git ls-remote`와 unauthenticated GitHub REST API의 `master` SHA가 모두 `095d42817ba8df7ce87a722ba4f9ab6bf95720b9`로 일치했고, 저장소는 `public`, default branch는 `master`, ahead/behind는 `0 0`, worktree는 clean이었다.

이후 `docs/` 10개 전체를 source·package·Git history와 대조해 당시 next-step 문장은 역사적 snapshot으로 보존하고 최신 우선 관계를 보완했다. 이 최종 정합성 갱신은 `Docs: 5단계 GitHub closeout 기록` commit으로 분리한다. 자기 자신을 포함하는 commit SHA는 문서에 고정하지 않으며 다음 명령으로 확인한다.

```powershell
git log -1 --format=%H -- docs/2026-08-13-step-5-final-handoff.md
```

현재 제품 단계와 최종 Git 판정은 [5단계 최종 인계](./2026-08-13-step-5-final-handoff.md)를 우선한다. 1~5단계는 완료됐으며 새 build·실기기 작업은 별도 범위와 승인 없이는 시작하지 않는다.

## 14. 2026-08-20 Android 열린 WebView history 후속 검증

이 문서의 기존 Android back 판정은 WebView 안에 뒤로 갈 문서가 없는 상태에서 첫 Back 안내와 두 번째 Back 종료를 확인한 당시 증거다. 이후 메인 화면의 `WebViewAppDemo 호출하기` 또는 `다른 탭 이동 및 URL 로드`가 네이버 탭을 선택한 뒤 네이트를 열었을 때, Android만 첫 hardware Back에서 네이버로 돌아가지 않고 앱 종료 안내로 내려가는 별도 history 결함을 확인했다.

- 원인은 열린 Android WebView에 app 명령을 전달할 때 page-side `window.location.assign`을 사용한 경로가 이 기기의 기대 native back history를 만들지 못한 데 있었다.
- Android의 열린 document는 기존 URL policy를 직접 통과한 뒤 같은 `WebView` key의 `source`를 바꿔 RNWV native `loadUrl()`로 이동한다. iOS의 `location.assign`, 최초 source, Web 재선택의 새 key 경로는 유지했다.
- 같은 URL은 native `reload()`로 처리하고, native Back 뒤 React `source`가 이전 target에 남는 경우에도 다음 같은 target 요청이 prop no-op이 되지 않도록 의미가 같은 GET source 표기를 번갈아 전달한다.
- Source/test 변경은 `bf591b254c1369879adc094fd0d789f3f87a8ee3` (`Fix: Android WebView 방문 기록 유지`)로 분리해 `master`에 반영했다.

지정 Android 실기기 LG `LM-V500N`, Android 12에서 기존 launcher-free development build가 Metro의 최신 JavaScript를 읽는 방식으로 다음을 확인했다. 새 APK나 native build input은 만들지 않았다.

| 시나리오 | 실제 결과 |
|---|---|
| custom scheme → 네이버 탭 → 네이트 | history length `1→2`, 첫 hardware Back이 네이버로 복귀, app process 유지 |
| local bridge `다른 탭 이동 및 URL 로드` | 동일하게 네이트에서 네이버로 복귀 |
| Back 뒤 같은 네이트 target 재요청 | 새 네이트 document가 정상 load |
| 현재 네이트에서 같은 URL 재요청 | history length를 늘리지 않고 실제 reload |
| history 없는 네이버에서 첫 Back | 기존 종료 안내 Toast와 app 전면 유지 |

자동 검사는 Jest 15 suites·54 tests, typecheck와 lint를 통과했다. `npx expo install --check`와 `npx expo-doctor`는 app 변경과 무관한 Expo SDK 54 patch 기대치 `expo ~54.0.37`, `expo-constants ~18.0.14`, `jest-expo ~54.0.18` 대비 설치 version이 각각 한 patch 낮아 dependency 검사 1개만 실패했다. 이번 history 수정에 package·lockfile·config 갱신을 섞지 않았다.

기존 1~5단계 완료 이력은 그대로 보존한다. 현재 Android history 계약, 문서 감사와 Git closeout은 [5단계 최종 인계](./2026-08-13-step-5-final-handoff.md)의 최신 후속 절을 우선한다.
