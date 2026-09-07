"use client";
// components/AccommodationList.tsx — Categorized accommodation badges

import { useState } from "react";
import db from "@/lib/db";
import { ClipboardList, BookOpen, Building2 } from "lucide-react";
import { clsx } from "clsx";
import type { StudentIEPProfile, Accommodation } from "@/types/iep";

interface Props {
  profile: StudentIEPProfile;
  onChanged?: () => void;
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

export default function AccommodationList({ profile, onChanged }: Props) {
  const [text, setText] = useState("");
  const [category, setCategory] = useState<Accommodation["category"]>("instructional");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function save(change: (current: StudentIEPProfile) => void) {
    setBusy(true); setError("");
    try {
      await db.transaction("rw", db.profiles, async () => {
        const current = await db.profiles.get(profile.id);
        if (!current) throw new Error("Student no longer exists.");
        change(current); current.updatedAt = new Date().toISOString();
        await db.profiles.put(current);
      });
      onChanged?.();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save accommodation."); }
    finally { setBusy(false); }
  }
  const { accommodations } = profile;
  const byCategory = {
    testing: accommodations.filter((a) => a.category === "testing"),
    instructional: accommodations.filter((a) => a.category === "instructional"),
    environmental: accommodations.filter((a) => a.category === "environmental"),
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Accommodations</h3>
      {error && <p role="alert" className="text-red-700">{error}</p>}
      <details className="mb-3"><summary className="text-sm text-indigo-700">Manage accommodations</summary>
        <div className="space-y-2 my-2">
          {accommodations.map((a) => <label key={a.id} className="block text-sm"><input type="checkbox" checked={a.active} disabled={busy} onChange={() => save((p) => { const current = p.accommodations.find((item) => item.id === a.id); if (current) current.active = !current.active; })} /> {a.text}</label>)}
          <label className="block">New accommodation<input value={text} onChange={(e) => setText(e.target.value)} className="block border p-2 rounded w-full" /></label>
          <label>Category<select value={category} onChange={(e) => setCategory(e.target.value as Accommodation["category"])} className="border rounded p-2">{Object.keys(CATEGORY_CONFIG).map((c) => <option key={c} value={c}>{c}</option>)}</select></label>
          <button disabled={busy || !text.trim()} className="ml-3 text-indigo-700" onClick={() => save((p) => {p.accommodations.push({id:crypto.randomUUID(),text:text.trim(),category,active:true});setText("");})}>Add accommodation</button>
        </div>
      </details>
      <div className="space-y-3">
        {(Object.keys(byCategory) as Array<keyof typeof byCategory>).map((cat) => (
          <AccommodationGroup key={cat} category={cat} items={byCategory[cat]} />
        ))}
      </div>
    </div>
  );
}
