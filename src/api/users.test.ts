// [파일 역할] 사용자 API retry 정책이 network/5xx만 한 번 허용하고 4xx·취소·schema 오류를 거부하는지 검증합니다.
// [검증 경계] Axios request를 보내지 않는 순수 policy test이므로 timeout, AbortSignal, 실제 HTTP 응답과 Query 재시도 실행은 확인하지 않습니다.
import type { AxiosError } from "axios";

import { shouldRetryUsersRequest } from "@/src/api/users";

function makeAxiosError(options: {
  status?: number;
  hasRequest?: boolean;
  canceled?: boolean;
}): Error {
  // Axios helper가 식별할 최소 runtime property만 가진 error fixture를 만듭니다.
  return {
    name: options.canceled ? "CanceledError" : "AxiosError",
    message: "request failed",
    isAxiosError: true,
    code: options.canceled ? "ERR_CANCELED" : "ERR_NETWORK",
    request: options.hasRequest ? {} : undefined,
    response:
      options.status === undefined ? undefined : { status: options.status },
    __CANCEL__: options.canceled,
  } as unknown as AxiosError;
}

describe("shouldRetryUsersRequest", () => {
  it("응답 없는 네트워크 오류는 한 번만 재시도한다", () => {
    const error = makeAxiosError({ hasRequest: true });

    expect(shouldRetryUsersRequest(0, error)).toBe(true);
    // failureCount 1은 이미 첫 재시도를 소비했다는 뜻입니다.
    expect(shouldRetryUsersRequest(1, error)).toBe(false);
  });

  it("5xx는 재시도하고 4xx는 재시도하지 않는다", () => {
    expect(
      shouldRetryUsersRequest(0, makeAxiosError({ status: 503 })),
    ).toBe(true);
    expect(
      shouldRetryUsersRequest(0, makeAxiosError({ status: 404 })),
    ).toBe(false);
  });

  it("취소와 Axios 외 오류는 재시도하지 않는다", () => {
    expect(
      shouldRetryUsersRequest(0, makeAxiosError({ canceled: true })),
    ).toBe(false);
    expect(shouldRetryUsersRequest(0, new Error("schema error"))).toBe(false);
  });
});
