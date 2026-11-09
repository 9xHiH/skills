// Validate exercise data: required fields, vocabularies, cross-references, animation geometry.
// usage: node tools/check.mjs [fileFilter]   (exit code 1 on errors)
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filt = process.argv[2] || '';
const ctx = vm.createContext({ console }); ctx.globalThis = ctx;
const files = ['src/anim.js', 'src/data/_core.js', ...fs.readdirSync(path.join(root, 'src/data')).filter(f => f.startsWith('ex_')).sort().map(f => 'src/data/' + f)];
const owner = {};
for (const f of files) { const before = ctx.MCEX ? ctx.MCEX.list.length : 0; vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f }); if (ctx.MCEX) ctx.MCEX.list.slice(before).forEach(e => owner[e.id] = f); }
const { MCEX, MCAnim } = ctx;
const plan = fs.readFileSync(path.join(root, 'tools/ids.txt'), 'utf8').split('\n').filter(l => l && !l.startsWith('#')).map(l => l.split('|')[0]);
const allIds = new Set(plan);
const errs = [], warns = [];
const E = (id, m) => errs.push(id + ': ' + m), W = (id, m) => warns.push(id + ': ' + m);
const POS = ['standing', 'supine', 'prone', 'side', 'kneeling', 'quadruped', 'seated', 'hanging', 'mixed'];
const SRC = ['FM722', 'ATP722', 'ACSM-RT', 'ACSM-RT26', 'ACSM-GETP', 'NHS-STR', 'NIA', 'ACOG804', 'PAG2018', 'WHO2020', 'GOOM2019', 'AFT', 'HPRC'];
const seen = new Set(), arNames = new Set();
for (const e of MCEX.list) {
  if (filt && !owner[e.id].includes(filt)) continue;
  const id = e.id || '(no id)';
  if (seen.has(id)) E(id, 'duplicate id'); seen.add(id);
  if (!allIds.has(id)) E(id, 'id not in tools/ids.txt');
  if (arNames.has(e.ar)) E(id, 'duplicate Arabic name ' + e.ar); arNames.add(e.ar);
  for (const k of ['ar', 'en', 'fam', 'setup', 'breath', 'desc', 'space']) if (typeof e[k] !== 'string' || e[k].length < 2) E(id, 'missing string ' + k);
  if (!MCEX.PATTERN[e.pat]) E(id, 'bad pat ' + e.pat);
  if (!MCEX.CAT[e.cat]) E(id, 'bad cat ' + e.cat);
  if (![1, 2, 3].includes(e.lvl)) E(id, 'bad lvl');
  if (!Array.isArray(e.role) || !e.role.length || e.role.some(r => !['main', 'warmup', 'cooldown'].includes(r))) E(id, 'bad role');
  for (const k of ['prim', 'sec']) if (!Array.isArray(e[k]) || e[k].some(m => !MCEX.MUSCLE[m])) E(id, 'bad muscles in ' + k + ' ' + JSON.stringify(e[k]));
  if (!e.prim || !e.prim.length) E(id, 'no primary muscles');
  if (!Array.isArray(e.eq) || e.eq.some(q => !MCEX.EQUIP[q] || q === 'none')) E(id, 'bad eq ' + JSON.stringify(e.eq));
  if (!['none', 'low', 'high'].includes(e.impact)) E(id, 'bad impact');
  if (!POS.includes(e.pos)) E(id, 'bad pos ' + e.pos);
  if (!Array.isArray(e.flags) || e.flags.some(f => !MCEX.FLAG[f])) E(id, 'bad flags ' + JSON.stringify(e.flags));
  if (e.pos === 'supine' && !e.flags.includes('supine')) E(id, 'pos supine requires flag supine');
  if (e.pos === 'prone' && !e.flags.includes('prone') && !['push_h', 'push_v', 'core_ext'].includes(e.pat)) W(id, 'pos prone without prone flag (ok only if weight on hands/forearms)');
  if ((e.impact === 'high') !== e.flags.includes('impact')) E(id, 'impact high <-> flag impact mismatch');
  if (['supine', 'prone', 'side', 'kneeling', 'quadruped', 'seated'].includes(e.pos) && !e.flags.includes('floor') && !(e.pos === 'seated' && e.eq.includes('chair'))) E(id, 'floor position requires flag floor (seated on a chair: add eq chair instead)');
  const d = e.dose || {};
  if (!['reps', 'time'].includes(d.u)) E(id, 'dose.u'); 
  const rng = (r) => Array.isArray(r) && r.length === 2 && r[0] > 0 && r[0] <= r[1];
  if (!rng(d.sets) || !rng(d.rest) && d.rest?.[0] !== 0) E(id, 'dose sets/rest ranges');
  if (d.u === 'reps' && !rng(d.reps)) E(id, 'dose.reps'); if (d.u === 'time' && !rng(d.sec)) E(id, 'dose.sec');
  for (const k of ['steps', 'errors', 'stop']) if (!Array.isArray(e[k]) || e[k].length < (k === 'steps' ? 3 : 2) || e[k].some(s => typeof s !== 'string' || s.length < 4)) E(id, 'need array ' + k);
  for (const k of ['easier', 'harder', 'subs']) { if (!Array.isArray(e[k])) E(id, 'need array ' + k); else e[k].forEach(r => { if (!allIds.has(r)) E(id, k + ' refers to unknown id ' + r); if (r === id) E(id, k + ' self reference'); }); }
  if (e.lvl >= 2 && (typeof e.prereq !== 'string' || e.prereq.length < 8)) E(id, 'lvl>=2 needs prereq');
  if (!Array.isArray(e.src) || !e.src.length || e.src.some(s => !SRC.includes(s))) E(id, 'bad src ' + JSON.stringify(e.src));
  if (e.src && e.src.includes('ATP722') && !e.mil) W(id, 'ATP722 cited but no mil drill name');
  if (!e.anim) E(id, 'no anim'); else { const v = MCAnim.validate(e.anim); v.forEach(m => E(id, 'anim ' + m)); if (!['side', 'front'].includes(e.anim.view)) E(id, 'anim.view'); e.anim.keys.forEach((k, i) => { if (!k.lab) W(id, 'key ' + i + ' no label'); }); }
}
const dang = [];
for (const e of MCEX.list) for (const k of ['easier', 'harder', 'subs']) for (const r of e[k] || []) if (!MCEX.byId(r)) dang.push(e.id + '.' + k + '->' + r);
console.log('exercises loaded:', MCEX.list.length, filt ? '(checked filter ' + filt + ')' : '');
console.log('ERRORS', errs.length); errs.forEach(x => console.log('  E ' + x));
console.log('WARNINGS', warns.length); warns.slice(0, 40).forEach(x => console.log('  W ' + x));
console.log('refs to not-yet-authored ids:', dang.length);
process.exit(errs.length ? 1 : 0);
