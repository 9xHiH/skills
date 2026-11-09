# المدرب العسكري للياقة البدنية — Military Calisthenics Coach v5 (development)

Offline, Arabic RTL, single-file coach workstation. A coach can:
- register many trainees and screen them;
- assess baseline capacity without maximal tests;
- generate **weekly-only** bodyweight plans using deterministic, explained rules;
- demonstrate each exercise with an original animated figure;
- run live sessions with counters and timers;
- review the week and adapt the next one;
- print an A4 plan and exchange records as JSON.

> **This is a coaching aid.** It is not a medical diagnosis, medical clearance or military certification, and it does not guarantee against injury. Its screening questions are custom wording, **not** the PAR-Q+. Its plan rules are rule-based. They are not AI or machine learning.

## Files

| Path | What |
|---|---|
| `dist/military_calisthenics_coach_v5.html` | **The app.** One self-contained file (~810 KB): HTML, CSS, JS and 199 exercise animations inline. No external resources. |
| `original/` | **v4 preserved unchanged** (`military_calisthenics_coach_v4.html`), the spec and the master prompt, plus `SHA256SUMS`. Git commit `65aeb40` is the rollback checkpoint. |
| `AUDIT_v4.md` | Verified audit of v4 (real exercise count, defects). |
| `SOURCES.md` | Source register, licensing decisions, rule→source and exercise→source mapping (generated from app data). |
| `CHANGELOG.md` | Preserved / added / changed. |
| `TEST_REPORT.md` | Environment, steps, observed results, failures, risks, **unfinished requirements**. |
| `src/` | Source modules (`anim.js` engine, `data/ex_*.js` exercises, `screening.js`, `engine.js`, `store.js`, `ui_*.js`). |
| `tools/` | `build.mjs` (bundles `dist/`), `check.mjs` (exercise data + animation validator), `preview.mjs` (pose contact sheets), `gen_sources.mjs`, `AUTHORING.md`, `ids.txt`. |
| `tests/` | `unit.mjs` (63 tests), `e2e.cjs` (29 browser tests), `a11y.cjs` (axe-core audit), results and evidence (sample PDF, plain and encrypted exports, screenshots). |

## Run offline
1. Copy `dist/military_calisthenics_coach_v5.html` anywhere, e.g. a USB stick or the desktop.
2. **Windows:** double-click to open it in Chrome or Edge. No installation, server or internet is needed.
   - Tested only in headless Chromium 153 on Linux. Real Windows Chrome/Edge testing has **not** been done.
3. **iPhone/iPad:**
   - Opening from the Files app shows a Quick Look preview, which may not run scripts.
   - Use "Share → Open in Safari" or a file browser that opens HTML in Safari.
   - Safari may clear local website data after a period without use, and storage differs from Windows.
   - **Not tested on a real iOS device.** Treat iOS as unverified and always export JSON.
4. Storage scope depends on the browser.
   - In Chromium (Chrome/Edge) all local `file://` pages share one storage area. E2E test T23 observed v4 and v5 at different paths seeing the same data.
   - Other browsers may isolate storage per file or folder.
   - Always use JSON export/import to move data.

## Simple workflow (default since round 3)
1. **الرئيسية:** press **«جدول لنفسي · Plan for myself»** or **«جدول لمتدرب · Plan for a trainee»**.
2. **One page, 3 short sections.** Every question is in Arabic and English, with tap-to-choose answers.
   - **About you:** name, age, height, weight, sex (used only to show pregnancy questions), goal, days, session length, where you train (home only, or home plus outdoors) and equipment.
   - **Health:** 8 short safety questions, plus 4 more only when they apply (pregnancy/postpartum). A «نعم» on a warning sign pauses the plan; it is never bypassed.
   - **Fitness now:** ranges, not tests (push-ups, squats, plank, walking, pull-ups if there is a bar), regular exercise yes/no, weaker arm/leg, and up to 2 areas to strengthen.
3. **The weekly plan appears immediately.**
   - 🏠 home strength days.
   - 🌳 outdoor walking days, or 🏠 walking in place if home-only. Walk length starts from the trainee's walking answer and goes up 5 minutes per walk after a week with at least 75% of walks done.
   - A one-sided exercise for the weaker limb. The trainee starts with the weaker side and does one extra set for it.
   - One exercise for each chosen area.
   - BMI ≥ 30 removes jumping and favours walking. Age ≥ 65 adds balance work. Both are labelled local, conservative rules.
4. **Live workout:** after each exercise, one tap — سهل / مناسب / صعب جداً / ألم (pain asks for 0–10 and where). After the workout there are 4 short questions.
5. **Weekly check-in:** 6 base questions plus pathway questions plus 2 adaptive exercise questions. Then «أنشئ جدول الأسبوع التالي».
6. **Print / PDF** and **«حفظ نسخة للمتدرب»:**
   - The reading copy is a small stand-alone HTML file with no scripts that opens on any phone.
   - Both show each exercise name in Arabic and English, illustrations, steps and the dose.
   - Each exercise has a **«ابحث عن فيديو»** YouTube search link for the English name. Links need internet; the app itself stays offline, and the video results are not reviewed by the app.

The detailed pages (profile management, detailed screening and clearance, detailed baseline, history, backup, sources) are still available under **المزيد · More**.

## Detailed coach workflow (under More)
1. **المتدربون:** create the profile.
   - Name and age are required. Choose available days, minutes, equipment and known limitations.
   - Sex is optional. It is used **only** to decide whether pregnancy/postpartum questions appear, never to set intensity.
   - Record the privacy and limitations acknowledgement (required).
2. **الفحص والتقييم:** run the branching screening (`SCR-5.0.0`). There are three outcomes:
   - `cleared-for-conservative-program` → the baseline assessment is enabled.
   - `needs-more-information` → no plan. The coach can record a documented professional clearance (who, date, limits).
   - `do-not-auto-prescribe / refer` → no plan and **no bypass**. This needs a new screening after assessment **plus** documented clearance.
3. **Baseline (`BL-5.0.0`):** sub-maximal tests that stop at a form break, effort 7/10 or a cap (push 20, squat 25, plank 60 s, …). They set a level per movement pattern. Pain ≥ 7 or a warning symptom → refer.
4. **الخطة الأسبوعية:** generate a 7-day plan (`RULES-5.0.0`).
   - Each week gets a unique plan ID with an ISO week and a check character, e.g. `PL5-2026W47-N3JM6-8FM87`.
   - Every exercise and dose shows *why* it was chosen.
   - Safe override: the coach can change exercises only among safety-filtered candidates and doses only within their ranges. A reason is required and logged, and earlier versions are kept as revisions. Blocked plans cannot be overridden.
5. **الحصة المباشرة:** run a session.
   - Animated demo, steps, rep counter, work timer and automatic rest timer with tones.
   - Every set is autosaved, so a partial session can be resumed.
   - An emergency stop button records a red flag.
   - A post-session check (6 questions) closes the session.
6. **المراجعة الأسبوعية:** answer mandatory safety questions and adaptive per-exercise questions.
   - The decision (progress / maintain / reduce / substitute / refer) uses **logged performance**. A trainee saying the week felt easy never triggers progression by itself.
   - Then generate next week. Earlier weeks are never overwritten.
7. **السجل والتقدم:** timeline, weekly completion/load chart, and search by plan ID, trainee ID or internal ID.
8. **التصدير والاستيراد:** JSON backup and restore (see below).

## Backup, import and moving between devices
- **Export everything** or **one trainee** as JSON (`MCC-EXPORT` v1 with an FNV-1a checksum for integrity; this is not encryption). The file contains health-screening answers, so share it only deliberately.
- **Import** checks:
  - JSON syntax, checksum and schema version;
  - required fields, ID formats and check characters;
  - references between records;
  - forbidden keys (`__proto__`), oversize files and future schema versions.
  
  A rejected file changes nothing. Before importing, the app saves a restore point (the last 3 are kept). Conflicting records are kept local by default; you can choose to prefer the imported version instead.
- **v4 data:** v4 data stored in this browser (`MC_V3`) or a v4 JSON backup can be migrated **read-only**. v4 plans appear in History, and migrated trainees must be re-screened under v5.
- **PDF:** printing uses the browser's Print → Save as PDF, which the Chromium engine produced in testing (9-page sample in `tests/evidence/weekly_plan_print.pdf`). **The PDF cannot be imported:** it has no machine-readable record. A plan ID found on paper can be looked up only if that record exists in this browser; otherwise import the JSON.
- **Optional encryption:** التصدير والاستيراد → «تفعيل التشفير».
  - Local data is stored as AES-GCM-256 ciphertext with a key derived from a passphrase (PBKDF2-SHA256, 310,000 iterations, Web Crypto). A lock screen asks for the passphrase on every open.
  - While encryption is on, restore points are kept in memory only, so no plaintext copy remains.
  - Export files can also be encrypted with their own passphrase; import asks for it.
  - **Forgetting the passphrase means the local data is unrecoverable.** Keep exported backups.
  - Not encrypted: the old v4 key `MC_V3`, which v5 never modifies, and the theme preference.
- **Data storage:** `localStorage` of this browser only. It is lost if site data is cleared and may not persist in private mode. A second tab cannot silently overwrite newer data: the stale tab's save is refused and it is asked to reload.

## Build and test (developers)
```
node tools/check.mjs                 # exercise data + animation geometry validation
node tools/build.mjs                 # → dist/military_calisthenics_coach_v5.html
node tests/unit.mjs                  # 55 unit tests (Node 22)
NODE_PATH=$(npm root -g) node tests/e2e.cjs tests/evidence   # browser tests (Playwright + Chromium)
AXE=/path/to/axe.min.js NODE_PATH=$(npm root -g) node tests/a11y.cjs tests/evidence/export_full.json   # axe-core WCAG A/AA audit (axe-core not bundled)
node tools/gen_sources.mjs           # regenerate SOURCES.md
```
To add an exercise, follow `tools/AUTHORING.md` (pose coordinates, required fields, visual-check procedure).

## Limitations
See `TEST_REPORT.md → Unfinished requirements and risks`. In short:
- The library has 199 verified exercises, not 200. Three planned ones were dropped because their drawings were misleading.
- Sources were seen through search results only and must be checked by a qualified person.
- No real-device testing has been done.
- Some animations are schematic. The affected exercises say so in their descriptions.
