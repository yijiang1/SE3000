// lib/generators/icebreakerContext.ts — Prompt context builder for Icebreaker Activity materials

import type { IcebreakerProfile } from "@/types/iep";

export function formatIcebreakerContextForPrompt(icebreaker: IcebreakerProfile, customPrompt?: string): string {
  return `
=== ICEBREAKER PROFILE (for first-day "get to know each other" activities) ===
- Theme: ${icebreaker.theme || "Not specified"}
- Group Size: ${icebreaker.groupSize || "Whole class"}
- Duration: ${icebreaker.durationMinutes || "10-15 minutes"}
- Number of Activities: ${icebreaker.numberOfActivities || 3}
- Preferred Activity Styles: ${icebreaker.activityStyles.join(", ") || "Not specified"}
${icebreaker.specialConsiderations ? `- Special Considerations (sensory/communication accommodations): ${icebreaker.specialConsiderations}` : ""}
${icebreaker.additionalNotes ? `- Additional Notes: ${icebreaker.additionalNotes}` : ""}
- Theme Accent Color: ${icebreaker.themeColor || "#db2777"}
${customPrompt ? `\nADDITIONAL TEACHER INSTRUCTIONS: ${customPrompt}` : ""}
`.trim();
}
