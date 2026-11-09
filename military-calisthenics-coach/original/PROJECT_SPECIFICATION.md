# Military Calisthenics Coach — Complete Project Specification

**Document status:** Target specification for Claude implementation; NOT a claim that the current app satisfies it.  
**Source baseline:** `military_calisthenics_coach_v4.html` (preserve unchanged).  
**Product:** Arabic RTL, fully offline, single-user coach workstation with multiple trainee profiles.  
**Planning interval:** **WEEKLY ONLY**. No monthly or yearly plan-generation UI. Longitudinal progress charts may span months/years without creating monthly/yearly plans.

## 1. Purpose and boundaries

Create a personalized military-style calisthenics coaching tool for trainees of different abilities, including men and women. The coach registers trainees, conducts pre-exercise screening, measures baseline capacity, assigns a suitable weekly program, explains every movement with accurate visuals and counters, tracks session results, asks adaptive follow-up questions, and safely produces the next week's plan. The program must be entirely functional without internet, advertising, subscriptions, cloud AI or external services. It is a training aid, **not** medical clearance, a diagnostic tool, a military certification or a guarantee of injury prevention.

## 2. Preserve and audit the existing project

Inspect the attached HTML, identify real working features and defects, and make a feature-by-feature audit. Earlier development reports described 105 exercises/variations, weekly plans, multiple trainees, serial numbers, timers, SVG illustrations, print-to-PDF and JSON storage. These are **unverified historical claims** until independently audited. The current HTML title may still say `v3`; correct version labels in the development copy only. Keep v4 intact and save a rollback snapshot. Never replace real functions with decorative controls.

## 3. Users, identity and local data

- Coach can create, edit, archive, search and switch between many trainees without mixing records.
- Trainee: display name (required), optional internal trainee ID, optional coach name, age or birth year, sex only when relevant to screening, height/weight if relevant and consented, goals, exercise experience, availability, equipment, accessibility needs and preferences.
- Record informed acknowledgement of local-data privacy and limitations. Avoid collecting unnecessary sensitive details; use optional fields and clear deletion/export controls.
- Unique, collision-resistant trainee ID and **unique plan ID per week**. Human-readable IDs include a schema/version prefix; prevent accidental reuse. Keep immutable history and revisions with timestamps, rule version and reason.
- Save data locally with an explicit storage status and robust backup/export/import in JSON. Validate schema, handle corruption, prevent silent overwrite, and support migrations. Never claim localStorage survives browser cache deletion, private mode, or switching devices.
- No network requests, CDNs, tracking, accounts or external assets. Verify with code inspection and network monitoring in a browser where possible.

## 4. Screening and evidence hierarchy

**Primary research sources to evaluate and cite precisely (verify current versions and usage permissions):**
- PAR-Q+ and ePARmed-X+ official preparticipation screening resources (official site: https://eparmedx.com/).
- ACSM Guidelines for Exercise Testing and Prescription and current ACSM position stands/consensus statements.
- American Heart Association guidance on resistance exercise and cardiovascular precautions.
- CDC adult physical activity recommendations (https://www.cdc.gov/physical-activity/).
- U.S. Army Holistic Health and Fitness (H2F), current official field manuals/resources (https://www.army.mil/).
- U.S. Marine Corps Force Fitness / HITT official resources (https://www.fitness.marines.mil/).
- ACOG guidance on physical activity in pregnancy and postpartum (https://www.acog.org/).
- Appropriate validated exertion and pain scales, citing the original source and correct use.

Use exact source title, date/version, direct URL, access date and mapping to implemented decision. Do not mislabel adapted questions as the original validated instrument. Do not reproduce proprietary questionnaires verbatim without checking rights/permissions. Clinical screening must not be improvised as a substitute for formal medical evaluation.

### Mandatory screening logic

- Preparticipation health screening and symptom flags before exertion; age-appropriate and condition-specific pathways.
- Ask about exertional chest discomfort, unexplained fainting/dizziness, unusual breathlessness, acute injury, severe pain, medical activity restrictions, relevant cardiac/respiratory/metabolic conditions and current symptoms. Exact wording and referral thresholds must follow documented sources.
- If relevant, pregnancy, postpartum recovery, pelvic-floor symptoms, abdominal pressure and medical advice; provide appropriate pathways and referrals, not blanket sex-based assumptions.
- Provide `cleared-for-conservative-program`, `needs-more-information`, and `do-not-auto-prescribe / refer` outcomes, with explicit explanation and no bypass through level selection.
- Do not perform a maximal fitness test on someone who is not appropriately screened.
- Include warm-up, cool-down, recovery, hydration and clear stop-exercise warnings. Avoid implying zero injury risk.

## 5. Intake and assessment question architecture

Suggested question **budgets, not validated official counts**:

| Stage | Approximate questions | Purpose |
|---|---:|---|
| Initial intake | 18–25 | Identity, goals, experience, schedule, equipment, screening |
| Baseline movement/ability assessment | 6–10 | Safe functional capacity and movement limitations |
| Post-session check | 4–6 | Completion, perceived exertion, pain, technique, recovery |
| End-of-week review | 10–14 | Compliance, exertion, symptoms, sleep, soreness, progress |
| Conditional follow-ups | As needed | Specific concerns, pregnancy/postpartum, red flags, equipment |

Question count must adapt by branching, not force irrelevant questions. Preserve source attribution and mark custom items as custom. At weekly review, rotate relevant questions based on prior exercises and responses, while retaining mandatory safety questions. Record raw answers and assessment version.

## 6. Exercise library

Target a well-curated **200 or more distinct, documented movements/variations** when research and accurate content permit; do not fake quantity. Distinguish movement families, progressions and duplicate names. Include beginner, intermediate, advanced and appropriate low-impact / pregnancy-postpartum options where supported by evidence. Not every movement is appropriate for every trainee. Include upper body, lower body, trunk, locomotion, mobility, stability, endurance and warm-up/cool-down; clearly flag equipment-dependent movements.

Each exercise record must have:
- Stable ID, Arabic and English names, family, primary/secondary muscle groups, skill level, movement pattern, required equipment and space.
- Contraindications/cautions and screening dependencies, with source attribution and scope limits.
- Detailed setup, execution, breathing, repetitions/hold duration, common technique errors and stop criteria.
- Easier/harder progressions and safer substitutions with clear prerequisites.
- Accurate original or properly licensed embedded instructional image(s), ideally step-by-step start/end or short offline animation, plus accessible text description. Generic reused silhouettes do **not** count as verified technique images.
- Suggested sets/reps/time/rest ranges as configurable defaults, not rigid medical prescriptions.
- A manual rep counter and interval/rest timer; be honest that camera-based automatic counting is out of scope unless separately implemented and tested.

## 7. Explainable weekly program engine

Generate **7-day schedules only**, with training and recovery/activity days chosen based on trainee readiness and goals. Inputs: screening status, baseline capacity, preferences, training history, available days, session duration, equipment, recovery and previous outcomes. Outputs: day-by-day plan with exercise order, warm-up, sets, reps/holds, rest, modifications and safety notes. Never prescribe solely based on male/female labels.

Use deterministic, versioned rules. Prevent unsafe jumps in load, repeated overloading of the same patterns, excessive session volume, and advancement despite pain or poor form. Use conservative progression and record why a movement or load was chosen. A trainee can report a session as easy without triggering automatic high-intensity escalation. Provide regression/substitution when indicated. Support coach review/override **only within safe bounds**, with a logged reason; a red-flag medical block cannot be overridden by a normal coach setting.

## 8. Session and weekly feedback

During each workout: show instructions and illustrations, timer, rep counter, set completion, subjective exertion, technique quality, pain/symptoms and comments. Save partial sessions safely. At end of week: generate adaptive questions referencing the previous week's specific activities, retain mandatory screening flags, and show an understandable decision summary: progress, maintain, reduce, substitute, or refer. Record actual completed sets/reps and missed days, not just perceived difficulty. Never treat serious pain or concerning symptoms as routine soreness.

## 9. PDF, plan IDs and returning trainees

- Produce a professionally formatted Arabic RTL A4 weekly plan, including trainee name, coach name, plan serial, week range, exercises with illustrated instructions/QR-free offline references, dosage, rest, safety notices, feedback section, source/rules version and creation date.
- Implement via browser print-to-PDF if a true embedded PDF generator is not available; label the method correctly and test Arabic print layout.
- A serial lookup works only when the corresponding local database record exists. Cross-device restore must use JSON (or another proven embedded-data exchange mechanism). **Do not claim an arbitrary PDF can be parsed and restored automatically.**
- If PDF import is offered, define exactly what PDF structure is supported, test round-trip with real generated PDFs, and fall back to JSON for full fidelity. Allow searching plans by trainee ID and plan ID.
- For the next week, import/locate prior record, collect follow-up responses, compute and export the new weekly plan, preserving all historical versions.

## 10. UI / UX

Professional Arabic RTL dashboard, readable large text, responsive Windows desktop and mobile layout. Main areas: Dashboard, Trainees, Intake/Screening, Exercise Library, Weekly Plan, Live Session, Weekly Review, History, Export/Import, Sources & Safety. Clear status for screening and plan readiness; meaningful empty states and validation errors. Accessible keyboard controls, sufficient contrast, labels, print styles and no inaccessible color-only signals. Avoid intrusive pop-ups and any advertising.

## 11. Technical constraints

- A self-contained `.html` file with embedded CSS, JS and necessary licensed assets; no external dependencies or network access.
- No cloud backend, remote AI, account, telemetry, advertising or subscription.
- Use IndexedDB if needed for larger data, with a robust JSON backup path; test `file://` limitations in target browsers. Do not promise identical storage behavior across iOS and Windows.
- No camera permission unless the user explicitly authorizes a later camera-counting feature.
- Security: validate imported JSON, avoid HTML injection, sanitize filenames/print content, and do not execute imported data.
- Data minimization, consent and an easy delete/export option. No medical records shared without explicit action.

## 12. Acceptance tests and deliverables

### Required tests
1. Offline operation with network disabled; no external requests.
2. Register at least two trainees, create different plans, and verify complete isolation.
3. Red-flag screening blocks automatic prescription; conditional branches function.
4. Different abilities and availability produce explainably different weekly schedules.
5. Post-session logs and weekly review change the next plan appropriately; painful symptoms block unsafe progression.
6. Unique plan IDs, local lookup, JSON export/import round trip, malformed import handling and history preservation.
7. Print an Arabic RTL weekly PDF with correct pagination, names, IDs, exercise details and no clipped tables.
8. Exercise images match named movements and all counters/timers actually work.
9. Regression checks against the v4 feature inventory.
10. Test on Windows Chrome/Edge; document iOS Safari/Files limitations and only claim real-device testing if actually performed.

### Required deliverables
- `military_calisthenics_coach_v5.html` or a clearly versioned later development artifact; never overwrite v4.
- `README.md` with offline use, backup, import, PDF workflow and limitations.
- `SOURCES.md` with authoritative citations and mapping to rules/exercises.
- `CHANGELOG.md` with preserved/added/changed features.
- `TEST_REPORT.md` with environment, steps, observed outputs, failures and unresolved risks.
- A truthful gap list for any incomplete or impossible requirement, plus concrete next steps.

## 13. Non-negotiable completion rule

Do not declare the project finished merely because the interface loads or a syntax checker passes. Identify any incomplete core requirements and do not invent images, medical approval, scientific validation, exercise totals, PDF import capabilities or successful browser/device tests. Preserve the original files and ask before publishing, uploading or merging into another project.
