"use client";
// components/planning/PresentLevelForm.tsx — Stage 1 input: enter or upload present-level data

import { useRef, useState } from "react";
import { Upload, Loader2, FileText, X } from "lucide-react";
import type { PresentLevelInput } from "@/types/iep";
import { extractDocumentText } from "@/lib/planning/extractDocumentText";

interface Props {
  value: PresentLevelInput;
  onChange: (next: PresentLevelInput) => void;
}

const FIELDS: { key: keyof PresentLevelInput; label: string; placeholder: string; rows?: number }[] = [
  { key: "currentAcademicSkills", label: "Current academic skills", placeholder: "What the student can do now in this subject…", rows: 2 },
  { key: "areasOfStrength", label: "Areas of strength", placeholder: "Verbal reasoning, number sense, persistence…", rows: 2 },
  { key: "areasOfWeakness", label: "Areas of weakness", placeholder: "Multi-step problems, decoding vowel teams, sustained attention…", rows: 2 },
  { key: "assessmentResults", label: "Assessment results", placeholder: "DIBELS 18th %ile ORF 42 wcpm; district math CBM 40% at grade 3 level…", rows: 2 },
  { key: "classroomPerformance", label: "Classroom performance", placeholder: "Completes ~50% of independent work; participates with prompting…", rows: 2 },
  { key: "previousGoalsAndProgress", label: "Previous IEP goals & progress", placeholder: "Prior goal + where progress stalled…", rows: 2 },
  { key: "teacherObservations", label: "Teacher observations", placeholder: "Anecdotal notes, patterns, what helps…", rows: 2 },
];

export default function PresentLevelForm({ value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [parseMsg, setParseMsg] = useState<string | null>(null);
  const [parseErr, setParseErr] = useState<string | null>(null);

  const set = (patch: Partial<PresentLevelInput>) => onChange({ ...value, ...patch });

  async function handleFile(file: File) {
    setParsing(true);
    setParseErr(null);
    setParseMsg(null);
    try {
      const result = await extractDocumentText(file);
      const prefix = value.rawNotes?.trim() ? value.rawNotes.trimEnd() + "\n\n" : "";
      set({ rawNotes: `${prefix}--- ${file.name} ---\n${result.text}` });
      setParseMsg(
        `Added ${result.chars.toLocaleString()} characters from ${file.name}` +
          (result.pages ? ` (${result.pages} pages)` : "") +
          (result.warning ? ` — ${result.warning}` : "")
      );
    } catch (e: any) {
      setParseErr(e?.message || "Could not read that file.");
    } finally {
      setParsing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Subject area <span className="text-red-500">*</span></label>
          <input
            value={value.subjectArea}
            onChange={(e) => set({ subjectArea: e.target.value })}
            placeholder="Mathematics"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Current grade level</label>
          <input
            value={value.currentGradeLevel}
            onChange={(e) => set({ currentGradeLevel: e.target.value })}
            placeholder="5th"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Current instructional level</label>
          <input
            value={value.currentInstructionalLevel}
            onChange={(e) => set({ currentInstructionalLevel: e.target.value })}
            placeholder="early 3rd grade computation"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
        </div>
      </div>

      {FIELDS.map((f) => (
        <div key={f.key}>
          <label className="block text-xs font-bold text-gray-700 mb-1">{f.label}</label>
          <textarea
            value={(value[f.key] as string) || ""}
            onChange={(e) => set({ [f.key]: e.target.value } as Partial<PresentLevelInput>)}
            rows={f.rows || 2}
            placeholder={f.placeholder}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
          />
        </div>
      ))}

      {/* Upload / paste */}
      <div className="rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/50 p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <label className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
            Paste notes or upload records (optional)
          </label>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={parsing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-indigo-300 text-indigo-700 text-xs font-bold hover:bg-indigo-100 disabled:opacity-60"
          >
            {parsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {parsing ? "Reading…" : "Upload .pdf / .docx / .txt"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.csv,.tsv,.pdf,.docx,text/plain,application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>
        <textarea
          value={value.rawNotes || ""}
          onChange={(e) => set({ rawNotes: e.target.value })}
          rows={4}
          placeholder="Paste an existing progress report, prior IEP present levels, or evaluation summary here. Uploaded files are read in your browser and appended below — nothing is sent anywhere until you run the analysis."
          className="w-full border border-indigo-200 rounded-xl px-3 py-2 text-xs text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
        />
        {parseMsg && (
          <p className="mt-1.5 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <FileText className="w-3 h-3" /> {parseMsg}
          </p>
        )}
        {parseErr && (
          <p className="mt-1.5 text-[11px] text-red-600 font-semibold flex items-center gap-1">
            <X className="w-3 h-3" /> {parseErr}
          </p>
        )}
      </div>
    </div>
  );
}
