// [파일 역할] WebView가 보낸 JSON 문자열을 8개 bridge action별 parameter 계약으로 runtime 검증합니다.
import { z } from "zod";

const envelope = {
  uuid: z.string(),
};

const noParamsSchema = z.undefined().optional();

export const bridgeRequestSchema = z.discriminatedUnion("action", [
  // action이 판별 property이므로 parse 성공 뒤 switch 분기마다 params tuple 타입도 함께 좁혀집니다.
  z.strictObject({
    ...envelope,
    action: z.literal("getDeviceUUID"),
    params: noParamsSchema,
  }),
  z.strictObject({
    ...envelope,
    action: z.literal("showToastMessage"),
    params: z.tuple([z.string().min(1)]),
  }),
  z.strictObject({
    ...envelope,
    action: z.literal("showNotiMessage"),
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

export type BridgeRequest = z.infer<typeof bridgeRequestSchema>;

export function parseBridgeRequest(message: string): BridgeRequest {
  // [FLOW-05 / 4단계] JSON syntax와 Zod action/params 검증을 한 경계에서 수행하고 실패는 dispatcher가 공통 응답으로 바꿉니다.
  return bridgeRequestSchema.parse(JSON.parse(message));
}

export function readBridgeEnvelope(message: string): {
  uuid: string;
  action: string;
} {
  // schema가 거부한 요청도 가능한 경우 원래 uuid/action을 error response에 보존하기 위한 최소 파싱입니다.
  try {
    const value: unknown = JSON.parse(message);
    if (typeof value === "object" && value !== null) {
      const record = value as Record<string, unknown>;
      return {
        uuid: typeof record.uuid === "string" ? record.uuid : "unknown",
        action: typeof record.action === "string" ? record.action : "unknown",
      };
    }
  } catch {
    // JSON 자체가 깨졌으면 dispatcher가 아래 unknown envelope로 응답합니다.
  }

  return {
    uuid: "unknown",
    action: "unknown",
  };
}
