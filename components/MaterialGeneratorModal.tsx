"use client";
// components/MaterialGeneratorModal.tsx — Unified AI Materials Hub modal

import { useState } from "react";
import {
  Sparkles,
  BookOpen,
  Dices,
  Gamepad2,
  Music,
  Volume2,
  Film,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight
} from "lucide-react";
import { clsx } from "clsx";
import type {
  StudentIEPProfile,
  IEPGoal,
  ProgressLogEntry,
  MaterialType,
  GeneratedMaterial,
  MiniGameEngineType
} from "@/types/iep";
import { generateAndSaveMaterial } from "@/lib/materials";

interface Props {
  profile: StudentIEPProfile;
  selectedGoal?: IEPGoal;
  allLogs: ProgressLogEntry[];
  onClose: () => void;
  onMaterialCreated: (material: GeneratedMaterial) => void;
}

interface FormatOption {
  type: MaterialType;
  title: string;
  badge: string;
  description: string;
  icon: any;
  color: string;
  model: string;
  cost: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    type: "slide_deck",
    title: "Instructional Slide Deck",
    badge: "Gemini 2.5 Flash + Imagen",
    description: "5–7 slide individualized lesson matched to reading level & student interests, with quiz checks.",
    icon: BookOpen,
    color: "from-blue-600 to-indigo-600 border-blue-200 text-blue-700",
    model: "gemini-2.5-flash",
    cost: "~$0.015",
  },
  {
    type: "board_game",
    title: "Printable Board Game & Cards",
    badge: "Gemini 2.5 Flash",
    description: "Thematic game board grid with start/finish, rest tiles, and 10–15 printable challenge cards.",
    icon: Dices,
    color: "from-purple-600 to-pink-600 border-purple-200 text-purple-700",
    model: "gemini-2.5-flash",
    cost: "~$0.02",
  },
  {
    type: "mini_game",
    title: "Interactive Browser Game",
    badge: "Gemini 2.5 Flash",
    description: "Playable matching, sorting, quiz, or sequencing game with reward celebration & IEP score logging.",
    icon: Gamepad2,
    color: "from-emerald-600 to-teal-600 border-emerald-200 text-emerald-700",
    model: "gemini-2.5-flash",
    cost: "~$0.01",
  },
  {
    type: "music",
    title: "Lyria 3 Music Track",
    badge: "DeepMind Lyria 3",
    description: "Mnemonic rhyming song, calming focus lo-fi, or reward celebration jingle tailored to the goal.",
    icon: Music,
    color: "from-amber-600 to-orange-600 border-amber-200 text-amber-700",
    model: "lyria-3-clip",
    cost: "~$0.04",
  },
  {
    type: "narration",
    title: "Read-Along Narration",
    badge: "OpenAI TTS-1",
    description: "Paced voiceover with word-by-word tracking, adjustable speed, and calming tone.",
    icon: Volume2,
    color: "from-rose-600 to-red-600 border-rose-200 text-rose-700",
    model: "tts-1",
    cost: "~$0.01",
  },
  {
    type: "video_clip",
    title: "Veo 3.1 Animated Storyboard",
    badge: "Google Veo 3.1",
    description: "Dynamic animated explainer scenes with synchronized narration cues and timeline.",
    icon: Film,
    color: "from-violet-600 to-indigo-700 border-violet-200 text-violet-700",
    model: "veo-3.1-fast",
    cost: "~$0.40",
  },
];

export default function MaterialGeneratorModal({
  profile,
  selectedGoal,
  allLogs,
  onClose,
  onMaterialCreated
}: Props) {
  const [activeGoalId, setActiveGoalId] = useState<string>(
    selectedGoal?.id || profile.goals[0]?.id || ""
  );
  const [selectedFormat, setSelectedFormat] = useState<MaterialType>("slide_deck");
  const [customInstructions, setCustomInstructions] = useState("");

  // Sub-options
  const [miniGameEngine, setMiniGameEngine] = useState<MiniGameEngineType>("matching");
  const [musicPurpose, setMusicPurpose] = useState<"mnemonic_song" | "calming_focus" | "reward_jingle" | "transition_cue">("mnemonic_song");
  const [narrationVoice, setNarrationVoice] = useState<"alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer">("nova");
  const [narrationSpeed, setNarrationSpeed] = useState(0.9);

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentGoal = profile.goals.find((g) => g.id === activeGoalId) || profile.goals[0];

  async function handleGenerate() {
    if (!currentGoal) {
      setErrorMessage("Please select a goal first.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const result = await generateAndSaveMaterial(
        profile,
        currentGoal,
        allLogs,
        selectedFormat,
        {
          customPrompt: customInstructions || undefined,
          miniGameEngine,
          musicPurpose,
          narrationVoice,
          narrationSpeed,
        }
      );

      onMaterialCreated(result);
    } catch (err: any) {
      setErrorMessage(err.message || "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* ─── Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">SE 3000 Materials Hub</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/30 text-indigo-200">
                  AI Generator
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Targeting Student: <strong className="text-white">{profile.studentInitials}</strong> (Grade {profile.grade}) • Themes:{" "}
                <span className="text-amber-300 font-semibold">{profile.learningProfile?.interests.slice(0, 2).join(", ")}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Body Area ──────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 p-6 sm:p-8 space-y-6">
          {/* Target Goal Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Select Target IEP Goal:
            </label>
            <select
              value={activeGoalId}
              onChange={(e) => setActiveGoalId(e.target.value)}
              className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {profile.goals.map((g, idx) => (
                <option key={g.id} value={g.id}>
                  Goal {idx + 1} ({g.category}): {g.goalText.slice(0, 90)}…
                </option>
              ))}
            </select>
            {currentGoal && (
              <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                🎯 <strong>Criteria:</strong> Baseline {currentGoal.baselineValue}{currentGoal.measurementUnit} → Target{" "}
                <strong>{currentGoal.targetValue}{currentGoal.measurementUnit}</strong>
              </p>
            )}
          </div>

          {/* Format Picker Grid */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
              Choose Output Format:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {FORMAT_OPTIONS.map((fmt) => {
                const isSelected = selectedFormat === fmt.type;
                const Icon = fmt.icon;
                return (
                  <button
                    key={fmt.type}
                    type="button"
                    onClick={() => setSelectedFormat(fmt.type)}
                    className={clsx(
                      "p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between min-h-[145px]",
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/70 shadow-md ring-4 ring-indigo-100"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-slate-50"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className={clsx("p-2 rounded-xl bg-white shadow-sm border border-gray-100", fmt.color)}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                          {fmt.cost}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 leading-tight">{fmt.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{fmt.description}</p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                      <span>{fmt.badge}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional Sub-Options */}
          {selectedFormat === "mini_game" && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <label className="block text-xs font-bold text-emerald-900 uppercase">
                Select Mini-Game Engine:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "matching", label: "Pair Matching" },
                  { id: "sorting", label: "Bucket Sorter" },
                  { id: "multiple_choice", label: "Quiz Challenge" },
                  { id: "sequencing", label: "Step Sequencer" }
                ].map((eng) => (
                  <button
                    key={eng.id}
                    type="button"
                    onClick={() => setMiniGameEngine(eng.id as any)}
                    className={clsx(
                      "p-2.5 rounded-xl text-xs font-bold transition-all border",
                      miniGameEngine === eng.id
                        ? "bg-emerald-600 text-white border-emerald-600 shadow"
                        : "bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-100"
                    )}
                  >
                    {eng.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedFormat === "music" && (
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
              <label className="block text-xs font-bold text-amber-900 uppercase">
                Lyria 3 Music Purpose:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "mnemonic_song", label: "Mnemonic Song" },
                  { id: "calming_focus", label: "Calming Focus Audio" },
                  { id: "reward_jingle", label: "Victory Jingle" },
                  { id: "transition_cue", label: "Transition Chime" }
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setMusicPurpose(p.id as any)}
                    className={clsx(
                      "p-2.5 rounded-xl text-xs font-bold transition-all border",
                      musicPurpose === p.id
                        ? "bg-amber-600 text-white border-amber-600 shadow"
                        : "bg-white text-amber-900 border-amber-200 hover:bg-amber-100"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedFormat === "narration" && (
            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-rose-900 mb-1">OpenAI Voice:</label>
                  <select
                    value={narrationVoice}
                    onChange={(e) => setNarrationVoice(e.target.value as any)}
                    className="w-full bg-white border border-rose-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800"
                  >
                    {["nova", "alloy", "echo", "fable", "onyx", "shimmer"].map((v) => (
                      <option key={v} value={v}>
                        Voice: {v.toUpperCase()} (Supportive & Clear)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-rose-900 mb-1">Speed Multiplier:</label>
                  <div className="flex gap-2">
                    {[0.75, 0.9, 1.0].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNarrationSpeed(s)}
                        className={clsx(
                          "flex-1 p-2 rounded-xl text-xs font-bold border",
                          narrationSpeed === s
                            ? "bg-rose-600 text-white border-rose-600"
                            : "bg-white text-rose-900 border-rose-200"
                        )}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Optional Teacher Custom Instructions */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Custom Teacher Instructions (Optional):
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Include 2 math word problems about T-Rex fossils, focus on 3-step directions..."
              className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* ─── Footer Controls ────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            Cancel
          </button>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-60"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating {selectedFormat.replace("_", " ")}…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Material</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
