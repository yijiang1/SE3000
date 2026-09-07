// lib/db.ts — Dexie IndexedDB database with schema versioning for SE 3000

import Dexie, { type EntityTable } from "dexie";
import type {
  StudentIEPProfile,
  ProgressLogEntry,
  GeneratedMaterial,
  MaterialBlob,
  PlanningSession,
  TeacherProfile,
  ClassroomProfile,
  IcebreakerProfile,
  SurveyProfile,
  FirstDayMaterial
} from "@/types/iep";

class IEPDatabase extends Dexie {
  profiles!: EntityTable<StudentIEPProfile, "id">;
  progressLogs!: EntityTable<ProgressLogEntry, "id">;
  generatedMaterials!: EntityTable<GeneratedMaterial, "id">;
  materialBlobs!: EntityTable<MaterialBlob, "id">;
  planningSessions!: EntityTable<PlanningSession, "id">;
  teacherProfiles!: EntityTable<TeacherProfile, "id">;
  classroomProfiles!: EntityTable<ClassroomProfile, "id">;
  icebreakerProfiles!: EntityTable<IcebreakerProfile, "id">;
  surveyProfiles!: EntityTable<SurveyProfile, "id">;
  firstDayMaterials!: EntityTable<FirstDayMaterial, "id">;

  constructor() {
    super("IEPTrackerDB");

    // Schema v1
    this.version(1).stores({
      profiles: "id, studentInitials, iepAnnualReviewDate",
      progressLogs: "id, goalId, [profileId+goalId], date",
    });

    // Schema v2 with AI Materials Generation support
    this.version(2).stores({
      profiles: "id, studentInitials, iepAnnualReviewDate",
      progressLogs: "id, goalId, [profileId+goalId], date",
      generatedMaterials: "id, goalId, profileId, [profileId+goalId], type, status, createdAt",
      materialBlobs: "id, materialId",
    });

    // Schema v3 with the Instructional Planning Assistant (PLAAFP → Goal → Unit → Progress)
    this.version(3).stores({
      profiles: "id, studentInitials, iepAnnualReviewDate",
      progressLogs: "id, goalId, [profileId+goalId], date",
      generatedMaterials: "id, goalId, profileId, [profileId+goalId], type, status, createdAt",
      materialBlobs: "id, materialId",
      planningSessions: "id, profileId, goalId, subjectArea, createdAt",
    });

    // Schema v4 — First-Day Materials Hub: Teacher Introduction, Classroom
    // Expectations, Icebreaker Activities, Family Welcome Letters & the
    // Getting-to-Know-You Survey. Not tied to any student profile or IEP
    // goal, so these live in their own tables rather than reusing
    // generatedMaterials.
    this.version(4).stores({
      profiles: "id, studentInitials, iepAnnualReviewDate",
      progressLogs: "id, goalId, [profileId+goalId], date",
      generatedMaterials: "id, goalId, profileId, [profileId+goalId], type, status, createdAt",
      materialBlobs: "id, materialId",
      planningSessions: "id, profileId, goalId, subjectArea, createdAt",
      teacherProfiles: "id",
      classroomProfiles: "id",
      icebreakerProfiles: "id",
      surveyProfiles: "id",
      firstDayMaterials: "id, category, format, status, createdAt",
    });
  }
}

// Singleton — reuse the same Dexie instance across the app
const db = new IEPDatabase();
export default db;
