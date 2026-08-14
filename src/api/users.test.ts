// [파일 역할] 사용자 API 요청을 다시 시도해도 되는 경우를 검사합니다. 인터넷 연결 오류와 서버 5xx 오류만 한 번 다시 시도하는지 확인합니다.
// [검증 경계] 여기서는 실제 Axios 요청을 보내지 않고 판단 함수만 확인합니다.
// timeout, AbortSignal, 실제 HTTP 응답, Query의 재시도 실행은 확인하지 않습니다.
// [라이브러리] Jest의 `describe`는 관련 test를 묶고 `it`는 한 경우를 실행합니다. `expect`는 함수가 돌려준 true 또는 false를 비교합니다.
// [문법] `import type`으로 가져온 `AxiosError`는 TypeScript 검사에만 쓰입니다. test를 실행할 때는 실제 import 코드가 생기지 않습니다.

// ========================================== 외부 의존성 ==========================================

import type { AxiosError } from "axios";

import { shouldRetryUsersRequest } from "@/src/api/users";

// =================================================================================================

// ===================================== 사용자 API test 준비 ======================================

// [역할] `makeAxiosError`는 각 test가 필요한 정보만 넣은 Axios 오류 모양을 만듭니다.
function makeAxiosError(options: {
  // [문법] `?`가 붙은 세 property는 생략할 수 있습니다. 각 test가 필요한 Axios 오류 정보만 넣을 수 있습니다.
  status?: number;
  hasRequest?: boolean;
  canceled?: boolean;
}): Error {
  // Axios 오류 판단 함수가 알아볼 최소 값만 가진 가짜 Error를 만듭니다.
  // ternary와 undefined를 사용해 연결 오류, HTTP 오류, 취소 오류를 같은 함수에서 만듭니다.
  return {
    name: options.canceled ? "CanceledError" : "AxiosError",
    message: "request failed",
    isAxiosError: true,
    code: options.canceled ? "ERR_CANCELED" : "ERR_NETWORK",
    request: options.hasRequest ? {} : undefined,
    response:
      options.status === undefined ? undefined : { status: options.status },
    __CANCEL__: options.canceled,
  // [문법] 이 가짜 값은 실제 `AxiosError`의 모든 값을 갖지 않습니다. test 안에서만 `unknown`을 거쳐 원하는 type으로 두 번 바꿉니다.
  } as unknown as AxiosError;
}

// =================================================================================================

// ===================================== 사용자 API test cases =====================================

// [라이브러리] 각 `it`는 다른 test와 따로 실행됩니다. 실제 판단 함수에는 실패 횟수와 가짜 오류만 전달합니다.
// [역할] `describe` callback은 사용자 요청 재시도 규칙을 확인하는 test들을 한 묶음으로 실행합니다.
describe("shouldRetryUsersRequest", () => {
  // [역할] 이 test callback은 응답 없는 네트워크 오류를 최초 한 번만 재시도하는지 확인합니다.
  it("응답 없는 네트워크 오류는 한 번만 재시도한다", () => {
    const error = makeAxiosError({ hasRequest: true });

    expect(shouldRetryUsersRequest(0, error)).toBe(true);
    // failureCount가 1이면 한 번 다시 시도한 뒤 또 실패했다는 뜻입니다. 더는 시도하지 않아야 합니다.
    expect(shouldRetryUsersRequest(1, error)).toBe(false);
  });

  // [역할] 이 test callback은 서버 5xx와 요청 4xx의 재시도 결과가 서로 다른지 확인합니다.
  it("5xx는 재시도하고 4xx는 재시도하지 않는다", () => {
    expect(
      shouldRetryUsersRequest(0, makeAxiosError({ status: 503 })),
    ).toBe(true);
    expect(
      shouldRetryUsersRequest(0, makeAxiosError({ status: 404 })),
    ).toBe(false);
  });

  // [역할] 이 test callback은 취소된 요청과 Axios 밖의 오류를 다시 보내지 않는지 확인합니다.
  it("취소와 Axios 외 오류는 재시도하지 않는다", () => {
    expect(
      shouldRetryUsersRequest(0, makeAxiosError({ canceled: true })),
    ).toBe(false);
    expect(shouldRetryUsersRequest(0, new Error("schema error"))).toBe(false);
  });
});

// =================================================================================================
