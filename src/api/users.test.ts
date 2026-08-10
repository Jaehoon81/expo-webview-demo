import type { AxiosError } from "axios";

import { shouldRetryUsersRequest } from "@/src/api/users";

function makeAxiosError(options: {
  status?: number;
  hasRequest?: boolean;
  canceled?: boolean;
}): Error {
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
