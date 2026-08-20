# Expo WebView Demo

Expo SDK 54와 React Native로 구현한 WebView 기능 학습·검증용 데모 앱이다. 로컬 HTML과 외부 웹 페이지를 탭으로 표시하고, JavaScript bridge를 통해 기기 기능과 React Native 화면을 제어한다.

- GitHub: [Jaehoon81/expo-webview-demo](https://github.com/Jaehoon81/expo-webview-demo)
- 구현·검증 기준: [구현 계획서](./docs/implementation-plan.md)

## 주요 기능

- 메인 로컬 HTML, 네이버, 다음, 네이티브 사용자 목록의 네 탭
- WebView 동일 창 navigation, 전체 화면 popup, history와 하단 탭 inset을 반영한 오류·retry 처리
- `getDeviceUUID`, Toast, 로컬 notification, 다른 탭 reload·이동, 하단 탭 표시·숨김, 사진 선택 bridge
- `tel:`, `sms:`, `mailto:` 외부 앱과 `mywebviewapp://webviewappdemo` deep link 분류
- Zustand와 SecureStore를 이용한 마지막 선택 탭 복원
- Axios·Zod·TanStack Query를 이용한 JSONPlaceholder 사용자 목록
- 네트워크 단절 배너와 수동 retry
- scroll·keyboard 상태에 따른 하단 탭 animation과 Android hardware back 우선순위

## 기술 구성

- Expo SDK package range `~54.0.35`·설치 `54.0.36`, React Native `0.81.5`, React `19.1.0`
- Expo Router, React Native WebView
- TanStack Query, Axios, Zod, Zustand
- Expo Image Picker·Image Manipulator, Notifications, SecureStore, Network
- Jest와 React Native Testing Library

## 실행 전제

- Node.js `20.19.x` 이상
- npm
- Android 또는 iOS용 Expo Go
- 외부 웹 페이지와 사용자 API 확인을 위한 네트워크 연결

Android Expo Go 흐름과 외부 OS에서 `mywebviewapp://`을 직접 실행하는 development build 경로를 실제 기기에서 검증했다. 현재 launcher-free debug development build는 JavaScript bundle을 내장하지 않으므로 실행 중인 Metro가 필요하다.

iOS 전체 흐름은 EAS internal Preview Build를 iPhone 11에 설치해 검증했다. 2026-08-13에는 이전 인수에서 누락된 실제 네트워크 단절도 Android와 iPhone에서 후속 검증해 WebView 오류·loading 정렬과 iOS 반복 retry 중 하단 탭 유지를 통과했다. EAS build·credential과 iPhone 검증 결과는 아래 iOS 완료 문서를 따른다.

2026-08-20에는 Android에서 app 명령으로 Naver tab에 Nate를 연 뒤 hardware Back이 app 종료 경로로 빠지던 차이를 수정했다. Custom-scheme link와 bridge button 모두 같은 native WebView history에 Nate를 추가하고 Back으로 Naver에 복귀하며, Back 뒤 같은 target 재호출과 현재 URL reload도 LG `LM-V500N` Android 12 실기기에서 통과했다. iOS의 기존 `location.assign` navigation은 변경하지 않았다.

## 설치와 실행

```powershell
git clone https://github.com/Jaehoon81/expo-webview-demo.git
Set-Location expo-webview-demo
npm install
npm start
```

Metro에 표시된 QR code를 Expo Go로 스캔한다. 연결된 기기가 있다고 해서 자동으로 검증 기기로 사용하지 말고, 실제 검증 대상은 별도로 확인한다.

## 검사 명령

```powershell
npm test -- --runInBand
npm run typecheck
npm run lint
npx expo install --check
npx expo config --type public
npx expo-doctor
```

2026-08-20 현재 결과는 15개 test suite·54개 test, typecheck와 lint 통과다. `npx expo install --check`와 Expo Doctor는 source 수정과 무관한 SDK 54 patch 권장 차이 3개(`expo` `54.0.36 → ~54.0.37`, `expo-constants` `18.0.13 → ~18.0.14`, `jest-expo` `54.0.17 → ~54.0.18`)만 보고한다. 이 dependency 갱신은 Android history 수정에 섞지 않았다.

## 주요 경로

| 경로 | 역할 |
|---|---|
| `app/` | Expo Router entry와 native intent rewrite |
| `src/components/` | 탭 shell, WebView·popup, 하단 탭과 네이티브 사용자 화면 |
| `src/bridge/` | WebView request schema, action 계약과 dispatcher |
| `src/services/` | URL 분류, device ID, notification과 사진 처리 |
| `src/api/`, `src/schemas/` | 사용자 API 요청과 runtime response 검증 |
| `src/store/` | 마지막 선택 탭 영속 상태 |
| `src/web/` | 메인 WebView에 전달하는 로컬 HTML |
| `app.json`, `eas.json` | app identifier와 EAS internal Preview Build 설정 |
| `docs/architecture-internals.md` | 현재 source의 구조, 상태 수명과 platform 경계 |
| `docs/source-commentary-guide.md` | canonical FLOW의 단계 지도와 실제 source 핵심 경로 발췌를 따라 혼자 읽는 안내 |
| `docs/learning-guide.md` | 실제 source와 대조하는 대화형 학습 기준 자료 |
| 그 외 `docs/` | 구현 계획, 실기기 검증과 단계별 handoff |

## 검증 상태

| 범위 | 상태 |
|---|---|
| Android Expo Go 1~40단계 | 통과 |
| Android 네트워크·reload 후속 A-1~C-5 | 통과 |
| 자동 tests·typecheck·lint | 15 suites·54 tests, typecheck, lint 통과 |
| Expo dependency·Doctor | SDK 54 patch 권장 차이 3개 확인, 별도 갱신 대기 |
| Android development build와 외부 custom scheme | 통과 |
| iOS EAS Preview Build와 실기기 전체 흐름 | 통과 |
| Android/iOS WebView 오프라인 오류 화면·retry 후속 회귀 | 통과 |
| Android app-initiated WebView history·hardware Back 후속 회귀 | 통과 |

Android Expo Go의 상세 환경과 단계별 판정은 [Android Expo Go 검증 완료 보고서](./docs/2026-08-10-android-expo-go-validation-completion.md), development build·custom scheme·Metro-off ANR과 사용자 검증 방법은 [Android development build 검증 완료 문서](./docs/2026-08-11-android-development-build-and-custom-scheme-validation.md)를 기준으로 한다. iOS build·수정·Android 표적 회귀·iPhone 결과는 [iOS EAS Preview Build와 실기기 검증 완료 문서](./docs/2026-08-12-ios-eas-preview-build-and-device-validation.md)를 기준으로 한다.

## 데모 데이터와 개인정보

- 연락처 link는 placeholder 전화번호와 `demo@example.com`을 사용한다.
- 사진 picker에서 선택한 이미지는 runtime bridge 결과로 WebView에 전달되며 source repository에는 저장하지 않는다.
- repository에는 API key, signing credential, 선택 사진과 진단 screenshot을 포함하지 않는다.

## 문서

- [구현 계획서](./docs/implementation-plan.md)
- [2026-08-10 Android Expo Go 검증 완료 보고서](./docs/2026-08-10-android-expo-go-validation-completion.md)
- [2026-08-10 Public GitHub 저장소와 초기 push handoff](./docs/2026-08-10-github-repository-and-initial-push-handoff.md)
- [2026-08-11 Android development build와 외부 custom scheme 검증 완료](./docs/2026-08-11-android-development-build-and-custom-scheme-validation.md)
- [2026-08-12 iOS EAS Preview Build와 실기기 전체 흐름 검증 완료](./docs/2026-08-12-ios-eas-preview-build-and-device-validation.md)
- [내부 구조와 동작](./docs/architecture-internals.md)
- [소스 주석 읽기 안내서](./docs/source-commentary-guide.md)
- [대화형 구현 학습서](./docs/learning-guide.md)
- [2026-08-13 5단계 최종 인계](./docs/2026-08-13-step-5-final-handoff.md)

Production source에는 파일 책임·이유·주의·검증 경계와 `FLOW-01`~`FLOW-09` canonical 주석이 연결되어 있다. [소스 주석 읽기 안내서](./docs/source-commentary-guide.md)의 각 FLOW에는 기존 전체 단계 지도와 함께, 함수·component의 소속 구조를 유지한 실제 source 발췌와 단계 사이의 인과관계가 대표 핵심 경로로 정리돼 있다. Test 파일은 mock이 확인하는 범위와 실제 native/runtime 경계를 첫 주석에서 구분한다.
