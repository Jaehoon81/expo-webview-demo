# my-webview-app 작업 지침

이 파일은 이 저장소에서 작업하는 agent가 지켜야 할 project-local 기준이다. 사용자에게는 기본적으로 한국어로 답하고, source identifier, API 이름, file path, command, error와 log 원문은 번역하지 않는다.

## 1. 작업 전 기준 자료

Expo는 계속 변경된다. source, package, app config 또는 build 설정을 수정하기 전에 반드시 정확한 [Expo SDK 54 versioned 문서](https://docs.expo.dev/versions/v54.0.0/)와 해당 package의 SDK 54 문서를 읽는다. 최신 일반 문서를 SDK 54 계약으로 추정하지 않는다.

다음 local 문서를 목적에 맞게 사용한다.

- 기능 범위·완료 상태·단계 계약: `docs/implementation-plan.md`
- 구조·상태 수명·caller/consumer: `docs/architecture-internals.md`
- source의 canonical FLOW와 주석 규칙: `docs/source-commentary-guide.md`
- 사용자와 한 단계씩 학습할 기준 자료: `docs/learning-guide.md`
- build·실기기 증거: 날짜별 Android/iOS 완료 문서
- 현재 최종 인계: `docs/2026-08-13-step-5-final-handoff.md`

구조, data flow, lifecycle 또는 여러 module에 걸친 변경은 먼저 `docs/architecture-internals.md`를 읽는다. 작은 오타처럼 구조와 무관한 작업에는 필요한 파일만 조사한다.

날짜가 있는 문서의 branch, SHA, process, port, device와 외부 서비스 상태는 현재 사실로 가정하지 않는다. local Git, tracking ref, live remote, runtime과 실제 config를 다시 확인한다.

## 2. 현재 architecture에서 지켜야 할 계약

- `app/_layout.tsx`의 Root `Stack`은 Zustand hydration gate보다 먼저 mount되어야 한다.
- hydration loading은 `app/index.tsx`가 소유하며 완료 뒤에만 `DemoShell`을 mount한다.
- OS deep-link query cleanup은 mount된 index route의 `useNavigation().replaceParams({})`를 첫 mount commit 다음 `requestAnimationFrame`에서 실행하고 effect cleanup에서 예약 frame을 취소한다. Android cold start에서 아직 준비되지 않은 global navigation ref를 요구하는 `useRouter().setParams(...)`나 첫 effect의 즉시 cleanup으로 되돌리지 않는다.
- `DemoShell`은 orchestration layer다. URL parsing, bridge validation, 사진·알림·device ID와 API parsing을 다시 안으로 합치지 않는다.
- 세 `WebTab`과 `NativeUsersScreen`은 tab 전환만으로 unmount하지 않는다. active prop으로 표시·입력만 전환해 WebView history와 child state를 유지한다.
- 현재 Web tab 재선택만 `reloadInitial()`, 현재 native tab 재선택만 Query `refetch()`를 실행한다.
- WebView URL은 `src/services/url-router.ts`의 decision을 거친다. HTTPS 허용, HTTP 차단, app deep link와 OS 외부 URL 경계를 우회하지 않는다.
- 열린 document에 app 명령으로 URL을 전달할 때 iOS는 `location.assign`, Android는 parent URL policy를 직접 호출한 뒤 같은 key의 `source` 변경으로 native history를 이어 간다. Android app-initiated `source` load에서 생략되는 `onShouldStartLoadWithRequest`를 우회해 policy를 중복 구현하지 않는다.
- Android `loadUrl`은 `currentUrlRef`로 동일 URL reload와 다른 URL navigation을 구분한다. native Back 뒤 React `source`와 현재 URL이 달라질 수 있으므로 의미가 같은 기본 GET·명시적 `GET` source 표기를 번갈아 RNWV prop update를 보장하는 계약을 유지한다.
- bridge 입력은 WebView에서 왔으므로 trusted source로 취급하지 않는다. `types → Zod schema → dispatcher → injected dependency → common response` 순서를 유지한다.
- Zustand persisted state, React state/ref, TanStack Query cache, WebView history와 OS native state의 수명을 하나로 합치지 않는다.
- network banner는 연결 상태 안내일 뿐 WebView/API request 성공 판정이 아니다. reconnect 뒤 retry/refetch는 현재 명시적 사용자 동작 경계를 유지한다.

이 계약을 바꿀 필요가 있으면 실제 caller, consumer, test와 Android/iOS lifecycle 영향을 먼저 조사한다.

## 3. 주요 command

Dependency 설치가 필요한 checkout에서만:

```powershell
npm install
```

Metro와 일반 Expo Go 실행:

```powershell
npm start
```

Android/iOS launcher는 사용자가 해당 platform과 기기를 작업 대상으로 승인한 경우에만 사용한다.

```powershell
npm run android
npm run ios
```

Launcher-free Android development build를 Metro와 연결하는 과거 검증 command는 다음 완료 문서의 정확한 환경·placeholder를 따른다.

- `docs/2026-08-11-android-development-build-and-custom-scheme-validation.md`

기본 자동 검사:

```powershell
npm test -- --runInBand
npm run typecheck
npm run lint
npx expo install --check
npx expo-doctor
```

수정 중에는 가장 좁은 관련 test와 typecheck를 먼저 실행하고, 최종 인계 또는 공개 전에는 위 전체 검사를 실행한다.

## 4. 변경 전 Impact Review

Source code, package, build, manifest, schema, shell script와 동작을 바꾸는 config를 수정하기 전에는 실제 caller와 consumer를 조사하고 다음 전체 block을 먼저 제시한다.

```text
[Impact Review]
- Code/Logic: <확인한 caller, consumer, shared utility와 control flow>
- Data: <persisted state, cache, schema, API/bridge 계약과 호환성>
- Performance: <render, WebView, payload, image/base64, request와 allocation 영향>
- UX: <loading, error, accessibility, navigation과 platform 차이>
```

문서·source 주석만 수정하고 실행식·payload·config 값이 바뀌지 않는 경우에는 `[Impact Review: skip - reason]`을 사용할 수 있다. 다만 편집 hook이 source 파일에 전체 block을 요구하면 실제 조사 결과로 전체 형식을 제공한다.

주석 작업 중 결함 후보를 발견해도 실행식 수정을 같은 diff에 섞지 않는다. 현상·caller·영향과 필요한 검증을 먼저 보고하고 별도 승인을 받는다.

## 5. Source 작성 원칙

- TypeScript strict mode와 기존 `@/` path alias를 유지한다.
- 외부 JSON, WebView message, deep-link query와 persisted JSON은 runtime validation 없이 domain type으로 간주하지 않는다.
- 한 번만 쓰는 작은 동작을 새 abstraction이나 dependency로 만들지 않는다.
- 이미 분리된 pure policy와 platform side effect를 다시 결합하지 않는다.
- 새로운 bridge action은 `local-html`, bridge type/schema/dispatcher, `DemoShell` dependency, response 처리와 test를 전체 계약으로 검토한다.
- tab index/tag/order 변경은 constants, navigation type, bridge schema, deep link, refs와 tests를 함께 확인한다.
- package/plugin/app identity/native config 변경은 설치 binary 변경 가능성을 명시한다.
- platform conditional을 수정하면 JavaScript branch test와 실제 native event timing의 검증 범위를 구분한다.

## 6. Source 주석 규칙

주석과 `docs/architecture-internals.md`, `docs/source-commentary-guide.md`는 한국어로 작성한다. identifier와 API 이름은 원문을 유지한다.

허용 표식:

- `[파일 역할]`
- `[FLOW-NN]`
- `[FLOW-NN / N단계]`
- `[FLOW-NN / N-A단계]`
- `[이유]`
- `[주의]`
- `[검증 경계]`

각 canonical `[FLOW-NN]` 시작 표식과 `[FLOW-NN / N단계]`·`[FLOW-NN / N-A단계]` 조합은 production source 전체에서 한 번만 사용한다. 여러 caller나 같은 depth의 별도 기능·branch도 각각 고유한 branch 또는 call-site 단계를 부여하며 `[관련 코드]` 표식은 사용하지 않는다.

주석은 보이는 syntax를 반복하지 않고 다음을 설명한다.

- 파일 책임과 caller/consumer
- 입력·출력 변환
- React state/ref, persist, Query cache와 WebView history 수명
- 비동기 순서, cleanup과 stale event 방지
- Android/iOS 차이와 선택 이유
- mock이 증명하지 못하는 runtime 경계

`src/web/local-html.ts`의 template literal 내부는 실제 WebView payload다. 설명용 TypeScript 주석을 문자열 안에 넣거나 escaping, whitespace, action/DOM 내용을 우연히 바꾸지 않는다.

JSON config와 lockfile에는 설명 comment를 추가하지 않는다. 관련 설명은 architecture 또는 source commentary guide에 둔다.

## 7. Test와 검증 판정

현재 test는 16 suites·56 tests다. 수치는 source 변경 후 실제 실행 결과로 다시 확인한다.

- `DemoShell` deep-link test는 current-route navigation 선택, 다음 UI frame의 query cleanup과 같은 Web URL의 Warm 재입력을 mock으로 확인하며 실제 cold/warm native timing은 실기기 증거와 구분한다.
- WebView component test는 `react-native-webview` 대역의 props/callback/remount를 확인한다.
- Native 사용자 화면 test는 Query Hook과 Alert 대역을 사용한다.
- Bridge dispatcher test는 사진·알림·SecureStore·UI dependency를 mock한다.
- Local HTML test는 payload 문자열의 정적 존재를 확인한다.
- SecureStore mock은 실제 keychain/keystore 영속성 증거가 아니다.
- `Platform.OS` replacement는 platform별 JavaScript branch를 확인할 뿐 native event timing을 실행하지 않는다.

결과는 다음 증거 층을 구분해 표현한다.

1. 정적 검사·unit/component test
2. Expo config/dependency 검사
3. native build와 artifact
4. 설치·실행
5. 사용자가 지정한 실기기에서의 실제 scenario

Build 성공을 runtime 성공으로, Expo Go 성공을 외부 custom scheme 성공으로, mock test 성공을 사진·알림·WebView native 성공으로 확대하지 않는다.

완료된 Android Expo Go, Android development build, iOS Preview Build, 2026-08-13 network 후속 검증과 2026-08-20 Android 열린 WebView history 실기기 검증을 이유 없이 반복하지 않는다. source/config 변경 영향이 있는 최소 범위만 새로 정한다.

## 8. 기기, build와 외부 서비스 경계

- 사용자가 해당 작업의 검증 대상으로 명시한 기기만 조회·설치·실행·log 수집 대상으로 사용한다.
- 연결돼 있다는 이유만으로 다른 Android/iOS 기기를 사용하지 않는다.
- build·설치·EAS·Apple/Google signing, credential 생성·교체와 외부 서비스 변경은 명시적 승인 없이 시작하지 않는다.
- password, token, private key, signing secret와 private credential을 사용자에게 요구하거나 출력하지 않는다.
- 기존 credential을 정상 build workflow에서 사용하는 경우에도 identifier나 artifact를 repository에 기록하지 않는다.
- Android launcher-free debug build는 JavaScript bundle을 내장하지 않으므로 과거 검증처럼 Metro가 필요할 수 있다. Metro 부재의 `Unable to load script`와 back ANR을 JS loop로 추정하지 않는다.
- App Store Connect, TestFlight, production release signing, Universal/App Links와 remote push는 현재 완료 범위 밖이다.

## 9. Generated output와 공개 민감정보

다음은 직접 수정하거나 commit하지 않는다.

- `/android`, `/ios`
- `.expo/`, `dist/`, `web-build/`
- `node_modules/`
- APK, IPA, build log, screenshot, device diagnostic output
- signing key, provisioning profile, private key, token과 local env

`.gitignore`의 generated native folder와 signing pattern을 유지한다. `.claude`와 `CLAUDE.md`는 참고 material이며 Codex 작업에서 수정하지 않는다.

공개 전에는 tracked filename과 content를 다시 감사한다. Demo placeholder 전화번호·`demo@example.com`, public EAS project metadata와 dependency maintainer metadata를 credential로 오판하지 않되 실제 secret pattern은 출력 없이 경로와 판정만 보고한다.

## 10. 문서 보존과 최신 상태

- 계획·README·handoff의 과거 날짜 결과는 당시 이력으로 보존한다.
- 변경된 사실이 있는 절만 수정하거나 최신 절을 append한다.
- 현재 결과가 과거 내용을 대체하면 우선순위와 대체 관계를 명시한다.
- Markdown local link, heading, table, code fence, trailing whitespace와 command/version/test 수치를 검사한다.
- `docs/learning-guide.md`의 학습 완료는 사용자가 source 확인과 질문을 마쳤다고 명시한 경우에만 기록한다.
- 학습 중 확인된 설명은 기존 내용을 삭제·축소하지 않고 관련 단락에 보강한다.

## 11. Git과 GitHub

Commit과 push는 사용자의 명시적 승인 없이 수행하지 않는다. 승인 전에는 diff, 검증 결과, 공개 감사와 권장 의미별 commit 경계만 제시한다.

Source 주석/test·tooling comment와 문서 산출물은 검토 가능한 의미 단위로 분리한다. 각 staged 묶음은 다음으로 확인한다.

```powershell
git diff --cached --name-status
git diff --cached --stat
git diff --cached --check
```

Push 후에는 다음을 독립적으로 비교한다.

- local `HEAD`
- tracking ref `origin/master`
- ahead/behind와 clean worktree
- `git ls-remote --heads origin master`
- 필요하면 unauthenticated GitHub public/API 상태

원격 반영을 command 성공 문구만으로 판정하지 않는다.
