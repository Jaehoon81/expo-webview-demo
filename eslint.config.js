// [파일 역할] `npm run lint`가 사용할 검사 규칙과 검사에서 뺄 폴더를 정합니다.
// 참고 문서: https://docs.expo.dev/guides/using-eslint/
// [문법] 이 파일은 CommonJS 방식이라 `import/export` 대신 `require`와 `module.exports`를 사용합니다.

// ======================================== tooling 의존성 =========================================

// [라이브러리] `defineConfig`는 설정 모양이 맞는지 editor와 ESLint가 확인하기 쉽게 도와줍니다.
const { defineConfig } = require('eslint/config');
// [라이브러리] Expo preset에는 SDK 54 프로젝트에 필요한 기본 검사 규칙이 모여 있습니다.
const expoConfig = require('eslint-config-expo/flat');

// =================================================================================================

// ========================================== ESLint 설정 ==========================================

// [역할] `module.exports`는 Expo 기본 규칙과 이 프로젝트의 제외 폴더를 합친 ESLint 설정을 내보냅니다.
module.exports = defineConfig([
  // 먼저 Expo 기본 규칙을 넣고, 그 다음 객체에서 이 프로젝트만의 제외 범위를 더합니다.
  expoConfig,
  {
    // dist는 build가 만든 결과물이므로 사람이 작성한 source 검사에서 뺍니다.
    ignores: ['dist/*'],
  },
]);

// =================================================================================================
