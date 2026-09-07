import { generatedDocument } from "./safeHtml";
/** Print only this material in a script-disabled document, without dashboard records. */
export function printHtml(html: string, appStyles = false): void {
  const frame = document.createElement("iframe");
  frame.setAttribute("sandbox", "allow-same-origin allow-modals");
  frame.title = "Print material";
  Object.assign(frame.style,{position:"fixed",width:"1px",height:"1px",left:"-10000px",top:"0"});
  let doc = generatedDocument(html);
  if (appStyles) {
    const styles = [...document.querySelectorAll('style,link[rel="stylesheet"]')].filter((el) => el.tagName === "STYLE" || new URL((el as HTMLLinkElement).href).origin === location.origin).map((el) => el.outerHTML).join("");
    doc = doc.replace("style-src 'unsafe-inline'", "style-src 'unsafe-inline' 'self'").replace("</head>", styles + "<style>@media print{*{max-height:none!important;overflow:visible!important}button,video,audio{display:none!important}body{background:white!important;color:black!important}.print-page{break-after:page}.print-page:last-child{break-after:auto}}</style></head>");
  }
  frame.onload=async()=>{
    try { await frame.contentDocument?.fonts.ready; frame.contentWindow?.focus(); frame.contentWindow?.print(); }
    finally { setTimeout(()=>frame.remove(),60_000); }
  };
  frame.srcdoc=doc;document.body.append(frame);
}
export function printMaterial(button: HTMLElement): void {
  const root=button.closest("[data-print-material]");
  if(root) printHtml(root.innerHTML,true);
}
