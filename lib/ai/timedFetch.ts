/** Bound network reads as well as connection establishment. */
export async function timedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(input, { ...init, signal: AbortSignal.timeout(45_000) });
  // Buffer under the same abort signal, so a stalled response body cannot hang callers.
  const body = await response.arrayBuffer();
  return new Response(body, {status:response.status,statusText:response.statusText,headers:response.headers});
}
