import { z } from "zod";

export const urlMarkupSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Paste a URL")
    .refine(
      (v) => {
        try {
          const u = new URL(v.startsWith("http") ? v : `https://${v}`);
          return u.protocol === "http:" || u.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Enter a valid URL" },
    ),
  title: z.string().trim().max(120).optional(),
});
export type UrlMarkupInput = z.infer<typeof urlMarkupSchema>;

export const renameMarkupSchema = z.object({
  title: z.string().trim().min(1, "Title required").max(120),
});

export const createFolderSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(80),
  parent_id: z.string().uuid().nullable().optional(),
});
