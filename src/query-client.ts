// [파일 역할] TanStack Query가 요청 결과를 어떻게 보관하고 다시 요청할지 앱 전체 기본 규칙을 정합니다.
// [라이브러리] `QueryClient`는 서버에서 받은 값, 오류, 받은 시각, 요청 중 여부를 화면 밖에 보관합니다.

// ========================================== 외부 의존성 ==========================================

import { QueryClient } from "@tanstack/react-query";

// =================================================================================================

// ======================================= QueryClient 생성 ========================================

// [역할] `createQueryClient`는 앱이 사용할 Query 저장소와 자동 재요청 기본 규칙을 새로 만듭니다.
// [문법] `: QueryClient`는 이 함수가 언제나 QueryClient를 만들어 돌려준다고 TypeScript에 알려 줍니다.
export function createQueryClient(): QueryClient {
  // [이유] 만드는 함수를 따로 내보내면 test가 앱에서 쓰는 QueryClient와 별개의 새 저장소를 만들 수 있습니다.
  return new QueryClient({
    defaultOptions: {
      queries: {
        // [FLOW-09 / 4단계] 인터넷 연결이 돌아왔다는 이유만으로 API를 자동 호출하지 않습니다.
        // 사용자가 다시 시도하거나 새로 고침을 선택했을 때 요청합니다.
        refetchOnReconnect: false,
        // 모바일 앱은 웹 브라우저와 화면 활성 방식이 다르므로 window focus를 새 요청 신호로 쓰지 않습니다.
        refetchOnWindowFocus: false,
        // 모든 요청을 몰래 재시도하지 않습니다. 필요한 요청만 각 API에서 재시도 규칙을 직접 정합니다.
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// [FLOW-07 / 관련 코드] RootLayout이 이 한 개의 QueryClient를 전달하므로 화면이 바뀌어도 사용자 목록이 남습니다.
// [문법] 파일 바깥쪽의 `const`는 이 파일을 처음 가져올 때 한 번만 만들어집니다.
// 같은 앱 실행 중 이 파일을 가져오는 코드는 모두 이 QueryClient 하나를 함께 씁니다.
export const queryClient = createQueryClient();

// =================================================================================================
