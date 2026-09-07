// lib/generators/classroomContext.ts — Prompt context builder for Classroom Expectations materials

import type { ClassroomProfile } from "@/types/iep";

export function formatClassroomContextForPrompt(classroom: ClassroomProfile, customPrompt?: string): string {
  return `
=== CLASSROOM PROFILE (for a first-day "How Our Classroom Works" introduction) ===
- Classroom Name: ${classroom.classroomName || "Our Classroom"}
- Theme: ${classroom.theme || "Not specified"}
- Rules: ${classroom.rules.join(" | ") || "Not specified"}
- Routines & Procedures: ${classroom.routines.join(" | ") || "Not specified"}
${classroom.rewardsSystem ? `- Rewards System: ${classroom.rewardsSystem}` : ""}
${classroom.consequencesSystem ? `- Consequences System: ${classroom.consequencesSystem}` : ""}
${classroom.additionalNotes ? `- Additional Notes: ${classroom.additionalNotes}` : ""}
- Theme Accent Color: ${classroom.themeColor || "#0891b2"}
${customPrompt ? `\nADDITIONAL TEACHER INSTRUCTIONS: ${customPrompt}` : ""}
`.trim();
}
