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
  if (failureCount >= 1 || !isAxiosError(error)) {
    return false;
  }

  if (isCancel(error) || error.code === "ERR_CANCELED") {
    return false;
  }

  if (error.response) {
    return error.response.status >= 500;
  }

  return Boolean(error.request);
}

export function useUsersQuery(
  enabled = true,
): UseQueryResult<User[], Error> {
  return useQuery({
    queryKey: usersKeys.all,
    enabled,
    queryFn: ({ signal }) => fetchUsers(signal),
    staleTime: USERS_STALE_TIME_MS,
    retry: shouldRetryUsersRequest,
  });
}
