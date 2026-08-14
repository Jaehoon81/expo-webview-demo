// [파일 역할] 사용자 API를 호출하고, 실패했을 때 다시 요청할지 정한 뒤 결과를 TanStack Query에 연결합니다.
// [라이브러리] Axios는 HTTP 요청을 보냅니다. TanStack Query는 요청 중·성공·실패 상태와 결과를 보관합니다.

// ========================================== 외부 의존성 ==========================================

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import axios, { isAxiosError, isCancel } from "axios";

import { parseUsersResponse } from "@/src/schemas/user";
import type { User } from "@/src/types/user";

// =================================================================================================

// ======================================= 사용자 API 고정값 =======================================

export const USERS_ENDPOINT = "https://jsonplaceholder.typicode.com/users";
// [문법] 이 계산은 파일을 처음 읽을 때 한 번 실행됩니다. 이름에 `_MS`를 붙여 값의 단위가 ms임을 보여 줍니다.
export const USERS_STALE_TIME_MS = 5 * 60 * 1000;

// [문법] `as const`는 `["users"]`를 바꿀 수 없는 고정 배열로 기억해 Query key type이 흐려지지 않게 합니다.
export const usersKeys = {
  all: ["users"] as const,
};

// =================================================================================================

// ======================================== 사용자 API 함수 ========================================

// [역할] `fetchUsers`는 사용자 API를 요청하고, 응답을 검사한 `User[]`만 돌려줍니다.
// [문법] `signal?`의 `?`는 이 값을 생략해도 된다는 뜻입니다. Query가 부를 때는 요청 취소 신호를 넣습니다.
export async function fetchUsers(signal?: AbortSignal): Promise<User[]> {
  // [FLOW-07 / 3단계] Query의 취소 신호와 10초 제한을 Axios에 넘깁니다. 응답은 아직 믿지 않고 `unknown`으로 받습니다.
  const response = await axios.get<unknown>(USERS_ENDPOINT, {
    signal,
    timeout: 10_000,
  });

  // HTTP 요청이 성공해도 내용이 올바르다는 보장은 없습니다. Zod 검사를 통과한 User 배열만 돌려줍니다.
  return parseUsersResponse(response.data);
}

// [역할] `shouldRetryUsersRequest`는 실패 횟수와 오류 종류를 보고 요청을 한 번 더 보낼지 결정합니다.
export function shouldRetryUsersRequest(
  failureCount: number,
  error: Error,
): boolean {
  // 이미 한 번 다시 시도했거나 Axios 오류가 아니면 더 요청하지 않습니다.
  // 입력 오류나 Zod 오류처럼 같은 요청을 반복해도 해결되지 않는 경우를 막기 위해서입니다.
  if (failureCount >= 1 || !isAxiosError(error)) {
    return false;
  }

  if (isCancel(error) || error.code === "ERR_CANCELED") {
    // [라이브러리] Axios가 사용하는 두 가지 취소 표시를 모두 확인합니다. 사용자가 떠난 요청은 다시 보내지 않습니다.
    return false;
  }

  if (error.response) {
    // 서버가 잠시 실패한 5xx만 한 번 더 시도합니다. 4xx는 요청 자체 문제이므로 반복하지 않습니다.
    return error.response.status >= 500;
  }

  // [문법] `Boolean(error.request)`는 request가 있었는지를 true 또는 false로 바꿉니다.
  // 서버 응답을 받지 못한 네트워크 실패일 때만 true가 됩니다.
  return Boolean(error.request);
}

// [라이브러리] 같은 `queryKey`를 쓰는 화면은 `useQuery`에 저장된 사용자 목록을 함께 봅니다.
// 화면이 잠시 사라져도 Query 저장소의 값은 바로 없어지지 않습니다.
// [역할] `useUsersQuery`는 사용자 요청 규칙을 TanStack Query에 연결하고 현재 요청 상태와 결과를 돌려줍니다.
export function useUsersQuery(
  enabled = true,
): UseQueryResult<User[], Error> {
  // [FLOW-07 / 2단계] native 탭을 열기 전에는 `enabled=false`라 사용자 API를 미리 호출하지 않습니다.
  return useQuery({
    queryKey: usersKeys.all,
    enabled,
    // [문법] `{ signal }`은 Query가 준 객체에서 취소 신호만 꺼내 `fetchUsers`에 전달합니다.
    // [역할] `queryFn` callback은 Query의 취소 신호를 실제 사용자 API 함수에 전달합니다.
    queryFn: ({ signal }) => fetchUsers(signal),
    staleTime: USERS_STALE_TIME_MS,
    retry: shouldRetryUsersRequest,
  });
}

// =================================================================================================
