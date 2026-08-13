// [파일 역할] JSONPlaceholder 사용자 HTTP 요청, retry 판단과 TanStack Query 연결을 한 API 경계에 모읍니다.
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import axios, { isAxiosError, isCancel } from "axios";

import { parseUsersResponse } from "@/src/schemas/user";
import type { User } from "@/src/types/user";

export const USERS_ENDPOINT = "https://jsonplaceholder.typicode.com/users";
export const USERS_STALE_TIME_MS = 5 * 60 * 1000;

export const usersKeys = {
  all: ["users"] as const,
};

export async function fetchUsers(signal?: AbortSignal): Promise<User[]> {
  // [FLOW-07 / 3단계] Query의 AbortSignal과 10초 timeout을 Axios에 전달하고 응답은 먼저 unknown으로 받습니다.
  const response = await axios.get<unknown>(USERS_ENDPOINT, {
    signal,
    timeout: 10_000,
  });

  return parseUsersResponse(response.data);
}

export function shouldRetryUsersRequest(
  failureCount: number,
  error: Error,
): boolean {
  // 취소·schema 오류·4xx처럼 같은 입력으로 반복해도 회복되지 않는 실패는 재시도하지 않습니다.
  if (failureCount >= 1 || !isAxiosError(error)) {
    return false;
  }

  if (isCancel(error) || error.code === "ERR_CANCELED") {
    return false;
  }

  if (error.response) {
    // server 5xx와 response 자체가 없는 network 실패만 한 번 더 시도합니다.
    return error.response.status >= 500;
  }

  return Boolean(error.request);
}

export function useUsersQuery(
  enabled = true,
): UseQueryResult<User[], Error> {
  // [FLOW-07 / 2단계] native 탭이 한 번도 활성화되지 않았을 때는 enabled=false로 불필요한 최초 요청을 막습니다.
  return useQuery({
    queryKey: usersKeys.all,
    enabled,
    queryFn: ({ signal }) => fetchUsers(signal),
    staleTime: USERS_STALE_TIME_MS,
    retry: shouldRetryUsersRequest,
  });
}
