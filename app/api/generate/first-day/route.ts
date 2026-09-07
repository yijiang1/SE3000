// app/api/generate/first-day/route.ts — First-Day Materials generator
//
// Produces first-day-of-class materials that are NOT conditioned on a
// student profile or IEP goal. Five categories share the same three output
// formats (slide deck, standalone HTML webpage, animated video storyboard):
//   - "teacher_intro"           — introduces the teacher, from their own bio
//   - "classroom_expectations"  — classroom rules, routines & procedures
//   - "icebreaker_activities"   — get-to-know-you activities for day one
//   - "family_letter"           — welcome letter home, from the teacher (+ classroom) profile
//   - "getting_to_know_you"     — printable "about me" questionnaire for students

import { NextRequest, NextResponse } from "next/server";
import { generateJSON } from "@/lib/ai/textGen";
import { estimateTextCost, type ProviderPreferences } from "@/lib/ai/providers";
import type {
  TeacherProfile,
  ClassroomProfile,
  IcebreakerProfile,
  SurveyProfile,
  FirstDayMaterialCategory,
  FirstDayMaterialFormat,
  SlideDeckContent,
  VideoContent,
  FirstDayWebpageContent
} from "@/types/iep";
import { formatTeacherContextForPrompt } from "@/lib/generators/teacherContext";
import { formatClassroomContextForPrompt } from "@/lib/generators/classroomContext";
import { formatIcebreakerContextForPrompt } from "@/lib/generators/icebreakerContext";
import { formatSurveyContextForPrompt } from "@/lib/generators/surveyContext";

const CATEGORY_COPY: Record<
  FirstDayMaterialCategory,
  {
    slideIntro: string;
    slideGuidance: string;
    topic: string;
    targetSkill: string;
    videoIntro: string;
    pageIntro: string;
    highlightsLabel: string;
    highlightsHint: string;
  }
> = {
  teacher_intro: {
    slideIntro: "that helps students get to know their teacher",
    slideGuidance: "Weave in the teacher's hobbies, fun facts, and teaching philosophy naturally.",
    topic: "Teacher Introduction",
    targetSkill: "Building classroom rapport & belonging",
    videoIntro: "introducing the teacher",
    pageIntro: "introducing a teacher to their students and families",
    highlightsLabel: "fun facts about the teacher",
    highlightsHint: "✨ Fun Facts About Me",
  },
  classroom_expectations: {
    slideIntro: "that explains how the classroom works — its rules, routines, and expectations",
    slideGuidance: "Present rules and routines in clear, positive, actionable language (what TO do, not just what not to do).",
    topic: "Classroom Expectations",
    targetSkill: "Understanding classroom rules & routines",
    videoIntro: "showing how the classroom works",
    pageIntro: "explaining a classroom's rules, routines, and expectations",
    highlightsLabel: "key rules at a glance",
    highlightsHint: "✨ Our Rules At A Glance",
  },
  icebreaker_activities: {
    slideIntro: "with fun, structured icebreaker activities so students get to know each other",
    slideGuidance: "Give clear step-by-step instructions for each activity, including materials needed and how to adapt it for different group sizes or sensory/communication needs.",
    topic: "Icebreaker Activities",
    targetSkill: "Building peer connections & classroom community",
    videoIntro: "walking through a fun icebreaker activity",
    pageIntro: "listing fun get-to-know-you icebreaker activities for the first day",
    highlightsLabel: "quick activity ideas at a glance",
    highlightsHint: "✨ Quick Activity Ideas",
  },
  family_letter: {
    slideIntro: "that summarizes a welcome letter home to families",
    slideGuidance: "Keep it warm and reassuring — cover who the teacher is, how the classroom works, and how to get in touch.",
    topic: "Family Welcome Letter",
    targetSkill: "Building a home-school partnership",
    videoIntro: "as a short welcome message to families",
    pageIntro: "welcoming a family to the classroom for the school year, written from the teacher",
    highlightsLabel: "a quick-reference summary for families",
    highlightsHint: "✨ Quick Reference For Families",
  },
  getting_to_know_you: {
    slideIntro: "with a fun get-to-know-you interview activity where each slide reveals one question for the class to discuss aloud",
    slideGuidance: "Keep each question big, friendly, and open-ended — this is a verbal share-aloud activity, not a written test.",
    topic: "Getting-to-Know-You Survey",
    targetSkill: "Building peer connections & self-expression",
    videoIntro: "inviting students to fill out a fun about-me questionnaire",
    pageIntro: "a printable \"about me\" questionnaire for students to fill out by hand, with a blank line or box under each question",
    highlightsLabel: "the questions at a glance",
    highlightsHint: "✨ Questions At A Glance",
  },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapWebpageHtml(
  title: string,
  tagline: string,
  color: string,
  sections: { heading: string; body: string; emoji?: string }[],
  highlightsLabel: string,
  highlights: string[],
  contactBlock: string | undefined,
  photoDataUrl?: string
): string {
  const sectionsHtml = sections
    .map(
      (s) => `
      <section class="card">
        <h2>${s.emoji ? `${s.emoji} ` : ""}${escapeHtml(s.heading)}</h2>
        <p>${escapeHtml(s.body)}</p>
      </section>`
    )
    .join("\n");
  const highlightsHtml = highlights.map((f) => `<li>${escapeHtml(f)}</li>`).join("\n");

  return `
<div class="fd-page" style="--accent:${color}">
  <style>
    .fd-page { font-family: ui-sans-serif, system-ui, sans-serif; max-width: 720px; margin: 0 auto; color: #1e293b; }
    .fd-page .hero { text-align: center; padding: 2.5rem 1.5rem; border-radius: 24px; background: linear-gradient(135deg, var(--accent), #1e293b); color: white; margin-bottom: 1.5rem; }
    .fd-page .hero .avatar { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; margin: 0 auto 1rem; display: block; border: 4px solid rgba(255,255,255,0.6); background: rgba(255,255,255,0.15); }
    .fd-page .hero h1 { font-size: 1.75rem; font-weight: 800; margin: 0 0 0.25rem; }
    .fd-page .hero p { opacity: 0.9; margin: 0; font-size: 0.95rem; }
    .fd-page .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 18px; padding: 1.25rem 1.5rem; margin-bottom: 1rem; }
    .fd-page .card h2 { font-size: 1.05rem; font-weight: 700; margin: 0 0 0.5rem; color: var(--accent); }
    .fd-page .card p { margin: 0; line-height: 1.6; font-size: 0.95rem; white-space: pre-line; }
    .fd-page .facts { border-radius: 18px; padding: 1.25rem 1.5rem; background: white; border: 2px dashed var(--accent); }
    .fd-page .facts h2 { font-size: 1.05rem; font-weight: 700; margin: 0 0 0.5rem; color: var(--accent); }
    .fd-page .facts ul { margin: 0; padding-left: 1.25rem; line-height: 1.7; font-size: 0.95rem; }
    .fd-page .contact { text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: #64748b; }
  </style>
  <div class="hero">
    ${photoDataUrl ? `<img class="avatar" src="${photoDataUrl}" alt="${escapeHtml(title)}" />` : ""}
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(tagline)}</p>
  </div>
  ${sectionsHtml}
  <div class="facts">
    <h2>${highlightsLabel}</h2>
    <ul>${highlightsHtml}</ul>
  </div>
  ${contactBlock ? `<p class="contact">${escapeHtml(contactBlock)}</p>` : ""}
</div>
`.trim();
}

// ── Teacher Introduction fallbacks ──────────────────────────────────────
function buildFallbackTeacherWebpage(teacher: TeacherProfile): FirstDayWebpageContent {
  const color = teacher.themeColor || "#4f46e5";
  const sections = [
    { heading: "About Me", emoji: "👋", body: teacher.teachingPhilosophy || `Hi, I'm ${teacher.name}! I'm so excited to be your ${teacher.roleTitle} this year.` },
    { heading: "What I Teach", emoji: "📚", body: `I work with students in ${teacher.subjectsOrGrades}${teacher.yearsExperience ? `, and I've been teaching for ${teacher.yearsExperience}` : ""}.` },
    { heading: "Outside the Classroom", emoji: "🌟", body: `When I'm not teaching, you'll find me enjoying ${teacher.hobbiesAndInterests.join(", ") || "spending time with family and friends"}.` },
    { heading: "My Goal For You", emoji: "🎯", body: teacher.funLearningGoalForStudents || "My goal is to help every student feel confident, supported, and excited to learn this year." },
  ];
  const highlights = teacher.funFacts.length > 0 ? teacher.funFacts : [`I once tried something new just for fun!`];
  return {
    title: `Meet ${teacher.name}!`,
    tagline: `${teacher.roleTitle} · ${teacher.subjectsOrGrades}`,
    themeColor: color,
    sections,
    highlights,
    contactBlock: teacher.contactInfo,
    html: wrapWebpageHtml(`Meet ${teacher.name}!`, `${teacher.roleTitle} · ${teacher.subjectsOrGrades}`, color, sections, CATEGORY_COPY.teacher_intro.highlightsHint, highlights, teacher.contactInfo, teacher.photoDataUrl),
  };
}

function buildFallbackTeacherSlideDeck(teacher: TeacherProfile): SlideDeckContent {
  const hobby = teacher.hobbiesAndInterests[0] || "reading";
  return {
    title: `Meet ${teacher.name}! 👋`,
    topic: "First-Day Teacher Introduction",
    targetSkill: CATEGORY_COPY.teacher_intro.targetSkill,
    readingLevel: "All grade levels",
    theme: hobby,
    slides: [
      {
        slideNumber: 1,
        title: `Welcome! I'm ${teacher.name}`,
        content: [`I'm your ${teacher.roleTitle}.`, `I teach ${teacher.subjectsOrGrades}.`, `I can't wait to get to know each of you this year!`],
        teacherNotes: "Greet the class warmly, make eye contact, and smile — set a welcoming tone for the year.",
        imagePrompt: `A warm, friendly cartoon illustration of a teacher waving hello in a bright classroom.`,
      },
      {
        slideNumber: 2,
        title: "A Little About Me",
        content: [teacher.teachingPhilosophy || "I believe every student can succeed with the right support.", `Outside of school, I love ${teacher.hobbiesAndInterests.join(", ") || "spending time outdoors"}.`],
        teacherNotes: "Share a personal anecdote related to your hobbies to make yourself relatable.",
        imagePrompt: `Illustration representing the teacher's hobby: ${hobby}.`,
      },
      {
        slideNumber: 3,
        title: "Fun Facts About Me",
        content: teacher.funFacts.length > 0 ? teacher.funFacts : ["I love a good challenge!", "I'm always learning something new."],
        teacherNotes: "Invite students to guess which fun fact surprises them most.",
        interactiveQuestion: {
          question: "Which fun fact surprised you the most?",
          options: teacher.funFacts.slice(0, 3).length >= 2 ? teacher.funFacts.slice(0, 3) : ["Fact 1", "Fact 2", "Fact 3"],
          correctIndex: 0,
          explanation: "There's no wrong answer — I loved sharing that with you!",
        },
      },
      {
        slideNumber: 4,
        title: "What I Hope For This Year",
        content: [teacher.funLearningGoalForStudents || "My goal is for every student to feel confident, supported, and excited to learn.", "Let's make this a great year together!"],
        teacherNotes: "Transition into classroom expectations or an icebreaker activity.",
      },
      {
        slideNumber: 5,
        title: "Let's Get to Know Each Other!",
        content: ["Now it's your turn — I can't wait to hear about you too.", teacher.contactInfo || "Feel free to stop by and say hello anytime!"],
        teacherNotes: "Segue into a getting-to-know-you activity or icebreaker game.",
      },
    ],
  };
}

function buildFallbackTeacherVideo(teacher: TeacherProfile): VideoContent {
  const hobby = teacher.hobbiesAndInterests[0] || "learning new things";
  return {
    title: `Meet ${teacher.name}! A First-Day Hello`,
    theme: hobby,
    hasNarration: true,
    hasMusic: true,
    modelUsed: "veo-3.1-fast",
    scenes: [
      { sceneNumber: 1, visualDescription: `A bright, welcoming classroom with warm morning light; a friendly teacher waves at the camera.`, durationSeconds: 4, narrationCue: `Hi everyone! I'm ${teacher.name}, your ${teacher.roleTitle}.` },
      { sceneNumber: 2, visualDescription: `Playful animated icons representing the teacher's hobbies (${teacher.hobbiesAndInterests.join(", ") || hobby}) float across the screen.`, durationSeconds: 4, narrationCue: `When I'm not teaching, I love ${teacher.hobbiesAndInterests.join(", ") || hobby}.` },
      { sceneNumber: 3, visualDescription: `The teacher gives an encouraging thumbs-up as students' silhouettes cheer in the background, warm confetti falls.`, durationSeconds: 4, narrationCue: teacher.funLearningGoalForStudents || "I can't wait for an amazing year together!" },
    ],
  };
}

// ── Classroom Expectations fallbacks ────────────────────────────────────
function buildFallbackClassroomWebpage(classroom: ClassroomProfile): FirstDayWebpageContent {
  const color = classroom.themeColor || "#0891b2";
  const name = classroom.classroomName || "Our Classroom";
  const sections = [
    { heading: "Our Rules", emoji: "📋", body: classroom.rules.join(". ") || "Be respectful, be responsible, and try your best every day." },
    { heading: "Daily Routines", emoji: "🔄", body: classroom.routines.join(". ") || "We'll walk through how each part of our day works together." },
    { heading: "Earning Rewards", emoji: "🏆", body: classroom.rewardsSystem || "We celebrate great choices together as a class." },
    { heading: "Friendly Reminders", emoji: "💡", body: classroom.consequencesSystem || "If a rule is forgotten, we use kind reminders to help get back on track." },
  ];
  const highlights = classroom.rules.length > 0 ? classroom.rules.slice(0, 5) : ["Be kind", "Be safe", "Try your best"];
  return {
    title: `Welcome to ${name}!`,
    tagline: classroom.theme || "How Our Classroom Works",
    themeColor: color,
    sections,
    highlights,
    contactBlock: classroom.additionalNotes,
    html: wrapWebpageHtml(`Welcome to ${name}!`, classroom.theme || "How Our Classroom Works", color, sections, CATEGORY_COPY.classroom_expectations.highlightsHint, highlights, classroom.additionalNotes),
  };
}

function buildFallbackClassroomSlideDeck(classroom: ClassroomProfile): SlideDeckContent {
  const name = classroom.classroomName || "Our Classroom";
  const theme = classroom.theme || "Teamwork";
  const rules = classroom.rules.length > 0 ? classroom.rules : ["Be respectful", "Be responsible", "Be safe"];
  const routines = classroom.routines.length > 0 ? classroom.routines : ["Enter quietly and start our warm-up", "Raise a hand to ask for help"];
  return {
    title: `Welcome to ${name}! 🌟`,
    topic: "First-Day Classroom Expectations",
    targetSkill: CATEGORY_COPY.classroom_expectations.targetSkill,
    readingLevel: "All grade levels",
    theme,
    slides: [
      { slideNumber: 1, title: `Welcome to ${name}!`, content: [`This is our classroom for the year.`, `Today we'll learn how our classroom works together.`], teacherNotes: "Set a warm, structured tone — this is about building shared expectations, not just listing rules.", imagePrompt: `A bright, organized classroom scene with a welcoming banner.` },
      { slideNumber: 2, title: "Our Classroom Rules", content: rules, teacherNotes: "Explain the reasoning behind each rule in simple, positive language.", imagePrompt: `A friendly poster illustrating classroom rules with icons.` },
      { slideNumber: 3, title: "How Our Day Works", content: routines, teacherNotes: "Model each routine live if possible — practice makes it stick.", interactiveQuestion: { question: "What should you do if you need help?", options: ["Raise your hand quietly", "Call out across the room", "Get out of your seat"], correctIndex: 0, explanation: "Exactly right! Raising a quiet hand helps our whole class stay focused." } },
      { slideNumber: 4, title: "How We Celebrate Good Choices", content: [classroom.rewardsSystem || "We celebrate great choices together as a class."], teacherNotes: "Connect this to something concrete and motivating for your students." },
      { slideNumber: 5, title: "We're a Team!", content: ["When we follow our routines, our classroom runs smoothly for everyone.", "I can't wait to have a great year together!"], teacherNotes: "Close with encouragement and an invitation for questions." },
    ],
  };
}

function buildFallbackClassroomVideo(classroom: ClassroomProfile): VideoContent {
  const name = classroom.classroomName || "our classroom";
  const rules = classroom.rules.length > 0 ? classroom.rules : ["be respectful", "be responsible", "be safe"];
  return {
    title: `How ${name} Works: A First-Day Tour`,
    theme: classroom.theme || "Classroom Teamwork",
    hasNarration: true,
    hasMusic: true,
    modelUsed: "veo-3.1-fast",
    scenes: [
      { sceneNumber: 1, visualDescription: `A warm, bright animated classroom with students' silhouettes settling into their seats.`, durationSeconds: 4, narrationCue: `Welcome to ${name}! Let's learn how our classroom works.` },
      { sceneNumber: 2, visualDescription: `Friendly animated icons appear one by one representing each classroom rule.`, durationSeconds: 4, narrationCue: `In our classroom, we ${rules.slice(0, 3).join(", ")}.` },
      { sceneNumber: 3, visualDescription: `The class cheers together as a reward chart fills up with stars.`, durationSeconds: 4, narrationCue: classroom.rewardsSystem || "When we work together, we celebrate as a team!" },
    ],
  };
}

// ── Icebreaker Activities fallbacks ─────────────────────────────────────
const DEFAULT_ICEBREAKERS = [
  { title: "Two Truths and a Dream", instructions: "Each student shares two true facts about themselves and one thing they'd love to try someday. The class guesses which is the dream." },
  { title: "Find Someone Who…", instructions: "Students walk around with a bingo-style card and find classmates who match a description (e.g. \"has a pet\", \"loves to draw\")." },
  { title: "Human Knot Team Challenge", instructions: "In small groups, students link hands in a tangle and work together — talking it through — to untangle into a circle." },
];

function buildFallbackIcebreakerWebpage(icebreaker: IcebreakerProfile): FirstDayWebpageContent {
  const color = icebreaker.themeColor || "#db2777";
  const count = Math.max(1, Math.min(icebreaker.numberOfActivities || 3, 6));
  const activities = Array.from({ length: count }, (_, i) => DEFAULT_ICEBREAKERS[i % DEFAULT_ICEBREAKERS.length]);
  const sections = activities.map((a, i) => ({ heading: `${i + 1}. ${a.title}`, emoji: "🎲", body: a.instructions }));
  const highlights = activities.map((a) => a.title);
  const tagline = `${icebreaker.groupSize || "Whole class"} · ${icebreaker.durationMinutes || "10-15 minutes"}`;
  return {
    title: icebreaker.theme ? `${icebreaker.theme}: Icebreaker Activities` : "Let's Get to Know Each Other!",
    tagline,
    themeColor: color,
    sections,
    highlights,
    contactBlock: icebreaker.specialConsiderations,
    html: wrapWebpageHtml(
      icebreaker.theme ? `${icebreaker.theme}: Icebreaker Activities` : "Let's Get to Know Each Other!",
      tagline,
      color,
      sections,
      CATEGORY_COPY.icebreaker_activities.highlightsHint,
      highlights,
      icebreaker.specialConsiderations
    ),
  };
}

function buildFallbackIcebreakerSlideDeck(icebreaker: IcebreakerProfile): SlideDeckContent {
  const count = Math.max(1, Math.min(icebreaker.numberOfActivities || 3, 6));
  const activities = Array.from({ length: count }, (_, i) => DEFAULT_ICEBREAKERS[i % DEFAULT_ICEBREAKERS.length]);
  const theme = icebreaker.theme || "Getting to Know Each Other";
  return {
    title: `${theme}: First-Day Icebreakers 🎉`,
    topic: "First-Day Icebreaker Activities",
    targetSkill: CATEGORY_COPY.icebreaker_activities.targetSkill,
    readingLevel: "All grade levels",
    theme,
    slides: [
      {
        slideNumber: 1,
        title: "Let's Get to Know Each Other!",
        content: [`Today we'll play a few fun activities to learn about our classmates.`, `Group size: ${icebreaker.groupSize || "Whole class"} · About ${icebreaker.durationMinutes || "10-15 minutes"}`],
        teacherNotes: "Set an upbeat, low-pressure tone — the goal is comfort and connection, not performance.",
        imagePrompt: "A cheerful illustration of diverse students smiling and waving at each other.",
      },
      ...activities.map((a, i) => ({
        slideNumber: i + 2,
        title: a.title,
        content: [a.instructions],
        teacherNotes: icebreaker.specialConsiderations
          ? `Adapt as needed: ${icebreaker.specialConsiderations}`
          : "Model the activity first, then invite volunteers before opening it to everyone.",
      })),
      {
        slideNumber: count + 2,
        title: "Great Job, Everyone!",
        content: ["Look how much we already learned about each other!", "Let's carry this teamwork into the rest of our year together."],
        teacherNotes: "Close with a group cheer or high-five round to reinforce the positive energy.",
      },
    ],
  };
}

function buildFallbackIcebreakerVideo(icebreaker: IcebreakerProfile): VideoContent {
  const theme = icebreaker.theme || "Classroom Connections";
  const firstActivity = DEFAULT_ICEBREAKERS[0];
  return {
    title: `${theme}: A First-Day Icebreaker`,
    theme,
    hasNarration: true,
    hasMusic: true,
    modelUsed: "veo-3.1-fast",
    scenes: [
      { sceneNumber: 1, visualDescription: `Animated students forming a circle in a bright classroom, waving hello to each other.`, durationSeconds: 4, narrationCue: `Let's play a game to get to know each other!` },
      { sceneNumber: 2, visualDescription: `A playful sequence showing "${firstActivity.title}" in action, with speech bubbles popping up.`, durationSeconds: 4, narrationCue: firstActivity.instructions },
      { sceneNumber: 3, visualDescription: `The whole class laughing and high-fiving as confetti falls.`, durationSeconds: 4, narrationCue: `Look how much we learned about each other already!` },
    ],
  };
}

// ── Family Welcome Letter fallbacks ─────────────────────────────────────
function buildFallbackFamilyLetterWebpage(teacher: TeacherProfile, classroom?: ClassroomProfile | null): FirstDayWebpageContent {
  const color = teacher.themeColor || "#4f46e5";
  const sections = [
    { heading: "Welcome!", emoji: "💌", body: `Dear Families,\n\nI'm ${teacher.name}, and I'm so excited to be your child's ${teacher.roleTitle} this year.` },
    { heading: "A Little About Me", emoji: "👋", body: teacher.teachingPhilosophy || `I love ${teacher.hobbiesAndInterests.join(", ") || "getting to know my students"} and can't wait to bring that energy into our classroom.` },
    ...(classroom && (classroom.rules.length > 0 || classroom.routines.length > 0)
      ? [{ heading: "How Our Classroom Works", emoji: "📋", body: `We'll be following a few simple expectations this year: ${classroom.rules.slice(0, 3).join(", ") || "clear, positive expectations"}.${classroom.rewardsSystem ? ` We celebrate good choices with: ${classroom.rewardsSystem}.` : ""}` }]
      : []),
    { heading: "Let's Stay in Touch", emoji: "📬", body: teacher.contactInfo || "Please don't hesitate to reach out anytime — I'm looking forward to partnering with you this year." },
  ];
  const highlights = [
    `Teacher: ${teacher.name} (${teacher.roleTitle})`,
    `Subjects/Grades: ${teacher.subjectsOrGrades}`,
    ...(classroom?.classroomName ? [`Classroom: ${classroom.classroomName}`] : []),
    ...(teacher.contactInfo ? [teacher.contactInfo] : []),
  ];
  const title = "Welcome to Our Classroom, Families!";
  const tagline = `A note from ${teacher.name}`;
  return {
    title,
    tagline,
    themeColor: color,
    sections,
    highlights,
    contactBlock: teacher.contactInfo,
    html: wrapWebpageHtml(title, tagline, color, sections, CATEGORY_COPY.family_letter.highlightsHint, highlights, undefined, teacher.photoDataUrl),
  };
}

function buildFallbackFamilyLetterSlideDeck(teacher: TeacherProfile, classroom?: ClassroomProfile | null): SlideDeckContent {
  return {
    title: `A Letter Home: Welcome from ${teacher.name}`,
    topic: "Family Welcome Letter",
    targetSkill: CATEGORY_COPY.family_letter.targetSkill,
    readingLevel: "All grade levels",
    theme: teacher.hobbiesAndInterests[0] || "Partnership",
    slides: [
      { slideNumber: 1, title: "Welcome, Families!", content: [`I'm ${teacher.name}, your child's ${teacher.roleTitle}.`, `I'm so glad to have your family in our classroom this year.`], teacherNotes: "Use this as a script for a recorded or printed welcome message." },
      { slideNumber: 2, title: "A Little About Me", content: [teacher.teachingPhilosophy || "I believe every student can thrive with the right support."], teacherNotes: "Personalize with a favorite hobby or fun fact." },
      { slideNumber: 3, title: "How Our Classroom Works", content: classroom && classroom.rules.length > 0 ? classroom.rules.slice(0, 3) : ["We build a caring, structured classroom together."], teacherNotes: "Summarize your top 2-3 classroom expectations." },
      { slideNumber: 4, title: "Let's Stay Connected", content: [teacher.contactInfo || "Please reach out anytime — I'm here as a partner this year."], teacherNotes: "Close with your preferred contact method and office hours." },
    ],
  };
}

function buildFallbackFamilyLetterVideo(teacher: TeacherProfile, classroom?: ClassroomProfile | null): VideoContent {
  return {
    title: `A Welcome Message From ${teacher.name}`,
    theme: teacher.hobbiesAndInterests[0] || "Partnership",
    hasNarration: true,
    hasMusic: true,
    modelUsed: "veo-3.1-fast",
    scenes: [
      { sceneNumber: 1, visualDescription: `A warm, welcoming classroom scene with soft morning light; the teacher smiles at the camera.`, durationSeconds: 4, narrationCue: `Hi families! I'm ${teacher.name}, and I'm so excited to have your child in my class this year.` },
      { sceneNumber: 2, visualDescription: `Friendly icons representing classroom routines and rewards float across the screen.`, durationSeconds: 4, narrationCue: classroom?.rewardsSystem || "We're building a caring, structured classroom together." },
      { sceneNumber: 3, visualDescription: `The teacher waves warmly as contact info appears on screen in friendly text.`, durationSeconds: 4, narrationCue: teacher.contactInfo || "Please reach out anytime — I can't wait to partner with you this year!" },
    ],
  };
}

// ── Getting-to-Know-You Survey fallbacks ────────────────────────────────
const DEFAULT_SURVEY_QUESTIONS = [
  "What is your favorite thing to do for fun?",
  "What subject do you enjoy the most, and why?",
  "What is something you're really good at?",
  "What is something new you'd like to learn this year?",
  "What helps you feel comfortable when you're having a hard day?",
  "What is one thing you want your teacher to know about you?",
];

function buildFallbackSurveyWebpage(survey: SurveyProfile): FirstDayWebpageContent {
  const color = survey.themeColor || "#7c3aed";
  const questions = survey.questions.length > 0 ? survey.questions : DEFAULT_SURVEY_QUESTIONS;
  const title = survey.title || "All About Me!";
  const tagline = survey.theme || "Getting to know you";
  const sections = questions.map((q, i) => ({ heading: `${i + 1}. ${q}`, body: "" }));
  const highlights = questions.slice(0, 5);

  const questionsHtml = questions
    .map(
      (q, i) => `
      <div class="question">
        <p class="q-text">${i + 1}. ${escapeHtml(q)}</p>
        <div class="blank-line"></div>
        <div class="blank-line"></div>
      </div>`
    )
    .join("\n");

  const html = `
<div class="gtk-page" style="--accent:${color}">
  <style>
    .gtk-page { font-family: ui-sans-serif, system-ui, sans-serif; max-width: 720px; margin: 0 auto; color: #1e293b; }
    .gtk-page .hero { text-align: center; padding: 2rem 1.5rem; border-radius: 24px; background: linear-gradient(135deg, var(--accent), #1e293b); color: white; margin-bottom: 1.5rem; }
    .gtk-page .hero h1 { font-size: 1.75rem; font-weight: 800; margin: 0 0 0.25rem; }
    .gtk-page .hero p { opacity: 0.9; margin: 0; font-size: 0.95rem; }
    .gtk-page .intro { text-align: center; font-size: 0.95rem; color: #475569; margin-bottom: 1.5rem; }
    .gtk-page .question { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.1rem 1.4rem; margin-bottom: 1rem; }
    .gtk-page .q-text { font-weight: 700; font-size: 1rem; margin: 0 0 0.75rem; color: var(--accent); }
    .gtk-page .blank-line { border-bottom: 2px dotted #cbd5e1; height: 1.6rem; margin-bottom: 0.4rem; }
  </style>
  <div class="hero">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(tagline)}</p>
  </div>
  ${survey.introMessage ? `<p class="intro">${escapeHtml(survey.introMessage)}</p>` : ""}
  ${questionsHtml}
</div>
`.trim();

  return {
    title,
    tagline,
    themeColor: color,
    sections,
    highlights,
    contactBlock: survey.introMessage,
    html,
  };
}

function buildFallbackSurveySlideDeck(survey: SurveyProfile): SlideDeckContent {
  const questions = (survey.questions.length > 0 ? survey.questions : DEFAULT_SURVEY_QUESTIONS).slice(0, 6);
  const title = survey.title || "All About Me!";
  const theme = survey.theme || "Getting to Know Each Other";
  return {
    title: `${title} — Class Interview`,
    topic: "Getting-to-Know-You Survey",
    targetSkill: CATEGORY_COPY.getting_to_know_you.targetSkill,
    readingLevel: "All grade levels",
    theme,
    slides: [
      { slideNumber: 1, title: "Let's Get to Know Each Other!", content: [survey.introMessage || "We'll go around and share our answers to a few fun questions."], teacherNotes: "Model answering the first question yourself to set a comfortable tone." },
      ...questions.map((q, i) => ({
        slideNumber: i + 2,
        title: `Question ${i + 1}`,
        content: [q],
        teacherNotes: "Invite volunteers to share, and let students pass if they'd prefer to listen today.",
      })),
      { slideNumber: questions.length + 2, title: "Thanks for Sharing!", content: ["Look how much we learned about each other today!"], teacherNotes: "Close with appreciation for everyone's participation." },
    ],
  };
}

function buildFallbackSurveyVideo(survey: SurveyProfile): VideoContent {
  const questions = survey.questions.length > 0 ? survey.questions : DEFAULT_SURVEY_QUESTIONS;
  return {
    title: `${survey.title || "All About Me!"}: A Getting-to-Know-You Invitation`,
    theme: survey.theme || "Getting to Know Each Other",
    hasNarration: true,
    hasMusic: true,
    modelUsed: "veo-3.1-fast",
    scenes: [
      { sceneNumber: 1, visualDescription: `A colorful animated worksheet floats onto the screen with a big friendly title.`, durationSeconds: 4, narrationCue: `Let's fill out our "${survey.title || "All About Me!"}" page together!` },
      { sceneNumber: 2, visualDescription: `Speech bubbles pop up one by one showing sample questions.`, durationSeconds: 4, narrationCue: questions[0] || "What is your favorite thing to do for fun?" },
      { sceneNumber: 3, visualDescription: `Students' silhouettes hold up their finished pages, smiling.`, durationSeconds: 4, narrationCue: "I can't wait to read all about you!" },
    ],
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const category: FirstDayMaterialCategory = body.category;
    const format: FirstDayMaterialFormat = body.format;
    const customPrompt: string | undefined = body.customPrompt;
    const providerPreferences: ProviderPreferences | undefined = body.providerPreferences;

    const VALID_CATEGORIES: FirstDayMaterialCategory[] = [
      "teacher_intro",
      "classroom_expectations",
      "icebreaker_activities",
      "family_letter",
      "getting_to_know_you",
    ];
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: "Invalid or missing category" }, { status: 400 });
    }
    if (!["slide_deck", "html_page", "video_clip"].includes(format)) {
      return NextResponse.json({ error: "Invalid or missing format" }, { status: 400 });
    }

    const copy = CATEGORY_COPY[category];
    let contextBlock: string;

    if (category === "teacher_intro") {
      const teacher: TeacherProfile = body.teacher;
      if (!teacher || !teacher.name || !teacher.roleTitle) {
        return NextResponse.json({ error: "Missing required teacher profile fields" }, { status: 400 });
      }
      contextBlock = formatTeacherContextForPrompt(teacher, customPrompt);
    } else if (category === "classroom_expectations") {
      const classroom: ClassroomProfile = body.classroom;
      if (!classroom || (classroom.rules.length === 0 && classroom.routines.length === 0)) {
        return NextResponse.json({ error: "Missing required classroom profile fields" }, { status: 400 });
      }
      contextBlock = formatClassroomContextForPrompt(classroom, customPrompt);
    } else if (category === "icebreaker_activities") {
      const icebreaker: IcebreakerProfile = body.icebreaker;
      if (!icebreaker || !icebreaker.groupSize) {
        return NextResponse.json({ error: "Missing required icebreaker profile fields" }, { status: 400 });
      }
      contextBlock = formatIcebreakerContextForPrompt(icebreaker, customPrompt);
    } else if (category === "family_letter") {
      const teacher: TeacherProfile = body.teacher;
      const classroom: ClassroomProfile | undefined = body.classroom;
      if (!teacher || !teacher.name || !teacher.roleTitle) {
        return NextResponse.json({ error: "Missing required teacher profile fields" }, { status: 400 });
      }
      contextBlock = formatTeacherContextForPrompt(teacher, customPrompt);
      if (classroom && (classroom.rules.length > 0 || classroom.routines.length > 0)) {
        contextBlock += `\n\n${formatClassroomContextForPrompt(classroom)}`;
      }
    } else {
      const survey: SurveyProfile = body.survey;
      if (!survey || survey.questions.length === 0) {
        return NextResponse.json({ error: "Missing required survey questions" }, { status: 400 });
      }
      contextBlock = formatSurveyContextForPrompt(survey, customPrompt);
    }

    if (format === "slide_deck") {
      const promptText = `
You are an expert teacher helping design a warm, welcoming first-day-of-class slide deck ${copy.slideIntro}.
Design an engaging 5-slide deck.

${contextBlock}

GUIDELINES:
1. Keep tone warm, friendly, positive, and age-appropriate.
2. ${copy.slideGuidance}
3. Include one light interactive question with a friendly explanation.
4. Include brief teacher facilitation notes for delivering each slide live on the first day.

Respond with valid JSON matching this exact structure:
{
  "title": "Deck Title",
  "topic": "First-Day ${copy.topic}",
  "targetSkill": "${copy.targetSkill}",
  "readingLevel": "All grade levels",
  "theme": "A hobby, interest, or classroom theme",
  "slides": [
    {
      "slideNumber": 1,
      "title": "Slide Title",
      "content": ["Short sentence", "Short sentence"],
      "teacherNotes": "Delivery guidance",
      "imagePrompt": "Description of a friendly illustration for this slide",
      "interactiveQuestion": {
        "question": "Optional quick question",
        "options": ["Option A", "Option B", "Option C"],
        "correctIndex": 0,
        "explanation": "Friendly explanation"
      }
    }
  ]
}
`.trim();

      const slideAi = await generateJSON(promptText, { temperature: 0.6, preferredOrder: providerPreferences?.text });
      if (slideAi?.json) {
        return NextResponse.json({
          content: slideAi.json as SlideDeckContent,
          modelUsed: slideAi.model,
          provider: slideAi.provider,
          costEstimate: estimateTextCost(slideAi.provider, 0.015),
        });
      }

      const SLIDE_FALLBACKS: Record<FirstDayMaterialCategory, () => SlideDeckContent> = {
        teacher_intro: () => buildFallbackTeacherSlideDeck(body.teacher),
        classroom_expectations: () => buildFallbackClassroomSlideDeck(body.classroom),
        icebreaker_activities: () => buildFallbackIcebreakerSlideDeck(body.icebreaker),
        family_letter: () => buildFallbackFamilyLetterSlideDeck(body.teacher, body.classroom),
        getting_to_know_you: () => buildFallbackSurveySlideDeck(body.survey),
      };
      return NextResponse.json({ content: SLIDE_FALLBACKS[category](), modelUsed: "se-3000-curriculum-engine", costEstimate: 0.0 });
    }

    if (format === "video_clip") {
      const promptText = `
You are a creative director producing a short, warm first-day animated video ${copy.videoIntro}.
Design a 3-scene storyboard for Veo 3.1.

${contextBlock}

GUIDELINES:
1. Scenes should feel warm, welcoming, and personable.
2. Each scene is 4 seconds. Total duration 8-12 seconds.
3. Include synchronized narration in first person, friendly tone.

Respond with valid JSON matching this exact structure:
{
  "title": "Short Video Title",
  "theme": "A hobby, interest, or classroom theme",
  "hasNarration": true,
  "hasMusic": true,
  "modelUsed": "veo-3.1-fast",
  "scenes": [
    { "sceneNumber": 1, "visualDescription": "Detailed visual description...", "durationSeconds": 4, "narrationCue": "Spoken line..." }
  ]
}
`.trim();

      const videoAi = await generateJSON(promptText, { temperature: 0.6, preferredOrder: providerPreferences?.text });
      if (videoAi?.json) {
        return NextResponse.json({
          content: videoAi.json as VideoContent,
          modelUsed: "veo-3.1-fast",
          provider: videoAi.provider,
          costEstimate: estimateTextCost(videoAi.provider, 0.4),
        });
      }

      const VIDEO_FALLBACKS: Record<FirstDayMaterialCategory, () => VideoContent> = {
        teacher_intro: () => buildFallbackTeacherVideo(body.teacher),
        classroom_expectations: () => buildFallbackClassroomVideo(body.classroom),
        icebreaker_activities: () => buildFallbackIcebreakerVideo(body.icebreaker),
        family_letter: () => buildFallbackFamilyLetterVideo(body.teacher, body.classroom),
        getting_to_know_you: () => buildFallbackSurveyVideo(body.survey),
      };
      return NextResponse.json({ content: VIDEO_FALLBACKS[category](), modelUsed: "veo-3.1-fast", costEstimate: 0.0 });
    }

    // format === "html_page"
    const THEME_COLOR_DEFAULTS: Record<FirstDayMaterialCategory, string> = {
      teacher_intro: body.teacher?.themeColor || "#4f46e5",
      classroom_expectations: body.classroom?.themeColor || "#0891b2",
      icebreaker_activities: body.icebreaker?.themeColor || "#db2777",
      family_letter: body.teacher?.themeColor || "#4f46e5",
      getting_to_know_you: body.survey?.themeColor || "#7c3aed",
    };
    const themeColorDefault = THEME_COLOR_DEFAULTS[category];
    const promptText = `
You are a friendly web designer creating a single-page first-day webpage ${copy.pageIntro}.

${contextBlock}

GUIDELINES:
1. Produce a self-contained HTML fragment (no <html>/<head>/<body> tags — it will be embedded inside an existing page) using only inline <style> scoped under a single wrapper class, and inline styles/classes — no external resources.
2. Warm, welcoming, age-appropriate tone. Use the theme accent color (${themeColorDefault}) for headings/accents.
3. Include a hero section with a title and tagline, 3-4 short sections, and a bulleted "highlights" list (${copy.highlightsLabel}).
4. Keep all CSS scoped inside a wrapper div with a unique class so it can't leak into the host page.

Respond with valid JSON matching this exact structure:
{
  "title": "Page Title",
  "tagline": "Short tagline",
  "themeColor": "${themeColorDefault}",
  "sections": [ { "heading": "Section Heading", "body": "...", "emoji": "👋" } ],
  "highlights": ["Highlight 1", "Highlight 2"],
  "contactBlock": "Optional closing line",
  "html": "<div class=...>...full self-contained HTML fragment with a <style> tag...</div>"
}
`.trim();

    const pageAi = await generateJSON(promptText, { temperature: 0.6, preferredOrder: providerPreferences?.text });
    const pageParsed: FirstDayWebpageContent | undefined = pageAi?.json;
    if (pageParsed?.html && typeof pageParsed.html === "string") {
      return NextResponse.json({
        content: pageParsed,
        modelUsed: pageAi!.model,
        provider: pageAi!.provider,
        costEstimate: estimateTextCost(pageAi!.provider, 0.012),
      });
    }

    const WEBPAGE_FALLBACKS: Record<FirstDayMaterialCategory, () => FirstDayWebpageContent> = {
      teacher_intro: () => buildFallbackTeacherWebpage(body.teacher),
      classroom_expectations: () => buildFallbackClassroomWebpage(body.classroom),
      icebreaker_activities: () => buildFallbackIcebreakerWebpage(body.icebreaker),
      family_letter: () => buildFallbackFamilyLetterWebpage(body.teacher, body.classroom),
      getting_to_know_you: () => buildFallbackSurveyWebpage(body.survey),
    };
    return NextResponse.json({ content: WEBPAGE_FALLBACKS[category](), modelUsed: "se-3000-curriculum-engine", costEstimate: 0.0 });
  } catch (error: any) {
    console.error("First-day material generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate first-day material" }, { status: 500 });
  }
}
