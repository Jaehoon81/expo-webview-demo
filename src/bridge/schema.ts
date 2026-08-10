import { z } from "zod";

const envelope = {
  uuid: z.string(),
};

const noParamsSchema = z.undefined().optional();

export const bridgeRequestSchema = z.discriminatedUnion("action", [
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
  return bridgeRequestSchema.parse(JSON.parse(message));
}

export function readBridgeEnvelope(message: string): {
  uuid: string;
  action: string;
} {
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
    // The dispatcher returns the common error envelope below.
  }

  return {
    uuid: "unknown",
    action: "unknown",
  };
}
