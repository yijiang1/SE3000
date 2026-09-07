// lib/planning/extractDocumentText.ts — client-side document text extraction
//
// The Planning Assistant lets a teacher upload existing present-level paperwork
// (progress reports, prior IEPs, assessment printouts). We extract the text
// **in the browser** — nothing is uploaded anywhere — and drop it into the
// present-level notes field for the teacher to review before analysis. This
// keeps the same trust boundary as typing the data by hand.
//
// Supported: .txt / .md / .csv / .tsv (native), .docx (mammoth), .pdf (pdf.js).

export type ExtractionMethod = "plain-text" | "pdf" | "docx";

export interface ExtractResult {
  text: string;
  chars: number;
  method: ExtractionMethod;
  pages?: number;
  warning?: string;
}

const PLAIN_TEXT_EXT = /\.(txt|md|markdown|csv|tsv|text|log)$/i;
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Collapse runs of whitespace/newlines left behind by extractors. */
function tidy(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractDocx(file: File): Promise<ExtractResult> {
  const mod: any = await import("mammoth/mammoth.browser");
  const mammoth = mod?.default ?? mod;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = tidy(result?.value ?? "");
  const noteCount = Array.isArray(result?.messages) ? result.messages.length : 0;
  return {
    text,
    chars: text.length,
    method: "docx",
    warning: noteCount > 0 ? `${noteCount} formatting note(s) ignored during extraction` : undefined,
  };
}

async function extractPdf(file: File): Promise<ExtractResult> {
  const pdfjs: any = await import("pdfjs-dist");
  // Worker is copied into /public by the `sync-pdf-worker` npm script.
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data, isEvalSupported: false }).promise;

  const pageTexts: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const line = content.items
      .map((it: any) => (typeof it?.str === "string" ? it.str : ""))
      .join(" ");
    pageTexts.push(line);
  }
  await doc.cleanup?.();

  const text = tidy(pageTexts.join("\n\n"));
  return {
    text,
    chars: text.length,
    method: "pdf",
    pages: doc.numPages,
    warning: text.length === 0 ? "No selectable text found — the PDF may be scanned images" : undefined,
  };
}

export async function extractDocumentText(file: File): Promise<ExtractResult> {
  const name = (file.name || "document").toLowerCase();

  if (PLAIN_TEXT_EXT.test(name) || file.type.startsWith("text/")) {
    const text = tidy(await file.text());
    return { text, chars: text.length, method: "plain-text" };
  }

  if (name.endsWith(".docx") || file.type === DOCX_MIME) {
    return extractDocx(file);
  }

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    return extractPdf(file);
  }

  if (name.endsWith(".doc")) {
    throw new Error("Legacy .doc files aren't supported — save as .docx or paste the text.");
  }

  // Last resort: try to read it as text.
  const text = tidy(await file.text());
  return {
    text,
    chars: text.length,
    method: "plain-text",
    warning: `Unrecognized file type "${file.type || "unknown"}" — read as plain text`,
  };
}
