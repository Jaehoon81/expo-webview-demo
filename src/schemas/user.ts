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
  return jsonPlaceholderUsersSchema.parse(input).map(({ id, name, email }) => ({
    id,
    name,
    email,
  }));
}
