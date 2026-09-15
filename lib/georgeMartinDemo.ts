"use client";

import db from "./db";
import type { ProgressLogEntry, SchoolSchedulePeriod, StudentIEPProfile, TeacherProfile } from "@/types/iep";

const createdAt = "2026-09-13T12:00:00.000Z";

const demoTeachers = [
  ["Ms. Elena Rivera", "elena.rivera@example.edu"],
  ["Mr. Marcus Chen", "marcus.chen@example.edu"],
  ["Dr. Priya Shah", "priya.shah@example.edu"],
  ["Ms. Talia Brooks", "talia.brooks@example.edu"],
  ["Mr. Owen Murphy", "owen.murphy@example.edu"],
  ["Ms. Camille Foster", "camille.foster@example.edu"],
  ["Coach Andre Lewis", "andre.lewis@example.edu"],
  ["Ms. Naomi Patel", "naomi.patel@example.edu"],
] as const;

function makeDemoSchedule(subjects: string[], roomWing: string): SchoolSchedulePeriod[] {
  return subjects.map((subjectName, index) => ({
    period: index + 1,
    subjectName,
    teacherName: demoTeachers[index][0],
    coTeacherName: index === 0 || index === 3 ? "Ms. Jordan Kim" : "",
    classroomLocation: index === 6 ? "North Gym" : `${roomWing}-${201 + index}`,
    teacherContactInfo: demoTeachers[index][1],
  }));
}

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
    schoolSchedule: makeDemoSchedule(["English Language Arts", "Algebra I", "Earth Science", "U.S. History", "Learning Strategies", "Digital Media", "Physical Education", "Creative Writing"], "A"),
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
    schoolSchedule: makeDemoSchedule(["English Language Arts", "Pre-Algebra", "Life Science", "World Geography", "Executive Skills Lab", "Theater Arts", "Physical Education", "Studio Art"], "B"),
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
    schoolSchedule: makeDemoSchedule(["English Language Arts", "Math 6", "Integrated Science", "Ancient Civilizations", "Assistive Technology", "Digital Storytelling", "Adaptive Physical Education", "Library Research"], "C"),
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
    schoolSchedule: makeDemoSchedule(["Honors English I", "Algebra I", "Biology", "World History", "Academic Seminar", "Research Methods", "Health & Wellness", "Creative Writing"], "D"),
    goals: [{ id: "demo-got-sam-goal-participation", goalText: "During a structured academic discussion, ST will share one prepared contribution and respond to one peer in four of five observed sessions.", category: "social_emotional", baselineValue: 1, targetValue: 4, measurementUnit: "count", trialsDenominator: 5, reviewDate: "2027-02-26", createdAt }],
    services: [{ id: "demo-got-sam-service", type: "counseling", mandatedMinutesPerWeek: 30, deliveredMinutesThisWeek: 0, entries: [] }],
    accommodations: [{ id: "demo-got-sam-accommodation", category: "instructional", text: "Preview discussion prompts and allow a prepared response", active: true }],
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "demo-got-daenerys-targaryen",
    studentInitials: "DT",
    grade: "10th",
    primaryEligibility: "Autism Spectrum Disorder (ASD)",
    iepAnnualReviewDate: "2027-06-02",
    plaafpSummary: "Fictional development record inspired by Daenerys Targaryen. DT is a confident public speaker and natural leader who does best with advance notice of schedule changes and clear expectations for group work.",
    learningProfile: {
      readingLevel: "10th grade",
      comprehensionLevel: "Strong comprehension of persuasive and expository text; benefits from visual outlines for multi-step tasks",
      communicationNeeds: ["verbal"],
      sensoryConsiderations: ["calm_environment", "minimal_visual_clutter"],
      interests: ["Leadership", "History", "Animals", "Public speaking"],
      preferredModality: ["auditory", "social", "visual"],
      additionalNotes: "Demo-only fictional student inspired by Daenerys Targaryen; not a real student record.",
    },
    schoolSchedule: makeDemoSchedule(["Honors English II", "Geometry", "Chemistry", "World Affairs", "Leadership Seminar", "Public Speaking", "Physical Education", "Studio Art"], "E"),
    goals: [{ id: "demo-got-dany-goal-transitions", goalText: "Given advance notice of an upcoming schedule change, DT will transition to the new activity within 2 minutes without protest in four of five observed opportunities.", category: "behavioral", baselineValue: 2, targetValue: 4, measurementUnit: "count", trialsDenominator: 5, reviewDate: "2027-06-02", createdAt }],
    services: [{ id: "demo-got-dany-service", type: "counseling", mandatedMinutesPerWeek: 30, deliveredMinutesThisWeek: 0, entries: [] }],
    accommodations: [{ id: "demo-got-dany-accommodation", category: "instructional", text: "Advance written notice of schedule or routine changes", active: true }],
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "demo-got-tyrion-lannister",
    studentInitials: "TL",
    grade: "9th",
    primaryEligibility: "Other Health Impairment (OHI)",
    iepAnnualReviewDate: "2027-01-15",
    plaafpSummary: "Fictional development record inspired by Tyrion Lannister. TL has strong verbal reasoning and wit, and benefits from preferential seating and built-in movement breaks to manage fatigue.",
    learningProfile: {
      readingLevel: "11th grade",
      comprehensionLevel: "Advanced inferential comprehension; strong verbal reasoning",
      communicationNeeds: ["verbal"],
      sensoryConsiderations: ["fidget_needs"],
      interests: ["Strategy", "Debate", "History", "Books"],
      preferredModality: ["reading_writing", "auditory", "solitary"],
      additionalNotes: "Demo-only fictional student inspired by Tyrion Lannister; not a real student record.",
    },
    schoolSchedule: makeDemoSchedule(["Honors English I", "Algebra II", "Biology", "Debate", "Study Hall", "Political Science", "Health & Wellness", "Creative Writing"], "F"),
    goals: [{ id: "demo-got-tyrion-goal-stamina", goalText: "Given a scheduled movement break every 20 minutes, TL will remain on-task for a full class period in four of five observed sessions.", category: "behavioral", baselineValue: 2, targetValue: 4, measurementUnit: "count", trialsDenominator: 5, reviewDate: "2027-01-15", createdAt }],
    services: [{ id: "demo-got-tyrion-service", type: "occupational_therapy", mandatedMinutesPerWeek: 30, deliveredMinutesThisWeek: 0, entries: [] }],
    accommodations: [{ id: "demo-got-tyrion-accommodation", category: "environmental", text: "Preferential seating near the front with room to stand as needed", active: true }],
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "demo-got-sansa-stark",
    studentInitials: "SS",
    grade: "8th",
    primaryEligibility: "Specific Learning Disability (SLD)",
    iepAnnualReviewDate: "2027-07-08",
    plaafpSummary: "Fictional development record inspired by Sansa Stark. SS shows strong organizational skills and diplomacy, and benefits from graphic organizers for multi-paragraph writing.",
    learningProfile: {
      readingLevel: "7th grade",
      comprehensionLevel: "Solid literal comprehension; developing written organization for longer pieces",
      communicationNeeds: ["verbal"],
      sensoryConsiderations: ["calm_environment"],
      interests: ["Fashion design", "Diplomacy", "Gardening", "History"],
      preferredModality: ["visual", "social", "reading_writing"],
      additionalNotes: "Demo-only fictional student inspired by Sansa Stark; not a real student record.",
    },
    schoolSchedule: makeDemoSchedule(["English Language Arts", "Pre-Algebra", "Life Science", "World Geography", "Learning Strategies", "Fashion & Design", "Physical Education", "Studio Art"], "G"),
    goals: [{ id: "demo-got-sansa-goal-writing", goalText: "Using a graphic organizer, SS will draft a five-paragraph essay with a clear thesis and supporting evidence in four of five writing samples.", category: "academic", baselineValue: 2, targetValue: 4, measurementUnit: "count", trialsDenominator: 5, reviewDate: "2027-07-08", createdAt }],
    services: [{ id: "demo-got-sansa-service", type: "specialized_instruction", mandatedMinutesPerWeek: 60, deliveredMinutesThisWeek: 0, entries: [] }],
    accommodations: [{ id: "demo-got-sansa-accommodation", category: "instructional", text: "Graphic organizer for multi-paragraph writing", active: true }],
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "demo-got-brienne-of-tarth",
    studentInitials: "BT",
    grade: "7th",
    primaryEligibility: "Speech or Language Impairment",
    iepAnnualReviewDate: "2026-12-10",
    plaafpSummary: "Fictional development record inspired by Brienne of Tarth. BT is dependable and hardworking, and benefits from rehearsal time before speaking in front of the class.",
    learningProfile: {
      readingLevel: "7th grade",
      comprehensionLevel: "Strong literal comprehension; developing expressive verbal fluency",
      communicationNeeds: ["verbal", "visual_supports"],
      sensoryConsiderations: ["movement_seeking"],
      interests: ["Sports", "Training", "Honor codes", "History"],
      preferredModality: ["kinesthetic", "hands_on", "solitary"],
      additionalNotes: "Demo-only fictional student inspired by Brienne of Tarth; not a real student record.",
    },
    schoolSchedule: makeDemoSchedule(["English Language Arts", "Pre-Algebra", "Life Science", "World Geography", "Speech Support", "Athletics", "Physical Education", "Studio Art"], "H"),
    goals: [{ id: "demo-got-brienne-goal-speaking", goalText: "Given one minute of silent rehearsal time, BT will deliver a prepared response to a class discussion prompt with at least 80% intelligibility in four of five observed opportunities.", category: "communication", baselineValue: 50, targetValue: 80, measurementUnit: "%", reviewDate: "2026-12-10", createdAt }],
    services: [{ id: "demo-got-brienne-service", type: "speech_language", mandatedMinutesPerWeek: 60, deliveredMinutesThisWeek: 0, entries: [] }],
    accommodations: [{ id: "demo-got-brienne-accommodation", category: "instructional", text: "Rehearsal time before verbal responses", active: true }],
    createdAt,
    updatedAt: createdAt,
  },
  {
    id: "demo-got-theon-greyjoy",
    studentInitials: "TG",
    grade: "6th",
    primaryEligibility: "Emotional/Behavioral Disorder (EBD)",
    iepAnnualReviewDate: "2027-08-21",
    plaafpSummary: "Fictional development record inspired by Theon Greyjoy. TG is working on building self-confidence and benefits from a consistent check-in routine and positive reinforcement for participation.",
    learningProfile: {
      readingLevel: "6th grade",
      comprehensionLevel: "Developing literal comprehension; benefits from chunked reading passages",
      communicationNeeds: ["verbal"],
      sensoryConsiderations: ["calm_environment", "fidget_needs"],
      interests: ["Sailing", "Strategy games", "Survival skills", "Animals"],
      preferredModality: ["kinesthetic", "visual", "hands_on"],
      additionalNotes: "Demo-only fictional student inspired by Theon Greyjoy; not a real student record.",
    },
    schoolSchedule: makeDemoSchedule(["English Language Arts", "Math 6", "Integrated Science", "Ancient Civilizations", "Check-In Support", "Outdoor Education", "Adaptive Physical Education", "Library Research"], "I"),
    goals: [{ id: "demo-got-theon-goal-participation", goalText: "During a daily morning check-in, TG will identify one personal goal for the day and report back on progress in four of five school days.", category: "social_emotional", baselineValue: 2, targetValue: 4, measurementUnit: "count", trialsDenominator: 5, reviewDate: "2027-08-21", createdAt }],
    services: [{ id: "demo-got-theon-service", type: "counseling", mandatedMinutesPerWeek: 30, deliveredMinutesThisWeek: 0, entries: [] }],
    accommodations: [{ id: "demo-got-theon-accommodation", category: "instructional", text: "Daily check-in and check-out routine with positive reinforcement", active: true }],
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

/** Add schedules to demo students created by older app versions without replacing other record data. */
export async function backfillGeorgeMartinDemoSchedules(): Promise<number> {
  const schedulesById = new Map(
    georgeMartinStudents.map((student) => [student.id, student.schoolSchedule])
  );
  let updated = 0;

  await db.transaction("rw", db.profiles, async () => {
    for (const [studentId, schedule] of schedulesById) {
      const existing = await db.profiles.get(studentId);
      if (!existing || existing.schoolSchedule?.length || !schedule) continue;
      await db.profiles.update(studentId, {
        schoolSchedule: structuredClone(schedule),
        updatedAt: new Date().toISOString(),
      });
      updated += 1;
    }
  });

  return updated;
}

/** Add demo students introduced by newer app versions to an existing George Martin vault. */
export async function backfillGeorgeMartinNewStudents(): Promise<number> {
  const teacher = await db.teacherProfiles.get("current-teacher");
  if (teacher?.name !== "George R. R. Martin") return 0;

  let added = 0;
  await db.transaction("rw", db.profiles, db.progressLogs, async () => {
    for (const student of georgeMartinStudents) {
      if (await db.profiles.get(student.id)) continue;
      await db.profiles.put(structuredClone(student));
      const logs = georgeMartinProgressLogs.filter((log) => log.profileId === student.id);
      await db.progressLogs.bulkPut(structuredClone(logs));
      added += 1;
    }
  });

  return added;
}

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
