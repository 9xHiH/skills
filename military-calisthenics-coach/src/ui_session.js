/* Live session runner (autosaves every set), post-session check, weekly review, history/progress. */
(function () {
  'use strict';
  var App = window.App, S = window.MCStore, E = window.MCEngine, X = window.MCEX, SC = window.MCScreen, esc = App.esc;
  function planById(id) { return App.db.plans.filter(function (p) { return p.id === id; })[0]; }
  function sesById(id) { return App.db.sessions.filter(function (s) { return s.id === id; })[0]; }

  /* ---------- start / resume ---------- */
  App.acts.startSession = function (el) {
    var p = planById(el.dataset.plan), di = Number(el.dataset.day), d = p.days[di], t = App.trainee(p.traineeId);
    if (p.status === 'blocked') return App.toast('الخطة موقوفة');
    var open = App.db.sessions.filter(function (s) { return s.planId === p.id && s.dayIndex === di && s.status === 'partial'; })[0];
    if (open) { App.ui.run = { id: open.id, idx: open.cursor || 0 }; return App.go('session'); }
    var early = d.date > App.today();
    if (early && !confirm('هذا اليوم (' + App.fmtDate(d.date) + ') لم يحن بعد. تسجيل حصة مبكرة قد يقلل أيام الراحة المخططة. هل تريد المتابعة؟')) return;
    if (App.db.sessions.some(function (s) { return s.planId === p.id && s.dayIndex === di && s.status !== 'partial'; }) && !confirm('توجد حصة مسجلة لهذا اليوم. تسجيل حصة ثانية؟')) return;
    var flat = [];
    (d.warmup || []).forEach(function (it) { flat.push(Object.assign({ block: 'warmup' }, it)); });
    (d.recovery || []).forEach(function (it) { flat.push(Object.assign({ block: 'recovery' }, it)); });
    (d.main || []).forEach(function (it) { flat.push(Object.assign({ block: 'main' }, it)); });
    (d.cooldown || []).forEach(function (it) { flat.push(Object.assign({ block: 'cooldown' }, it)); });
    var s = { id: S.uniqueId(App.db, 'sessions'), traineeId: t.id, planId: p.id, dayIndex: di, date: d.date, kind: d.type === 'recovery' ? 'recovery' : 'train', status: 'partial', early: early, startedAt: S.nowISO(), updatedAt: S.nowISO(), cursor: 0, redFlag: false,
      items: flat.map(function (it) { return { block: it.block, slot: it.slot || null, exId: it.exId, prescribed: { sets: it.sets, target: it.target, u: it.u, side: !!it.side, rest: it.rest }, sets: [], effort: '', technique: '', pain: 0, painArea: '' }; }) };
    App.db.sessions.push(s); App.audit('session.start', 'بدء حصة ' + s.id, t.id, s.id); App.save();
    App.ui.run = { id: s.id, idx: 0 }; App.go('session');
  };

  App.pages.session = function () {
    var run = App.ui.run, s = run && sesById(run.id);
    if (!s) {
      var t = App.trainee(); var h = '<h2>الحصة المباشرة</h2>';
      if (!t) return h + App.needTrainee('الحصة');
      var open = App.db.sessions.filter(function (x) { return x.traineeId === t.id && x.status === 'partial'; });
      if (open.length) h += '<div class="card"><h3>حصص غير مكتملة (محفوظة)</h3>' + open.map(function (x) { return '<div class="row"><span class="grow">' + esc(x.id) + ' · ' + App.fmtDate(x.date) + ' · ' + esc(x.planId) + '</span><button data-act="resume" data-id="' + esc(x.id) + '">متابعة</button></div>'; }).join('') + '</div>';
      return h + '<div class="empty">افتح الخطة الأسبوعية واختر «بدء الحصة المباشرة» لليوم المطلوب.<br><button class="sec" data-act="go" data-page="plan">الخطة الأسبوعية</button></div>';
    }
    if (s.status === 'complete' || s.status === 'stopped') return summary(s);
    if (run.idx >= s.items.length) return postCheck(s);
    var it = s.items[run.idx], ex = X.byId(it.exId), pr = it.prescribed;
    var blockAr = { warmup: 'إحماء', main: 'رئيسي', cooldown: 'تهدئة', recovery: 'استشفاء' }[it.block];
    var h = '<div class="row"><h2 class="grow">الحصة المباشرة · ' + esc(App.trainee(s.traineeId).displayName) + '</h2><span class="badge b-info">' + (run.idx + 1) + ' / ' + s.items.length + '</span></div>';
    h += '<div class="stepper">' + s.items.map(function (x, i) { return '<span class="' + (i === run.idx ? 'on' : x.sets.length ? 'done' : '') + '" title="' + esc(App.exName(x.exId)) + '">' + (i + 1) + '</span>'; }).join('') + '</div>';
    h += '<div class="card"><div class="row"><h3 class="grow">' + esc(ex.ar) + ' <span class="pill">' + blockAr + '</span></h3><span class="badge b-info">الهدف: ' + esc(App.dosageText({ exId: it.exId, sets: pr.sets, target: pr.target, u: pr.u, side: pr.side, rest: pr.rest })) + '</span></div>' +
      '<div class="player"><div id="runPlayer"></div><div><ol class="steps">' + ex.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol><p class="small"><b>التنفس:</b> ' + esc(ex.breath) + '</p><p class="small"><b>انتبه:</b> ' + esc(ex.errors.slice(0, 3).join('؛ ')) + '</p></div></div></div>';
    var done = it.sets.length, isTime = pr.u === 'time';
    h += '<div class="card"><h3>المجموعة ' + Math.min(done + 1, pr.sets) + ' من ' + pr.sets + (done >= pr.sets ? ' ✔ (اكتملت المجموعات المخططة)' : '') + '</h3><div class="counter">' +
      '<div class="card flat"><div class="bignum" id="runVal" aria-live="polite">' + (isTime ? fmtS(pr.target) : '0') + '</div>' +
      (isTime ? '<div class="row" style="justify-content:center"><button class="bigbtn" data-act="runTimer">▶ ابدأ المؤقت</button><button class="sec" data-act="runTimerStop">⏸</button></div><label>المدة المنجزة فعلياً (ث)<input type="number" id="runInput" min="0" max="3600" value="' + pr.target + '"></label>'
        : '<div class="row" style="justify-content:center"><button class="bigbtn sec" data-act="runMinus" aria-label="إنقاص">−</button><button class="bigbtn" data-act="runPlus" aria-label="تكرار">+1</button></div><label>التكرارات الصحيحة المنجزة<input type="number" id="runInput" min="0" max="500" value="0"></label>') +
      '<button class="ok" data-act="runSet" style="width:100%">✔ تسجيل المجموعة وبدء الراحة</button></div>' +
      '<div class="card flat"><h4>الراحة</h4><div class="bignum" id="restVal">' + fmtS(pr.rest || 0) + '</div><div class="small" style="text-align:center" id="restLbl">تبدأ تلقائياً بعد تسجيل المجموعة</div><div class="row" style="justify-content:center"><button class="sec" data-act="restSkip">تخطي الراحة</button><label style="margin:0"><input type="checkbox" id="muteRun"' + (App.ui.mute ? ' checked' : '') + '> كتم</label></div>' +
      '<p class="small">المجموعات المسجلة: ' + (it.sets.map(function (x, i) { return (i + 1) + ') ' + x.value + (isTime ? ' ث' : ''); }).join(' · ') || '—') + (it.sets.length ? ' <button class="ghost" data-act="runUndo" style="min-height:0;padding:2px 8px">تراجع عن آخر مجموعة</button>' : '') + '</p></div></div></div>';
    if (it.block === 'main') h += '<div class="card"><h4>بعد إنهاء التمرين</h4><div class="grid g3"><label>الجهد (0 = راحة، 10 = أقصى جهد ممكن)<input type="number" id="runEffort" min="0" max="10" value="' + esc(it.effort) + '"></label><label>جودة التقنية<select id="runTech"><option value="">—</option><option value="good"' + (it.technique === 'good' ? ' selected' : '') + '>جيدة</option><option value="fair"' + (it.technique === 'fair' ? ' selected' : '') + '>متوسطة</option><option value="poor"' + (it.technique === 'poor' ? ' selected' : '') + '>ضعيفة</option></select></label><label>ألم في التمرين (0–10)<input type="number" id="runPain" min="0" max="10" value="' + esc(it.pain || 0) + '"></label><label>منطقة الألم<select id="runPainArea"><option value="">—</option>' + SC.AREAS.map(function (a) { return '<option value="' + a[0] + '"' + (it.painArea === a[0] ? ' selected' : '') + '>' + a[1] + '</option>'; }).join('') + '</select></label></div><p class="small muted">ألم ≥ 4 ⇒ توقف عن هذا التمرين وانتقل للتالي؛ سيُستبدل الأسبوع القادم. ألم ≥ 7 أو ألم حاد في مفصل ⇒ أوقف الحصة.</p></div>';
    h += '<div class="row"><button class="sec" data-act="runPrev"' + (run.idx ? '' : ' disabled') + '>→ السابق</button><button data-act="runNext">التالي ←</button><button class="ghost" data-act="runPause">حفظ والخروج (حصة جزئية)</button></div>';
    h += '<div class="stopbar" role="region" aria-label="إيقاف طارئ"><span><b>علامة إنذار؟</b> ألم صدر، دوخة شديدة، ضيق نفس غير معتاد، خفقان، ألم حاد مفاجئ' + (App.latest('screenings', s.traineeId) && App.latest('screenings', s.traineeId).outcome.pathway === 'pregnancy' ? '، نزيف أو تسرب سوائل' : '') + '</span><button class="danger" data-act="runStop">⛔ إيقاف فوري</button></div>';
    return h;
  };
  App.after.session = function () {
    var run = App.ui.run, s = run && sesById(run.id); if (!s || s.status !== 'partial' || run.idx >= s.items.length) return;
    var box = App.$('#runPlayer'); if (box) App.mountPlayer(box, X.byId(s.items[run.idx].exId));
    ['runEffort', 'runTech', 'runPain', 'runPainArea'].forEach(function (id) { var el = App.$('#' + id); if (el) el.addEventListener('change', saveMeta); });
  };
  function saveMeta() {
    var s = sesById(App.ui.run.id), it = s.items[App.ui.run.idx];
    var v = function (id) { var el = App.$('#' + id); return el ? el.value : ''; };
    it.effort = v('runEffort') === '' ? '' : Math.max(0, Math.min(10, Number(v('runEffort')))); it.technique = v('runTech'); it.pain = Math.max(0, Math.min(10, Number(v('runPain')) || 0)); it.painArea = v('runPainArea');
    s.updatedAt = S.nowISO(); App.save();
    if (it.pain >= 7) App.toast('ألم ≥ 7: أوقف الحصة واطلب تقييماً.', 6000);
  }
  function fmtS(n) { n = Math.max(0, Math.round(n)); var m = Math.floor(n / 60), s = n % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  var timers = { work: null, rest: null };
  function clearTimers() { clearInterval(timers.work); clearInterval(timers.rest); timers.work = timers.rest = null; }
  App.acts.resume = function (el) { var s = sesById(el.dataset.id); App.ui.run = { id: s.id, idx: s.cursor || 0 }; App.render(); };
  App.acts.runPlus = function () { var i = App.$('#runInput'); i.value = Number(i.value || 0) + 1; App.$('#runVal').textContent = i.value; App.beep(1200, 40); };
  App.acts.runMinus = function () { var i = App.$('#runInput'); i.value = Math.max(0, Number(i.value || 0) - 1); App.$('#runVal').textContent = i.value; };
  App.changes.runInput = function (el) { var s = sesById(App.ui.run.id); if (s.items[App.ui.run.idx].prescribed.u !== 'time') App.$('#runVal').textContent = el.value; };
  App.changes.muteRun = function (el) { App.ui.mute = el.checked; };
  App.acts.runTimer = function () {
    if (timers.work) return; var s = sesById(App.ui.run.id), pr = s.items[App.ui.run.idx].prescribed, left = pr.target, startLeft = left;
    App.beep(988, 150); App.$('#runVal').textContent = fmtS(left);
    timers.work = setInterval(function () { if (!App.$('#runVal')) return clearTimers(); left--; App.$('#runVal').textContent = fmtS(left); App.$('#runInput').value = startLeft - left; if (left <= 3 && left > 0) App.beep(740, 80); if (left <= 0) { clearInterval(timers.work); timers.work = null; App.beep(660, 250, 2); App.vibrate([200, 80, 200]); } }, 1000);
  };
  App.acts.runTimerStop = function () { clearInterval(timers.work); timers.work = null; };
  App.acts.runSet = function () {
    var s = sesById(App.ui.run.id), it = s.items[App.ui.run.idx], val = Number(App.$('#runInput').value);
    if (!(val >= 0)) return App.toast('قيمة غير صالحة');
    clearTimers(); if (it.block === 'main') saveMeta();
    it.sets.push({ value: val, at: S.nowISO() }); s.updatedAt = S.nowISO(); s.cursor = App.ui.run.idx; App.save();
    var rest = it.prescribed.rest || 0, y = window.scrollY; App.render(); window.scrollTo(0, y);
    if (it.sets.length >= it.prescribed.sets) { App.toast('اكتملت المجموعات المخططة لهذا التمرين — سجّل الجهد والتقنية ثم «التالي».'); }
    if (rest > 0) { var left = rest; App.$('#restLbl').textContent = 'راحة — تنفس بهدوء'; timers.rest = setInterval(function () { if (!App.$('#restVal')) return clearTimers(); left--; App.$('#restVal').textContent = fmtS(left); if (left <= 3 && left > 0) App.beep(740, 80); if (left <= 0) { clearInterval(timers.rest); timers.rest = null; App.$('#restLbl').textContent = 'انتهت الراحة'; App.beep(988, 200, 2); App.vibrate(200); } }, 1000); }
  };
  App.acts.restSkip = function () { clearInterval(timers.rest); timers.rest = null; var l = App.$('#restLbl'); if (l) l.textContent = 'تم التخطي'; };
  App.acts.runUndo = function () { var s = sesById(App.ui.run.id); s.items[App.ui.run.idx].sets.pop(); App.save(); App.render(); };
  App.acts.runNext = function () { clearTimers(); var s = sesById(App.ui.run.id); if (s.items[App.ui.run.idx] && s.items[App.ui.run.idx].block === 'main') saveMeta(); App.ui.run.idx++; s.cursor = App.ui.run.idx; App.save(); App.render(); window.scrollTo(0, 0); };
  App.acts.runPrev = function () { clearTimers(); App.ui.run.idx = Math.max(0, App.ui.run.idx - 1); App.render(); };
  App.acts.runPause = function () { clearTimers(); var s = sesById(App.ui.run.id); s.cursor = App.ui.run.idx; App.save(); App.ui.run = null; App.toast('حُفظت الحصة كجزئية ويمكن متابعتها لاحقاً'); App.go('plan'); };
  App.acts.runStop = function () {
    if (!confirm('إيقاف الحصة فوراً وتسجيل علامة إنذار؟ ستُوقف الخطط التالية حتى فحص جديد وتصريح مختص.')) return;
    clearTimers(); var s = sesById(App.ui.run.id); var why = prompt('صف العرض باختصار (اختياري):') || '';
    s.redFlag = true; s.redFlagNote = why.slice(0, 300); s.status = 'stopped'; s.endedAt = S.nowISO(); App.audit('session.redflag', 'إيقاف طارئ ' + s.id + ': ' + why, s.traineeId, s.id); App.save(); App.render();
  };

  /* ---------- post-session check (4–6 questions) ---------- */
  var POST = [
    { id: 'effort', type: 'num', min: 0, max: 10, text: 'جهد الحصة كاملة (0 = راحة، 10 = أقصى جهد):', must: 1 },
    { id: 'technique', type: 'select', opts: [['good', 'جيدة'], ['fair', 'متوسطة'], ['poor', 'ضعيفة']], text: 'جودة التقنية عموماً:', must: 1 },
    { id: 'pain', type: 'num', min: 0, max: 10, text: 'أعلى ألم (غير الإرهاق العضلي العادي) 0–10:', must: 1 },
    { id: 'painArea', type: 'select', opts: [['', '—']].concat(SC.AREAS), text: 'مكان الألم إن وجد:' },
    { id: 'symptoms', type: 'yn', text: 'هل ظهر ألم صدر أو دوخة شديدة أو ضيق نفس غير معتاد أو خفقان؟', must: 1 },
    { id: 'comment', type: 'text', text: 'ملاحظات (اختياري):' }
  ];
  function postCheck(s) {
    var done = s.items.filter(function (i) { return i.sets.length; }).length;
    return '<h2>فحص ما بعد الحصة</h2><form class="card" data-form="post"><p>التمارين المنجزة: ' + done + ' من ' + s.items.length + '. الحصة محفوظة.</p>' + POST.map(function (q) { return App.field(q, q.id === 'pain' ? 0 : undefined, 'p_'); }).join('') + '<div id="postErr" role="alert"></div><div class="row"><button type="submit">إنهاء الحصة</button><button type="button" class="sec" data-act="runPrev">رجوع</button></div></form>';
  }
  App.forms.post = function (f) {
    var s = sesById(App.ui.run.id), a = App.readForm(f, POST, 'p_');
    var miss = POST.filter(function (q) { return q.must && (a[q.id] === undefined); }); if (miss.length) { App.$('#postErr').innerHTML = '<div class="alert danger">أجب عن الأسئلة الإلزامية</div>'; return; }
    s.check = a; s.status = 'complete'; s.endedAt = S.nowISO();
    if (a.symptoms === 'yes' || Number(a.pain) >= 7) { s.redFlag = a.symptoms === 'yes'; }
    var mins = Math.max(1, Math.round((new Date(s.endedAt) - new Date(s.startedAt)) / 60000));
    s.minutes = mins; s.load = Number(a.effort) * mins;
    App.audit('session.complete', 'إنهاء ' + s.id + ' جهد ' + a.effort + ' ألم ' + a.pain, s.traineeId, s.id); App.save(); App.render();
  };
  function summary(s) {
    var h = '<h2>ملخص الحصة ' + esc(s.id) + '</h2>';
    if (s.redFlag) h += '<div class="alert danger"><b>⛔ سُجلت علامة إنذار</b>أوقف النشاط. إذا استمر ألم الصدر أو حدث إغماء اتصل بالطوارئ: <b>' + esc(App.db.settings.emergencyNumber || '—') + '</b>. لن تُصدر خطة تلقائية جديدة قبل فحص جديد وتصريح مختص موثق.</div>';
    else if (s.check && Number(s.check.pain) >= 4) h += '<div class="alert warn"><b>ألم ' + esc(s.check.pain) + '/10</b>ليس ألماً عضلياً عادياً بالضرورة. راقب، وسيُراعى في المراجعة الأسبوعية؛ ألم ≥ 7 يستلزم تقييماً.</div>';
    h += '<div class="card"><table><thead><tr><th>التمرين</th><th>المخطط</th><th>المسجل</th><th>جهد</th><th>تقنية</th><th>ألم</th></tr></thead><tbody>' + s.items.map(function (i) { return '<tr><td>' + esc(App.exName(i.exId)) + '</td><td>' + i.prescribed.sets + '×' + i.prescribed.target + '</td><td>' + (i.sets.map(function (x) { return x.value; }).join('، ') || '—') + '</td><td>' + esc(i.effort) + '</td><td>' + esc(i.technique) + '</td><td>' + esc(i.pain || '') + '</td></tr>'; }).join('') + '</tbody></table>' + (s.load ? '<p class="small">حمل الحصة = الجهد × الدقائق = ' + s.load + ' وحدة [FOSTER2001]</p>' : '') + '</div>';
    return h + '<div class="row"><button data-act="runDone">العودة إلى الخطة</button><button class="sec" data-act="go" data-page="review">المراجعة الأسبوعية</button></div>';
  }
  App.acts.runDone = function () { App.ui.run = null; App.go('plan'); };

  /* ---------- weekly review ---------- */
  App.pages.review = function () {
    var t = App.trainee(), h = '<h2>المراجعة الأسبوعية</h2>';
    h += '<div class="card flat"><div class="row"><label class="grow">بحث برقم الخطة (يعمل فقط إذا كان السجل محلياً)<input id="revLookup" placeholder="PL5-…" value="' + esc(App.ui.revLookup || '') + '" dir="ltr"></label><button class="sec" data-act="revFind">بحث</button></div><div id="revFindOut"></div></div>';
    if (!t) return h + App.needTrainee('المراجعة');
    var pls = App.plansOf(t.id).filter(function (p) { return p.status !== 'blocked'; });
    var p = (App.ui.revPlan && planById(App.ui.revPlan)) || pls.filter(function (x) { return !App.db.reviews.some(function (r) { return r.planId === x.id; }); })[0] || pls[pls.length - 1];
    if (!p) return h + '<div class="empty">لا توجد خطة قابلة للمراجعة.</div>';
    var rev = App.db.reviews.filter(function (r) { return r.planId === p.id; }).pop();
    h += '<div class="card"><h3>' + esc(p.id) + ' <span class="muted small">' + App.fmtDate(p.weekStart) + ' – ' + App.fmtDate(p.weekEnd) + '</span></h3>';
    var sess = App.db.sessions.filter(function (s) { return s.planId === p.id; });
    h += perf(p, sess);
    if (rev) return h + decisionBox(rev.decision) + '<p class="small muted">رُوجعت في ' + App.fmtDT(rev.at) + ' (' + esc(rev.id) + '). المراجعات غير قابلة للتعديل للحفاظ على السجل.</p><button data-act="nextWeek" data-plan="' + esc(p.id) + '">إنشاء خطة الأسبوع التالي ←</button></div>';
    var sc = App.latest('screenings', t.id), qs = E.reviewQuestions(p, sess, t, sc), draft = App.ui.revDraft || {};
    var vis = qs.filter(function (q) { return !q.when || q.when(draft); });
    h += '<form data-form="review" data-plan="' + esc(p.id) + '"><p class="small">' + vis.length + ' سؤالاً لهذا الأسبوع: أسئلة السلامة إلزامية دائماً، وأسئلة التمارين تتغير حسب أداء هذا الأسبوع.</p>' + vis.map(function (q) { var v = q.id.indexOf('perEx.') === 0 ? ((draft.perEx || {})[q.ex] || {})[q.id.split('.')[2]] : draft[q.id]; return App.field(q, v, 'r_'); }).join('') +
      '<div id="revPreview">' + decisionBox(E.adapt(p, sess, { answers: draft }), true) + '</div><div id="revErr" role="alert"></div><button type="submit">حفظ المراجعة والقرار</button></form></div>';
    return h;
  };
  function readReview(f, qs) {
    var a = App.readForm(f, qs.map(function (q) { return Object.assign({}, q, { id: q.id }); }), 'r_'), out = { perEx: {} };
    Object.keys(a).forEach(function (k) { if (k.indexOf('perEx.') === 0) { var parts = k.split('.'); out.perEx[parts[1]] = out.perEx[parts[1]] || {}; if (a[k] !== undefined) out.perEx[parts[1]][parts[2]] = a[k]; } else if (a[k] !== undefined) out[k] = a[k]; });
    return out;
  }
  App.after.review = function () {
    var f = App.$('form[data-form=review]'); if (!f) return;
    f.addEventListener('change', function () { var p = planById(f.dataset.plan), t = App.trainee(), sess = App.db.sessions.filter(function (s) { return s.planId === p.id; }); App.ui.revDraft = readReview(f, E.reviewQuestions(p, sess, t, App.latest('screenings', t.id))); var y = window.scrollY; App.render(); window.scrollTo(0, y); });
  };
  function perf(p, sess) {
    var planned = p.days.filter(function (d) { return d.type === 'train'; }).length;
    var h = '<p>الحصص: ' + sess.filter(function (s) { return s.status === 'complete' && s.kind !== 'recovery'; }).length + ' مكتملة، ' + sess.filter(function (s) { return s.status === 'partial'; }).length + ' جزئية، من ' + planned + ' مخططة.' + (sess.some(function (s) { return s.redFlag; }) ? ' <span class="badge b-danger">علامة إنذار مسجلة</span>' : '') + '</p>';
    var dec = E.adapt(p, sess, null);
    var keys = Object.keys(dec.items);
    if (keys.length) h += '<div class="scroll"><table><thead><tr><th>التمرين</th><th>حصص بها بيانات</th><th>الإنجاز الفعلي</th><th>متوسط الجهد</th></tr></thead><tbody>' + keys.map(function (k) { var x = dec.items[k]; return '<tr><td>' + esc(App.exName(x.exId)) + '</td><td>' + x.sessions + '</td><td>' + (x.completion == null ? '—' : Math.round(x.completion * 100) + '%') + '</td><td>' + (x.effort == null ? '—' : x.effort.toFixed(1)) + '</td></tr>'; }).join('') + '</tbody></table></div>';
    return h;
  }
  function decisionBox(d, preview) {
    var cls = d.overall === 'refer' ? 'danger' : d.overall === 'progress' ? 'ok' : d.overall === 'maintain' ? '' : 'warn';
    var h = '<div class="alert ' + cls + '"><b>' + (preview ? 'معاينة القرار: ' : 'القرار: ') + esc(E.DECISION_AR[d.overall] || d.overall) + '</b>';
    if (d.reasons.length) h += '<ul>' + d.reasons.map(function (r) { return '<li>' + esc(r.text) + ' <span class="small muted">[' + esc((r.src || []).join('، ')) + ']</span></li>'; }).join('') + '</ul>';
    var it = Object.keys(d.items || {}); if (it.length) h += '<ul class="small">' + it.map(function (k) { var x = d.items[k]; return '<li><b>' + esc(App.exName(x.exId)) + '</b>: ' + esc(E.DECISION_AR[x.action] || x.action) + ' — ' + esc(x.why) + '</li>'; }).join('') + '</ul>';
    return h + '</div>';
  }
  App.forms.review = function (f) {
    var p = planById(f.dataset.plan), t = App.trainee(), sess = App.db.sessions.filter(function (s) { return s.planId === p.id; }), sc = App.latest('screenings', t.id);
    var qs = E.reviewQuestions(p, sess, t, sc), a = readReview(f, qs);
    var miss = qs.filter(function (q) { return q.must && (!q.when || q.when(a)) && a[q.id] === undefined; });
    if (miss.length) { App.$('#revErr').innerHTML = '<div class="alert danger">أسئلة السلامة إلزامية (' + miss.length + ')</div>'; return; }
    var dec = E.adapt(p, sess, { answers: a }); dec.at = S.nowISO();
    var rec = { id: S.uniqueId(App.db, 'reviews'), traineeId: t.id, planId: p.id, at: dec.at, version: E.RULES, questions: qs.filter(function (q) { return !q.when || q.when(a); }).map(function (q) { return { id: q.id, text: q.text }; }), answers: a, decision: dec };
    App.db.reviews.push(rec); p.status = 'reviewed'; App.audit('review', 'مراجعة ' + p.id + ' ⇒ ' + dec.overall, t.id, rec.id); App.ui.revDraft = null; App.ui.revPlan = p.id; App.save(); App.render();
  };
  App.acts.nextWeek = function (el) { var p = planById(el.dataset.plan); App.ui.weekStart = E.addDays(p.weekStart, 7); App.ui.planId = null; App.go('plan'); };
  App.acts.revFind = function () {
    var raw = App.$('#revLookup').value, id = S.normalizeId(raw); App.ui.revLookup = raw;
    var out = App.$('#revFindOut');
    if (!S.idValid(id)) { out.innerHTML = '<div class="alert warn">صيغة الرقم غير صحيحة أو حرف التحقق لا يطابق (تحقق من الأخطاء المطبعية).</div>'; return; }
    var p = planById(id); if (!p) { out.innerHTML = '<div class="alert warn">الرقم صحيح الصيغة لكنه غير موجود في البيانات المحلية لهذا الجهاز. استورد ملف JSON من الجهاز الآخر — ملف PDF وحده لا يكفي.</div>'; return; }
    App.ui.traineeId = p.traineeId; App.ui.revPlan = p.id; App.render();
  };

  /* ---------- history ---------- */
  App.pages.history = function () {
    var t = App.trainee(), h = '<h2>السجل والتقدم</h2>';
    h += '<div class="card flat"><div class="row"><label class="grow">بحث برقم خطة أو معرف متدرب أو معرف داخلي<input id="histQ" dir="ltr" value="' + esc(App.ui.histQ || '') + '"></label><button class="sec" data-act="histFind">بحث</button></div><div id="histOut"></div></div>';
    if (!t) return h + App.needTrainee('السجل');
    var pls = App.plansOf(t.id);
    var rows = pls.map(function (p) { var ss = App.db.sessions.filter(function (s) { return s.planId === p.id; }); var planned = p.days.filter(function (d) { return d.type === 'train'; }).length; var done = ss.filter(function (s) { return s.status === 'complete' && s.kind !== 'recovery'; }).length; var rv = App.db.reviews.filter(function (r) { return r.planId === p.id; }).pop(); var load = ss.reduce(function (x, s) { return x + (s.load || 0); }, 0); return { p: p, planned: planned, done: done, rv: rv, load: load }; });
    h += '<div class="card"><h3>' + esc(t.displayName) + ' <span class="small muted">' + esc(t.id) + '</span></h3>' + chart(rows) + '<div class="scroll"><table><thead><tr><th>الأسبوع</th><th>رقم الخطة</th><th>الحالة</th><th>حصص</th><th>حمل الأسبوع</th><th>القرار</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td>' + App.fmtDate(r.p.weekStart) + '</td><td class="small"><button class="ghost" data-act="openPlan" data-id="' + esc(r.p.id) + '" style="min-height:0;padding:2px 6px">' + esc(r.p.id) + '</button></td><td>' + esc({ active: 'نشطة', reviewed: 'رُوجعت', blocked: 'موقوفة' }[r.p.status] || r.p.status) + '</td><td>' + r.done + '/' + r.planned + '</td><td>' + (r.load || '—') + '</td><td>' + (r.rv ? esc(E.DECISION_AR[r.rv.decision.overall]) : '—') + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
    var ev = [];
    ['screenings', 'baselines', 'sessions', 'reviews'].forEach(function (c) { App.db[c].filter(function (r) { return r.traineeId === t.id; }).forEach(function (r) { ev.push({ at: r.at || r.startedAt, c: c, r: r }); }); });
    App.db.audit.filter(function (a) { return a.traineeId === t.id && /override|regenerate|clearance|redflag/.test(a.type); }).forEach(function (a) { ev.push({ at: a.at, c: 'audit', r: a }); });
    ev.sort(function (a, b) { return a.at < b.at ? 1 : -1; });
    var lab = { screenings: '🩺 فحص', baselines: '📏 تقييم أساسي', sessions: '⏱ حصة', reviews: '✅ مراجعة', audit: '📝 سجل' };
    h += '<div class="card"><h3>الخط الزمني</h3><table><tbody>' + ev.slice(0, 200).map(function (e) { var r = e.r; var d = e.c === 'screenings' ? App.statusBadge(r.outcome.status) : e.c === 'sessions' ? esc(r.status) + (r.redFlag ? ' ⛔' : '') : e.c === 'reviews' ? esc(E.DECISION_AR[r.decision.overall]) : e.c === 'baselines' ? esc(JSON.stringify(r.result.levels)) : esc(r.msg); return '<tr><td class="small">' + App.fmtDT(e.at) + '</td><td>' + lab[e.c] + '</td><td class="small">' + esc(r.id) + '</td><td>' + d + '</td></tr>'; }).join('') + '</tbody></table></div>';
    var lg = App.db.legacy && App.db.legacy.v4 && t.legacyV4 ? (App.db.legacy.v4.plans || []).filter(function (p) { return p.pid === t.legacyV4.id; }) : [];
    if (lg.length) h += '<details class="card"><summary>خطط v4 القديمة (للقراءة فقط): ' + lg.length + '</summary><ul>' + lg.map(function (p) { return '<li>' + esc(p.serial) + ' · ' + esc(String(p.created || '').slice(0, 10)) + ' · ' + ((p.items || []).length) + ' تمارين' + (p.blocked ? ' (موقوفة)' : '') + '</li>'; }).join('') + '</ul></details>';
    return h;
  };
  function chart(rows) {
    if (rows.length < 1) return '';
    var W = 600, H = 160, n = rows.length, bw = Math.min(50, (W - 40) / n - 6);
    var maxLoad = Math.max.apply(null, rows.map(function (r) { return r.load; }).concat([1]));
    var bars = rows.map(function (r, i) { var x = 30 + i * ((W - 40) / n), pct = r.planned ? r.done / r.planned : 0, bh = pct * (H - 40); return '<rect x="' + x + '" y="' + (H - 20 - bh) + '" width="' + bw + '" height="' + bh + '" fill="var(--acc2)" rx="3"><title>' + esc(r.p.weekStart) + ': ' + Math.round(pct * 100) + '%</title></rect><text x="' + (x + bw / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(r.p.weekStart.slice(5)) + '</text>'; }).join('');
    var line = rows.map(function (r, i) { var x = 30 + i * ((W - 40) / n) + bw / 2, y = H - 20 - (r.load / maxLoad) * (H - 40); return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1); }).join('');
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="نسبة الحصص المكتملة أسبوعياً (أعمدة) وحمل الأسبوع (خط)"><line x1="28" y1="' + (H - 20) + '" x2="' + W + '" y2="' + (H - 20) + '" stroke="var(--line)"/><text x="2" y="24">100%</text>' + bars + '<path d="' + line + '" fill="none" stroke="var(--acc)" stroke-width="2"/></svg><p class="small muted">الأعمدة: نسبة الحصص المكتملة من المخطط. الخط: حمل الأسبوع (جهد × دقائق). الرسم يمتد لأي عدد أسابيع دون إنشاء خطط شهرية أو سنوية.</p>';
  }
  App.acts.openPlan = function (el) { App.ui.planId = el.dataset.id; App.go('plan'); };
  App.acts.histFind = function () {
    var raw = App.$('#histQ').value.trim(), id = S.normalizeId(raw), out = App.$('#histOut'); App.ui.histQ = raw;
    var p = planById(id); if (p) { App.ui.traineeId = p.traineeId; App.ui.planId = p.id; return App.go('plan'); }
    var t = App.db.trainees.filter(function (x) { return x.id === id || (x.internalId && x.internalId.toLowerCase() === raw.toLowerCase()); })[0];
    if (t) { App.ui.traineeId = t.id; return App.render(); }
    out.innerHTML = '<div class="alert warn">لا يوجد سجل محلي مطابق. ' + (S.idValid(id) ? 'المعرف صحيح الصيغة لكنه ليس على هذا الجهاز — استورد JSON.' : 'تحقق من الصيغة.') + '</div>';
  };
})();
