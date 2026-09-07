# SE 3000 project audit

> Historical audit of the pre-repair snapshot. See [FIXES.md](FIXES.md) for implemented repairs and current verification limits. Findings and line numbers below describe the original code.

Audit date: September 6, 2026 (America/Chicago).

The most urgent problems are unsafe generated-HTML export, unreliable progress measurements, fabricated fallback assessment data, and paid narration audio that is never played. Address these before relying on this application for real student records.

This is a broad source audit with targeted execution, not a guarantee that every bug has been found. Application code was not changed. Findings below distinguish directly observed behavior, source-confirmed defects, and conditional risks.

## Scope and verification

Reviewed dashboard state and persistence, database schema/seeding, student and goal forms, progress calculations and summaries, planning transitions, document extraction, generation routes, provider adapters, material viewers, settings/usage, print behavior, and project scripts/documentation.

- TypeScript: `./node_modules/.bin/tsc --noEmit` passed.
- Lint: `npm run lint` failed: `next lint` is treated as a nonexistent project directory. The installed Next.js guide requires running a linter directly.
- Production build: attempted twice, including an escalated retry. Both failed when Turbopack's CSS worker tried to bind a port: `Operation not permitted`. This is an environment limitation; it does not establish an application build defect or a successful production build.
- Executed the actual trend function using Node's TypeScript stripping. Reproduced reversed classifications for reduction goals and a forecast based on two same-day observations.
- Reproduced UTC/local calendar-date mismatch for Chicago.
- No live paid provider calls, browser end-to-end tests, print previews, accessibility automation, dependency advisory scan, or deployment penetration tests were performed. Provider availability and external API compatibility remain unverified.
- Checked the installed Next.js installation guide for lint and Node requirements. Checked [MDN's blob URL reference](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/blob) for generated-document origin behavior.

Priority: P1 = fix before real classroom data/use or relevant deployment; P2 = fix in the next reliability pass; P3 = polish/documentation. File links point to the audited snapshot.

## Findings

### 1. P1 — Generated HTML loses its sandbox when opened in a new tab

Source-confirmed security defect. [FirstDayWebpageViewer.tsx:21](/Users/Fei/Documents/SE3000/components/materials/FirstDayWebpageViewer.tsx:21) puts raw generated HTML into a `text/html` Blob and opens it directly. The preview's `sandbox=""` does not apply to that new document. The route accepts any string-valued HTML without sanitization at [route.ts:748](/Users/Fei/Documents/SE3000/app/api/generate/first-day/route.ts:748).

A generated script or event handler can therefore execute after the teacher clicks Open. Blob URLs retain a creator origin; `noopener` does not sanitize HTML. This creates a path to application-origin storage access. This impact is inferred from the code and documented browser origin model, not an executed exploit. Preserve sandboxing in the new-tab wrapper, sanitize generated markup, and apply a restrictive content policy; test with harmless script/event-handler fixtures.

### 2. P1 — Reduction goals get the opposite progress classification

Executed reproduction. [trending.ts:99](/Users/Fei/Documents/SE3000/lib/trending.ts:99) always treats a larger projected value as better. For baseline 10 and target 2, observations 10 → 12 produce `on_track`; observations 4 → 1 produce `off_track`. These results also feed summaries, generation context, and instructional recommendations.

Represent improvement direction explicitly or derive it from baseline and target, apply directional thresholds, and test increasing, decreasing, and maintenance goals.

### 3. P1 — Mini-games write percentages into goals measured in other units

Source-confirmed. [MiniGamePlayer.tsx:154](/Users/Fei/Documents/SE3000/components/materials/MiniGamePlayer.tsx:154) saves 0–100 to `value` without loading the goal or checking its measurement unit. A successful game attached to a 7-of-10 count goal can write 100 occurrences; a minutes goal can receive 100 minutes. The seeded project includes both count and duration goals.

Keep game performance separate from goal observations until an explicit compatible scoring rule exists. Preserve numerator, denominator, attempts, and support conditions; require teacher review where conversion is not meaningful.

### 4. P1 — Incorrect sorting answers still produce victory and 100%

Source-confirmed. [MiniGamePlayer.tsx:129](/Users/Fei/Documents/SE3000/components/materials/MiniGamePlayer.tsx:129) considers the game complete when every item has any bucket assignment; it never verifies the correct bucket. Incorrectly placed items disappear from the pool and may not appear in the chosen bucket because rendering filters the bucket's original item list. Completion then logs the default 100% score. Matching/sequencing also default to 100% without tracking incorrect attempts.

Validate assignments, render actual placements, allow correction, and distinguish eventual completion from independent accuracy. Use unique item IDs rather than text keys: duplicate labels currently prevent the completion count from reaching the total.

### 5. P1 — Local planning fallback invents student assessment facts

Source-confirmed. [plaafp/route.ts:42](/Users/Fei/Documents/SE3000/app/api/planning/plaafp/route.ts:42) defaults to below-grade performance and states assessment/classroom evidence establishes a gap even when no evidence was supplied. [iep-goal/route.ts:62](/Users/Fei/Documents/SE3000/app/api/planning/iep-goal/route.ts:62) defaults the baseline to 40% and attributes it to classroom/progress data. The fallback also caps targets at 90%, so a supplied baseline of 95% produces a lower target while describing improvement.

Trigger: generate with missing/incomplete assessment data while no provider succeeds. Return missing-data prompts or explicitly labeled templates, keep unknown baselines unknown, and require actual evidence before adopting a goal.

### 6. P1 — Generated narration audio is paid for but never played

Source-confirmed. [narration/route.ts:36](/Users/Fei/Documents/SE3000/app/api/generate/narration/route.ts:36) generates and returns `audioUrl`. [NarrationPlayer.tsx:24](/Users/Fei/Documents/SE3000/components/materials/NarrationPlayer.tsx:24) always calls browser speech synthesis and never consumes that URL. Provider voice selections and paid output therefore have no effect on playback.

Use an audio element when recorded audio exists, with browser speech only as fallback. Drive playback state from the actual media and test both paths.

### 7. P1 — Unvalidated model JSON can be persisted as ready and crash viewers

Source-confirmed. [textGen.ts:95](/Users/Fei/Documents/SE3000/lib/ai/textGen.ts:95) treats any parseable JSON as successful. [slides/route.ts:63](/Users/Fei/Documents/SE3000/app/api/generate/slides/route.ts:63), board-game, and mini-game routes return it with a TypeScript cast rather than runtime validation. Dashboard parsing only checks that the saved value is an object.

For example, a slide with missing `content` reaches `.map()` in the viewer, and a multiple-choice game with an empty question list reaches an undefined question. There is no viewer error boundary to isolate such failures. Validate complete output schemas, nonempty collections, enums, IDs and answer indices before accepting a provider result. Retry/fall back on schema failure and provide a recoverable viewer boundary.

### 8. P1 if network-exposed — Paid generation endpoints have no access or spending controls

Conditional deployment risk, source-confirmed absence of controls. [slides/route.ts:9](/Users/Fei/Documents/SE3000/app/api/generate/slides/route.ts:9) and the other generation/planning handlers accept requests without application authentication, rate limiting, or a spend/concurrency budget. There is no protective middleware/proxy in the repository.

Anyone able to reach an exposed deployment can submit requests using its server-side provider keys. For a strictly local tool, bind and enforce local access; for shared deployment, add authentication, authorization and server-side quotas before exposing it. Client-side usage logs are not enforcement.

### 9. P2 — Editing an adopted planning goal silently fails to update it

Source-confirmed. The goal remains editable after adoption in [PlanningAssistantModal.tsx:307](/Users/Fei/Documents/SE3000/components/planning/PlanningAssistantModal.tsx:307). Once `session.goalId` exists, the footer's Continue action only changes steps. The edited React `goal` is not saved, and subsequent unit generation prefers the previously committed profile goal.

Provide a real Save changes action that updates the linked goal and session atomically, or make adopted goals read-only until an explicit edit flow is entered. Mark existing units/worksheets stale when their source goal changes.

### 10. P2 — Planning-specific accommodations are omitted from worksheet generation

Source-confirmed. [PlanningAssistantModal.tsx:168](/Users/Fei/Documents/SE3000/components/planning/PlanningAssistantModal.tsx:168) generates worksheets with the spec and PLAAFP but omits `session.accommodationsSelected`. [context.ts:22](/Users/Fei/Documents/SE3000/lib/generators/context.ts:22) consequently uses profile accommodations, even after the teacher selected different supports in the wizard.

Pass the session's selected accommodations consistently through unit and worksheet generation. Include an explicit empty selection rather than treating it as absent.

### 11. P2 — Goal adoption is not atomic and can overwrite another tab's changes

Source-confirmed failure/concurrency risk. [planning.ts:180](/Users/Fei/Documents/SE3000/lib/planning.ts:180) writes an entire profile snapshot, then separately writes the session. If the second write fails, the goal exists without the linked session; retry can add another goal. [AddGoalForm.tsx:64](/Users/Fei/Documents/SE3000/components/AddGoalForm.tsx:64) also appends to a stale prop snapshot, so two tabs can overwrite each other's additions.

Read the current profile and session inside one write transaction, make adoption idempotent by session ID, and update only the intended fields.

### 12. P2 — Usage logging failure can erase successfully generated content

Source-confirmed failure-path defect. [materials.ts:162](/Users/Fei/Documents/SE3000/lib/materials.ts:162) saves a ready record, then awaits usage logging inside the same try block. If the usage write fails, the catch replaces it with the original placeholder marked error, omitting generated content. The same pattern exists in [firstDayMaterials.ts:280](/Users/Fei/Documents/SE3000/lib/firstDayMaterials.ts:280). Planning logs usage before returning generated content for persistence.

Make telemetry failure nonfatal to content saving and expose a separate usage-recording warning or retry queue.

### 13. P2 — Cleanup deletes other tabs' active generations

Source-confirmed concurrency risk. [materials.ts:251](/Users/Fei/Documents/SE3000/lib/materials.ts:251) and [firstDayMaterials.ts:352](/Users/Fei/Documents/SE3000/lib/firstDayMaterials.ts:352) delete every `generating` row, without age or owner checks. Opening another dashboard while a generation is active removes its record. First-day cleanup is also called during normal data refreshes. Completion can later resurrect the row, causing inconsistent visibility/state.

Track request ownership and a heartbeat/lease, and only recover expired jobs. Do not equate every generating record with abandoned work.

### 14. P2 — Deliberately deleted demo content returns on reload

Source-confirmed. [seed.ts:879](/Users/Fei/Documents/SE3000/lib/seed.ts:879) repopulates materials and plans whenever their tables are empty, even if profiles already exist. Delete the last material or planning session and reload: sample content returns. On a user-only database, this can also insert samples referring to absent seed students.

Use a persistent one-time seed/version marker and an explicit Load demo action. An empty table is a valid user state.

### 15. P2 — Observations default to the wrong calendar date in the evening

Executed date reproduction; source-confirmed call sites. [GoalCard.tsx:99](/Users/Fei/Documents/SE3000/components/GoalCard.tsx:99), game logging, and summaries use UTC `toISOString().split("T")[0]`. At 8 pm Chicago on September 6, 2026, that expression yields September 7.

Use local calendar formatting for observation dates and retain UTC for event timestamps. Also define a consistent tie-breaker for multiple observations on one date: the card currently chooses the first tied entry while trend computation uses the last.

### 16. P2 — Goal and observation numbers lack unit-specific validation

Source-confirmed. [AddGoalForm.tsx:44](/Users/Fei/Documents/SE3000/components/AddGoalForm.tsx:44) and [GoalCard.tsx:108](/Users/Fei/Documents/SE3000/components/GoalCard.tsx:108) primarily reject NaN. They allow out-of-range percentages/ratings and values inconsistent with a trials denominator. Frequency is offered as “per session” but rendered as “CWS/min” in the goal card.

Centralize domain validation for finite values, legal ranges, valid dates, denominator rules and explicit units. Preserve legitimate reduction goals rather than forbidding target < baseline.

### 17. P2 — Comparison results misidentify local fallback as an AI provider

Source-confirmed. [materials.ts:221](/Users/Fei/Documents/SE3000/lib/materials.ts:221) and [firstDayMaterials.ts:331](/Users/Fei/Documents/SE3000/lib/firstDayMaterials.ts:331) overwrite an absent actual provider with the requested provider after local fallback. The comparison's provider badge then presents local output under the failed provider's name.

Store requested and actual provider separately, show fallback status visibly, and preserve failures in the comparison results. For music/video, comparison currently controls only the text provider while media uses its default chain, so “compare providers” also needs a clear capability definition.

### 18. P2 — Provider/model and cost attribution is internally inconsistent

Source-confirmed. [video/route.ts:103](/Users/Fei/Documents/SE3000/app/api/generate/video/route.ts:103) labels text-only storyboards `veo-3.1-fast` even when generated by another text model or locally. Music has analogous branding. Successful text-plus-media generation records only the media estimate. [providers.ts:89](/Users/Fei/Documents/SE3000/lib/ai/providers.ts:89) merges capability labels by provider ID, causing later labels to overwrite text-provider names. Kimi is labeled K2 while the adapter requests `moonshot-v1-8k`.

Record actual model/provider per generation stage; distinguish estimates from billed cost, aggregate stage estimates, and use capability-specific display labels. External prices and model availability were not validated in this audit.

### 19. P2 — Provider input and timeout handling is fragile

Source-confirmed. [textGen.ts:84](/Users/Fei/Documents/SE3000/lib/ai/textGen.ts:84) filters caller-supplied provider IDs with a lookup that assumes valid keys, outside the provider try/catch. An unknown ID throws instead of returning a validation error or falling back. Other adapters repeat the pattern. Raw fetch calls in media adapters have no explicit timeout/abort; polling limits attempt count but not the duration of a hung request.

Validate request schemas and provider enums before use; reject malformed JSON/body shapes with 400 responses. Apply total request deadlines, cancellation, bounded retries and deduplication. Move long video generation to a resumable job flow if deploying beyond a local server.

### 20. P2 — Uploaded assessment text is silently truncated or ignored

Source-confirmed. [context.ts:129](/Users/Fei/Documents/SE3000/lib/generators/context.ts:129) sends only the first 6,000 characters of raw notes to AI, without indicating that later pages were omitted. The local PLAAFP fallback does not inspect `rawNotes` at all, even though document uploads are appended there.

Surface extraction/inclusion limits, preserve provenance, and split or summarize documents with explicit coverage. If local processing cannot interpret uploads, say so rather than returning an apparently document-based assessment.

### 21. P2 — Print buttons do not provide a dedicated complete material export

Source-confirmed layout limitation; browser print preview still required. [SlideDeckViewer.tsx:84](/Users/Fei/Documents/SE3000/components/materials/SlideDeckViewer.tsx:84) calls `window.print()` while only the active slide is rendered. It cannot export all slides. Worksheet and first-day viewers also print the surrounding dashboard; outer modal height/overflow constraints remain, and global CSS has no print isolation.

Create an isolated print layout with all slides/pages, remove modal height constraints, and explicitly control answer keys, navigation and surrounding student information. Verify multi-page worksheets, boards and HTML pages in print preview.

### 22. P2 — Modal accessibility and keyboard behavior need correction

Source-confirmed missing controls. Student/goal/profile dialogs use generic divs without dialog semantics, focus trapping/restoration, consistently associated labels, or named icon-only close controls. [SlideDeckViewer.tsx:42](/Users/Fei/Documents/SE3000/components/materials/SlideDeckViewer.tsx:42) globally intercepts Space/arrow keys without checking the focused target, which can prevent Space from activating a focused quiz answer.

Use a shared accessible dialog primitive, associate labels with inputs, implement Escape and focus handling, and scope presentation shortcuts so they do not override interactive controls. Keyboard and screen-reader testing remain outstanding.

### 23. P2 — Speech and narration timers continue after closing viewers

Source-confirmed. [NarrationPlayer.tsx:24](/Users/Fei/Documents/SE3000/components/materials/NarrationPlayer.tsx:24) starts speech and a timer chain but has no unmount cleanup. Its timer and speech-boundary tracking both update the highlighted segment. Slide speech also has no unmount cancellation and is not synchronized when changing slides.

Cancel owned timers/media on close/unmount, use one playback timing authority, handle playback errors, and prevent previous-session callbacks from updating a new playback session.

### 24. P2 — “Service Delivery (This Week)” is a static snapshot

Source-confirmed product gap. [ServiceTracker.tsx:34](/Users/Fei/Documents/SE3000/components/ServiceTracker.tsx:34) displays stored `deliveredMinutesThisWeek` indefinitely; there is no dated delivery ledger, week rollover, or edit flow. New students start with empty services/accommodations, and those dashboard sections are read-only.

Add dated service entries and calculate the selected week's totals. Provide student/profile, service, accommodation and observation correction workflows. Until then, label the service section as a stored/demo snapshot rather than a current weekly tracker.

### 25. P2 — Default learning-profile answers are saved as student facts

Source-confirmed. [AddStudentForm.tsx:62](/Users/Fei/Documents/SE3000/components/AddStudentForm.tsx:62) preselects second-grade reading, specific comprehension characteristics, fidget needs, interests and modalities. A teacher can create a student from the General tab without reviewing them; these defaults then condition all generation.

Start with unknown/empty values or require explicit confirmation of the learning profile. Separate example placeholders from saved observations.

### 26. P2 — Forecasting can claim a trajectory without elapsed observation time

Executed reproduction. Two observations on the same date, 80 and 90 against target 80, produce an `on_track` projection of 85 because [trending.ts:31](/Users/Fei/Documents/SE3000/lib/trending.ts:31) substitutes a zero slope when regression has no time variance. The function checks row count rather than distinct dates. Percent projections are also unconstrained and can exceed 100 or go negative.

Require distinct observation dates before forecasting, distinguish current attainment from trajectory, and present bounded-domain/uncertainty limitations. Do not translate a forecast into a claim that multi-session mastery criteria have been satisfied.

### 27. P2 — The configured lint check is broken and regression coverage is absent

Executed lint failure. [package.json:10](/Users/Fei/Documents/SE3000/package.json:10) invokes removed `next lint`. No project test files, test script, or CI workflow were found. A passing TypeScript check cannot catch the scoring, persistence, or fallback problems above.

Configure a supported linter and add focused tests for directional trends, game scoring/unit compatibility, output validation, fallback evidence handling, transaction failure, repeated adoption and multi-tab lifecycle. Add browser smoke tests for generation → save → reopen, planning edits, narration and printing.

## Additional improvement opportunities

These are broader gaps or follow-up investigations, not all reproduced bugs.

- **Backup and recovery:** IndexedDB holds the only copy of user records, but there is no application-wide export/import or recovery workflow. Add versioned backups including media, validated restore, storage-use visibility and quota handling. The existing blob table is largely unused; base64 media embedded in JSON increases storage/memory overhead.
- **Offline behavior:** Fallback generators run on server routes. They work without AI keys, but not when the browser cannot reach the app server. There is no service worker or client-side generation fallback. Clarify the guarantee or implement/test a real offline flow.
- **Privacy communication:** The README's “100% Private” framing is too broad: generation deliberately sends student context and free-text records to configured AI providers and may try several providers on failure. The upload form does correctly say transmission begins when analysis runs. Add a clear generation-time provider/data summary and revise claims; this audit does not assess legal compliance.
- **Media durability:** Video records store provider URLs instead of local video blobs. They cannot satisfy offline playback and may stop working if the provider revokes/expires the URL. Actual provider URL lifetime was not tested. Persist media where supported and expose download/recovery actions.
- **State consistency:** Dashboard student-data loads have no cancellation/version check. Rapid selection or a delayed earlier request can overwrite the current student's materials/session list. Use keyed/reactive queries, loading states, and bind material operations to the material's own profile ID rather than the currently selected profile.
- **Maintainability/performance:** Split the large dashboard and planning state machine; centralize request/response schemas and material persistence; lazy-load heavy viewers. Paginate metadata lists and avoid loading every base64 payload for a gallery. Measure browser memory/bundle size before choosing optimizations.
- **Curriculum quality:** Local worksheet fallback relies on keyword rules: non-equation math can route to algebra exercises, and unsupported subjects receive generic prompts. Define supported skill templates and flag unsupported generation rather than implying equivalent quality. Add teacher-reviewed content fixtures and answer-key checks.
- **Charts and accessibility:** Check chart resize handling, a single old observation outside the default date range, text/table alternatives to canvas, reduced motion, contrast and touch targets. These need browser verification.
- **Documentation:** README specifies Node 18.18+, while the installed Next.js guide requires 20.9+. Update runtime requirements, placeholder clone URL, actual provider/model names, actual image generation support, and claims of audit-ready/compliant reports. Image prompts currently do not themselves produce illustrations.
- **Dependency assurance:** Perform a lockfile advisory/license review and verify provider contracts against official documentation in a separate network-enabled validation pass. Do not infer that dependencies are safe from a successful type check.

## Suggested repair order

1. Close generated-HTML execution and exposed-API risks; prevent fabricated assessments and invalid game-to-goal writes.
2. Correct directional trends, game scoring, narration playback and schema validation.
3. Repair planning edits/accommodation propagation, atomic writes, usage failure handling, seeding and generation lifecycle.
4. Add backup/correction flows, accessibility and complete print layouts; make privacy/offline/model claims accurate.
5. Establish focused automated checks, then run browser, provider, deployment and dependency verification before release.
