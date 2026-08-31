// lib/seed.ts — Realistic placeholder data seeder for SE 3000

import db from "./db";
import type {
  StudentIEPProfile,
  ProgressLogEntry,
  GeneratedMaterial,
  SlideDeckContent,
  MiniGameContent,
  BoardGameContent,
  MusicContent,
  NarrationContent,
  VideoContent
} from "@/types/iep";
import { v4 as uuidv4 } from "uuid";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function futureDate(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

const now = new Date().toISOString();

// ─────────────────────────────────────────────────────────────────────────────
// Student 1: JD — 3rd grade, SLD
// ─────────────────────────────────────────────────────────────────────────────
export const jdId = "seed-student-jd";
export const jdGoal1Id = "seed-goal-jd-1";
export const jdGoal2Id = "seed-goal-jd-2";
export const jdGoal3Id = "seed-goal-jd-3";

export const studentJD: StudentIEPProfile = {
  id: jdId,
  studentInitials: "JD",
  grade: "3rd",
  primaryEligibility: "Specific Learning Disability (SLD)",
  iepAnnualReviewDate: futureDate(60),
  plaafpSummary:
    "JD is a 3rd-grade student with a specific learning disability affecting reading decoding and fluency. On the DIBELS Next assessment, JD scored at the 18th percentile in oral reading fluency (42 wcpm vs. 80 wcpm benchmark). JD demonstrates strong verbal reasoning and benefits from explicit phonics instruction, extended time, and chunked reading passages.",
  learningProfile: {
    readingLevel: "Early 2nd Grade (decoding vowel digraphs, needs chunked passages)",
    comprehensionLevel: "Literal comprehension, responds well to visual story maps and 2-step instructions",
    communicationNeeds: ["verbal", "visual_supports"],
    sensoryConsiderations: ["sound_sensitivity", "fidget_needs", "calm_environment"],
    interests: ["Dinosaurs", "Fossils & Paleontology", "Lego Building", "Space Rockets"],
    preferredModality: ["visual", "hands_on", "kinesthetic"],
    additionalNotes:
      "Thrives when dinosaurs or building blocks are incorporated into reading prompts. Needs high contrast visuals and minimal visual clutter.",
  },
  goals: [
    {
      id: jdGoal1Id,
      goalText:
        "When presented with a grade-level passage, JD will read aloud with 80% accuracy across 4 of 5 consecutive trials, as measured by running records.",
      category: "academic",
      baselineValue: 55,
      targetValue: 80,
      measurementUnit: "%",
      trialsDenominator: 5,
      reviewDate: futureDate(60),
      createdAt: now,
    },
    {
      id: jdGoal2Id,
      goalText:
        "JD will solve multi-step word problems independently, completing at least 7 out of 10 problems correctly in 4 of 5 sessions.",
      category: "academic",
      baselineValue: 3,
      targetValue: 7,
      measurementUnit: "count",
      trialsDenominator: 10,
      reviewDate: futureDate(60),
      createdAt: now,
    },
    {
      id: jdGoal3Id,
      goalText:
        "JD will remain on-task during independent work periods for at least 15 consecutive minutes without redirection, in 4 of 5 observations.",
      category: "behavioral",
      baselineValue: 4,
      targetValue: 15,
      measurementUnit: "minutes",
      reviewDate: futureDate(60),
      createdAt: now,
    },
  ],
  services: [
    {
      id: "seed-svc-jd-1",
      type: "specialized_instruction",
      mandatedMinutesPerWeek: 300,
      deliveredMinutesThisWeek: 285,
    },
    {
      id: "seed-svc-jd-2",
      type: "speech_language",
      mandatedMinutesPerWeek: 60,
      deliveredMinutesThisWeek: 30,
    },
  ],
  accommodations: [
    { id: uuidv4(), category: "testing", text: "Extended time (1.5×) on all assessments", active: true },
    { id: uuidv4(), category: "testing", text: "Quiet, separate testing environment", active: true },
    { id: uuidv4(), category: "testing", text: "Directions read aloud", active: true },
    { id: uuidv4(), category: "instructional", text: "Chunked reading passages with visual breaks", active: true },
    { id: uuidv4(), category: "instructional", text: "Graphic organizers for writing tasks", active: true },
    { id: uuidv4(), category: "instructional", text: "Preferential seating near instruction", active: true },
    { id: uuidv4(), category: "environmental", text: "Noise-reducing headphones available", active: true },
    { id: uuidv4(), category: "environmental", text: "Fidget tool permitted at desk", active: false },
  ],
  createdAt: now,
  updatedAt: now,
};

// ─────────────────────────────────────────────────────────────────────────────
// Student 2: MR — 5th grade, Autism
// ─────────────────────────────────────────────────────────────────────────────
export const mrId = "seed-student-mr";
export const mrGoal1Id = "seed-goal-mr-1";
export const mrGoal2Id = "seed-goal-mr-2";
export const mrGoal3Id = "seed-goal-mr-3";
export const mrGoal4Id = "seed-goal-mr-4";

export const studentMR: StudentIEPProfile = {
  id: mrId,
  studentInitials: "MR",
  grade: "5th",
  primaryEligibility: "Autism Spectrum Disorder (ASD)",
  iepAnnualReviewDate: futureDate(90),
  plaafpSummary:
    "MR is a 5th-grade student with Autism Spectrum Disorder. MR demonstrates strong visual-spatial abilities and excels in math computation. Areas of need include initiating social interactions with peers, producing extended written responses, and self-regulating emotional responses during unstructured times. MR benefits from visual schedules, advance notice of transitions, and social skills coaching.",
  learningProfile: {
    readingLevel: "4th Grade (strong sight word vocabulary, needs support with abstract inference)",
    comprehensionLevel: "Excels with concrete sequences and visual rule boards; literal processing",
    communicationNeeds: ["verbal", "visual_supports", "picture_exchange"],
    sensoryConsiderations: ["light_sensitivity", "sound_sensitivity", "minimal_visual_clutter"],
    interests: ["Minecraft", "Outer Space & Planets", "Robotics", "Train Schedules"],
    preferredModality: ["visual", "solitary", "reading_writing"],
    additionalNotes:
      "Responds exceptionally well to visual timers, structured choice boards, and Minecraft-themed social scripts.",
  },
  goals: [
    {
      id: mrGoal1Id,
      goalText:
        "MR will independently initiate a peer interaction (greeting, question, or comment) at least 3 times per 30-minute unstructured period, across 4 of 5 observed sessions.",
      category: "social_emotional",
      baselineValue: 0,
      targetValue: 3,
      measurementUnit: "count",
      reviewDate: futureDate(90),
      createdAt: now,
    },
    {
      id: mrGoal2Id,
      goalText:
        "MR will produce written sentences at a rate of at least 12 correct word sequences per minute on a 3-minute writing probe, across 3 of 4 probes.",
      category: "academic",
      baselineValue: 5,
      targetValue: 12,
      measurementUnit: "frequency",
      reviewDate: futureDate(90),
      createdAt: now,
    },
    {
      id: mrGoal3Id,
      goalText:
        "MR will use a self-regulation strategy (deep breathing, break card, or self-talk) independently when experiencing frustration, rated 4 or 5 on a 5-point self-regulation scale, in 4 of 5 observations.",
      category: "behavioral",
      baselineValue: 1,
      targetValue: 4,
      measurementUnit: "rating_scale",
      reviewDate: futureDate(90),
      createdAt: now,
    },
    {
      id: mrGoal4Id,
      goalText:
        "MR will produce target speech sounds (/r/ and /s/ blends) with 85% accuracy across 4 of 5 speech therapy sessions.",
      category: "communication",
      baselineValue: 45,
      targetValue: 85,
      measurementUnit: "%",
      reviewDate: futureDate(90),
      createdAt: now,
    },
  ],
  services: [
    {
      id: "seed-svc-mr-1",
      type: "speech_language",
      mandatedMinutesPerWeek: 90,
      deliveredMinutesThisWeek: 90,
    },
    {
      id: "seed-svc-mr-2",
      type: "occupational_therapy",
      mandatedMinutesPerWeek: 60,
      deliveredMinutesThisWeek: 60,
    },
    {
      id: "seed-svc-mr-3",
      type: "counseling",
      mandatedMinutesPerWeek: 30,
      deliveredMinutesThisWeek: 0,
    },
  ],
  accommodations: [
    { id: uuidv4(), category: "testing", text: "Extended time (1.5×)", active: true },
    { id: uuidv4(), category: "testing", text: "Written responses may be dictated", active: true },
    { id: uuidv4(), category: "instructional", text: "Visual schedule posted at desk", active: true },
    { id: uuidv4(), category: "instructional", text: "Advance notice of transitions (5-min warning)", active: true },
    { id: uuidv4(), category: "instructional", text: "Choice board for task completion order", active: true },
    { id: uuidv4(), category: "environmental", text: "Designated calm-down corner access", active: true },
    { id: uuidv4(), category: "environmental", text: "Reduced sensory distractors (dimmer lighting available)", active: true },
  ],
  createdAt: now,
  updatedAt: now,
};

// ─────────────────────────────────────────────────────────────────────────────
// Progress Log Entries
// ─────────────────────────────────────────────────────────────────────────────
function makeLog(
  profileId: string,
  goalId: string,
  daysBack: number,
  value: number,
  note?: string
): ProgressLogEntry {
  return {
    id: uuidv4(),
    profileId,
    goalId,
    date: daysAgo(daysBack),
    value,
    note,
    createdAt: now,
  };
}

export const seedLogs: ProgressLogEntry[] = [
  // JD Goal 1 — reading accuracy (baseline 55%, target 80%)
  makeLog(jdId, jdGoal1Id, 56, 58, "Running record on Biscuit series — sounded out multi-syllabic words with prompting"),
  makeLog(jdId, jdGoal1Id, 49, 61),
  makeLog(jdId, jdGoal1Id, 42, 60, "Struggled with vowel digraphs"),
  makeLog(jdId, jdGoal1Id, 35, 63),
  makeLog(jdId, jdGoal1Id, 28, 65, "Used finger-pointing strategy independently"),
  makeLog(jdId, jdGoal1Id, 21, 67),
  makeLog(jdId, jdGoal1Id, 14, 70, "Strong session — read with expression"),
  makeLog(jdId, jdGoal1Id, 7, 72),
  makeLog(jdId, jdGoal1Id, 2, 74, "Best session to date"),

  // JD Goal 2 — math problems
  makeLog(jdId, jdGoal2Id, 54, 3, "Used manipulatives for all problems"),
  makeLog(jdId, jdGoal2Id, 47, 4),
  makeLog(jdId, jdGoal2Id, 40, 3, "Distracted day — reassessed the following session"),
  makeLog(jdId, jdGoal2Id, 33, 4),
  makeLog(jdId, jdGoal2Id, 26, 5, "Independently drew diagrams"),
  makeLog(jdId, jdGoal2Id, 19, 5),
  makeLog(jdId, jdGoal2Id, 12, 6, "Only needed one re-read prompt"),
  makeLog(jdId, jdGoal2Id, 5, 6),

  // JD Goal 3 — on-task minutes
  makeLog(jdId, jdGoal3Id, 50, 5, "Needed redirection after 5 minutes"),
  makeLog(jdId, jdGoal3Id, 43, 6),
  makeLog(jdId, jdGoal3Id, 36, 7, "Fidget tool helped"),
  makeLog(jdId, jdGoal3Id, 29, 8),
  makeLog(jdId, jdGoal3Id, 22, 9, "Clear task checklist posted — very helpful"),
  makeLog(jdId, jdGoal3Id, 15, 10),
  makeLog(jdId, jdGoal3Id, 8, 11),
  makeLog(jdId, jdGoal3Id, 3, 12, "New personal record"),

  // MR Goal 1 — social initiations
  makeLog(mrId, mrGoal1Id, 85, 0, "No spontaneous initiations observed"),
  makeLog(mrId, mrGoal1Id, 78, 0),
  makeLog(mrId, mrGoal1Id, 71, 1, "Greeted a peer at lunch with minimal prompting"),
  makeLog(mrId, mrGoal1Id, 64, 1),
  makeLog(mrId, mrGoal1Id, 57, 1, "Used conversation starter card"),
  makeLog(mrId, mrGoal1Id, 50, 2, "Asked two peers to play at recess"),
  makeLog(mrId, mrGoal1Id, 43, 2),
  makeLog(mrId, mrGoal1Id, 36, 2, "Initiated conversation about Minecraft independently"),
  makeLog(mrId, mrGoal1Id, 29, 2),
  makeLog(mrId, mrGoal1Id, 15, 3, "Met goal in this session!"),
  makeLog(mrId, mrGoal1Id, 5, 3, "Consistent — initiated greetings + one topic-sharing"),

  // MR Goal 2 — writing fluency
  makeLog(mrId, mrGoal2Id, 80, 5),
  makeLog(mrId, mrGoal2Id, 73, 6, "Used sentence starter strips"),
  makeLog(mrId, mrGoal2Id, 66, 6),
  makeLog(mrId, mrGoal2Id, 59, 7),
  makeLog(mrId, mrGoal2Id, 52, 7, "Stronger with narrative prompts vs. expository"),
  makeLog(mrId, mrGoal2Id, 45, 8),
  makeLog(mrId, mrGoal2Id, 38, 9, "Used graphic organizer — very effective"),
  makeLog(mrId, mrGoal2Id, 24, 9),
  makeLog(mrId, mrGoal2Id, 10, 10),

  // MR Goal 3 — self-regulation
  makeLog(mrId, mrGoal3Id, 82, 1, "Meltdown during math — no strategy use observed"),
  makeLog(mrId, mrGoal3Id, 75, 1),
  makeLog(mrId, mrGoal3Id, 68, 2, "Used break card once with verbal prompt"),
  makeLog(mrId, mrGoal3Id, 61, 2),
  makeLog(mrId, mrGoal3Id, 54, 2, "Self-identified frustration — asked for a break"),
  makeLog(mrId, mrGoal3Id, 47, 3, "Used deep breathing independently"),
  makeLog(mrId, mrGoal3Id, 40, 3),
  makeLog(mrId, mrGoal3Id, 26, 3, "Calm during transition — used self-talk visibly"),
  makeLog(mrId, mrGoal3Id, 12, 3),
  makeLog(mrId, mrGoal3Id, 4, 4, "Excellent session — proactive strategy use"),

  // MR Goal 4 — articulation accuracy
  makeLog(mrId, mrGoal4Id, 84, 47),
  makeLog(mrId, mrGoal4Id, 77, 50, "Good /s/ production in isolation"),
  makeLog(mrId, mrGoal4Id, 70, 52),
  makeLog(mrId, mrGoal4Id, 63, 55, "Generalizing /s/ to single words"),
  makeLog(mrId, mrGoal4Id, 56, 58),
  makeLog(mrId, mrGoal4Id, 49, 60),
  makeLog(mrId, mrGoal4Id, 42, 63, "/r/ emerging in word-initial position"),
  makeLog(mrId, mrGoal4Id, 35, 65),
  makeLog(mrId, mrGoal4Id, 28, 67),
  makeLog(mrId, mrGoal4Id, 21, 70, "Carryover to classroom noted by teacher"),
  makeLog(mrId, mrGoal4Id, 14, 72),
  makeLog(mrId, mrGoal4Id, 7, 75, "Strong across all target sounds"),
  makeLog(mrId, mrGoal4Id, 2, 77),
];

// ─────────────────────────────────────────────────────────────────────────────
// Sample Seed Generated Materials (High-quality initial showcase)
// ─────────────────────────────────────────────────────────────────────────────
const sampleSlideDeck: SlideDeckContent = {
  title: "Dino Dig: Vowel Digraph Phonics Adventure",
  topic: "Reading accuracy with long vowel teams (ai, ay, ee, ea)",
  targetSkill: "Read aloud grade-level text with 80% accuracy",
  readingLevel: "Early 2nd Grade",
  theme: "Dinosaurs & Fossil Excavation",
  slides: [
    {
      slideNumber: 1,
      title: "Welcome, Fossil Hunter JD!",
      content: [
        "Today we are exploring the Dino Dig Site.",
        "We will search for hidden vowel team fossils.",
        "Spot the sound, read the word, and unlock a new dinosaur!"
      ],
      teacherNotes: "Point to the title and invite student to read 'Dino Dig' aloud.",
      imagePrompt: "A friendly young paleontologist with a magnifying glass at a sunny dinosaur fossil excavation site, cheerful cartoon style",
    },
    {
      slideNumber: 2,
      title: "Vowel Team: 'ai' and 'ay' (Long A)",
      content: [
        "When two vowels go walking, the first one does the talking!",
        "T-Rex has a long **tail**.",
        "The sun came out to bright the **day**.",
        "We rode the fossil **train** to the quarry."
      ],
      teacherNotes: "Encourage JD to trace under 'ai' in tail and train with their finger.",
      interactiveQuestion: {
        question: "Which dinosaur word has the /ai/ sound?",
        options: ["Trail", "Rock", "Bone", "Dig"],
        correctIndex: 0,
        explanation: "Great job! 'Trail' has the /ai/ vowel team!"
      }
    },
    {
      slideNumber: 3,
      title: "Vowel Team: 'ee' and 'ea' (Long E)",
      content: [
        "Stegosaurus likes to **eat** green leaves.",
        "Look **deep** in the canyon sand.",
        "A Velociraptor is fast on its **feet**!",
        "Can you find the hidden **beak**?"
      ],
      teacherNotes: "Have student read each sentence aloud. Prompt for chunking multi-syllable dinosaur names.",
      interactiveQuestion: {
        question: "Find the word with the long 'ee' sound:",
        options: ["Sand", "Feet", "Claw", "Dust"],
        correctIndex: 1,
        explanation: "Spot on! 'Feet' has the /ee/ vowel team!"
      }
    },
    {
      slideNumber: 4,
      title: "Story Passage: The Brachiosaurus Snack",
      content: [
        "The tall **green** Brachiosaurus walked down the **trail**.",
        "He stopped by the **stream** to take a drink.",
        "He reached up high to **reach** a sweet leaf **treat**.",
        "JD smiled as the dinosaur gave a happy **bleat**!"
      ],
      teacherNotes: "Running record passage. Note reading accuracy and encourage self-correction.",
    },
    {
      slideNumber: 5,
      title: "Mission Accomplished! 🦕",
      content: [
        "You excavated 8 vowel digraph words!",
        "Accuracy score: Excellent progress toward 80% goal.",
        "Collect your Golden Raptor Badge!"
      ],
      teacherNotes: "Offer positive behavioral praise for persistence and focus.",
    }
  ]
};

const sampleMiniGame: MiniGameContent = {
  title: "Dino Vowel Matcher",
  theme: "Dinosaur Fossil Hunting",
  instructions: "Match each dinosaur fossil clue to its correct vowel digraph word!",
  engineType: "matching",
  matchingPairs: [
    { id: "p1", prompt: "A dinosaur's long appendage", match: "T-Rex Tail (ai)" },
    { id: "p2", prompt: "What herbivores love to do", match: "Eat Greens (ea)" },
    { id: "p3", prompt: "The path to the dig site", match: "Excavation Trail (ai)" },
    { id: "p4", prompt: "Stegosaurus stands on these", match: "Sturdy Feet (ee)" },
    { id: "p5", prompt: "Where dinos drink water", match: "Cool Stream (ea)" },
    { id: "p6", prompt: "T-Rex sharp smile", match: "Clean Teeth (ee)" },
  ],
  successMessage: "Roar! You matched all the fossil vowel teams!"
};

const sampleBoardGame: BoardGameContent = {
  gameTitle: "Jurassic Phonics Expedition",
  theme: "Dinosaur Fossil Excavation",
  targetSkill: "Vowel digraph phonics & decoding fluency",
  objective: "Travel from the Field Camp to the Crystal Cavern by reading vowel team cards!",
  playerCount: "1–4 Players",
  materialsNeeded: ["Printable board sheet", "20 Phonics cards", "1 Die", "Dino markers"],
  rules: [
    "Place all players on the 'Base Camp' start tile.",
    "On your turn, roll the die and move forward that many spaces.",
    "If you land on a Fossil Challenge tile, draw a card and read the target word or sentence aloud.",
    "If you read correctly, stay on the tile; if you need teacher support, gain 1 practice token.",
    "First paleontologist to reach the Crystal Cavern wins!"
  ],
  tiles: [
    { index: 1, label: "Base Camp", type: "start", promptText: "Gear up!" },
    { index: 2, label: "Raptor Ridge", type: "challenge", promptText: "Draw a card: Read word with 'ai'" },
    { index: 3, label: "Geyser Leap", type: "bonus", promptText: "Jump ahead 1 space!" },
    { index: 4, label: "T-Rex Footprint", type: "challenge", promptText: "Draw a card: Read sentence with 'ee'" },
    { index: 5, label: "Amber Grove", type: "rest", promptText: "Take a calming breath" },
    { index: 6, label: "Pterodactyl Nest", type: "challenge", promptText: "Draw a card: Spell /ea/ word" },
    { index: 7, label: "Bone Quarry", type: "challenge", promptText: "Draw a card: Rapid read 3 words" },
    { index: 8, label: "Mud Pit", type: "challenge", promptText: "Sound out a 2-syllable dino word" },
    { index: 9, label: "Volcano Pass", type: "bonus", promptText: "Roll again!" },
    { index: 10, label: "Crystal Cavern", type: "finish", promptText: "Victory! You decoded the secret fossil!" }
  ],
  cards: [
    { id: "c1", category: "Word Card", questionOrTask: "Read aloud: 'TRAIN'", answerOrCriteria: "Correctly identifies /ai/ sound" },
    { id: "c2", category: "Word Card", questionOrTask: "Read aloud: 'BEAST'", answerOrCriteria: "Correctly identifies /ea/ sound" },
    { id: "c3", category: "Word Card", questionOrTask: "Read aloud: 'SPEED'", answerOrCriteria: "Correctly identifies /ee/ sound" },
    { id: "c4", category: "Sentence Card", questionOrTask: "Read aloud: 'The brave T-Rex crossed the stream.'", answerOrCriteria: "80%+ accuracy" },
    { id: "c5", category: "Challenge Card", questionOrTask: "Name two dinosaurs that start with a vowel sound!", answerOrCriteria: "Engages verbal retrieval" }
  ],
  printableInstructions: "Print on standard 8.5x11 cardstock. Cut along dashed card borders."
};

const sampleMusic: MusicContent = {
  title: "Dino Vowel Team Anthem",
  genre: "Upbeat Acoustic / Educational Jingle",
  mood: "Energetic, Encouraging, Rhythmic",
  tempoBpm: 110,
  durationSeconds: 32,
  modelUsed: "lyria-3-clip",
  purpose: "mnemonic_song",
  lyricsOrStructure:
    "[Intro: Fun acoustic guitar & handclaps]\n" +
    "When A and I go walking down the track,\n" +
    "A says its name and I looks back!\n" +
    "Tail, Trail, Rain and Train,\n" +
    "Dino reading in our brain!\n" +
    "[Outro: Cheerful dinosaur roar]"
};

const sampleNarration: NarrationContent = {
  title: "Dino Dig Read-Along Narration",
  voice: "nova",
  speed: 0.9,
  fullTranscript:
    "Welcome to the Dino Dig, JD! Today we are looking for vowel digraph fossils. Look closely at the words 'trail', 'stream', and 'feet'. Take your time, sound out each part, and let's discover some awesome dinosaurs together!",
  segments: [
    { segmentIndex: 1, text: "Welcome to the Dino Dig, JD!", durationSeconds: 3 },
    { segmentIndex: 2, text: "Today we are looking for vowel digraph fossils.", durationSeconds: 4 },
    { segmentIndex: 3, text: "Look closely at the words trail, stream, and feet.", durationSeconds: 4 },
    { segmentIndex: 4, text: "Take your time, sound out each part, and let's discover some awesome dinosaurs together!", durationSeconds: 6 }
  ]
};

const sampleVideo: VideoContent = {
  title: "Vowel Digraph Expedition Clip",
  theme: "Dinosaur Fossil World",
  hasNarration: true,
  hasMusic: true,
  modelUsed: "veo-3.1-fast",
  scenes: [
    {
      sceneNumber: 1,
      visualDescription: "Sun rises over a vibrant cartoon dinosaur excavation quarry with colorful layers of earth.",
      durationSeconds: 4,
      narrationCue: "Welcome to the Jurassic Phonics Quarry!"
    },
    {
      sceneNumber: 2,
      visualDescription: "A friendly cartoon Stegosaurus uncovers a glowing fossil stone marked with the letters 'AI'.",
      durationSeconds: 4,
      narrationCue: "Uncover the vowel teams to unlock the story!"
    }
  ]
};

export const seedMaterials: GeneratedMaterial[] = [
  {
    id: "seed-mat-jd-1",
    profileId: jdId,
    goalId: jdGoal1Id,
    type: "slide_deck",
    status: "ready",
    title: sampleSlideDeck.title,
    description: "5-slide interactive lesson on vowel digraphs themed around dinosaurs.",
    promptUsed: "Generate an individualized 5-slide lesson for JD targeting reading accuracy with dinosaur theme...",
    modelUsed: "gemini-2.5-flash",
    generationCostEstimate: 0.02,
    contentJson: JSON.stringify(sampleSlideDeck),
    createdAt: daysAgo(5),
    updatedAt: daysAgo(5)
  },
  {
    id: "seed-mat-jd-2",
    profileId: jdId,
    goalId: jdGoal1Id,
    type: "mini_game",
    status: "ready",
    title: sampleMiniGame.title,
    description: "Interactive matching game connecting dino clues to long vowel team words.",
    promptUsed: "Generate a browser mini-game targeting long vowel phonics...",
    modelUsed: "gemini-2.5-flash",
    generationCostEstimate: 0.01,
    contentJson: JSON.stringify(sampleMiniGame),
    createdAt: daysAgo(4),
    updatedAt: daysAgo(4)
  },
  {
    id: "seed-mat-jd-3",
    profileId: jdId,
    goalId: jdGoal1Id,
    type: "board_game",
    status: "ready",
    title: sampleBoardGame.gameTitle,
    description: "Printable 10-tile board game with 20 phonics challenge cards and rulebook.",
    promptUsed: "Generate a printable board game targeting reading fluency with dino theme...",
    modelUsed: "gemini-2.5-flash",
    generationCostEstimate: 0.03,
    contentJson: JSON.stringify(sampleBoardGame),
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3)
  },
  {
    id: "seed-mat-jd-4",
    profileId: jdId,
    goalId: jdGoal1Id,
    type: "music",
    status: "ready",
    title: sampleMusic.title,
    description: "32-second upbeat acoustic mnemonic jingle for vowel digraphs.",
    promptUsed: "Generate a 30-second educational mnemonic song about vowel teams...",
    modelUsed: "lyria-3-clip",
    generationCostEstimate: 0.04,
    contentJson: JSON.stringify(sampleMusic),
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2)
  },
  {
    id: "seed-mat-jd-5",
    profileId: jdId,
    goalId: jdGoal1Id,
    type: "narration",
    status: "ready",
    title: sampleNarration.title,
    description: "Calm, paced audio narration with supportive sentence cues.",
    promptUsed: "Narrate the introduction story for JD's reading lesson with warm pacing...",
    modelUsed: "tts-1",
    generationCostEstimate: 0.01,
    contentJson: JSON.stringify(sampleNarration),
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1)
  },
  {
    id: "seed-mat-jd-6",
    profileId: jdId,
    goalId: jdGoal1Id,
    type: "video_clip",
    status: "ready",
    title: sampleVideo.title,
    description: "8-second animated explainer intro clip with synchronized narration cues.",
    promptUsed: "Generate an 8-second video scene showing dinosaur fossil excavation...",
    modelUsed: "veo-3.1-fast",
    generationCostEstimate: 0.40,
    contentJson: JSON.stringify(sampleVideo),
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1)
  }
];

// Module-level lock: prevents concurrent seed calls (React StrictMode fires effects twice)
let seedingPromise: Promise<void> | null = null;

export async function seedIfEmpty() {
  if (seedingPromise) return seedingPromise;

  seedingPromise = (async () => {
    const count = await db.profiles.count();
    if (count > 0) {
      // Check if learningProfile is populated (migrating existing profiles if needed)
      const existing = await db.profiles.get(jdId);
      if (existing && !existing.learningProfile) {
        await db.profiles.bulkPut([studentJD, studentMR]);
      }
      const matCount = await db.generatedMaterials.count();
      if (matCount === 0) {
        await db.generatedMaterials.bulkPut(seedMaterials);
      }
      return;
    }

    await db.transaction("rw", db.profiles, db.progressLogs, db.generatedMaterials, async () => {
      await db.profiles.bulkPut([studentJD, studentMR]);
      await db.progressLogs.bulkPut(seedLogs);
      await db.generatedMaterials.bulkPut(seedMaterials);
    });
    console.info("[SE 3000] Seed data loaded successfully.");
  })();

  return seedingPromise;
}
