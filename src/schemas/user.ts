// [파일 역할] 신뢰할 수 없는 JSONPlaceholder payload를 runtime에서 검사하고 내부 User 배열로 정규화합니다.
// [검증 경계] Zod parsing은 응답 shape만 확인하며 HTTP 성공·timeout·취소는 src/api/users.ts의 책임입니다.
import { z } from "zod";

import type { User } from "@/src/types/user";

export const jsonPlaceholderUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
});

export const jsonPlaceholderUsersSchema = z.array(
  jsonPlaceholderUserSchema,
);

export function parseUsersResponse(input: unknown): User[] {
  // [FLOW-07 / 4단계] unknown 외부 data를 parse한 뒤 UI가 사용하지 않는 필드는 버리고 세 필드만 새 객체로 반환합니다.
  return jsonPlaceholderUsersSchema.parse(input).map(({ id, name, email }) => ({
    id,
    name,
    email,
  }));
}
