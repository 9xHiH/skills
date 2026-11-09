# Audit of `military_calisthenics_coach_v4.html` (baseline, preserved unchanged)

- File: `original/military_calisthenics_coach_v4.html`, 44,277 bytes, SHA-256 `0a735e162619d097a9b479ed9d5bb5069fd202e82026bfb1d5cd7fe184e13b94` (unchanged after this work — verified with `sha256sum`, see TEST_REPORT.md).
- Method: full source read + parsing the embedded exercise arrays with a script + running v4 in headless Chromium (E2E test T23). Findings marked *(code inspection)* were not executed.

## Verified inventory

| Area | What v4 actually contains |
|---|---|
| Version labels | `<title>` says **v3**, header says **v4**, localStorage key is `MC_V3`. |
| Exercises | Two arrays: `EX` (61) + `EXTRA` (44) = **105 entries**. **2 exact duplicate names** (`جسر الحوض بساق واحدة`, `اندفاع جانبي`) → 103 unique names. **~20 near-duplicates** (same movement, different wording), e.g. `مشي بالمكان`/`مشي في المكان`, `سكوات توقف`/`سكوات بتوقف`, `ديد بغ`/`حشرة ميتة بالتبادل`, `متسلق جبال بطيء`/`تسلق الجبل البطيء`, `بلانك جانبي`/`بلانك جانبي كامل`, `عقلة قبضة سفلية`/`عقلة بقبضة معكوسة`, `سحب منشفة ثابت`/`سحب منشفة متساوي القياس`, `ضغط ضيق` (متوسط) / `ضغط قبضة ضيقة` (متقدم — same move, conflicting level). Auditor estimate: **≈83 distinct movements**. The historical claim "105 exercises" counts entries, not distinct movements. |
| Exercise data | Each entry has only `name`, `cat` (6 categories), `level`, one-sentence `how`. No IDs, muscles, equipment, contraindications, errors, stop criteria, progressions, dosage or sources. Equipment needs (bar, chair, table) are not recorded. |
| Visuals | `drawFigure(cat)` draws **one of 6 generic category silhouettes** reused for every exercise in the category; v4 itself labels them "approximate category sketch". No per-exercise illustration, no animation. |
| Questionnaire | 30 intake fields (identity, 9 screening yes/no, pregnancy/postpartum/pelvic, capacity self-report). Field key `preg` is actually the chronic-disease question (mislabelled). Sex defaults to `ذكر`; pregnancy questions are shown to everyone. |
| Screening logic | `risk()` returns `danger||special||medical||(…)` — the "clearance obtained" answer has **no effect**, so any positive answer blocks permanently. There is no trainee edit screen → **dead end** (a blocked trainee can never get a plan). Pregnancy `نعم` = blanket block (no pathway). `لا أعلم` on BP/chronic blocks. No age check. |
| Plan generation | Picks **one exercise per category (6 total)** with a hash, same list for the whole plan; **no day-by-day schedule, no dates**; days clamped 1–5; sets/reps fixed tables (1×6 / 2×9 / 3×12; holds always 25 s); rest always "60–90 s". Level from self-reported counts only. |
| Progression bug | Progress condition `completed >= Math.min(pl.days, pl.period/7)` = `min(days, 1)` = **1 session** → completing a single session (plus RPE ≤5) triggers progression to 3×12. *(code inspection + arithmetic)* |
| Review | 12 fixed questions; RPE input allows 0–100; extra questions for `period >= 28` are dead code (period select only offers 7 days). No per-session logging; decision uses perceived difficulty only. |
| IDs | `'MC-' + Date.now().toString(36) + 5 Math.random chars`; same prefix for trainees and plans; no check character; no schema version. |
| Storage | localStorage `MC_V3`; `save()` has **no try/catch** (quota/disabled storage throws); corrupt data silently replaced by empty DB on next save. |
| Import/export | Full and per-trainee JSON export; import merges by ID with only top-level array checks. **HTML injection**: imported `p.id` is inserted unescaped into an `onclick` attribute and `<option value>`; plan fields `sets`, `reps`, `unit`, `period` are unescaped; missing `created` crashes `planHtml`. *(code inspection — not executed)* |
| Print | `window.print()` of one plan; no coach name, no week dates, no illustrations. |
| Timer / counter | One global rep counter and countdown timer in the library tab; work as described (no sound, no rest intervals). |
| Network | No `fetch`/XHR/external `src`/`href`; URLs appear only as plain text. Confirmed: v4 runs offline in E2E T23. |
| Accessibility | Inline `onclick` handlers, no labels on several controls, colour-only status, no keyboard focus styles. |

## What v5 keeps (regression map)
Every v4 capability exists in v5 (see `TEST_REPORT.md` → regression table): multiple trainees, local storage, JSON full/per-trainee export and merge-import, serial lookup (now plan ID with check character), weekly plan, print-to-PDF, end-of-plan review with safety questions, rep counter and timer, library with category/level filters, warnings/disclaimer, references. v4 data in the same browser (`MC_V3`) or a v4 JSON backup can be migrated **read-only** (v4 data is never modified).
