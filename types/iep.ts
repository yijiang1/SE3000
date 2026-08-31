// types/iep.ts — Comprehensive type definitions for SE 3000

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
  | "video_clip";

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
