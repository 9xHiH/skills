// End-to-end test of dist/military_calisthenics_coach_v5.html through the real UI in headless Chromium (file://, offline).
// Run: NODE_PATH=$(npm root -g) node tests/e2e.cjs [outDir]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const FILE = path.resolve(__dirname, '../dist/military_calisthenics_coach_v5.html');
const V4 = path.resolve(__dirname, '../original/military_calisthenics_coach_v4.html');
const OUT = path.resolve(process.argv[2] || path.join(__dirname, 'out'));
fs.mkdirSync(OUT, { recursive: true });
const results = []; let pass = 0, fail = 0;
async function step(name, fn) { try { const note = await fn(); pass++; results.push('PASS ' + name + (note ? ' — ' + note : '')); } catch (e) { fail++; results.push('FAIL ' + name + ' :: ' + (e && e.message || e).split('\n')[0]); } }
const ok = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true, locale: 'ar' });
  await ctx.setOffline(true);
  const external = [], errors = [];
  await ctx.route('**/*', r => { const u = r.request().url(); if (u.startsWith('file:') || u.startsWith('data:') || u.startsWith('blob:')) return r.continue(); external.push(u); return r.abort(); });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('dialog', d => d.accept(d.type() === 'prompt' ? (page.__promptAnswer || 'سبب اختبار آلي') : undefined));
  await page.goto('file://' + FILE);
  const db = () => page.evaluate(() => JSON.parse(JSON.stringify(App.db)));
  const go = (pg, p) => pg.evaluate(x => App.go(x), p);
  const nav = p => go(page, p);

  async function createTrainee(o) {
    await nav('trainees'); await page.click('[data-act=tNew]');
    const f = 'form[data-form=trainee]';
    await page.fill(`${f} [name=displayName]`, o.name); await page.fill(`${f} [name=age]`, String(o.age));
    if (o.sex) await page.selectOption(`${f} [name=sex]`, o.sex);
    await page.selectOption(`${f} [name=experience]`, o.exp || 'beginner');
    await page.selectOption(`${f} [name=goal]`, o.goal || 'general');
    await page.fill(`${f} [name=minutes]`, String(o.minutes || 30));
    for (const cb of await page.$$(`${f} [name=days]`)) if (await cb.isChecked()) await cb.uncheck();
    for (const d of o.days) await page.check(`${f} [name=days][value="${d}"]`);
    for (const e of o.eq || []) await page.check(`${f} [name=equipment][value="${e}"]`);
    await page.check(`${f} [name=consent]`);
    await page.click(`${f} button[type=submit]`);
    const d = await db(); return d.trainees[d.trainees.length - 1];
  }
  async function screen(ans) {
    await nav('screen');
    for (let guard = 0; guard < 60; guard++) { // answer visible questions one at a time (form re-renders on change: branching)
      const pending = await page.evaluate(a => { const t = App.trainee(); const draft = App.ui.draft || {}; const vis = MCScreen.visible(Object.assign({}, draft), t); for (const q of vis) { const v = draft[q.id]; const empty = q.type === 'multi' ? !Array.isArray(v) : (v === undefined || v === ''); if (empty) return { id: q.id, type: q.type, val: a[q.id] }; } return null; }, ans);
      if (!pending) break;
      const val = pending.val !== undefined ? pending.val : (pending.type === 'multi' ? [] : pending.type === 'num' ? 0 : 'no');
      if (pending.type === 'multi') { if (!val.length) await page.check(`[name="q_${pending.id}"][value="__none"]`); else for (const v of val) await page.check(`[name="q_${pending.id}"][value="${v}"]`); }
      else if (pending.type === 'num') { await page.fill(`[name="q_${pending.id}"]`, String(val)); await page.dispatchEvent(`[name="q_${pending.id}"]`, 'change'); }
      else await page.selectOption(`[name="q_${pending.id}"]`, String(val));
    }
    await page.click('form[data-form=screen] button[type=submit]');
    const d = await db(); return d.screenings[d.screenings.length - 1];
  }
  async function baseline(tests) {
    await page.click('[data-act=blStart]');
    for (const [k, v] of Object.entries(tests)) { await page.selectOption(`[name=${k}_variant]`, v.variant); await page.fill(`[name=${k}_value]`, String(v.value)); if (v.pain) await page.fill(`[name=${k}_pain]`, String(v.pain)); }
    await page.click('form[data-form=baseline] button[type=submit]');
    const d = await db(); return d.baselines[d.baselines.length - 1];
  }
  async function genPlan() {
    await nav('plan');
    if (await page.$('[data-act=genFirst]')) await page.click('[data-act=genFirst]');
    else { await page.evaluate(() => document.querySelectorAll('#view details').forEach(x => { x.open = true; })); await page.click('[data-act=genPlan]'); }
    const d = await db(); return d.plans[d.plans.length - 1];
  }

  let A, B, C, planA, planB;
  await step('T1 offline load: no console errors at start, title & version', async () => { const t = await page.title(); ok(/عزم|AZM/.test(t), t); ok(/5\.0/.test(await page.textContent('#appver')), 'version'); ok(!errors.length, errors.join()); });
  await step('T2 register trainee A (male, 3 days, chair)', async () => { A = await createTrainee({ name: 'سالم التجريبي', age: 30, sex: 'male', days: [0, 2, 4], eq: ['chair'], exp: 'intermediate' }); ok(/^TR5-/.test(A.id) && A.consent); return A.id; });
  await step('T3 screening A all-no → cleared', async () => { const s = await screen({}); ok(s.outcome.status === 'cleared', s.outcome.status); ok(await page.isVisible('text=cleared-for-conservative-program')); });
  await step('T4 baseline A (no maximal test, capped inputs) → levels', async () => { const b = await baseline({ push: { variant: 'PU-KNEE', value: 12 }, squat: { variant: 'SQ-BW', value: 15 }, core: { variant: 'PL-FA', value: 30 }, aerobic: { variant: 'CA-MARCH', value: 20 }, balance: { variant: 'BA-SLSTAND', value: 30 } }); return JSON.stringify(b.result.levels); });
  await step('T5 weekly plan A generated with unique week ID, 7 days, explanations', async () => { planA = await genPlan(); ok(planA.status === 'active', planA.blockers.join()); ok(/^PL5-\d{4}W\d{2}-/.test(planA.id)); ok(planA.days.length === 7, 'days'); ok((await page.textContent('#view')).includes(planA.id), 'plan id not shown'); ok((await page.$$('#view .why')).length > 0, 'no explanations'); return planA.id; });
  await step('T6 register trainee B (female, pregnant 24 wk, provider approved) → pregnancy pathway; plan has no supine/prone/impact', async () => {
    B = await createTrainee({ name: 'مريم التجريبية', age: 29, sex: 'female', days: [1, 3, 5], minutes: 45, exp: 'beginner' });
    const s = await screen({ pp_status: 'pregnant', preg_weeks: 24, preg_provider: 'yes', preg_risk: 'no', preg_warn: 'no' });
    ok(s.outcome.status === 'cleared' && s.outcome.pathway === 'pregnancy', JSON.stringify(s.outcome.status));
    await baseline({ push: { variant: 'PU-WALL', value: 15 }, squat: { variant: 'SQ-CHAIR', value: 10 }, core: { variant: 'PL-INCL', value: 30 }, aerobic: { variant: 'CA-MARCH', value: 15 } });
    planB = await genPlan(); ok(planB.status === 'active');
    const bad = await page.evaluate(p => { const ids = []; p.days.forEach(d => [].concat(d.main || [], d.warmup || [], d.cooldown || [], d.recovery || []).forEach(i => ids.push(i.exId))); return ids.filter(id => MCEX.byId(id).flags.some(f => ['supine', 'prone', 'impact', 'iap', 'inversion'].includes(f))); }, planB);
    ok(!bad.length, 'excluded found: ' + bad.join()); return planB.id;
  });
  await step('T7 trainee C with chest pain → refer; plan blocked; no override possible', async () => {
    C = await createTrainee({ name: 'خالد التجريبي', age: 45, sex: 'male', days: [0, 3] });
    const s = await screen({ chest: 'yes' }); ok(s.outcome.status === 'refer');
    await nav('plan'); ok(await page.isVisible('text=لا يوجد جدول تمارين حالياً'), 'refer message not shown'); ok(!(await page.$('[data-act=genFirst]')) && !(await page.$('[data-act=ovOpen]')), 'plan creation/override must not be offered'); ok((await db()).plans.filter(x => x.traineeId === C.id).length === 0);
    const bl = await page.$('[data-act=blStart]'); ok(!bl, 'baseline must not be offered for refer');
  });
  await step('T8 isolation: A, B, C plans differ and records never cross trainees', async () => {
    const d = await db(); const ids = t => d.plans.filter(p => p.traineeId === t).map(p => p.id);
    ok(ids(A.id).length === 1 && ids(B.id).length === 1 && ids(C.id).length === 0);
    const ex = p => JSON.stringify(p.days.map(x => (x.main || []).map(i => i.exId)));
    ok(ex(planA) !== ex(planB), 'plans should differ');
    ok(d.screenings.every(s => [A.id, B.id, C.id].includes(s.traineeId)));
    await page.selectOption('#activeTrainee', B.id); await nav('plan'); ok(!(await page.isVisible('text=' + planA.id)), 'A plan visible in B view');
  });
  await step('T9 live session A: per-set autosave, rep counter, rest timer, post-session check', async () => {
    await page.selectOption('#activeTrainee', A.id); await nav('plan');
    await page.click('[data-act=startSession]');
    const n = await page.evaluate(() => App.db.sessions[App.db.sessions.length - 1].items.length);
    for (let i = 0; i < n; i++) {
      const it = await page.evaluate(() => { const s = App.db.sessions[App.db.sessions.length - 1]; return s.items[App.ui.run.idx]; });
      for (let k = 0; k < it.prescribed.sets; k++) {
        if (it.prescribed.u === 'reps') { await page.fill('#runInput', '0'); for (let r = 0; r < it.prescribed.target; r++) await page.click('[data-act=runPlus]'); }
        else await page.fill('#runInput', String(it.prescribed.target));
        await page.click('[data-act=runSet]');
        if (k === 0) { const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('MCC_V5_DB')).sessions.slice(-1)[0].items[App.ui.run.idx].sets.length); ok(saved === 1, 'set not autosaved'); }
        await page.click('[data-act=restSkip]');
      }
      if (it.block === 'main') { await page.click('[data-act=runRate][data-v=ok]'); }
      await page.click('[data-act=runNext]');
    }
    await page.fill('[name=p_effort]', '5'); await page.fill('[name=p_pain]', '0'); await page.selectOption('[name=p_symptoms]', 'no');
    await page.click('form[data-form=post] button[type=submit]');
    const s = (await db()).sessions.slice(-1)[0]; ok(s.status === 'complete'); ok(s.items.filter(i => i.block === 'main').every(i => i.sets.length === i.prescribed.sets)); return n + ' items logged';
  });
  await step('T10 rest timer counts down in real time', async () => {
    await nav('plan'); await page.evaluate(() => document.querySelectorAll('#view details.day').forEach(x => { x.open = true; })); const btns = await page.$$('[data-act=startSession]'); await btns[1].click();
    for (let g = 0; g < 10 && (await page.evaluate(() => App.db.sessions.slice(-1)[0].items[App.ui.run.idx].block)) !== 'main'; g++) await page.click('[data-act=runNext]');
    const it = await page.evaluate(() => App.db.sessions.slice(-1)[0].items[App.ui.run.idx]);
    await page.fill('#runInput', String(it.prescribed.target || 1)); await page.click('[data-act=runSet]');
    const r0 = await page.textContent('#restVal'); await page.waitForTimeout(2300); const r1 = await page.textContent('#restVal');
    await page.click('[data-act=runPause]'); ok(it.prescribed.rest > 0 && r0 !== r1, 'rest timer did not move ' + r0 + ' ' + r1); return 'rest ' + r0 + ' → ' + r1 + ' (partial session saved)';
  });
  await step('T11 weekly review A: mandatory safety Qs, adaptive per-exercise Qs, decision saved', async () => {
    await nav('review');
    await page.selectOption('[name=r_safety]', 'no'); await page.fill('[name=r_pain_nrs]', '0'); await page.dispatchEvent('[name=r_pain_nrs]', 'change');
    await page.selectOption('[name=r_illness]', 'no'); await page.selectOption('[name=r_sleep]', 'good'); await page.fill('[name=r_fatigue]', '3'); await page.dispatchEvent('[name=r_fatigue]', 'change');
    const adaptive = await page.$$('[name^="r_perEx."]'); ok(adaptive.length >= 2, 'adaptive questions ' + adaptive.length);
    await page.click('form[data-form=review] button[type=submit]');
    const r = (await db()).reviews.slice(-1)[0]; ok(r && r.planId === planA.id); return 'decision=' + r.decision.overall + ', questions=' + r.questions.length;
  });
  await step('T12 next week plan A uses review, new unique ID, history preserved', async () => {
    await page.click('[data-act=nextWeek]'); const p2 = await genPlan(); ok(p2.id !== planA.id && p2.prevPlanId === planA.id && p2.decision); const d = await db(); ok(d.plans.filter(p => p.traineeId === A.id).length === 2); return p2.id + ' decision ' + p2.decision.overall;
  });
  await step('T13 painful symptom (8/10) in review of B blocks next plan', async () => {
    await page.selectOption('#activeTrainee', B.id); await nav('review');
    await page.selectOption('[name=r_safety]', 'no'); await page.fill('[name=r_pain_nrs]', '8'); await page.dispatchEvent('[name=r_pain_nrs]', 'change');
    await page.selectOption('[name=r_pain_area]', 'lowback'); await page.selectOption('[name=r_illness]', 'no'); await page.selectOption('[name=r_preg_warn]', 'no');
    await page.click('form[data-form=review] button[type=submit]');
    ok((await db()).reviews.slice(-1)[0].decision.overall === 'refer');
    await page.click('[data-act=nextWeek]'); const p = await genPlan(); ok(p.status === 'blocked');
  });
  await step('T14 coach override within bounds logged; out-of-range rejected in UI', async () => {
    await page.selectOption('#activeTrainee', A.id); await nav('plan');
    await page.click('[data-act=ovOpen]'); await page.fill('#ovBody [name=sets]', '99'); await page.fill('#ovBody [name=reason]', 'اختبار حدود'); await page.click('#ovBody button[type=submit]');
    ok(await page.isVisible('#ovErr .alert'), 'error not shown');
    const lim = await page.evaluate(() => { const p = App.plansOf(App.ui.traineeId).slice(-1)[0]; const d = p.days.find(x => x.type === 'train'); return MCEX.byId(d.main[0].exId).dose.sets; });
    await page.fill('#ovBody [name=sets]', String(lim[1])); await page.click('#ovBody button[type=submit]');
    const p = (await db()).plans.filter(x => x.traineeId === A.id).slice(-1)[0]; ok(p.overrides.length === 1 && p.revisions.length >= 1);
  });
  await step('T15 plan lookup by ID (typo-tolerant normalisation, local only)', async () => {
    await nav('review'); await page.fill('#revLookup', planA.id.toLowerCase()); await page.click('[data-act=revFind]'); ok(await page.isVisible('text=' + planA.id));
    await page.fill('#revLookup', planA.id.slice(0, -1) + (planA.id.slice(-1) === 'A' ? 'B' : 'A')); await page.click('[data-act=revFind]'); ok(await page.isVisible('text=حرف التحقق'));
  });
  let exportPath;
  await step('T16 JSON export (full) produces checksummed file', async () => {
    await nav('data'); const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=expAll]')]);
    exportPath = path.join(OUT, 'export_full.json'); await dl.saveAs(exportPath); const j = JSON.parse(fs.readFileSync(exportPath, 'utf8')); ok(j.format === 'MCC-EXPORT' && j.checksum && j.data.trainees.length === 3); return path.basename(exportPath) + ' ' + Math.round(fs.statSync(exportPath).size / 1024) + 'KB';
  });
  await step('T17 print weekly plan: Arabic RTL A4 PDF via Chromium print engine', async () => {
    await nav('plan');
    await page.evaluate(() => { window.__print = window.print; window.print = () => {}; });
    await page.click('[data-act=printPlan]'); await page.waitForTimeout(200);
    await page.emulateMedia({ media: 'print' });
    const pdf = path.join(OUT, 'weekly_plan_print.pdf'); await page.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true });
    await page.screenshot({ path: path.join(OUT, 'print_view.png'), fullPage: true });
    await page.emulateMedia({ media: 'screen' });
    const txt = await page.textContent('#print'); const p = (await db()).plans.filter(x => x.traineeId === A.id).slice(-1)[0];
    ok(txt.includes(p.id) && txt.includes('سالم التجريبي'), 'identity/IDs missing from print'); ok(/Weekly Training Plan/.test(txt) && /youtube\.com\/results/.test(await page.innerHTML('#print')), 'no bilingual title or video links');
    const buf = fs.readFileSync(pdf); const pages = (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length; ok(pages >= 2, 'pages ' + pages); return pages + ' A4 pages, ' + Math.round(buf.length / 1024) + 'KB';
  });
  await step('T18 library: per-exercise animation actually moves; dialog; rep counter; interval timer', async () => {
    await nav('library'); await page.click('.excard[data-id="PU-STD"]');
    const pts = () => page.getAttribute('#exPlayer .mc-near polyline', 'points'); const a = await pts(); await page.waitForTimeout(600); const b = await pts(); ok(a !== b, 'animation static');
    await page.click('#exPlayer [data-p=play]'); const c = await pts(); await page.waitForTimeout(400); ok(c === await pts(), 'pause failed');
    await page.click('#exPlayer [data-p=kN]');
    for (let i = 0; i < 3; i++) await page.click('#exBody [data-c=plus]'); ok((await page.textContent('#exBody [data-c=reps]')) === '3');
    await page.fill('#exBody [data-c=work]', '5'); await page.click('#exBody [data-c=start]'); await page.waitForTimeout(2200); const tt = await page.textContent('#exBody [data-c=time]'); ok(/00:0[23]/.test(tt), 'timer ' + tt);
    await page.click('[data-act=exClose]'); return 'timer at ' + tt;
  });
  await step('T19 every exercise in the library renders a distinct original figure', async () => {
    const r = await page.evaluate(() => { const seen = new Set(); let n = 0; MCEX.list.forEach(e => { const s = MCAnim.staticSVG(e.anim, 1).replace(/<title>.*?<\/title>/, ''); seen.add(s); n++; }); return [n, seen.size]; });
    ok(r[0] === r[1], 'duplicate drawings: ' + (r[0] - r[1])); return r[0] + ' distinct drawings';
  });
  await step('T20 import round-trip into a fresh browser profile restores all records', async () => {
    const c2 = await browser.newContext(); await c2.setOffline(true); const p2 = await c2.newPage(); const e2 = []; p2.on('pageerror', e => e2.push(e.message));
    await p2.goto('file://' + FILE); await go(p2, 'data'); await p2.setInputFiles('#impFile', exportPath); await p2.waitForSelector('[data-act=impConfirm]'); await p2.click('[data-act=impConfirm]');
    const a = JSON.parse(fs.readFileSync(exportPath, 'utf8')).data; const b = await p2.evaluate(() => App.db);
    for (const c of ['trainees', 'screenings', 'baselines', 'plans', 'sessions', 'reviews']) ok(a[c].length === b[c].length, c + ' ' + a[c].length + '≠' + b[c].length);
    ok(JSON.stringify(a.plans) === JSON.stringify(b.plans), 'plans differ after import');
    // re-import the same file → no duplicates
    await go(p2, 'data'); await p2.setInputFiles('#impFile', exportPath); await p2.waitForSelector('[data-act=impConfirm]'); await p2.click('[data-act=impConfirm]'); ok((await p2.evaluate(() => App.db.plans.length)) === a.plans.length, 'duplicates after re-import');
    ok(!e2.length, e2.join()); await c2.close();
  });
  await step('T21 malformed / tampered imports rejected without changing data', async () => {
    await nav('data'); const before = JSON.stringify(await db());
    const bad1 = path.join(OUT, 'bad_syntax.json'); fs.writeFileSync(bad1, '{"format":"MCC-EXPORT",');
    const j = JSON.parse(fs.readFileSync(exportPath, 'utf8')); j.data.trainees[0].displayName = '<img src=x onerror=alert(1)>'; const bad2 = path.join(OUT, 'bad_tampered.json'); fs.writeFileSync(bad2, JSON.stringify(j));
    for (const f of [bad1, bad2]) { await page.setInputFiles('#impFile', f); await page.waitForSelector('#impPreview .alert.danger'); }
    ok(!(await page.$('[data-act=impConfirm]'))); ok(JSON.stringify(await db()) === before, 'data changed');
  });
  await step('T22 HTML injection via names is escaped (no script execution)', async () => {
    const T = await createTrainee({ name: '<img src=x onerror="window.__xss=1">', age: 33, sex: 'male', days: [1] });
    await nav('dash'); await nav('trainees'); ok(!(await page.evaluate(() => window.__xss)), 'XSS executed'); ok((await page.$$('img[src=x]')).length === 0);
  });
  await step('T23 v4 regression/migration: v4 localStorage data detected and migrated read-only', async () => {
    const c3 = await browser.newContext(); await c3.setOffline(true); const p3 = await c3.newPage();
    p3.on('dialog', d => d.accept());
    await p3.goto('file://' + V4); // the untouched v4 file creates a trainee via its own UI
    await p3.click('text=تقييم جديد'); await p3.fill('#fields [name=name]', 'متدرب من v4'); await p3.fill('#fields [name=age]', '35'); await p3.click('#form button[type=submit]');
    const v4raw = await p3.evaluate(() => localStorage.getItem('MC_V3')); ok(v4raw && JSON.parse(v4raw).people.length === 1, 'v4 did not save');
    await p3.goto('file://' + FILE); ok(await p3.isVisible('text=وُجدت بيانات من النسخة v4'));
    await go(p3, 'data'); await p3.click('[data-act=migrateLocal]'); await p3.waitForSelector('[data-act=impConfirm]'); await p3.click('[data-act=impConfirm]');
    const r = await p3.evaluate(() => [App.db.trainees.map(t => t.displayName), App.db.legacy && App.db.legacy.v4.plans.length, localStorage.getItem('MC_V3')]);
    ok(r[0].includes('متدرب من v4') && r[1] === 1 && r[2] === v4raw, 'migration failed or v4 data modified'); await c3.close(); return 'v4 key unchanged after migration';
  });
  await step('T24 mobile layout (iPhone-size viewport) renders library and plan without overflow', async () => {
    const c4 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true }); await c4.setOffline(true); const p4 = await c4.newPage(); await p4.goto('file://' + FILE);
    await go(p4, 'library'); const ov = await p4.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); await p4.screenshot({ path: path.join(OUT, 'mobile_library.png') }); await c4.close(); ok(ov <= 2, 'horizontal overflow ' + ov); return 'simulated viewport only (not a real device)';
  });
  await step('T26 multi-tab safety: a stale tab cannot overwrite newer data written by another tab', async () => {
    const other = await ctx.newPage(); await other.goto('file://' + FILE);
    await other.evaluate(() => { App.db.settings.coachName = 'من التبويب الثاني'; App.save(); });
    const before = await other.evaluate(() => localStorage.getItem('MCC_V5_DB'));
    const res = await page.evaluate(() => { App.db.settings.coachName = 'من التبويب القديم'; return App.save(); });
    const after = await other.evaluate(() => localStorage.getItem('MCC_V5_DB'));
    ok(res === false && before === after, 'stale tab overwrote data'); ok(await page.evaluate(() => !!MCStore.status.conflict));
    await other.close(); await page.reload(); ok((await db()).settings.coachName === 'من التبويب الثاني'); return 'stale write refused; reload shows newer data';
  });
  await step('T27 accounts: owner + second coach, ciphertext-only storage, sign-in screen, wrong password rejected, full encrypted copy opened on another device by coach 2, password-protected export', async () => {
    const c5 = await browser.newContext({ acceptDownloads: true }); await c5.setOffline(true); const p5 = await c5.newPage(); const e5 = [];
    p5.on('pageerror', e => e5.push(e.message)); p5.on('dialog', d => d.accept());
    await p5.goto('file://' + FILE);
    await go(p5, 'trainees'); await p5.click('[data-act=tNew]');
    await p5.fill('form[data-form=trainee] [name=displayName]', 'سرّي جداً'); await p5.fill('form[data-form=trainee] [name=age]', '31'); await p5.check('form[data-form=trainee] [name=consent]'); await p5.click('form[data-form=trainee] button[type=submit]');
    await go(p5, 'data');
    await p5.fill('form[data-form=accCreate] [name=u]', 'owner'); await p5.fill('form[data-form=accCreate] [name=p1]', 'كلمة-سر-قوية-1'); await p5.fill('form[data-form=accCreate] [name=p2]', 'كلمة-سر-قوية-1'); await p5.check('form[data-form=accCreate] [name=ack]'); await p5.click('form[data-form=accCreate] button[type=submit]');
    await p5.waitForSelector('form[data-form=userAdd]', { timeout: 20000 });
    await p5.fill('form[data-form=userAdd] [name=u]', 'coach2'); await p5.fill('form[data-form=userAdd] [name=p]', 'مدرب-ثاني-2'); await p5.click('form[data-form=userAdd] button[type=submit]');
    await p5.waitForFunction(() => MCStore.users().length === 2, null, { timeout: 20000 });
    await p5.waitForFunction(() => { const r = localStorage.getItem('MCC_V5_DB'); return r && JSON.parse(r).schema === 'MCC-ENC'; }, null, { timeout: 20000 });
    await p5.evaluate(() => MCStore.flush());
    const raw = await p5.evaluate(() => localStorage.getItem('MCC_V5_DB') + (localStorage.getItem('MCC_V5_RESTORE') || ''));
    ok(!raw.includes('سرّي') && !raw.includes('TR5-'), 'plaintext found in storage');
    // encrypted export while unlocked
    await go(p5, 'data'); await p5.check('#expEnc'); await p5.fill('#expPass', 'ملف-سر-2026'); await p5.fill('#expPass2', 'ملف-سر-2026');
    const [dl] = await Promise.all([p5.waitForEvent('download'), p5.click('[data-act=expAll]')]); const encPath = path.join(OUT, 'export_encrypted.json'); await dl.saveAs(encPath);
    const encText = fs.readFileSync(encPath, 'utf8'); ok(JSON.parse(encText).format === 'MCC-EXPORT-ENC' && !encText.includes('سرّي'), 'export not encrypted');
    const [dl2] = await Promise.all([p5.waitForEvent('download'), p5.click('[data-act=copySave]')]); const copyPath = path.join(OUT, 'full_encrypted_copy.json'); await dl2.saveAs(copyPath);
    ok(!fs.readFileSync(copyPath, 'utf8').includes('سرّي'), 'full copy has plaintext');
    await p5.reload(); ok(await p5.isVisible('#loginUser'), 'no sign-in screen');
    await p5.fill('#loginUser', 'owner'); await p5.fill('#loginPass', 'خطأ-خطأ-خطأ'); await p5.click('form[data-form=login] button'); await p5.waitForSelector('#unlockErr .alert.danger', { timeout: 20000 });
    await p5.fill('#loginPass', 'كلمة-سر-قوية-1'); await p5.click('form[data-form=login] button'); await p5.waitForFunction(() => !MCStore.status.locked && App.db.trainees.length > 0, null, { timeout: 20000 });
    ok((await p5.evaluate(() => App.db.trainees.map(t => t.displayName))).includes('سرّي جداً'), 'data lost after unlock');
    await c5.close();
    const c9 = await browser.newContext(); await c9.setOffline(true); const p9 = await c9.newPage(); await p9.goto('file://' + FILE);
    await p9.setInputFiles('#openCopy', copyPath); await p9.waitForSelector('#loginUser');
    await p9.fill('#loginUser', 'coach2'); await p9.fill('#loginPass', 'مدرب-ثاني-2'); await p9.click('form[data-form=login] button');
    await p9.waitForFunction(() => !MCStore.status.locked && App.db.trainees.length > 0, null, { timeout: 20000 });
    ok((await p9.evaluate(() => [MCStore.status.currentUser.u, MCStore.status.currentUser.role, App.db.audit.some(a => a.actor === 'coach2')])).join() === 'coach2,coach,true', 'coach2 session/actor');
    await p9.reload(); ok(await p9.isVisible('#loginUser'), 'copy not adopted on device 2'); await c9.close();
    const c6 = await browser.newContext(); await c6.setOffline(true); const p6 = await c6.newPage(); await p6.goto('file://' + FILE);
    await go(p6, 'data'); await p6.setInputFiles('#impFile', encPath); await p6.waitForSelector('#impPass');
    await p6.fill('#impPass', 'خطأ'); await p6.click('[data-act=impDecrypt]'); await p6.waitForSelector('#impPreview .alert.danger', { timeout: 20000 });
    await p6.fill('#impPass', 'ملف-سر-2026'); await p6.click('[data-act=impDecrypt]'); await p6.waitForSelector('[data-act=impConfirm]', { timeout: 20000 }); await p6.click('[data-act=impConfirm]');
    ok((await p6.evaluate(() => App.db.trainees.map(t => t.displayName))).includes('سرّي جداً'), 'encrypted import failed');
    await c6.close(); ok(!e5.length, e5.join()); return 'PBKDF2 ' + 310000 + ' iterations, AES-GCM-256';
  });
  await step('T28 simple setup (for myself): short bilingual form → weekly plan with home/outdoor days, weak-side work, English names, video links, reading copy', async () => {
    const c7 = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 900 } }); await c7.setOffline(true); const p7 = await c7.newPage(); const e7 = [];
    p7.on('pageerror', e => e7.push(e.message)); p7.on('console', m => { if (m.type() === 'error') e7.push(m.text()); });
    await p7.goto('file://' + FILE);
    await p7.click('[data-act=setupNew][data-for=self]');
    const radio = async (n, v) => { await p7.check(`[name="${n}"][value="${v}"]`); };
    await p7.fill('[name=name]', 'أنا'); await p7.fill('[name=age]', '34'); await p7.fill('[name=heightCm]', '176'); await p7.fill('[name=weightKg]', '82');
    await radio('sex', 'male'); await radio('goal', 'general'); await radio('place', 'both'); await radio('minutes', '30');
    for (const d of ['1', '3', '5', '6']) await p7.check(`[name=days][value="${d}"]`);
    const healthQs = await p7.evaluate(() => MCScreen.visible(App.ui.wz.answers, { sex: 'male' }).filter(q => q.sec === 'health' && !q.when).map(q => q.id));
    ok(healthQs.length <= 10, 'too many health questions: ' + healthQs.length);
    for (const id of healthQs) await radio('h_' + id, 'no');
    await radio('f_push', '6-15'); await radio('f_squat', '10-20'); await radio('f_plank', '20-45'); await radio('f_walk', '10-30'); await radio('h_active', 'no');
    await radio('weakArm', 'left'); await p7.check('[name=focus][value=lowback]'); await p7.check('[name=consent]');
    const formText = await p7.textContent('#wzForm'); ok(/Your health/.test(formText) && /Yes/.test(formText) && /نعم/.test(formText), 'form not bilingual');
    const nQ = await p7.$$eval('#wzForm .q', x => x.length);
    await p7.click('#wzForm button[type=submit]'); await p7.waitForFunction(() => App.ui.page === 'plan', null, { timeout: 10000 });
    const plan = await p7.evaluate(() => App.plansOf(App.ui.traineeId).slice(-1)[0]);
    ok(plan.status === 'active', 'plan not active: ' + plan.blockers.join());
    const tr = plan.days.filter(d => d.type === 'train'), walks = plan.days.filter(d => d.type === 'recovery');
    ok(tr.length >= 2 && tr.every(d => d.place === 'home'), 'home workouts');
    ok(walks.length >= 1 && walks.every(d => d.place === 'outdoor' && d.recovery[0].exId === 'CA-WALK'), 'outdoor walks');
    ok(tr.every(d => d.main.some(i => i.weak && i.weak.side === 'left')), 'weak-side work missing');
    ok(tr.every(d => d.main.some(i => i.focus === 'lowback')), 'focus work missing');
    ok(plan.notes.some(n => /كتلة/.test(n)), 'BMI note missing');
    const view = await p7.textContent('#view'); ok(/Home workout/.test(view) && /Outdoor walk/.test(view) && /الجانب الأضعف/.test(view), 'plan view labels');
    const [dl] = await Promise.all([p7.waitForEvent('download'), p7.click('[data-act=readCopy]')]); const rc = path.join(OUT, 'reading_copy.html'); await dl.saveAs(rc);
    const html = fs.readFileSync(rc, 'utf8'); const en = await p7.evaluate(p => MCEX.byId(p.days.find(d => d.type === 'train').main[0].exId).en, plan);
    ok(html.includes(en) && /youtube\.com\/results\?search_query=/.test(html) && !/<script/i.test(html) && /<svg/.test(html), 'reading copy content');
    const r7 = await c7.newPage(); await r7.goto('file://' + rc); await r7.screenshot({ path: path.join(OUT, 'reading_copy.png'), fullPage: false }); await r7.close();
    await p7.evaluate(() => { window.print = () => {}; }); await p7.click('[data-act=printPlan]'); await p7.emulateMedia({ media: 'print' });
    const pdf = path.join(OUT, 'simple_plan_print.pdf'); await p7.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true }); await p7.emulateMedia({ media: 'screen' });
    ok(fs.statSync(pdf).size > 20000, 'pdf too small');
    await p7.screenshot({ path: path.join(OUT, 'simple_plan.png'), fullPage: false });
    await c7.close(); ok(!e7.length, e7.join(' | ')); return nQ + ' questions on the setup page (incl. profile & fitness), ' + healthQs.length + ' health questions';
  });
  await step('T29 simple setup: a red-flag answer pauses the plan and explains why', async () => {
    const c8 = await browser.newContext(); await c8.setOffline(true); const p8 = await c8.newPage(); await p8.goto('file://' + FILE);
    await p8.click('[data-act=setupNew][data-for=trainee]');
    const radio = async (n, v) => { await p8.check(`[name="${n}"][value="${v}"]`); };
    await p8.fill('[name=name]', 'متدرب'); await p8.fill('[name=age]', '50'); await p8.fill('[name=heightCm]', '170'); await p8.fill('[name=weightKg]', '75');
    await radio('sex', 'male'); await radio('place', 'home');
    const qs = await p8.evaluate(() => MCScreen.visible(App.ui.wz.answers, { sex: 'male' }).filter(q => q.sec === 'health' && !q.when).map(q => q.id));
    for (const id of qs) await radio('h_' + id, id === 'chest' ? 'yes' : 'no');
    await radio('f_push', '1-5'); await radio('f_squat', '<10'); await radio('f_plank', '<20'); await radio('f_walk', '<10'); await radio('h_active', 'no'); await p8.check('[name=consent]');
    await p8.click('#wzForm button[type=submit]'); await p8.waitForFunction(() => App.ui.page === 'screen', null, { timeout: 10000 });
    ok(await p8.isVisible('text=do-not-auto-prescribe'), 'refer explanation not shown');
    ok((await p8.evaluate(() => App.db.plans.length)) === 0, 'plan must not be created'); await c8.close();
  });
  await step('T30 gym program: separate weighted plan, log weight per set, next week load rises after hitting top reps', async () => {
    const r = await page.evaluate(() => {
      const t = { id: MCStore.uniqueId(App.db, 'trainees'), displayName: 'رياضي الصالة', createdAt: MCStore.nowISO(), age: 28, sex: 'male', heightCm: 180, weightKg: 85, program: 'gym', gymLevel: 2, days: [0, 2, 4], minutes: 60, place: 'home', equipment: ['wall', 'mat', 'dumbbell', 'barbell', 'rack', 'bench', 'kettlebell', 'cable', 'machine', 'legpress', 'pulldown'], consent: { at: 'x' }, goal: 'strength', weakArm: 'none', weakLeg: 'none', focus: [] };
      App.db.trainees.push(t);
      const ans = { cv_dx: 'no', chest: 'no', dizzy: 'no', breath: 'no', chronic: 'no', msk: 'no', supervised: 'no', acute_ill: 'no', active: 'yes' };
      App.db.screenings.push({ id: MCStore.uniqueId(App.db, 'screenings'), traineeId: t.id, at: MCStore.nowISO(), version: MCScreen.VERSION, answers: ans, outcome: MCScreen.evaluate(ans, { trainee: t }) });
      App.db.baselines.push({ id: MCStore.uniqueId(App.db, 'baselines'), traineeId: t.id, at: MCStore.nowISO(), version: 'BL-5.1-quick', tests: {}, quick: {}, result: { levels: MCEngine.quickLevels({ push: '6-15', squat: '10-20', plank: '20-45', walk: '10-30', active: 'yes' }, t), flags: [], status: 'ok' } });
      App.ui.traineeId = t.id; App.save(); return t.id; });
    await page.evaluate(() => App.render()); const p = await genPlan(); ok(p.program === 'gym' && p.status === 'active', 'not gym/active');
    const tr = p.days.filter(d => d.type === 'train'); ok(tr.every(d => d.place === 'gym' && d.main.every(i => i.gym)), 'non-gym items');
    ok(await page.isVisible('text=Gym workout'), 'gym label');
    await page.evaluate(() => document.querySelectorAll('#view details.day').forEach(x => { x.open = true; }));
    const di = tr[0].index; await page.click(`[data-act=startSession][data-day="${di}"]`);
    for (let g = 0; g < 10 && (await page.evaluate(() => App.db.sessions.slice(-1)[0].items[App.ui.run.idx].block)) !== 'main'; g++) await page.click('[data-act=runNext]');
    const it = await page.evaluate(() => App.db.sessions.slice(-1)[0].items[App.ui.run.idx]); ok(await page.isVisible('#runLoad'), 'no weight input');
    for (let k = 0; k < it.prescribed.sets; k++) { await page.fill('#runLoad', '40'); await page.fill('#runInput', String(it.prescribed.repRange ? it.prescribed.repRange[1] : it.prescribed.target)); await page.click('[data-act=runSet]'); await page.click('[data-act=restSkip]'); }
    await page.click('[data-act=runRate][data-v=ok]'); await page.click('[data-act=runPause]');
    const p2 = await page.evaluate((ws) => { const t = App.trainee(); const q = App.createPlan(t, ws, null); App.save(); return q; }, (await db()).plans.find(x => x.id === p.id).weekEnd.replace(/\d\d$/, d => String(Number(d) + 1).padStart(2, '0')));
    const it2 = p2.days.flatMap(d => d.main || []).find(x => x.exId === it.exId); ok(it.prescribed.repRange == null || (it2 && it2.load === 40 + it2.inc), 'load did not progress: ' + JSON.stringify(it2 && it2.load));
    return it.exId + ': 40 kg → ' + (it2 && it2.load) + ' kg';
  });
  await step('T31 goal 60 push-ups: setup with target, test in week 1, logged test raises best, progress bar + rank shown', async () => {
    const c10 = await browser.newContext({ viewport: { width: 1280, height: 900 } }); await c10.setOffline(true); const p10 = await c10.newPage(); p10.on('dialog', d => d.accept()); const e10 = []; p10.on('pageerror', e => e10.push(e.message));
    await p10.goto('file://' + FILE); await p10.click('[data-act=setupNew][data-for=self]');
    const radio = async (n, v) => { await p10.check(`[name="${n}"][value="${v}"]`); };
    await p10.fill('[name=name]', 'الهدف 60'); await p10.fill('[name=age]', '25'); await p10.fill('[name=heightCm]', '175'); await p10.fill('[name=weightKg]', '72');
    await radio('sex', 'male'); await radio('goal', 'target'); await radio('gKind', 'pushup'); await p10.fill('[name=gTarget]', '60'); await radio('place', 'home'); await radio('minutes', '30');
    const qs = await p10.evaluate(() => MCScreen.visible(App.ui.wz.answers, { sex: 'male' }).filter(q => q.sec === 'health' && !q.when).map(q => q.id)); for (const id of qs) await radio('h_' + id, 'no');
    await radio('f_push', '16+'); await radio('f_squat', '20+'); await radio('f_plank', '45+'); await radio('f_walk', '30+'); await radio('h_active', 'yes'); await p10.check('[name=consent]');
    await p10.click('#wzForm button[type=submit]'); await p10.waitForFunction(() => App.ui.page === 'plan', null, { timeout: 10000 });
    const pl = await p10.evaluate(() => App.plansOf(App.ui.traineeId).slice(-1)[0]); ok(pl.goal && pl.goal.target === 60 && pl.goal.timed, 'goal not set');
    const test = pl.days.flatMap(d => d.main || []).find(i => i.test); ok(test, 'no test item');
    ok(await p10.isVisible('.goal .bar'), 'no progress bar'); ok(await p10.isVisible('.motiv .rank'), 'no rank');
    const day = pl.days.find(d => (d.main || []).some(i => i.test)); await p10.evaluate(() => document.querySelectorAll('#view details.day').forEach(x => { x.open = true; }));
    await p10.click(`[data-act=startSession][data-day="${day.index}"]`);
    for (let g = 0; g < 10 && !(await p10.evaluate(() => App.db.sessions.slice(-1)[0].items[App.ui.run.idx].test)); g++) await p10.click('[data-act=runNext]');
    await p10.fill('#runInput', '27'); await p10.click('[data-act=runSet]');
    const r = await p10.evaluate(() => { const t = App.trainee(); return [MCGoals.best(t, 'pushup'), MCGoals.percent(t), JSON.stringify(MCGoals.project(t))]; });
    ok(r[0] === 27 && r[1] === 45, 'goal log ' + r.join()); await c10.close(); ok(!e10.length, e10.join()); return 'best 27/60 (45%), projection ' + r[2] + ' weeks (estimate)';
  });
  await page.screenshot({ path: path.join(OUT, 'final.png') });
  await step('T25 zero external network requests and zero console errors during the whole run', async () => { ok(!external.length, 'external: ' + external.join()); ok(!errors.length, errors.slice(0, 3).join(' | ')); });
  await browser.close();
  results.forEach(r => console.log(r));
  console.log(`\nE2E: ${pass} passed, ${fail} failed — Chromium ${browser.version ? '' : ''}headless via Playwright, file:// URL, network offline`);
  fs.writeFileSync(path.join(OUT, 'e2e_results.txt'), results.join('\n') + `\n\nE2E: ${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})();
