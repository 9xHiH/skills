// Unit tests for the DOM-free modules (store, screening, engine, data). Run: node tests/unit.mjs
import fs from 'fs'; import path from 'path'; import vm from 'vm'; import { fileURLToPath } from 'url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LS = {}; const localStorage = { getItem: k => (k in LS ? LS[k] : null), setItem: (k, v) => { LS[k] = String(v); }, removeItem: k => { delete LS[k]; } };
const ctx = vm.createContext({ console, crypto: globalThis.crypto, localStorage, btoa, atob, TextEncoder, TextDecoder }); ctx.globalThis = ctx;
const data = fs.readdirSync(path.join(root, 'src/data')).filter(f => f.startsWith('ex_')).sort().map(f => 'src/data/' + f);
for (const f of ['src/anim.js', 'src/data/_core.js', ...data, 'src/sources.js', 'src/store.js', 'src/screening.js', 'src/engine.js', 'src/gym.js', 'src/goals.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const { MCStore: S, MCScreen: SC, MCEngine: E, MCEX: X } = ctx;
let pass = 0, fail = 0; const results = [];
function t(name, fn) { try { fn(); pass++; results.push('PASS ' + name); } catch (e) { fail++; results.push('FAIL ' + name + ' :: ' + e.message); } }
const ok = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
const eq = (a, b, m) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error((m || 'not equal') + ': ' + JSON.stringify(a) + ' vs ' + JSON.stringify(b)); };

/* ---------- IDs ---------- */
t('IDs: 20000 generated IDs are unique and valid', () => { const s = new Set(); for (let i = 0; i < 20000; i++) { const id = S.makeId('PL5', '2026W46'); ok(S.idValid(id), id); s.add(id); } eq(s.size, 20000); });
t('IDs: check character detects single-character typos', () => { let caught = 0, n = 0; for (let i = 0; i < 500; i++) { const id = S.makeId('TR5'); const pos = 4 + (i % 5); const c = id[pos]; const alt = c === 'A' ? 'B' : 'A'; const bad = id.slice(0, pos) + alt + id.slice(pos + 1); n++; if (!S.idValid(bad)) caught++; } ok(caught === n, 'caught ' + caught + '/' + n); });
t('IDs: normalizeId maps O→0 and I/L→1 and uppercases', () => { eq(S.normalizeId(' pl5-2026w46-abcde-fghjk '), 'PL5-2026W46-ABCDE-FGHJK'); eq(S.normalizeId('PL5-2026W46-OOIL1-ABCDE'), 'PL5-2026W46-00111-ABCDE'); });
t('IDs: ISO week computed', () => { eq(S.isoWeek('2026-11-09'), '2026W46'); eq(S.isoWeek('2021-01-03'), '2020W53'); });

/* ---------- import validation ---------- */
const db0 = S.emptyDB();
t('Import: invalid JSON rejected', () => { const r = S.parseImport('{bad'); ok(!r.ok && r.errors.length); });
t('Import: unknown structure rejected', () => { const r = S.parseImport('{"a":1}'); ok(!r.ok); });
t('Import: checksum mismatch rejected', () => { const env = S.exportEnvelope(db0, 'full', []); env.data.settings.coachName = 'x'; const r = S.parseImport(JSON.stringify(env)); ok(!r.ok && /checksum/.test(r.errors[0])); });
t('Import: __proto__ key rejected', () => { const r = S.parseImport('{"schema":"MCC","__proto__":{"x":1},"schemaVersion":5}'); ok(!r.ok); });
t('Import: bad record ID rejected', () => { const d = S.emptyDB(); d.trainees.push({ id: 'TR5-XXXXX-XXXXX', displayName: 'a', createdAt: 'x' }); const env = S.exportEnvelope(d, 'full', []); const r = S.parseImport(JSON.stringify(env)); ok(!r.ok && r.errors.some(e => /معرف غير صالح/.test(e))); });
t('Import: dangling trainee reference rejected', () => { const d = S.emptyDB(); d.plans.push({ id: S.makeId('PL5', '2026W46'), traineeId: S.makeId('TR5'), weekStart: '2026-11-09', createdAt: 'x', ruleVersion: 'r', status: 'active' }); const r = S.parseImport(JSON.stringify(S.exportEnvelope(d, 'full', []))); ok(!r.ok); });
t('Import: newer schema version rejected', () => { const d = S.emptyDB(); d.schemaVersion = 99; const r = S.parseImport(JSON.stringify(S.exportEnvelope(d, 'full', []))); ok(!r.ok); });
t('Import: valid round trip & merge (keep-local on conflict)', () => {
  const d = S.emptyDB(); const tid = S.uniqueId(d, 'trainees'); d.trainees.push({ id: tid, displayName: 'سالم', createdAt: '2026-01-01' });
  const r = S.parseImport(JSON.stringify(S.exportEnvelope(d, 'full', []))); ok(r.ok, r.errors.join());
  const local = S.emptyDB(); local.trainees.push({ id: tid, displayName: 'سالم (محلي)', createdAt: '2026-01-01' });
  const m = S.mergeInto(local, r.data, 'keep-local'); eq(m.db.trainees[0].displayName, 'سالم (محلي)'); eq(m.report.conflicts.length, 1);
  const m2 = S.mergeInto(local, r.data, 'prefer-imported'); eq(m2.db.trainees[0].displayName, 'سالم'); eq(local.trainees[0].displayName, 'سالم (محلي)', 'merge must not mutate input');
});
t('Import: v4 backup migrates people, keeps v4 plans read-only, requires re-screening', () => {
  const v4 = { people: [{ id: 'MC-X1', name: 'أحمد', sex: 'ذكر', age: '30', goal: 'تحمل', experience: 'متوسط', days: '3', minutes: '40', equipment: 'عقلة ثابتة' }, { id: 'MC-X2', name: '' }], plans: [{ serial: 'MC-P1', pid: 'MC-X1', items: [] }], reviews: [] };
  const r = S.parseImport(JSON.stringify(v4)); ok(r.ok); eq(r.kind, 'v4'); eq(r.data.trainees.length, 1); eq(r.data.trainees[0].goal, 'endurance'); eq(r.data.trainees[0].equipment, ['bar']); eq(r.data.screenings.length, 0); eq(r.data.legacy.v4.plans.length, 1); ok(r.warnings.length >= 2);
});

/* ---------- screening ---------- */
const allNo = { cv_dx: 'no', chest: 'no', dizzy: 'no', breath: 'no', chronic: 'no', msk: 'no', supervised: 'no', acute_ill: 'no', active: 'no' };
const male = { age: 30, sex: 'male' }, female = { age: 30, sex: 'female' };
t('Screen: all NO → cleared', () => eq(SC.evaluate(allNo, { trainee: male }).status, 'cleared'));
t('Screen: incomplete answers → more_info', () => eq(SC.evaluate({ cv_dx: 'no' }, { trainee: male }).status, 'more_info'));
t('Screen: chest pain → refer', () => eq(SC.evaluate({ ...allNo, chest: 'yes' }, { trainee: male }).status, 'refer'));
t('Screen: unsure about symptom → more_info', () => eq(SC.evaluate({ ...allNo, dizzy: 'unsure' }, { trainee: male }).status, 'more_info'));
t('Screen: chronic illness/daily medicine → more_info; documented clearance → cleared', () => { const a = { ...allNo, chronic: 'yes' }; eq(SC.evaluate(a, { trainee: male }).status, 'more_info'); eq(SC.evaluate(a, { trainee: male, clearance: { by: 'د. علي', date: '2026-11-01' } }).status, 'cleared'); });
t('Screen: clearance can NOT resolve red-flag refer', () => eq(SC.evaluate({ ...allNo, chest: 'yes' }, { trainee: male, clearance: { by: 'x', date: '2026-01-01' } }).status, 'refer'));
t('Screen: supervised-only → refer even with clearance', () => eq(SC.evaluate({ ...allNo, supervised: 'yes' }, { trainee: male, clearance: { by: 'x', date: '2026-01-01' } }).status, 'refer'));
t('Screen: age < 18 → refer', () => eq(SC.evaluate(allNo, { trainee: { age: 16, sex: 'male' } }).status, 'refer'));
t('Screen: known CV disease + inactive → more_info; active → cleared with max level 2 & no impact', () => { eq(SC.evaluate({ ...allNo, cv_dx: 'yes' }, { trainee: male }).status, 'more_info'); const o = SC.evaluate({ ...allNo, cv_dx: 'yes', active: 'yes' }, { trainee: male }); eq(o.status, 'cleared'); eq(o.exclusions.maxLevel, 2); ok(o.exclusions.flags.includes('impact')); });
t('Screen: prior refer requires documented clearance', () => { const prior = { outcome: { status: 'refer' } }; eq(SC.evaluate(allNo, { trainee: male, prior }).status, 'more_info'); eq(SC.evaluate(allNo, { trainee: male, prior, clearance: { by: 'x', date: 'y' } }).status, 'cleared'); });
t('Screen: pregnancy questions hidden for male, shown otherwise (not sex-based ability)', () => { ok(!SC.visible(allNo, male).some(q => q.id === 'pp_status')); ok(SC.visible(allNo, female).some(q => q.id === 'pp_status')); ok(SC.visible(allNo, { age: 30, sex: '' }).some(q => q.id === 'pp_status')); });
const preg = (w, extra) => ({ ...allNo, pp_status: 'pregnant', preg_weeks: w, preg_provider: 'yes', preg_risk: 'no', preg_warn: 'no', ...extra });
t('Screen: pregnancy without provider approval → more_info', () => eq(SC.evaluate(preg(10, { preg_provider: 'no' }), { trainee: female }).status, 'more_info'));
t('Screen: pregnancy warning sign → refer (clearance cannot lift it)', () => { eq(SC.evaluate(preg(24, { preg_warn: 'yes' }), { trainee: female }).status, 'refer'); eq(SC.evaluate(preg(24, { preg_warn: 'yes' }), { trainee: female, clearance: { by: 'x', date: 'y' } }).status, 'refer'); });
t('Screen: doctor-reported pregnancy problem → more_info until documented obstetric clearance', () => { eq(SC.evaluate(preg(24, { preg_risk: 'yes' }), { trainee: female }).status, 'more_info'); eq(SC.evaluate(preg(24, { preg_risk: 'yes' }), { trainee: female, clearance: { by: 'طبيبة الحمل', date: '2026-11-01' } }).status, 'cleared'); });
t('Screen: pregnancy 24 wk approved → cleared, excludes supine/prone/impact', () => { const o = SC.evaluate(preg(24), { trainee: female }); eq(o.status, 'cleared'); eq(o.pathway, 'pregnancy'); for (const f of ['supine', 'prone', 'impact', 'inversion', 'iap']) ok(o.exclusions.flags.includes(f), f); });
t('Screen: pregnancy 10 wk → supine NOT excluded', () => ok(!SC.evaluate(preg(10), { trainee: female }).exclusions.flags.includes('supine')));
t('Screen: postpartum 8 wk + pelvic symptoms → cleared with referral & impact/iap excluded', () => { const o = SC.evaluate({ ...allNo, pp_status: 'postpartum', pp_weeks: 8, pp_check: 'yes', pp_pelvic: 'yes', pp_warn: 'no' }, { trainee: female }); eq(o.status, 'cleared'); ok(o.exclusions.flags.includes('impact') && o.exclusions.flags.includes('iap')); ok(o.referrals.length); });
t('Screen: postpartum without postnatal check → more_info', () => eq(SC.evaluate({ ...allNo, pp_status: 'postpartum', pp_weeks: 20, pp_check: 'no', pp_pelvic: 'no', pp_warn: 'no' }, { trainee: female }).status, 'more_info'));

/* ---------- engine ---------- */
let seq = 0; const mkId = (c, x) => S.makeId({ trainees: 'TR5', screenings: 'SC5', baselines: 'BL5', plans: 'PL5' }[c], x);
function setup(tr, answers, tests) {
  const trainee = Object.assign({ id: mkId('trainees'), displayName: 'T' + (++seq), age: 30, sex: 'male', goal: 'general', experience: 'intermediate', days: [0, 2, 4], minutes: 30, equipment: [], limitations: [] }, tr);
  const sc = { id: mkId('screenings'), traineeId: trainee.id, at: '2026-11-01T10:00:00Z', answers, outcome: SC.evaluate(answers, { trainee }) };
  const bl = tests ? { id: mkId('baselines'), traineeId: trainee.id, at: '2026-11-01T11:00:00Z', tests, result: E.evaluateBaseline(tests, trainee) } : null;
  return { trainee, sc, bl };
}
const weak = { push: { variant: 'PU-WALL', value: 8, technique: 'good' }, squat: { variant: 'SQ-CHAIR', value: 8, technique: 'good' }, core: { variant: 'PL-INCL', value: 20, technique: 'good' }, pull: { skipped: true }, aerobic: { variant: 'CA-MARCH', value: 10 }, balance: { variant: 'BA-SLSTAND', value: 15 } };
const strong = { push: { variant: 'PU-STD', value: 20, technique: 'good', effort: 6 }, squat: { variant: 'SQ-BW', value: 25, technique: 'good' }, core: { variant: 'PL-FA', value: 60, technique: 'good' }, pull: { variant: 'PV-PULLUP', value: 6, technique: 'good' }, aerobic: { variant: 'CA-MARCH', value: 20 }, balance: { variant: 'BA-SLSTAND', value: 30 } };
const gen = (s, extra) => E.generatePlan(Object.assign({ trainee: s.trainee, screening: s.sc, baseline: s.bl, weekStart: '2026-11-08', planId: mkId('plans', '2026W45') }, extra || {}));
const mainIds = p => p.days.flatMap(d => (d.main || []).map(i => i.exId));
const allPlanIds = p => p.days.flatMap(d => [].concat(d.main || [], d.warmup || [], d.cooldown || [], d.recovery || []).map(i => i.exId));

t('Engine: no screening → blocked', () => { const s = setup({}, allNo, weak); const p = E.generatePlan({ trainee: s.trainee, screening: null, baseline: null, weekStart: '2026-11-08', planId: 'x' }); eq(p.status, 'blocked'); });
t('Engine: red flag screening → blocked with no exercises', () => { const s = setup({}, { ...allNo, chest: 'yes' }, weak); const p = gen(s); eq(p.status, 'blocked'); eq(p.days.length, 0); });
t('Engine: cleared but no baseline → blocked (no maximal test before screening)', () => { const s = setup({}, allNo, null); eq(gen(s).status, 'blocked'); });
t('Engine: baseline pain ≥7 → blocked', () => { const s = setup({}, allNo, { ...weak, push: { variant: 'PU-WALL', value: 3, pain: 8 } }); eq(gen(s).status, 'blocked'); });
t('Engine: weekly plan has exactly 7 dated days and ≥1 rest day', () => { const s = setup({ days: [0, 1, 2, 3, 4, 5, 6] }, allNo, weak); const p = gen(s); eq(p.days.length, 7); eq(p.days[0].date, '2026-11-08'); eq(p.days[6].date, '2026-11-14'); ok(p.days.some(d => d.type === 'rest')); });
t('Engine: training days spread (no back-to-back when 3 of 7 available)', () => { const s = setup({ days: [0, 1, 2, 3, 4, 5, 6] }, allNo, weak); const p = gen(s); const tr = p.days.filter(d => d.type === 'train').map(d => d.index); eq(tr.length, 3); for (let i = 1; i < tr.length; i++) ok(tr[i] - tr[i - 1] >= 2, JSON.stringify(tr)); });
t('Engine: different abilities → explainably different plans', () => {
  const a = setup({ experience: 'advanced', equipment: ['bar', 'chair', 'low_bar'], days: [0, 1, 2, 3, 4, 5, 6], minutes: 45 }, { ...allNo, active: 'yes' }, strong), b = setup({ days: [1, 3], minutes: 20 }, allNo, weak);
  const pa = gen(a), pb = gen(b);
  const lv = p => mainIds(p).map(id => X.byId(id).lvl);
  ok(Math.max(...lv(pa)) > Math.max(...lv(pb)), 'advanced trainee should get higher-level exercises');
  ok(pa.days.filter(d => d.type === 'train').length > pb.days.filter(d => d.type === 'train').length);
  ok(pa.days.find(d => d.type === 'train').main.length > pb.days.find(d => d.type === 'train').main.length);
  ok(pa.notes.length && pb.notes.length && pa.days.find(d => d.type === 'train').main.every(i => i.why.length));
});
t('Engine: equipment respected (no bar → no bar exercises)', () => { const s = setup({ experience: 'advanced', days: [0, 2, 4, 6], minutes: 60 }, { ...allNo, active: 'yes' }, strong); ok(allPlanIds(gen(s)).every(id => !X.byId(id).eq.some(q => !['mat'].includes(q)))); });
t('Engine: pregnancy 24 wk plan contains no supine/prone/impact/iap exercises', () => { const s = setup({ sex: 'female', days: [0, 2, 4], minutes: 45 }, preg(24), weak); const p = gen(s); eq(p.status, 'active'); const bad = allPlanIds(p).filter(id => X.byId(id).flags.some(f => ['supine', 'prone', 'impact', 'iap', 'inversion'].includes(f))); eq(bad, []); });
t('Engine: knee limitation excludes knee-flagged exercises', () => { const s = setup({ limitations: ['knee'], days: [0, 2, 4], minutes: 45 }, allNo, weak); ok(allPlanIds(gen(s)).every(id => !X.byId(id).flags.includes('knee'))); });
t('Engine: age ≥65 → balance exercise each training day, no impact', () => { const s = setup({ age: 70, days: [0, 2, 4], minutes: 30 }, allNo, weak); const p = gen(s); eq(p.status, 'active'); p.days.filter(d => d.type === 'train').forEach(d => ok(d.main.some(i => X.byId(i.exId).pat === 'balance'), 'balance on ' + d.date)); ok(allPlanIds(p).every(id => X.byId(id).impact !== 'high')); });

function logWeek(p, f) { const sessions = []; p.days.filter(d => d.type === 'train').forEach(d => sessions.push({ status: 'complete', kind: 'train', items: d.main.map(it => Object.assign({ slot: it.slot, exId: it.exId, prescribed: { sets: it.sets, target: it.target }, sets: Array.from({ length: it.sets }, () => ({ value: it.target })), effort: 5, technique: 'good', pain: 0 }, f ? f(it) : {})) })); return sessions; }
const goodReview = { answers: { safety: 'no', pain_nrs: 0, illness: 'no', sleep: 'good', fatigue: 3, soreness72: 'no' } };
t('Adapt: full completion, good technique, effort 5, no pain → progress (≤3 items) and next plan steps up', () => {
  const s = setup({ days: [0, 2, 4], minutes: 30 }, allNo, weak); const p = gen(s); const d = E.adapt(p, logWeek(p), goodReview);
  eq(d.overall, 'progress'); const prog = Object.values(d.items).filter(i => i.action === 'progress'); ok(prog.length >= 1 && prog.length <= 3, 'progress count ' + prog.length);
  const p2 = E.generatePlan({ trainee: s.trainee, screening: s.sc, baseline: s.bl, prevPlan: p, decision: d, weekStart: '2026-11-15', planId: 'y' });
  const prevSteps = {}; p.days.forEach(x => (x.main || []).forEach(i => prevSteps[i.slot] = i)); let ups = 0; p2.days.forEach(x => (x.main || []).forEach(i => { const q = prevSteps[i.slot]; if (q && (i.step > q.step || i.exId !== q.exId)) ups++; }));
  ok(ups >= 1, 'next plan should contain progressions');
});
t('Adapt: "plan felt easy" without performance data does NOT progress', () => { const s = setup({}, allNo, weak); const p = gen(s); const d = E.adapt(p, [], { answers: { ...goodReview.answers, easy: 'yes' } }); ok(d.overall !== 'progress'); ok(Object.values(d.items).every(i => i.action !== 'progress')); });
t('Adapt: pain 8/10 → refer and next plan blocked', () => { const s = setup({}, allNo, weak); const p = gen(s); const d = E.adapt(p, logWeek(p, () => ({ pain: 8 })), goodReview); eq(d.overall, 'refer'); d.at = '2026-11-14T00:00:00Z'; eq(E.generatePlan({ trainee: s.trainee, screening: s.sc, baseline: s.bl, prevPlan: p, decision: d, weekStart: '2026-11-15', planId: 'y' }).status, 'blocked'); });
t('Adapt: refer resolved only by newer screening WITH documented clearance', () => { const s = setup({}, allNo, weak); const p = gen(s); const d = E.adapt(p, [], { answers: { ...goodReview.answers, safety: 'yes' } }); d.at = '2026-11-14T00:00:00Z'; const sc2 = { ...s.sc, at: '2026-11-15T00:00:00Z' }; eq(E.generatePlan({ trainee: s.trainee, screening: sc2, baseline: s.bl, prevPlan: p, decision: d, weekStart: '2026-11-15', planId: 'y' }).status, 'blocked'); const sc3 = { ...sc2, clearance: { by: 'د. س', date: '2026-11-15' } }; eq(E.generatePlan({ trainee: s.trainee, screening: sc3, baseline: s.bl, prevPlan: p, decision: d, weekStart: '2026-11-15', planId: 'y' }).status, 'active'); });
t('Adapt: pain 5/10 on an exercise → substitute; next week not the same exercise in that slot', () => { const s = setup({ days: [0, 2, 4], minutes: 30 }, allNo, weak); const p = gen(s); const target = p.days.find(d => d.type === 'train').main[1]; const d = E.adapt(p, logWeek(p, it => it.exId === target.exId ? { pain: 5 } : {}), goodReview); eq(d.items[target.slot + '|' + target.exId].action, 'substitute'); const p2 = E.generatePlan({ trainee: s.trainee, screening: s.sc, baseline: s.bl, prevPlan: p, decision: d, weekStart: '2026-11-15', planId: 'y' }); const n = p2.days.flatMap(x => x.main || []).filter(i => i.slot === target.slot); ok(n.every(i => i.exId !== target.exId)); });
t('Adapt: low completion → reduce', () => { const s = setup({}, allNo, weak); const p = gen(s); const d = E.adapt(p, logWeek(p, it => ({ sets: [{ value: 1 }] })), goodReview); eq(d.overall, 'reduce'); });
t('Adapt: illness → global reduce', () => { const s = setup({}, allNo, weak); const p = gen(s); eq(E.adapt(p, logWeek(p), { answers: { ...goodReview.answers, illness: 'yes' } }).overall, 'reduce'); });
t('Adapt: <50% sessions completed → no progression', () => { const s = setup({ days: [0, 2, 4] }, allNo, weak); const p = gen(s); const d = E.adapt(p, logWeek(p).slice(0, 1), goodReview); ok(Object.values(d.items).every(i => i.action !== 'progress')); });
t('Review questions: short (≤ 12), bilingual, safety mandatory, pregnancy branch, adaptive per-exercise', () => { const s = setup({ sex: 'female' }, preg(10), weak); const p = gen(s); eq(p.status, 'active'); const q = E.reviewQuestions(p, logWeek(p), s.trainee, s.sc); ok(q.length >= 8 && q.length <= 12, 'n=' + q.length); ok(q.every(x => x.en), 'missing English text'); ok(q.some(x => x.id === 'preg_warn' && x.must)); ok(q.filter(x => x.ex).length >= 2); });
t('Override: out-of-range dose rejected; unsafe exercise rejected; reason required; blocked plan locked', () => {
  const s = setup({ limitations: ['wrist'] }, allNo, weak); const p = gen(s); const ci = { trainee: s.trainee, screening: s.sc, baseline: s.bl };
  const di = p.days.findIndex(d => d.type === 'train');
  ok(!E.applyOverride(p, { dayIndex: di, itemIndex: 0, sets: 99, reason: 'اختبار السبب' }, ci).ok);
  ok(!E.applyOverride(p, { dayIndex: di, itemIndex: 0, sets: p.days[di].main[0].sets, reason: '' }, ci).ok);
  const pi = p.days[di].main.findIndex(i => X.byId(i.exId).pat === 'push_h'); if (pi >= 0) ok(!E.applyOverride(p, { dayIndex: di, itemIndex: pi, exId: 'PU-STD', reason: 'تجربة تمرين' }, ci).ok, 'wrist-flagged push-up must be rejected');
  const ex = X.byId(p.days[di].main[0].exId); const r = E.applyOverride(p, { dayIndex: di, itemIndex: 0, sets: ex.dose.sets[1], reason: 'زيادة بطلب المدرب' }, ci); ok(r.ok, r.error); eq(p.revisions.length, 1); eq(p.overrides.length, 1);
  const b = setup({}, { ...allNo, chest: 'yes' }, weak); ok(!E.applyOverride(gen(b), { dayIndex: 0, itemIndex: 0, reason: 'محاولة تجاوز' }, ci).ok);
});
t('Screen: every question is bilingual and health section is short (≤ 10 general questions)', () => { ok(SC.QUESTIONS.every(q => q.text && q.en), 'missing en'); ok(SC.QUESTIONS.filter(q => q.sec === 'health' && !q.when).length <= 10); });
t('Quick fitness → levels; inactive capped at 2; walk range sets walk minutes', () => { const L = E.quickLevels({ push: '16+', squat: '20+', plank: '45+', pull: '4+', walk: '30+', active: 'yes' }, { age: 30 }); eq([L.push, L.squat, L.core, L.pull], [3, 3, 3, 3]); const L2 = E.quickLevels({ push: '16+', squat: '20+', plank: '45+', walk: '30+', active: 'no' }, { age: 30 }); eq([L2.push, L2.squat, L2.core], [2, 2, 2]); });
function quick(tr, fit, answers) { const t = setup(tr, answers || allNo, null); t.bl = { id: mkId('baselines'), traineeId: t.trainee.id, at: '2026-11-01T11:00:00Z', tests: {}, result: { levels: E.quickLevels(fit, t.trainee), flags: [], status: 'ok' } }; return t; }
const fitMid = { push: '6-15', squat: '10-20', plank: '20-45', walk: '10-30', active: 'yes' };
t('Weak left arm → unilateral arm exercise each strength day, left side first + extra set', () => { const s = quick({ weakArm: 'left', days: [0, 2, 4], minutes: 30 }, fitMid); const p = gen(s); p.days.filter(d => d.type === 'train').forEach(d => { const w = d.main.find(i => i.weak); ok(w, 'no weak item on ' + d.date); eq(w.weak, { limb: 'arm', side: 'left' }); ok(X.byId(w.exId).dose.side, 'not unilateral'); ok(/اليسرى/.test(w.why[0])); eq(d.main.filter(i => i.exId === w.exId).length, 1, 'duplicate exercise'); }); });
t('Weak arm + weak leg → arm on A days, leg on B days', () => { const s = quick({ weakArm: 'right', weakLeg: 'left', days: [0, 2, 4], minutes: 30 }, fitMid); const p = gen(s); const tr = p.days.filter(d => d.type === 'train'); eq(tr[0].main.find(i => i.weak).weak.limb, 'arm'); eq(tr[1].main.find(i => i.weak).weak.limb, 'leg'); });
t('Focus areas add one exercise per area (max 2) and survive time trimming', () => { const s = quick({ focus: ['lowback', 'shoulders', 'grip'], days: [0, 3], minutes: 20 }, fitMid); const p = gen(s); const d = p.days.find(x => x.type === 'train'); eq(d.main.filter(i => i.focus).map(i => i.focus), ['lowback', 'shoulders']); });
t('Place: home+outdoor → walking days outdoors (CA-WALK); home only → marching at home', () => { const a = gen(quick({ place: 'both', days: [0, 1, 2, 3, 4, 5], walkRange: '10-30', equipment: ['space'] }, fitMid)); const w = a.days.filter(d => d.type === 'recovery'); ok(w.length >= 2); ok(w.every(d => d.place === 'outdoor' && d.recovery[0].exId === 'CA-WALK'), JSON.stringify(w.map(d => d.recovery[0] && d.recovery[0].exId))); const b = gen(quick({ place: 'home', days: [0, 1, 2, 3, 4, 5] }, fitMid)); ok(b.days.filter(d => d.type === 'recovery').every(d => d.place === 'home' && d.recovery[0].exId !== 'CA-WALK')); ok(a.days.filter(d => d.type === 'train').every(d => d.place === 'home')); });
t('BMI ≥ 30 → no high-impact exercises anywhere in the week', () => { const s = quick({ heightCm: 170, weightKg: 100, days: [0, 1, 2, 3, 4, 5, 6], minutes: 60, goal: 'weight', place: 'both', equipment: ['space'] }, { push: '16+', squat: '20+', plank: '45+', walk: '30+', active: 'yes' }); const p = gen(s); ok(p.notes.some(n => /كتلة/.test(n))); ok(allPlanIds(p).every(id => X.byId(id).impact !== 'high')); });
t('Walking progression: ≥75% walks done → +5 min next week; otherwise unchanged', () => { const s = quick({ place: 'both', days: [0, 1, 2, 3, 4, 5], walkRange: '10-30', equipment: ['space'] }, fitMid); const p = gen(s); const w0 = p.days.find(d => d.type === 'recovery').recovery[0].target; const recs = p.days.filter(d => d.type === 'recovery').map(() => ({ status: 'complete', kind: 'recovery', items: [] })); const d = E.adapt(p, logWeek(p).concat(recs), goodReview); eq(d.walk, 'up'); const p2 = E.generatePlan({ trainee: s.trainee, screening: s.sc, baseline: s.bl, prevPlan: p, decision: d, weekStart: '2026-11-15', planId: 'y' }); eq(p2.days.find(x => x.type === 'recovery').recovery[0].target, w0 + 300); const d2 = E.adapt(p, logWeek(p), goodReview); eq(d2.walk, 'same'); });
t('Data: every exercise referenced by baseline tests exists', () => E.TESTS.forEach(T => T.variants.forEach(v => ok(X.byId(v), v))));
t('Data: every exercise has original animation passing geometry validation', () => X.list.forEach(e => eq(ctx.MCAnim.validate(e.anim), [], e.id)));
t('Data: exercise IDs unique; Arabic names unique', () => { eq(new Set(X.list.map(e => e.id)).size, X.list.length); eq(new Set(X.list.map(e => e.ar)).size, X.list.length); });

const { MCGoals: G, MCGym: GY } = ctx;
t('Bodyweight plans never contain gym (weighted) exercises', () => { const s = quick({ days: [0, 1, 2, 3, 4, 5], minutes: 60, equipment: ['dumbbell', 'barbell', 'bench', 'cable', 'machine'] }, fitMid); ok(allPlanIds(gen(s)).every(id => X.byId(id).mode !== 'gym')); });
const gymT = (extra) => quick(Object.assign({ program: 'gym', gymLevel: 2, days: [0, 2, 4], minutes: 60, equipment: ['wall', 'mat', 'dumbbell', 'barbell', 'rack', 'bench', 'kettlebell', 'cable', 'machine', 'legpress', 'pulldown'] }, extra || {}), fitMid);
t('Gym program: main exercises are gym-only with load fields; warm-up/cool-down keep mobility', () => { const p = gen(gymT()); eq(p.program, 'gym'); const tr = p.days.filter(d => d.type === 'train'); ok(tr.length >= 2); tr.forEach(d => { ok(d.main.length >= 3, 'few items'); d.main.forEach(i => { ok(X.byId(i.exId).mode === 'gym', i.exId); ok((i.repRange || i.u === 'time') && i.rir && i.inc > 0); }); ok(d.cooldown.length >= 3); }); });
t('Gym double progression: all sets at top → +inc; below range → −inc; otherwise same load +1 rep', () => { const ex = { load: { inc: 2.5, start: 'x' } }; eq(GY.progress(ex, { load: 20, reps: [12, 12, 12], setsPlanned: 3, rate: 'ok', pain: 0 }, 8, 12).load, 22.5); eq(GY.progress(ex, { load: 20, reps: [7, 8, 8], setsPlanned: 3, rate: 'ok', pain: 0 }, 8, 12).load, 17.5); const m = GY.progress(ex, { load: 20, reps: [9, 10, 9], setsPlanned: 3, rate: 'ok', pain: 0 }, 8, 12); eq([m.load, m.target], [20, 10]); eq(GY.progress(ex, null, 8, 12).load, null); });
t('Gym: next week load comes from logged sessions', () => { const s = gymT(); const p = gen(s); const it = p.days.find(d => d.type === 'train').main[0]; const ses = [{ status: 'complete', startedAt: '2026-11-09T10:00:00Z', items: [{ exId: it.exId, sets: Array.from({ length: it.sets }, () => ({ value: it.repRange[1], load: 40 })), prescribed: { sets: it.sets, repRange: it.repRange }, rate: 'ok' }] }]; const p2 = E.generatePlan({ trainee: s.trainee, screening: s.sc, baseline: s.bl, prevPlan: p, sessions: ses, weekStart: '2026-11-15', planId: 'y' }); const it2 = p2.days.flatMap(d => d.main || []).find(x => x.exId === it.exId); eq(it2.load, 40 + it.inc); });
t('Goal 60 push-ups (2 min): test in week 0 on first strength day, goal training on the others, no test in week 1', () => { const s = quick({ goalTarget: { kind: 'pushup', target: 60, timed: true }, days: [0, 2, 4] }, fitMid); const p = E.generatePlan({ trainee: s.trainee, screening: s.sc, baseline: s.bl, weekStart: '2026-11-08', planId: 'x', weekNo: 0 }); const tr = p.days.filter(d => d.type === 'train'); ok(tr[0].main[0].test, 'no test first'); ok(tr.slice(1).every(d => d.main.some(i => i.slot === 'GOAL'))); const p1 = E.generatePlan({ trainee: s.trainee, screening: s.sc, baseline: s.bl, weekStart: '2026-11-15', planId: 'y', weekNo: 1 }); ok(!p1.days.some(d => (d.main || []).some(i => i.test))); });
t('Goal projection is a labelled range; reached goal detected', () => { const tr = { goalTarget: { kind: 'pushup', target: 60 }, goalLog: [{ kind: 'pushup', value: 20 }] }; const pj = G.project(tr); ok(pj.lo > 0 && pj.hi >= pj.lo); eq(G.percent(tr), 33); tr.goalLog.push({ kind: 'pushup', value: 61 }); ok(G.project(tr).done); const w = { goalTarget: { kind: 'weight', target: 80, start: 90 }, weightKg: 90, goalLog: [{ kind: 'weight', value: 86 }] }; eq(G.percent(w), 40); const pw = G.project(w); eq([pw.lo, pw.hi], [6, 12]); });
t('Goal sit-ups is blocked (with alternative) when screening excludes it (pregnancy 24 wk)', () => { const s = quick({ sex: 'female', goalTarget: { kind: 'situp', target: 60, timed: true } }, fitMid, preg(24)); const p = gen(s); ok(p.goal && p.goal.blocked, 'not blocked'); ok(!allPlanIds(p).includes('CR-SITUP')); });
t('Ranks progress with completed sessions', () => { eq(G.rank(0).ar, 'مستجد'); eq(G.rank(10).ar, 'جندي أول'); eq(G.rank(9).next.left, 1); });
const asyncTests = [];
const ta = (name, fn) => asyncTests.push([name, fn]);
ta('Accounts: owner creates, wrong password rejected, second coach added and signs in, removed user cannot sign in to new copy', async () => {
  for (const k of Object.keys(LS)) delete LS[k];
  S.load(); const db = S.emptyDB(); db.trainees.push({ id: S.makeId('TR5'), displayName: 'سرّي', createdAt: 'x' });
  await S.createAccounts(db, 'Owner', 'pass-owner-1'); await S.flush();
  const raw = LS[S.KEY]; ok(raw && !raw.includes('سرّي'), 'plaintext stored'); const env = JSON.parse(raw); eq(env.v, 2); eq(env.users.length, 1);
  await S.addUser(db, 'coach2', 'pass-coach-2', 'coach'); await S.flush(); eq(JSON.parse(LS[S.KEY]).users.length, 2);
  S.load(); let err = null; try { await S.login('owner', 'wrong-pass'); } catch (e) { err = e; } ok(err, 'wrong password accepted');
  const d2 = await S.login('COACH2', 'pass-coach-2'); eq(d2.trainees[0].displayName, 'سرّي'); eq(S.status.currentUser.role, 'coach');
  err = null; try { await S.addUser(d2, 'x3', 'pass-xxxx-3', 'coach'); } catch (e) { err = e; } ok(err, 'coach must not add users');
  S.load(); const d3 = await S.login('owner', 'pass-owner-1'); await S.removeUser(d3, 'coach2'); await S.flush();
  S.load(); err = null; try { await S.login('coach2', 'pass-coach-2'); } catch (e) { err = e; } ok(err, 'removed user signed in');
});
for (const [name, fn] of asyncTests) { try { await fn(); pass++; results.push('PASS ' + name); } catch (e) { fail++; results.push('FAIL ' + name + ' :: ' + e.message); } }
results.forEach(r => console.log(r));
console.log(`\nUNIT: ${pass} passed, ${fail} failed (${X.list.length} exercises loaded) — node ${process.version}`);
process.exit(fail ? 1 : 0);
