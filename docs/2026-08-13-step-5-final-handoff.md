# Expo WebView 데모 5단계 최종 인계

- 작업일: 2026-08-13
- 최종 갱신일: 2026-08-20
- 작업 경로: `D:\Development\ReactNative\Workspaces\my-webview-app`
- 기준 branch: `master`
- 시작 기준 local `HEAD`: `65f5b2d89850b9c72fca593deec579da3c39eae0`
- 현재 상태: **5단계와 후속 source 주석 학습성 보강·FLOW 단계 전면 재구성·실제 source 핵심 경로 보강·문서 정합성·GitHub closeout 완료**
- authoritative 계획: [implementation-plan.md](./implementation-plan.md) 11절·16~19절

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

Commit/push는 시작 승인과 분리해 대기했고, 사용자가 5단계 결과를 검토한 뒤 권장 의미 경계의 commit/push와 `docs/` 전체 stale 감사를 별도로 승인했다. 아래 Git 절은 승인 후 실제 commit과 첫 push 결과, 자기 참조를 피한 마지막 closeout 확인 방법을 기록한다.

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
- 구현 계획서 5단계를 `완료`로 바꾸고 16절에 실제 승인·산출물·검증·Git closeout 경계를 확정했다.
- Android Expo Go 문서 13절, GitHub 초기 push 문서 9절, Android development build 문서 8.4절, iOS Preview Build 문서 13절에 최신 완료 관계를 append했다. 2026-08-07 중단 handoff에도 현재 우선 문서를 명시했다.
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

위 Markdown 감사는 이 파일과 새 문서까지 포함한 전체 13개 Markdown 파일을 대상으로 실행했다.

### 8.3 `docs/` 전체 stale·정합성 감사

| 검사 | 결과 |
|---|---|
| 문서 inventory | `docs/` 10/10 파일 조사 |
| 현재 source·package 대조 | Expo `~54.0.35`, React Native `0.81.5`, React `19.1.0`, production 28개, test 15개, FLOW 단계 56개, 학습 32개 서브 스텝 일치 |
| Git revision 참조 | 문서의 모든 backtick commit revision이 실제 local Git commit으로 해석됨 |
| Local Markdown link | repository Markdown 13개 전체에서 깨진 link 0 |
| External URL | 문서의 일반 web URL 12개가 HTTP 200, `.git` clone URL은 `git ls-remote` 성공 |
| 역사 문서 | 당시 test 수치·build ID·판정은 보존하고 5개 날짜 문서에 최신 우선 관계 추가 |
| 유지보수·학습 문서 | architecture, source commentary, learning guide는 현재 source와 일치해 stale 상태 수정 불필요 |
| README | package version, 15 suites·50 tests, Android/iOS/offline 결과와 문서 link 일치 |

외부 URL 응답은 2026-08-13 closeout 시점의 도달 가능성 증거이며 이후 서비스 상태를 영구 보장하지 않는다. EAS build link의 HTTP 응답을 build 재검증으로 확대하지 않았다.

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
- 두 의미별 commit의 첫 push와 local·tracking·live remote·GitHub API parity
- `docs/` 10개 전체의 stale·revision·link·source 수치 정합성
- Metro `8081` listener 없음

### 이번 단계에서 확인하지 않음

- 새 Android/iOS native build, APK/IPA 생성
- 앱 설치·실행과 실기기 runtime
- 사진·알림·WebView·deep link의 반복 인수 검증
- EAS build, credential·signing 변경
- App Store Connect, TestFlight, production release
- iPhone 11 외 device/iOS matrix와 local Xcode
- 새 학습서 32개 서브 스텝의 사용자 학습 완료

이번 source diff에는 실행문이 없고 기존 자동 검사를 모두 통과했으므로 완료된 build·실기기 검증을 반복하지 않았다. 이는 과거 실기기 결과가 새로 재검증됐다는 뜻이 아니다.

### 차단 요소

본문 산출물, 자동 검사, 문서 정합성과 GitHub closeout을 막는 기술적 차단 요소는 없다. Commit/push 승인도 완료됐다.

## 10. Git·GitHub·runtime closeout

두 본문 commit의 첫 push 직후 실제 확인 결과다.

| 항목 | 결과 |
|---|---|
| Branch | `master` |
| 5단계 시작 SHA | `65f5b2d89850b9c72fca593deec579da3c39eae0` |
| Source 주석 commit | `c13dbaebad4e4a09a79fa78be1e33819585e0cff` |
| 본문 문서 commit | `095d42817ba8df7ce87a722ba4f9ab6bf95720b9` |
| 첫 push local·tracking·live remote | 모두 `095d42817ba8df7ce87a722ba4f9ab6bf95720b9` |
| 첫 push GitHub REST API | `public`, default `master`, SHA `095d42817ba8df7ce87a722ba4f9ab6bf95720b9` |
| 첫 push ahead/behind·worktree | `0 0`, clean |
| Metro `8081` | listener 0 |

이 문서와 전체 문서 stale 정리를 포함하는 마지막 `Docs: 5단계 GitHub closeout 기록` commit은 자신의 SHA를 본문에 고정하지 않는다. 내용을 바꾸면 SHA도 바뀌는 자기 참조를 피하기 위해 다음 명령으로 정확한 commit을 확인한다.

```powershell
git log -1 --format=%H -- docs/2026-08-13-step-5-final-handoff.md
```

마지막 closeout push 뒤 local `HEAD`, `origin/master`, `git ls-remote`, GitHub REST API `master`와 clean worktree를 다시 비교했다. 최종 SHA는 위 Git history 명령과 최종 실행 보고에서 확인하며, 이 문서에 정적 자기 SHA를 추가하기 위한 반복 commit은 만들지 않는다.

## 11. 실제 commit과 push 경계

1. `c13dbaebad4e4a09a79fa78be1e33819585e0cff` — `Docs: 5단계 source 역할과 FLOW 주석 정리`
   - `app/`, `src/`, `jest.setup.ts`, `eslint.config.js` 45개 파일
   - test·typecheck·lint와 staged 목록·stat·check 통과
2. `095d42817ba8df7ce87a722ba4f9ab6bf95720b9` — `Docs: 5단계 architecture와 학습 인계 정리`
   - `AGENTS.md`, README, architecture·source commentary·learning guide, 계획·날짜별 인계 10개 파일
   - Expo dependency/config/Doctor, Markdown, 공개 민감정보와 staged diff 검사 통과
3. `Docs: 5단계 GitHub closeout 기록`
   - `docs/` 10개 전체 감사 결과를 반영한 날짜별 문서 5개, 구현 계획과 이 최종 인계
   - 정확한 SHA는 이 문서의 마지막 변경 commit으로 확인

첫 두 commit은 함께 push한 뒤 `095d42817ba8df7ce87a722ba4f9ab6bf95720b9` parity를 독립 확인했다. 세 번째 commit도 staged `name-status`·`stat`·`check`, Markdown·secret 감사를 거쳐 별도 push했으며 generated output, credential, local IDE/Expo 상태와 unrelated 파일은 포함하지 않았다.

## 12. 새 세션 재개 순서

1. root `AGENTS.md`, 구현 계획서 11절·16~19절과 이 문서를 읽는다.
2. `git status --short`, branch, local/tracking/live remote SHA와 Metro `8081`을 다시 확인한다.
3. 1~5단계, 2026-08-13 오프라인 후속, 2026-08-14 source 주석 학습성 보강, 2026-08-19 FLOW 단계 재구성과 2026-08-20 실제 source 핵심 경로 보강은 완료 상태이므로 요청 없이 build·설치·실기기 검증을 반복하지 않는다.
4. 새 source·config·build 작업은 별도 목표·영향·승인 경계를 먼저 확정한다.
5. 대화형 학습은 사용자가 지정한 서브 스텝 하나만 source와 다시 대조하며, 질문을 마쳤다는 명시적 확인 전에는 완료를 추정하지 않는다.

현재 정확한 판정은 **5단계 source 주석·최종 문서와 후속 학습성 보강·FLOW 단계 재구성·실제 source 핵심 경로 보강·자동 감사·전체 문서 정합성·GitHub closeout 완료**다.

## 13. 2026-08-14 source 주석 학습성 보강

사용자는 5단계 주석을 확인한 뒤 초보자나 제3자가 처음 읽기에는 개발 용어가 어렵고 함수와 기능 범위를 한눈에 찾기 어렵다고 판단했다. 이에 현재 앱이 잘 설명하던 책임·이유·수명·FLOW는 보존하고, 참고 앱과 같은 초보자 학습 수준으로 45개 대상 파일의 주석을 전면 보강했다.

### 13.1 확장한 주석 계약과 결과

| 항목 | 결과 |
|---|---|
| 대상 | Production 28개, test 15개, tooling 2개로 총 45개 |
| 파일 시작 | 45/45 `[파일 역할]`, test 15/15 `[검증 경계]` 유지 |
| 함수 요약 | body가 있는 함수형 node 280/280에 서로 다른 가까운 `[역할]` 배치 |
| 학습 표식 | `[역할]` 362개, `[문법]` 140개, `[라이브러리]` 132개 |
| 큰 기능 구분 | `=` 시작·종료 146쌍, 화면 표시 폭 100칸 |
| 작은 단계 구분 | `-` 시작·종료 20쌍, 화면 표시 폭 100칸 |
| FLOW | canonical `FLOW-01`~`FLOW-09`와 56단계의 기존 표식 종류·개수 유지 |
| 과잉 주석 제외 | 반복 JSX·명백한 style·닫는 괄호와 `LOCAL_DEMO_HTML` payload 내부 설명 제외 |

한국어로 옮길 수 있는 설명은 “누가, 언제, 무엇을 하고 왜 필요한지”가 바로 보이도록 짧고 쉬운 문장으로 고쳤다. 변수명, 함수명, props, API와 문법 이름은 source를 검색하고 공식 계약을 확인할 수 있도록 원문을 유지했다. 상세한 표식·구분선 계약은 [소스 주석 읽기 안내서](./source-commentary-guide.md), 실제 학습 순서는 [구현 학습서](./learning-guide.md)를 따른다.

### 13.2 실행식·FLOW·문서 정합성 확인

| 검사 | 결과 |
|---|---|
| Script syntax equivalence | 변경된 TypeScript/JavaScript 45/45의 주석 제거 후 transpile 결과가 변경 전과 동일 |
| TypeScript parse | 변경된 45개 파일 diagnostic 0 |
| Local HTML payload | `LOCAL_DEMO_HTML` template literal이 변경 전과 동일 |
| FLOW 감사 | 기존 marker multiset 유지, canonical 9개·56단계 중복·소실 0 |
| 자동 검사 | Jest 15 suites·50 tests, `npm run typecheck`, `npm run lint` 통과 |
| `docs/` inventory | 10/10 문서 대조 |
| 현재 문서 | source commentary·learning guide·implementation plan·이 handoff를 새 계약에 맞게 갱신 |
| 변경 불필요 문서 | architecture는 실행 구조가 그대로이고, 과거 검증 문서 5개는 당시 증거와 최신 handoff 우선 관계가 유효함 |

이번 후속 작업은 source 실행식, `package.json`, lockfile, `app.json`, `eas.json`, native build 입력과 실제 앱 동작을 바꾸지 않았다. 따라서 완료된 Expo dependency/Doctor, Android/iOS build·설치·실기기 검증을 반복하지 않았으며, 이전 runtime 증거는 그대로 유지한다.

Source·test·tooling 주석은 `42d2a345cf21b8a7999d01541b046ee8373dd5ec` (`Docs: source 주석 학습성과 구분 구조 보강`)로 문서 변경과 분리했다. 이 handoff를 포함한 후속 문서 commit은 자신의 SHA를 고정하지 않으며, 정확한 마지막 문서 commit과 원격 반영 상태는 다음 명령과 최종 실행 보고에서 확인한다.

```powershell
git log -1 --format=%H -- docs/2026-08-13-step-5-final-handoff.md
git ls-remote --heads origin master
```

## 14. 2026-08-19 FLOW 단계 전면 재구성

기존 FLOW가 기능의 시작·종료, caller와 consumer, Promise 반환 및 React·Expo Router·native WebView·TanStack Query 자동 callback 사이의 인과관계를 충분히 드러내지 못한다는 사용자 피드백에 따라 production source 23개의 FLOW 단계 체계를 다시 구성했다.

- canonical `FLOW-01`~`FLOW-09` 시작 표식은 각각 실제 최초 caller 또는 자동 호출 주체와 `시작:`을 명시한다.
- 공통 경로는 `N단계`, 같은 깊이에서 갈라지는 입력·기능·결과는 `N-A단계`, `N-B단계`로 표시하며, 각 조합은 production source 전체에서 한 번만 사용한다.
- 이전 `[FLOW-NN / 관련 코드]` 표식은 모두 실제 caller·callback·Promise 반환·종료 지점의 고유 단계로 교체했다.
- 현재 inventory는 시작 9개와 고유 단계 229개로 총 238개이며, 중복·번호 누락·이전 `[관련 코드]` 표식은 0개다.
- 비-FLOW 주석과 `LOCAL_DEMO_HTML` payload는 보존했고, typecheck·lint·Jest 15 suites·50 tests와 문서 link·code fence 감사를 통과했다.

Source FLOW 변경은 `c86825f` (`Docs: FLOW 단계 주석 전면 재구성`), 학습·architecture 문서 동기화는 `26f6d4c` (`Docs: FLOW 학습 문서와 감사 결과 갱신`)로 분리했다. 이 변경은 실행식·dependency·config·native build 입력을 바꾸지 않았으므로 기존 실기기 결과는 당시 증거로 유지한다.

## 15. 2026-08-20 FLOW-01~09 실제 source 핵심 경로 보강

`source-commentary-guide.md`의 각 FLOW에 기존 설명을 그대로 둔 채, 시작부터 종료까지 이어지는 대표 경로를 실제 source 발췌로 추가했다. 학습자는 단계 제목의 정확한 line link를 열기 전에도 함수·component의 전체 모양과 `↓` 인과 설명을 따라 핵심 흐름을 먼저 파악하고, 기존 단계 지도에서 발췌하지 않은 branch를 이어서 조사할 수 있다.

| 검사 | 결과 |
|---|---|
| 기존 안내서 내용 | 삭제·변경 0, 실제 source 핵심 경로만 추가 |
| FLOW 보강 | FLOW-01~09 각각 1개, 누락·중복 0 |
| 단계·코드 블록 | 단계 제목 112개와 TypeScript/TSX 발췌 112개 일대일 대응 |
| 표식·link | 제목의 FLOW 표식이 연결 source 범위에 모두 존재하고 line anchor 범위 오류 0 |
| 발췌 원문·구조 | 축약 표식 외 코드가 실제 source 순서를 유지하며 112개 블록 parse diagnostic 0 |
| Markdown | repository 문서의 local link target과 code fence 오류 0, `git diff --check` 통과 |
| 실행 영향 | Production source·test·payload·package/config·native build 입력 변경 0 |

새 발췌를 찾는 경로는 README와 `learning-guide.md`에 연결했고, 완료·감사 기록은 `implementation-plan.md` 19절과 이 절에 보존했다. Runtime 구조와 과거 build·실기기 증거는 바뀌지 않아 `architecture-internals.md`와 날짜별 Android/iOS 완료 문서는 수정하지 않았다. 이 문서를 포함한 문서 commit의 정확한 SHA와 push 뒤 원격 일치는 자기 참조 SHA를 본문에 고정하지 않고 다음 명령과 최종 실행 보고로 확인한다.

```powershell
git log -1 --format=%H -- docs/2026-08-13-step-5-final-handoff.md
git ls-remote --heads origin master
```

## 16. 2026-08-20 Android WebView history 후속 수정

15절 뒤 사용자는 app 명령으로 Naver tab에 Nate를 연 경우 iOS와 참고 Android/iOS 앱은 Back으로 Naver에 돌아오지만 현재 Android만 app 종료 안내로 진행하는 차이를 발견했다. 기존 완료 증거를 소급 변경하지 않고 이 절을 현재 Android navigation 계약과 검증의 최신 우선 기록으로 사용한다.

### 16.1 원인과 source 경계

- Loaded document의 공통 `location.assign` 방식이 지정 Android runtime에서 app-initiated Nate navigation을 `canGoBack` history로 남기지 못했다.
- `WebTab.loadUrl`은 Android에서 parent URL policy를 직접 확인한 뒤 같은 key의 `source` 변경으로 RNWV native `loadUrl()`을 시작한다. iOS `location.assign`은 변경하지 않았다.
- `onNavigationStateChange` URL로 실제 현재 document를 추적한다. 현재 target이면 reload, 다른 허용 target이면 native source load, 차단 target이면 무동작이다.
- Native Back 뒤 React source와 현재 URL이 달라지는 경우를 위해 method 생략/명시적 `GET` source를 번갈아 전달한다. 이는 같은 GET request이며 WebView remount·blank 중간 page·이중 request를 만들지 않는다.
- Production의 기존 173개 comment와 test의 기존 55개 comment는 AST 기준 누락·변경 0이며, 새 코드와 test에도 역할·이유·검증 경계 주석을 추가했다.

Source/test commit은 `bf591b254c1369879adc094fd0d789f3f87a8ee3`이다. Push 뒤 local·tracking·`git ls-remote`·GitHub API의 `master`가 이 SHA로 일치하고 ahead/behind `0 0`, clean worktree를 확인한 뒤 문서 동기화를 시작했다.

### 16.2 검증 결과와 증거 층

| 증거 | 결과 |
|---|---|
| Unit/component | Jest 15 suites·54 tests 통과; Android 허용·차단·Back 뒤 같은 target·현재 URL reload branch 포함 |
| 정적 검사 | typecheck, lint, `git diff --check` 통과; FLOW 시작 9개·단계 233개, 중복 0 |
| Expo package 검사 | `expo@54.0.36`, `expo-constants@18.0.13`, `jest-expo@54.0.17`에 대한 권장 patch 차이로 install check 불통과, Doctor 17/18 |
| 설치·실행 | 기존 launcher-free Android development build가 Metro의 현재 bundle을 load |
| 지정 실기기 | LG `LM-V500N`, Android 12(API 31)에서 아래 history scenario 통과 |
| 새 native build | 수행하지 않음; package·lockfile·app/native config 변경 없음 |

실기기에서는 custom-scheme link와 bridge button 각각 Naver `history.length=1` → Nate `history.length=2`를 만들었고, hardware Back 뒤 app process를 유지하며 Naver로 복귀했다. Back 후 같은 Nate 재호출도 다시 load됐고, 현재 Nate 재호출은 history 길이를 늘리지 않은 채 새 document time origin으로 reload됐다. Naver에서 history가 없을 때 첫 Back은 기존 계약대로 종료하지 않고 Toast를 표시했다.

### 16.3 전체 문서 재감사

- `docs/`의 Markdown 10개를 모두 inventory하고 Android history, `loadUrl`, `location.assign`, FLOW-03, test 수치와 Expo 검사 판정을 검색했다.
- 현재 source 계약을 설명하는 architecture·source commentary·learning guide, 구현 계획과 이 최종 인계를 갱신했다.
- Android Expo Go·development build·iOS Preview 완료 문서는 과거 결과를 보존하면서 이 후속 수정의 대체 관계만 append했다.
- 2026-08-07 중단 handoff와 2026-08-10 초기 GitHub handoff는 역사적 snapshot과 최신 인계 link가 이미 정확하므로 변경하지 않는다.
- README는 현재 54 tests, Android history 후속과 Expo patch mismatch를 반영했다.
- 사용자 승인 뒤 `agents-md-improver` 진단안대로 `AGENTS.md`의 test 수치, 고유 branch FLOW 표식, Android loaded-document URL policy·native history·현재 URL/GET source 계약과 재검증 경계를 갱신했다.
- `source-commentary-guide.md`는 실제 source 제목·발췌 118쌍, 연결 범위의 시작 표식 9개·단계 참조 138개, 축약 외 source line 2,338개의 원문 순서와 TypeScript/TSX code fence 123개의 parse diagnostic 0을 확인했다.
- Tracked Markdown 13개에서 local link 373개, source line anchor 126개, heading anchor 2개와 code fence·heading depth·table·trailing whitespace를 검사해 오류 0을 확인했다. Production source·test·package/config와 reference-only `CLAUDE.md`는 이번 문서 묶음에서 변경하지 않는다.
- 학습 완료는 문서 갱신이나 test 통과로 추정하지 않는다. 사용자가 실제 source 확인과 질문을 마쳤다고 명시할 때만 `learning-guide.md`에 기록한다.

최종 문서 commit과 push는 이 절에 자기 SHA를 넣지 않는다. `git log -1 --format=%H -- docs/2026-08-13-step-5-final-handoff.md`와 local·tracking·live remote·GitHub API 비교를 최신 Git 판정으로 사용한다.

## 17. 2026-08-20 Android task 제거 cold deep-link 하얀 화면 수정

16절 뒤 사용자는 Metro를 유지한 상태에서도 Android 최근 앱 task에서 앱을 완전히 제거한 다음 외부 custom scheme으로 cold start하면 하얀 화면만 표시되는 현상을 발견했다. Android live Activity·process·intent, Metro bundle과 Expo Router stack을 함께 대조해 native launch 실패가 아닌 JavaScript navigation readiness race로 확정했다.

### 17.1 원인과 source 경계

- `dumpsys activity exit-info`는 app process가 `reason=USER REQUESTED`, `description=remove task`로 종료됐음을 보여 줬고 새 intent는 `LaunchState: COLD`로 `MainActivity`에 들어왔다.
- `redirectSystemPath`가 index query를 만든 뒤 `DemoShell`의 첫 effect가 deep link를 적용했다. 이어진 global `useRouter().setParams`가 아직 `isReady() === false`인 Expo Router navigation ref assertion을 만나 Root Layout 오류를 던졌다.
- Root `Stack` 선행 mount와 global `NavigationContainer.onReady`는 같은 보장이 아니다. 처리 완료 query만 `useNavigation()`이 제공하는 현재 index route의 navigation 객체로 지워 timer·retry state·platform branch 없이 race를 제거했다.
- URL rewrite·runtime parser·Zustand state, WebView URL/history, invalid Alert, query cleanup의 `undefined` payload와 package/native config는 바꾸지 않았다.
- 기존 `DemoShell.tsx` comment 256개 중 255개는 원문 그대로 유지했다. API가 바뀐 역할 comment 1개만 정확한 Hook 이름으로 정정하고 이유·generic 문법 comment를 추가했다.

Source/test commit은 `1546128c63198af1d3540de595130620e586ef4b` (`Fix: Android 콜드 딥링크 화면 복구`)이다.

### 17.2 검증 결과와 증거 층

| 증거 | 결과 |
|---|---|
| Unit/component | 새 DemoShell test 1개 포함 Jest 16 suites·55 tests 통과 |
| 정적 검사 | typecheck, lint, `git diff --check` 통과; FLOW 시작 9개·단계 233개, 중복 0 |
| Expo package 검사 | 기존 SDK 54 patch mismatch 3개로 install check 불통과, Doctor 17/18; public config 통과 |
| 설치·실행 | 기존 launcher-free Android development build가 계속 실행 중인 Metro의 현재 bundle을 load |
| 지정 실기기 | LG `LM-V500N`, Android 12에서 task 제거 cold link 3회와 관련 회귀 통과 |
| iOS | 수정 전 사용자 cold link 정상; 수정 뒤 새 build·실기기 검증 미수행 |

Android에서는 정확한 최근 앱 card 제거 뒤 동일 valid custom scheme을 3회 반복해 모두 cold launch·process 생존·Naver tab 선택과 app navigation 표시를 확인했다. 대표 실행은 WebView DevTools에서 `https://m.nate.com/`도 확인했고 Metro에는 기존 Root Layout 오류가 다시 나타나지 않았다. 일반 launcher cold, warm native target, invalid target와 기존 tab 유지, 동일 valid link 재호출을 통과했으며 warm Naver→Nate 뒤 hardware Back도 Naver로 돌아가 직전 history 수정이 유지됐다.

### 17.3 전체 문서 재감사

- 현재 계약을 설명하는 README·architecture·source commentary·learning guide·implementation plan과 이 최종 인계를 갱신한다.
- Android development build 문서는 Metro-on readiness race를 기존 Metro-off ANR과 구분하는 후속 절을 append하고, iOS 문서는 사용자의 수정 전 정상 확인과 수정 뒤 미검증 경계를 append한다.
- 2026-08-07 중단 handoff, 2026-08-10 Expo Go 완료·초기 GitHub handoff는 역사적 snapshot이며 이번 query cleanup과 직접 연결되지 않아 본문을 변경하지 않는다.
- `AGENTS.md`는 `agents-md-improver` 진단안대로 current-route cleanup 금지/유지 계약, 16 suites·55 tests와 mock/native timing 경계를 반영한다.
- Source commentary의 `DemoShell.tsx` line anchor는 Hook block의 실제 line 이동을 모두 반영하고 FLOW-06 발췌를 current-route `useNavigation` source와 일치시킨다.
- Tracked Markdown 13개의 local link 378개, source line anchor 126개, heading anchor 2개와 code fence·heading depth·table·trailing whitespace는 오류 0이다. Source commentary도 발췌 제목 118개·연결 단계 표식 147개, 축약 외 source line 2,348개와 TypeScript/TSX code fence 123개를 실제 source와 대조해 표식·순서·parse diagnostic 오류 0을 확인했다.
- 학습 완료는 이번 수정·검증만으로 추정하지 않는다.

사용자의 최신 지시에 따라 source/test commit 뒤의 추가 commit과 모든 push는 보류한다. 이 문서 묶음은 working tree에 미커밋으로 보존하며, 이후 사용자가 다시 승인할 때만 staged diff를 검사하고 원격 반영을 시작한다. Metro와 `tcp:8081` reverse는 요청대로 종료하지 않는다.

## 18. 2026-08-20 Android 동일 Web 딥링크 Warm 재처리 최종 후속

17절 뒤 사용자가 직접 다시 검증해, task 제거 Cold는 정상이지만 app task가 background에 남은 상태에서 브라우저의 같은 Web link를 재호출하면 Naver tab 이동과 Nate URL load만 생략되는 결함을 발견했다. Warm native target·refetch와 invalid target은 정상 동작했다. 이 절은 17절의 동일 valid link 재호출 최종 판정을 정확한 Cold→same Warm browser 순서로 대체한다.

### 18.1 원인과 source 계약

- 실제 Chrome link로 `task 제거 → Web Cold → Main tab → 같은 Web Warm`을 재현했고, Warm에서 process는 유지됐지만 tab·URL 적용이 없었다.
- 동일 Warm `VIEW` intent는 Expo Router의 `redirectSystemPath(initial: false)`까지 도달했다. 다만 Cold 첫 `DemoShell` effect에서 즉시 보낸 current-route cleanup이 navigation state 초기화 중 반영되지 않아 같은 rewritten route가 새 query 변경을 만들지 못했다.
- 다른 Warm query는 effect 실행 뒤 `undefined` cleanup까지 통과했으므로 WebView ref, parser, Android Intent와 Metro 문제가 아님을 분리했다.
- 최종 source는 `handleDeepLinkUrl`을 즉시 실행한 뒤 `requestAnimationFrame`으로 다음 UI frame을 예약한다. Callback은 current-route `replaceParams({})`로 params를 완전히 비우고 effect cleanup은 `cancelAnimationFrame`으로 미실행 callback을 취소한다.
- Global `useRouter`, Android branch, retry state, 별도 Linking listener, event nonce, dependency·package·native config는 추가하지 않았다.
- 변경과 직접 연결된 기존 주석만 API·시점에 맞춰 정정하고, 그 외 주석과 FLOW 표식을 보존했다. 새 실행식과 test 코드에도 기존 수준의 역할·이유·검증 경계 주석을 추가했다.

Behavior source/test commit은 `4f349b857f143a814e71f3154b54ed0023119648` (`Fix: Android 동일 Warm 딥링크 재처리`)이며, source 설명 한 줄의 최종 시점 정정은 `a8cd4fb` (`Docs: 딥링크 cleanup 주석 시점 정정`)이다.

### 18.2 최종 증거

| 증거 | 결과 |
|---|---|
| Unit/component | DemoShell 동일 Warm query test 포함 Jest 16 suites·56 tests 통과 |
| 정적 검사 | typecheck, lint, source/test staged diff check 통과 |
| Expo package 검사 | 기존 SDK 54 patch mismatch 3개로 install check 불통과, Doctor 17/18; public config 통과 |
| 설치·실행 | 기존 launcher-free Android development build가 Metro의 최신 JavaScript bundle을 load |
| 지정 Android 실기기 | task 제거 Cold Web, 같은 process의 Main→동일 Warm Web, Warm Native refetch·invalid Alert 통과 |
| iOS | 최종 수정 전 사용자 Cold 정상; 최종 수정 뒤 새 build·실기기 검증 미수행 |

Android Cold에서는 새 process, Naver tab 선택과 WebView DevTools의 `https://m.nate.com/`을 확인했다. 이어 Main tab을 선택한 뒤 같은 Chrome link를 다시 눌러 process가 유지된 Warm 상태에서 Naver tab과 Nate URL이 다시 적용됐다. 같은 process의 native target은 `사용자 조회 완료`, invalid target은 `잘못된 링크` Alert를 표시했다. 임시 진단 log는 모두 제거했고 Metro는 사용자 요청대로 종료하지 않았다.

### 18.3 문서·Git closeout

- 현재 계약 문서인 README·architecture·source commentary·learning guide·`AGENTS.md`와 계획·Android/iOS 완료 문서를 최종 cleanup 순서로 동기화한다.
- 17절까지의 Cold 원인·검증·보류 기록은 당시 이력으로 보존하고, 현재 동작은 이 18절을 우선한다.
- `DemoShell.tsx` line 증가 뒤 FLOW-01~09의 source commentary link와 FLOW-06 발췌 원문을 다시 대조한다.
- Production FLOW 시작 9개·단계 233개는 중복 0이다. Source commentary의 발췌 제목 118개·연결 단계 표식 147개, 축약 외 source line 2,362개와 TypeScript/TSX code fence 123개는 실제 source 범위·표식·원문 순서·parse diagnostic 오류 0이다.
- Tracked Markdown 13개의 local link 379개, source line anchor 126개·heading anchor 2개와 code fence·heading depth·trailing whitespace는 오류 0이다.
- 최종 문서 commit은 자기 SHA를 본문에 넣지 않는다. Push 뒤 local `HEAD`, tracking ref, ahead/behind, `git ls-remote`와 GitHub public/API state를 독립 비교한다.
- Metro와 Android `tcp:8081` reverse는 사용자의 요청대로 유지한다.
