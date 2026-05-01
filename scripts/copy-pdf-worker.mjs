import { copyFileSync, cpSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Resolve pdfjs-dist root via the worker file (handles pnpm symlinks).
const workerSrc = require.resolve("pdfjs-dist/build/pdf.worker.min.mjs");
const pkgRoot = dirname(dirname(workerSrc)); // .../pdfjs-dist
const publicDir = join(process.cwd(), "public");
const pdfjsDest = join(publicDir, "pdfjs");

if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
if (!existsSync(pdfjsDest)) mkdirSync(pdfjsDest, { recursive: true });

// 1. Worker (kept at /pdf.worker.min.mjs for backwards-compat).
copyFileSync(workerSrc, join(publicDir, "pdf.worker.min.mjs"));

// 2. cmaps + standard_fonts directories — pdf.js needs these to render
//    Asian text and the 14 PDF base fonts (ZapfDingbats etc). Without
//    them, getDocument logs "standardFontDataUrl is undefined" and many
//    PDFs render blank or with missing glyphs.
for (const dir of ["cmaps", "standard_fonts"]) {
  const src = join(pkgRoot, dir);
  const dest = join(pdfjsDest, dir);
  if (existsSync(src)) {
    cpSync(src, dest, { recursive: true });
  }
}

console.log(
  `[pdf-worker] worker + cmaps + standard_fonts → ${publicDir}/{pdf.worker.min.mjs, pdfjs/}`,
);
