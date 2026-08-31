"use client";
// components/AccommodationList.tsx — Categorized accommodation badges

import { ClipboardList, BookOpen, Building2 } from "lucide-react";
import { clsx } from "clsx";
import type { StudentIEPProfile, Accommodation } from "@/types/iep";

interface Props {
  profile: StudentIEPProfile;
}

const CATEGORY_CONFIG = {
  testing: {
    label: "Testing",
    icon: ClipboardList,
    color: "bg-blue-50 border-blue-200",
    badgeColor: "bg-blue-100 text-blue-800",
    headerColor: "text-blue-700",
  },
  instructional: {
    label: "Instructional",
    icon: BookOpen,
    color: "bg-green-50 border-green-200",
    badgeColor: "bg-green-100 text-green-800",
    headerColor: "text-green-700",
  },
  environmental: {
    label: "Environmental",
    icon: Building2,
    color: "bg-purple-50 border-purple-200",
    badgeColor: "bg-purple-100 text-purple-800",
    headerColor: "text-purple-700",
  },
};

function AccommodationGroup({
  category,
  items,
}: {
  category: keyof typeof CATEGORY_CONFIG;
  items: Accommodation[];
}) {
  const cfg = CATEGORY_CONFIG[category];
  const Icon = cfg.icon;
  const activeItems = items.filter((i) => i.active);
  const inactiveItems = items.filter((i) => !i.active);

  return (
    <div className={clsx("rounded-lg border p-3", cfg.color)}>
      <div className={clsx("flex items-center gap-1.5 mb-2 font-semibold text-xs uppercase tracking-wide", cfg.headerColor)}>
        <Icon className="w-3.5 h-3.5" />
        {cfg.label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {activeItems.map((a) => (
          <span key={a.id} className={clsx("px-2 py-1 rounded-full text-xs font-medium", cfg.badgeColor)}>
            {a.text}
          </span>
        ))}
        {inactiveItems.map((a) => (
          <span key={a.id} className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-400 line-through">
            {a.text}
          </span>
        ))}
        {items.length === 0 && (
          <span className="text-xs text-gray-400">None recorded</span>
        )}
      </div>
    </div>
  );
}

export default function AccommodationList({ profile }: Props) {
  const { accommodations } = profile;
  const byCategory = {
    testing: accommodations.filter((a) => a.category === "testing"),
    instructional: accommodations.filter((a) => a.category === "instructional"),
    environmental: accommodations.filter((a) => a.category === "environmental"),
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Accommodations</h3>
      <div className="space-y-3">
        {(Object.keys(byCategory) as Array<keyof typeof byCategory>).map((cat) => (
          <AccommodationGroup key={cat} category={cat} items={byCategory[cat]} />
        ))}
      </div>
    </div>
  );
}
