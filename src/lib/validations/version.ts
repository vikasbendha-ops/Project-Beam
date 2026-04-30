import { z } from "zod";

export const createVersionSchema = z.object({
  storage_path: z.string().min(1).max(400),
  file_name: z.string().min(1).max(200),
  mime_type: z.string().min(1).max(120),
  file_size: z.number().int().positive(),
  page_count: z.number().int().positive().nullable().optional(),
});

export type CreateVersionInput = z.infer<typeof createVersionSchema>;
