import { timedFetch } from "./timedFetch";
// lib/ai/videoGen.ts — multi-provider real video generation with fallback chain
//
// Both providers are async job APIs: submit a prompt, poll a task_id until it
// completes, then resolve a downloadable video URL. Bounded to ~3 minutes of
// polling per provider — if a job hasn't finished by then we give up and let
// the caller fall back to the text-only storyboard.

import crypto from "crypto";
import { DEFAULT_VIDEO_PROVIDER_ORDER, VIDEO_PROVIDER_ENV, type VideoProviderId } from "./providers";

interface CallOpts {
  prompt: string;
  durationSeconds: number;
}

interface RawResult {
  videoUrl: string;
  model: string;
}

function isConfigured(id: VideoProviderId): boolean {
  return (VIDEO_PROVIDER_ENV[id] ?? []).length > 0 && VIDEO_PROVIDER_ENV[id].every((envVar) => {
    const v = process.env[envVar];
    return !!v && v.trim().length > 5;
  });
}

async function pollUntilDone<T>(
  poll: () => Promise<{ status: "processing" | "success" | "failed"; result?: T }>,
  { intervalMs = 5000, maxAttempts = 36 } = {}
): Promise<T> {
  const deadline = Date.now() + 180_000;
  for (let i = 0; i < maxAttempts && Date.now() < deadline; i++) {
    const r = await poll();
    if (r.status === "success") return r.result as T;
    if (r.status === "failed") throw new Error("Video generation task failed");
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("Video generation timed out");
}

// ── MiniMax Hailuo (v1 video_generation API) ──────────────────────────────
// NOTE: MiniMax's v1 flow is submit -> poll for a file_id -> a separate
// files/retrieve call for the download URL. Confirmed against MiniMax's
// published API reference as of this writing; if MiniMax revises the v1
// contract, this is the place to update it.
async function callMiniMaxVideo({ prompt, durationSeconds }: CallOpts): Promise<RawResult> {
  const apiKey = process.env.MINIMAX_API_KEY;
  const groupId = process.env.MINIMAX_GROUP_ID;

  const createRes = await timedFetch("https://api.minimax.io/v1/video_generation", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "MiniMax-Hailuo-02",
      prompt: prompt.slice(0, 2000),
      duration: durationSeconds <= 6 ? 6 : 10,
      resolution: "768P",
    }),
  });
  if (!createRes.ok) throw new Error(`MiniMax video create HTTP ${createRes.status}`);
  const created = await createRes.json();
  const taskId = created?.task_id;
  if (!taskId) throw new Error("MiniMax video: no task_id returned");

  const fileId = await pollUntilDone<string>(async () => {
    const statusRes = await timedFetch(`https://api.minimax.io/v1/query/video_generation?task_id=${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!statusRes.ok) throw new Error(`MiniMax video status HTTP ${statusRes.status}`);
    const s = await statusRes.json();
    const status = String(s?.status || "");
    if (/success/i.test(status)) return { status: "success", result: s?.file_id };
    if (/fail/i.test(status)) return { status: "failed" };
    return { status: "processing" };
  });
  if (!fileId) throw new Error("MiniMax video: completed task had no file_id");

  const fileRes = await timedFetch(
    `https://api.minimax.io/v1/files/retrieve?GroupId=${encodeURIComponent(groupId!)}&file_id=${fileId}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  if (!fileRes.ok) throw new Error(`MiniMax video file retrieve HTTP ${fileRes.status}`);
  const fileData = await fileRes.json();
  const downloadUrl = fileData?.file?.download_url;
  if (!downloadUrl) throw new Error("MiniMax video: no download_url in file record");
  return { videoUrl: downloadUrl, model: "minimax-hailuo-02" };
}

// ── Kling AI ───────────────────────────────────────────────────────────────
// NOTE: Kling's official docs are gated behind their China developer console;
// this follows the endpoint/JWT shape documented by their community SDKs
// (api.klingai.com, HS256 JWT with iss=accessKey). Verify against Kling's
// current docs if this stops matching.
function signKlingJWT(accessKey: string, secretKey: string): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: accessKey, exp: now + 1800, nbf: now - 5 };
  const base64url = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const signingInput = `${base64url(header)}.${base64url(payload)}`;
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(signingInput)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `${signingInput}.${signature}`;
}

async function callKlingVideo({ prompt }: CallOpts): Promise<RawResult> {
  const token = signKlingJWT(process.env.KLING_ACCESS_KEY!, process.env.KLING_SECRET_KEY!);

  const createRes = await timedFetch("https://api.klingai.com/v1/videos/text2video", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      model_name: "kling-v1",
      prompt: prompt.slice(0, 2000),
      mode: "std",
      duration: "5",
    }),
  });
  if (!createRes.ok) throw new Error(`Kling video create HTTP ${createRes.status}`);
  const created = await createRes.json();
  const taskId = created?.data?.task_id;
  if (!taskId) throw new Error("Kling video: no task_id returned");

  const videoUrl = await pollUntilDone<string>(async () => {
    const statusRes = await timedFetch(`https://api.klingai.com/v1/videos/text2video/${taskId}`, {
      headers: { Authorization: `Bearer ${signKlingJWT(process.env.KLING_ACCESS_KEY!, process.env.KLING_SECRET_KEY!)}` },
    });
    if (!statusRes.ok) throw new Error(`Kling video status HTTP ${statusRes.status}`);
    const s = await statusRes.json();
    const status = s?.data?.task_status;
    if (status === "succeed") return { status: "success", result: s?.data?.task_result?.videos?.[0]?.url };
    if (status === "failed") return { status: "failed" };
    return { status: "processing" };
  });
  if (!videoUrl) throw new Error("Kling video: completed task had no video url");
  return { videoUrl, model: "kling-v1" };
}

const CALLERS: Record<VideoProviderId, (opts: CallOpts) => Promise<RawResult>> = {
  minimax: callMiniMaxVideo,
  kling: callKlingVideo,
};

export interface VideoGenResult {
  videoUrl: string;
  provider: VideoProviderId;
  model: string;
}

export async function generateRealVideo(
  opts: CallOpts & { preferredOrder?: VideoProviderId[] }
): Promise<VideoGenResult | null> {
  const order = (opts.preferredOrder ?? DEFAULT_VIDEO_PROVIDER_ORDER).filter(
    isConfigured
  );

  for (const provider of order) {
    try {
      const result = await CALLERS[provider](opts);
      return { ...result, provider };
    } catch (err: any) {
      console.warn(`[Video fallback] ${provider} failed:`, err?.message);
    }
  }
  return null;
}
