// [파일 역할] 출처를 믿을 수 없는 사용자 응답에서 필요한 field만 남기는지 확인합니다. 앞뒤 공백을 지우고 잘못된 값은 거절하는지도 검사합니다.
// [검증 경계] 여기서는 Zod 검사만 실행합니다. Axios 요청, Query가 값을 보관하는 과정, 화면 표시는 확인하지 않습니다.
// [라이브러리] Jest의 전체 값 비교로 정리된 결과를 확인하고, throw 검사로 잘못된 입력이 Error를 내는지 확인합니다.

// ========================================== 외부 의존성 ==========================================

import { parseUsersResponse } from "@/src/schemas/user";

// =================================================================================================

// ========================================== test cases ===========================================

// [역할] `describe` callback은 사용자 응답 정리와 잘못된 값 거부 test를 한 묶음으로 실행합니다.
describe("parseUsersResponse", () => {
  // [역할] 이 test callback은 외부 응답의 추가 field를 버리고 앱에 필요한 값만 남기는지 확인합니다.
  it("외부 응답에서 앱에 필요한 필드만 반환한다", () => {
    // 서버 응답에 phone이 더 있어도 앱의 User에는 id, name, email만 남아야 합니다.
    // phone을 포함한 일반 객체를 넘겨 Zod 검사와 필요한 field만 고르는 코드까지 함께 실행합니다.
    const result = parseUsersResponse([
      {
        id: 1,
        name: "Leanne Graham",
        email: "leanne@example.com",
        phone: "1-770-736-8031",
      },
    ]);

    // [라이브러리] `toEqual`은 배열과 객체 안의 값을 모두 비교합니다. phone이 결과에서 빠졌는지도 확인할 수 있습니다.
    expect(result).toEqual([
      {
        id: 1,
        name: "Leanne Graham",
        email: "leanne@example.com",
      },
    ]);
  });

  // [역할] 이 test callback은 잘못된 email이나 id가 Zod 검사에서 거부되는지 확인합니다.
  it("잘못된 email 또는 id를 거부한다", () => {
    // [문법] Error가 날 코드를 `() => ...` 함수로 감싸서 `expect`에 줍니다. 그래야 `toThrow`가 Error를 잡아 test를 계속 판단할 수 있습니다.
    // [역할] `expect` wrapper callback은 잘못된 사용자 응답을 실제 검사 함수에 전달해 Error를 발생시킵니다.
    expect(() =>
      parseUsersResponse([
        {
          id: 0,
          name: "Invalid",
          email: "not-an-email",
        },
      ]),
    ).toThrow();
  });
});

// =================================================================================================
