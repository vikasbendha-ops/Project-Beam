/**
 * Centralised MIME-type classifier so upload routes, the new-markup modal,
 * and the canvas dispatcher all agree on what counts as an "image" vs
 * "pdf" vs "office doc" vs "text" file.
 *
 * The DB enum `markup_type` only knows about {image, pdf, website}; any
 * non-image upload is stored as `pdf` and the canvas picks the right
 * renderer at view time using `categoryFromMime()`.
 */

export const IMAGE_MIMES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
] as const;

export const OFFICE_MIMES = [
  // Microsoft Office Open XML (modern .docx / .xlsx / .pptx)
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Legacy binary Office (.doc / .xls / .ppt)
  "application/msword",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  // OpenDocument
  "application/vnd.oasis.opendocument.text",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.presentation",
] as const;

export const TEXT_MIMES = [
  "text/plain",
  "text/markdown",
  "text/csv",
] as const;

export const ACCEPTED_UPLOAD_MIMES = [
  ...IMAGE_MIMES,
  "application/pdf",
  ...OFFICE_MIMES,
  ...TEXT_MIMES,
] as const;

export type AcceptedMime = (typeof ACCEPTED_UPLOAD_MIMES)[number];

export type MimeCategory = "image" | "pdf" | "office" | "text" | "unknown";

export function categoryFromMime(mime: string | null | undefined): MimeCategory {
  if (!mime) return "unknown";
  const m = mime.toLowerCase();
  if (m.startsWith("image/")) return "image";
  if (m === "application/pdf") return "pdf";
  if ((OFFICE_MIMES as readonly string[]).includes(m)) return "office";
  if (m.startsWith("text/")) return "text";
  return "unknown";
}

/** Loose extension-based fallback for browsers that don't always set
 * `File.type` correctly (looking at you, .docx in some Linux variants). */
export function categoryFromName(name: string | null | undefined): MimeCategory {
  if (!name) return "unknown";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (
    ["docx", "doc", "xlsx", "xls", "pptx", "ppt", "odt", "ods", "odp"].includes(
      ext,
    )
  )
    return "office";
  if (["txt", "md", "markdown", "csv"].includes(ext)) return "text";
  return "unknown";
}

export function categoryFromFile(file: File): MimeCategory {
  const c = categoryFromMime(file.type);
  if (c !== "unknown") return c;
  return categoryFromName(file.name);
}

/** Bucket-storage `markup_type` value derived from a file's category. */
export function markupTypeForCategory(
  c: MimeCategory,
): "image" | "pdf" {
  return c === "image" ? "image" : "pdf";
}
