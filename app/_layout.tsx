// [파일 역할] 앱 전체의 가장 바깥 틀입니다. 화면들이 함께 쓸 Query 저장소와 화면 이동 Stack을 만듭니다.
// [FLOW-01] 앱은 이 틀을 먼저 만든 뒤 저장된 탭을 불러오고, 마지막에 DemoShell을 보여 줍니다.
// [라이브러리] `QueryClientProvider` 안에 있는 모든 화면은 같은 Query 저장소를 함께 사용합니다.

// ========================================== 외부 의존성 ==========================================

import { QueryClientProvider } from "@tanstack/react-query";
// [라이브러리] Expo Router의 `Stack`은 `app` 폴더의 파일을 이동할 수 있는 화면 목록으로 만듭니다.
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { queryClient } from "@/src/query-client";

// =================================================================================================

// ========================================== Root layout ==========================================

// [역할] `RootLayout`은 Query 저장소와 Expo Router Stack을 앱의 모든 화면 바깥에 배치합니다.
// [문법] `export default`는 이 함수가 이 파일을 대표한다고 알립니다. Expo Router는 이 함수를 앱 틀로 사용합니다.
export default function RootLayout() {
  // [FLOW-01 / 1단계] `QueryClientProvider`를 화면들보다 바깥에 두어 화면이 바뀌어도 사용자 목록을 보관합니다.
  // Root Stack은 저장값을 읽기 전에 먼저 만듭니다. 그래야 앱을 주소로 열어도 이동할 화면이 이미 준비돼 있습니다.
  // [라이브러리] `headerShown: false`는 Stack이 자동으로 만드는 위쪽 제목 표시줄만 숨깁니다.
  // 앱이 직접 만든 하단 탭과 popup에는 영향을 주지 않습니다.
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  );
}

// =================================================================================================
