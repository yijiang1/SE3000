"use client";

import db from "./db";
import type { ProgressLogEntry, StudentIEPProfile, TeacherProfile } from "@/types/iep";

const createdAt = "2026-09-13T12:00:00.000Z";

export const georgeMartinStudents: StudentIEPProfile[] = [
  {
    id: "demo-got-jon-snow",
    studentInitials: "JS",
    grade: "8th",
    primaryEligibility: "Specific Learning Disability (SLD)",
    iepAnnualReviewDate: "2027-05-14",
    plaafpSummary: "Fictional development record inspired by Jon Snow. JS contributes thoughtful ideas in discussion and benefits from explicit instruction for drawing evidence-based inferences from complex text.",
    learningProfile: {
      readingLevel: "Late 6th grade",
      comprehensionLevel: "Understands central ideas; needs prompts to connect evidence to inference",
      communicationNeeds: ["verbal", "visual_supports"],
      sensoryConsiderations: ["calm_environment"],
      interests: ["Leadership", "Wilderness survival", "History", "Animals"],
      preferredModality: ["hands_on", "social", "visual"],
      additionalNotes: "Demo-only fictional student inspired by Jon Snow; not a real student record.",
    },
    goals: [{ id: "demo-got-jon-goal-reading", goalText: "Given a grade-level narrative passage, JS will cite two relevant details to support an inference with at least 80% accuracy across four consecutive probes.", category: "academic", baselineValue: 45, targetValue: 80, measurementUnit: "%", reviewDate: "2027-05-14", createdAt }],
    services: [{ id: "demo-got-jon-service", type: "specialized_instruction", mandatedMinutesPerWeek: 90, deliveredMinutesThisWeek: 0, entries: [] }],
    accommodations: [{ id: "demo-got-jon-accommodation", category: "instructional", text: "Graphic organizer for claim, evidence, and reasoning", active: true }],
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "demo-got-arya-stark",
    studentInitials: "AS",
    grade: "7th",
    primaryEligibility: "Other Health Impairment (OHI)",
    iepAnnualReviewDate: "2027-04-23",
    plaafpSummary: "Fictional development record inspired by Arya Stark. AS is persistent and learns quickly through movement and practice, while multi-step written assignments require planning supports.",
    learningProfile: {
      readingLevel: "7th grade",
      comprehensionLevel: "Strong literal comprehension and developing written organization",
      communicationNeeds: ["verbal"],
      sensoryConsiderations: ["movement_seeking", "fidget_needs"],
      interests: ["Fencing", "Drama", "Maps", "Problem solving"],
      preferredModality: ["kinesthetic", "hands_on", "solitary"],
      additionalNotes: "Demo-only fictional student inspired by Arya Stark; not a real student record.",
    },
    goals: [{ id: "demo-got-arya-goal-executive", goalText: "Given a multi-step assignment, AS will create and follow a task checklist, completing at least 4 of 5 steps independently in four of five opportunities.", category: "behavioral", baselineValue: 2, targetValue: 4, measurementUnit: "count", trialsDenominator: 5, reviewDate: "2027-04-23", createdAt }],
    services: [{ id: "demo-got-arya-service", type: "specialized_instruction", mandatedMinutesPerWeek: 60, deliveredMinutesThisWeek: 0, entries: [] }],
    accommodations: [{ id: "demo-got-arya-accommodation", category: "instructional", text: "Chunk long assignments into visible, checkable steps", active: true }],
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "demo-got-bran-stark",
    studentInitials: "BS",
    grade: "6th",
    primaryEligibility: "Orthopedic Impairment",
    iepAnnualReviewDate: "2027-03-19",
    plaafpSummary: "Fictional development record inspired by Bran Stark. BS demonstrates strong memory and oral storytelling skills. Accessible positioning and flexible response methods support sustained participation.",
    learningProfile: {
      readingLevel: "6th grade",
      comprehensionLevel: "Strong listening comprehension and narrative recall",
      communicationNeeds: ["verbal"],
      sensoryConsiderations: ["movement_seeking"],
      interests: ["Myths", "Storytelling", "Nature", "Strategy games"],
      preferredModality: ["auditory", "visual", "social"],
      additionalNotes: "Demo-only fictional student inspired by Bran Stark; not a real student record.",
    },
    goals: [{ id: "demo-got-bran-goal-writing", goalText: "Using speech-to-text or keyboard access, BS will organize a narrative with a clear beginning, sequence of at least three events, and conclusion in four of five writing samples.", category: "academic", baselineValue: 2, targetValue: 4, measurementUnit: "count", trialsDenominator: 5, reviewDate: "2027-03-19", createdAt }],
    services: [{ id: "demo-got-bran-service", type: "occupational_therapy", mandatedMinutesPerWeek: 30, deliveredMinutesThisWeek: 0, entries: [] }],
    accommodations: [{ id: "demo-got-bran-accommodation", category: "environmental", text: "Accessible workspace with flexible positioning", active: true }, { id: "demo-got-bran-accommodation-2", category: "instructional", text: "Speech-to-text or keyboard response option", active: true }],
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "demo-got-samwell-tarly",
    studentInitials: "ST",
    grade: "9th",
    primaryEligibility: "Emotional/Behavioral Disorder (EBD)",
    iepAnnualReviewDate: "2027-02-26",
    plaafpSummary: "Fictional development record inspired by Samwell Tarly. ST has advanced background knowledge and research skills but may hesitate to share work without reassurance and a predictable discussion structure.",
    learningProfile: {
      readingLevel: "10th grade",
      comprehensionLevel: "Advanced comprehension and synthesis across sources",
      communicationNeeds: ["verbal", "visual_supports"],
      sensoryConsiderations: ["calm_environment", "minimal_visual_clutter"],
      interests: ["Books", "Research", "History", "Helping others"],
      preferredModality: ["reading_writing", "solitary", "auditory"],
      additionalNotes: "Demo-only fictional student inspired by Samwell Tarly; not a real student record.",
    },
    goals: [{ id: "demo-got-sam-goal-participation", goalText: "During a structured academic discussion, ST will share one prepared contribution and respond to one peer in four of five observed sessions.", category: "social_emotional", baselineValue: 1, targetValue: 4, measurementUnit: "count", trialsDenominator: 5, reviewDate: "2027-02-26", createdAt }],
    services: [{ id: "demo-got-sam-service", type: "counseling", mandatedMinutesPerWeek: 30, deliveredMinutesThisWeek: 0, entries: [] }],
    accommodations: [{ id: "demo-got-sam-accommodation", category: "instructional", text: "Preview discussion prompts and allow a prepared response", active: true }],
    createdAt,
    updatedAt: createdAt,
  },
];

export const georgeMartinProgressLogs: ProgressLogEntry[] = georgeMartinStudents.flatMap((student, index) => {
  const goal = student.goals[0];
  const first = goal.baselineValue;
  const second = goal.measurementUnit === "%" ? 58 : Math.min(goal.targetValue, first + 1);
  return [
    { id: `${student.id}-log-1`, profileId: student.id, goalId: goal.id, date: "2026-09-02", value: first, note: "Synthetic baseline observation for development use.", createdAt: `2026-09-02T1${index}:00:00.000Z` },
    { id: `${student.id}-log-2`, profileId: student.id, goalId: goal.id, date: "2026-09-09", value: second, note: "Synthetic follow-up observation for development use.", createdAt: `2026-09-09T1${index}:00:00.000Z` },
  ];
});

export async function seedGeorgeMartinDemo(): Promise<void> {
  const existing = await db.teacherProfiles.get("current-teacher");
  const teacher: TeacherProfile = {
    id: "current-teacher",
    name: "George R. R. Martin",
    roleTitle: "Fictional Worldbuilding & Literature Teacher",
    subjectsOrGrades: "Grades 6–9 Literature and Creative Writing",
    yearsExperience: "25+ years",
    hobbiesAndInterests: ["Worldbuilding", "Chess", "History", "Science fiction"],
    funFacts: ["Builds intricate fictional family trees", "Enjoys teaching through maps and timelines"],
    favoriteQuote: "A reader lives a thousand lives.",
    teachingPhilosophy: "Stories help students examine choices, consequences, identity, and empathy.",
    funLearningGoalForStudents: "Create a believable world and tell a story that could happen inside it.",
    contactInfo: "Fictional development profile — no real contact information",
    themeColor: "#991b1b",
    createdAt: existing?.createdAt ?? createdAt,
    updatedAt: new Date().toISOString(),
  };

  await db.transaction("rw", db.teacherProfiles, db.profiles, db.progressLogs, async () => {
    await db.teacherProfiles.put(teacher);
    await db.profiles.bulkPut(structuredClone(georgeMartinStudents));
    await db.progressLogs.bulkPut(structuredClone(georgeMartinProgressLogs));
  });
}
