import { z } from "zod";

export const errorCodeValues = [
  "invalid_request",
  "run_not_found",
  "run_conflict",
  "run_failed",
  "tool_failed",
] as const;

export const errorCodeSchema = z.enum(errorCodeValues);

export const scenvaErrorSchema = z.object({
  code: errorCodeSchema,
  message: z.string().min(1),
  details: z.record(z.string(), z.unknown()).optional(),
});

export type ScenvaErrorCode = z.infer<typeof errorCodeSchema>;
export type ScenvaError = z.infer<typeof scenvaErrorSchema>;
