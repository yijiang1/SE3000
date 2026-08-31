"use client";
// components/ProgressChart.tsx — Lightweight canvas line chart for goal progress

import { useEffect, useRef } from "react";
import type { ProgressLogEntry, IEPGoal } from "@/types/iep";

interface Props {
  goal: IEPGoal;
  entries: ProgressLogEntry[];
  height?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  academic: "#3b82f6",
  behavioral: "#f59e0b",
  social_emotional: "#8b5cf6",
  communication: "#10b981",
  motor: "#ef4444",
};

export default function ProgressChart({ goal, entries, height = 160 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = height;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const sorted = [...entries].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const PAD = { top: 16, right: 16, bottom: 32, left: 40 };
    const chartW = w - PAD.left - PAD.right;
    const chartH = h - PAD.top - PAD.bottom;

    const allY = [goal.baselineValue, goal.targetValue, ...sorted.map((e) => e.value)];
    const yMin = Math.min(...allY) * 0.9;
    const yMax = Math.max(...allY) * 1.1;
    const yRange = yMax - yMin || 1;

    const dates = sorted.map((e) => new Date(e.date + "T12:00:00").getTime());
    const xMin = dates.length > 1 ? Math.min(...dates) : Date.now() - 7 * 86400000;
    const xMax = Math.max(
      dates.length > 1 ? Math.max(...dates) : Date.now(),
      new Date(goal.reviewDate + "T12:00:00").getTime()
    );
    const xRange = xMax - xMin || 1;

    function toX(ts: number) {
      return PAD.left + ((ts - xMin) / xRange) * chartW;
    }
    function toY(val: number) {
      return PAD.top + chartH - ((val - yMin) / yRange) * chartH;
    }

    // Grid lines
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PAD.top + (chartH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(PAD.left, y);
      ctx.lineTo(PAD.left + chartW, y);
      ctx.stroke();
      const val = yMax - (yRange / 4) * i;
      ctx.fillStyle = "#9ca3af";
      ctx.font = "10px system-ui";
      ctx.textAlign = "right";
      ctx.fillText(Math.round(val).toString(), PAD.left - 4, y + 3);
    }

    // Target line (dashed)
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    const tyY = toY(goal.targetValue);
    ctx.beginPath();
    ctx.moveTo(PAD.left, tyY);
    ctx.lineTo(PAD.left + chartW, tyY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#16a34a";
    ctx.font = "9px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(`Target: ${goal.targetValue}`, PAD.left + 2, tyY - 3);

    // Baseline line (dotted)
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    const byY = toY(goal.baselineValue);
    ctx.beginPath();
    ctx.moveTo(PAD.left, byY);
    ctx.lineTo(PAD.left + chartW, byY);
    ctx.stroke();
    ctx.setLineDash([]);

    if (sorted.length === 0) return;

    // Data line
    const color = CATEGORY_COLORS[goal.category] ?? "#6366f1";
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    sorted.forEach((e, i) => {
      const x = toX(new Date(e.date + "T12:00:00").getTime());
      const y = toY(e.value);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Data dots
    ctx.fillStyle = color;
    sorted.forEach((e) => {
      const x = toX(new Date(e.date + "T12:00:00").getTime());
      const y = toY(e.value);
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // X-axis date labels
    ctx.fillStyle = "#9ca3af";
    ctx.font = "9px system-ui";
    ctx.textAlign = "center";
    const labelDates = [sorted[0], sorted[sorted.length - 1]].filter(
      (v, i, arr) => arr.indexOf(v) === i
    );
    labelDates.forEach((e) => {
      const x = toX(new Date(e.date + "T12:00:00").getTime());
      const label = new Date(e.date + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      ctx.fillText(label, x, h - 8);
    });
  }, [entries, goal, height]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: "100%", height }}
      className="block"
      aria-label={`Progress chart for goal: ${goal.goalText}`}
    />
  );
}
