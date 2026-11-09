/* Simple setup (one page, 3 short sections, bilingual), simple home page and "More" page. */
(function () {
  'use strict';
  var App = window.App, S = window.MCStore, E = window.MCEngine, X = window.MCEX, SC = window.MCScreen, esc = App.esc;

  /* bilingual label helper: Arabic line + small English line */
  function bi(ar, en) { return '<span class="ar">' + esc(ar) + '</span>' + (en ? ' <span class="en" dir="ltr">' + esc(en) + '</span>' : ''); }
  App.bi = bi;
  function radios(name, opts, val) {
    return '<div class="chips" role="radiogroup">' + opts.map(function (o) { return '<label class="chip"><input type="radio" name="' + esc(name) + '" value="' + esc(o[0]) + '"' + (String(val) === String(o[0]) ? ' checked' : '') + '><span>' + bi(o[1], o[2]) + '</span></label>'; }).join('') + '</div>';
  }
  function checks(name, opts, vals) {
    vals = vals || [];
    return '<div class="chips">' + opts.map(function (o) { return '<label class="chip"><input type="checkbox" name="' + esc(name) + '" value="' + esc(o[0]) + '"' + (vals.indexOf(String(o[0])) >= 0 || vals.indexOf(o[0]) >= 0 ? ' checked' : '') + '><span>' + bi(o[1], o[2]) + '</span></label>'; }).join('') + '</div>';
  }
  function q(label, en, body, note) { return '<div class="q"><div class="qt">' + bi(label, en) + '</div>' + body + (note ? '<div class="small muted">' + esc(note) + '</div>' : '') + '</div>'; }
  App.biRadios = radios;

  var DAYS = E.DOW_AR.map(function (d, i) { return [i, d, ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i]]; });
  var GOALS = [['general', 'لياقة عامة', 'General fitness'], ['weight', 'إنقاص الوزن', 'Weight loss'], ['strength', 'قوة', 'Strength'], ['endurance', 'تحمّل', 'Endurance'], ['mobility', 'مرونة وحركة', 'Mobility']];
  var EQUIP = [['chair', 'كرسي ثابت', 'Sturdy chair'], ['step', 'درجة أو درج', 'Step / stairs'], ['bar', 'عقلة', 'Pull-up bar'], ['table', 'طاولة متينة', 'Sturdy table'], ['towel', 'منشفة', 'Towel']];
  var FIT = {
    push: [['0', 'لا أستطيع', 'None'], ['1-5', '1–5'], ['6-15', '6–15'], ['16+', 'أكثر من 15', '16+']],
    squat: [['<10', 'أقل من 10', 'Under 10'], ['10-20', '10–20'], ['20+', 'أكثر من 20', '20+']],
    plank: [['<20', 'أقل من 20 ثانية', 'Under 20 s'], ['20-45', '20–45 ثانية', '20–45 s'], ['45+', 'أكثر من 45 ثانية', '45+ s']],
    walk: [['<10', 'أقل من 10 دقائق', 'Under 10 min'], ['10-30', '10–30 دقيقة', '10–30 min'], ['30+', 'أكثر من 30 دقيقة', '30+ min']],
    pull: [['0', 'ولا واحدة', 'None'], ['1-3', '1–3'], ['4+', '4 أو أكثر', '4+']],
    side: [['none', 'لا', 'No'], ['left', 'اليسرى أضعف', 'Left is weaker'], ['right', 'اليمنى أضعف', 'Right is weaker']]
  };

  function fromTrainee(t) {
    var sc = App.latest('screenings', t.id), bl = App.latest('baselines', t.id);
    var eq = (t.equipment || []).filter(function (e) { return ['chair', 'step', 'bar', 'table', 'towel'].indexOf(e) >= 0; });
    var ans = sc ? JSON.parse(JSON.stringify(sc.answers)) : {};
    return { editId: t.id, forWhom: t.forWhom || 'trainee', name: t.displayName, coachName: t.coachName || '', age: t.age, sex: t.sex === 'male' || t.sex === 'female' ? t.sex : '', heightCm: t.heightCm || '', weightKg: t.weightKg || '',
      goal: t.goal || 'general', days: (t.days || []).map(String), minutes: String(t.minutes || 30), place: t.place || 'home', eq: eq, answers: ans,
      fit: (bl && bl.quick) || {}, weakArm: t.weakArm || 'none', weakLeg: t.weakLeg || 'none', focus: t.focus || [], consent: !!t.consent };
  }
  App.acts.setupNew = function (el) { App.ui.wz = { forWhom: el.dataset.for || 'self', days: ['0', '2', '4'], minutes: '30', place: 'both', goal: 'general', answers: {}, fit: {}, eq: ['chair'], weakArm: 'none', weakLeg: 'none', focus: [] }; App.go('setup'); };
  App.acts.setupEdit = function (el) { var t = App.trainee(el.dataset.id); App.ui.traineeId = t.id; App.ui.wz = fromTrainee(t); App.go('setup'); };

  App.pages.setup = function () {
    var w = App.ui.wz; if (!w) { App.ui.wz = w = { forWhom: 'self', days: ['0', '2', '4'], minutes: '30', place: 'both', goal: 'general', answers: {}, fit: {}, eq: ['chair'], weakArm: 'none', weakLeg: 'none', focus: [] }; }
    var tview = { sex: w.sex || '' };
    var h = '<h2>' + (w.editId ? 'تعديل البيانات' : 'جدول جديد') + ' <span class="en" dir="ltr">' + (w.editId ? 'Edit details' : 'New plan') + '</span></h2><p class="muted lead">' + bi('3 أقسام قصيرة. اختر الإجابة الأقرب لك.', '3 short sections — pick the closest answer.') + '</p><div id="wzErr" role="alert"></div><form data-form="setup" id="wzForm" novalidate>';
    /* 1) about */
    h += '<fieldset class="card"><legend>' + bi('1) عنك', 'About you') + '</legend>';
    h += q('لمن هذا الجدول؟', 'Who is this plan for?', radios('forWhom', [['self', 'لنفسي', 'For myself'], ['trainee', 'لمتدرب', 'For a trainee']], w.forWhom));
    h += '<div class="grid g3"><label>' + bi('الاسم', 'Name') + '<input name="name" maxlength="80" value="' + esc(w.name || '') + '" required></label>' +
      (w.forWhom === 'trainee' ? '<label>' + bi('اسم المدرب', 'Coach name') + '<input name="coachName" maxlength="80" value="' + esc(w.coachName || App.db.settings.coachName || '') + '"></label>' : '') +
      '<label>' + bi('العمر', 'Age') + '<input name="age" type="number" inputmode="numeric" min="10" max="100" value="' + esc(w.age || '') + '"></label>' +
      '<label>' + bi('الطول (سم)', 'Height (cm)') + '<input name="heightCm" type="number" inputmode="numeric" min="100" max="230" value="' + esc(w.heightCm || '') + '"></label>' +
      '<label>' + bi('الوزن (كجم)', 'Weight (kg)') + '<input name="weightKg" type="number" inputmode="decimal" min="30" max="250" step="0.5" value="' + esc(w.weightKg || '') + '"></label></div>';
    h += q('الجنس', 'Sex', radios('sex', [['male', 'ذكر', 'Male'], ['female', 'أنثى', 'Female']], w.sex), 'يُستخدم فقط لإظهار أسئلة الحمل، ولا يغيّر شدة التمارين.');
    h += q('هدفك', 'Your goal', radios('goal', GOALS, w.goal));
    h += q('الأيام المتاحة', 'Available days', checks('days', DAYS, w.days));
    h += q('مدة التمرين', 'Session length', radios('minutes', [['20', '20 دقيقة', '20 min'], ['30', '30 دقيقة', '30 min'], ['45', '45 دقيقة', '45 min'], ['60', '60 دقيقة', '60 min']], w.minutes));
    h += q('أين ستتمرن؟', 'Where will you train?', radios('place', [['home', 'في المنزل فقط', 'Home only'], ['both', 'المنزل + خارج المنزل (مشي، حديقة)', 'Home + outdoors (walks, park)']], w.place));
    h += q('ما المتوفر لديك؟ (الحائط متوفر دائماً)', 'What do you have? (a wall is assumed)', checks('eq', EQUIP, w.eq));
    h += '</fieldset>';
    /* 2) health */
    h += '<fieldset class="card"><legend>' + bi('2) صحتك', 'Your health') + '</legend><p class="small muted lead">' + bi('أسئلة سلامة قصيرة؛ أي «نعم» على علامة خطر يوقف الجدول حتى مراجعة الطبيب.', 'Short safety questions; a “yes” to a warning sign pauses the plan until a doctor review.') + '</p>';
    SC.visible(w.answers, tview).filter(function (x) { return x.sec !== 'fitness'; }).forEach(function (x) {
      var v = w.answers[x.id];
      var body = x.type === 'yn' ? radios('h_' + x.id, SC.YN, v) : x.type === 'select' ? radios('h_' + x.id, x.opts, v) : x.type === 'multi' ? checks('h_' + x.id, x.opts, v || []) : '<input name="h_' + esc(x.id) + '" type="number" inputmode="numeric" min="' + x.min + '" max="' + x.max + '" value="' + esc(v == null ? '' : v) + '" style="max-width:160px">';
      h += q(x.text, x.en, body);
    });
    h += '</fieldset>';
    /* 3) fitness */
    var f = w.fit || {};
    h += '<fieldset class="card"><legend>' + bi('3) لياقتك الآن', 'Your fitness now') + '</legend><p class="small muted lead">' + bi('تقدير صادق يكفي — ليس اختباراً.', 'An honest estimate is enough — not a test.') + '</p>';
    h += q('كم تمرين ضغط عادي تستطيع بشكل صحيح دون توقف؟', 'How many regular push-ups can you do in a row?', radios('f_push', FIT.push, f.push));
    h += q('كم مرة تجلس وتقوم (سكوات) متتالية؟', 'How many squats in a row?', radios('f_squat', FIT.squat, f.squat));
    h += q('كم ثانية تثبت في وضع البلانك؟', 'How long can you hold a plank?', radios('f_plank', FIT.plank, f.plank));
    h += q('كم دقيقة تمشي دون توقف؟', 'How long can you walk without stopping?', radios('f_walk', FIT.walk, f.walk));
    if ((w.eq || []).indexOf('bar') >= 0) h += q('كم عقلة تستطيع؟', 'How many pull-ups?', radios('f_pull', FIT.pull, f.pull));
    var act = SC.QUESTIONS.filter(function (x) { return x.id === 'active'; })[0];
    h += q(act.text, act.en, radios('h_active', SC.YN.slice(0, 2), w.answers.active));
    h += q('هل إحدى يديك أضعف بوضوح من الأخرى؟', 'Is one arm clearly weaker?', radios('weakArm', FIT.side, w.weakArm));
    h += q('هل إحدى ساقيك أضعف بوضوح من الأخرى؟', 'Is one leg clearly weaker?', radios('weakLeg', FIT.side, w.weakLeg));
    h += q('مناطق تريد تقويتها أكثر (اختر حتى 2)', 'Areas to strengthen more (up to 2)', checks('focus', Object.keys(E.FOCUS).map(function (k) { return [k, E.FOCUS[k].ar, E.FOCUS[k].en]; }), w.focus || []));
    h += '</fieldset>';
    h += '<div class="card flat"><label><input type="checkbox" name="consent"' + (w.consent ? ' checked' : '') + '> ' + bi('أفهم أن البيانات تُحفظ على هذا الجهاز فقط، وأن الجدول ليس استشارة طبية.', 'I understand data stays on this device only and this is not medical advice.') + '</label></div>';
    h += '<button type="submit" class="big">' + bi(w.editId ? 'حفظ وتحديث الجدول' : 'أنشئ الجدول', w.editId ? 'Save & update plan' : 'Create plan') + '</button></form>';
    return h;
  };
  function readWz(form) {
    var fd = new FormData(form), w = App.ui.wz, g = function (k) { var v = fd.get(k); return v == null ? '' : String(v); };
    ['forWhom', 'name', 'coachName', 'age', 'sex', 'heightCm', 'weightKg', 'goal', 'minutes', 'place', 'weakArm', 'weakLeg'].forEach(function (k) { if (fd.has(k) || form.querySelector('[name="' + k + '"]')) w[k] = g(k); });
    w.days = fd.getAll('days').map(String); w.eq = fd.getAll('eq').map(String); w.focus = fd.getAll('focus').map(String).slice(0, 2); w.consent = !!fd.get('consent');
    w.fit = w.fit || {}; ['push', 'squat', 'plank', 'walk', 'pull'].forEach(function (k) { if (fd.get('f_' + k)) w.fit[k] = g('f_' + k); });
    SC.QUESTIONS.forEach(function (x) {
      var n = 'h_' + x.id;
      if (x.type === 'multi') { if (form.querySelector('[name="' + n + '"]')) w.answers[x.id] = fd.getAll(n).map(String); }
      else if (fd.get(n) != null && fd.get(n) !== '') w.answers[x.id] = x.type === 'num' ? Number(fd.get(n)) : g(n);
    });
    return w;
  }
  App.after.setup = function () {
    var f = App.$('#wzForm'); if (!f) return;
    f.addEventListener('change', function (e) {
      var w = readWz(f);
      if (e.target.name === 'focus' && w.focus.length >= 2) App.$$('[name=focus]', f).forEach(function (c) { if (!c.checked) c.disabled = true; });
      if (['INPUT'].indexOf(e.target.tagName) >= 0 && (e.target.type === 'radio' || e.target.type === 'checkbox') && e.target.name !== 'consent') { var y = window.scrollY; App.render(); window.scrollTo(0, y); }
    });
    f.addEventListener('input', function (e) { if (e.target.type === 'text' || e.target.type === 'number' || !e.target.type) readWz(f); });
    if ((App.ui.wz.focus || []).length >= 2) App.$$('[name=focus]', f).forEach(function (c) { if (!c.checked) c.disabled = true; });
  };

  App.forms.setup = function (form) {
    var w = readWz(form), errs = [];
    var age = Number(w.age), hcm = Number(w.heightCm), wkg = Number(w.weightKg);
    if (!String(w.name || '').trim()) errs.push('الاسم مطلوب · Name is required');
    if (!(age >= 10 && age <= 100)) errs.push('العمر بين 10 و100 · Age 10–100');
    if (!(hcm >= 100 && hcm <= 230)) errs.push('الطول بين 100 و230 سم · Height 100–230 cm');
    if (!(wkg >= 30 && wkg <= 250)) errs.push('الوزن بين 30 و250 كجم · Weight 30–250 kg');
    if (!w.sex) errs.push('اختر الجنس · Choose sex');
    if (!w.days.length) errs.push('اختر يوماً واحداً على الأقل · Pick at least one day');
    if (!w.place) errs.push('اختر مكان التمرين · Choose where you will train');
    var tview = { sex: w.sex, age: age };
    var health = SC.visible(w.answers, tview).filter(function (x) { return x.sec !== 'fitness'; });
    var missH = health.filter(function (x) { var v = w.answers[x.id]; return x.type === 'multi' ? false : (v === undefined || v === ''); });
    if (missH.length) errs.push('أجب عن كل أسئلة الصحة (' + missH.length + ' متبقية) · Answer all health questions');
    if (w.answers.msk === 'yes' && !(w.answers.msk_areas || []).length) errs.push('حدد مكان الإصابة أو الألم · Choose where the pain/injury is');
    ['push', 'squat', 'plank', 'walk'].forEach(function (k) { if (!w.fit[k]) errs.push('أكمل قسم اللياقة · Complete the fitness section'); });
    if (w.eq.indexOf('bar') >= 0 && !w.fit.pull) errs.push('كم عقلة تستطيع؟ · How many pull-ups?');
    if (!w.answers.active) errs.push('هل تتمرن بانتظام؟ · Do you exercise regularly?');
    if (!w.consent) errs.push('وافق على ملاحظة الخصوصية · Accept the privacy note');
    errs = errs.filter(function (e, i) { return errs.indexOf(e) === i; });
    if (errs.length) { App.$('#wzErr').innerHTML = '<div class="alert danger"><b>أكمل الحقول التالية · Please complete:</b>' + errs.map(esc).join('<br>') + '</div>'; window.scrollTo(0, 0); return; }

    var now = S.nowISO(), t = w.editId ? App.trainee(w.editId) : null, isNew = !t;
    if (isNew) t = { id: S.uniqueId(App.db, 'trainees'), createdAt: now, archived: false, avoid: [], limitations: [], revisions: [] };
    else { t.revisions = t.revisions || []; var snap = JSON.parse(JSON.stringify(t)); delete snap.revisions; t.revisions.push({ at: now, snapshot: snap }); t.revisions = t.revisions.slice(-20); }
    var name = String(w.name).trim().slice(0, 80);
    Object.assign(t, { displayName: name, forWhom: w.forWhom === 'trainee' ? 'trainee' : 'self', coachName: w.forWhom === 'trainee' ? String(w.coachName || '').slice(0, 80) : name, age: age, sex: w.sex,
      heightCm: hcm, weightKg: wkg, bodyMetricsConsent: true, goal: w.goal || 'general', experience: w.answers.active === 'yes' ? 'intermediate' : 'beginner', minutes: Number(w.minutes) || 30,
      days: w.days.map(Number), place: w.place, equipment: ['wall', 'mat'].concat(w.eq, w.place === 'both' ? ['space'] : [], w.eq.indexOf('step') >= 0 ? ['stairs'] : []),
      weakArm: w.weakArm || 'none', weakLeg: w.weakLeg || 'none', focus: w.focus || [], walkRange: w.fit.walk, updatedAt: now });
    if (!t.consent) t.consent = { at: now, text: 'setup-5.1', version: 'CONSENT-5.1' };
    if (t.forWhom === 'trainee' && t.coachName) App.db.settings.coachName = t.coachName;
    if (isNew) App.db.trainees.push(t);
    /* screening record (keeps every version) */
    var ans = {}; SC.visible(w.answers, t).forEach(function (x) { if (w.answers[x.id] !== undefined) ans[x.id] = w.answers[x.id]; });
    var prior = App.latest('screenings', t.id);
    var sc = { id: S.uniqueId(App.db, 'screenings'), traineeId: t.id, at: S.nowISO(), version: SC.VERSION, answers: ans, shown: SC.visible(ans, t).map(function (x) { return x.id; }), ageAtScreening: age, sexAtScreening: w.sex, priorId: prior ? prior.id : null, clearance: null };
    sc.outcome = SC.evaluate(ans, { trainee: t, prior: prior, clearance: null });
    App.db.screenings.push(sc);
    App.audit(isNew ? 'setup.create' : 'setup.update', (isNew ? 'إعداد ' : 'تحديث ') + name + ' ⇒ ' + sc.outcome.status, t.id, sc.id);
    App.ui.traineeId = t.id; App.ui.wz = null;
    if (sc.outcome.status !== 'cleared') { App.save(); App.ui.screenMode = null; App.go('screen'); App.toast('الجدول متوقف حتى استكمال الجانب الصحي — انظر السبب. · Plan paused for health reasons.', 7000); return; }
    var fitRec = { push: w.fit.push, squat: w.fit.squat, plank: w.fit.plank, walk: w.fit.walk, pull: w.fit.pull || 'none', active: w.answers.active };
    App.db.baselines.push({ id: S.uniqueId(App.db, 'baselines'), traineeId: t.id, at: S.nowISO(), version: 'BL-5.1-quick', screeningId: sc.id, tests: {}, quick: fitRec,
      result: { levels: E.quickLevels(fitRec, t), notes: {}, flags: [], status: 'ok', messages: [], version: 'BL-5.1-quick' } });
    var r = App.createPlan(t, App.today(), isNew ? null : 'تحديث البيانات من شاشة الإعداد');
    App.save(); App.ui.planId = r && r.id; App.go('plan');
    App.toast(r && r.status !== 'blocked' ? 'تم إنشاء الجدول ✔ · Plan created' : 'تم الحفظ', 5000);
  };

  /* ---------- simple home ---------- */
  App.pages.dash = function () {
    var db = App.db, act = db.trainees.filter(function (t) { return !t.archived; });
    var h = '';
    if (S.status.mode === 'memory' || S.status.error) h += '<div class="alert danger"><b>تحذير الحفظ</b>' + esc(S.status.error) + '</div>';
    if (S.readV4Local() && !db.legacy) h += '<div class="alert warn"><b>وُجدت بيانات من النسخة v4 في هذا المتصفح</b>يمكن نقلها (قراءة فقط دون تعديل v4) من <button class="sec" data-act="go" data-page="data">النسخ الاحتياطي</button></div>';
    h += '<div class="hero"><button class="big" data-act="setupNew" data-for="self">📋 ' + bi('جدول لنفسي', 'Plan for myself') + '</button><button class="big sec" data-act="setupNew" data-for="trainee">👥 ' + bi('جدول لمتدرب', 'Plan for a trainee') + '</button></div>';
    if (!act.length) return h + '<p class="muted center lead">' + bi('ابدأ بأحد الزرين أعلاه: 3 أقسام قصيرة ثم يظهر الجدول الأسبوعي مباشرة.', 'Start above: 3 short sections, then your weekly plan.') + '</p>';
    act.slice().sort(function (a, b) { return (a.forWhom === 'self' ? 0 : 1) - (b.forWhom === 'self' ? 0 : 1); }).forEach(function (t) {
      var sc = App.latest('screenings', t.id), pls = App.plansOf(t.id), pl = pls[pls.length - 1], today = App.today(), di = -1, d = null;
      if (pl && pl.status !== 'blocked' && today >= pl.weekStart && today <= pl.weekEnd) { d = pl.days.filter(function (x) { return x.date === today; })[0]; di = d ? d.index : -1; }
      var todayTxt = !pl ? 'لا يوجد جدول بعد' : pl.status === 'blocked' ? '⛔ الجدول متوقف لسبب صحي' : !d ? 'أسبوع الجدول انتهى — راجع الأسبوع وأنشئ التالي' : d.type === 'rest' ? '😴 اليوم راحة' : d.type === 'recovery' ? (d.place === 'outdoor' ? '🌳 اليوم: مشي خارج المنزل ' : '🏠 اليوم: مشي في المنزل ') + Math.round(d.recovery[0].target / 60) + ' دقيقة' : '🏠 اليوم: تمارين في المنزل (' + d.main.length + ' تمارين)';
      h += '<div class="card"><div class="row"><h3 class="grow">' + esc(t.displayName) + (t.forWhom === 'self' ? ' <span class="pill">أنا · Me</span>' : '') + '</h3>' + App.statusBadge(sc && sc.outcome.status) + '</div><p>' + esc(todayTxt) + '</p><div class="row">' +
        (pl ? '<button data-act="pick" data-id="' + esc(t.id) + '" data-page="plan">🗓 ' + bi('الجدول', 'Plan') + '</button>' : '') +
        (d && d.type !== 'rest' ? '<button class="ok" data-act="startSession" data-plan="' + esc(pl.id) + '" data-day="' + di + '">▶ ' + bi('ابدأ تمرين اليوم', 'Start today') + '</button>' : '') +
        (pl && pl.status !== 'blocked' && !App.db.reviews.some(function (r) { return r.planId === pl.id; }) && today >= E.addDays(pl.weekStart, 5) ? '<button class="sec" data-act="pick" data-id="' + esc(t.id) + '" data-page="review">✅ ' + bi('مراجعة الأسبوع', 'Weekly check') + '</button>' : '') +
        '<button class="ghost" data-act="setupEdit" data-id="' + esc(t.id) + '">✎ ' + bi('تعديل البيانات', 'Edit details') + '</button></div></div>';
    });
    return h;
  };

  /* ---------- More ---------- */
  App.pages.more = function () {
    var items = [['trainees', '👥', 'إدارة الملفات', 'Manage profiles'], ['screen', '🩺', 'الفحص الصحي والتصريح الطبي', 'Health screen & clearance'], ['history', '📈', 'السجل والتقدم', 'History & progress'], ['data', '💾', 'النسخ الاحتياطي والتشفير', 'Backup & encryption'], ['sources', '⚖', 'المصادر والسلامة', 'Sources & safety']];
    return '<h2>' + bi('المزيد', 'More') + '</h2><div class="grid">' + items.map(function (i) { return '<button class="excard" data-act="go" data-page="' + i[0] + '"><h4>' + i[1] + ' ' + bi(i[2], i[3]) + '</h4></button>'; }).join('') + '</div>';
  };
})();
