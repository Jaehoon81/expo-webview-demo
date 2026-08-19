// [파일 역할] WebView가 보낸 문자열을 JSON으로 읽고, action마다 필요한 값이 올바른지 검사합니다.
// [라이브러리] TypeScript type은 실행할 때 사라지지만 Zod는 들어온 값과 배열 길이를 앱 실행 중에 검사합니다.

// ========================================== 외부 의존성 ==========================================

import { z } from "zod";

// =================================================================================================

// ====================================== bridge 요청 schema =======================================

// [문법] 모든 요청에 필요한 uuid 규칙을 이 객체에 한 번 적고 각 schema에서 펼쳐 사용합니다.
const envelope = {
  uuid: z.string(),
};

// 추가 값이 필요 없는 action은 params가 없거나 `undefined`여야 합니다.
const noParamsSchema = z.undefined().optional();

// [라이브러리] `discriminatedUnion("action", ...)`은 먼저 action 값을 보고 검사할 요청 모양 하나를 고릅니다.
export const bridgeRequestSchema = z.discriminatedUnion("action", [
  // [문법] action 값으로 요청 종류를 나누므로 검사 뒤에는 각 action에 맞는 params type도 함께 정해집니다.
  // [라이브러리] `strictObject`는 아래에 적지 않은 key까지 거부합니다. 정하지 않은 입력을 몰래 허용하지 않습니다.
  z.strictObject({
    // [문법] `...envelope`는 위 객체의 uuid 규칙을 이 객체 안으로 복사합니다.
    ...envelope,
    action: z.literal("getDeviceUUID"),
    params: noParamsSchema,
  }),
  z.strictObject({
    ...envelope,
    action: z.literal("showToastMessage"),
    // [라이브러리] `z.tuple`은 배열의 길이와 순서를 정합니다. 첫 칸에는 비어 있지 않은 문자열 하나만 옵니다.
    params: z.tuple([z.string().min(1)]),
  }),
  z.strictObject({
    ...envelope,
    action: z.literal("showNotiMessage"),
    // 알림은 제목만 있거나 제목과 본문이 함께 있는 두 경우만 허용합니다.
    params: z.union([
      z.tuple([z.string().min(1)]),
      z.tuple([z.string().min(1), z.string()]),
    ]),
  }),
  z.strictObject({
    ...envelope,
    action: z.literal("reloadOtherTabs"),
    params: noParamsSchema,
  }),
  z.strictObject({
    ...envelope,
    action: z.literal("goToAnotherTab"),
    params: z.tuple([
      // tag는 `f0`~`f3` 중 하나여야 합니다. URL이 안전한지는 url-router가 다음 단계에서 확인합니다.
      z.enum(["f0", "f1", "f2", "f3"]),
      z.string().min(1),
    ]),
  }),
  z.strictObject({
    ...envelope,
    action: z.literal("showBottomNaviView"),
    params: noParamsSchema,
  }),
  z.strictObject({
    ...envelope,
    action: z.literal("hideBottomNaviView"),
    params: noParamsSchema,
  }),
  z.strictObject({
    ...envelope,
    action: z.literal("getPhotoImages"),
    params: noParamsSchema,
  }),
]);

// [문법] `z.infer<typeof bridgeRequestSchema>`는 위 Zod 규칙에서 TypeScript type을 자동으로 만듭니다.
// 같은 요청 모양을 Zod와 TypeScript에 두 번 적지 않아도 됩니다.
export type BridgeRequest = z.infer<typeof bridgeRequestSchema>;

// =================================================================================================

// ======================================= bridge 입력 함수 ========================================

// [역할] `parseBridgeRequest`는 WebView 문자열을 JSON으로 읽고 action별 규칙을 모두 통과한 요청만 돌려줍니다.
export function parseBridgeRequest(message: string): BridgeRequest {
  // [FLOW-05 / 8단계] dispatcher가 이 함수를 호출하면 JSON parse 뒤 strict Zod union으로 uuid·action·action별 params를 검사합니다.
  // 검사 전 값이 앱 기능으로 넘어가지 않게 한 줄에서 이어 처리합니다. 실패는 dispatcher가 공통 오류로 바꿉니다.
  return bridgeRequestSchema.parse(JSON.parse(message));
}

// 요청 검사가 실패해도 uuid와 action을 응답에 담기 위해 두 값만 읽는 함수입니다.
// [역할] `readBridgeEnvelope`는 잘못된 요청에서도 읽을 수 있는 uuid와 action만 안전하게 꺼냅니다.
export function readBridgeEnvelope(message: string): {
  uuid: string;
  action: string;
} {
  // 요청 전체가 틀렸더라도 읽을 수 있는 uuid와 action은 실패 응답에 그대로 넣습니다.
  try {
    // [문법] `unknown` 값은 검사 전에는 속성을 읽을 수 없습니다. 아래에서 객체이고 null이 아닌지 먼저 확인합니다.
    const value: unknown = JSON.parse(message);
    if (typeof value === "object" && value !== null) {
      // JSON 객체의 key를 문자열로 읽기 위해 `Record<string, unknown>`으로 표시합니다.
      // 각 값은 아직 믿지 않으므로 계속 `unknown`으로 둡니다.
      const record = value as Record<string, unknown>;
      return {
        // [문법] 삼항 연산자로 각 값이 문자열인지 따로 확인합니다. 아니면 `"unknown"`을 대신 넣습니다.
        uuid: typeof record.uuid === "string" ? record.uuid : "unknown",
        action: typeof record.action === "string" ? record.action : "unknown",
      };
    }
  } catch {
    // JSON 문법부터 틀렸다면 아래의 `"unknown"` 두 값을 사용합니다.
  }

  // JSON이나 객체를 읽지 못해도 항상 같은 두 key를 가진 결과를 돌려줍니다.
  return {
    uuid: "unknown",
    action: "unknown",
  };
}

// =================================================================================================
