import { z } from "zod";

export const createThreadSchema = z
  .object({
    markup_id: z.string().uuid(),
    markup_version_id: z.string().uuid().nullable().optional(),
    x_position: z.number().min(0).max(100),
    y_position: z.number().min(0).max(100),
    page_number: z.number().int().positive().nullable().optional(),
    device_type: z.enum(["desktop", "tablet", "mobile"]).nullable().optional(),
    priority: z.enum(["none", "low", "medium", "high"]).optional(),
    /** First message body. */
    content: z.string().trim().min(1).max(4000),
    /** Optional file attachments stored elsewhere (Phase 5b: attachment upload). */
    attachments: z
      .array(
        z.object({
          url: z.string().min(1),
          filename: z.string().min(1).max(200),
          size: z.number().int().positive(),
          mime_type: z.string().min(1).max(120),
        }),
      )
      .max(10)
      .optional(),
    mentions: z.array(z.string().uuid()).max(20).optional(),
  })
  .strict();
export type CreateThreadInput = z.infer<typeof createThreadSchema>;

export const patchThreadSchema = z
  .object({
    status: z.enum(["open", "resolved"]).optional(),
    priority: z.enum(["none", "low", "medium", "high"]).optional(),
  })
  .strict();

export const createMessageSchema = z
  .object({
    content: z.string().trim().min(1).max(4000),
    parent_message_id: z.string().uuid().nullable().optional(),
    attachments: z
      .array(
        z.object({
          url: z.string().min(1),
          filename: z.string().min(1).max(200),
          size: z.number().int().positive(),
          mime_type: z.string().min(1).max(120),
        }),
      )
      .max(10)
      .optional(),
    mentions: z.array(z.string().uuid()).max(20).optional(),
  })
  .strict();
export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export const patchMessageSchema = z
  .object({
    content: z.string().trim().min(1).max(4000),
  })
  .strict();
