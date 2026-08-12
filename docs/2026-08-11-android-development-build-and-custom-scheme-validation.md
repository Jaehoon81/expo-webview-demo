# Android development build와 외부 custom scheme 검증 완료

- 작업일: 2026-08-11
- 최종 갱신일: 2026-08-12
- 대상 저장소: `my-webview-app`
- 대상 단계: 3단계
- 대상 기기: LG `LM-V500N`, Android 12(API 31), arm64-v8a
- 최종 상태: launcher-free local debug development build, 외부 `mywebviewapp://`과 사용자 HTTPS 링크 검증 완료

## 1. 범위와 완료 판정

이번 단계에서는 외부 Android OS가 `mywebviewapp://webviewappdemo?...`를 직접 실행하는 경로를 development build에서 검증했다. Android Expo Go 1~40단계와 A-1~C-5는 이미 완료된 이력으로 유지하고 전부 반복하지 않았다. 다음 항목만 표적 회귀했다.

- custom scheme의 cold start와 실행 중 재진입
- 정상 target과 URL 전달, 잘못된 target 거부
- 탭 선택과 대상 WebView URL
- hydration과 Root Layout lifecycle
- 사진 권한과 DocumentsUI 진입·취소
- foreground local notification
- `tel:` 외부 앱 전환과 복귀
- Android 두 번-back 종료

iOS, EAS Build·Expo project 연결, production signing, universal/app link와 원격 push notification은 이번 범위에 포함하지 않았다. Git commit/push는 최초 runtime 검증과 분리했으며 2026-08-12 사용자가 3단계 closeout 범위로 별도 승인했다.

## 2. 공식 문서와 실제 환경

코드와 build 경로를 정하기 전에 [Expo SDK 54 문서](https://docs.expo.dev/versions/v54.0.0/), [local app development](https://docs.expo.dev/guides/local-app-development/), [development build 소개](https://docs.expo.dev/develop/development-builds/introduction/), [앱으로 linking](https://docs.expo.dev/linking/into-your-app/)을 확인했다.

| 항목 | 확인 결과 |
|---|---|
| Expo | `54.0.36` |
| Expo Router | `6.0.24` |
| React Native | `0.81.5` |
| Java | Microsoft OpenJDK 17 |
| Android SDK | platform/build-tools 36 |
| package | `com.jaehoon.mywebviewapp` |
| scheme | `mywebviewapp` |
| EAS | 사용하지 않음 |
| signing | generated debug keystore만 사용, production credential 미사용 |

## 3. build 경로와 산출물

처음에는 `expo-dev-client` 기반 APK를 설치했으나, 앱이 완전히 종료된 상태에서 외부 custom URI를 실행하면 `MainActivity`의 JavaScript route보다 development launcher가 먼저 열렸다. 설치된 SDK 54의 dev launcher intent 처리도 함께 확인한 결과, non-main external intent를 pending으로 보존한 뒤 launcher로 이동하는 흐름이었다. `launchMode: most-recent`는 `ACTION_MAIN` 자동 실행에만 적용되어 이번 cold external intent 계약을 충족하지 못했다.

Expo 공식 문서가 local debug development build 자체에 `expo-dev-client`를 필수로 요구하지 않으므로, launcher 의존성을 제거하고 native project를 다시 생성했다. `package.json`과 `package-lock.json`은 원래 dependency 상태로 돌아왔으며 `expo-dev-client`는 최종 dependency에 없다. `prebuild`가 자동 변경한 `android`·`ios` npm script도 기존 Expo script로 되돌렸다.

사용한 핵심 명령은 다음과 같다.

```powershell
npx expo prebuild --clean --platform android --no-install
cd android
.\gradlew.bat :app:assembleDebug -PreactNativeArchitectures=arm64-v8a --no-daemon --console=plain
```

| 산출물 검사 | 결과 |
|---|---|
| Gradle | 성공, 약 478.7초 |
| APK | ignored `android/app/build/outputs/apk/debug/app-debug.apk` |
| 크기 | 60,068,557 bytes |
| SHA-256 | `442FA6A83837BEE8C04944885913B832ABE6F78965E5C79D4C9E231677C848BA` |
| ABI | `arm64-v8a`만 포함 |
| compile/target SDK | 36 / 36 |
| signature | `CN=Android Debug`, APK signature 확인 |
| zipalign | 통과 |
| manifest | launcher activity는 `MainActivity`, `mywebviewapp` scheme 포함, `DevLauncherActivity`와 `exp+my-webview-app` 없음 |

`android/`는 `.gitignore`의 `/android` 규칙에 따라 계속 untracked generated output으로 유지한다. 이번 APK는 arm64 실기기 검증용이며 x86, x86_64 또는 universal APK 지원을 의미하지 않는다.

## 4. cold start에서 발견한 source 결함과 수정

launcher-free APK와 Metro 연결 후 첫 cold URI는 JavaScript를 시작했지만 다음 Expo Router 오류를 기록했다.

```text
Attempted to navigate before mounting the Root Layout component.
```

원인은 `app/_layout.tsx`가 Zustand hydration 전에는 loading view만 반환하고 Root `Stack`을 첫 render에 mount하지 않는 상태에서, `DemoShell`이 cold URI의 `demoDeepLink`를 처리하고 `router.setParams`를 호출한 것이었다.

다음과 같이 최소 수정했다.

- `app/_layout.tsx`: Root `Stack`을 첫 render부터 항상 mount
- `app/index.tsx`: 기존 loading UI와 `hasHydrated` gate를 index route로 이동
- `src/components/IndexScreen.test.tsx`: hydration 전에는 `DemoShell`을 mount하지 않고 완료 후 mount하는 계약 추가

loading 문구·접근성 role·스타일과 persisted `selectedTabIndex` 형식은 바꾸지 않았다. 테스트 파일은 Expo Router가 production route로 수집하지 않도록 `app/` 밖의 `src/components/`에 두었다. debug APK는 Metro에서 JavaScript bundle을 받으므로 이 source 수정 뒤 native APK를 다시 만들 필요는 없었고, clean Metro bundle로 기기 검증을 반복했다.

## 5. LM-V500N 실기기 결과

검증 기기는 사용자가 명시한 LG `LM-V500N` 한 대로 제한했다. 기존 package에는 `adb install -r`로 업데이트 설치해 앱 데이터를 지우지 않았다.

| 항목 | 실제 결과 |
|---|---|
| 설치·resolver | 업데이트 설치 성공, `mywebviewapp://`이 `com.jaehoon.mywebviewapp/.MainActivity`로 resolve |
| cold 정상 URI | `target=1&url=m.nate.com`: `Status: ok`, `LaunchState: COLD`, `MainActivity`, `TotalTime: 4178ms` |
| cold 탭·WebView | 접근성 트리에서 `네이버 selected=true`; WebView DevTools에서 `https://m.nate.com/`과 title `네이트` 확인 |
| 실행 중 정상 URI | `target=3`: 새 Activity 없이 실행 중 top-most instance에 전달, PID 유지, `TotalTime: 0`; 최초 사용자 조회 알림 후 `네이티브 selected=true` |
| 잘못된 URI | `target=4`: `잘못된 링크`와 안내 문구 표시, 기존 `네이티브 selected=true` 유지 |
| 메인 이동 | `target=0`: `메인화면 selected=true`, local HTML bridge 버튼 표시 |
| 사용자 외부 링크 | 2026-08-12 사용자가 개인용 HTTPS 테스트 페이지의 `target=1&url=m.nate.com`, `target=3`, 잘못된 `target=4` 버튼을 기기 브라우저에서 직접 눌러 모두 정상 동작 확인 |
| local notification | `showNotiMessage` 호출 성공, `webview-demo` channel 생성, Expo notification event와 앱 listener의 `{ source: 'webview-demo' }` 수신 확인 |
| 사진 권한 | 최초 `READ_EXTERNAL_STORAGE granted=false`; 사용자가 권한 dialog에서 직접 허용한 뒤 `granted=true` 확인 |
| 사진 picker | `com.google.android.documentsui`의 최근 이미지 화면 진입; 사진을 고르지 않고 Back 취소 후 `getPhotoImages`, `사진 선택을 취소했습니다.`, `isError: true` 확인 |
| 외부 앱 | `tel:010-1234-5678`이 `com.skt.prod.dialer`로 전환되고 placeholder 번호가 채워짐; Back 후 앱 복귀 |
| Android back | 첫 Back 뒤 앱 전면 유지, 2초 이내 두 번째 Back 뒤 LG launcher가 전면으로 전환됨. 앱 PID가 cached process로 남는 것은 Activity 종료 실패로 판정하지 않음 |

초기 Metro 자식 프로세스가 wrapper 제한 시간 뒤 불완전하게 남아 기기에서 `unexpected end of stream`이 발생한 적이 있었다. 해당 project Metro만 종료하고 clean Metro를 시작한 뒤 `packager-status:running`, ADB reverse와 Android bundle을 재확인해 해결했다. 이 실패 결과는 앱 검증 통과 근거로 사용하지 않았다.

## 6. 자동 검사

최종 source 기준 결과는 다음과 같다.

| 명령 | 결과 |
|---|---|
| `npm test -- --runInBand` | 13 suites, 40 tests 통과 |
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npx expo install --check` | dependencies up to date |
| `npx expo-doctor` | 18/18 checks 통과 |

`npm audit --json`은 2026-08-11 기준 moderate 12건, high 13건, 총 25건을 보고했다. critical은 0건이다. 자동 수정 제안이 Expo SDK major 변경을 포함하므로 `npm audit fix`는 실행하지 않았고, 이번 SDK 54 검증 범위와 분리한다.

## 7. 최종 핵심 요약

### 7.1 실패한 중간 과정

- universal·multi-ABI Gradle build가 오래 정체되어 최종 산출물을 `arm64-v8a` 전용으로 제한했다.
- `expo-dev-client`를 포함하면 cold external URI보다 Dev Launcher가 먼저 열려 launcher-free debug build로 전환했다.
- URI의 `&url=...`이 remote shell에서 잘린 문제는 URI 전체 quoting으로, 불완전하게 남은 Metro의 `unexpected end of stream`은 해당 project Metro를 clean restart해 해결했다.
- cold URI에서 Root `Stack` mount 전 `router.setParams`가 호출되는 결함은 hydration gate를 index route로 이동해 수정했다.
- 회귀 테스트를 처음 `app/`에 두자 Expo Router가 production route로 수집해 Metro 500이 발생했고, `src/components/`로 옮겼다.

### 7.2 최종 성공 결론

- launcher-free arm64 debug APK의 package·scheme·signature·zipalign과 `MainActivity` 진입을 확인했다.
- Metro가 실행된 상태에서 cold·warm·잘못된 URI, 영향 범위 표적 회귀와 자동 검사 13 suites·40 tests를 통과했다.
- 2026-08-12 사용자가 기기 브라우저에서 실제 HTTPS 링크 버튼을 눌러 cold·warm·잘못된 target 흐름을 모두 확인함으로써 3단계 사용자 검증까지 완료했다.

### 7.3 하얀 화면 원인과 ANR

현재 debug APK에는 `expo-dev-client` launcher와 embedded `assets/index.android.bundle`이 모두 없다. Metro가 꺼지면 `Unable to load script` 뒤 React Native Window가 사라지고 시작 중인 Activity만 남는다. 이때 Android back을 누르면 시스템이 포커스 Window를 약 10초 기다린 뒤 다음 ANR을 발생시킨다.

```text
Input dispatching timed out (Application does not have a focused window)
```

2026-08-11 `/data/anr`에서 같은 사유의 기록 3건을 확인했다. ANR 당시 main thread는 `MessageQueue.nativePollOnce`에서 대기 중이어서 JavaScript 무한 루프나 main-thread deadlock으로 판정하지 않는다. 확인된 순서는 **Metro 부재 → JavaScript load 실패 → Window 소실 → back 입력 timeout**이다.

### 7.4 사용자가 실제 링크를 눌러 검증하는 방법

USB로 기기를 연결한 뒤 PowerShell에서 다음 블록 전체를 붙여 넣어 Metro를 실행한다. Public 문서에는 실제 기기 serial을 저장하지 않고 `<기기_SERIAL>` placeholder를 사용한다.

```powershell
Set-Location 'D:\Development\ReactNative\Workspaces\my-webview-app'

$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb devices -l
$device = '<기기_SERIAL>'

& $adb -s $device reverse tcp:8081 tcp:8081

$env:NODE_ENV = 'development'
npx --no-install expo start --dev-client --localhost --port 8081
```

개인용 HTTPS 테스트 페이지에는 다음 버튼을 둔다. 메신저가 custom scheme을 링크로 허용한다면 같은 URI를 자신에게 보내 눌러도 되지만, 차단하는 메신저에서는 HTTPS 페이지를 사용한다.

```html
<a href="mywebviewapp://webviewappdemo?target=1&amp;url=m.nate.com">Naver 탭으로 열기</a>
<a href="mywebviewapp://webviewappdemo?target=3">Native 탭으로 열기</a>
<a href="mywebviewapp://webviewappdemo?target=4">잘못된 링크 시험</a>
```

앱을 최근 앱 목록에서 닫은 뒤 첫 버튼을 누르면 Naver 탭에서 `https://m.nate.com/`이 열려야 한다. 앱이 열린 상태에서 두 번째 버튼을 누르면 Native 탭으로 이동해야 하며, 세 번째 버튼은 `잘못된 링크` 안내를 표시하고 기존 탭을 유지해야 한다. 메신저 자체가 custom scheme을 차단하는 것은 앱 실패로 판정하지 않는다.

## 8. 종료 상태와 다음 경계

- 2026-08-11 자동 검증 종료 시 Metro를 중지하고 host `8081` listener가 없음을 확인했다.
- 2026-08-11 자동 검증 종료 시 기기의 `tcp:8081` reverse와 WebView DevTools `tcp:9222` forward를 제거했다.
- 2026-08-11 자동 검증 종료 시 `/sdcard`에 `codex_stage3_*` 진단 파일이 남지 않았음을 확인했다.
- generated `android/`와 debug APK는 ignored 상태다.
- 2026-08-11 자동 검증 종료 시 development build는 기기에 설치된 채 앱 process만 force-stop했으며, 사용자가 허용한 사진 권한은 granted 상태로 남겨 두었다.
- 2026-08-12 사용자 검증 후 최종 점검에서는 사용자가 실행한 host `8081` Metro listener와 `UsbFfs tcp:8081 tcp:8081` reverse가 활성 상태였다. 진행 중인 사용자 검증 환경이므로 이번 Git closeout에서는 중지하지 않는다.
- 2026-08-12 사용자가 source·test·문서의 의미별 commit과 `master` push를 승인했다. generated native output과 debug APK는 commit 대상에서 제외한다.
- hydration source·test 변경은 `8abe661` (`Fix: cold deep link hydration 순서 보정`)로 먼저 분리했고, README·계획·검증 문서는 후속 `Docs:` commit으로 구성한다.

3단계의 기능·build·실기기·사용자 검증·문서 완료 기준은 충족했다. 3단계 종료 당시 이번 Git 작업은 해당 closeout에 한정했고, 다음 제품 단계인 iOS 실기기 4단계는 환경 준비와 사용자의 별도 시작 승인 뒤 진행하기로 했다.

### 8.1 2026-08-12 후속 단계 갱신

위 문장은 3단계 종료 당시의 다음 경계다. 이후 사용자가 4단계를 승인했고, macOS 대신 EAS internal Preview Build와 iPhone 11·iOS `18.7.8`을 사용해 iOS 전체 흐름을 완료했다. 상세 build·수정·Android 회귀·iPhone 결과는 [iOS EAS Preview Build와 실기기 전체 흐름 검증 완료 문서](./2026-08-12-ios-eas-preview-build-and-device-validation.md)를 따른다.

2026-08-12 기준 2~4단계는 완료됐으며 다음 미완료 제품 단계는 5단계 `최종 인계 문서·source 주석·학습서 정리`다. 5단계는 4단계 closeout과 GitHub 원격 일치 확인 뒤 사용자의 별도 시작 지시를 기다린다.
