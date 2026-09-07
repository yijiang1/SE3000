// lib/generators/surveyContext.ts — Prompt context builder for the Getting-to-Know-You survey

import type { SurveyProfile } from "@/types/iep";

export function formatSurveyContextForPrompt(survey: SurveyProfile, customPrompt?: string): string {
  return `
=== GETTING-TO-KNOW-YOU SURVEY (a printable "about me" questionnaire for students) ===
- Title: ${survey.title || "All About Me!"}
- Intro Message: ${survey.introMessage || "Not specified"}
- Theme: ${survey.theme || "Not specified"}
- Questions:
${survey.questions.map((q, i) => `  ${i + 1}. ${q}`).join("\n") || "  (none provided)"}
- Theme Accent Color: ${survey.themeColor || "#7c3aed"}
${customPrompt ? `\nADDITIONAL TEACHER INSTRUCTIONS: ${customPrompt}` : ""}
`.trim();
}
