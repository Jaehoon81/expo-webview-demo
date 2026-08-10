import { parseUsersResponse } from "@/src/schemas/user";

describe("parseUsersResponse", () => {
  it("외부 응답에서 앱에 필요한 필드만 반환한다", () => {
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
