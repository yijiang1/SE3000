"use client";
// components/materials/MiniGamePlayer.tsx — Interactive browser-based mini-game engine

import { useState } from "react";
import {
  Gamepad2,
  Sparkles,
  Trophy,
  CheckCircle2,
  RotateCcw,
  PlusCircle,
  HelpCircle
} from "lucide-react";
import { clsx } from "clsx";
import type { MiniGameContent } from "@/types/iep";
import db from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

interface Props {
  content: MiniGameContent;
  profileId?: string;
  goalId?: string;
  onObservationLogged?: () => void;
  onClose?: () => void;
}

export default function MiniGamePlayer({
  content,
  profileId,
  goalId,
  onObservationLogged,
  onClose
}: Props) {
  // Matching Engine State
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);

  // Quiz Engine State
  const [currentQuizIdx, setCurrentQuizIdx] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showHint, setShowHint] = useState(false);

  // Sorting Engine State
  const [placedItems, setPlacedItems] = useState<Record<string, string>>({}); // item -> bucketId

  // Sequencing Engine State
  const [sequenceItems, setSequenceItems] = useState(() =>
    [...(content.sequencingSteps || [])].sort(() => Math.random() - 0.5)
  );

  // Common completion & logging state
  const [gameCompleted, setGameCompleted] = useState(false);
  const [loggedSuccess, setLoggedSuccess] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  const engineType = content.engineType || "matching";

  // 1. MATCHING HANDLER
  function handleSelectPrompt(promptId: string) {
    if (matchedPairs.includes(promptId)) return;
    setSelectedPrompt(promptId);
    if (selectedMatch) {
      checkMatch(promptId, selectedMatch);
    }
  }

  function handleSelectMatch(promptId: string) {
    if (matchedPairs.includes(promptId)) return;
    setSelectedMatch(promptId);
    if (selectedPrompt) {
      checkMatch(selectedPrompt, promptId);
    }
  }

  function checkMatch(pId: string, mId: string) {
    if (pId === mId) {
      const nextMatched = [...matchedPairs, pId];
      setMatchedPairs(nextMatched);
      setSelectedPrompt(null);
      setSelectedMatch(null);
      if (nextMatched.length === (content.matchingPairs?.length || 0)) {
        setGameCompleted(true);
      }
    } else {
      setTimeout(() => {
        setSelectedPrompt(null);
        setSelectedMatch(null);
      }, 700);
    }
  }

  // 2. QUIZ HANDLER
  function handleQuizAnswer(optIdx: number) {
    if (selectedOption !== null) return;
    setSelectedOption(optIdx);
    const q = content.quizQuestions?.[currentQuizIdx];
    if (q && optIdx === q.correctIndex) {
      setQuizScore((s) => s + 1);
    }
  }

  function handleNextQuizQuestion() {
    const totalQ = content.quizQuestions?.length || 0;
    if (currentQuizIdx + 1 < totalQ) {
      setCurrentQuizIdx((i) => i + 1);
      setSelectedOption(null);
      setShowHint(false);
    } else {
      setGameCompleted(true);
    }
  }

  // 3. SORTING HANDLER
  function handleSortItem(item: string, bucketId: string) {
    const updated = { ...placedItems, [item]: bucketId };
    setPlacedItems(updated);

    // Check if all items sorted
    const totalItems = content.sortingBuckets?.reduce((acc, b) => acc + b.items.length, 0) || 0;
    if (Object.keys(updated).length >= totalItems) {
      setGameCompleted(true);
    }
  }

  // 4. SEQUENCING HANDLER (Move item up/down)
  function handleMoveSequence(fromIdx: number, toIdx: number) {
    if (toIdx < 0 || toIdx >= sequenceItems.length) return;
    const reordered = [...sequenceItems];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);
    setSequenceItems(reordered);

    const isAllCorrect = reordered.every((item, idx) => item.order === idx + 1);
    if (isAllCorrect) {
      setGameCompleted(true);
    }
  }

  // Log Game Observation into IndexedDB
  async function handleLogObservation() {
    if (!profileId || !goalId || isLogging || loggedSuccess) return;
    setIsLogging(true);
    try {
      let measuredValue = 100; // default percentage or trials score
      if (engineType === "multiple_choice" && content.quizQuestions) {
        measuredValue = Math.round((quizScore / content.quizQuestions.length) * 100);
      }

      await db.progressLogs.add({
        id: uuidv4(),
        profileId,
        goalId,
        date: new Date().toISOString().split("T")[0],
        value: measuredValue,
        note: `SE 3000 Mini-Game: ${content.title} (${engineType}) — Score: ${measuredValue}%`,
        createdAt: new Date().toISOString(),
      });
      setLoggedSuccess(true);
      onObservationLogged?.();
    } catch (e) {
      console.error("Failed to log mini-game observation:", e);
    } finally {
      setIsLogging(false);
    }
  }

  function handleResetGame() {
    setSelectedPrompt(null);
    setSelectedMatch(null);
    setMatchedPairs([]);
    setCurrentQuizIdx(0);
    setQuizScore(0);
    setSelectedOption(null);
    setShowHint(false);
    setPlacedItems({});
    setSequenceItems([...(content.sequencingSteps || [])].sort(() => Math.random() - 0.5));
    setGameCompleted(false);
    setLoggedSuccess(false);
  }

  return (
    <div className="bg-slate-900 text-white rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
      {/* ─── Top Bar ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{content.title}</h2>
            <p className="text-xs text-slate-400">
              Theme: <span className="text-purple-300 font-semibold">{content.theme}</span> • Type:{" "}
              <span className="capitalize text-slate-300">{engineType.replace("_", " ")}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetGame}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-white text-xl px-1">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ─── Instructions Banner ─────────────────────────────────── */}
      <div className="px-6 py-3 bg-indigo-950/40 border-b border-indigo-500/20 text-xs sm:text-sm text-indigo-200 font-medium flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
        <span>{content.instructions}</span>
      </div>

      {/* ─── Game Content Container ─────────────────────────────── */}
      <div className="p-6 sm:p-8 min-h-[380px] flex flex-col justify-center">
        {/* GAME COMPLETED BANNER */}
        {gameCompleted ? (
          <div className="text-center py-8 space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white">Victory! Mission Accomplished!</h3>
            <p className="text-sm text-emerald-300 font-semibold">{content.successMessage}</p>

            {profileId && goalId && (
              <div className="pt-4 flex flex-col items-center gap-2">
                <button
                  onClick={handleLogObservation}
                  disabled={loggedSuccess || isLogging}
                  className={clsx(
                    "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-lg",
                    loggedSuccess
                      ? "bg-emerald-600 text-white cursor-default"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white active:scale-95"
                  )}
                >
                  {loggedSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Trial Logged to IEP Tracker!
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5" /> Log Score to IEP Goal Progress
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* ENGINE 1: MATCHING */}
            {engineType === "matching" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
                {/* Prompts Column */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Clues / Prompts
                  </span>
                  {content.matchingPairs?.map((pair) => {
                    const isMatched = matchedPairs.includes(pair.id);
                    const isSelected = selectedPrompt === pair.id;
                    return (
                      <button
                        key={pair.id}
                        onClick={() => handleSelectPrompt(pair.id)}
                        disabled={isMatched}
                        className={clsx(
                          "w-full p-4 rounded-xl text-left text-sm font-semibold border-2 transition-all flex items-center justify-between",
                          isMatched
                            ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-300 opacity-60"
                            : isSelected
                            ? "bg-indigo-600 border-indigo-400 text-white shadow-lg scale-102"
                            : "bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200"
                        )}
                      >
                        <span>{pair.prompt}</span>
                        {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Matches Column (Shuffled) */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Target Answers
                  </span>
                  {content.matchingPairs?.map((pair) => {
                    const isMatched = matchedPairs.includes(pair.id);
                    const isSelected = selectedMatch === pair.id;
                    return (
                      <button
                        key={pair.id}
                        onClick={() => handleSelectMatch(pair.id)}
                        disabled={isMatched}
                        className={clsx(
                          "w-full p-4 rounded-xl text-left text-sm font-semibold border-2 transition-all flex items-center justify-between",
                          isMatched
                            ? "bg-emerald-950/40 border-emerald-500/60 text-emerald-300 opacity-60"
                            : isSelected
                            ? "bg-purple-600 border-purple-400 text-white shadow-lg scale-102"
                            : "bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200"
                        )}
                      >
                        <span>{pair.match}</span>
                        {isMatched && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ENGINE 2: MULTIPLE CHOICE */}
            {engineType === "multiple_choice" && content.quizQuestions && (
              <div className="max-w-xl mx-auto w-full space-y-5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>
                    Question {currentQuizIdx + 1} of {content.quizQuestions.length}
                  </span>
                  <span className="text-amber-400 font-bold">Score: {quizScore}</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <h3 className="text-lg font-bold text-white mb-4">
                    {content.quizQuestions[currentQuizIdx].question}
                  </h3>

                  <div className="space-y-2.5">
                    {content.quizQuestions[currentQuizIdx].options.map((opt, optIdx) => {
                      const isSelected = selectedOption === optIdx;
                      const isCorrect = optIdx === content.quizQuestions![currentQuizIdx].correctIndex;
                      const isAnswered = selectedOption !== null;
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleQuizAnswer(optIdx)}
                          disabled={isAnswered}
                          className={clsx(
                            "w-full p-3.5 rounded-xl text-left text-sm font-medium border transition-all flex items-center justify-between",
                            isAnswered
                              ? isCorrect
                                ? "bg-emerald-600/30 border-emerald-500 text-emerald-200 font-bold"
                                : isSelected
                                ? "bg-rose-600/30 border-rose-500 text-rose-200"
                                : "bg-slate-800/40 border-slate-700 text-slate-400 opacity-60"
                              : "bg-slate-750 hover:bg-slate-700 border-slate-650 text-slate-100 hover:border-indigo-400"
                          )}
                        >
                          <span>{opt}</span>
                          {isAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Hint Drawer */}
                  {content.quizQuestions[currentQuizIdx].hint && (
                    <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between">
                      <button
                        onClick={() => setShowHint(!showHint)}
                        className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        <HelpCircle className="w-3.5 h-3.5" /> {showHint ? "Hide Hint" : "Show Helper Hint"}
                      </button>
                      {showHint && (
                        <p className="text-xs text-amber-200 italic">{content.quizQuestions[currentQuizIdx].hint}</p>
                      )}
                    </div>
                  )}
                </div>

                {selectedOption !== null && (
                  <div className="flex justify-end">
                    <button
                      onClick={handleNextQuizQuestion}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg transition-all"
                    >
                      {currentQuizIdx + 1 < content.quizQuestions.length ? "Next Question →" : "See Final Score →"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ENGINE 3: SORTING */}
            {engineType === "sorting" && content.sortingBuckets && (
              <div className="max-w-3xl mx-auto w-full space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {content.sortingBuckets.map((bucket) => {
                    const bucketItems = bucket.items.filter((item) => placedItems[item] === bucket.id);
                    return (
                      <div
                        key={bucket.id}
                        className="p-5 rounded-2xl bg-slate-800 border-2 border-dashed border-indigo-500/40 min-h-[180px] flex flex-col"
                      >
                        <h4 className="text-sm font-extrabold text-indigo-300 uppercase tracking-wide mb-3">
                          {bucket.title}
                        </h4>
                        <div className="space-y-2 flex-1">
                          {bucketItems.map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-indigo-950/70 border border-indigo-500/50 text-xs font-bold text-white flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>{item}</span>
                            </div>
                          ))}
                          {bucketItems.length === 0 && (
                            <p className="text-xs text-slate-500 italic text-center py-6">
                              Click an unsorted item below to place it here
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Unsorted Items Pool */}
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Unsorted Items (Click bucket to assign):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {content.sortingBuckets
                      .flatMap((b) => b.items)
                      .filter((item) => !placedItems[item])
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-700 border border-slate-600 text-xs font-semibold text-white flex items-center gap-2"
                        >
                          <span>{item}</span>
                          <div className="flex gap-1">
                            {content.sortingBuckets!.map((b) => (
                              <button
                                key={b.id}
                                onClick={() => handleSortItem(item, b.id)}
                                className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white"
                                title={`Sort into ${b.title}`}
                              >
                                {b.title.slice(0, 8)}…
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* ENGINE 4: SEQUENCING */}
            {engineType === "sequencing" && (
              <div className="max-w-xl mx-auto w-full space-y-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Reorder the steps into the correct sequence:
                </span>
                {sequenceItems.map((step, idx) => (
                  <div
                    key={step.id}
                    className="p-4 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-white flex items-center justify-between gap-3 shadow"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span>{step.text}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleMoveSequence(idx, idx - 1)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-30"
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMoveSequence(idx, idx + 1)}
                        disabled={idx === sequenceItems.length - 1}
                        className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-30"
                        title="Move Down"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
