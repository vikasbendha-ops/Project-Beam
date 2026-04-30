import { z } from "zod";

export const patchProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    avatar_url: z.string().url().nullable().optional(),
    timezone: z.string().min(1).max(80).optional(),
  })
  .strict();

export const patchWorkspaceSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    avatar_url: z.string().url().nullable().optional(),
  })
  .strict();

export const patchMemberSchema = z
  .object({
    role: z.enum(["owner", "member", "guest"]),
  })
  .strict();

export const patchPreferencesSchema = z
  .object({
    email_digest_frequency: z
      .enum(["off", "realtime", "daily", "weekly"])
      .optional(),
    markup_notifications_default: z
      .enum(["all", "mentions", "off"])
      .optional(),
    browser_push_enabled: z.boolean().optional(),
  })
  .strict();
