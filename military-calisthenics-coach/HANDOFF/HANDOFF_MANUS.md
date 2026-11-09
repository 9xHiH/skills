# عزم · AZM — handoff (for Manus or any developer)

**What it is:** an offline Arabic/English fitness coach in ONE HTML file. A coach or an individual creates a weekly plan, either bodyweight (home + outdoor walking) or **gym with weights**, from age, height, weight, health answers, current fitness, a weaker side and goals (e.g. **60 push-ups / 60 sit-ups in 2 min**, a target weight). It has animated exercise demos, a live workout timer, weekly adaptation, a bilingual PDF, a trainee reading copy, and **multi-user accounts** (username/password) for sharing with another coach.

- App: `dist/military_calisthenics_coach_v5.html` (open by double-click). Full project map: `HANDOFF/project_manifest.json`.
- Status at handoff: unit 72/72, browser E2E 31/31 (headless Chromium, offline), axe-core 0 violations, 231 exercises with 0 data errors.

## Rules you must keep
1. Edit `src/…` and then run `node tools/build.mjs`. `dist/` is generated. If you can only edit the single HTML file, say so, because the source and the build will then diverge.
2. No internet calls, CDNs, external fonts or analytics. Only the user-clicked YouTube search links are external.
3. A health red flag (chest pain, fainting, …) **must block** the plan. Never add a bypass.
4. Plans stay weekly. Do not touch `original/military_calisthenics_coach_v4.html`.
5. After any change, run `node tools/check.mjs` and `node tests/unit.mjs`, and the E2E tests if available.

## Where to change things (short)
| Want to change… | File |
|---|---|
| Colours, fonts, spacing, layout | `src/styles.css` (tokens at top: khaki `--acc`, black `--bg`, grey `--line`) |
| Logo / app name | `src/index.html` (inline SVG) |
| Home, setup form, More page | `src/ui_setup.js` |
| Plan page, PDF, reading copy | `src/ui_plan.js` |
| Workout screen, weekly check, history | `src/ui_session.js` |
| Exercise library / player | `src/ui_library.js` |
| Accounts, backup page | `src/ui_core.js` (encCard), `src/store.js` |
| Plan logic | `src/engine.js` (bodyweight), `src/gym.js` (gym), `src/goals.js` (goals, ranks) |
| Exercises | `src/data/ex_*.js` (guide: `tools/AUTHORING.md`) |

## What remains (in priority order — pick from the top if credits are limited)
1. **Visual polish (your strength):**
   - mobile bottom tab bar instead of the side nav on phones;
   - cleaner cards and spacing;
   - smoother transitions;
   - a confetti or celebration effect on a new record or promotion;
   - check the phone layout at 390 px.
2. **Onboarding:** a 3-screen intro (what the app does, privacy, how to use it) shown once.
3. **Fix weak drawings:** `GY-BB-OHP` is clipped at the top. The schematic ones are listed in the manifest `knownIssues`.
4. **Full English mode:** a language toggle. The main flow is bilingual; the detailed pages under More are Arabic-only.
5. **Checker tweak:** allow gym machine/bench exercises to be seated or supine without the `floor` flag (`tools/check.mjs`).
6. **Real-device tests** (Windows Chrome/Edge, iPhone Safari, Android, a real printer), with results written in `TEST_REPORT.md`.
7. **Expert review needed (not a coding task):**
   - verify the sources in `SOURCES.md` against the original documents;
   - a doctor or physiotherapist reviews the LOCAL rules: pain thresholds, BMI ≥ 30 means no jumping, weak side +1 set, walking +5 min, goal projection 4–8 %/week.

## Do NOT do
- Do not remove health questions or the red-flag block.
- Do not invent test results.
- Do not add a server or tracking without the owner's approval.
- Do not promise goal dates: projections are estimates.

## Known limits (tell users)
- **Storage:** data lives in this browser. Use «حفظ نسخة كاملة مشفرة» (full encrypted copy) to share or back up.
- **Accounts:** they protect the file locally. A removed user can still open copies saved before removal.
- **PDF:** it cannot be imported back; use the JSON or encrypted copy for that.
