import { NextRequest, NextResponse } from "next/server";
import { requestSchema, firstDayRequestSchema } from "./schemas";
const MAX_BYTES = 256_000;
let active = 0;
let started: number[] = [];
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]", "::ffff:127.0.0.1"]);

function hostnameOf(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value.includes("://") ? value : `http://${value}`).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function localRequestAllowed(req: Request): boolean {
  try {
    // Next's dev server pins req.url to localhost regardless of the address the
    // request actually arrived on, so also consult the forwarding headers.
    const hosts = [
      hostnameOf(req.url),
      hostnameOf(req.headers.get("host")),
      hostnameOf(req.headers.get("x-forwarded-host")),
      hostnameOf(req.headers.get("origin")),
    ];
    if (!hosts.some(Boolean)) return false;
    // Every host identifier the request carries must be a loopback address; this
    // rejects a network-exposed deployment and cross-origin (CSRF) callers alike.
    for (const host of hosts) {
      if (host && !LOCAL_HOSTS.has(host)) return false;
    }
    for (const name of ["host", "x-forwarded-host", "origin"]) {
      if (req.headers.has(name) && !hostnameOf(req.headers.get(name))) return false;
    }
    const origin = req.headers.get("origin");
    if (origin) {
      const originUrl = new URL(origin);
      const requestUrl = new URL(req.url);
      const authority = req.headers.get("host") || requestUrl.host;
      const effective = new URL(`${requestUrl.protocol}//${authority}`);
      if (originUrl.port !== effective.port || originUrl.protocol !== effective.protocol) return false;
    }
    return req.headers.get("sec-fetch-site") !== "cross-site";
  } catch {
    return false;
  }
}
export function generationRoute(handler: (req: NextRequest, body: any) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    if (!localRequestAllowed(req)) return NextResponse.json({error:"Generation is restricted to this computer. Open the app at localhost."},{status:403});
    if (!req.headers.get("content-type")?.includes("application/json")) return NextResponse.json({error:"Expected JSON."},{status:415});
    started = started.filter((time) => Date.now() - time < 60_000);
    if (active >= 4 || started.length >= 20) return NextResponse.json({error:"Generation limit reached. Please wait before retrying."},{status:429,headers:{"Retry-After":"60"}});
    active++; started.push(Date.now());
    try {
      const reader = req.body?.getReader();
      if (!reader) throw new Error("Missing request body.");
      const decoder = new TextDecoder(); let raw = ""; let size = 0;
      while (true) { const {done,value} = await reader.read(); if (done) break; size += value.byteLength; if (size > MAX_BYTES) { await reader.cancel(); return NextResponse.json({error:"Request is too large. Use a shorter report (maximum 256 KB)."},{status:413}); } raw += decoder.decode(value,{stream:true}); }
      raw += decoder.decode();
      const body = requestSchema.parse(JSON.parse(raw));
      if (new URL(req.url).pathname.endsWith("/first-day")) firstDayRequestSchema.parse(body);
      return await handler(req, body);
    } catch (error) {
      return NextResponse.json({error: error instanceof Error ? `Invalid request: ${error.message.slice(0,400)}` : "Invalid request."},{status:400});
    } finally { active--; }
  };
}
