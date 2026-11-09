/* Weekly plan: simple day-by-day view, safe changes, A4 print and a trainee reading copy. WEEKLY ONLY. */
(function () {
  'use strict';
  var App = window.App, S = window.MCStore, E = window.MCEngine, X = window.MCEX, esc = App.esc;
  var bi = function (a, e) { return App.bi ? App.bi(a, e) : esc(a); };

  App.videoUrl = function (ex) { return 'https://www.youtube.com/results?search_query=' + encodeURIComponent(ex.en + ' exercise how to'); };
  function sideAr(s) { return s === 'left' ? 'اليسرى' : 'اليمنى'; }
  function setsAr(n) { return n === 1 ? 'مجموعة واحدة' : n === 2 ? 'مجموعتان' : n + ' مجموعات'; }
  /* Plain-language dose, e.g. "3 مجموعات × 10 تكرارات لكل جهة · راحة 60 ثانية" */
  App.dosageText = function (it) {
    var ex = X.byId(it.exId), amount = it.u === 'reps' ? it.target + ' تكرار' : it.target >= 120 ? Math.round(it.target / 60) + ' دقيقة' : it.target + ' ثانية';
    var t = (!it.walk ? setsAr(it.sets) + ' × ' : '') + amount + (it.side ? ' لكل جهة' : '') + (it.rest ? ' · راحة ' + it.rest + ' ثانية' : '');
    if (it.weak) t += ' · الجهة الأضعف (' + sideAr(it.weak.side) + '): ' + setsAr(it.sets + 1) + '، وابدأ بها';
    if (ex && ex.dose.tempo && it.u === 'reps' && !it.walk && it.sets > 1) t += ' · ببطء وتحكم';
    return t;
  };
  App.dosageEn = function (it) { var a = it.u === 'reps' ? it.target + ' reps' : it.target >= 120 ? Math.round(it.target / 60) + ' min' : it.target + ' s'; return (it.walk ? '' : it.sets + ' × ') + a + (it.side ? ' each side' : '') + (it.rest ? ', rest ' + it.rest + ' s' : '') + (it.weak ? ' (weak ' + it.weak.side + ' side: +1 set, start with it)' : ''); };
  function dayHead(d) {
    if (d.type === 'rest') return ['😴', 'راحة', 'Rest day'];
    if (d.type === 'recovery') return d.place === 'outdoor' ? ['🌳', 'مشي خارج المنزل', 'Outdoor walk'] : ['🏠', 'مشي ونشاط خفيف في المنزل', 'Light activity at home'];
    return ['🏠', 'تمارين في المنزل', 'Home workout'];
  }
  App.dayHead = dayHead;

  /* Create (or update with a revision) the plan for week starting ws. autoReason → no prompts. */
  App.createPlan = function (t, ws, autoReason) {
    if (autoReason) { var cov = App.db.plans.filter(function (p) { return p.traineeId === t.id && p.weekStart <= ws && p.weekEnd >= ws; })[0]; if (cov) ws = cov.weekStart; }
    var existing = App.db.plans.filter(function (p) { return p.traineeId === t.id && p.weekStart === ws; })[0];
    var pls = App.plansOf(t.id).filter(function (p) { return p.weekStart < ws; }), prev = pls[pls.length - 1] || null;
    var rev = prev ? App.db.reviews.filter(function (r) { return r.planId === prev.id; }).pop() : null;
    var input = { trainee: t, screening: App.latest('screenings', t.id), baseline: App.latest('baselines', t.id), prevPlan: prev, decision: rev ? Object.assign({ reviewId: rev.id, at: rev.at }, rev.decision) : null, weekStart: ws, planId: existing ? existing.id : S.uniqueId(App.db, 'plans', S.isoWeek(ws)), requireFreshBaseline: true };
    var plan = E.generatePlan(input); plan.decision = input.decision;
    if (!existing) { App.db.plans.push(plan); App.audit('plan.create', 'خطة ' + plan.id + ' (' + plan.status + ')', t.id, plan.id); return plan; }
    var hasSessions = App.db.sessions.some(function (s) { return s.planId === existing.id; });
    if (hasSessions && autoReason) { App.toast('توجد حصص مسجلة هذا الأسبوع؛ سيُطبَّق التحديث على جدول الأسبوع القادم.', 6000); return existing; }
    if (hasSessions && !confirm('توجد حصص مسجلة على هذه الخطة. إعادة التوليد تحفظ النسخة القديمة في السجل. متابعة؟')) return null;
    var reason = autoReason || prompt('سبب إعادة إنشاء جدول الأسبوع نفسه:'); if (!reason || reason.trim().length < 5) { App.toast('السبب مطلوب (5 أحرف على الأقل)'); return null; }
    existing.revisions = existing.revisions || [];
    existing.revisions.push({ at: S.nowISO(), reason: 'إعادة توليد: ' + reason.trim(), ruleVersion: existing.ruleVersion, days: existing.days, status: existing.status, notes: existing.notes, blockers: existing.blockers });
    ['days', 'status', 'blockers', 'notes', 'ruleVersion', 'screeningId', 'baselineId', 'prevPlanId', 'pathway', 'decision', 'tempFlagsIn', 'traineeName', 'coachName'].forEach(function (k) { existing[k] = plan[k]; });
    existing.updatedAt = S.nowISO(); App.audit('plan.regenerate', 'إعادة توليد ' + existing.id + ': ' + reason, t.id, existing.id);
    return existing;
  };

  App.pages.plan = function () {
    var t = App.trainee(); if (!t) return '<h2>' + bi('الجدول الأسبوعي', 'Weekly plan') + '</h2>' + App.needTrainee('الجدول');
    var pls = App.plansOf(t.id), ui = App.ui;
    var cur = (ui.planId && pls.filter(function (p) { return p.id === ui.planId; })[0]) || pls[pls.length - 1];
    var h = '<h2>' + bi('جدول الأسبوع', 'Weekly plan') + ' — ' + esc(t.displayName) + '</h2>';
    if (!cur) {
      var sc0 = App.latest('screenings', t.id), bl0 = App.latest('baselines', t.id);
      if (sc0 && sc0.outcome.status !== 'cleared') return h + '<div class="alert danger"><b>لا يوجد جدول تمارين حالياً — السبب صحي</b><ul>' + sc0.outcome.reasons.filter(function (r) { return r.level === 'refer' || r.level === 'more_info'; }).map(function (r) { return '<li>' + esc(r.text) + '</li>'; }).join('') + '</ul>هذا ليس تشخيصاً.</div><button class="sec" data-act="go" data-page="screen">' + bi('التفاصيل والتصريح الطبي', 'Details & clearance') + '</button>';
      return h + '<div class="empty"><p>لا يوجد جدول بعد.</p>' + (sc0 && sc0.outcome.status === 'cleared' && bl0 ? '<button data-act="genFirst">' + bi('أنشئ الجدول ابتداءً من اليوم', 'Create plan starting today') + '</button>' : '<button data-act="setupEdit" data-id="' + esc(t.id) + '">' + bi('أكمل البيانات وأنشئ الجدول', 'Complete details & create plan') + '</button>') + '</div>';
    }
    var last = pls[pls.length - 1], reviewed = App.db.reviews.some(function (r) { return r.planId === last.id; });
    if (cur === last && last.status !== 'blocked' && App.today() >= E.addDays(last.weekStart, 5)) {
      h += reviewed ? '<div class="alert ok"><b>انتهى الأسبوع وتمت مراجعته</b><button data-act="genNext">' + bi('أنشئ جدول الأسبوع التالي', 'Create next week') + '</button></div>'
        : '<div class="alert"><b>قارب الأسبوع على الانتهاء</b>أجب عن أسئلة المراجعة القصيرة ليتعدل الأسبوع القادم حسب أدائك. <button class="sec" data-act="go" data-page="review">' + bi('مراجعة الأسبوع', 'Weekly check') + '</button></div>';
    }
    h += planView(cur, t);
    h += '<details class="card flat"><summary>' + bi('خيارات إضافية', 'More options') + '</summary>' +
      (pls.length > 1 ? '<label>' + bi('عرض أسبوع سابق', 'Show another week') + '<select id="planPick">' + pls.map(function (p) { return '<option value="' + esc(p.id) + '"' + (p.id === cur.id ? ' selected' : '') + '>' + esc(App.fmtDate(p.weekStart)) + ' – ' + esc(App.fmtDate(p.weekEnd)) + (p.status === 'blocked' ? ' (متوقف)' : '') + '</option>'; }).join('') + '</select></label>' : '') +
      '<div class="row"><label>' + bi('بداية أسبوع محدد', 'Custom week start') + '<input type="date" id="weekStart" value="' + esc(ui.weekStart || E.addDays(last.weekStart, 7)) + '"></label><button class="sec" data-act="genPlan"' + (!reviewed && last.status !== 'blocked' ? ' disabled title="راجع الأسبوع الحالي أولاً"' : '') + '>' + bi('إنشاء', 'Create') + '</button><button class="ghost" data-act="regen" data-id="' + esc(cur.id) + '">' + bi('إعادة إنشاء هذا الأسبوع', 'Rebuild this week') + '</button></div>' +
      '<p class="small muted">رقم الخطة: ' + esc(cur.id) + ' · ' + esc(cur.ruleVersion) + '</p></details>';
    return h;
  };
  App.changes.planPick = function (el) { App.ui.planId = el.value; App.render(); };
  App.changes.weekStart = function (el) { App.ui.weekStart = el.value; };
  App.acts.genPlan = function () { var t = App.trainee(), ws = App.ui.weekStart || App.$('#weekStart').value; if (!/^\d{4}-\d{2}-\d{2}$/.test(ws)) return App.toast('تاريخ غير صالح'); var p = App.createPlan(t, ws, null); if (p) { App.ui.planId = p.id; App.ui.weekStart = null; App.save(); App.render(); } };
  App.acts.genFirst = function () { var p = App.createPlan(App.trainee(), App.today(), null); if (p) { App.ui.planId = p.id; App.save(); App.render(); } };
  App.acts.genNext = function () { var t = App.trainee(), pls = App.plansOf(t.id), p = App.createPlan(t, E.addDays(pls[pls.length - 1].weekStart, 7), null); if (p) { App.ui.planId = p.id; App.save(); App.render(); App.toast('تم إنشاء جدول الأسبوع التالي ✔'); } };
  App.acts.regen = function (el) { var t = App.trainee(), cur = App.db.plans.filter(function (p) { return p.id === el.dataset.id; })[0]; var p = App.createPlan(t, cur.weekStart, null); if (p) { App.ui.planId = p.id; App.save(); App.render(); } };

  function planView(p, t) {
    var today = App.today();
    var h = '<div class="card"><div class="row"><div class="grow"><b>' + App.fmtDate(p.weekStart) + ' ← ' + App.fmtDate(p.weekEnd) + '</b></div>' +
      (p.status === 'blocked' ? '<span class="badge b-danger">⛔ ' + bi('متوقف', 'Paused') + '</span>' : '') +
      '<button class="sec" data-act="printPlan" data-id="' + esc(p.id) + '">🖨 ' + bi('طباعة / PDF', 'Print / PDF') + '</button>' +
      (p.status !== 'blocked' ? '<button class="sec" data-act="readCopy" data-id="' + esc(p.id) + '">📄 ' + bi('حفظ نسخة للمتدرب', 'Save reading copy') + '</button>' : '') + '</div>';
    if (p.status === 'blocked') return h + '<div class="alert danger"><b>لا يوجد جدول تمارين حالياً</b><ul>' + p.blockers.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>حتى ذلك الحين: نشاط يومي خفيف فقط. هذا ليس تشخيصاً.</div><button class="sec" data-act="go" data-page="screen">' + bi('الجانب الصحي والتصريح', 'Health & clearance') + '</button></div>';
    if (p.decision) h += '<div class="alert ' + (p.decision.overall === 'progress' ? 'ok' : p.decision.overall === 'maintain' ? '' : 'warn') + '"><b>بناءً على أدائك الأسبوع الماضي: ' + esc(E.DECISION_AR[p.decision.overall] || p.decision.overall) + '</b>' + (p.decision.reasons || []).slice(0, 4).map(function (r) { return esc(r.text); }).join('<br>') + '</div>';
    var walkMin = 0, trainDays = 0; p.days.forEach(function (d) { if (d.type === 'train') trainDays++; (d.recovery || []).forEach(function (r) { walkMin += r.target / 60; }); });
    h += '<p>' + bi(trainDays + ' أيام تمارين في المنزل · ' + Math.round(walkMin) + ' دقيقة مشي هذا الأسبوع', trainDays + ' home workouts · ' + Math.round(walkMin) + ' min walking') + '</p>';
    h += '<details><summary class="small">' + bi('لماذا هذا الجدول؟', 'Why this plan?') + '</summary><ul class="small">' + p.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></details></div>';
    var openIdx = (p.days.filter(function (x) { return x.type !== 'rest' && x.date >= today; })[0] || p.days.filter(function (x) { return x.type !== 'rest'; })[0] || {}).index;
    p.days.forEach(function (d) {
      var hd = dayHead(d), ses = App.db.sessions.filter(function (s) { return s.planId === p.id && s.dayIndex === d.index; });
      var stat = ses.some(function (s) { return s.status === 'complete'; }) ? '<span class="badge b-ok">✔ ' + bi('تم', 'Done') + '</span>' : ses.length ? '<span class="badge b-warn">' + bi('جزئي', 'Partial') + '</span>' : '';
      var isToday = d.date === today;
      h += '<details class="day' + (isToday ? ' today' : '') + '"' + (d.index === openIdx ? ' open' : '') + '><summary><span class="dico">' + hd[0] + '</span><b>' + esc(d.dowAr) + '</b> <span class="muted">' + App.fmtDate(d.date) + '</span> ' + bi(hd[1], hd[2]) + (d.estMinutes && d.type !== 'rest' ? ' <span class="pill">≈ ' + d.estMinutes + ' د</span>' : '') + (isToday ? ' <span class="badge b-info">' + bi('اليوم', 'Today') + '</span>' : '') + ' ' + stat + '</summary><div class="inner">';
      if (d.type === 'rest') h += '<p class="muted">راحة تامة أو حركة يومية خفيفة. نم جيداً واشرب الماء.</p>';
      else {
        (d.recovery || []).forEach(function (it) { h += itemRow(p, d, it, -1); });
        if (d.warmup && d.warmup.length) h += '<p class="small"><b>' + bi('إحماء 5 دقائق', 'Warm-up 5 min') + ':</b> ' + d.warmup.map(function (it) { return '<button class="linkbtn" data-act="exOpen" data-id="' + esc(it.exId) + '">' + esc(App.exName(it.exId)) + '</button>'; }).join(' · ') + '</p>';
        (d.main || []).forEach(function (it, j) { h += itemRow(p, d, it, j); });
        if (d.cooldown && d.cooldown.length) h += '<p class="small"><b>' + bi('تهدئة وإطالة', 'Cool-down') + ':</b> ' + d.cooldown.map(function (it) { return '<button class="linkbtn" data-act="exOpen" data-id="' + esc(it.exId) + '">' + esc(App.exName(it.exId)) + '</button>'; }).join(' · ') + '</p>';
        h += '<div class="row"><button class="ok" data-act="startSession" data-plan="' + esc(p.id) + '" data-day="' + d.index + '">▶ ' + bi('ابدأ', 'Start') + '</button></div>';
      }
      h += '</div></details>';
    });
    if (p.overrides && p.overrides.length) h += '<details class="card flat"><summary class="small">تغييرات يدوية (' + p.overrides.length + ')</summary><ul class="small">' + p.overrides.map(function (o) { return '<li>' + App.fmtDT(o.at) + ': ' + esc(App.exName(o.from.exId)) + ' ← ' + esc(App.exName(o.to.exId)) + ' — ' + esc(o.reason) + '</li>'; }).join('') + '</ul></details>';
    return h + overrideDialog();
  }
  function itemRow(p, d, it, j) {
    var ex = X.byId(it.exId) || { ar: it.exId, en: '' };
    return '<div class="item"><div class="thumb">' + App.thumb(it.exId) + '</div><div><b>' + esc(ex.ar) + '</b> <span class="en" dir="ltr">' + esc(ex.en) + '</span>' +
      (it.weak ? ' <span class="pill wk">💪 ' + bi('الجانب الأضعف: ' + sideAr(it.weak.side), 'Weak side') + '</span>' : '') + (it.focus ? ' <span class="pill">🎯 ' + esc(E.FOCUS[it.focus].ar) + '</span>' : '') + (it.override ? ' <span class="pill">معدّل</span>' : '') +
      '<div>' + esc(App.dosageText(it)) + '</div><details class="why"><summary>لماذا؟</summary>' + it.why.map(esc).join('<br>') + '</details></div>' +
      '<div class="act row"><button class="sec" data-act="exOpen" data-id="' + esc(it.exId) + '">' + bi('الشرح', 'How to') + '</button>' + (j >= 0 ? '<button class="ghost" data-act="ovOpen" data-plan="' + esc(p.id) + '" data-day="' + d.index + '" data-item="' + j + '">' + bi('تغيير', 'Change') + '</button>' : '') + '</div></div>';
  }

  /* ---------- safe change (coach override within safe bounds) ---------- */
  function overrideDialog() { return '<dialog id="ovDlg" aria-labelledby="ovTitle"><div class="dlg-head"><h3 id="ovTitle">تغيير تمرين ضمن الحدود الآمنة</h3><button class="ghost" data-act="ovClose" aria-label="إغلاق">✕</button></div><div class="dlg-body" id="ovBody"></div></dialog>'; }
  App.acts.ovOpen = function (el) {
    var t = App.trainee(), p = App.db.plans.filter(function (x) { return x.id === el.dataset.plan; })[0], di = Number(el.dataset.day), ii = Number(el.dataset.item), it = p.days[di].main[ii];
    var ctxIn = { trainee: t, screening: App.latest('screenings', t.id), baseline: App.latest('baselines', t.id) };
    var cands = E.candidatesFor(p, di, ii, ctxIn), ex = X.byId(it.exId), d = ex.dose, rng = d.u === 'reps' ? d.reps : d.sec;
    App.$('#ovBody').innerHTML = '<form data-form="override" data-plan="' + esc(p.id) + '" data-day="' + di + '" data-item="' + ii + '"><p>الحالي: <b>' + esc(ex.ar) + '</b> ' + esc(App.dosageText(it)) + '</p><label>التمرين (البدائل الآمنة فقط: ' + cands.length + ')<select name="exId">' + cands.map(function (c) { return '<option value="' + esc(c.id) + '"' + (c.id === it.exId ? ' selected' : '') + '>' + esc(c.ar) + ' — ' + esc(c.en) + '</option>'; }).join('') + '</select></label>' +
      '<div class="grid"><label>المجموعات (' + d.sets.join('–') + ')<input type="number" name="sets" value="' + it.sets + '"></label><label>' + (d.u === 'reps' ? 'التكرارات' : 'الثواني') + ' (' + rng.join('–') + ')<input type="number" name="target" value="' + it.target + '"></label></div>' +
      '<label><input type="checkbox" name="allDays" checked> تطبيق على كل أيام الأسبوع</label><label>السبب (مطلوب)<input name="reason" required minlength="5" maxlength="300"></label><div id="ovErr" role="alert"></div><button type="submit">تطبيق</button></form>';
    App.$('#ovDlg').showModal();
  };
  App.acts.ovClose = function () { App.$('#ovDlg').close(); };
  App.forms.override = function (f) {
    var t = App.trainee(), fd = new FormData(f), p = App.db.plans.filter(function (x) { return x.id === f.dataset.plan; })[0];
    var di = Number(f.dataset.day), ii = Number(f.dataset.item), it = p.days[di].main[ii];
    var exId = String(fd.get('exId')), ch = { dayIndex: di, itemIndex: ii, exId: exId, reason: String(fd.get('reason') || ''), allDays: !!fd.get('allDays') };
    if (exId === it.exId || Number(fd.get('sets')) !== it.sets || Number(fd.get('target')) !== it.target) { ch.sets = Number(fd.get('sets')); ch.target = Number(fd.get('target')); }
    if (exId !== it.exId && Number(fd.get('sets')) === it.sets && Number(fd.get('target')) === it.target) { delete ch.sets; delete ch.target; }
    var r = E.applyOverride(p, ch, { trainee: t, screening: App.latest('screenings', t.id), baseline: App.latest('baselines', t.id) });
    if (!r.ok) { App.$('#ovErr').innerHTML = '<div class="alert danger">' + esc(r.error) + '</div>'; return; }
    p.updatedAt = S.nowISO(); App.audit('plan.override', p.id + ': ' + ch.reason, t.id, p.id); App.save(); App.$('#ovDlg').close(); App.render(); App.toast('تم التغيير وتسجيله');
  };

  /* ---------- printable / reading-copy content (shared) ---------- */
  function exercisesOf(p) { var ids = [], info = {}; p.days.forEach(function (d) { (d.recovery || []).concat(d.main || [], d.warmup || [], d.cooldown || []).forEach(function (it) { if (ids.indexOf(it.exId) < 0) { ids.push(it.exId); info[it.exId] = it; } if (it.weak) info[it.exId] = it; }); }); return { ids: ids, info: info }; }
  function docBody(p, t, forScreen) {
    var em = App.db.settings.emergencyNumber || '....';
    var h = '<header class="p-head"><div><h1>جدول التمارين الأسبوعي <span class="en" dir="ltr">Weekly Training Plan</span></h1><div class="pname">' + esc(t.displayName) + '</div><div>الأسبوع · Week: <b>' + App.fmtDate(p.weekStart) + ' – ' + App.fmtDate(p.weekEnd) + '</b></div>' + (t.forWhom === 'trainee' && t.coachName ? '<div>المدرب · Coach: ' + esc(t.coachName) + '</div>' : '') + '</div><div class="meta">' + esc(p.id) + '</div></header>';
    h += '<section class="p-box"><b>كيف تستخدم الجدول · How to use</b><ul><li>ابدأ كل يوم تمارين بإحماء 5 دقائق، واختم بالإطالة.</li><li>الشدة المناسبة: تتعب لكن تستطيع الكلام بجمل قصيرة. لا تحبس نفسك.</li><li>اسم كل تمرين مكتوب بالعربي والإنجليزي؛ ابحث بالاسم الإنجليزي لتجد فيديو شرح.</li>' + (Object.keys(exercisesOf(p).info).some(function (k) { return exercisesOf(p).info[k].weak; }) ? '<li><b>الجانب الأضعف:</b> في التمارين المعلَّمة ابدأ بالجهة الأضعف وأعطها مجموعة إضافية.</li>' : '') + '</ul><b>أوقف التمرين فوراً إذا:</b> ألم أو ضغط في الصدر، دوخة شديدة أو إغماء، ضيق نفس غير طبيعي، خفقان قوي، ألم حاد في مفصل' + (p.pathway === 'pregnancy' ? '، نزيف أو تسرب سوائل أو انقباضات' : '') + '. الطوارئ: <b>' + esc(em) + '</b>. هذا الجدول ليس استشارة طبية.</section>';
    h += '<h2>الأسبوع يوماً بيوم · Day by day</h2><table class="wk"><thead><tr><th>اليوم</th><th>أين</th><th>ماذا تفعل</th></tr></thead><tbody>';
    p.days.forEach(function (d) {
      var hd = dayHead(d), body;
      if (d.type === 'rest') body = 'راحة · Rest';
      else if (d.type === 'recovery') body = (d.recovery || []).map(function (it) { var ex = X.byId(it.exId); return '<b>' + esc(ex.ar) + '</b> <span class="en" dir="ltr">(' + esc(ex.en) + ')</span> — ' + Math.round(it.target / 60) + ' دقيقة'; }).join('<br>');
      else body = d.main.map(function (it, i) { var ex = X.byId(it.exId); return (i + 1) + '. <b>' + esc(ex.ar) + '</b> <span class="en" dir="ltr">(' + esc(ex.en) + ')</span> — ' + esc(App.dosageText(it)); }).join('<br>');
      h += '<tr><td><b>' + esc(d.dowAr) + '</b><br>' + App.fmtDate(d.date) + '</td><td>' + hd[0] + ' ' + esc(hd[1]) + '</td><td>' + body + '</td></tr>';
    });
    h += '</tbody></table>';
    var ex = exercisesOf(p);
    h += '<h2 class="pb">شرح التمارين · Exercise guide</h2>';
    ex.ids.forEach(function (id) {
      var e = X.byId(id), it = ex.info[id]; if (!e) return;
      h += '<article class="exs"><div class="pics"><div>' + App.thumb(id, 0) + '<small>البداية · Start</small></div><div>' + App.thumb(id) + '<small>النهاية · End</small></div></div><div class="txt"><h3>' + esc(e.ar) + '</h3><div class="enname" dir="ltr">' + esc(e.en) + '</div>' +
        '<div class="dose">' + esc(App.dosageText(it)) + '</div><ol>' + e.steps.slice(0, 4).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
        '<div><b>التنفس:</b> ' + esc(e.breath) + '</div><div><b>انتبه:</b> ' + esc(e.errors.slice(0, 2).join('؛ ')) + '</div><div><b>توقف إذا:</b> ' + esc(e.stop.slice(0, 2).join('؛ ')) + '</div>' +
        '<div class="vid">🔎 فيديو: ابحث عن <span dir="ltr">“' + esc(e.en) + ' exercise”</span> — <a href="' + esc(App.videoUrl(e)) + '" target="_blank" rel="noopener noreferrer">فتح البحث في يوتيوب ↗</a></div></div></article>';
    });
    if (!forScreen) {
      h += '<h2 class="pb">سجل الأسبوع · Weekly log</h2><table class="fb"><thead><tr><th>اليوم</th><th>تم؟</th><th>التعب 0–10</th><th>ألم 0–10 / أين</th><th>ملاحظات</th></tr></thead><tbody>' + p.days.filter(function (d) { return d.type !== 'rest'; }).map(function (d) { return '<tr><td>' + esc(d.dowAr) + ' ' + App.fmtDate(d.date) + '</td><td>☐ نعم ☐ جزئي ☐ لا</td><td></td><td></td><td></td></tr>'; }).join('') + '</tbody></table>';
    }
    h += '<p class="meta foot">روابط الفيديو تحتاج إنترنت وهي نتائج بحث عامة لم يراجعها التطبيق — اتبع الشرح المكتوب إذا اختلف الفيديو عنه. ملف PDF لا يُستورد في التطبيق؛ للنقل بين الأجهزة استخدم نسخة JSON. ' + esc(p.ruleVersion) + ' · v' + esc(S.APP_VERSION) + '</p>';
    return h;
  }
  App.acts.printPlan = function (el) {
    var p = App.db.plans.filter(function (x) { return x.id === el.dataset.id; })[0], t = App.trainee(p.traineeId);
    App.$('#print').innerHTML = p.status === 'blocked' ? '<header class="p-head"><h1>' + esc(t.displayName) + '</h1></header><div class="p-box"><b>لا يوجد جدول تمارين حالياً.</b><ul>' + p.blockers.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul></div>' : docBody(p, t, false);
    App.audit('plan.print', 'طباعة ' + p.id, t.id, p.id); App.save();
    setTimeout(function () { window.print(); }, 50);
  };
  /* Stand-alone HTML reading copy for the trainee (opens on any phone/PC; no scripts). */
  App.readingCopyHTML = function (p, t) {
    var css = 'body{font-family:"Segoe UI",Tahoma,"Geeza Pro",Arial,sans-serif;margin:0;background:#f4f6f8;color:#14212d;line-height:1.7}main{max-width:820px;margin:auto;padding:14px}' +
      '.p-head{display:flex;justify-content:space-between;gap:8px;border-bottom:3px solid #8a6a12;padding-bottom:8px}h1{font-size:1.35rem;margin:0}.pname{font-size:1.2rem;font-weight:700}.en{color:#4c5f70;font-size:.85em}.meta{color:#4c5f70;font-size:.8rem}' +
      '.p-box{background:#fff;border:1px solid #c8d3dd;border-radius:12px;padding:10px 14px;margin:12px 0}table{width:100%;border-collapse:collapse;background:#fff}th,td{border:1px solid #c8d3dd;padding:6px;text-align:start;vertical-align:top}th{background:#e7edf2}' +
      '.exs{background:#fff;border:1px solid #c8d3dd;border-radius:12px;padding:10px;margin:10px 0;display:grid;grid-template-columns:1fr 1.3fr;gap:10px}.pics{display:grid;grid-template-columns:1fr 1fr;gap:6px}.pics small{display:block;text-align:center;color:#4c5f70}' +
      '.enname{font-weight:700;color:#0f7d6b}.dose{background:#fff4dc;border-radius:8px;padding:4px 8px;margin:4px 0}.vid a{font-weight:700}h3{margin:0}@media(max-width:600px){.exs{grid-template-columns:1fr}}' +
      document.getElementById('figcss').textContent.replace(/var\(--fig-bg,[^)]*\)/g, '#f3f7fa').replace(/var\(--fig,[^)]*\)/g, '#1d4e7a').replace(/var\(--fig-far,[^)]*\)/g, '#7aa1c4');
    return '<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + esc(t.displayName) + ' — جدول ' + esc(p.weekStart) + '</title><style>' + css + '</style></head><body><main>' + docBody(p, t, true) + '</main></body></html>';
  };
  App.acts.readCopy = function (el) {
    var p = App.db.plans.filter(function (x) { return x.id === el.dataset.id; })[0], t = App.trainee(p.traineeId);
    App.download('جدول_' + t.displayName + '_' + p.weekStart + '.html', App.readingCopyHTML(p, t), 'text/html');
    App.audit('plan.readcopy', 'نسخة قراءة ' + p.id, t.id, p.id); App.save();
    App.toast('تم حفظ نسخة القراءة. أرسلها للمتدرب ليفتحها على جواله. · Reading copy saved.', 6000);
  };
})();
