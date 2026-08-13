// [파일 역할] unknown 사용자 payload의 필드 선택·trim/runtime 제약 중 대표 성공과 거부 경계를 검증합니다.
// [검증 경계] Zod parsing만 실행하며 Axios, Query cache와 화면 rendering은 이 suite의 범위가 아닙니다.
import { parseUsersResponse } from "@/src/schemas/user";

describe("parseUsersResponse", () => {
  it("외부 응답에서 앱에 필요한 필드만 반환한다", () => {
    // 외부 phone이 있어도 내부 User에는 id/name/email만 남는 정규화 계약을 확인합니다.
    const result = parseUsersResponse([
      {
        id: 1,
        name: "Leanne Graham",
        email: "leanne@example.com",
        phone: "1-770-736-8031",
      },
    ]);

    expect(result).toEqual([
      {
        id: 1,
        name: "Leanne Graham",
        email: "leanne@example.com",
      },
    ]);
  });

  it("잘못된 email 또는 id를 거부한다", () => {
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
