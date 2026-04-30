import { z } from "zod";

/**
 * Normalize URL input: strip duplicated protocol prefixes (e.g. user types
 * "https://example.com" then auto-completion adds "https://" again), lower
 * the host, drop trailing slashes. Returns null if the input can't be made
 * into a usable http(s) URL.
 */
export function normalizeUrl(raw: string): string | null {
  let value = raw.trim();
  if (!value) return null;
  // Collapse repeated `https://` / `http://` prefixes.
  value = value.replace(/^(https?:\/\/)+/i, "");
  // Drop accidental trailing letters/numbers from host garbling — leave to
  // URL constructor below. (e.g. user types "gowithepic.comn" — we let URL
  // parse it; if invalid, return null.)
  const candidate = `https://${value}`;
  try {
    const u = new URL(candidate);
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (!u.hostname || !u.hostname.includes(".")) return null;
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export const urlMarkupSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "Paste a URL")
    .refine((v) => normalizeUrl(v) !== null, {
      message: "Enter a valid URL",
    }),
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
