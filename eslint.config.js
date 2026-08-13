// [파일 역할] npm run lint가 Expo SDK와 React Native 권장 flat config 및 generated dist 제외 범위를 읽는 설정입니다.
// 참고 문서: https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
]);
