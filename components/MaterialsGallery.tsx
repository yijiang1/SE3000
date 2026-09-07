"use client";
// components/MaterialsGallery.tsx — Student & Goal Materials Library

import { useState } from "react";
import {
  BookOpen,
  Dices,
  Gamepad2,
  Music,
  Volume2,
  Film,
  Trash2,
  Play,
  Sparkles,
  Filter,
  Layers,
  PlusCircle,
  ClipboardList
} from "lucide-react";
import { clsx } from "clsx";
import type { GeneratedMaterial, MaterialType, StudentIEPProfile, IEPGoal } from "@/types/iep";
import { deleteMaterial } from "@/lib/materials";

interface Props {
  profile: StudentIEPProfile;
  materials: GeneratedMaterial[];
  activeGoal?: IEPGoal;
  onOpenMaterial: (material: GeneratedMaterial) => void;
  onOpenGenerator: (goal?: IEPGoal) => void;
  onMaterialDeleted: () => void;
}

const TYPE_CONFIG = {
  slide_deck: { label: "Slide Deck", icon: BookOpen, color: "bg-blue-100 text-blue-800 border-blue-200" },
  board_game: { label: "Board Game", icon: Dices, color: "bg-purple-100 text-purple-800 border-purple-200" },
  mini_game: { label: "Mini-Game", icon: Gamepad2, color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  music: { label: "Music", icon: Music, color: "bg-amber-100 text-amber-800 border-amber-200" },
  narration: { label: "TTS Narration", icon: Volume2, color: "bg-rose-100 text-rose-800 border-rose-200" },
  video_clip: { label: "Video", icon: Film, color: "bg-violet-100 text-violet-800 border-violet-200" },
  worksheet: { label: "Worksheet", icon: ClipboardList, color: "bg-indigo-100 text-indigo-800 border-indigo-200" },
};

export default function MaterialsGallery({
  profile,
  materials,
  activeGoal,
  onOpenMaterial,
  onOpenGenerator,
  onMaterialDeleted
}: Props) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filtered = materials.filter((m) => {
    if (activeGoal && m.goalId !== activeGoal.id) return false;
    if (selectedFilter !== "all" && m.type !== selectedFilter) return false;
    return true;
  });

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this generated material?")) return;
    setIsDeleting(id);
    try {
      await deleteMaterial(id);
      onMaterialDeleted();
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setIsDeleting(null);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-gray-900">
              Generated Teaching Materials ({materials.length})
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Individualized curriculum assets for {profile.studentInitials}
            {activeGoal ? ` • Filtered to Goal ${profile.goals.findIndex((g) => g.id === activeGoal.id) + 1}` : ""}
          </p>
        </div>

        <button
          onClick={() => onOpenGenerator(activeGoal)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 active:scale-95 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>New AI Material</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
        <button
          onClick={() => setSelectedFilter("all")}
          className={clsx(
            "px-3 py-1.5 rounded-lg transition-colors shrink-0",
            selectedFilter === "all"
              ? "bg-slate-900 text-white font-bold"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          )}
        >
          All ({materials.length})
        </button>
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const count = materials.filter((m) => m.type === type).length;
          if (count === 0 && selectedFilter !== type) return null;
          return (
            <button
              key={type}
              onClick={() => setSelectedFilter(type)}
              className={clsx(
                "px-3 py-1.5 rounded-lg transition-colors shrink-0 flex items-center gap-1.5",
                selectedFilter === type
                  ? "bg-slate-900 text-white font-bold"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              <span>{cfg.label}</span>
              <span className="opacity-60 text-[10px]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Materials Cards Grid */}
      {filtered.length === 0 ? (
        <div className="py-12 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-700">No materials found</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Generate custom slide decks, board games, mini-games, or music for this goal.
            </p>
          </div>
          <button
            onClick={() => onOpenGenerator(activeGoal)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-sm"
          >
            <PlusCircle className="w-4 h-4" /> Generate First Material
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((mat) => {
            const cfg = TYPE_CONFIG[mat.type] || TYPE_CONFIG.slide_deck;
            const Icon = cfg.icon;
            const isDel = isDeleting === mat.id;
            return (
              <div
                key={mat.id}
                onClick={() => onOpenMaterial(mat)}
                className="group relative bg-slate-50 hover:bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-lg rounded-2xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={clsx(
                        "px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 border",
                        cfg.color
                      )}
                    >
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

                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                    {mat.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {mat.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-gray-400">
                    {new Date(mat.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>

                  <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                    <Play className="w-3.5 h-3.5 fill-indigo-600" /> Open
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
