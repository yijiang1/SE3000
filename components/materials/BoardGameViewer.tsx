"use client";
// components/materials/BoardGameViewer.tsx — Interactive & Printable Board Game

import { printMaterial } from "@/lib/print";
import { useState } from "react";
import {
  Dices,
  Printer,
  Sparkles,
  Trophy,
  Heart,
  Zap,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  Layers
} from "lucide-react";
import { clsx } from "clsx";
import type { BoardGameContent, GameCard } from "@/types/iep";

interface Props {
  content: BoardGameContent;
  onClose?: () => void;
}

export default function BoardGameViewer({ content, onClose }: Props) {
  const [playerPosition, setPlayerPosition] = useState(1);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [currentCard, setCurrentCard] = useState<GameCard | null>(null);
  const [starsEarned, setStarsEarned] = useState(0);
  const [viewMode, setViewMode] = useState<"interactive" | "printable">("interactive");

  const tiles = content.tiles || [];
  const cards = content.cards || [];
  const maxTile = tiles.length || 10;

  function rollDice() {
    if (isRolling) return;
    setIsRolling(true);
    let counter = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      counter++;
      if (counter > 8) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 6) + 1;
        setDiceValue(finalRoll);
        setIsRolling(false);
        setPlayerPosition((prev) => {
          const next = Math.min(maxTile, prev + finalRoll);
          const landedTile = tiles.find((t) => t.index === next);
          if (landedTile?.type === "challenge") {
            drawRandomCard();
          } else {
            setCurrentCard(null);
          }
          return next;
        });
      }
    }, 80);
  }

  function drawRandomCard() {
    if (cards.length === 0) return;
    const randomCard = cards[Math.floor(Math.random() * cards.length)];
    setCurrentCard(randomCard);
  }

  function handleCompleteCard() {
    setStarsEarned((s) => s + 1);
    setCurrentCard(null);
  }

  function handleResetGame() {
    setPlayerPosition(1);
    setDiceValue(null);
    setCurrentCard(null);
    setStarsEarned(0);
  }

  return (
    <div data-print-material className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-900 to-purple-900 text-white print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold">{content.gameTitle}</h2>
          </div>
          <p className="text-xs text-indigo-200 mt-0.5">
            Theme: <span className="font-semibold text-white">{content.theme}</span> • Target:{" "}
            <span className="text-amber-300">{content.targetSkill}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-indigo-950/60 p-1 rounded-xl border border-indigo-700/50 text-xs font-semibold">
            <button
              onClick={() => setViewMode("interactive")}
              className={clsx(
                "px-3 py-1.5 rounded-lg transition-colors",
                viewMode === "interactive" ? "bg-indigo-600 text-white" : "text-indigo-200 hover:text-white"
              )}
            >
              Play Online
            </button>
            <button
              onClick={() => setViewMode("printable")}
              className={clsx(
                "px-3 py-1.5 rounded-lg transition-colors",
                viewMode === "printable" ? "bg-indigo-600 text-white" : "text-indigo-200 hover:text-white"
              )}
            >
              Printable PDF
            </button>
          </div>

          <button
            onClick={(e) => printMaterial(e.currentTarget)}
            className="p-2 rounded-lg bg-indigo-800/80 hover:bg-indigo-700 text-white transition-colors"
            title="Print Game Set"
          >
            <Printer className="w-4 h-4" />
          </button>

          {onClose && (
            <button onClick={onClose} className="text-indigo-300 hover:text-white text-xl px-2">
              ✕
            </button>
          )}
        </div>
      </div>

      {viewMode === "interactive" ? (
        /* ─── Interactive Gameplay Mode ──────────────────────────── */
        <div className="p-6 space-y-6">
          {/* Game Status & Dice Roller */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center gap-4">
              <button
                onClick={rollDice}
                disabled={isRolling || playerPosition >= maxTile}
                className={clsx(
                  "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95",
                  playerPosition >= maxTile
                    ? "bg-emerald-600 opacity-60"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                )}
              >
                <Dices className={clsx("w-5 h-5", isRolling && "animate-spin")} />
                <span>{isRolling ? "Rolling…" : "Roll Dice"}</span>
              </button>

              {diceValue !== null && (
                <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-300 shadow-sm">
                  <span className="text-xs text-gray-500 font-medium">Roll:</span>
                  <span className="text-2xl font-black text-indigo-600">{diceValue}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-200 text-amber-800 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{starsEarned} Goal Stars</span>
              </div>
              <button
                onClick={handleResetGame}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-semibold px-2 py-1"
                title="Restart Game"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>

          {/* Board Tiles Grid Track */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Expedition Game Track ({playerPosition} of {maxTile})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {tiles.map((tile) => {
                const isCurrent = playerPosition === tile.index;
                const isPast = playerPosition > tile.index;
                return (
                  <div
                    key={tile.index}
                    className={clsx(
                      "relative rounded-2xl p-4 border-2 transition-all flex flex-col justify-between min-h-[110px]",
                      isCurrent
                        ? "border-indigo-600 bg-indigo-50 shadow-md ring-4 ring-indigo-100"
                        : isPast
                        ? "border-emerald-300 bg-emerald-50/40 text-gray-500"
                        : "border-gray-200 bg-white text-gray-700"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                        #{tile.index}
                      </span>
                      {tile.type === "start" && <span className="text-xs font-bold text-indigo-600">START</span>}
                      {tile.type === "finish" && <Trophy className="w-4 h-4 text-amber-500" />}
                      {tile.type === "challenge" && <HelpCircle className="w-4 h-4 text-purple-600" />}
                      {tile.type === "bonus" && <Zap className="w-4 h-4 text-amber-500" />}
                      {tile.type === "rest" && <Heart className="w-4 h-4 text-rose-500" />}
                    </div>

                    <div className="mt-2">
                      <p className="font-bold text-sm text-gray-900 leading-tight">{tile.label}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tile.promptText}</p>
                    </div>

                    {isCurrent && (
                      <div className="mt-2 py-1 px-2 rounded-lg bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center gap-1 animate-pulse">
                        <span>⭐ You are here</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Challenge Card Modal / Drawer */}
          {currentCard && (
            <div className="p-5 rounded-2xl bg-purple-50 border-2 border-purple-300 shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-200 text-purple-900">
                  {currentCard.category}
                </span>
                <span className="text-xs font-bold text-purple-700">Reward: +1 Goal Star</span>
              </div>
              <p className="text-base font-bold text-gray-900 mb-2">{currentCard.questionOrTask}</p>
              <div className="p-3 bg-white rounded-xl border border-purple-200 text-xs text-gray-600 mb-4">
                <span className="font-semibold text-purple-800">Teacher Evaluation Criteria: </span>
                {currentCard.answerOrCriteria}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setCurrentCard(null)}
                  className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium"
                >
                  Skip
                </button>
                <button
                  onClick={handleCompleteCard}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" /> Trial Complete (+1 Star)
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ─── Printable PDF Kit Mode ─────────────────────────────── */
        <div className="p-8 space-y-8 bg-slate-50">
          <div className="p-5 bg-white rounded-2xl border border-gray-300 shadow-sm print:shadow-none">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Game Rulebook & Materials</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Objective:</strong> {content.objective}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700 mb-4">
              <div className="bg-gray-50 p-3.5 rounded-xl">
                <strong className="block font-bold text-gray-900 mb-1">Materials Needed:</strong>
                <ul className="list-disc pl-4 space-y-0.5">
                  {content.materialsNeeded.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-gray-50 p-3.5 rounded-xl">
                <strong className="block font-bold text-gray-900 mb-1">How to Play:</strong>
                <ol className="list-decimal pl-4 space-y-0.5">
                  {content.rules.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ol>
              </div>
            </div>
            <p className="text-xs text-indigo-700 bg-indigo-50 p-2.5 rounded-lg">
              🖨️ {content.printableInstructions}
            </p>
          </div>

          {/* Printable Cut-Out Challenge Cards */}
          <div>
            <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Printable Challenge Card Deck (Cut along dashed lines)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {cards.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl border-2 border-dashed border-gray-400 bg-white flex flex-col justify-between min-h-[160px]"
                >
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                      {c.category}
                    </span>
                    <p className="text-sm font-bold text-gray-900 mt-2">{c.questionOrTask}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-200 text-[11px] text-gray-500">
                    <strong>Criteria:</strong> {c.answerOrCriteria}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
