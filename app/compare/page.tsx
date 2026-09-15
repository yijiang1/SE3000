"use client";
// app/compare/page.tsx — Side-by-side comparison of multiple students' traits (e.g. class schedule)

import { useEffect, useState } from "react";
import { Columns3, Users } from "lucide-react";
import db from "@/lib/db";
import { getClassPeriods, formatPeriodRange, DEFAULT_CLASS_PERIODS, type ClassPeriodDefinition } from "@/lib/settings";
import type { StudentIEPProfile } from "@/types/iep";
import { clsx } from "clsx";

const STUDENT_COL_WIDTH = "7rem";

export default function ComparePage() {
  const [profiles, setProfiles] = useState<StudentIEPProfile[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [classPeriods, setClassPeriods] = useState<ClassPeriodDefinition[]>(DEFAULT_CLASS_PERIODS);
  const [gradeFilter, setGradeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([db.profiles.toArray(), getClassPeriods()])
      .then(([all, periods]) => {
        setProfiles(all);
        setClassPeriods(periods);
        setSelectedIds(all.slice(0, Math.min(3, all.length)).map((p) => p.id));
      })
      .finally(() => setLoading(false));
  }, []);

  const periodCount = Math.max(classPeriods.length, ...profiles.map((p) => p.schoolSchedule?.length ?? 0), 1);
  const periods = Array.from({ length: periodCount }, (_, index) => index + 1);
  const periodColWidth = `calc((100% - ${STUDENT_COL_WIDTH}) / ${periodCount})`;

  function toggleSelected(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((existing) => existing !== id) : [...prev, id]));
  }

  const grades = Array.from(new Set(profiles.map((p) => p.grade))).sort();
  const visibleProfiles = gradeFilter ? profiles.filter((p) => p.grade === gradeFilter) : profiles;
  const selectedProfiles = profiles.filter((p) => selectedIds.includes(p.id));

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-indigo-400 border-t-transparent" />
          <p className="text-sm font-semibold tracking-wide text-indigo-200">Loading students…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 text-slate-900">
      <main className="mx-auto w-full space-y-6 px-4 py-6 sm:px-6 xl:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30">
            <Columns3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900">Compare Students</h1>
            <p className="text-[11px] font-medium text-slate-500">Pick students below to compare them side by side</p>
          </div>
        </div>

        {/* Student picker */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Users className="h-4 w-4" />
            </div>
            <div className="mr-auto">
              <h2 className="text-sm font-black text-slate-900">Select Students</h2>
              <p className="text-xs font-medium text-slate-500">{selectedIds.length} of {profiles.length} selected</p>
            </div>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All grades</option>
              {grades.map((grade) => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSelectedIds(visibleProfiles.map((p) => p.id))}
              className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50"
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              None
            </button>
          </div>

          {profiles.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No students yet. Add students from the Students tab first.</p>
          ) : visibleProfiles.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-500">No students match this filter.</p>
          ) : (
            <div className="grid grid-cols-1 divide-y divide-slate-100 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
              {visibleProfiles.map((profile) => {
                const checked = selectedIds.includes(profile.id);
                return (
                  <label
                    key={profile.id}
                    className={clsx(
                      "flex cursor-pointer items-center gap-3 px-5 py-3 transition-colors",
                      checked ? "bg-indigo-50/60" : "hover:bg-slate-50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSelected(profile.id)}
                      className="h-4 w-4 shrink-0 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-xs font-black text-white">
                      {profile.studentInitials}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-slate-900">{profile.studentInitials}</span>
                      <span className="block truncate text-xs font-medium text-slate-500">Grade {profile.grade} · {profile.primaryEligibility}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </section>

        {/* Trait comparison */}
        {selectedProfiles.length > 0 && (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-5 py-4">
              <h2 className="text-sm font-black text-slate-900">Class Schedule Comparison</h2>
              <p className="text-xs font-medium text-slate-500">Each column is a class period; each row is a student</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] table-fixed border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th style={{ width: STUDENT_COL_WIDTH }} className="sticky left-0 z-10 bg-slate-50 px-4 py-2.5 font-bold text-slate-700">Student</th>
                    {periods.map((period) => (
                      <th key={period} style={{ width: periodColWidth }} className="px-4 py-2.5 font-bold text-slate-700">
                        <span className="block whitespace-nowrap">Period {period}</span>
                        {formatPeriodRange(classPeriods[period - 1]) && (
                          <span className="mt-0.5 block whitespace-nowrap text-[11px] font-medium normal-case text-slate-400">{formatPeriodRange(classPeriods[period - 1])}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedProfiles.map((profile) => {
                    const scheduleByPeriod = new Map((profile.schoolSchedule ?? []).map((item) => [item.period, item]));
                    return (
                      <tr key={profile.id}>
                        <td className="sticky left-0 z-10 bg-white px-4 py-3 font-bold text-slate-900 whitespace-nowrap">{profile.studentInitials}</td>
                        {periods.map((period) => {
                          const cls = scheduleByPeriod.get(period);
                          return (
                            <td key={period} className="px-4 py-3 align-top">
                              {cls?.subjectName ? (
                                <span className="block">
                                  <span className="block font-semibold text-slate-900">{cls.subjectName}</span>
                                  {cls.teacherName && <span className="block text-slate-500">{cls.teacherName}</span>}
                                </span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
