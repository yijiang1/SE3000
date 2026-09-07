"use client";
// components/materials/FirstDayWebpageViewer.tsx — Renders a generated First-Day webpage
// (Teacher Introduction or Classroom Expectations)

import { useMemo } from "react";
import { Globe, Printer, ExternalLink } from "lucide-react";
import type { FirstDayWebpageContent } from "@/types/iep";

interface Props {
  content: FirstDayWebpageContent;
  onClose?: () => void;
}

export default function FirstDayWebpageViewer({ content, onClose }: Props) {
  const srcDoc = useMemo(() => {
    return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>body{margin:0;padding:24px;background:#ffffff;font-family:ui-sans-serif,system-ui,sans-serif;}</style>
</head><body>${content.html}</body></html>`;
  }, [content.html]);

  function handleOpenInNewTab() {
    const blob = new Blob([srcDoc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <div className="bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-teal-600/30 border border-teal-500/40 flex items-center justify-center text-teal-300 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-500/20 text-teal-300 border border-teal-500/30">
              Webpage
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5 truncate">{content.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleOpenInNewTab}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
            title="Print"
          >
            <Printer className="w-4 h-4" />
          </button>
          {onClose && (
            <button onClick={onClose} className="ml-1 text-slate-400 hover:text-white text-lg px-2">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Rendered Webpage — sandboxed, no script execution since content is model-generated */}
      <div className="bg-white">
        <iframe
          title={content.title}
          srcDoc={srcDoc}
          sandbox=""
          className="w-full border-0"
          style={{ height: "70vh", minHeight: 420 }}
        />
      </div>
    </div>
  );
}
