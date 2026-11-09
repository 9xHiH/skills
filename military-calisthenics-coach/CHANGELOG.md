# CHANGELOG

## 5.0.0-dev, round 3 (simplified, bilingual) — 2026-11-09
Requested by the user: fewer and clearer questions, Arabic and English, plans for yourself, home vs outdoor activities, plans based on height/weight/age/fitness, weak-side training, a clearer PDF with English names for finding videos, a reading copy for the trainee, and fewer options.
### Added
- **Setup page:** one page with 3 short sections, fully bilingual with tap-to-choose answers. It covers self or trainee, height/weight, home or home + outdoors, and a weaker arm/leg plus up to 2 focus areas.
- **Engine — places and walking:**
  - home strength days and outdoor-walk or home-walk days;
  - walking minutes that progress after a week with ≥ 75% of walks done.
- **Engine — trainee-specific additions:**
  - weak-side unilateral work (start weak side, +1 set), reusing a one-sided exercise already in the session instead of duplicating it;
  - focus-area exercises that are kept when the session is trimmed for time;
  - a BMI ≥ 30 rule: no jumping.
- **New exercises:** `PU-SA-WALL` (single-arm wall push-up) and `PH-DOOR-SA` (single-arm door-frame row). The library now has 199.
- **Print and reading copy:**
  - a new bilingual print layout with clear exercise cards (Arabic + English name, dose, steps, breathing, cautions, YouTube search link);
  - **«حفظ نسخة للمتدرب»** saves a stand-alone reading copy (HTML, no scripts).
- **Simple home page:** today's task for each profile, with buttons to start today's workout, open the plan or edit details.
### Changed
- **Health screening `SCR-5.1.0`:**
  - 8 general questions (previously 16), each with an English line.
  - Palpitations and ankle swelling merged into the breathlessness question; medication merged into the chronic-illness question.
  - Pregnancy contraindication lists replaced by one doctor-reported-problem question (→ needs documented obstetric clearance) plus one warning-signs question (→ refer).
  - Red-flag logic unchanged.
- **Navigation reduced to 6 items:** Home, Plan, Workout, Check-in, Exercises, More.
- **Library filters:** only search, type, and "suitable for this person".
- **Live workout:** one-tap rating after each exercise instead of 4 inputs.
- **Shorter question sets:** post-workout check 4 questions (previously 6); weekly review 6 base questions plus up to 2 exercises (previously 11 plus 3).
- **This is a deliberate deviation from the spec's question budgets.** The spec asked for 18–25 intake and 10–14 weekly questions; the user asked for fewer.

## 5.0.0-dev, round 2 — 2026-11-09
### Added
- **Exercise library expanded from 151 to 197**: 46 new documented variations, each with its own animation (`ex_upper2`, `ex_core2`, `ex_lower2`, `ex_mobility2`, `ex_cardio2`).
  - Three planned items were authored but **removed in final review because their drawings were misleading**: assisted archer push-up (read as a headstand), fire hydrant (read as a standing leg lift) and open book (too abstract). They are marked `OMITTED` in `tools/ids.txt`.
- **Engine:** per-pose length multipliers (`k`) depict foreshortening, and `top:true` gives an explicit view from above (no floor).
- **Optional encryption** with Web Crypto: PBKDF2-SHA256 (310,000 iterations) → AES-GCM-256.
  - Applies to local storage and to export files; adds a lock screen.
  - While encryption is on, plaintext restore points are removed and restore points are kept in memory only.
  - Covered by E2E T27.
- **Session guard:** confirmation before logging a session for a future day, or a second session on the same day.
- **Accessibility:** automated axe-core 4.10.2 audit (`tests/a11y.cjs`), with two fixes:
  - static thumbnails are now marked decorative;
  - green-button contrast in the dark theme is fixed.

  Result: 0 violations across 10 pages × 2 themes plus the exercise dialog.

### Changed
- `CA-SQTHRUST` is classified high-impact (feet thrust back together), so pregnancy/postpartum and 65+ pathways exclude it.
- The checker allows `pos:'seated'` without the floor flag when the exercise uses a chair.

## 5.0.0-dev — 2026-11-09 (development version; v4 untouched)

### Preserved (from v4, re-implemented and covered by tests)
- Multiple trainees with local storage. Data from v4 can be migrated read-only (T23).
- Full and per-trainee JSON export; merge import without duplicates (T16, T20).
- Lookup by serial number, now a plan ID with a check character (T15).
- Weekly plan generation (T5) and print / Save as PDF (T17).
- End-of-plan review with safety questions, which blocks progression on pain or symptoms (T11, T13).
- Rep counter and countdown timer (T18); exercise library with category and level filters.
- Disclaimer, stop-exercise warnings and reference list (Sources page).
- Offline operation with no network calls (T25).

### Added
- **Animation engine** (`src/anim.js`): an original 2D articulated figure.
  - Inverse kinematics keeps hands and feet planted.
  - Props: wall, chair, step, table, bar, towel.
  - Views: side, front and top.
  - Phase and breathing captions, a start-pose ghost and a joint trace.
  - Player controls: play/pause, scrub, start/end key, speed, mirror.
  - Honours `prefers-reduced-motion`.
- **Exercise library: 151 exercises/variations, all individually documented, in 68 families.**
  - Every record has: stable ID, Arabic/English names, family, movement pattern, primary/secondary muscles, level, equipment and space, impact, screening flags, dose ranges, setup, steps, breathing, errors, stop signs, prerequisites, easier/harder/substitute links, sources and an accessible description.
  - Every record has its own animation; the drawings are all distinct (T19).
  - 31 exercises carry Army doctrine drill/test names.
  - Validated by `tools/check.mjs`.
- **Screening `SCR-5.0.0`:** branching, custom wording mapped to PAR-Q+ topics and the ACSM 2015 logic.
  - Three outcomes; red flags cannot be bypassed.
  - Documented professional clearance can resolve "needs more information" only.
  - Pregnancy pathway (ACOG CO 804) and postpartum pathway (Goom 2019, NICE NG210), shown to anyone not recorded as male.
  - Adults only: under 18 → refer.
- **Baseline assessment `BL-5.0.0`:** six capped, sub-maximal tests that set a level per movement pattern.
- **Weekly plan engine `RULES-5.0.0`:**
  - Training days spread across the available days; A/B templates; warm-up and cool-down.
  - Recovery days and at least one rest day.
  - Session-time budgeting, equipment and safety filters.
  - Balance work for ages 65+; continuity of exercises week to week.
  - A "why" note on every decision.
- **Adaptation:** uses logged sets, effort, technique and pain, plus the weekly review.
  - Progression is capped at 3 exercises per week.
  - Global reduction for illness or fatigue; substitution and area exclusion for pain 4–6; refer for pain ≥7, warning symptoms or pain repeated in the same area.
- **Live session runner:**
  - Per-set autosave and resume; rep counter; work timer; automatic rest timer.
  - WebAudio tones (generated, no files) and vibration where supported.
  - Emergency stop, and a post-session check (6 questions).
- **Weekly review:**
  - 11 base questions plus pathway questions plus adaptive per-exercise questions (up to 3 exercises).
  - Live decision preview; reviews are immutable once saved.
- **Coach override within safe bounds:** a reason is required, and every change is logged with plan revisions.
- **Records:**
  - IDs `TR5-/SC5-/BL5-/PL5-YYYYWww-/SS5-/RV5-` built from 50 random bits (Web Crypto) plus a check character that detects every single-character typo (unit test).
  - Audit trail; History timeline with weekly completion/load chart; search by plan, trainee or internal ID.
- **A4 Arabic print:** identity block, IDs, week dates, rule/screening versions, safety box, day table (header repeats on each page), illustrated exercise cards with start and end figures, feedback log, and end-of-week questions.
- **Data safety:**
  - Strict import validation; prototype-pollution guard.
  - Restore points before import, delete and restore.
  - Detection and recovery of corrupt storage.
  - **Multi-tab overwrite protection** (T26).
  - Storage status badge; settings for the emergency number.
- **Accessibility:**
  - Skip link, labelled controls, focus outlines, keyboard-operable controls.
  - ARIA live regions for counters and phases.
  - Text and colour together for status; light/dark theme; responsive layout down to phone width (T24).
- **Security:**
  - Content-Security-Policy with `connect-src 'none'`; all output escaped (T22).
  - Build-time guard against external `src`/`href`.

### Changed
- Version labels are consistent (v5, `5.0.0-dev`); the storage key is `MCC_V5_DB`.
- Plans are strictly 7-day. The v4 "period" logic and the dead monthly branches were removed.
- Sex no longer defaults to male. Pregnancy no longer means a blanket block: there is a documented pathway instead.
- v4 defects fixed in v5 (see `AUDIT_v4.md`):
  - one-session progression bug;
  - clearance answer ignored, causing a permanent dead end;
  - unescaped IDs in HTML;
  - save without error handling;
  - generic category silhouettes;
  - duplicate exercises.

### Not changed
- `original/military_calisthenics_coach_v4.html` — byte-identical. SHA-256 `0a735e16…3b94` matches `original/SHA256SUMS`.
