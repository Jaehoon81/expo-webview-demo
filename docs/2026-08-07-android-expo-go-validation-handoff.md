# Android Expo Go 실기기 검증 인계

- 기록일: 2026-08-07
- 프로젝트: `D:\Development\ReactNative\Workspaces\my-webview-app`
- 기준 계획서: [implementation-plan.md](./implementation-plan.md)
- 검증 플랫폼: Android Expo Go
- 중단 위치: 27단계 사진 두 장 선택
- 다음 시작점: 27단계 원인 진단 및 재검증

> 이 문서는 2026-08-07 중단 시점의 기록을 보존한다. 27단계 원인 진단부터 Android Expo Go 완료까지의 결과는 [2026-08-10 Android Expo Go 실기기 검증 완료 보고서](./2026-08-10-android-expo-go-validation-completion.md), 이후 2~5단계와 현재 Git 상태는 [2026-08-13 5단계 최종 인계](./2026-08-13-step-5-final-handoff.md)를 따른다.

## 1. 현재 상태 요약

| 항목 | 상태 | 내용 |
|---|---|---|
| 구현 | 완료 | Expo SDK 54 기반 WebView 데모 기능 구현 완료 |
| Android 기본 흐름 | 확인됨 | 1~24단계 및 버튼 UI 확인 완료 |
| 사진 취소 | 확인됨 | 25단계에서 picker 취소와 오류 callback 확인 |
| 사진 한 장 | 확인됨 | 26단계에서 한 장 변환·표시·크기 제한 확인 |
| 사진 두 장 | 실패 상황 확인됨 | 27단계에서 첫 사진 선택 즉시 picker가 종료되어 두 번째 사진 선택 불가 |
| 사진 권한 거부 | 미확인 | 사진 picker 문제 해결 후 별도 확인 필요 |
| Android 후속 검증 | 미확인 | 하단 바 scroll/keyboard, 탭 지속성, Android back 종료, 네이티브 목록 후속 상태 등 |
| iOS 실기기 | 미확인 | Windows 환경에서는 실행하지 않음 |
| 외부 custom scheme | 미확인 | development build에서 별도 검증 필요 |
| Git | 미수행 | commit/push를 수행하지 않았고 기존 reset-project 작업 상태를 보존함 |

27단계가 해결되기 전에는 다음 인수 단계로 넘어가지 않는다. 사진 bridge action 자체는 취소와 한 장 경로까지 동작하지만, 요구사항인 최대 두 장 선택을 충족했다고 판정할 수 없다.

## 2. 검증 환경

| 항목 | 값 |
|---|---|
| 기기 | LG `LM-V500N` |
| Android | 12 / API 31 |
| ADB | USB 연결 상태 `device` 확인 |
| Expo Go | `54.0.8` |
| Expo SDK | `expo ~54.0.35` |
| React Native | `0.81.5` |
| `expo-image-picker` | `~17.0.11` |
| `react-native-webview` | `13.15.0` |
| Metro 연결 | USB `adb reverse tcp:8081 tcp:8081`과 `--localhost` 사용 |

차주 시작 명령은 다음과 같다.

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb devices -l
& $adb reverse tcp:8081 tcp:8081
npx expo start --go --android --localhost
```

원본 Android `WebViewAppDemo`와 Expo Go가 동시에 실행되면 WebView 디버그 대상이 섞일 수 있다. 자동 진단 시 `host.exp.exponent` PID와 `webview_devtools_remote_<PID>`가 일치하는지 먼저 확인한다.

## 3. 이번에 사용한 검증 방식

검증은 한 번에 한 단계만 진행하는 방식으로 수행했다.

1. Codex가 한 단계의 사용자 조작, 기대 결과, 통과·실패 응답 형식을 안내한다.
2. 사용자가 Android 실기기에서 직접 조작하고 결과를 답한다.
3. 통과 응답을 받은 단계만 `확인됨`으로 기록한다.
4. 알림 listener, WebView URL, 사진 DOM처럼 눈으로만 판정하기 어려운 항목은 ADB·Metro log·Chrome DevTools Protocol로 교차 확인한다.
5. 실패하면 다음 단계로 넘어가지 않고 참고 Android/iOS 앱과 현재 구현의 실제 호출 흐름을 비교한다.
6. 기능 수정이 필요하면 Impact Review 후 최소 범위로 수정하고 타입·린트·테스트를 실행한 다음 같은 단계를 사용자가 재검증한다.

결과 분류는 다음 기준을 사용한다.

- `확인됨`: 사용자의 실제 기기 확인 또는 실제 기기 확인과 자동 증거가 일치함
- `실패 상황 확인됨`: 요구 결과와 다른 실제 기기 동작을 재현함
- `미확인`: 아직 실제 기기에서 실행하지 않았거나 완료 조건 일부가 남음

## 4. 단계별 결과

| 단계 | 검증 항목 | 결과 | 핵심 증거 및 비고 |
|---:|---|---|---|
| 1 | 메인 로컬 HTML 초기 표시 | 확인됨 | `HTML FILE`, 네 개 하단 탭, 메인 선택 상태 확인 |
| 2 | 네이버 WebView | 확인됨 | 모바일 네이버 정상 표시 |
| 3 | 다음 WebView | 확인됨 | 모바일 다음 정상 표시 |
| 4 | 네이티브 사용자 목록 최초 요청 | 확인됨 | ID·이름·이메일 목록 정상 표시 |
| 5 | Google 동일 WebView | 확인됨 | popup·외부 브라우저가 아닌 현재 f0에서 열림 |
| 6 | 현재 WebView Android back | 확인됨 | Google에서 로컬 HTML로 복귀하고 앱은 유지됨 |
| 7 | Bing popup 열기 | 확인됨 | 앱 내부 전체 화면 popup과 상단 조작 표시 |
| 8 | Bing popup 닫기 | 확인됨 | 로컬 HTML과 스크롤·탭 상태 유지 |
| 9 | `tel:` | 확인됨 | 전화 앱에 번호 전달, 자동 발신 없음 |
| 10 | `sms:` | 확인됨 | 문자 앱에 수신 번호 전달, 자동 전송 없음 |
| 11 | `mailto:` | 확인됨 | 이메일 앱에 받는 사람 전달, 자동 전송 없음 |
| 12 | WebView 내부 자체 deep link | 확인됨 | f1로 이동해 `m.nate.com` 표시 |
| 13 | popup 내부 back | 확인됨 | Bing 검색 결과에서 초기 Bing으로 복귀 후 popup 유지 |
| 14 | 스마트폰 종류 판별 | 확인됨 | Android 타입 JavaScript alert 확인 |
| 15 | `getDeviceUUID` | 확인됨 | UUID 형식이며 연속 두 요청 값이 동일함 |
| 16 | `showToastMessage` | 확인됨 | Android Toast 문구와 자동 소멸 확인 |
| 17 | `showNotiMessage` foreground | 확인됨 | 제목·본문의 로컬 알림 표시 |
| 18 | 알림 탭 응답 | 확인됨 | 앱 복귀와 Metro의 수신·응답 listener log 확인 |
| 19 | background 로컬 알림 | 확인됨 | Home 이동 후 알림 수신과 알림 탭 복귀 확인 |
| 20 | 알림 거부 | 확인됨 | Expo Go 알림을 끈 상태에서 거부 오류 확인 후 설정 복원 |
| 21 | `reloadOtherTabs` | 확인됨 | 최초 구현 차이 수정 후 NATE였던 f1이 네이버 초기 URL로 복귀 |
| UI-A | 로컬 HTML 버튼 피드백·색상 | 확인됨 | 블루·그린·오렌지 카테고리 구분과 touch 눌림 효과 사용자 확인 |
| 22 | `goToAnotherTab` | 확인됨 | bridge 버튼으로 f1 이동 후 NATE 표시 |
| 23 | `hideBottomNaviView` | 확인됨 | 하단 탭 바가 animation으로 숨겨짐 |
| 24 | `showBottomNaviView` | 확인됨 | 하단 탭 바가 복원되고 상태 유지 |
| 25 | `getPhotoImages` 취소 | 확인됨 | `사진 선택을 취소했습니다.` callback과 빈 preview 확인 |
| 26 | 사진 한 장 | 확인됨 | 한 장 preview·이름 표시, 두 번째 영역 비어 있음 |
| 27 | 사진 두 장 | 실패 상황 확인됨 | 첫 사진 선택 즉시 picker 종료, 추가·완료 UI 없음, 두 번째 선택 불가 |

## 5. 실제 기기 교차 확인 증거

### 알림

Metro log에서 다음 event가 확인됐다.

- `로컬 알림을 수신했습니다. {"source": "webview-demo"}`
- `로컬 알림을 눌렀습니다. {"source": "webview-demo"}`

Expo Go가 표시하는 원격 push 제한 경고는 확인했지만 이 앱은 로컬 알림만 사용하며, foreground·background 로컬 알림은 실제로 동작했다.

### `reloadOtherTabs`

최초 Expo 구현은 숨겨진 WebView에 `reloadCurrent()`를 호출해 NATE가 계속 표시됐다. 참고 앱을 다시 확인한 결과 Android와 iOS 모두 다른 탭의 초기 URL을 다시 로드한다.

- Android: `WebViewFragment.reloadWebView()`가 `reloadUrl`을 로드
- iOS: `WebViewController.reloadWebView()`가 `defaultUrl`을 로드
- Expo 수정: 다른 WebView ref에 `reloadInitial()` 호출
- 자동 확인: `m.nate.com`에서 bridge 실행 후 `m.naver.com`으로 변경
- 사용자 확인: 21단계 재검증 통과

### 사진 한 장

사진 원문이나 base64 본문은 출력하지 않고 DOM 속성만 확인했다.

| 항목 | 결과 |
|---|---|
| 형식 | `data:image/png;base64,` |
| 변환 크기 | `750 x 1000` |
| 첫 preview | 표시됨 |
| 두 번째 preview | 표시되지 않음 |
| 첫 이름 | `사진이름: 사진앨범 선택 이미지(1)` |
| 두 번째 이름 | 빈 값 |

긴 변 1000px 제한과 한 장 callback은 확인됐다.

## 6. 검증 중 적용한 변경

### 다른 탭 초기 URL reload

- `src/components/DemoShell.tsx`: `reloadOtherTabs`가 `reloadInitial()`을 호출하도록 수정
- `src/components/WebTab.tsx`: 더 이상 쓰지 않는 `reloadCurrent` handle 제거

### 로컬 HTML 버튼 UI

- `src/web/local-html.ts`: category class, 라이트 블루·그린·오렌지 버튼, 48px touch 높이, `:active` 이동·축소·색상·그림자 추가
- `src/web/local-html.test.ts`: category와 눌림 selector 정적 계약 테스트 추가

두 변경 모두 사용자가 실제 기기에서 확인했다. 사진 두 장 문제에 대한 source 수정은 아직 하지 않았다.

## 7. 26·27단계 사진 문제

### 기대 결과

`사진 이미지 전달 요청`을 누르면 한 picker session에서 최대 두 장을 선택하고, 완료 후 두 이미지를 차례로 PNG base64로 변환해 WebView에 표시해야 한다.

### 실제 결과

1. 사진 picker가 열린다.
2. 첫 번째 사진을 한 번 누르는 즉시 picker가 닫힌다.
3. 별도의 `추가` 또는 `완료` 버튼이 표시되지 않는다.
4. 앱은 첫 번째 사진만 변환해 첫 preview에 표시한다.
5. 같은 session에서 두 번째 사진을 고를 수 없다.

이 동작은 26단계 한 장 흐름에는 성공이지만 27단계 최대 두 장 요구에는 실패다.

### 현재 구현과 확인된 계약

`src/services/photo-service.ts`는 다음 옵션을 전달한다.

```ts
allowsMultipleSelection: true,
selectionLimit: 2,
allowsEditing: false,
```

[Expo SDK 54 ImagePicker 문서](https://docs.expo.dev/versions/v54.0.0/sdk/imagepicker/)는 Android에서 `allowsMultipleSelection`과 `selectionLimit`을 지원한다고 설명한다. 설치된 `expo-image-picker@17.0.11`의 Android `ImageLibraryContract.kt`도 `selectionLimit > 1`이면 `PickMultipleVisualMedia(selectionLimit)` intent를 생성한다.

따라서 현재 증거만으로 JavaScript 옵션 누락이라고 단정할 수 없다. 다음 항목은 아직 확인되지 않았다.

- LG Android 12 picker에서 첫 사진을 길게 눌러야 다중 선택 mode가 시작되는지
- 실제 picker를 제공한 package와 Activity가 무엇인지
- Expo Go native module이 JavaScript의 `allowsMultipleSelection`과 `selectionLimit`을 받은 상태인지
- picker result의 `assets.length`가 항상 1인지
- development build에서도 동일한지

## 8. 차주 재개 순서

다음 순서를 지키고 27단계가 해결되기 전에는 28단계로 넘어가지 않는다.

1. `AGENTS.md`, `docs/implementation-plan.md`, 이 인계 문서를 읽는다.
2. LG 기기를 USB로 연결하고 위의 Expo Go 시작 명령을 실행한다.
3. `메인화면 → 사진 → 사진 이미지 전달 요청`으로 27단계를 재현한다.
4. 첫 사진을 짧게 누르는 방식과 길게 누르는 방식을 구분해 picker의 다중 선택 mode 진입 여부를 확인한다.
5. picker가 열린 동안 ADB로 foreground package·Activity를 확인한다.
6. 필요하면 URI·파일명·base64를 남기지 않고 options와 `assets.length`만 임시 logging한다. source를 바꾸기 전에는 새 Impact Review를 먼저 수행한다.
7. Expo Go의 native picker 계약 문제인지, 기기 picker 동작인지, 앱 구현 문제인지 분리한다.
8. 최소 범위로 수정한 뒤 25단계 취소, 26단계 한 장, 27단계 두 장을 모두 다시 검증한다.
9. 사진 권한 거부 경로를 별도로 검증하고 설정을 복원한다.
10. 그 후에만 남은 Android 검증을 다음 번호로 재개한다.

## 9. 27단계 이후 남은 검증

- WebView·FlatList scroll 방향에 따른 하단 탭 바 숨김·복원
- 키보드 표시·해제에 따른 하단 탭 바 숨김·복원
- 마지막 선택 탭의 Expo Go 재시작 후 복원
- 현재 Web 탭 재선택 시 초기 URL reload
- 네이티브 탭 재선택 refetch와 pull-to-refresh
- Android popup history·popup close·WebView history·두 번 눌러 종료 우선순위
- WebView 오류·재시도·초기 화면과 HTTP 차단 UI
- 네이티브 목록 실패·retry·refresh 상태
- iOS 전체 실기기 흐름
- development build 외부 `mywebviewapp://` launch

## 10. 마지막 자동 검증

2026-08-07의 source 변경 후 결과다.

| 명령 | 결과 |
|---|---|
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npm test -- --runInBand` | 10개 suite, 34개 test 통과 |

Jest 출력에는 Node의 `punycode` deprecation warning이 있었지만 test 실패는 없었다.

## 11. 새 세션 재개 문구

다음 문구로 재개할 수 있다.

> `AGENTS.md`, `docs/implementation-plan.md`, `docs/2026-08-07-android-expo-go-validation-handoff.md`를 읽고 Android Expo Go 검증을 이어가자. 27단계 사진 두 장 선택 실패의 원인 진단부터 시작하고, 해결 및 25~27단계 재검증 전에는 다음 단계로 넘어가지 마.
