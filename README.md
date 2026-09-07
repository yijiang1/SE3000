# Special Ed 3000

A local-first teaching-materials and IEP progress workstation. Records are stored in this browser's IndexedDB. AI generation sends the supplied student context, notes, and instructions to configured providers, and may try another provider if a request fails.

## Run locally

Requires Node.js 20.9 or newer and npm.

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000. Both development and production start scripts bind to loopback. Generation routes reject non-loopback hostnames and cross-origin requests, limit request size to 256 KB, and limit each server process to four simultaneous requests and twenty starts per minute. This application is not configured for shared/public deployment; do not expose it through a proxy.

API keys are optional and used only on the server. Configure only the providers you intend to receive generation requests. Settings controls provider order and shows estimated usage. Text providers are Gemini, DeepSeek, Moonshot v1 8K and OpenAI; narration supports OpenAI and MiniMax; media adapters support MiniMax music/video and Kling video. External provider availability and pricing are not guaranteed by this repository.

## Features and limits

- Create/edit student profiles and measurable goals. Unknown learning-profile fields remain unspecified.
- Record and correct dated observations. Forecasting supports increasing, decreasing and maintenance goals, requires observations on distinct dates, and bounds percentage/rating/trial projections. A forecast is not proof that a multi-session mastery criterion was met.
- Generate slides, board games, mini-games, worksheets, narration, music and storyboards. Outputs are validated before accepting AI results; unsupported/corrupt saved materials show a recoverable error.
- Mini-game completion is distinct from goal measurement. A teacher must enter an observed value in the linked goal's actual unit before saving progress. Matching, sorting and sequencing allow corrections.
- Recorded narration is played when available; otherwise browser speech is used. Precise sentence timing is not available for recorded audio.
- Plan a PLAAFP statement, recommend/edit an annual goal, select accommodations and generate a unit/worksheets. Missing measured baselines are not invented. Local templates cannot interpret uploaded reports; AI analysis includes all submitted notes up to 100,000 characters, subject to the request-size limit.
- Track services with dated delivery entries and calculated weekly totals. Old undated service snapshots are labeled and excluded from weekly calculations.
- Print isolated material content; slide export includes all slides. Generated HTML stays in a script-disabled document for preview, new-tab viewing and printing.
- Compare requested text providers. Music/video comparisons disable paid media generation so the results compare composition/storyboard text. Requested and actual fallback providers are labeled separately.

With no successful AI provider, the app uses **server-based templates**, not a browser offline engine. The app server must remain reachable. Browser storage is the only copy of records; clearing site data removes it. Provider-hosted video URLs may expire and do not support offline playback. Image prompts describe illustrations; they do not generate image assets.

Generated educational content and reports require teacher review. Demo data is seeded once. Deleting demo materials or plans does not re-create them on reload.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

If a restricted environment prevents Turbopack's CSS worker from binding its local port, the supported alternative is `npm run build -- --webpack`.

The test suite uses synthetic records and an in-memory IndexedDB implementation; route tests disable provider keys. It covers domain calculations, output validation, access checks, local generation, and persistence failures. TypeScript 6 supplies the compiler API used by lint/Next.js; the TypeScript 7 native checker is retained separately.

See [AUDIT.md](AUDIT.md) for the original audit and [FIXES.md](FIXES.md) for the repair status and verification limits.
