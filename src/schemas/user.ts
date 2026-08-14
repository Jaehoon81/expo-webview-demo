// [파일 역할] JSONPlaceholder가 보낸 값을 실제로 검사하고 앱에서 사용할 User 배열로 바꿉니다.
// [검증 경계] Zod는 응답 값의 모양만 검사합니다. HTTP 성공, 시간 초과, 취소는 `src/api/users.ts`가 맡습니다.
// [라이브러리] TypeScript type은 실행할 때 사라지지만 Zod schema는 앱 실행 중 실제 값을 검사합니다.
// 값이 규칙에 맞지 않으면 `ZodError`를 냅니다.

// ========================================== 외부 의존성 ==========================================

import { z } from "zod";

import type { User } from "@/src/types/user";

// =================================================================================================

// ========================================= 사용자 schema =========================================

// id는 양의 정수여야 합니다. name과 email은 앞뒤 공백을 지운 뒤 빈 값과 잘못된 email 형식을 거부합니다.
export const jsonPlaceholderUserSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
});

// [라이브러리] `z.array`는 배열의 사용자 한 명 한 명에게 위 규칙을 적용합니다. 한 명이라도 틀리면 거부합니다.
export const jsonPlaceholderUsersSchema = z.array(
  jsonPlaceholderUserSchema,
);

// =================================================================================================

// ======================================= 사용자 응답 변환 ========================================

// [역할] `parseUsersResponse`는 외부 응답을 검사하고 화면에서 쓸 세 field만 가진 `User[]`로 바꿉니다.
// [문법] 입력 type을 `unknown`으로 두면 검사 전에는 `input.id`처럼 값을 바로 사용할 수 없습니다.
// 외부 응답을 실수로 믿고 쓰지 않게 하는 장치입니다.
export function parseUsersResponse(input: unknown): User[] {
  // [FLOW-07 / 4단계] 외부 값을 검사한 뒤 화면에서 쓰지 않는 필드는 버리고 id, name, email만 돌려줍니다.
  // [문법] `map` 안의 `{ id, name, email }`은 사용자 객체에서 세 값을 꺼냅니다.
  // 반환하는 `{ id, name, email }`은 같은 이름을 key와 값으로 쓰는 짧은 객체 문법입니다.
  // [역할] `map` callback은 검사를 마친 사용자 한 명에서 앱이 필요한 id, name, email만 골라냅니다.
  return jsonPlaceholderUsersSchema.parse(input).map(({ id, name, email }) => ({
    id,
    name,
    email,
  }));
}

// =================================================================================================
