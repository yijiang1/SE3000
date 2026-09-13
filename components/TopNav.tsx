"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Users, BookOpen, Settings as SettingsIcon, LockKeyhole, HardDrive } from "lucide-react";
import { clsx } from "clsx";
import { useTeacherSession } from "@/components/TeacherAccess";

const TABS = [
  { href: "/", label: "Students", icon: Users },
  { href: "/course-materials", label: "Materials", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export default function TopNav() {
  const { teacher, saveStatus, lock } = useTeacherSession();
  const pathname = usePathname();

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
      <div className="mx-auto flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 xl:px-8">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="hidden sm:flex items-center gap-1.5 min-w-0 text-xs text-slate-300">
            <HardDrive className={clsx("w-3.5 h-3.5 shrink-0", saveStatus === "error" ? "text-rose-400" : saveStatus === "saving" ? "text-amber-400" : "text-emerald-400")} />
            <span className="max-w-40 truncate font-semibold">{teacher.name}</span>
            <span className="text-slate-500">·</span>
            <span className={clsx("shrink-0", saveStatus === "error" ? "text-rose-300" : "text-slate-400")}>
              {saveStatus === "saving" ? "Saving…" : saveStatus === "error" ? "Save failed" : "Vault saved"}
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-2">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-colors",
                  active
                    ? "bg-indigo-600 border-indigo-500 text-white"
                    : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => void lock()}
          className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700"
          title="Lock this teacher workspace"
        >
          <LockKeyhole className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Lock</span>
        </button>
      </div>
    </header>
  );
}
