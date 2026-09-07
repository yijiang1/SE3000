"use client";
// components/FirstDayGeneratorModal.tsx — Format picker & generator, shared by all
// First-Day Materials categories (Teacher Introduction, Classroom Expectations,
// Icebreaker Activities, Family Welcome Letter & Getting-to-Know-You Survey)

import { useState, useEffect } from "react";
import {
  Sparkles,
  BookOpen,
  Globe,
  Film,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  GitCompare
} from "lucide-react";
import { clsx } from "clsx";
import type {
  TeacherProfile,
  ClassroomProfile,
  IcebreakerProfile,
  SurveyProfile,
  FirstDayMaterialCategory,
  FirstDayMaterialFormat,
  FirstDayMaterial
} from "@/types/iep";
import {
  generateAndSaveFirstDayMaterial,
  generateFirstDayMaterialVariants,
  type FamilyLetterSubject
} from "@/lib/firstDayMaterials";
import { TEXT_PROVIDER_LABELS, type TextProviderId } from "@/lib/ai/providers";

type FirstDaySubject = TeacherProfile | ClassroomProfile | IcebreakerProfile | SurveyProfile | FamilyLetterSubject;

interface Props {
  category: FirstDayMaterialCategory;
  subject: FirstDaySubject;
  onClose: () => void;
  onMaterialCreated: (material: FirstDayMaterial) => void;
  onVariantsCreated: (materials: FirstDayMaterial[]) => void;
}

type Accent = "amber" | "teal" | "pink" | "indigo" | "violet";

interface CategoryMeta {
  accent: Accent;
  headerTitle: string;
  headerGradient: string;
  webpageLabel: string;
  placeholderInstructions: string;
  formats: FirstDayMaterialFormat[];
  subtitle: (subject: FirstDaySubject) => string;
  formatDescription: (format: FirstDayMaterialFormat) => string;
}

const ACCENT_STYLES: Record<Accent, {
  badgeBg: string;
  headerText: string;
  selectedBorder: string;
  selectedBg: string;
  selectedRing: string;
  iconText: string;
  buttonGradient: string;
  buttonShadow: string;
}> = {
  amber: {
    badgeBg: "bg-amber-500/20 border-amber-400/30 text-amber-300",
    headerText: "text-amber-200",
    selectedBorder: "border-amber-500",
    selectedBg: "bg-amber-50/70",
    selectedRing: "ring-amber-100",
    iconText: "text-amber-600",
    buttonGradient: "from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500",
    buttonShadow: "shadow-amber-500/20",
  },
  teal: {
    badgeBg: "bg-teal-500/20 border-teal-400/30 text-teal-300",
    headerText: "text-teal-200",
    selectedBorder: "border-teal-500",
    selectedBg: "bg-teal-50/70",
    selectedRing: "ring-teal-100",
    iconText: "text-teal-600",
    buttonGradient: "from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500",
    buttonShadow: "shadow-teal-500/20",
  },
  pink: {
    badgeBg: "bg-pink-500/20 border-pink-400/30 text-pink-300",
    headerText: "text-pink-200",
    selectedBorder: "border-pink-500",
    selectedBg: "bg-pink-50/70",
    selectedRing: "ring-pink-100",
    iconText: "text-pink-600",
    buttonGradient: "from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500",
    buttonShadow: "shadow-pink-500/20",
  },
  indigo: {
    badgeBg: "bg-indigo-500/20 border-indigo-400/30 text-indigo-300",
    headerText: "text-indigo-200",
    selectedBorder: "border-indigo-500",
    selectedBg: "bg-indigo-50/70",
    selectedRing: "ring-indigo-100",
    iconText: "text-indigo-600",
    buttonGradient: "from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500",
    buttonShadow: "shadow-indigo-500/20",
  },
  violet: {
    badgeBg: "bg-violet-500/20 border-violet-400/30 text-violet-300",
    headerText: "text-violet-200",
    selectedBorder: "border-violet-500",
    selectedBg: "bg-violet-50/70",
    selectedRing: "ring-violet-100",
    iconText: "text-violet-600",
    buttonGradient: "from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500",
    buttonShadow: "shadow-violet-500/20",
  },
};

const CATEGORY_META: Record<FirstDayMaterialCategory, CategoryMeta> = {
  teacher_intro: {
    accent: "amber",
    headerTitle: "Create Your Intro Material",
    headerGradient: "from-slate-900 to-amber-950",
    webpageLabel: "About-Me Webpage",
    placeholderInstructions: "e.g. Mention that I'm new to the school, keep it playful and short...",
    formats: ["slide_deck", "html_page", "video_clip"],
    subtitle: (s) => `${(s as TeacherProfile).name} · ${(s as TeacherProfile).roleTitle}`,
    formatDescription: (format) => {
      if (format === "slide_deck") return "A 5-slide first-day intro deck to present live, with a fun interactive question.";
      if (format === "html_page") return "A shareable standalone webpage with your bio, hobbies, and fun facts — great for a class site.";
      return "A short animated storyboard script introducing you, with narration cues.";
    },
  },
  classroom_expectations: {
    accent: "teal",
    headerTitle: "Create a Classroom Expectations Material",
    headerGradient: "from-slate-900 to-teal-950",
    webpageLabel: "Classroom Webpage",
    placeholderInstructions: "e.g. Keep the tone extra encouraging, mention our calm-down corner...",
    formats: ["slide_deck", "html_page", "video_clip"],
    subtitle: (s) => {
      const c = s as ClassroomProfile;
      return `${c.classroomName || "Your Classroom"}${c.theme ? ` · ${c.theme}` : ""}`;
    },
    formatDescription: (format) => {
      if (format === "slide_deck") return "A 5-slide walkthrough of your rules & routines, with a friendly interactive check.";
      if (format === "html_page") return "A shareable standalone webpage laying out your classroom rules, routines, and rewards system.";
      return "A short animated storyboard script walking through classroom expectations.";
    },
  },
  icebreaker_activities: {
    accent: "pink",
    headerTitle: "Create an Icebreaker Activity Material",
    headerGradient: "from-slate-900 to-pink-950",
    webpageLabel: "Activities Webpage",
    placeholderInstructions: "e.g. Include one quiet, low-sensory option, keep instructions very short...",
    formats: ["slide_deck", "html_page", "video_clip"],
    subtitle: (s) => {
      const i = s as IcebreakerProfile;
      return `${i.theme || "Get to Know Each Other"} · ${i.groupSize}`;
    },
    formatDescription: (format) => {
      if (format === "slide_deck") return "A 5-slide deck walking the class through a few fun get-to-know-you activities.";
      if (format === "html_page") return "A shareable standalone webpage listing activity instructions, great for handouts.";
      return "A short animated storyboard script previewing an icebreaker activity.";
    },
  },
  family_letter: {
    accent: "indigo",
    headerTitle: "Create a Family Welcome Letter",
    headerGradient: "from-slate-900 to-indigo-950",
    webpageLabel: "Welcome Letter Webpage",
    placeholderInstructions: "e.g. Mention we're a new classroom this year, keep the tone extra reassuring...",
    formats: ["html_page", "video_clip"],
    subtitle: (s) => {
      const { teacher, classroom } = s as FamilyLetterSubject;
      return `${teacher.name}${classroom?.classroomName ? ` · ${classroom.classroomName}` : ""}`;
    },
    formatDescription: (format) => {
      if (format === "html_page") return "A printable welcome letter combining your bio and classroom expectations for families.";
      return "A short, warm welcome video message script for families.";
    },
  },
  getting_to_know_you: {
    accent: "violet",
    headerTitle: "Create a Getting-to-Know-You Survey",
    headerGradient: "from-slate-900 to-violet-950",
    webpageLabel: "Printable Questionnaire",
    placeholderInstructions: "e.g. Add a drawing box under each question for younger students...",
    formats: ["html_page", "slide_deck"],
    subtitle: (s) => (s as SurveyProfile).title || "All About Me!",
    formatDescription: (format) => {
      if (format === "html_page") return "A printable questionnaire with a blank line under each question for students to fill out.";
      return "A slide per question for a live, verbal share-aloud getting-to-know-you activity.";
    },
  },
};

const FORMAT_ICONS: Record<FirstDayMaterialFormat, any> = {
  slide_deck: BookOpen,
  html_page: Globe,
  video_clip: Film,
};

const FORMAT_BADGES: Record<FirstDayMaterialFormat, string> = {
  slide_deck: "Gemini 2.5 Flash",
  html_page: "Gemini 2.5 Flash",
  video_clip: "Veo 3.1",
};

const FORMAT_COSTS: Record<FirstDayMaterialFormat, string> = {
  slide_deck: "~$0.015",
  html_page: "~$0.012",
  video_clip: "~$0.40",
};

export default function FirstDayGeneratorModal({ category, subject, onClose, onMaterialCreated, onVariantsCreated }: Props) {
  const meta = CATEGORY_META[category];
  const styles = ACCENT_STYLES[meta.accent];

  const [selectedFormat, setSelectedFormat] = useState<FirstDayMaterialFormat>(meta.formats[0]);
  const [customInstructions, setCustomInstructions] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [configuredTextProviders, setConfiguredTextProviders] = useState<TextProviderId[]>([]);
  const [compareMode, setCompareMode] = useState(false);

  useEffect(() => {
    fetch("/api/config/status")
      .then((r) => r.json())
      .then((status) =>
        setConfiguredTextProviders(
          Object.entries(status.text || {})
            .filter(([, ok]) => ok)
            .map(([id]) => id as TextProviderId)
        )
      )
      .catch(() => setConfiguredTextProviders([]));
  }, []);

  const canCompare = configuredTextProviders.length >= 2;

  async function handleGenerate() {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      if (compareMode && canCompare) {
        const results = await generateFirstDayMaterialVariants(category, subject, selectedFormat, configuredTextProviders, {
          customPrompt: customInstructions || undefined,
        });
        onVariantsCreated(results);
      } else {
        const result = await generateAndSaveFirstDayMaterial(category, subject, selectedFormat, {
          customPrompt: customInstructions || undefined,
        });
        onMaterialCreated(result);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={clsx("flex items-center justify-between px-6 py-5 border-b border-gray-200 text-white bg-gradient-to-r", meta.headerGradient)}>
          <div className="flex items-center gap-3">
            <div className={clsx("w-10 h-10 rounded-2xl border flex items-center justify-center", styles.badgeBg)}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">{meta.headerTitle}</h2>
              <p className={clsx("text-xs mt-0.5", styles.headerText)}>
                For <strong className="text-white">{meta.subtitle(subject)}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">Choose a Format:</label>
            <div className="grid grid-cols-1 gap-3">
              {meta.formats.map((format) => {
                const isSelected = selectedFormat === format;
                const Icon = FORMAT_ICONS[format];
                const title = format === "html_page" ? meta.webpageLabel : format === "slide_deck" ? "Slide Deck (PPT-style)" : "Animated Video Storyboard";
                return (
                  <button
                    key={format}
                    type="button"
                    onClick={() => setSelectedFormat(format)}
                    className={clsx(
                      "p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3",
                      isSelected ? clsx(styles.selectedBorder, styles.selectedBg, "shadow-md ring-4", styles.selectedRing) : "border-gray-200 bg-white hover:border-gray-300 hover:bg-slate-50"
                    )}
                  >
                    <div className={clsx("p-2.5 rounded-xl bg-white shadow-sm border border-gray-100 shrink-0", styles.iconText)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-gray-900">{title}</h4>
                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{FORMAT_COSTS[format]}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{meta.formatDescription(format)}</p>
                      <span className="text-[11px] text-gray-400 mt-1 inline-block">{FORMAT_BADGES[format]}</span>
                    </div>
                    {isSelected && <CheckCircle2 className={clsx("w-4 h-4 shrink-0 mt-1", styles.iconText)} />}
                  </button>
                );
              })}
            </div>
          </div>

          {canCompare && (
            <label className="flex items-start gap-3 p-4 rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 cursor-pointer">
              <input
                type="checkbox"
                checked={compareMode}
                onChange={(e) => setCompareMode(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-indigo-600"
              />
              <span>
                <span className="flex items-center gap-1.5 text-sm font-bold text-indigo-900">
                  <GitCompare className="w-4 h-4" /> Compare {configuredTextProviders.length} providers instead of one
                </span>
                <span className="block text-xs text-indigo-700 mt-0.5">
                  Generates this material once with each of{" "}
                  {configuredTextProviders.map((id) => TEXT_PROVIDER_LABELS[id]).join(", ")}, so you can view all
                  versions and keep the one you like best.
                </span>
              </span>
            </label>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Custom Instructions (Optional):
            </label>
            <input
              type="text"
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder={meta.placeholderInstructions}
              className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900">
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={clsx(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-bold text-sm shadow-lg active:scale-95 transition-all disabled:opacity-60 bg-gradient-to-r",
              styles.buttonGradient,
              styles.buttonShadow
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating{compareMode && canCompare ? ` (${configuredTextProviders.length} versions)` : ""}…</span>
              </>
            ) : compareMode && canCompare ? (
              <>
                <GitCompare className="w-4 h-4" />
                <span>Generate {configuredTextProviders.length} Versions to Compare</span>
                <ArrowRight className="w-4 h-4" />
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
