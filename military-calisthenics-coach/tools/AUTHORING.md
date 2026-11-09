# Exercise authoring guide (for src/data/ex_*.js)

Each data file is a plain script: `(function(){ ... MCEX.add({...}, {...}); })();` — see `src/data/ex_ref.js` (7 calibrated examples: squat, push-up, forearm plank, glute bridge, reverse lunge, pull-up, jumping jack). **Copy its style exactly.** All text the user sees is Arabic (Modern Standard, clear, imperative "اثنِ/ادفع"), except `en`.

## Record fields (all required unless marked optional)
| field | meaning |
|---|---|
| id | stable ID from `tools/ids.txt` (use exactly the ID and Arabic name assigned to you) |
| ar / en | Arabic / English names |
| fam | movement family slug (e.g. `push-up`, `row`, `squat`, `lunge`, `plank`, `crunch`, `jack`, `stretch-hip`) |
| pat | one key of `MCEX.PATTERN` in `src/data/_core.js` |
| cat | one key of `MCEX.CAT` (upper/lower/core/cardio/mobility/balance) |
| role | array of `main` / `warmup` / `cooldown` (mobility drills usually warmup and/or cooldown; static stretches = cooldown) |
| lvl | 1 beginner, 2 intermediate, 3 advanced |
| prim / sec | keys of `MCEX.MUSCLE` |
| eq | keys of `MCEX.EQUIP` (never `none`; empty array = no equipment) |
| space | short Arabic text, e.g. `'1×2 م'` |
| impact | `none` / `low` / `high` (high = any jump/hop/running flight phase). high ⇔ flag `impact` |
| pos | `standing, supine, prone, side, kneeling, quadruped, seated, hanging, mixed` (mixed = moves between floor and standing). supine ⇒ flag `supine`; prone (lying on belly) ⇒ flag `prone`; any floor position ⇒ flag `floor` |
| flags | keys of `MCEX.FLAG`. Be honest and complete — the plan engine uses these to EXCLUDE exercises for injuries, pregnancy (supine, prone, impact, balance, iap, inversion, isometric_long), postpartum (impact, iap) and limitations (wrist, shoulder, overhead, knee, lowback, ankle, hip, neck, elbow, grip) |
| dose | `{u:'reps', sets:[a,b], reps:[a,b], rest:[a,b], tempo?:'2-0-2', side?:true}` or `{u:'time', sets, sec:[a,b], rest}`. Conservative bodyweight defaults (configurable, not prescriptions). `side:true` = per side |
| setup | one or two sentences: starting position |
| steps | 3–5 execution steps |
| breath | breathing cue. Never instruct breath-holding |
| errors | 2–5 common technique errors |
| stop | 2–4 exercise-specific stop signs (universal stop signs are added automatically, do not repeat chest pain etc.) |
| prereq | REQUIRED for lvl ≥ 2: what the trainee must master first (e.g. `'إتقان ... 3×10 دون ألم'`) |
| easier / harder / subs | arrays of IDs from `tools/ids.txt` (may point to other authors' IDs). `subs` = safer substitutes for a similar purpose |
| src | keys among: `ATP722` (ONLY if the exercise is a named drill in ATP 7-22.02 – also set `mil`), `FM722`, `ACSM-RT`, `ACSM-RT26`, `NHS-STR`, `NIA`, `ACOG804`, `GOOM2019`, `AFT`, `PAG2018`, `WHO2020`. These mean "general basis consulted", not "this source depicts this exact picture". Do not invent new keys |
| mil (optional) | e.g. `'ATP 7-22.02 — Preparation Drill: Prone Row'` — only for drill names listed as ATP/AFT in ids.txt notes |
| desc | accessible description of what the animation SHOWS (Arabic, starts with `رسم جانبي:` or `رسم أمامي:`). If the view cannot show a key detail (e.g. hand width), say so explicitly |
| anim | see below |

## Animation (the most important part — it must match the named movement)
Engine: `src/anim.js`. SVG viewBox 240×160, **y grows downward, floor at y=150**. Figure faces RIGHT (forward = +x). Angles in degrees, math convention: 0 = right, 90 = up, -90 = down, 180 = left.

Pose object `p`:
- `h:[x,y]` hip centre; `t` torso angle from hip to neck (90 upright; 0 = head to the right lying; 180 = head to the left lying); `n` optional head tilt relative to torso.
- `a:[near, far]` arms, `l:[near, far]` legs. Each limb is EITHER `[upperAngle, lowerAngle]` (absolute angles, forward kinematics) OR `{p:[x,y], b:1|-1}` (IK target for wrist/ankle; `b` picks which side the elbow/knee bends — if a knee or elbow bends the wrong way, flip `b`). Do not mix modes for the same limb between keys.
- `f:[near, far]` foot angles (side view default 0 = toes forward/right; on toes in a plank ≈ -75; toes pointing down when lifted ≈ -60..-120).
Segment lengths: torso 46 (hip→neck), neck→head-centre 12, head radius 9, upper arm 25, forearm 23, thigh 34, shin 32, foot 11. Shoulder sits 4 below the neck along the torso. Standing: `h:[120,84], t:90` with legs reaching ankles at y=150.
- Front view (`view:'front'`): shoulders ±11 and hips ±7 sideways; `near` = the limb on screen-left. Use front view for side-to-side movements (jacks, lateral lunge, side plank seen from the front, windmill, arm circles, sumo squat).

Spec: `anim:{view:'side'|'front', props?:[...], trace?:'hip'|'neck'|'head'|'wrN'|'anN'|'knN', hang?:true, floor?:false, air?:[keyIndexes], keys:[{p, d:ms, hold?:ms, lab:'Arabic phase cue incl. breathing'}]}`. Keys loop (last → first). Use ≥2 keys; use 3–4 keys for multi-phase moves (burpee, lunge+turn, up-down plank). `hold` = ms paused at that key (use for isometric holds and pauses).
Props: `{k:'wall',x}`, `{k:'chair',x,w,h,back:'l'|'r'}`, `{k:'box'|'step',x,w,h}`, `{k:'table',x,w,h}`, `{k:'barx',x,y}` (bar seen end-on, side view), `{k:'bar',y,x1,x2}` (front view bar), `{k:'mat',x1,x2}`, `{k:'towel', to?:[x,y]}` (dashed line from near wrist to far wrist or to a fixed point).
Supports: if a hand/foot rests on a prop, put the IK target exactly on the prop surface (chair seat top y = 150 - h).

Validation (`node tools/check.mjs ex_yourfile` must print ERRORS 0): IK reach error ≤ 2.5px (targets must be reachable: arm reach 48, leg reach 66), nothing more than 3px below the floor, and the lowest body point must touch the floor (within 4px) unless the key is listed in `air`, `hang:true`, or a support prop exists.

## Visual verification (mandatory)
`W=300 NODE_PATH=$(npm root -g) node tools/preview.mjs /tmp/claude-0/-home-user-skills/ea2f4d69-1265-5e21-b6ad-d3730d0835d9/scratchpad/<yourname>.png <ID-prefix>` renders every key pose; open the PNG with the Read tool and check, for every exercise: joints bend the right way, contacts are on the floor/prop, the pose is recognisably THE named exercise, and the start pose (faint ghost) vs end pose shows the real range of motion. Render in batches (prefix filter, e.g. `PU-`) so images stay legible. Fix and re-render until correct.

## Honesty rules
- Do not claim a source shows something it does not. Technique text must be standard, conservative coaching guidance.
- Do not pad: if you cannot produce an animation that is recognisably correct for an assigned ID, leave that exercise OUT and report it.
- No copyrighted text copied from any website.
