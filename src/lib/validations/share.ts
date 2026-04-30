import { z } from "zod";

export const createShareLinkSchema = z
  .object({
    markup_id: z.string().uuid().nullable().optional(),
    folder_id: z.string().uuid().nullable().optional(),
    workspace_id: z.string().uuid().nullable().optional(),
    can_comment: z.boolean().optional(),
    expires_at: z.string().datetime().nullable().optional(),
  })
  .refine(
    (v) => Boolean(v.markup_id || v.folder_id || v.workspace_id),
    { message: "Specify markup_id, folder_id, or workspace_id" },
  );
export type CreateShareLinkInput = z.infer<typeof createShareLinkSchema>;

export const patchShareLinkSchema = z
  .object({
    is_active: z.boolean().optional(),
    can_comment: z.boolean().optional(),
    expires_at: z.string().datetime().nullable().optional(),
  })
  .strict();

export const inviteSchema = z.object({
  workspace_id: z.string().uuid(),
  emails: z
    .array(z.string().trim().toLowerCase().email())
    .min(1)
    .max(20),
  role: z.enum(["member", "guest"]).default("guest"),
  message: z.string().trim().max(500).optional(),
  /** Optional markup the invite is anchored to (used in the email copy + share link). */
  markup_id: z.string().uuid().nullable().optional(),
});
export type InviteInput = z.infer<typeof inviteSchema>;

export const guestIdentitySchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")),
});

export const guestThreadSchema = z.object({
  guest: guestIdentitySchema,
  x_position: z.number().min(0).max(100),
  y_position: z.number().min(0).max(100),
  page_number: z.number().int().positive().nullable().optional(),
  content: z.string().trim().min(1).max(4000),
});

export const guestMessageSchema = z.object({
  guest: guestIdentitySchema,
  thread_id: z.string().uuid(),
  content: z.string().trim().min(1).max(4000),
  parent_message_id: z.string().uuid().nullable().optional(),
});
