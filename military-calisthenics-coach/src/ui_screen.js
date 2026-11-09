/* Screening wizard (branching), outcome + documented clearance, sub-maximal baseline assessment. */
(function () {
  'use strict';
  var App = window.App, S = window.MCStore, E = window.MCEngine, X = window.MCEX, SC = window.MCScreen, esc = App.esc;

  App.pages.screen = function () {
    var t = App.trainee(); if (!t) return '<h2>الفحص والتقييم</h2>' + App.needTrainee('الفحص');
    var ui = App.ui, sc = App.latest('screenings', t.id), bl = App.latest('baselines', t.id);
    var h = '<h2>الفحص الصحي والتقييم الأساسي — ' + esc(t.displayName) + '</h2>';
    if (!t.consent) return h + '<div class="alert warn"><b>إقرار الخصوصية غير مسجل</b>سجّله من ملف المتدرب قبل الفحص. <button class="sec" data-act="tEdit" data-id="' + esc(t.id) + '">تعديل الملف</button></div>';
    h += '<div class="stepper"><span class="' + (sc ? 'done' : 'on') + '">1 الفحص الصحي</span><span class="' + (sc && sc.outcome.status === 'cleared' ? (bl && bl.at > sc.at ? 'done' : 'on') : '') + '">2 التقييم الأساسي</span><span>3 الخطة الأسبوعية</span></div>';
    if (ui.screenMode === 'form' || !sc) return h + screeningForm(t, ui.draft || (sc ? {} : {}));
    if (ui.screenMode === 'baseline') return h + baselineForm(t, sc);
    h += outcomeCard(sc, t);
    h += '<div class="row"><button class="sec" data-act="scNew">فحص جديد (عند تغيّر الحالة الصحية أو كل 12 شهراً)</button>' + (sc.outcome.status === 'cleared' ? '<button data-act="blStart">' + (bl ? 'إعادة التقييم الأساسي' : 'بدء التقييم الأساسي') + '</button>' : '') + '</div>';
    if (bl) h += baselineCard(bl);
    if (bl && sc.outcome.status === 'cleared' && bl.result.status !== 'refer') h += '<div class="row" style="margin-top:12px"><button class="ok" data-act="go" data-page="plan">الانتقال إلى الخطة الأسبوعية ←</button></div>';
    var hist = App.db.screenings.filter(function (s) { return s.traineeId === t.id; });
    if (hist.length > 1) h += '<details class="card"><summary>سجل الفحوص (' + hist.length + ')</summary><table><tbody>' + hist.map(function (s) { return '<tr><td>' + App.fmtDT(s.at) + '</td><td>' + esc(s.id) + '</td><td>' + App.statusBadge(s.outcome.status) + '</td><td class="small">' + esc(s.version) + '</td></tr>'; }).join('') + '</tbody></table></details>';
    return h;
  };

  function screeningForm(t, draft) {
    var qs = SC.visible(draft, t), sec = '';
    var h = '<form class="card" data-form="screen" novalidate><div class="alert small"><b>تنبيه</b>هذه أسئلة فحص بصياغة خاصة بالتطبيق، مستوحاة من محاور PAR-Q+ ومنطق ACSM (2015) وإرشادات ACOG (2020)، وليست استمارة PAR-Q+ الرسمية ولا ترجمة معتمدة لها. الإجابات تُسجل كما هي مع رقم الإصدار ' + esc(SC.VERSION) + '. الفحص ليس تشخيصاً.</div>';
    qs.forEach(function (q) { if (q.sec !== sec) { sec = q.sec; h += '<h3>' + esc(sec) + '</h3>'; } h += App.field(q, draft[q.id], 'q_') + (q.topic ? '<div class="small muted">المحور: ' + esc(q.topic) + '</div>' : ''); });
    h += '<div id="scErr" role="alert"></div><div class="row"><button type="submit">حفظ الفحص وحساب النتيجة</button>' + (App.latest('screenings', t.id) ? '<button type="button" class="sec" data-act="scCancel">إلغاء</button>' : '') + '</div></form>';
    return h;
  }
  App.after.screen = function () {
    var f = App.$('form[data-form=screen]'); if (!f) return;
    f.addEventListener('change', function () { /* re-render to show/hide conditional branches, keeping answers */
      App.ui.draft = App.readForm(f, SC.QUESTIONS, 'q_'); var y = window.scrollY; App.render(); window.scrollTo(0, y);
    });
  };
  App.acts.scNew = function () { App.ui.screenMode = 'form'; App.ui.draft = {}; App.render(); };
  App.acts.scCancel = function () { App.ui.screenMode = null; App.ui.draft = null; App.render(); };
  App.forms.screen = function (f) {
    var t = App.trainee(), ans = App.readForm(f, SC.QUESTIONS, 'q_');
    Object.keys(ans).forEach(function (k) { if (ans[k] === undefined) delete ans[k]; });
    var vis = SC.visible(ans, t).map(function (q) { return q.id; });
    Object.keys(ans).forEach(function (k) { if (vis.indexOf(k) < 0) delete ans[k]; }); /* drop answers of hidden branches */
    var miss = SC.missing(ans, t);
    if (miss.length) { App.$('#scErr').innerHTML = '<div class="alert danger"><b>أجب عن كل الأسئلة الظاهرة (' + miss.length + ' متبقية)</b>يمكن اختيار "غير متأكد" — وسيُعامل كحاجة لمعلومات إضافية.</div>'; var el = App.$('[name="q_' + miss[0] + '"]'); if (el) el.focus(); return; }
    var prior = App.latest('screenings', t.id);
    var rec = { id: S.uniqueId(App.db, 'screenings'), traineeId: t.id, at: S.nowISO(), version: SC.VERSION, answers: ans, shown: vis, ageAtScreening: t.age, sexAtScreening: t.sex || '', priorId: prior ? prior.id : null, clearance: null };
    rec.outcome = SC.evaluate(ans, { trainee: t, prior: prior, clearance: null });
    App.db.screenings.push(rec); App.audit('screening', 'فحص ' + rec.id + ' ⇒ ' + rec.outcome.status, t.id, rec.id); App.save();
    App.ui.screenMode = null; App.ui.draft = null; App.render();
  };

  function outcomeCard(sc, t) {
    var o = sc.outcome, cls = o.status === 'cleared' ? 'ok' : o.status === 'refer' ? 'danger' : 'warn';
    var h = '<div class="card"><div class="row"><h3 class="grow">نتيجة الفحص ' + esc(sc.id) + '</h3>' + App.statusBadge(o.status) + '</div><p class="small muted">' + App.fmtDT(sc.at) + ' · ' + esc(sc.version) + ' · المسار: ' + esc({ general: 'عام', pregnancy: 'الحمل', postpartum: 'ما بعد الولادة' }[o.pathway]) + '</p>';
    h += '<div class="alert ' + cls + '"><b>' + esc({ cleared: 'cleared-for-conservative-program — مسموح ببرنامج تحفظي تدريجي', more_info: 'needs-more-information — تحتاج معلومات أو تصريحاً موثقاً قبل أي خطة', refer: 'do-not-auto-prescribe / refer — لا تُصدر خطة تلقائية؛ إحالة لمختص' }[o.status]) + '</b><ul>' + o.reasons.map(function (r) { return '<li>' + esc(r.text) + ' <span class="small muted">[' + esc(r.src.join('، ')) + ']</span></li>'; }).join('') + '</ul></div>';
    if (o.referrals.length) h += '<div class="alert danger"><b>الإحالات المقترحة</b>' + o.referrals.map(esc).join('<br>') + '<br>رقم الطوارئ المحلي: ' + esc(App.db.settings.emergencyNumber || '—') + '</div>';
    if (o.exclusions.flags.length || o.exclusions.maxLevel < 3) h += '<p><b>استبعادات تلقائية:</b> ' + o.exclusions.flags.map(function (f) { return '<span class="pill">' + esc(X.FLAG[f] || f) + '</span>'; }).join('') + (o.exclusions.maxLevel < 3 ? ' <span class="pill">أعلى مستوى: ' + esc(X.LEVEL[o.exclusions.maxLevel]) + '</span>' : '') + '</p>';
    if (sc.clearance) h += '<div class="alert ok"><b>تصريح موثق</b>' + esc(sc.clearance.by) + ' — ' + esc(sc.clearance.date) + (sc.clearance.limits ? '<br>القيود: ' + esc(sc.clearance.limits) : '') + '</div>';
    if (o.status === 'more_info' && !o.reasons.some(function (r) { return r.code === 'incomplete' || r.code === 'age_missing'; })) {
      h += '<form data-form="clearance" class="card flat"><h4>توثيق تصريح مختص</h4><p class="small">يُستخدم فقط إذا راجع المتدرب مختصاً مؤهلاً (طبيب، أخصائي علاج طبيعي، مقدم رعاية الحمل) وأقرّ النشاط. لا يزيل التصريح حالات "الإحالة" الناتجة عن أعراض إنذار حالية.</p><div class="grid"><label>اسم/صفة المختص *<input name="by" maxlength="120" required></label><label>تاريخ التصريح *<input name="date" type="date" required max="' + App.today() + '"></label></div><label>القيود أو التمارين المطلوب تجنبها<textarea name="limits" rows="2" maxlength="600"></textarea></label><label><input type="checkbox" name="confirm"> أؤكد أن التصريح موثق خارج التطبيق (ورقي/رسمي) ورأيته</label><button type="submit">حفظ التصريح وإعادة حساب النتيجة</button></form>';
    }
    if (o.status === 'refer') h += '<p class="small">لا يوجد زر تجاوز. بعد التقييم المختص وزوال الأعراض، أجرِ فحصاً جديداً ثم وثّق التصريح.</p>';
    return h + '</div>';
  }
  App.forms.clearance = function (f) {
    var fd = new FormData(f), t = App.trainee(), sc = App.latest('screenings', t.id);
    var by = String(fd.get('by') || '').trim(), date = String(fd.get('date') || '');
    if (!by || !date || !fd.get('confirm')) { App.toast('أكمل اسم المختص والتاريخ والتأكيد'); return; }
    sc.clearance = { by: by.slice(0, 120), date: date, limits: String(fd.get('limits') || '').slice(0, 600), recordedAt: S.nowISO() };
    var prior = App.db.screenings.filter(function (s) { return s.id === sc.priorId; })[0] || null;
    var before = sc.outcome.status;
    sc.outcome = SC.evaluate(sc.answers, { trainee: { age: sc.ageAtScreening, sex: sc.sexAtScreening }, prior: prior, clearance: sc.clearance });
    App.audit('screening.clearance', 'تصريح ' + by + ' على ' + sc.id + ': ' + before + ' ⇒ ' + sc.outcome.status, t.id, sc.id); App.save(); App.render();
  };

  /* ---------- baseline ---------- */
  App.acts.blStart = function () { App.ui.screenMode = 'baseline'; App.render(); };
  App.acts.blCancel = function () { App.ui.screenMode = null; App.render(); };
  function baselineForm(t, sc) {
    var ctx = E.safetyContext(t, sc, null, []);
    var h = '<form class="card" data-form="baseline" novalidate><h3>التقييم الأساسي للقدرات (' + esc(E.BASELINE_VERSION) + ')</h3><div class="alert warn small"><b>ليس اختباراً أقصى</b>توقف عند انكسار التقنية، أو جهد 7 من 10، أو الحد الأعلى، أو أي ألم/عرض. إحماء 5 دقائق قبل البدء. التمارين المستبعدة بالفحص تظهر معطلة.</div>';
    E.TESTS.forEach(function (T) {
      var opts = T.variants.map(function (id) { var ex = X.byId(id); if (!ex) return ''; var why = E.excludedBy(ex, ctx, { ignoreLevel: true }); return '<option value="' + id + '"' + (why ? ' disabled' : '') + '>' + esc(ex.ar) + (why ? ' — ' + esc(why) : '') + '</option>'; }).join('');
      var unit = T.u === 'reps' ? 'تكرارات صحيحة' : T.u === 'time' ? 'ثوانٍ' : 'دقائق';
      h += '<fieldset><legend>' + esc(T.ar) + (T.optional ? ' (اختياري)' : '') + '</legend><p class="small muted">' + esc(T.hint) + '</p><div class="grid">' +
        '<label>النسخة<select name="' + T.id + '_variant"><option value="">— لم يُجرَ —</option>' + opts + '</select></label>' +
        '<label>النتيجة (' + unit + '، حد ' + T.cap + ')<input type="number" name="' + T.id + '_value" min="0" max="' + T.cap + '"></label>' +
        '<label>التقنية<select name="' + T.id + '_technique"><option value="good">جيدة</option><option value="fair">متوسطة</option><option value="poor">ضعيفة</option></select></label>' +
        '<label>الجهد عند التوقف (0–10)<input type="number" name="' + T.id + '_effort" min="0" max="10"></label>' +
        '<label>ألم أثناء الاختبار (0–10)<input type="number" name="' + T.id + '_pain" min="0" max="10" value="0"></label>' +
        '<label>منطقة الألم<select name="' + T.id + '_painArea"><option value="">—</option>' + SC.AREAS.map(function (a) { return '<option value="' + a[0] + '">' + a[1] + '</option>'; }).join('') + '</select></label>' +
        '<label>عرض إنذار؟<select name="' + T.id + '_symptom"><option value="no">لا</option><option value="yes">نعم (ألم صدر/دوخة/ضيق نفس غير معتاد)</option></select></label>' +
        (T.id === 'aerobic' ? '<label>اختبار الكلام<select name="aerobic_talk"><option value="yes">يستطيع الكلام بجمل كاملة</option><option value="no">لا يستطيع</option></select></label>' : '') + '</div></fieldset>';
    });
    return h + '<div id="blErr" role="alert"></div><div class="row"><button type="submit">حفظ التقييم وحساب المستويات</button><button type="button" class="sec" data-act="blCancel">إلغاء</button></div></form>';
  }
  App.forms.baseline = function (f) {
    var t = App.trainee(), sc = App.latest('screenings', t.id), fd = new FormData(f), tests = {}, errs = [];
    if (!sc || sc.outcome.status !== 'cleared') { App.toast('الفحص الصحي لا يسمح بالتقييم'); return; }
    E.TESTS.forEach(function (T) {
      var v = String(fd.get(T.id + '_variant') || '');
      if (!v) { tests[T.id] = { skipped: true }; if (!T.optional && T.id !== 'balance') errs.push('اختبار ' + T.ar + ' لم يُجرَ — سيُعتمد المستوى 1'); return; }
      var val = Number(fd.get(T.id + '_value')); if (!(val >= 0 && val <= T.cap)) { errs.push('نتيجة ' + T.ar + ' خارج النطاق 0–' + T.cap); }
      tests[T.id] = { variant: v, value: Math.max(0, Math.min(T.cap, val || 0)), technique: String(fd.get(T.id + '_technique')), effort: fd.get(T.id + '_effort') === '' ? null : Number(fd.get(T.id + '_effort')), pain: Number(fd.get(T.id + '_pain')) || 0, painArea: String(fd.get(T.id + '_painArea') || ''), symptom: String(fd.get(T.id + '_symptom')), talk: T.id === 'aerobic' ? String(fd.get('aerobic_talk')) : undefined };
    });
    var hard = errs.filter(function (e) { return e.indexOf('خارج') >= 0; });
    if (hard.length) { App.$('#blErr').innerHTML = '<div class="alert danger">' + hard.map(esc).join('<br>') + '</div>'; return; }
    var res = E.evaluateBaseline(tests, t);
    var rec = { id: S.uniqueId(App.db, 'baselines'), traineeId: t.id, at: S.nowISO(), version: E.BASELINE_VERSION, screeningId: sc.id, tests: tests, result: res, notes: errs };
    App.db.baselines.push(rec); App.audit('baseline', 'تقييم أساسي ' + rec.id + ' ⇒ ' + JSON.stringify(res.levels), t.id, rec.id); App.save();
    App.ui.screenMode = null; App.render();
  };
  function baselineCard(bl) {
    var r = bl.result, h = '<div class="card"><div class="row"><h3 class="grow">التقييم الأساسي ' + esc(bl.id) + '</h3><span class="badge ' + (r.status === 'ok' ? 'b-ok' : r.status === 'refer' ? 'b-danger' : 'b-warn') + '">' + esc({ ok: 'مكتمل', caution: 'مع تحفظات', refer: 'إحالة' }[r.status]) + '</span></div><p class="small muted">' + App.fmtDT(bl.at) + ' · ' + esc(bl.version) + '</p>';
    if (r.messages.length) h += '<div class="alert ' + (r.status === 'refer' ? 'danger' : 'warn') + '">' + r.messages.map(esc).join('<br>') + '</div>';
    h += '<table><thead><tr><th>الاختبار</th><th>النسخة</th><th>النتيجة</th><th>المستوى المحسوب</th><th>ملاحظة القاعدة</th></tr></thead><tbody>';
    E.TESTS.forEach(function (T) { var x = bl.tests[T.id] || {}; h += '<tr><td>' + esc(T.ar) + '</td><td>' + (x.skipped ? '—' : esc(App.exName(x.variant))) + '</td><td>' + (x.skipped ? 'لم يُجرَ' : esc(x.value) + ' ' + (T.u === 'reps' ? 'تكرار' : T.u === 'time' ? 'ث' : 'د')) + '</td><td><b>' + esc(X.LEVEL[r.levels[T.id]]) + '</b></td><td class="small">' + esc(r.notes[T.id] || '') + '</td></tr>'; });
    return h + '</tbody></table></div>';
  }
})();
