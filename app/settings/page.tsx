"use client";
// app/settings/page.tsx — AI Provider Settings & Usage Tracking

import { useEffect, useState, useCallback } from "react";
import {
  Settings as SettingsIcon,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Trash2,
  BarChart3,
  Sparkles,
  Download,
  Database,
  CalendarClock,
  Plus
} from "lucide-react";
import {
  DEFAULT_TEXT_PROVIDER_ORDER,
  DEFAULT_TTS_PROVIDER_ORDER,
  DEFAULT_VIDEO_PROVIDER_ORDER,
  DEFAULT_MUSIC_PROVIDER_ORDER,
  TEXT_PROVIDER_LABELS,
  TTS_PROVIDER_LABELS,
  VIDEO_PROVIDER_LABELS,
  MUSIC_PROVIDER_LABELS,
  type TextProviderId,
  type TTSProviderId,
  type VideoProviderId,
  type MusicProviderId,
  type ProviderPreferences
} from "@/lib/ai/providers";
import { getAppSettings, saveProviderPreferences, saveClassPeriods, formatPeriodRange, DEFAULT_CLASS_PERIODS, type ClassPeriodDefinition } from "@/lib/settings";
import { getUsageSummary, getUsageLogs, clearUsageLogs, type UsageSummary } from "@/lib/usage";
import type { UsageLogEntry } from "@/types/iep";
import { useTeacherSession } from "@/components/TeacherAccess";

interface ConfigStatus {
  text: Record<TextProviderId, boolean>;
  tts: Record<TTSProviderId, boolean>;
  video: Record<VideoProviderId, boolean>;
  music: Record<MusicProviderId, boolean>;
}

function ProviderOrderList<T extends string>({
  title,
  description,
  order,
  labels,
  status,
  onChange,
}: {
  title: string;
  description: string;
  order: T[];
  labels: Record<T, string>;
  status: Record<T, boolean> | undefined;
  onChange: (next: T[]) => void;
}) {
  function move(idx: number, dir: -1 | 1) {
    const next = [...order];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3 shadow-2xs">
      <div>
        <h3 className="text-sm font-bold text-gray-900">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
      <div className="space-y-2">
        {order.map((id, idx) => {
          const configured = status?.[id];
          return (
            <div
              key={id}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full bg-slate-800 text-white text-[10px] font-bold">
                  {idx + 1}
                </span>
                <span className="text-sm font-semibold text-gray-800 truncate">{labels[id]}</span>
                {configured ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded-full shrink-0">
                    <XCircle className="w-3 h-3" /> No API key
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="p-1 rounded-lg bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up (higher priority)"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => move(idx, 1)}
                  disabled={idx === order.length - 1}
                  className="p-1 rounded-lg bg-white border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down (lower priority)"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { teacher: activeTeacher, exportVault, deleteWorkspace } = useTeacherSession();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [prefs, setPrefs] = useState<ProviderPreferences>({});
  const [classPeriods, setClassPeriods] = useState<ClassPeriodDefinition[]>(DEFAULT_CLASS_PERIODS);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [logs, setLogs] = useState<UsageLogEntry[]>([]);
  const [saveNote, setSaveNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [settings, statusRes, usageSummary, usageLogs] = await Promise.all([
      getAppSettings(),
      fetch("/api/config/status").then((r) => r.json()),
      getUsageSummary(),
      getUsageLogs(25),
    ]);
    setPrefs(settings.providerPreferences);
    setClassPeriods(settings.classPeriods?.length ? settings.classPeriods : DEFAULT_CLASS_PERIODS);
    setStatus(statusRes);
    setSummary(usageSummary);
    setLogs(usageLogs);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function updatePrefs(next: ProviderPreferences) {
    setPrefs(next);
    await saveProviderPreferences(next);
    setSaveNote("Saved");
    setTimeout(() => setSaveNote(null), 1500);
  }

  function updatePeriodField(index: number, field: keyof ClassPeriodDefinition, value: string) {
    setClassPeriods((current) => current.map((period, i) => (i === index ? { ...period, [field]: value } : period)));
  }

  async function persistClassPeriods(next: ClassPeriodDefinition[]) {
    setClassPeriods(next);
    await saveClassPeriods(next);
    setSaveNote("Saved");
    setTimeout(() => setSaveNote(null), 1500);
  }

  function addPeriod() {
    void persistClassPeriods([...classPeriods, { startTime: "", endTime: "" }]);
  }

  function removePeriod(index: number) {
    if (classPeriods.length <= 1) return;
    void persistClassPeriods(classPeriods.filter((_, i) => i !== index));
  }

  async function handleClearUsage() {
    await clearUsageLogs();
    const [usageSummary, usageLogs] = await Promise.all([getUsageSummary(), getUsageLogs(25)]);
    setSummary(usageSummary);
    setLogs(usageLogs);
  }

  async function handleVaultExport() {
    try {
      const exported = await exportVault();
      const url = URL.createObjectURL(new Blob([exported.data], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = exported.filename;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (cause) {
      window.alert(cause instanceof Error ? cause.message : "The encrypted vault could not be exported.");
    }
  }

  async function handleWorkspaceDelete() {
    const typed = window.prompt(
      `Permanently delete ${activeTeacher.name}'s workspace and all of its data? Type the teacher name to confirm.`
    );
    if (typed === null) return;
    if (typed !== activeTeacher.name) {
      window.alert("The teacher name did not match. Nothing was deleted.");
      return;
    }
    try {
      await deleteWorkspace();
    } catch (cause) {
      window.alert(cause instanceof Error ? cause.message : "The workspace could not be deleted.");
    }
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide text-indigo-200">Loading Settings…</p>
        </div>
      </div>
    );
  }

  const maxProviderCalls = Math.max(1, ...(summary?.byProvider.map((p) => p.calls) || [1]));
  const maxFeatureCalls = Math.max(1, ...(summary?.byFeature.map((f) => f.calls) || [1]));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <main className="mx-auto w-full space-y-8 px-4 py-6 sm:px-6 xl:px-8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight text-slate-900">AI Settings & Usage</h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Choose provider priority per capability and track generation cost
            </p>
          </div>
          {saveNote && (
            <span className="ml-auto text-xs font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {saveNote}
            </span>
          )}
        </div>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">AI Provider Priority</h2>
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            For each capability, SE 3000 tries providers top-to-bottom and uses the first one with a
            configured API key. Reorder to change priority — add keys in <code className="bg-gray-100 px-1 rounded">.env.local</code>{" "}
            to enable a provider.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ProviderOrderList<TextProviderId>
              title="Text Generation"
              description="Lesson content, IEP goals, worksheets, games, storyboard & lyric scripts"
              order={prefs.text?.length ? prefs.text : DEFAULT_TEXT_PROVIDER_ORDER}
              labels={TEXT_PROVIDER_LABELS}
              status={status?.text}
              onChange={(next) => updatePrefs({ ...prefs, text: next })}
            />
            <ProviderOrderList<TTSProviderId>
              title="Text-to-Speech Narration"
              description="Read-along voiceover audio"
              order={prefs.tts?.length ? prefs.tts : DEFAULT_TTS_PROVIDER_ORDER}
              labels={TTS_PROVIDER_LABELS}
              status={status?.tts}
              onChange={(next) => updatePrefs({ ...prefs, tts: next })}
            />
            <ProviderOrderList<VideoProviderId>
              title="Real Video Generation"
              description="Actual video clips from the animated storyboard (falls back to a script-only storyboard if unavailable)"
              order={prefs.video?.length ? prefs.video : DEFAULT_VIDEO_PROVIDER_ORDER}
              labels={VIDEO_PROVIDER_LABELS}
              status={status?.video}
              onChange={(next) => updatePrefs({ ...prefs, video: next })}
            />
            <ProviderOrderList<MusicProviderId>
              title="Real Music Generation"
              description="Actual sung audio tracks from the generated lyrics (falls back to lyrics-only if unavailable)"
              order={prefs.music?.length ? prefs.music : DEFAULT_MUSIC_PROVIDER_ORDER}
              labels={MUSIC_PROVIDER_LABELS}
              status={status?.music}
              onChange={(next) => updatePrefs({ ...prefs, music: next })}
            />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">Class Period Schedule</h2>
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            Shared bell schedule for all students&apos; class periods — used on student schedules and the Compare page.
          </p>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-2.5">
            {classPeriods.map((period, index) => (
              <div key={index} className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-3">
                <div className="w-24 shrink-0">
                  <div className="text-xs font-black uppercase tracking-wide text-indigo-700">Period {index + 1}</div>
                  {formatPeriodRange(period) && <div className="mt-1 text-[11px] font-semibold text-gray-500">{formatPeriodRange(period)}</div>}
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-gray-600">Start time</label>
                  <input
                    type="time"
                    value={period.startTime}
                    onChange={(e) => updatePeriodField(index, "startTime", e.target.value)}
                    onBlur={() => void persistClassPeriods(classPeriods)}
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-gray-600">End time</label>
                  <input
                    type="time"
                    value={period.endTime}
                    onChange={(e) => updatePeriodField(index, "endTime", e.target.value)}
                    onBlur={() => void persistClassPeriods(classPeriods)}
                    className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removePeriod(index)}
                  disabled={classPeriods.length <= 1}
                  title="Remove period"
                  className="ml-auto p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addPeriod}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
            >
              <Plus className="w-3.5 h-3.5" /> Add Period
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <h2 className="text-base font-bold text-gray-900">AI Usage & Estimated Cost</h2>
            </div>
            {logs.length > 0 && (
              <button
                onClick={handleClearUsage}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Log
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Generations</p>
              <p className="text-3xl font-black text-gray-900 mt-1">{summary?.totalCalls ?? 0}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Estimated Total Cost</p>
              <p className="text-3xl font-black text-gray-900 mt-1">
                ${(summary?.totalCostEstimate ?? 0).toFixed(3)}
              </p>
            </div>
          </div>

          {summary && summary.totalCalls > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-2.5 shadow-2xs">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">By Provider</h3>
                {summary.byProvider.map((p) => (
                  <div key={p.provider} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                      <span className="truncate">{p.provider}</span>
                      <span className="text-gray-500 shrink-0 ml-2">
                        {p.calls} call{p.calls !== 1 ? "s" : ""} · ${p.costEstimate.toFixed(3)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${(p.calls / maxProviderCalls) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-2.5 shadow-2xs">
                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide">By Feature</h3>
                {summary.byFeature.map((f) => (
                  <div key={f.feature} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                      <span className="truncate">{f.feature.replace(/_/g, " ")}</span>
                      <span className="text-gray-500 shrink-0 ml-2">
                        {f.calls} call{f.calls !== 1 ? "s" : ""} · ${f.costEstimate.toFixed(3)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${(f.calls / maxFeatureCalls) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {logs.length > 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-[10px] font-bold tracking-wide">
                    <tr>
                      <th className="text-left px-4 py-2.5">When</th>
                      <th className="text-left px-4 py-2.5">Feature</th>
                      <th className="text-left px-4 py-2.5">Provider</th>
                      <th className="text-left px-4 py-2.5">Model</th>
                      <th className="text-right px-4 py-2.5">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {logs.map((entry) => (
                      <tr key={entry.id}>
                        <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-gray-800 font-semibold capitalize whitespace-nowrap">
                          {entry.feature.replace(/_/g, " ")}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">
                          {entry.provider || "local (offline)"}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{entry.modelUsed}</td>
                        <td className="px-4 py-2.5 text-gray-800 text-right font-mono whitespace-nowrap">
                          ${entry.costEstimate.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center text-sm text-gray-500">
              No generations logged yet — usage will appear here after you generate a material.
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">Workspace Data</h2>
          </div>
          <p className="text-xs text-gray-500 -mt-2">
            Back up or permanently remove the encrypted workspace for <strong>{activeTeacher.name}</strong>.
          </p>

          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Export encrypted vault</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xl">
                Download a portable, password-protected copy of all students, goals, progress, materials, and settings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleVaultExport()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
            >
              <Download className="h-4 w-4" />
              Export Vault
            </button>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-bold text-rose-900">Delete workspace</h3>
              <p className="text-xs text-rose-700 mt-1 max-w-xl">
                Permanently delete this teacher workspace and all of its locally stored data. This cannot be undone.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleWorkspaceDelete()}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
            >
              <Trash2 className="h-4 w-4" />
              Delete Workspace
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
