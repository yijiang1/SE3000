// types/iep.ts — Comprehensive type definitions for SE 3000

import type { ProviderPreferences } from "@/lib/ai/providers";

export type GoalCategory =
  | "academic"
  | "behavioral"
  | "social_emotional"
  | "communication"
  | "motor";

export type MeasurementUnit =
  | "%"
  | "count"
  | "minutes"
  | "trials"
  | "rating_scale"
  | "frequency";

export type ServiceType =
  | "speech_language"
  | "occupational_therapy"
  | "physical_therapy"
  | "counseling"
  | "specialized_instruction"
  | "other";

export type TrendStatus = "on_track" | "at_risk" | "off_track" | "no_data";

export type AccommodationCategory = "testing" | "instructional" | "environmental";

// ────────────────────────────────────────────────────────────────────────────
// Learning Profile Types (Materials Generation Anchors)
// ────────────────────────────────────────────────────────────────────────────
export type CommunicationNeed =
  | "verbal"
  | "limited_verbal"
  | "nonverbal"
  | "aac_device"
  | "visual_supports"
  | "sign_language"
  | "picture_exchange";

export type SensoryConsideration =
  | "light_sensitivity"
  | "sound_sensitivity"
  | "tactile_sensitivity"
  | "movement_seeking"
  | "fidget_needs"
  | "calm_environment"
  | "minimal_visual_clutter";

export type LearningModality =
  | "visual"
  | "auditory"
  | "kinesthetic"
  | "reading_writing"
  | "hands_on"
  | "social"
  | "solitary";

export interface LearningProfile {
  readingLevel: string;           // e.g. "2nd Grade", "Kindergarten (Early Reader)"
  comprehensionLevel: string;     // e.g. "Literal comprehension, follows 2-step visual prompts"
  communicationNeeds: CommunicationNeed[];
  sensoryConsiderations: SensoryConsideration[];
  interests: string[];            // e.g. ["Dinosaurs", "Space Exploration", "Trains", "Minecraft"]
  preferredModality: LearningModality[];
  additionalNotes?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Progress log entry — one dated observation for a specific goal
// ────────────────────────────────────────────────────────────────────────────
export interface ProgressLogEntry {
  id: string;
  profileId: string;      // FK → StudentIEPProfile.id
  goalId: string;         // FK → IEPGoal.id
  date: string;           // ISO date string e.g. "2026-08-15"
  value: number;          // measured value in the goal's unit
  note?: string;          // optional teacher observation note
  createdAt: string;      // ISO timestamp
}

// ────────────────────────────────────────────────────────────────────────────
// IEP Goal
// ────────────────────────────────────────────────────────────────────────────
export interface IEPGoal {
  id: string;
  goalText: string;                    // full goal statement
  category: GoalCategory;
  baselineValue: number;
  targetValue: number;
  measurementUnit: MeasurementUnit;
  trialsDenominator?: number;          // e.g. 5 for "4 out of 5 trials"
  reviewDate: string;                  // ISO date — mastery deadline
  createdAt: string;

  // ── Optional rich fields populated when the goal comes from the Planning
  //    Assistant (Present Level → Skill Gap → Recommended Goal). All optional so
  //    hand-entered goals and AddGoalForm are unaffected.
  targetSkill?: string;
  baselineStatement?: string;          // narrative baseline description
  measurementCriteria?: string;        // how progress is measured
  masteryCriteria?: string;            // what counts as mastered
  progressMonitoringMethod?: string;   // e.g. "weekly curriculum-based probes"
  shortTermObjectives?: ShortTermObjective[];
  instructionalLevel?: string;         // level the goal was individualized to
  sourcePlanId?: string;               // FK → PlanningSession.id
}

// ────────────────────────────────────────────────────────────────────────────
// Service Delivery
// ────────────────────────────────────────────────────────────────────────────
export interface ServiceDelivery {
  id: string;
  type: ServiceType;
  mandatedMinutesPerWeek: number;
  deliveredMinutesThisWeek: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Accommodation
// ────────────────────────────────────────────────────────────────────────────
export interface Accommodation {
  id: string;
  category: AccommodationCategory;
  text: string;
  active: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Student IEP Profile — root document stored in IndexedDB
// ────────────────────────────────────────────────────────────────────────────
export interface StudentIEPProfile {
  id: string;
  studentInitials: string;       // e.g. "JD" — no real names
  grade: string;                 // e.g. "3rd"
  primaryEligibility: string;    // e.g. "SLD", "Autism", "OHI"
  iepAnnualReviewDate: string;   // ISO date
  plaafpSummary: string;         // PLAAFP narrative snippet
  learningProfile: LearningProfile; // Expanded learning profile
  goals: IEPGoal[];
  services: ServiceDelivery[];
  accommodations: Accommodation[];
  createdAt: string;
  updatedAt: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Trend Analysis Result
// ────────────────────────────────────────────────────────────────────────────
export interface TrendResult {
  status: TrendStatus;
  projectedValue: number | null;   // projected value at reviewDate
  slope: number | null;            // change per day
  latestValue: number | null;
  percentToTarget: number | null;  // (latestValue - baseline) / (target - baseline) * 100
}

// ────────────────────────────────────────────────────────────────────────────
// Generated Materials Models
// ────────────────────────────────────────────────────────────────────────────
export type MaterialType =
  | "slide_deck"
  | "board_game"
  | "mini_game"
  | "music"
  | "narration"
  | "video_clip"
  | "worksheet";

export type GenerationStatus =
  | "pending"
  | "generating"
  | "ready"
  | "error"
  | "expired";

export interface GeneratedMaterial {
  id: string;
  profileId: string;             // FK → StudentIEPProfile.id
  goalId: string;                // FK → IEPGoal.id
  type: MaterialType;
  status: GenerationStatus;
  title: string;
  description: string;
  promptUsed: string;
  modelUsed: string;
  generationCostEstimate?: number;
  contentJson?: string;          // Serialized JSON for slides, board games, mini games, etc.
  blobKeys?: string[];           // IDs pointing to materialBlobs table
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialBlob {
  id: string;                    // UUID
  materialId: string;            // FK → GeneratedMaterial.id
  mimeType: string;              // e.g. "audio/mp3", "video/mp4", "image/png", "application/pdf"
  filename: string;
  data: Blob;
  sizeBytes: number;
  createdAt: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Standardized Generation Context passed into all AI generators
// ────────────────────────────────────────────────────────────────────────────
export interface GenerationContext {
  student: {
    initials: string;
    grade: string;
    eligibility: string;
    readingLevel: string;
    comprehensionLevel: string;
    communicationNeeds: CommunicationNeed[];
    sensoryConsiderations: SensoryConsideration[];
    interests: string[];
    preferredModality: LearningModality[];
    additionalNotes?: string;
  };
  goal: {
    id: string;
    goalText: string;
    category: GoalCategory;
    baselineValue: number;
    targetValue: number;
    measurementUnit: MeasurementUnit;
    currentValue?: number;
    trendStatus?: TrendStatus;
  };
  accommodations: string[];
}

// ────────────────────────────────────────────────────────────────────────────
// Material Specific Content Structures (Stored in contentJson)
// ────────────────────────────────────────────────────────────────────────────

// 1. Slide Deck Structure
export interface SlideItem {
  slideNumber: number;
  title: string;
  content: string[];             // bullet points or paragraphs
  teacherNotes?: string;
  imagePrompt?: string;          // Prompt used for Imagen 3
  imageDataUrl?: string;         // Base64 or Object URL
  interactiveQuestion?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface SlideDeckContent {
  title: string;
  topic: string;
  targetSkill: string;
  readingLevel: string;
  theme: string;
  slides: SlideItem[];
}

// 2. Board / Card Game Structure
export interface BoardTile {
  index: number;
  label: string;
  type: "start" | "challenge" | "bonus" | "rest" | "finish";
  iconName?: string;
  promptText?: string;
}

export interface GameCard {
  id: string;
  category: string;
  questionOrTask: string;
  answerOrCriteria: string;
  rewardPoints?: number;
}

export interface BoardGameContent {
  gameTitle: string;
  theme: string;
  targetSkill: string;
  objective: string;
  playerCount: string;
  materialsNeeded: string[];
  rules: string[];
  tiles: BoardTile[];
  cards: GameCard[];
  printableInstructions: string;
}

// 3. Browser Mini-Game Structure
export type MiniGameEngineType = "matching" | "sorting" | "multiple_choice" | "sequencing";

export interface MatchingPair {
  id: string;
  prompt: string;         // Word, Math problem, or Clue
  match: string;          // Target Word, Answer, or Definition
  category?: string;
}

export interface SortingBucket {
  id: string;
  title: string;
  items: string[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  hint?: string;
}

export interface SequencingStep {
  id: string;
  order: number;
  text: string;
}

export interface MiniGameContent {
  title: string;
  theme: string;
  instructions: string;
  engineType: MiniGameEngineType;
  matchingPairs?: MatchingPair[];
  sortingBuckets?: SortingBucket[];
  quizQuestions?: QuizQuestion[];
  sequencingSteps?: SequencingStep[];
  successMessage: string;
}

// 4. Music Track Structure
export interface MusicContent {
  title: string;
  genre: string;
  mood: string;
  tempoBpm: number;
  durationSeconds: number;
  lyricsOrStructure?: string;
  audioUrl?: string;             // Blob URL or base64
  modelUsed: "lyria-3-clip" | "lyria-3-pro" | "synth-audio";
  purpose: "mnemonic_song" | "calming_focus" | "reward_jingle" | "transition_cue";
}

// 5. Narration Audio Structure
export interface NarrationSegment {
  segmentIndex: number;
  text: string;
  audioUrl?: string;
  durationSeconds?: number;
}

export interface NarrationContent {
  title: string;
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  speed: number;
  fullTranscript: string;
  audioUrl?: string;
  segments?: NarrationSegment[];
}

// 6. Video Clip Structure
export interface VideoSceneItem {
  sceneNumber: number;
  visualDescription: string;
  durationSeconds: number;
  narrationCue: string;
  videoUrl?: string;
}

export interface VideoContent {
  title: string;
  theme: string;
  scenes: VideoSceneItem[];
  videoUrl?: string;             // Main combined video or clip URL
  hasNarration: boolean;
  hasMusic: boolean;
  modelUsed: string;
}

// ────────────────────────────────────────────────────────────────────────────
// AI Special Education Instructional Planning Assistant
//
// Workflow:
//   Present Level → Skill Gap → IEP Goal → Accommodations/Modifications →
//   Differentiated Lesson → Worksheet/Homework → Assessment → Progress Data →
//   AI Analysis → Adjusted Instruction
// ────────────────────────────────────────────────────────────────────────────

// ── Stage 1: raw present-level data entered / uploaded by the teacher ────────
export interface PresentLevelInput {
  subjectArea: string;                 // e.g. "Mathematics", "Reading"
  currentGradeLevel: string;           // e.g. "5th"
  currentInstructionalLevel: string;   // e.g. "early 3rd grade computation"
  currentAcademicSkills: string;
  areasOfStrength: string;
  areasOfWeakness: string;
  assessmentResults: string;
  classroomPerformance: string;
  previousGoalsAndProgress: string;
  teacherObservations: string;
  rawNotes?: string;                   // pasted text / extracted document text
}

// ── Stage 1: AI analysis output — answers the four required questions ───────
export interface SkillGapAnalysis {
  canDoNow: string[];                  // What can the student currently do?
  needsToImprove: string[];            // What skills does the student need to improve?
  distanceFromGradeLevel: string;      // How far from grade-level expectations?
  targetSkill: string;                 // Specific academic skill to target in the IEP
  prioritizedSkillGaps: string[];      // Ordered list of gaps, most urgent first
}

export interface PLAAFPAnalysis {
  plaafpStatement: string;             // generated PLAAFP narrative
  skillGaps: SkillGapAnalysis;
  subjectArea: string;
  instructionalLevel: string;
}

// ── Stage 2: recommended measurable, individualized annual IEP goal ────────
export interface ShortTermObjective {
  order: number;
  text: string;
  targetDate?: string;                 // ISO date, if benchmarked
}

export interface RecommendedIEPGoal {
  targetSkill: string;
  baselineStatement: string;           // narrative baseline
  baselineValue: number;
  annualGoalText: string;              // the measurable annual goal statement
  category: GoalCategory;
  measurementUnit: MeasurementUnit;
  targetValue: number;
  trialsDenominator?: number;
  measurementCriteria: string;         // how progress is measured
  masteryCriteria: string;             // what counts as mastered
  progressMonitoringMethod: string;    // e.g. "weekly curriculum-based probes"
  shortTermObjectives: ShortTermObjective[];
  rationale: string;                   // why it is set to the instructional level
}

// ── Stage 4: scaffolded instructional unit (lesson sequence) ──────────────
export interface InstructionalUnitStep {
  order: number;
  title: string;                       // e.g. "Review prerequisite skills"
  objective: string;
  activities: string[];
  scaffolds: string[];                 // supports for the current instructional level
  accommodationsApplied: string[];     // which accommodations this step builds in
  checkForUnderstanding: string;
}

export interface InstructionalUnitContent {
  title: string;
  targetSkill: string;
  instructionalLevel: string;
  theme: string;                       // student interest woven through the unit
  accommodationsSummary: string[];
  steps: InstructionalUnitStep[];
  masteryAssessment: string;
}

// ── Stage 5: differentiated worksheets & homework ────────────────────────
export type WorksheetPurpose =
  | "practice"
  | "guided_practice"
  | "independent_practice"
  | "homework"
  | "exit_ticket"
  | "quiz"
  | "progress_monitoring"
  | "review";

export type WorksheetQuestionType =
  | "multiple_choice"
  | "short_answer"
  | "fill_in_blank"
  | "matching"
  | "word_problem"
  | "mixed";

export type ScaffoldingLevel = "none" | "light" | "moderate" | "heavy";

export interface WorksheetSpec {
  purpose: WorksheetPurpose;
  numQuestions: number;
  difficultyLevel: number;             // 1–5, ramps up as the student demonstrates mastery
  questionType: WorksheetQuestionType;
  readingLevel: string;
  scaffolding: ScaffoldingLevel;
  includeAnswerKey: boolean;
  includeVisualSupports: boolean;
  modifiedProblems: boolean;           // reduced complexity / modified assignment
  printable: boolean;
}

export interface WorksheetItem {
  number: number;
  prompt: string;
  type: WorksheetQuestionType;
  choices?: string[];
  answer: string;
  workingSpace?: boolean;              // render blank work area under the item
  scaffold?: string;                   // hint / worked step shown when scaffolding is on
  visualSupport?: string;              // description of an icon / diagram / manipulative
}

export interface WorksheetAnswerKeyEntry {
  number: number;
  answer: string;
  explanation?: string;
}

export interface WorksheetContent {
  title: string;
  purpose: WorksheetPurpose;
  targetSkill: string;
  instructionalLevel: string;
  readingLevel: string;
  difficultyLevel: number;
  theme: string;
  instructions: string;
  accommodationsApplied: string[];
  items: WorksheetItem[];
  answerKey: WorksheetAnswerKeyEntry[];
  teacherNotes: string;
  printable: boolean;
}

// ── Stage 6: progress analysis toward the IEP goal ──────────────────────
export interface ProgressAnalysis {
  goalId: string;
  observations: number;
  currentAccuracy: number | null;      // latest value, normalized to the goal's unit
  averageAccuracy: number | null;
  masteryPercent: number | null;       // progress from baseline toward target, %
  trendStatus: TrendStatus;
  projectedValue: number | null;
  strugglingAreas: string[];
  nextInstructionalStep: string;
  recommendedDifficultyLevel: number;  // 1–5, feeds the next worksheet
  adequateProgress: boolean;
  narrative: string;
  createdAt: string;
}

// ────────────────────────────────────────────────────────────────────────────
// First-Day Materials Hub
//
// Unlike GeneratedMaterial, these are NOT tied to a student profile or IEP
// goal — they're first-day-of-class materials (slide deck, webpage, video)
// covering five categories:
//   1. "teacher_intro"           — introduces the teacher themself
//   2. "classroom_expectations"  — classroom rules, routines & procedures
//   3. "icebreaker_activities"   — get-to-know-you activities for day one
//   4. "family_letter"           — welcome letter home to families
//   5. "getting_to_know_you"     — printable "about me" questionnaire for students
// ────────────────────────────────────────────────────────────────────────────
export type FirstDayMaterialCategory =
  | "teacher_intro"
  | "classroom_expectations"
  | "icebreaker_activities"
  | "family_letter"
  | "getting_to_know_you";

export interface TeacherProfile {
  id: string;                    // singleton row, always "current-teacher"
  name: string;
  roleTitle: string;             // e.g. "5th Grade Special Education Teacher"
  subjectsOrGrades: string;      // e.g. "Grades 3-5 Resource Room"
  yearsExperience?: string;
  hobbiesAndInterests: string[]; // e.g. ["Hiking", "Baking", "Board Games"]
  funFacts: string[];            // e.g. ["I once met an astronaut"]
  favoriteQuote?: string;
  teachingPhilosophy?: string;
  funLearningGoalForStudents?: string; // what you hope students take away
  contactInfo?: string;          // e.g. "Room 204 · Office hours Tue/Thu 3-4pm"
  themeColor?: string;           // hex accent color for generated materials
  photoDataUrl?: string;         // optional base64 self-portrait / avatar
  createdAt: string;
  updatedAt: string;
}

// Teacher's own classroom rules, routines & expectations — used to generate
// first-day "how our classroom works" materials.
export interface ClassroomProfile {
  id: string;                    // singleton row, always "current-classroom"
  classroomName?: string;        // e.g. "Room 204" or a themed name
  rules: string[];               // e.g. ["Be respectful", "Raise your hand to speak"]
  routines: string[];            // e.g. ["Morning check-in at the door", "Line up quietly for lunch"]
  rewardsSystem?: string;        // e.g. "Class points redeemable for a Friday game"
  consequencesSystem?: string;   // e.g. "Verbal reminder -> visual warning -> brief break -> parent contact"
  theme?: string;                // e.g. "Space Explorer Classroom" — woven into generated materials
  additionalNotes?: string;
  themeColor?: string;           // hex accent color for generated materials
  createdAt: string;
  updatedAt: string;
}

// Icebreaker activities to help students get to know each other on day one.
export interface IcebreakerProfile {
  id: string;                    // singleton row, always "current-icebreakers"
  theme?: string;                // e.g. "Space Explorers" — woven into generated activities
  groupSize: string;             // e.g. "Whole class", "Small groups of 4", "Pairs"
  durationMinutes?: string;      // e.g. "10-15 minutes"
  numberOfActivities: number;    // e.g. 3
  activityStyles: string[];      // e.g. ["Get-to-know-you questions", "Movement games", "Team challenges"]
  specialConsiderations?: string; // sensory/communication accommodations to build in
  additionalNotes?: string;
  themeColor?: string;           // hex accent color for generated materials
  createdAt: string;
  updatedAt: string;
}

// A printable "get to know you" questionnaire for students to fill out.
// Family Welcome Letter has no dedicated profile — it's generated from the
// existing TeacherProfile (+ optional ClassroomProfile) instead.
export interface SurveyProfile {
  id: string;                    // singleton row, always "current-survey"
  title: string;                 // e.g. "All About Me!"
  introMessage?: string;         // short instructions shown at the top
  questions: string[];           // open-ended getting-to-know-you prompts
  theme?: string;                // e.g. "Space Explorers" — woven into generated materials
  themeColor?: string;           // hex accent color for generated materials
  createdAt: string;
  updatedAt: string;
}

export type FirstDayMaterialFormat = "slide_deck" | "html_page" | "video_clip";

export interface FirstDaySection {
  heading: string;
  body: string;
  emoji?: string;
}

// Content structure for the "html_page" format — a standalone webpage
export interface FirstDayWebpageContent {
  title: string;
  tagline: string;
  themeColor: string;
  sections: FirstDaySection[];
  highlights: string[];          // fun facts (teacher_intro) or key rules at a glance (classroom_expectations)
  contactBlock?: string;
  html: string;                  // full self-contained HTML fragment to render
}

export type FirstDayMaterialContent = SlideDeckContent | FirstDayWebpageContent | VideoContent;

export interface FirstDayMaterial {
  id: string;
  category: FirstDayMaterialCategory;
  format: FirstDayMaterialFormat;
  status: GenerationStatus;
  title: string;
  description: string;
  promptUsed: string;
  modelUsed: string;
  generationCostEstimate?: number;
  contentJson?: string;          // Serialized FirstDayMaterialContent
  blobKeys?: string[];
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Root planning document stored in IndexedDB ──────────────────────────
export type PlanningSessionStatus = "draft" | "goal_committed" | "active";

export interface PlanningSession {
  id: string;
  profileId: string;                   // FK → StudentIEPProfile.id
  goalId?: string;                     // FK → IEPGoal.id, set once the goal is committed
  subjectArea: string;
  status: PlanningSessionStatus;
  input: PresentLevelInput;
  plaafp?: PLAAFPAnalysis;
  recommendedGoal?: RecommendedIEPGoal;
  accommodationsSelected: string[];    // snapshot of accommodation texts to apply
  instructionalUnit?: InstructionalUnitContent;
  progressAnalyses: ProgressAnalysis[];// appended over time (Stage 6)
  createdAt: string;
  updatedAt: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Settings & AI Usage Tracking
//
// Provider preferences are stored client-side (Dexie) and sent along with
// each generation request; the server honors them when the corresponding
// API key is configured, otherwise falls back down its default chain. Usage
// log entries are written after every generation call so the Settings page
// can show a running cost/activity summary — all local, nothing is sent
// anywhere except the generation request itself.
// ────────────────────────────────────────────────────────────────────────────

export interface AppSettings {
  id: "default";
  providerPreferences: ProviderPreferences;
  updatedAt: string;
}

export type UsageFeature =
  | "slide_deck"
  | "board_game"
  | "mini_game"
  | "music"
  | "narration"
  | "video_clip"
  | "worksheet"
  | "plaafp"
  | "iep_goal"
  | "instructional_unit"
  | "progress_analysis"
  | "first_day";

export interface UsageLogEntry {
  id: string;
  feature: UsageFeature;
  provider?: string;
  modelUsed: string;
  costEstimate: number;
  createdAt: string;
}
