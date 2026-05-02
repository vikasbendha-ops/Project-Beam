import { z } from "zod";

export const createVersionSchema = z.object({
  /** Asset under the markup that this version belongs to. Optional for
   *  backward-compat — if omitted, the API picks the markup's primary
   *  (position 0) asset. */
  asset_id: z.string().uuid().optional(),
  storage_path: z.string().min(1).max(400),
  file_name: z.string().min(1).max(200),
  mime_type: z.string().min(1).max(120),
  file_size: z.number().int().positive(),
  page_count: z.number().int().positive().nullable().optional(),
});

export type CreateVersionInput = z.infer<typeof createVersionSchema>;
