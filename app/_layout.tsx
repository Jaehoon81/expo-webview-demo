// [파일 역할] Expo Router의 최상위 layout으로 app-wide Query cache와 숨김 Stack을 한 번만 구성합니다.
// [FLOW-01] 앱 시작 흐름은 이 Root layout에서 시작해 index route의 Zustand hydration gate를 지난 뒤 DemoShell로 이어집니다.
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { queryClient } from "@/src/query-client";

export default function RootLayout() {
  // [FLOW-01 / 1단계] QueryClientProvider를 route tree 바깥에 두어 네이티브 탭의 Query cache가 route render 동안 유지됩니다.
  // Root Stack은 hydration 여부와 무관하게 먼저 mount되어 cold deep link가 params를 적용할 navigation 대상도 보존합니다.
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}
