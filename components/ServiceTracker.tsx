"use client";
// components/ServiceTracker.tsx — Mandated vs delivered service minutes table

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { clsx } from "clsx";
import type { StudentIEPProfile } from "@/types/iep";

interface Props {
  profile: StudentIEPProfile;
}

const SERVICE_LABELS: Record<string, string> = {
  speech_language: "Speech-Language Therapy",
  occupational_therapy: "Occupational Therapy",
  physical_therapy: "Physical Therapy",
  counseling: "Counseling",
  specialized_instruction: "Specialized Instruction",
  other: "Other",
};

export default function ServiceTracker({ profile }: Props) {
  const { services } = profile;

  if (services.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Service Delivery</h3>
        <p className="text-sm text-gray-400">No services recorded.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Service Delivery (This Week)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
              <th className="text-left pb-2">Service</th>
              <th className="text-right pb-2">Mandated</th>
              <th className="text-right pb-2">Delivered</th>
              <th className="text-right pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {services.map((svc) => {
              const deficit = svc.mandatedMinutesPerWeek - svc.deliveredMinutesThisWeek;
              const pct = Math.round((svc.deliveredMinutesThisWeek / svc.mandatedMinutesPerWeek) * 100);
              const ok = deficit <= 0;
              return (
                <tr key={svc.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 text-gray-700 font-medium">{SERVICE_LABELS[svc.type] ?? svc.type}</td>
                  <td className="py-2.5 text-right text-gray-600">{svc.mandatedMinutesPerWeek} min</td>
                  <td className={clsx("py-2.5 text-right font-medium", ok ? "text-green-700" : "text-red-600")}>
                    {svc.deliveredMinutesThisWeek} min
                  </td>
                  <td className="py-2.5 text-right">
                    {ok ? (
                      <span className="inline-flex items-center justify-end gap-1 text-green-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs">{pct}%</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-end gap-1 text-red-600">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-xs">-{deficit} min</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {services.some((s) => s.deliveredMinutesThisWeek < s.mandatedMinutesPerWeek) && (
        <p className="mt-3 text-xs text-red-600 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          One or more services have a delivery deficit this week. Review scheduling to ensure compliance.
        </p>
      )}
    </div>
  );
}
