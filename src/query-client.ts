// [파일 역할] 앱 전체에서 공유하는 TanStack Query client와 기본 자동 재시도·refetch 정책을 정의합니다.
import { QueryClient } from "@tanstack/react-query";

export function createQueryClient(): QueryClient {
  // factory를 export해 test나 격리된 consumer가 전역 singleton과 분리된 cache를 만들 수 있습니다.
  return new QueryClient({
    defaultOptions: {
      queries: {
        // [FLOW-09 / 4단계] 연결 복귀만으로 API를 자동 재요청하지 않고 화면의 명시적 retry/refetch로 결과를 관찰합니다.
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// [FLOW-07 / 관련 코드] RootLayout이 이 singleton을 provider에 주입해 사용자 목록 cache를 route 전환과 무관하게 유지합니다.
export const queryClient = createQueryClient();
