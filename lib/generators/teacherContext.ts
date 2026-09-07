// lib/generators/teacherContext.ts — Prompt context builder for Teacher "About Me" materials

import type { TeacherProfile } from "@/types/iep";

export function formatTeacherContextForPrompt(teacher: TeacherProfile, customPrompt?: string): string {
  return `
=== TEACHER PROFILE (for a first-day "About Me" introduction) ===
- Name: ${teacher.name}
- Role: ${teacher.roleTitle}
- Subjects / Grades Taught: ${teacher.subjectsOrGrades}
${teacher.yearsExperience ? `- Years of Experience: ${teacher.yearsExperience}` : ""}
- Hobbies & Interests: ${teacher.hobbiesAndInterests.join(", ") || "Not specified"}
- Fun Facts: ${teacher.funFacts.join(" | ") || "Not specified"}
${teacher.favoriteQuote ? `- Favorite Quote: "${teacher.favoriteQuote}"` : ""}
${teacher.teachingPhilosophy ? `- Teaching Philosophy: ${teacher.teachingPhilosophy}` : ""}
${teacher.funLearningGoalForStudents ? `- What They Want Students To Take Away: ${teacher.funLearningGoalForStudents}` : ""}
${teacher.contactInfo ? `- Contact / Office Info: ${teacher.contactInfo}` : ""}
- Theme Accent Color: ${teacher.themeColor || "#4f46e5"}
${customPrompt ? `\nADDITIONAL TEACHER INSTRUCTIONS: ${customPrompt}` : ""}
`.trim();
}
