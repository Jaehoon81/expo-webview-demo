# Expo WebView Demo

Expo SDK 54와 React Native로 구현한 WebView 기능 학습·검증용 데모 앱이다. 로컬 HTML과 외부 웹 페이지를 탭으로 표시하고, JavaScript bridge를 통해 기기 기능과 React Native 화면을 제어한다.

- GitHub: [Jaehoon81/expo-webview-demo](https://github.com/Jaehoon81/expo-webview-demo)
- 구현·검증 기준: [구현 계획서](./docs/implementation-plan.md)

## 주요 기능

- 메인 로컬 HTML, 네이버, 다음, 네이티브 사용자 목록의 네 탭
- WebView 동일 창 navigation, 전체 화면 popup, history와 오류·retry 처리
- `getDeviceUUID`, Toast, 로컬 notification, 다른 탭 reload·이동, 하단 탭 표시·숨김, 사진 선택 bridge
- `tel:`, `sms:`, `mailto:` 외부 앱과 `mywebviewapp://webviewappdemo` deep link 분류
- Zustand와 SecureStore를 이용한 마지막 선택 탭 복원
- Axios·Zod·TanStack Query를 이용한 JSONPlaceholder 사용자 목록
- 네트워크 단절 배너와 수동 retry
- scroll·keyboard 상태에 따른 하단 탭 animation과 Android hardware back 우선순위

## 기술 구성

- Expo SDK `54.0.35`, React Native `0.81.5`, React `19.1.0`
- Expo Router, React Native WebView
- TanStack Query, Axios, Zod, Zustand
- Expo Image Picker·Image Manipulator, Notifications, SecureStore, Network
- Jest와 React Native Testing Library

## 실행 전제

- Node.js `20.19.x` 이상
- npm
- Android 또는 iOS용 Expo Go
- 외부 웹 페이지와 사용자 API 확인을 위한 네트워크 연결

Android Expo Go 흐름은 실제 기기에서 검증했다. 외부 OS에서 `mywebviewapp://`을 직접 실행하는 경로는 Expo Go가 아니라 development build에서 별도로 검증할 예정이다.

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
npx expo-doctor
```

2026-08-10 기준 결과는 12개 test suite·39개 test, typecheck, lint, Expo dependency check와 Expo Doctor 18/18 통과다.

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
| `docs/` | 구현 계획, 실기기 검증과 단계별 handoff |

## 검증 상태

| 범위 | 상태 |
|---|---|
| Android Expo Go 1~40단계 | 통과 |
| Android 네트워크·reload 후속 A-1~C-5 | 통과 |
| 자동 tests·typecheck·lint·Expo checks | 통과 |
| Android development build와 외부 custom scheme | 대기 |
| iOS 실기기 전체 흐름 | 대기 |

Android의 상세 환경, 단계별 판정과 발견한 문제는 [Android Expo Go 검증 완료 보고서](./docs/2026-08-10-android-expo-go-validation-completion.md)를 기준으로 한다. Android 통과 결과를 iOS 또는 development build의 runtime 증거로 확대하지 않는다.

## 데모 데이터와 개인정보

- 연락처 link는 placeholder 전화번호와 `demo@example.com`을 사용한다.
- 사진 picker에서 선택한 이미지는 runtime bridge 결과로 WebView에 전달되며 source repository에는 저장하지 않는다.
- repository에는 API key, signing credential, 선택 사진과 진단 screenshot을 포함하지 않는다.

## 문서

- [구현 계획서](./docs/implementation-plan.md)
- [2026-08-10 Android Expo Go 검증 완료 보고서](./docs/2026-08-10-android-expo-go-validation-completion.md)
- [2026-08-10 Public GitHub 저장소와 초기 push handoff](./docs/2026-08-10-github-repository-and-initial-push-handoff.md)

최종 source 주석, 내부 architecture 문서와 학습서는 계획서의 5단계에서 보완한다.
