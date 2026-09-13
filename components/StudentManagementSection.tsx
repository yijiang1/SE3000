"use client";

import { FileText, Target, UserPlus, Users } from "lucide-react";
import type { StudentIEPProfile } from "@/types/iep";
import { clsx } from "clsx";

interface Props {
  profiles: StudentIEPProfile[];
  selectedId: string | null;
  onSelect: (profileId: string) => void;
  onAddStudent: () => void;
  onAddGoal: (profileId: string) => void;
  onProgressReport: (profileId: string) => void;
}

export default function StudentManagementSection({
  profiles,
  selectedId,
  onSelect,
  onAddStudent,
  onAddGoal,
  onProgressReport,
}: Props) {
  return (
    <section
      id="student-management-section"
      className="scroll-mt-24 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
      aria-labelledby="student-management-heading"
    >
      <div className="flex flex-col gap-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 id="student-management-heading" className="text-lg font-black text-slate-900">
              Student Management
            </h2>
            <p className="text-xs font-medium text-slate-500">
              {profiles.length} student{profiles.length === 1 ? "" : "s"} in this workspace
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddStudent}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 transition-colors hover:bg-indigo-700"
        >
          <UserPlus className="h-4 w-4" />
          Add Student
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">No students yet</h3>
            <p className="mt-1 text-xs text-slate-500">Add a student to begin managing IEP goals and progress.</p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {profiles.map((profile) => {
            const isActive = profile.id === selectedId;
            return (
              <div
                key={profile.id}
                className={clsx(
                  "flex flex-col gap-3 px-5 py-4 transition-colors lg:flex-row lg:items-center lg:justify-between",
                  isActive ? "bg-indigo-50/60" : "hover:bg-slate-50"
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(profile.id)}
                  className="flex min-w-0 items-center gap-3 text-left"
                  aria-label={`Open ${profile.studentInitials}'s student dashboard`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-sm font-black text-white shadow-sm">
                    {profile.studentInitials}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-900">{profile.studentInitials}</span>
                      {isActive && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-indigo-700">
                          Active
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
                      Grade {profile.grade} · {profile.primaryEligibility} · {profile.goals.length} IEP goal{profile.goals.length === 1 ? "" : "s"}
                    </span>
                  </span>
                </button>

                <div className="flex flex-wrap items-center gap-2 pl-14 lg:pl-0">
                  <button
                    type="button"
                    onClick={() => onSelect(profile.id)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Open Student
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddGoal(profile.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                  >
                    <Target className="h-3.5 w-3.5" />
                    Add Goal
                  </button>
                  <button
                    type="button"
                    onClick={() => onProgressReport(profile.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Progress Report
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
