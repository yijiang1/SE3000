# Audit repairs

Repair date: September 7, 2026. This maps the 27 original findings in [AUDIT.md](AUDIT.md) to the working-tree changes. Implemented code is distinguished from outstanding integration verification.

| Finding | Implemented repair |
| --- | --- |
| 1 — Generated HTML | Script-disabled CSP and sandboxed iframe wrappers protect previews, new tabs and isolated printing. |
| 2 — Reduction goals | Trend classification follows baseline-to-target direction; maintenance goals are handled separately. |
| 3 — Game observations | Teachers enter a validated measurement in the linked goal's actual unit; completion cannot automatically save a percentage. |
| 4 — Game correctness | Sorting rejects wrong buckets and uses stable identities for duplicate labels. Matching and sequencing track attempts; completion explicitly permits corrections. |
| 5 — Fabricated evidence | Templates label unknown performance. Recommendations require measured evidence; the invented 40% baseline and 90% target cap are removed. |
| 6 — Narration | Recorded audio is played when present, with browser speech otherwise. Media events drive recording playback state. |
| 7 — Invalid AI output | Runtime schemas validate every output type before acceptance. Saved-material validation and a viewer error boundary isolate corrupt content. |
| 8 — Exposed paid routes | Start scripts bind to loopback. Routes check local hosts/origins and JSON, cap body size, and limit request rate/concurrency. Public/shared deployment remains unsupported. |
| 9 — Adopted goal edits | Saving updates the linked goal and session atomically and clears the generated unit. Existing saved materials remain historical snapshots. |
| 10 — Accommodations | Worksheets receive the session's selected supports, including an explicitly empty selection. |
| 11 — Concurrent writes | Goal additions/adoption read current records inside transactions; adoption is idempotent and rolls back on session-write failure. |
| 12 — Telemetry failure | Usage logging cannot replace successfully generated content with an error placeholder. |
| 13 — Generation cleanup | Heartbeats protect active placeholders; completion updates existing rows so deleted records do not reappear. |
| 14 — Demo reseeding | Persistent initialization replaces empty-table reseeding. Deletions survive reloads. |
| 15 — Calendar dates | Observation defaults use local dates; sorting consistently uses date, timestamp and ID. |
| 16 — Measurement validation | Shared validation enforces finite values, unit ranges, denominators and dates. Frequency is labeled per session. |
| 17 — Comparison labels | Requested and actual providers are separate. Fallbacks and failed variants stay visible; music/video text comparisons disable paid media. |
| 18 — Usage attribution | Music/video log actual text and media stages with summed estimates. Local previews/storyboards no longer claim a media model. |
| 19 — Provider robustness | Schemas reject unknown providers. SDK calls and network body reads have deadlines; video polling has a time budget. |
| 20 — Uploaded reports | Silent 6,000-character truncation is removed. Submitted notes are included up to 100,000 characters, subject to body limits. Local analysis rejects reports it cannot interpret. |
| 21 — Printing | Isolated documents exclude the dashboard, and slide printing renders all slides. Printer pagination still needs manual verification. |
| 22 — Dialog accessibility | Shared dialogs provide semantics, labels, focus management, inert background and Escape. Slide shortcuts ignore interactive controls. |
| 23 — Playback cleanup | Narration pauses audio and cancels speech on unmount; slide changes/closing cancel speech. Synthetic narration timers are removed. |
| 24 — Service/correction flows | Dated entries calculate weekly service totals; undated snapshots are excluded. Profile editing, service correction, accommodation management and observation correction are available. |
| 25 — Profile defaults | New learning profiles start empty; unspecified values remain unknown in generation context. |
| 26 — Forecasts | Forecasts require distinct dates and bound projections for bounded units. They do not establish multi-session mastery. |
| 27 — Checks | Supported ESLint, TypeScript checking, focused Node tests and a CI workflow replace broken/missing checks. |

Additional fixes protect dashboard loads against student switching and bind material observations to the material's own student. Privacy/offline documentation now describes provider transmission and storage limits. A targeted webpack compatibility rule normalizes PptxGenJS's Node-prefixed browser imports without removing PowerPoint export.

## Verification

- 16 automated tests pass, covering trends, bounds, dates, measurement validation, output schemas, HTML wrappers, service weeks, transactional rollback/idempotency, active-generation cleanup, nonfatal telemetry, local routes and request rejection. The deliberate telemetry-failure test emits a warning.
- TypeScript and ESLint pass.
- Browser smoke checks: dashboard rendered; a 101% goal target was rejected; named dialog fields appeared; Escape closed the dialog and restored focus to Add Goal and removed background inert state.
- Production build passed with `npm run build -- --webpack`, including TypeScript and all 17 routes. Default Turbopack was blocked in this environment by its CSS worker's local port binding, including an escalated retry; the default build was not verified on the final snapshot.

## Remaining validation and improvements

No live paid provider calls were made. Provider contracts, prices, generated-media playback, printer pagination, complete keyboard/screen-reader coverage and all game engines still need end-to-end testing. Local endpoint checks and process-level limits are not shared-deployment authentication or a distributed spending budget. Browser throttling can delay heartbeats; durable server jobs would offer stronger recovery.

Backups/restores, durable local video storage, true browser-offline operation, broader curriculum templates and large-library performance remain separate product improvements. Browser storage is the only copy of records; historical materials do not automatically update when goals change. Existing saved invalid observations are not automatically rewritten.
