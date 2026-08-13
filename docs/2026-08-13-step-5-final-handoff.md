# Expo WebView 데모 5단계 최종 인계

- 작업일: 2026-08-13
- 작업 경로: `D:\Development\ReactNative\Workspaces\my-webview-app`
- 기준 branch: `master`
- 시작·현재 local `HEAD`: `65f5b2d89850b9c72fca593deec579da3c39eae0`
- 현재 상태: **5단계 본문 작성·자동 검증 완료, commit/push 별도 승인 대기**
- authoritative 계획: [implementation-plan.md](./implementation-plan.md) 11절·16절

이 문서는 5단계 `최종 인계 문서·source 주석·학습서 정리`의 실제 조사, 변경, 검증과 남은 Git 경계를 새 세션에서 복원하기 위한 최신 handoff다. 날짜가 있는 이전 Android/iOS 문서는 당시 build·실기기 증거로 보존하고, 5단계의 최신 source·문서·Git 상태는 이 문서를 우선한다.

## 1. 승인과 작업 계약

사용자는 다음 범위를 명시적으로 승인했다.

- 5단계 시작
- 사전 제시된 `agents-md-improver` 품질 보고서·수정 제안에 따른 `AGENTS.md` 수정
- 이 최종 handoff 새 파일 생성
- architecture, source 주석, 독립 source 안내서, 대화형 학습서, README·계획·완료 문서 정합성 점검과 자동 감사

추가 조건은 다음과 같다.

1. `AGENTS.md`와 `docs/architecture-internals.md`는 한글로 작성한다.
2. 참고 앱의 몇 파일만 보지 않고 유지관리 대상 source 전체를 다시 검토한다.
3. `source-commentary-guide.md`는 사용자가 혼자 source를 따라 읽는 목적이다.
4. `learning-guide.md`는 Codex와 한 서브 스텝씩 source를 대조·질문하고 확인된 설명을 점진적으로 보강하는 기준 자료다.
5. 참고 앱 학습 문서의 운영 방식을 조사한다.
6. 새 학습서에는 참고 앱의 독립 `검증 경계`, 범용 언어 문법, 자동화/실기기 구분 반복 장과 복습 실습 같은 불필요한 반복을 넣지 않는다.

Commit/push는 이전 단계 계약과 이번 시작 응답에서 별도 승인 대상으로 유지했다. 따라서 이 문서는 정확한 pending 상태를 기록하며 push 완료를 선행 주장하지 않는다.

## 2. 시작 전 실제 기준선

5단계 변경 전에 확인한 상태다.

| 항목 | 결과 |
|---|---|
| Branch | `master` |
| Local `HEAD` | `65f5b2d89850b9c72fca593deec579da3c39eae0` |
| Tracking `origin/master` | local과 일치 |
| Live `git ls-remote origin master` | local과 일치 |
| Ahead/behind | `0 0` |
| Worktree/index | clean |
| GitHub | `Jaehoon81/expo-webview-demo`, Public, `master` |
| Metro `8081` | listener 없음 |
| 제품 단계 | 2~4단계와 2026-08-13 오프라인 후속 완료, 5단계 미시작 |

`app/`·`src/` production 실행 source와 config는 마지막 source/test commit `073c2cad87ccd2b8dc6d91dd604fa631b4829fff` 이후 후속 문서 commit만 있었던 상태였다. 시작 시 15개 suite·50개 test, package scripts와 `.gitignore`도 다시 조사했다.

## 3. 참고 앱 전체 재검토

참고 경로는 `D:\Development\ReactNative\Workspaces\my-sample-app`이다.

다음 유지관리 대상 37개 파일, 총 약 5,108 lines를 범주별로 모두 확인했다.

- `app/` route와 screen 7개
- app screen test 2개
- `src/` API·component·DB·hook·query·schema·store·type와 test
- local proximity module의 TypeScript bridge/type
- Android Gradle·Manifest·Kotlin
- iOS Podspec·Swift
- Jest setup과 ESLint config

함께 읽은 학습 자료:

- `docs/source-commentary-guide.md`
- `docs/learning-guide.md`의 사용 방식과 실제 source 흐름 단원
- `docs/2026-07-23-step-7-learning-progress.md`
- `docs/architecture-internals.md`

적용한 핵심은 주석 개수 자체가 아니다.

- 파일 책임과 caller/consumer를 먼저 설명한다.
- React state/ref, cache, persistence, native resource의 수명을 구분한다.
- 비동기 순서와 cleanup, platform 차이와 선택 이유를 기록한다.
- canonical FLOW와 여러 관련 caller를 구분한다.
- test의 mock이 확인하는 범위와 실제 native/runtime 경계를 확대하지 않는다.
- 대화형 학습은 사용자 확인 전 완료로 추정하지 않고, 질문으로 정확해진 durable 사실만 문서에 보강한다.

## 4. `agents-md-improver` 감사와 반영

### 4.1 사전 감사

승인 전 실제 source, config, scripts, tests, `.gitignore`와 문서를 조사해 기존 한 줄 `AGENTS.md`를 `33/100 (D)`로 평가했다. Exact Expo SDK 54 문서 요구는 유효했지만 다음 project 정보가 없었다.

- 실제 command와 검증 순서
- Root Stack/hydration, mounted tab과 bridge architecture invariant
- generated/native output 경계
- comment/FLOW와 test mock 판정
- 지정 기기, EAS·서명, credential과 외부 서비스 승인 경계
- staged commit과 remote parity 확인 방식

사용자에게 정확한 수정안을 먼저 제시했고 별도 승인을 받은 뒤에만 파일을 수정했다.

### 4.2 승인 후 결과

한글 `AGENTS.md`에 다음을 연결했다.

- Expo SDK 54 versioned 문서와 local source-of-truth 문서
- 현재 architecture에서 유지할 invariant
- npm/Expo 검사 command
- Impact Review 형식과 comment-only 경계
- source·bridge·tab·platform 작성 원칙
- 한국어 source comment와 canonical FLOW 규칙
- test evidence layer와 완료된 실기기 검증 비반복
- 지정 기기, build·EAS·서명·credential 승인
- generated output·public secret 경계
- 문서 보존, 학습 완료 판정, commit/push와 remote parity

승인 후 같은 기준으로 재감사한 결과는 `92/100 (A)`다. Repository에 실제로 존재하지 않는 CI·PR workflow를 추측해 추가하지 않은 점이 남은 감점이며, 현재 project-local 작업 지침에는 차단되는 누락이 없다.

## 5. Source 주석 결과

### 5.1 Coverage

| 범위 | 결과 |
|---|---|
| Production source | 28/28 파일에 `[파일 역할]` |
| Test source | 15/15 파일에 `[파일 역할]`·`[검증 경계]` |
| Tooling | `jest.setup.ts`, `eslint.config.js` 역할·경계 보강 |
| 실행문 변경 | 추가 0, 삭제 0 non-comment lines |
| Local HTML payload | template literal 내부 변경 없음 |
| Package/config | 변경 없음 |

주석은 style literal이나 닫기 syntax를 반복하지 않고 다음을 설명한다.

- Root provider와 hydration/cold deep-link 순서
- 탭 instance와 WebView history의 유지·초기화 경계
- 일반/popup WebView URL policy, history와 오류 recovery
- bridge validation, dependency injection과 response escaping
- device ID, 사진과 local notification의 비동기·권한 수명
- custom scheme/Expo Go/WebView 내부 deep link 차이
- 사용자 API, Zod, Query cache·retry·pull lifecycle
- network banner와 실제 request error 분리
- scroll·bridge·keyboard 하단 bar 조건과 safe area

### 5.2 Canonical FLOW

| FLOW | 주제 | 단계 수 |
|---|---|---:|
| `FLOW-01` | 앱 시작과 hydration | 5 |
| `FLOW-02` | tab mount·전환·재선택 | 6 |
| `FLOW-03` | 일반 WebView navigation·history·오류 | 7 |
| `FLOW-04` | popup 분류와 lifecycle | 6 |
| `FLOW-05` | local HTML bridge 왕복 | 8 |
| `FLOW-06` | deep link와 외부 URL | 7 |
| `FLOW-07` | 사용자 API·schema·Query | 7 |
| `FLOW-08` | 하단 tab visibility | 5 |
| `FLOW-09` | network 상태와 수동 복구 | 5 |

자동 감사에서 canonical 9개는 각각 한 번, 56개 `[FLOW-NN / N단계]` 조합도 각각 한 번만 존재했다. 다른 call site는 `[관련 코드]`로 연결했다.

## 6. 새 문서와 역할 경계

### [architecture-internals.md](./architecture-internals.md)

유지보수용 architecture source of truth다.

- 저장소/generated 구조
- provider·hydration·Query client
- `DemoShell`의 state/ref 수명
- tab mount, WebView/popup/history/error와 platform back
- bridge·deep link·기기 service
- 사용자 Query, network·bottom bar
- app/EAS config와 evidence boundary
- 변경 영향 지도

### [source-commentary-guide.md](./source-commentary-guide.md)

사용자가 혼자 source를 열고 따라가기 위한 안내서다.

- 주석 표식의 의미와 유일성 규칙
- FLOW 01~09의 정확한 file/symbol 읽기 순서
- production 28개 파일 지도
- test mock을 읽는 순서
- JSON/package/tool config 해설
- generated·payload comment 제외와 독립 읽기 순서

### [learning-guide.md](./learning-guide.md)

Codex와 대화하며 학습할 기준 자료다. 8개 대단원·32개 서브 스텝으로 다음을 설명한다.

1. project 지도·책임·상태 수명
2. Root Stack·hydration·Query provider
3. 네 tab·mount·reselection·bottom navigation
4. 일반/popup WebView와 platform navigation
5. bridge와 device service
6. deep link·외부 URL
7. 사용자 API·Zod·Query
8. network·event cleanup·cross-cutting 흐름

범용 TypeScript/React 문법 백과, 독립 검증 반복 장과 복습 mutation 실습은 요청에 따라 제외했다. 필요한 syntax와 test/runtime 차이는 관련 source를 읽는 위치에서만 설명한다.

현재 이 문서는 학습 준비 자료다. 사용자가 각 source를 확인하고 질문을 마쳤다는 기록이 없으므로 32개 서브 스텝은 모두 **학습 완료 미판정**이다.

## 7. README·계획·과거 완료 문서 정합성

- README 검사 command에 public Expo config를 추가하고 architecture·source commentary·learning guide와 이 handoff link를 연결했다.
- README의 현재 source·15 suites·50 tests·Android/iOS/offline 검증 상태는 실제 source와 최신 완료 문서에 맞다.
- 구현 계획서 5단계를 `진행 중`으로 바꾸고 16절에 실제 승인·산출물·검증·Git pending 경계를 추가했다.
- Android Expo Go 문서 12절, Android development build 문서 8.3절, iOS Preview Build 문서 12절을 append했다.
- 이전 날짜의 test 수치, build ID, 당시 next-step 문장은 과거 이력으로 보존하고 최신 우선 문서를 명시했다.
- 완료된 build·설치·기기 결과를 이번 comment/doc 작업의 새 runtime 증거로 재작성하지 않았다.

## 8. 자동 검사와 감사

### 8.1 App·Expo 검사

| 명령 | 결과 |
|---|---|
| `npm test -- --runInBand` | 15 suites·50 tests 통과 |
| `npm run typecheck` | 통과 |
| `npm run lint` | 통과 |
| `npx expo install --check` | dependencies up to date |
| `npx expo config --type public` | 통과, app identity·scheme·plugin 공개 config 확인 |
| `npx expo-doctor` | 18/18 통과 |

Jest에서 Node의 `punycode` deprecation warning이 한 번 출력됐지만 15개 suite는 모두 통과했다. 이번 단계에서 dependency나 SDK를 변경하지 않았으며 이 warning을 이유로 unrelated upgrade를 수행하지 않았다.

### 8.2 Source·FLOW·공개 감사

| 검사 | 결과 |
|---|---|
| Non-comment source diff | 추가 0, 삭제 0 |
| Script syntax equivalence | 변경된 TypeScript/JavaScript 45/45가 주석·빈 JSX 주석 container 제외 시 동일 |
| Production role coverage | 28/28 |
| Test role/boundary coverage | 15/15 |
| Canonical FLOW | `01`~`09` 각 1회 |
| Canonical steps | 56개 각 1회, 중복 0 |
| High-signal secret content | 0 |
| Sensitive filename | 0 |
| Generated/signing ignore | `.expo`, `/android`, `/ios`, `node_modules`, `.jks`, `.p12`, `expo-env.d.ts` 확인 |
| `git diff --check` | 통과 |
| Markdown local link | 13개 파일, 깨진 link 0 |
| Markdown 구조 | 홀수 code fence 0, heading jump 0 |
| Markdown whitespace | trailing whitespace 0 |
| Learning guide 구성 | 32개 서브 스텝, 제외 요청한 독립 장 제목 0 |

위 Markdown 감사는 이 파일과 새 문서까지 포함한 전체 13개 Markdown 파일을 대상으로 최종 실행했다. 외부 URL의 현재 응답 여부는 자동 local link 감사 범위가 아니며, Expo SDK 54 공식 문서와 GitHub Public repository는 별도로 다시 확인했다.

## 9. 확인됨·미확인·차단 요소

### 확인됨

- 시작 기준 local/tracking/live remote SHA 일치와 Public `master`
- 참고 앱 유지관리 대상 source·test·native/tooling 전체와 학습 자료 재검토
- 승인된 한글 `AGENTS.md`
- production/test/tooling comment coverage와 execution diff 비변경
- architecture, 독립 source guide, 대화형 learning guide 생성
- README·계획·최신 handoff의 source/version/test/status 정합성
- Jest, TypeScript, ESLint, Expo dependency/config/Doctor
- 공개 high-signal secret, sensitive filename과 generated ignore
- Metro `8081` listener 없음

### 이번 단계에서 확인하지 않음

- 새 Android/iOS native build, APK/IPA 생성
- 앱 설치·실행과 실기기 runtime
- 사진·알림·WebView·deep link의 반복 인수 검증
- EAS build, credential·signing 변경
- App Store Connect, TestFlight, production release
- iPhone 11 외 device/iOS matrix와 local Xcode
- 새 학습서 32개 서브 스텝의 사용자 학습 완료
- 미commit 변경의 GitHub 표시

이번 source diff에는 실행문이 없고 기존 자동 검사를 모두 통과했으므로 완료된 build·실기기 검증을 반복하지 않았다. 이는 과거 실기기 결과가 새로 재검증됐다는 뜻이 아니다.

### 차단 요소

본문 산출물과 자동 검사를 막는 기술적 차단 요소는 없다.

Commit/push는 사용자 결정이 필요한 승인 경계다. 별도 승인을 기다리는 상태를 기술 실패나 blocker로 부르지 않는다.

## 10. 현재 Git·runtime 상태

자동 검사와 감사 뒤 재확인한 상태다.

| 항목 | 현재 결과 |
|---|---|
| Branch | `master` |
| Local `HEAD` | `65f5b2d89850b9c72fca593deec579da3c39eae0` |
| `origin/master` | 같은 SHA |
| Live remote `master` | 같은 SHA |
| Ahead/behind | `0 0` — commit 전이므로 HEAD 기준 |
| Worktree | 5단계 comment/doc 변경으로 dirty, 의도된 상태 |
| Index | staging하지 않음 |
| Metro `8081` | listener 0 |
| Commit/push | 수행하지 않음 |

공개 GitHub에는 아직 이 worktree 변경이 없다. GitHub 페이지가 Public·`master`인 것과 5단계 변경이 remote에 반영됐는지는 별도 사실이다.

## 11. 권장 commit과 push 순서

사용자가 별도로 승인하면 다음 의미 경계를 권장한다.

1. `Docs: source FLOW와 test 검증 경계 추가`
   - `app/`, `src/`
   - `jest.setup.ts`, `eslint.config.js`
   - 실행문 비변경 감사와 관련 자동 검사 확인
2. `Docs: 5단계 architecture와 학습 인계 정리`
   - `AGENTS.md`, `README.md`
   - 새 architecture/source commentary/learning/final handoff
   - implementation plan과 날짜별 완료 문서 최신 절
3. 첫 두 commit push 뒤 local/tracking/`git ls-remote`/GitHub public 상태를 독립 확인한다.
4. 정확한 commit SHA와 parity 결과로 이 문서·계획의 pending 상태를 완료로 갱신한다.
5. `Docs: 5단계 GitHub closeout 기록`을 별도 commit/push하고 최종 clean worktree와 remote parity를 다시 확인한다.

각 staged 묶음은 다음을 실행한다.

```powershell
git diff --cached --name-status
git diff --cached --stat
git diff --cached --check
```

Generated output, credential, local IDE/Expo state와 unrelated 기존 파일은 포함하지 않는다.

## 12. 새 세션 재개 순서

1. root `AGENTS.md`, 구현 계획서 11절·16절과 이 문서를 읽는다.
2. `git status --short`, branch, local/tracking/live remote SHA와 Metro `8081`을 다시 확인한다.
3. 이 문서 8절 이후 최종 Markdown 감사 결과와 현재 diff를 확인한다.
4. Commit/push 승인이 없다면 staging·commit·push를 시작하지 않는다.
5. 승인되면 11절의 의미 경계로 staged diff를 검토하고 push 뒤 remote parity를 독립 확인한다.
6. 대화형 학습은 사용자가 별도로 시작한 서브 스텝 하나만 진행하며 완료를 추정하지 않는다.

현재 5단계의 정확한 판정은 **source 주석·최종 문서·자동 감사 완료, GitHub closeout 승인 대기**다.
