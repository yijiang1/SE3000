export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}
export function generatedDocument(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;padding:24px;font-family:system-ui;background:white;color:#172033}img{max-width:100%}@media print{body{padding:0}}</style></head><body>${html}</body></html>`;
}
/** The new tab remains a wrapper: untrusted markup never becomes its top-level document. */
export function sandboxedDocumentTab(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Material preview</title><style>html,body,iframe{margin:0;width:100%;height:100%;border:0}iframe{display:block}</style></head><body><iframe title="Generated material" sandbox="" srcdoc="${escapeHtml(generatedDocument(html))}"></iframe></body></html>`;
}
