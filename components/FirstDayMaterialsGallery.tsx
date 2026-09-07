"use client";
// components/FirstDayMaterialsGallery.tsx — Gallery of generated First-Day materials,
// shared by both categories (Teacher Introduction & Classroom Expectations)

import { useState } from "react";
import { BookOpen, Globe, Film, Trash2, Play, Sparkles, PlusCircle, Pencil } from "lucide-react";
import { clsx } from "clsx";
import type { FirstDayMaterial } from "@/types/iep";
import { deleteFirstDayMaterial } from "@/lib/firstDayMaterials";

interface Props {
  accent: "amber" | "teal" | "pink" | "indigo" | "violet";
  icon: any;
  heading: string;
  subtitle: string;
  hasProfile: boolean;
  emptyProfileTitle: string;
  emptyProfileBody: string;
  materials: FirstDayMaterial[];
  onOpenMaterial: (material: FirstDayMaterial) => void;
  onOpenGenerator: () => void;
  onEditProfile: () => void;
  onMaterialDeleted: () => void;
}

const FORMAT_CONFIG = {
  slide_deck: { label: "Slide Deck", icon: BookOpen, color: "bg-blue-100 text-blue-800 border-blue-200" },
  html_page: { label: "Webpage", icon: Globe, color: "bg-teal-100 text-teal-800 border-teal-200" },
  video_clip: { label: "Video Storyboard", icon: Film, color: "bg-violet-100 text-violet-800 border-violet-200" },
};

const ACCENT_CLASSES = {
  amber: {
    icon: "text-amber-600",
    button: "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20",
    hoverBorder: "hover:border-amber-300",
    hoverText: "group-hover:text-amber-600",
    openText: "text-amber-600",
    openFill: "fill-amber-600",
    emptyIconBg: "bg-amber-50 text-amber-500",
  },
  teal: {
    icon: "text-teal-600",
    button: "bg-teal-600 hover:bg-teal-700 shadow-teal-600/20",
    hoverBorder: "hover:border-teal-300",
    hoverText: "group-hover:text-teal-600",
    openText: "text-teal-600",
    openFill: "fill-teal-600",
    emptyIconBg: "bg-teal-50 text-teal-500",
  },
  pink: {
    icon: "text-pink-600",
    button: "bg-pink-600 hover:bg-pink-700 shadow-pink-600/20",
    hoverBorder: "hover:border-pink-300",
    hoverText: "group-hover:text-pink-600",
    openText: "text-pink-600",
    openFill: "fill-pink-600",
    emptyIconBg: "bg-pink-50 text-pink-500",
  },
  indigo: {
    icon: "text-indigo-600",
    button: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20",
    hoverBorder: "hover:border-indigo-300",
    hoverText: "group-hover:text-indigo-600",
    openText: "text-indigo-600",
    openFill: "fill-indigo-600",
    emptyIconBg: "bg-indigo-50 text-indigo-500",
  },
  violet: {
    icon: "text-violet-600",
    button: "bg-violet-600 hover:bg-violet-700 shadow-violet-600/20",
    hoverBorder: "hover:border-violet-300",
    hoverText: "group-hover:text-violet-600",
    openText: "text-violet-600",
    openFill: "fill-violet-600",
    emptyIconBg: "bg-violet-50 text-violet-500",
  },
};

export default function FirstDayMaterialsGallery({
  accent,
  icon: HeaderIcon,
  heading,
  subtitle,
  hasProfile,
  emptyProfileTitle,
  emptyProfileBody,
  materials,
  onOpenMaterial,
  onOpenGenerator,
  onEditProfile,
  onMaterialDeleted
}: Props) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const a = ACCENT_CLASSES[accent];

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this material?")) return;
    setIsDeleting(id);
    try {
      await deleteFirstDayMaterial(id);
      onMaterialDeleted();
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HeaderIcon className={clsx("w-5 h-5", a.icon)} />
            <h3 className="text-base font-bold text-gray-900">{heading}</h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onEditProfile}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-700 text-xs font-bold"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>{hasProfile ? "Edit Details" : "Set Up"}</span>
          </button>
          {hasProfile && (
            <button
              onClick={onOpenGenerator}
              className={clsx("flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white text-xs font-bold shadow-md active:scale-95 transition-all", a.button)}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Material</span>
            </button>
          )}
        </div>
      </div>

      {/* Empty States */}
      {!hasProfile ? (
        <div className="py-10 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center", a.emptyIconBg)}>
            <HeaderIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">{emptyProfileTitle}</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">{emptyProfileBody}</p>
          </div>
          <button
            onClick={onEditProfile}
            className={clsx("flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-xl shadow-sm", a.button)}
          >
            <Pencil className="w-4 h-4" /> Set Up Now
          </button>
        </div>
      ) : materials.length === 0 ? (
        <div className="py-10 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center", a.emptyIconBg)}>
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">No materials yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Generate a slide deck, webpage, or video for the first day of class.
            </p>
          </div>
          <button
            onClick={onOpenGenerator}
            className={clsx("flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-xl shadow-sm", a.button)}
          >
            <PlusCircle className="w-4 h-4" /> Generate First Material
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map((mat) => {
            const cfg = FORMAT_CONFIG[mat.format] || FORMAT_CONFIG.slide_deck;
            const Icon = cfg.icon;
            const isDel = isDeleting === mat.id;
            return (
              <div
                key={mat.id}
                onClick={() => onOpenMaterial(mat)}
                className={clsx(
                  "group relative bg-slate-50 hover:bg-white border border-gray-200 hover:shadow-lg rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between",
                  a.hoverBorder
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={clsx("px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border", cfg.color)}>
                      <Icon className="w-3.5 h-3.5" />
                      {cfg.label}
                    </span>
                    <button
                      onClick={(e) => handleDelete(mat.id, e)}
                      disabled={isDel}
                      className="text-gray-300 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete material"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h4 className={clsx("text-sm font-bold text-gray-900 transition-colors leading-snug line-clamp-2", a.hoverText)}>
                    {mat.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{mat.description}</p>
                  {mat.status === "error" && (
                    <p className="text-[11px] text-red-500 mt-1.5 font-semibold">Generation failed</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-400">
                    {new Date(mat.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <span className={clsx("inline-flex items-center gap-1 text-xs font-bold group-hover:translate-x-0.5 transition-transform", a.openText)}>
                    <Play className={clsx("w-3.5 h-3.5", a.openFill)} /> Open
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
