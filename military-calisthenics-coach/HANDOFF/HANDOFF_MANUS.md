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

---

## أمر جاهز للنسخ إلى Manus · Ready-to-paste brief

> **بالعربي:**
> طوّر واجهة تطبيق «عزم · AZM» المرفق، دون كسر منطقه، لتكون بمستوى عالمي يشعر من يفتحها بأنه جندي «جلمود»: متحمس، واثق، وكل شيء سهل ومرن.
>
> **الإحساس والتصميم**
> - هوية عسكرية تكتيكية فاخرة بالألوان الحالية: خاكي وأسود ورمادي.
> - خطوط عريضة واضحة، ومسافات مريحة، وبطاقات أنيقة.
> - لا شيء يوحي بتصميم قديم من سنة 2000.
>
> **الحيوية والتفاعل** (ليست صوراً فقط)
> - انتقالات ناعمة بين الصفحات.
> - أزرار لها استجابة لمس وضغط واضحة.
> - عدادات وأرقام تتحرك عند التغيّر، وحلقات تقدم.
> - مؤقت راحة بصري.
> - لحظة احتفال عسكرية عند رقم قياسي أو ترقية رتبة، مثل ختم أو وسام يسقط أو شارة تلمع.
> - احترم تقليل الحركة لمن يفضّله.
>
> **التحفيز**
> - جمل إيجابية قصيرة ومتجددة، بالعربي والإنجليزي، تظهر:
>   - بين المجموعات وأثناء الراحة؛
>   - بين تمرين وآخر؛
>   - عند الرجوع للملف؛
>   - بعد كل تمرين.
> - هدفها رفع الثقة بالنفس والاستمرار، مثل «الانضباط يصنع الأبطال»، «أنت أقوى من أمس»، «خطوة أقرب لهدفك».
> - لا تكرّر نفس الجملة متتالية.
>
> **الطابع**
> - رسمي ومحترم.
> - لا تضف أي صور لنساء أو فتيات. الرسوم المتحركة الحالية والأيقونات المحايدة تكفي، ولا حاجة لصور فوتوغرافية.
>
> **تمارين أكثر ورسوم أوضح** (إن استطعت)
> - حسّن وضوح الرسوم: جسم بحجم وسماكة واقعية، مفاصل أوضح، ظلال خفيفة، وزوايا عرض أفضل.
> - أصلح الرسوم الضعيفة المذكورة في `knownIssues` داخل ملف JSON.
> - أضف تمارين حقيقية جديدة بالشرطين التاليين:
>   - كل تمرين حركة حقيقية معروفة باسمها، بمسمى عربي وإنجليزي صحيحين.
>   - لا حشو ولا تكرار بأسماء مختلفة.
> - اتبع مواصفة السجل في `tools/AUTHORING.md`، ويجب أن ينجح `node tools/check.mjs` بلا أخطاء.
> - الرسوم يجب أن تكون:
>   - أصلية أو مرخّصة صراحة؛
>   - مضمّنة في الملف نفسه، دون روابط خارجية؛
>   - مطابقة للحركة المسماة؛
>   - خالية من صور النساء أو الفتيات.
> - لا تنسخ صوراً أو رسوماً محمية بحقوق من مواقع أو تطبيقات أخرى.
>
> **النصوص**
> - لا تُظهر في الواجهة أو الشعار أو الشارات أي عبارة مثل «بدون إنترنت» أو «Offline» أو «محلي» أو «Local».
> - أبقِ سطراً واحداً رسمياً داخل صفحة النسخ الاحتياطي فقط، يذكّر بحفظ نسخة احتياطية، مثل: «احفظ نسخة كاملة بانتظام لحماية سجلك».
>
> **أمور ثابتة لا تُغيَّر**
> - لا اتصال بالإنترنت ولا مكتبات خارجية ولا تتبع.
> - علامة الخطر الصحي توقف الجدول دون تجاوز.
> - الجداول أسبوعية.
> - عدّل ملفات `src/` ثم ابنِ بالأمر `node tools/build.mjs`.
> - أعد تشغيل الفحوص `node tools/check.mjs` و`node tests/unit.mjs` وتأكد أنها ناجحة.
> - لا تدّعِ نتائج لم تحدث فعلاً.
>
> **التسليم:**
> - الملف المبني الجديد؛
> - قائمة بما غيّرته؛
> - لقطات شاشة للكمبيوتر والجوال (390px)؛
> - قائمة صريحة بما لم يُنجز.

> **English:**
> Upgrade the UI of the attached «عزم · AZM» app to a world-class level without breaking its logic. Anyone who opens it should feel like a tough, confident soldier: energised, with everything feeling easy and flexible.
>
> **Look and feel**
> - Premium tactical-military identity in the current khaki/black/grey palette.
> - Bold, clean typography, generous spacing, refined cards.
> - Nothing that looks like a 2000-era page.
>
> **Life and interaction** (not just pictures)
> - Smooth page transitions.
> - Buttons with clear touch/press feedback.
> - Animated counters and progress rings.
> - A visual rest timer.
> - A military-style celebration on a new personal record or rank-up (stamp, medal drop, badge shine).
> - Honour `prefers-reduced-motion`.
>
> **Motivation**
> - Short, rotating, positive Arabic/English lines that build confidence and consistency, shown:
>   - between sets and during rest;
>   - between exercises;
>   - when the user returns to the profile;
>   - after each workout.
> - Never repeat the same line twice in a row.
>
> **Tone and imagery**
> - Formal and respectful.
> - Do NOT add any images of women or girls. Keep the existing animated figures and neutral icons; no photos are needed.
>
> **More exercises and clearer illustrations** (if you can)
> - Make the figures clearer: realistic body proportions and thickness, clearer joints, subtle shading, better viewing angles.
> - Fix the weak drawings listed in `knownIssues` in the JSON file.
> - Add new real exercises, on two conditions:
>   - each one is a genuine, recognised movement with a correct Arabic and English name;
>   - no padding and no duplicates under different names.
> - Follow the record schema in `tools/AUTHORING.md`; `node tools/check.mjs` must pass with zero errors.
> - Illustrations must be:
>   - original or explicitly licensed;
>   - embedded in the file (no external links);
>   - accurate to the named movement;
>   - free of any images of women or girls.
> - Never copy copyrighted images or drawings from other sites or apps.
>
> **Wording**
> - Do not show «offline», «local», «بدون إنترنت» or «محلي» anywhere in the UI, logo or badges.
> - Keep only one formal backup reminder inside the Backup page, e.g. «Save a full copy regularly to protect your records».
>
> **Fixed rules (do not change)**
> - No network calls, external libraries or tracking.
> - A health red flag blocks the plan with no bypass.
> - Plans stay weekly.
> - Edit `src/`, then run `node tools/build.mjs`.
> - Re-run `node tools/check.mjs` and `node tests/unit.mjs` and make sure they pass.
> - Never claim results that did not happen.
>
> **Deliver:**
> - the new built file;
> - a change list;
> - desktop and 390 px mobile screenshots;
> - an honest list of anything not done.
