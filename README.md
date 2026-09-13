# Special Ed 3000

A local-first teaching-materials and IEP progress workstation. Each teacher unlocks a separate AES-GCM-encrypted data vault with a password. Supporting browsers save the vault in a chosen folder; Brave uses encrypted browser-local storage. AI generation sends the supplied student context, notes, and instructions to configured providers, and may try another provider if a request fails.

## Run locally

Requires Node.js 20.9 or newer and npm.

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open http://127.0.0.1:3000. Both development and production start scripts bind to loopback. Generation routes reject non-loopback hostnames and cross-origin requests, limit request size to 256 KB, and limit each server process to four simultaneous requests and twenty starts per minute. This application is not configured for shared/public deployment; do not expose it through a proxy.

Chrome and Edge use folder-backed vaults through the File System Access API. Brave intentionally disables that API, so the app automatically falls back to an AES-GCM-encrypted vault inside the current Brave browser profile. Teaching records are loaded into an IndexedDB working copy after password verification and removed from that working copy when the teacher locks the app. Passwords cannot be recovered. Keep folder vaults backed up; for Brave storage, do not clear this app's site data or browser profile.

API keys are optional and used only on the server. Configure only the providers you intend to receive generation requests. Settings controls provider order and shows estimated usage. Text providers are Gemini, DeepSeek, Moonshot v1 8K and OpenAI; narration supports OpenAI and MiniMax; media adapters support MiniMax music/video and Kling video. External provider availability and pricing are not guaranteed by this repository.

## Features and limits

- Create/edit student profiles and measurable goals. Unknown learning-profile fields remain unspecified.
- Create multiple password-protected teacher workspaces. Each teacher sees only the students and generated materials in that teacher's encrypted vault.
- Download a complete password-encrypted portable vault, import it into another browser or computer, or permanently delete a workspace after typing the teacher name to confirm.
- Opt into a George R. R. Martin development fixture during teacher creation to load four clearly fictional, character-inspired students and synthetic progress observations.
- Record and correct dated observations. Forecasting supports increasing, decreasing and maintenance goals, requires observations on distinct dates, and bounds percentage/rating/trial projections. A forecast is not proof that a multi-session mastery criterion was met.
- Generate slides, board games, mini-games, worksheets, narration, music and storyboards. Outputs are validated before accepting AI results; unsupported/corrupt saved materials show a recoverable error.
- Mini-game completion is distinct from goal measurement. A teacher must enter an observed value in the linked goal's actual unit before saving progress. Matching, sorting and sequencing allow corrections.
- Recorded narration is played when available; otherwise browser speech is used. Precise sentence timing is not available for recorded audio.
- Plan a PLAAFP statement, recommend/edit an annual goal, select accommodations and generate a unit/worksheets. Missing measured baselines are not invented. Local templates cannot interpret uploaded reports; AI analysis includes all submitted notes up to 100,000 characters, subject to the request-size limit.
- Track services with dated delivery entries and calculated weekly totals. Old undated service snapshots are labeled and excluded from weekly calculations.
- Print isolated material content; slide export includes all slides. Generated HTML stays in a script-disabled document for preview, new-tab viewing and printing.
- Compare requested text providers. Music/video comparisons disable paid media generation so the results compare composition/storyboard text. Requested and actual fallback providers are labeled separately.

With no successful AI provider, the app uses **server-based templates**, not a browser offline engine. The app server must remain reachable. Clearing browser site data removes the teacher chooser and saved folder handles. It does not delete folder-backed vault files, but it does delete Brave browser-local vaults. Provider-hosted video URLs may expire and do not support offline playback. Image prompts describe illustrations; they do not generate image assets.

Generated educational content and reports require teacher review. When the first teacher is created on an installation that already has browser-local records, those records are migrated into that teacher's first encrypted vault.

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
