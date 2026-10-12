import { Calculator, ExternalLink, GraduationCap } from "lucide-react";

type LearningResource = {
  title: string;
  description: string;
  href: string;
  topic: string;
};

// Static, self-contained lessons served from /public. They run fully in the
// browser (no network or vault access), so each one opens in its own tab.
const RESOURCES: LearningResource[] = [
  {
    title: "Asymptote Lab",
    description:
      "Interactive lesson on vertical, horizontal, and slant asymptotes and synthetic division, with step-by-step walkthroughs and unlimited practice problems.",
    href: "/learning/asymptote-lab/index.html",
    topic: "MATH 1428 · Section 4.5",
  },
];

export default function LearningResources() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="learning-resources-heading">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
          <GraduationCap className="h-4 w-4" />
        </div>
        <div>
          <h2 id="learning-resources-heading" className="text-sm font-bold text-slate-900">
            Learning Resources
          </h2>
          <p className="text-[11px] font-medium text-slate-500">Interactive lessons students can explore on their own</p>
        </div>
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {RESOURCES.map((resource) => (
          <li key={resource.href}>
            <a
              href={resource.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-sky-300 hover:bg-sky-50"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Calculator className="h-4 w-4 text-sky-600" />
                  {resource.title}
                </span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-sky-600" aria-hidden="true" />
              </div>
              <p className="text-xs leading-5 text-slate-600">{resource.description}</p>
              <span className="mt-auto text-[11px] font-semibold text-sky-700">{resource.topic}</span>
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
