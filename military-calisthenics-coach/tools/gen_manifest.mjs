// Generate HANDOFF/project_manifest.json — a machine-readable map of the whole project (for another agent/tool).
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import crypto from 'crypto'; import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = vm.createContext({}); ctx.globalThis = ctx;
const data = fs.readdirSync(path.join(root, 'src/data')).filter(f => f.startsWith('ex_')).sort();
for (const f of ['src/anim.js', 'src/data/_core.js', ...data.map(d => 'src/data/' + d), 'src/sources.js', 'src/screening.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
const X = ctx.MCEX, count = (arr, k) => arr.reduce((o, e) => (o[e[k]] = (o[e[k]] || 0) + 1, o), {});
const read = f => { try { return fs.readFileSync(path.join(root, f), 'utf8'); } catch (e) { return ''; } };
const last = f => read(f).trim().split('\n').pop();
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex');
const files = {
  'dist/military_calisthenics_coach_v5.html': 'THE APP — single self-contained offline file (built; do not hand-edit, edit src/ then build)',
  'original/military_calisthenics_coach_v4.html': 'v4 baseline — MUST stay byte-identical (sha256 in original/SHA256SUMS)',
  'src/index.html': 'HTML shell (header, logo SVG, nav container, dialogs); CSS/JS are injected by tools/build.mjs',
  'src/styles.css': 'All UI styling; theme tokens in :root (dark) and :root[data-theme=light]; khaki/black/grey palette',
  'src/fig.css': 'Styling of the animated exercise figures (SVG classes mc-*)',
  'src/anim.js': 'MCAnim — 2D articulated figure engine (FK/IK, props incl. gym equipment, player, validation)',
  'src/data/_core.js': 'MCEX registry + vocabularies (muscles, patterns, equipment, safety flags, universal stop signs)',
  'src/data/ex_*.js': 'Exercise records with per-exercise animation keyframes (bodyweight + gym files ex_gym_*.js)',
  'src/sources.js': 'MCSRC source register (status: seen-in-search / unverified / local)',
  'src/store.js': 'MCStore — IDs, localStorage persistence, import/export validation, v4 migration, encryption, multi-user accounts',
  'src/screening.js': 'MCScreen — bilingual health questions (SCR-5.1.0) and deterministic outcome rules',
  'src/engine.js': 'MCEngine — bodyweight weekly plan rules (RULES-5.0.0), adaptation, review questions, safe overrides',
  'src/gym.js': 'MCGym — weighted gym program (separate from bodyweight), double progression of load',
  'src/goals.js': 'MCGoals — numeric goals (e.g. 60 push-ups in 2 min, target weight), tests, projections, ranks/achievements',
  'src/ui_core.js': 'UI helpers, shell/render, trainees management, data/backup/accounts page, sources page',
  'src/ui_setup.js': 'Simple one-page bilingual setup, home page, More page',
  'src/ui_plan.js': 'Weekly plan view, safe change dialog, print/PDF layout, trainee reading copy (HTML)',
  'src/ui_session.js': 'Live workout runner, post-workout check, weekly review, history',
  'src/ui_library.js': 'Exercise library, animation player, rep counter, interval timer, audio cues',
  'src/ui_screen.js': 'Detailed screening page, documented clearance, detailed baseline (under More)',
  'src/main.js': 'Boot + global event delegation (data-act / data-form / change handlers)',
  'tools/build.mjs': 'Bundles src → dist (node tools/build.mjs)', 'tools/check.mjs': 'Validates every exercise record + animation geometry',
  'tools/preview.mjs': 'Renders key poses to PNG contact sheets for visual review', 'tools/AUTHORING.md': 'How to add an exercise (fields, pose coordinates, gym props)',
  'tools/ids.txt': 'Master exercise ID plan (OMITTED lines = drawings judged misleading)', 'tools/gen_sources.mjs': 'Regenerates SOURCES.md', 'tools/gen_manifest.mjs': 'Regenerates this manifest',
  'tests/unit.mjs': 'Unit tests (Node 22)', 'tests/e2e.cjs': 'Browser end-to-end tests (Playwright + Chromium, offline)', 'tests/a11y.cjs': 'axe-core accessibility audit (needs axe-core path in AXE env)',
  'README.md': 'How to use/run', 'SOURCES.md': 'Source register + rule/exercise mapping', 'CHANGELOG.md': 'Changes by round', 'TEST_REPORT.md': 'Test evidence + full gap list', 'AUDIT_v4.md': 'Audit of v4', 'HANDOFF/HANDOFF_MANUS.md': 'Human-readable handoff'
};
const manifest = {
  project: 'عزم · AZM — offline Arabic/English fitness coach (bodyweight + gym), single HTML file',
  version: (read('src/store.js').match(/APP_VERSION = '([^']+)'/) || [])[1], rules: { plan: 'RULES-5.0.0', screening: ctx.MCScreen.VERSION, gym: 'double progression (MCGym)', goals: 'MCGoals (estimates are labelled as estimates)' },
  generatedAt: new Date().toISOString(),
  run: { open: 'Double-click dist/military_calisthenics_coach_v5.html (Chrome/Edge). No server, no internet needed.', build: 'node tools/build.mjs', check: 'node tools/check.mjs', unit: 'node tests/unit.mjs', e2e: 'NODE_PATH=$(npm root -g) node tests/e2e.cjs tests/evidence', a11y: 'AXE=/path/axe.min.js NODE_PATH=$(npm root -g) node tests/a11y.cjs tests/evidence/export_full.json' },
  hardConstraints: ['No network calls, CDNs, analytics or external fonts at runtime (CSP connect-src none). Only user-clicked YouTube search links are external.', 'Keep v4 file byte-identical.', 'Red-flag screening must block plan generation; never add a bypass.', 'Edit src/ and rebuild; dist is generated.', 'Keep plans weekly only.', 'Do not claim tests/devices/sources that were not actually run/opened.'],
  files, exerciseFiles: data,
  library: { total: X.list.length, gym: X.list.filter(e => e.mode === 'gym').length, bodyweight: X.list.filter(e => e.mode !== 'gym').length, byCategory: count(X.list, 'cat'), byLevel: count(X.list, 'lvl'), families: new Set(X.list.map(e => e.fam)).size },
  storage: { key: 'MCC_V5_DB (localStorage)', schemaVersion: 5, collections: ['trainees', 'screenings', 'baselines', 'plans', 'sessions', 'reviews', 'audit'], encryption: 'optional; v2 = multi-user accounts (random data key wrapped per user with PBKDF2-SHA256 310k → AES-GCM-256)', exportFormats: ['MCC-EXPORT v1 (JSON + FNV checksum)', 'MCC-EXPORT-ENC (password-protected export)', 'MCC-ENC v2 (full encrypted copy, opened with any listed account)'] },
  features: {
    done: ['One-page bilingual setup (self or trainee)', 'Health screening with red-flag block, pregnancy/postpartum pathways, documented clearance', 'Bodyweight weekly plan: home strength days + outdoor/home walking days, weak-side unilateral work, focus areas, BMI and age rules', 'Gym program separate from bodyweight with weight logging and load progression', 'Numeric goals (push-ups/sit-ups/pull-ups/squats/plank/walk, target weight) with fortnightly tests, progress bar, labelled estimate', 'Ranks, streaks, achievements, cheer messages', 'Live workout: animation, counters, timers, rest timer, one-tap rating, emergency stop', 'Weekly check-in + adaptation (progress/maintain/reduce/substitute/refer)', 'Print/PDF bilingual plan + trainee reading copy with English names and video search links', 'Multi-user accounts + full encrypted copy for another coach', 'JSON backup/import validation, v4 read-only migration, multi-tab overwrite protection', '231 exercises with original per-exercise animations'],
    partial: ['English: main flow is bilingual; detailed pages (More) are Arabic-only', 'Some animations schematic (see knownIssues)', 'Sources only seen in search results'],
    notDone: ['Real-device tests (Windows, iPhone, Android, printer)', 'Qualified clinical/exercise-science review of LOCAL rules', 'Nutrition guidance for weight loss (out of scope)', 'Camera rep counting', '200th bodyweight exercise (3 omitted as misleading)', 'Revoking old encrypted copies after removing a user (impossible without a server)']
  },
  knownIssues: ['GY-BB-OHP lockout clipped at top of frame', 'Schematic: CR-BLTWIST, ST-SLOVER, SC-PRONE-T/W (top views), MO-WRIST, MO-ANKLE, MO-SHCIRCLE, CA-CARIOCA, BA-CLOCK, CR-SCISSOR, GY-LEGPRESS (simplified machine)', 'Checker forces flag "floor" on seated/supine gym machines (harmless now; no rule excludes floor) — relax in tools/check.mjs', 'Accounts: removed users can still open copies saved before removal'],
  tests: { unit: last('tests/results_unit.txt'), e2e: last('tests/results_e2e.txt'), a11y: last('tests/results_a11y.txt'), check: (read('tests/results_check.txt').split('\n')[1] || '') },
  integrity: { v4_sha256: sha('original/military_calisthenics_coach_v4.html'), dist_sha256: sha('dist/military_calisthenics_coach_v5.html') }
};
fs.mkdirSync(path.join(root, 'HANDOFF'), { recursive: true });
fs.writeFileSync(path.join(root, 'HANDOFF/project_manifest.json'), JSON.stringify(manifest, null, 2));
console.log('HANDOFF/project_manifest.json written:', manifest.library.total, 'exercises');
