# TEST REPORT — v5.0.0-dev (2026-11-09)

## Environment (actual)
- Linux 6.18 container (cloud sandbox), Node v22.23.4.
- Playwright 1.63.0 with **headless Chromium 153.0.8010.12**. The app was opened from a `file://` URL with the browser context set **offline**, and every non-file request was intercepted and aborted (and recorded).
- **Not tested:** real Windows Chrome/Edge, real iPhone/iPad Safari/Files, Firefox, screen readers, physical printers. "Mobile" below means a simulated 390×844 touch viewport in Chromium, **not a real device**.

## How to reproduce
```
node tools/check.mjs
node tools/build.mjs
node tests/unit.mjs
NODE_PATH=$(npm root -g) node tests/e2e.cjs tests/evidence
```
Raw outputs: `tests/results_check.txt`, `tests/results_build.txt`, `tests/results_unit.txt`, `tests/results_e2e.txt`, `tests/results_a11y.txt`.

Evidence in `tests/evidence/`:
- `weekly_plan_print.pdf` (9 A4 pages produced by Chromium's print engine);
- `export_full.json`;
- the malformed import files;
- screenshots `final.png` and `mobile_library.png`.

## Results (final run)
| Suite | Result |
|---|---|
| Exercise data + animation geometry (`check.mjs`) | 197 records, **0 errors**, 6 warnings (intentional: planks and mountain climbers marked prone-position without the "lying prone" flag, because the weight is on the hands) |
| Unit (`unit.mjs`, DOM-free modules) | **55 passed, 0 failed** |
| End-to-end (`e2e.cjs`, real UI in Chromium) | **27 passed, 0 failed** (T27 = encryption) |
| Accessibility (`a11y.cjs`, axe-core 4.10.2, WCAG 2.0/2.1 A+AA rules) | **0 violations** on 10 pages × dark/light + exercise dialog (`tests/results_a11y.txt`). axe covers only part of WCAG; no screen-reader test. |

Defects that earlier test runs caught and that were fixed before this run:
- The check character missed about 6% of typos. Odd weights now make every single-character substitution detectable.
- ID normalisation corrupted the `PL5` prefix.
- "Substitute" could re-select the same painful exercise.
- Two push-up variants had identical drawings. A hand-placement inset now distinguishes them.
- Saving on page unload could overwrite newer data from another tab. Unload-saving was removed and optimistic concurrency added; test T26 covers it.

## Mapping to the required acceptance tests (spec §12)
| # | Requirement | Evidence | Status |
|---|---|---|---|
| 1 | Offline, no external requests | E2E T25: 0 external requests, 0 console errors over the whole run; CSP `connect-src 'none'`; build guard | **Pass (simulated offline in Chromium)** |
| 2 | ≥2 trainees, different plans, isolation | T2, T6, T7, T8 (3 trainees, cross-reference checks, B's view does not show A's plan) | **Pass** |
| 3 | Red flag blocks prescription; branches work | T7 (chest pain → refer, blocked, no override or baseline offered). Unit tests cover 18 screening branches: pregnancy warn/absolute/relative/no-provider, postpartum, age <18, supervised-only, unsure answers, clearance cannot lift refer | **Pass** |
| 4 | Different abilities/availability → explainably different weekly schedules | Unit "different abilities"; T8; every item carries `why` notes | **Pass** |
| 5 | Logs + review change next plan; pain blocks progression | Unit adapt tests (progress, reduce, substitute, illness, <50% attendance, "felt easy" alone does not progress, pain 8 → refer → blocked); T9, T11–T13 | **Pass** |
| 6 | Unique plan IDs, lookup, JSON round trip, malformed import, history | Unit (20,000 IDs unique; typo detection 500/500); T12, T15, T16, T20 (fresh profile restores identical records; re-import adds no duplicates), T21 (syntax error and tampered file rejected, data unchanged) | **Pass** |
| 7 | Arabic RTL weekly PDF, pagination, names, IDs, details, no clipped tables | T17 generated a real A4 PDF (9 pages). I inspected rendered pages: RTL Arabic is correct, the table header repeats on page 2, exercise cards have start/end figures. `pdftotext` finds the trainee name, trainee ID and plan ID. | **Pass in Chromium print engine; not tested on Windows print dialog or a physical printer** |
| 8 | Images match movements; counters/timers work | T19: 197 distinct drawings. T18: animation moves, pause works, rep counter = 3 after 3 clicks, interval timer counts down. T10: rest timer 01:10 → 01:08. Visual review of every contact sheet by the authors, plus my spot checks. | **Pass with caveats** (some schematic drawings — see risks) |
| 9 | Regression vs v4 inventory | See table below; T23 runs the real v4 file, creates a trainee there, then migrates it into v5 with the v4 key unchanged | **Pass** |
| 10 | Windows Chrome/Edge; iOS limitations documented | Windows: **not tested on a real machine** (Chromium engine only). iOS: documented in README; **not tested** | **Partially met** |

### v4 regression map
| v4 feature | v5 | Test |
|---|---|---|
| Multiple trainee profiles | Trainees page with search, edit, archive, delete, export | T2, T6, T7, T22 |
| Intake questionnaire | Profile plus branching screening plus baseline | T3, T6, T7 |
| Weekly plan | 7-day dated plan with explanations | T5, T12 |
| Serial lookup | Plan ID with check character, typo tolerance | T15 |
| Review form | Weekly review: mandatory safety and adaptive questions | T11, T13 |
| Print/PDF | A4 illustrated plan | T17 |
| JSON backup, per-person export, merge import | Same, plus checksum, validation, restore points | T16, T20, T21 |
| Rep counter and timer | Library widget plus live-session counters and rest timer | T9, T10, T18 |
| Library with filters | Filters for category, pattern, level, role, search, "safe for this trainee" | T18, T19 |
| v4 local data | Read-only migration | T23 |

## Unfinished requirements and risks (truthful gap list)

1. **Exercise count: 197 of the 200 target.**
   - 200 IDs were planned. Three were drawn twice, the second time with the new foreshortening support, and were still removed in final review because the drawings would mislead:
     - `PU-ARCHER` looked like a headstand;
     - `HA-FIRE` looked like a standing leg lift;
     - `MO-OPENBOOK` was too abstract.
   - Nothing was padded.
   - Next step: a real 3-D or photo-based illustration for these three, or skip them.
2. **Sources were not opened.**
   - The network policy blocked every source host. All 27 register entries are "seen in search results" or "unverified".
   - Some specifics are marked unconfirmed in `docs/research_notes_2026-11-09.md`:
     - parts of the ACOG contraindication list;
     - the 20-week supine cut-off;
     - the AHA wording on breath-holding (Valsalva);
     - Army Conditioning Drill 3 and Climbing Drill names;
     - whether a newer FM 7-22 edition exists.
   - Next step: allow those hosts, or have a qualified person verify each fact against the primary documents.
3. **No qualified clinical or exercise-science review.**
   - The thresholds are labelled `LOCAL` product choices, not evidence: pain 4/7, completion 70%/100%, effort ≤ 7, at most 3 progressions per week, no prone exercise from 12 weeks of pregnancy, balance and no impact at 65+.
   - Screening wording has not been validated.
   - Next step: review by a physician / physiotherapist / qualified exercise professional, and by an obstetric provider for the pregnancy and postpartum pathways.
4. **PAR-Q+ is not included.** No licence for embedding or translating it was found. The app uses its own questions and says so. Next step: request permission from the PAR-Q+ Collaboration if the official instrument is wanted in-app.
5. **Real-device testing is not done.**
   - Not tested: Windows Chrome/Edge (double-click from Explorer), iOS Safari/Files, Android, a physical printer.
   - Next step: run `tests/e2e.cjs` against Edge/Chrome on Windows, and test manually on an iPhone.
6. **Schematic animations.** Some figures cannot show the key detail of their movement in 2D; each one says so in its `desc`. New items in round 2 with the same limitation: clock reach (forward and back taps look alike), carioca (which leg crosses in front is not visible), scissor kicks, lateral bear crawl, low crawl, and neck mobility (only nodding is drawn). Round-1 items:
   - lateral or rotational movements: bicycle twist, leg tuck & twist, windmill, skaters, T push-up, Y squat;
   - small-joint drills: wrist, ankle, shoulder circles;
   - top-down figures: `SC-PRONE-T`, `SC-PRONE-W`, `CR-BLTWIST`, `ST-SLOVER`;
   - clamshell;
   - in-place gait: walk, jog, crawls.

   The prone T-raise top view can be mistaken for a standing figure. These figures have not been reviewed by a coach.
7. **Privacy of local storage: partly mitigated.**
   - In Chromium, every local HTML file opened in the same browser profile shares one `file://` storage area.
   - Optional passphrase encryption now exists (AES-GCM-256, PBKDF2 310k; T27 shows no plaintext in storage). It is **off by default**: without it, another local HTML file could read the data.
   - A forgotten passphrase means the local data is lost.
   - Passphrase strength is checked only for length (≥ 8).
   - The cryptography has not been reviewed by an independent security expert.
8. **No IndexedDB.** localStorage (about 5 MB) is enough for roughly hundreds of trainee-weeks (a 3-trainee, 4-plan export is 106 KB), but it is not unlimited. Next step: move to IndexedDB if long-term heavy use is expected.
9. **No PDF import** (by design and disclosed). JSON is the only full-fidelity transfer. Printing relies on the browser's "Save as PDF"; there is no embedded PDF generator.
10. **Camera-based automatic rep counting:** out of scope and not implemented. All counters are manual.
11. **Accessibility:** the axe-core automated audit reports 0 violations. It has not been tested with NVDA or VoiceOver and has had no manual WCAG review.
12. **Session dates:** logging a session for a future day, or a second session on the same day, now requires confirmation and the session is marked `early`. It is still possible after confirming.
13. **The Sources page shows a static rule table.** It can drift from the code if rules change without updating `RULE_TABLE` in `src/ui_core.js` (SOURCES.md is generated from that same table).
