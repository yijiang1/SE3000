"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, BookOpen, ClipboardList, Mail, MessageCircleHeart, Settings, Smile, Users } from "lucide-react";
import {
  cleanupStaleFirstDayMaterials,
  deleteFirstDayMaterial,
  emptyClassroomProfile,
  emptyIcebreakerProfile,
  emptySurveyProfile,
  emptyTeacherProfile,
  getClassroomProfile,
  getFirstDayMaterials,
  getIcebreakerProfile,
  getSurveyProfile,
  getTeacherProfile,
} from "@/lib/firstDayMaterials";
import type {
  ClassroomProfile,
  FirstDayMaterial,
  FirstDayMaterialCategory,
  IcebreakerProfile,
  SurveyProfile,
  TeacherProfile,
} from "@/types/iep";
import FirstDayMaterialsGallery from "@/components/FirstDayMaterialsGallery";
import TeacherProfileForm from "@/components/TeacherProfileForm";
import ClassroomProfileForm from "@/components/ClassroomProfileForm";
import IcebreakerProfileForm from "@/components/IcebreakerProfileForm";
import SurveyProfileForm from "@/components/SurveyProfileForm";
import FirstDayGeneratorModal from "@/components/FirstDayGeneratorModal";
import CompareResultsModal from "@/components/CompareResultsModal";
import Dialog from "@/components/Dialog";
import MaterialErrorBoundary from "@/components/MaterialErrorBoundary";
import SlideDeckViewer from "@/components/materials/SlideDeckViewer";
import VideoPlayer from "@/components/materials/VideoPlayer";
import FirstDayWebpageViewer from "@/components/materials/FirstDayWebpageViewer";
import { validOutput } from "@/lib/schemas";

function safeParseContent(json: string | undefined): any | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export default function CourseMaterialsPage() {
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [classroomProfile, setClassroomProfile] = useState<ClassroomProfile | null>(null);
  const [icebreakerProfile, setIcebreakerProfile] = useState<IcebreakerProfile | null>(null);
  const [surveyProfile, setSurveyProfile] = useState<SurveyProfile | null>(null);
  const [teacherMaterials, setTeacherMaterials] = useState<FirstDayMaterial[]>([]);
  const [classroomMaterials, setClassroomMaterials] = useState<FirstDayMaterial[]>([]);
  const [icebreakerMaterials, setIcebreakerMaterials] = useState<FirstDayMaterial[]>([]);
  const [familyLetterMaterials, setFamilyLetterMaterials] = useState<FirstDayMaterial[]>([]);
  const [surveyMaterials, setSurveyMaterials] = useState<FirstDayMaterial[]>([]);
  const [showTeacherProfileForm, setShowTeacherProfileForm] = useState(false);
  const [showClassroomProfileForm, setShowClassroomProfileForm] = useState(false);
  const [showIcebreakerProfileForm, setShowIcebreakerProfileForm] = useState(false);
  const [showSurveyProfileForm, setShowSurveyProfileForm] = useState(false);
  const [generatorCategory, setGeneratorCategory] = useState<FirstDayMaterialCategory | null>(null);
  const [viewingMaterial, setViewingMaterial] = useState<FirstDayMaterial | null>(null);
  const [compareResults, setCompareResults] = useState<FirstDayMaterial[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadCourseMaterials = useCallback(async () => {
    try {
      await cleanupStaleFirstDayMaterials();
      const [teacher, classroom, icebreaker, survey, teacherMats, classroomMats, icebreakerMats, familyMats, surveyMats] =
        await Promise.all([
          getTeacherProfile(),
          getClassroomProfile(),
          getIcebreakerProfile(),
          getSurveyProfile(),
          getFirstDayMaterials("teacher_intro"),
          getFirstDayMaterials("classroom_expectations"),
          getFirstDayMaterials("icebreaker_activities"),
          getFirstDayMaterials("family_letter"),
          getFirstDayMaterials("getting_to_know_you"),
        ]);
      setTeacherProfile(teacher);
      setClassroomProfile(classroom);
      setIcebreakerProfile(icebreaker);
      setSurveyProfile(survey);
      setTeacherMaterials(teacherMats);
      setClassroomMaterials(classroomMats);
      setIcebreakerMaterials(icebreakerMats);
      setFamilyLetterMaterials(familyMats);
      setSurveyMaterials(surveyMats);
      setLoadError(null);
    } catch (cause) {
      console.error("[SE 3000] Failed to load course materials:", cause);
      setLoadError("Course materials could not be loaded. Reload the page to try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourseMaterials();
  }, [loadCourseMaterials]);

  function handleMaterialCreated(material: FirstDayMaterial) {
    setGeneratorCategory(null);
    void loadCourseMaterials();
    setViewingMaterial(material);
  }

  function handleVariantsCreated(materials: FirstDayMaterial[]) {
    setGeneratorCategory(null);
    void loadCourseMaterials();
    setCompareResults(materials);
  }

  async function handleCompareResultDeleted(material: FirstDayMaterial) {
    await deleteFirstDayMaterial(material.id);
    await loadCourseMaterials();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-indigo-400 border-t-transparent" />
          <p className="text-sm font-semibold tracking-wide text-indigo-200">Loading Course Materials…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900 text-white shadow-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700">
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight">Course Materials</h1>
              <p className="hidden text-[11px] font-medium text-slate-400 sm:block">General classroom content shared across students</p>
            </div>
          </div>
          <Link href="/settings" className="ml-auto flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 p-2 text-xs font-bold text-slate-200 hover:bg-slate-700 sm:px-3">
            <Settings className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4">
          <h2 className="text-sm font-bold text-indigo-950">Prepare reusable classroom materials</h2>
          <p className="mt-1 text-xs leading-5 text-indigo-800">
            These resources are based on your teacher and classroom details. They are general course content and are not individualized to a specific student or IEP.
          </p>
        </div>

        {loadError && <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{loadError}</p>}

        <FirstDayMaterialsGallery
          accent="amber"
          icon={Smile}
          heading="First-Day Teacher Introduction"
          subtitle={teacherProfile?.name ? `Materials to introduce ${teacherProfile.name} (${teacherProfile.roleTitle}) on day one.` : "Create your teacher profile to generate About-Me materials for the first lesson."}
          hasProfile={!!teacherProfile?.name}
          emptyProfileTitle="No teacher profile yet"
          emptyProfileBody="Add your name, role, hobbies, and fun facts to generate a first-day introduction."
          materials={teacherMaterials}
          onOpenMaterial={setViewingMaterial}
          onOpenGenerator={() => setGeneratorCategory("teacher_intro")}
          onEditProfile={() => setShowTeacherProfileForm(true)}
          onMaterialDeleted={loadCourseMaterials}
        />

        <FirstDayMaterialsGallery
          accent="teal"
          icon={ClipboardList}
          heading="Classroom Expectations & Rules"
          subtitle={classroomProfile && (classroomProfile.rules.length > 0 || classroomProfile.routines.length > 0) ? `Materials explaining how ${classroomProfile.classroomName || "your classroom"} works on day one.` : "Add your classroom rules and routines to generate expectations materials."}
          hasProfile={!!classroomProfile && (classroomProfile.rules.length > 0 || classroomProfile.routines.length > 0)}
          emptyProfileTitle="No classroom rules set up yet"
          emptyProfileBody="Add classroom rules, routines, and rewards to generate expectations materials."
          materials={classroomMaterials}
          onOpenMaterial={setViewingMaterial}
          onOpenGenerator={() => setGeneratorCategory("classroom_expectations")}
          onEditProfile={() => setShowClassroomProfileForm(true)}
          onMaterialDeleted={loadCourseMaterials}
        />

        <FirstDayMaterialsGallery
          accent="pink"
          icon={Users}
          heading="Icebreaker Activities"
          subtitle={icebreakerProfile?.groupSize ? `Get-to-know-you activities for ${icebreakerProfile.groupSize.toLowerCase()} on day one.` : "Set activity preferences to generate first-day icebreakers."}
          hasProfile={!!icebreakerProfile?.groupSize}
          emptyProfileTitle="No icebreaker preferences set up yet"
          emptyProfileBody="Choose group size, duration, and activity styles to generate class icebreakers."
          materials={icebreakerMaterials}
          onOpenMaterial={setViewingMaterial}
          onOpenGenerator={() => setGeneratorCategory("icebreaker_activities")}
          onEditProfile={() => setShowIcebreakerProfileForm(true)}
          onMaterialDeleted={loadCourseMaterials}
        />

        <FirstDayMaterialsGallery
          accent="indigo"
          icon={Mail}
          heading="Family Welcome Letter"
          subtitle={teacherProfile?.name ? `A welcome letter home from ${teacherProfile.name}${classroomProfile?.classroomName ? ` (${classroomProfile.classroomName})` : ""}.` : "Set up your teacher profile to generate a family welcome letter."}
          hasProfile={!!teacherProfile?.name}
          emptyProfileTitle="No teacher profile yet"
          emptyProfileBody="This reuses your teacher profile and classroom details to write a welcome letter."
          materials={familyLetterMaterials}
          onOpenMaterial={setViewingMaterial}
          onOpenGenerator={() => setGeneratorCategory("family_letter")}
          onEditProfile={() => setShowTeacherProfileForm(true)}
          onMaterialDeleted={loadCourseMaterials}
        />

        <FirstDayMaterialsGallery
          accent="violet"
          icon={MessageCircleHeart}
          heading="Getting-to-Know-You Survey"
          subtitle={surveyProfile?.questions.length ? `“${surveyProfile.title}” · ${surveyProfile.questions.length} question${surveyProfile.questions.length === 1 ? "" : "s"}` : "Set up questions to generate a printable getting-to-know-you survey."}
          hasProfile={!!surveyProfile?.questions.length}
          emptyProfileTitle="No survey questions set up yet"
          emptyProfileBody="Add questions to generate a printable questionnaire or live class-interview deck."
          materials={surveyMaterials}
          onOpenMaterial={setViewingMaterial}
          onOpenGenerator={() => setGeneratorCategory("getting_to_know_you")}
          onEditProfile={() => setShowSurveyProfileForm(true)}
          onMaterialDeleted={loadCourseMaterials}
        />
      </main>

      {showTeacherProfileForm && <TeacherProfileForm profile={teacherProfile || emptyTeacherProfile()} onClose={() => setShowTeacherProfileForm(false)} onSaved={(profile) => { setTeacherProfile(profile); setShowTeacherProfileForm(false); }} />}
      {showClassroomProfileForm && <ClassroomProfileForm profile={classroomProfile || emptyClassroomProfile()} onClose={() => setShowClassroomProfileForm(false)} onSaved={(profile) => { setClassroomProfile(profile); setShowClassroomProfileForm(false); }} />}
      {showIcebreakerProfileForm && <IcebreakerProfileForm profile={icebreakerProfile || emptyIcebreakerProfile()} onClose={() => setShowIcebreakerProfileForm(false)} onSaved={(profile) => { setIcebreakerProfile(profile); setShowIcebreakerProfileForm(false); }} />}
      {showSurveyProfileForm && <SurveyProfileForm profile={surveyProfile || emptySurveyProfile()} onClose={() => setShowSurveyProfileForm(false)} onSaved={(profile) => { setSurveyProfile(profile); setShowSurveyProfileForm(false); }} />}

      {generatorCategory === "teacher_intro" && teacherProfile && <FirstDayGeneratorModal category="teacher_intro" subject={teacherProfile} onClose={() => setGeneratorCategory(null)} onMaterialCreated={handleMaterialCreated} onVariantsCreated={handleVariantsCreated} />}
      {generatorCategory === "classroom_expectations" && classroomProfile && <FirstDayGeneratorModal category="classroom_expectations" subject={classroomProfile} onClose={() => setGeneratorCategory(null)} onMaterialCreated={handleMaterialCreated} onVariantsCreated={handleVariantsCreated} />}
      {generatorCategory === "icebreaker_activities" && icebreakerProfile && <FirstDayGeneratorModal category="icebreaker_activities" subject={icebreakerProfile} onClose={() => setGeneratorCategory(null)} onMaterialCreated={handleMaterialCreated} onVariantsCreated={handleVariantsCreated} />}
      {generatorCategory === "family_letter" && teacherProfile && <FirstDayGeneratorModal category="family_letter" subject={{ teacher: teacherProfile, classroom: classroomProfile }} onClose={() => setGeneratorCategory(null)} onMaterialCreated={handleMaterialCreated} onVariantsCreated={handleVariantsCreated} />}
      {generatorCategory === "getting_to_know_you" && surveyProfile && <FirstDayGeneratorModal category="getting_to_know_you" subject={surveyProfile} onClose={() => setGeneratorCategory(null)} onMaterialCreated={handleMaterialCreated} onVariantsCreated={handleVariantsCreated} />}

      {compareResults && <CompareResultsModal materials={compareResults} onView={setViewingMaterial} onDelete={handleCompareResultDeleted} onClose={() => setCompareResults(null)} />}

      {viewingMaterial && ((material: FirstDayMaterial) => {
        const parsed = safeParseContent(material.contentJson);
        const isViewable = material.status === "ready" && parsed !== null && validOutput(material.format, parsed);
        return (
          <Dialog onClose={() => setViewingMaterial(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
            <div className="max-h-[95vh] w-full max-w-4xl overflow-y-auto">
              {!isViewable ? (
                <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-800 p-6 text-center text-white">
                  <AlertTriangle className="mx-auto h-6 w-6 text-amber-300" />
                  <h3 className="text-lg font-bold">This material can&apos;t be opened</h3>
                  <p className="text-sm text-slate-300">Its saved content is unavailable or invalid. Try deleting it and generating a new one.</p>
                  <button onClick={() => setViewingMaterial(null)} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold hover:bg-indigo-500">Close</button>
                </div>
              ) : (
                <MaterialErrorBoundary key={material.id} onClose={() => setViewingMaterial(null)}>
                  {material.format === "slide_deck" && <SlideDeckViewer content={parsed} onClose={() => setViewingMaterial(null)} />}
                  {material.format === "video_clip" && <VideoPlayer content={parsed} onClose={() => setViewingMaterial(null)} />}
                  {material.format === "html_page" && <FirstDayWebpageViewer content={parsed} onClose={() => setViewingMaterial(null)} />}
                </MaterialErrorBoundary>
              )}
            </div>
          </Dialog>
        );
      })(viewingMaterial)}
    </div>
  );
}
