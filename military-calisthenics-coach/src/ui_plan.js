/* Weekly plan: generation, explanation, safe coach overrides, revisions, A4 print. WEEKLY ONLY. */
(function () {
  'use strict';
  var App = window.App, S = window.MCStore, E = window.MCEngine, X = window.MCEX, esc = App.esc;

  function nextWeekStart(t) {
    var pls = App.plansOf(t.id), last = pls[pls.length - 1];
    if (last) return E.addDays(last.weekStart, 7);
    var d = new Date(App.today() + 'T12:00:00Z'), wd = App.db.settings.weekStartDay || 0;
    var diff = (wd - d.getUTCDay() + 7) % 7; d.setUTCDate(d.getUTCDate() + diff); return d.toISOString().slice(0, 10);
  }
  App.dosageText = function (it) { var ex = X.byId(it.exId); return it.sets + ' × ' + (it.u === 'reps' ? it.target + ' تكرار' : it.target >= 120 ? Math.round(it.target / 60) + ' دقيقة' : it.target + ' ث') + (it.side ? ' لكل جانب' : '') + (it.rest ? ' · راحة ' + it.rest + ' ث' : '') + (ex && ex.dose.tempo && it.u === 'reps' ? ' · إيقاع ' + ex.dose.tempo : ''); };

  App.pages.plan = function () {
    var t = App.trainee(); if (!t) return '<h2>الخطة الأسبوعية</h2>' + App.needTrainee('الخطة');
    var pls = App.plansOf(t.id), ui = App.ui;
    var cur = (ui.planId && pls.filter(function (p) { return p.id === ui.planId; })[0]) || pls[pls.length - 1];
    var h = '<div class="row"><h2 class="grow">الخطة الأسبوعية — ' + esc(t.displayName) + '</h2></div>';
    h += '<div class="alert small"><b>الخطط أسبوعية فقط (7 أيام)</b>لكل أسبوع معرف خطة فريد؛ إعادة التوليد لنفس الأسبوع تُنشئ نسخة مراجَعة داخل الخطة نفسها مع سبب، ولا تحذف التاريخ.</div>';
    var last = pls[pls.length - 1], unreviewed = last && last.status !== 'blocked' && !App.db.reviews.some(function (r) { return r.planId === last.id; });
    var ws = nextWeekStart(t);
    h += '<div class="card flat"><div class="row"><label>بداية الأسبوع الجديد<input type="date" id="weekStart" value="' + esc(ui.weekStart || ws) + '"></label><button data-act="genPlan"' + (unreviewed ? ' disabled' : '') + '>إنشاء خطة الأسبوع</button>' +
      (pls.length ? '<label>عرض خطة<select id="planPick">' + pls.map(function (p) { return '<option value="' + esc(p.id) + '"' + (cur && p.id === cur.id ? ' selected' : '') + '>' + esc(App.fmtDate(p.weekStart)) + ' · ' + esc(p.id) + (p.status === 'blocked' ? ' (موقوفة)' : '') + '</option>'; }).join('') + '</select></label>' : '') + '</div>' +
      (unreviewed ? '<p class="small">لا يمكن إنشاء أسبوع جديد قبل <button class="sec" data-act="go" data-page="review">مراجعة الخطة ' + esc(last.id) + '</button> — المراجعة تستخدم الأداء الفعلي لتعديل الأسبوع التالي.</p>' : '') + '</div>';
    if (!cur) return h + '<div class="empty">لا توجد خطط بعد لهذا المتدرب.</div>';
    return h + planView(cur, t);
  };
  App.changes.planPick = function (el) { App.ui.planId = el.value; App.render(); };
  App.changes.weekStart = function (el) { App.ui.weekStart = el.value; };

  App.acts.genPlan = function () {
    var t = App.trainee(), ws = App.ui.weekStart || App.$('#weekStart').value;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ws)) { App.toast('تاريخ غير صالح'); return; }
    var existing = App.db.plans.filter(function (p) { return p.traineeId === t.id && p.weekStart === ws; })[0];
    var pls = App.plansOf(t.id).filter(function (p) { return p.weekStart < ws; }), prev = pls[pls.length - 1] || null;
    var rev = prev ? App.db.reviews.filter(function (r) { return r.planId === prev.id; }).pop() : null;
    var sc = App.latest('screenings', t.id), bl = App.latest('baselines', t.id);
    var input = { trainee: t, screening: sc, baseline: bl, prevPlan: prev, decision: rev ? Object.assign({ reviewId: rev.id, at: rev.at }, rev.decision) : null, weekStart: ws, planId: existing ? existing.id : S.uniqueId(App.db, 'plans', S.isoWeek(ws)), requireFreshBaseline: true };
    var plan = E.generatePlan(input);
    plan.decision = input.decision;
    if (existing) {
      if (App.db.sessions.some(function (s) { return s.planId === existing.id; }) && !confirm('توجد حصص مسجلة على هذه الخطة. إعادة التوليد ستنشئ نسخة جديدة مع الاحتفاظ بالقديمة في سجل النسخ. متابعة؟')) return;
      var reason = prompt('سبب إعادة توليد خطة الأسبوع نفسه (مطلوب):'); if (!reason || reason.trim().length < 5) { App.toast('السبب مطلوب'); return; }
      existing.revisions = existing.revisions || [];
      existing.revisions.push({ at: S.nowISO(), reason: 'إعادة توليد: ' + reason.trim(), ruleVersion: existing.ruleVersion, days: existing.days, status: existing.status, notes: existing.notes, blockers: existing.blockers });
      ['days', 'status', 'blockers', 'notes', 'ruleVersion', 'screeningId', 'baselineId', 'prevPlanId', 'pathway', 'decision', 'tempFlagsIn', 'traineeName', 'coachName'].forEach(function (k) { existing[k] = plan[k]; });
      existing.updatedAt = S.nowISO();
      App.audit('plan.regenerate', 'إعادة توليد ' + existing.id + ': ' + reason, t.id, existing.id); App.ui.planId = existing.id;
    } else {
      App.db.plans.push(plan); App.audit('plan.create', 'خطة ' + plan.id + ' (' + plan.status + ')', t.id, plan.id); App.ui.planId = plan.id;
    }
    App.ui.weekStart = null; App.save(); App.render();
  };

  function planView(p, t) {
    var h = '<div class="card"><div class="row"><div class="grow"><h3>' + esc(p.id) + '</h3><div class="small muted">الأسبوع ' + App.fmtDate(p.weekStart) + ' ← ' + App.fmtDate(p.weekEnd) + ' · أُنشئت ' + App.fmtDT(p.createdAt) + ' · ' + esc(p.ruleVersion) + (p.revisions && p.revisions.length ? ' · نسخ سابقة: ' + p.revisions.length : '') + '</div></div>' +
      (p.status === 'blocked' ? '<span class="badge b-danger">⛔ موقوفة</span>' : '<span class="badge b-ok">جاهزة</span>') + '<button class="sec" data-act="printPlan" data-id="' + esc(p.id) + '">🖨 طباعة / حفظ PDF</button></div>';
    if (p.status === 'blocked') return h + '<div class="alert danger"><b>لم تُصدر خطة تمارين تلقائية</b><ul>' + p.blockers.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>المسموح: النشاط اليومي العادي الخفيف فقط حتى التقييم. هذه ليست تشخيصاً.</div><button class="sec" data-act="go" data-page="screen">الذهاب إلى الفحص</button></div>';
    if (p.decision) h += '<div class="alert ' + (p.decision.overall === 'progress' ? 'ok' : p.decision.overall === 'maintain' ? '' : 'warn') + '"><b>قرار مراجعة الأسبوع السابق: ' + esc(E.DECISION_AR[p.decision.overall] || p.decision.overall) + '</b>' + (p.decision.reasons || []).map(function (r) { return esc(r.text); }).join('<br>') + '</div>';
    h += '<details><summary><b>لماذا هذه الخطة؟</b> (قواعد ' + esc(p.ruleVersion) + ')</summary><ul class="small">' + p.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></details>';
    var trainMin = p.days.reduce(function (s, d) { return s + (d.type !== 'rest' ? d.estMinutes || 0 : 0); }, 0);
    h += '<p class="small">مجموع الدقائق المقدّرة هذا الأسبوع: ' + trainMin + ' دقيقة. التوصية العامة للبالغين 150–300 دقيقة نشاطاً متوسطاً أسبوعياً من كل الأنشطة، وليس من هذه الخطة وحدها. [PAG2018]</p></div>';
    p.days.forEach(function (d) {
      var ses = App.db.sessions.filter(function (s) { return s.planId === p.id && s.dayIndex === d.index; });
      var stat = ses.some(function (s) { return s.status === 'complete'; }) ? '<span class="badge b-ok">مكتملة</span>' : ses.length ? '<span class="badge b-warn">جزئية</span>' : '';
      h += '<details class="day"' + (d.type === 'train' ? ' open' : '') + '><summary><b>' + esc(d.dowAr) + '</b> <span class="muted">' + App.fmtDate(d.date) + '</span> <span class="pill">' + esc({ train: 'تدريب ' + (d.template || ''), recovery: 'استشفاء نشط', rest: 'راحة' }[d.type]) + '</span>' + (d.estMinutes ? '<span class="pill">≈ ' + d.estMinutes + ' د</span>' : '') + stat + '</summary><div class="inner">';
      if (d.type === 'rest') h += '<p class="muted">راحة تامة أو نشاط يومي خفيف. نم جيداً واشرب الماء.</p>';
      if (d.type !== 'rest') {
        if (d.warmup && d.warmup.length) h += '<h4>الإحماء (5–8 دقائق)</h4>' + d.warmup.map(function (it) { return mini(it); }).join('');
        if (d.recovery && d.recovery.length) h += '<h4>نشاط الاستشفاء</h4>' + d.recovery.map(function (it) { return mini(it); }).join('');
        if (d.main && d.main.length) { h += '<h4>التمارين الرئيسية</h4>'; d.main.forEach(function (it, j) { h += itemRow(p, d, it, j); }); }
        if (d.cooldown && d.cooldown.length) h += '<h4>التهدئة (5 دقائق)</h4>' + d.cooldown.map(function (it) { return mini(it); }).join('');
        h += '<div class="row"><button class="ok" data-act="startSession" data-plan="' + esc(p.id) + '" data-day="' + d.index + '">▶ بدء الحصة المباشرة</button></div>';
      }
      h += '</div></details>';
    });
    if (p.overrides && p.overrides.length) h += '<details class="card"><summary>تعديلات المدرب (' + p.overrides.length + ')</summary><table><tbody>' + p.overrides.map(function (o) { return '<tr><td>' + App.fmtDT(o.at) + '</td><td>' + esc(App.exName(o.from.exId)) + ' ' + o.from.sets + '×' + o.from.target + ' ← ' + esc(App.exName(o.to.exId)) + ' ' + o.to.sets + '×' + o.to.target + '</td><td>' + esc(o.reason) + '</td></tr>'; }).join('') + '</tbody></table></details>';
    if (p.revisions && p.revisions.length) h += '<details class="card"><summary>النسخ السابقة لهذه الخطة (' + p.revisions.length + ')</summary><ul>' + p.revisions.map(function (r) { return '<li>' + App.fmtDT(r.at) + ' — ' + esc(r.reason) + ' (' + esc(r.ruleVersion) + ')</li>'; }).join('') + '</ul></details>';
    return h + overrideDialog();
  }
  function mini(it) { return '<div class="row small" style="border-bottom:1px dashed var(--line);padding:4px 0"><button class="ghost" data-act="exOpen" data-id="' + esc(it.exId) + '" style="min-height:0;padding:2px 8px">' + esc(App.exName(it.exId)) + '</button><span class="muted">' + esc(App.dosageText(it)) + '</span></div>'; }
  function itemRow(p, d, it, j) {
    return '<div class="item"><div class="thumb">' + App.thumb(it.exId) + '</div><div><b>' + esc(App.exName(it.exId)) + '</b> <span class="pill">' + esc(it.slot) + '</span>' + (it.override ? '<span class="pill">معدّل يدوياً</span>' : '') + '<div>' + esc(App.dosageText(it)) + ' <span class="small muted">(خطوة جرعة ' + it.step + '/4)</span></div><div class="why">' + it.why.map(esc).join(' · ') + '</div></div>' +
      '<div class="act row"><button class="sec" data-act="exOpen" data-id="' + esc(it.exId) + '">الشرح والرسم</button><button class="ghost" data-act="ovOpen" data-plan="' + esc(p.id) + '" data-day="' + d.index + '" data-item="' + j + '">تعديل آمن</button></div></div>';
  }

  /* ---------- safe override ---------- */
  function overrideDialog() { return '<dialog id="ovDlg" aria-labelledby="ovTitle"><div class="dlg-head"><h3 id="ovTitle">تعديل المدرب ضمن الحدود الآمنة</h3><button class="ghost" data-act="ovClose" aria-label="إغلاق">✕</button></div><div class="dlg-body" id="ovBody"></div></dialog>'; }
  App.acts.ovOpen = function (el) {
    var t = App.trainee(), p = App.db.plans.filter(function (x) { return x.id === el.dataset.plan; })[0], di = Number(el.dataset.day), ii = Number(el.dataset.item), it = p.days[di].main[ii];
    var ctxIn = { trainee: t, screening: App.latest('screenings', t.id), baseline: App.latest('baselines', t.id) };
    var cands = E.candidatesFor(p, di, ii, ctxIn), ex = X.byId(it.exId), d = ex.dose, rng = d.u === 'reps' ? d.reps : d.sec;
    App.$('#ovBody').innerHTML = '<form data-form="override" data-plan="' + esc(p.id) + '" data-day="' + di + '" data-item="' + ii + '"><p>الحالي: <b>' + esc(ex.ar) + '</b> ' + esc(App.dosageText(it)) + '</p><label>التمرين (المرشحات الآمنة فقط: ' + cands.length + ')<select name="exId">' + cands.map(function (c) { return '<option value="' + esc(c.id) + '"' + (c.id === it.exId ? ' selected' : '') + '>' + esc(c.ar) + ' — ' + esc(X.LEVEL[c.lvl]) + '</option>'; }).join('') + '</select></label>' +
      '<div class="grid"><label>المجموعات (' + d.sets.join('–') + ' للتمرين الحالي)<input type="number" name="sets" value="' + it.sets + '"></label><label>' + (d.u === 'reps' ? 'التكرارات' : 'الثواني') + ' (' + rng.join('–') + ')<input type="number" name="target" value="' + it.target + '"></label></div><p class="small muted">عند تغيير التمرين تُستخدم جرعته الابتدائية تلقائياً ما لم تُغيّر الأرقام.</p>' +
      '<label><input type="checkbox" name="allDays" checked> تطبيق على كل أيام الأسبوع التي تحتوي هذه الخانة</label><label>السبب (مطلوب، يُسجل)<input name="reason" required minlength="5" maxlength="300"></label><div id="ovErr" role="alert"></div><button type="submit">تطبيق</button></form>';
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
    p.updatedAt = S.nowISO(); App.audit('plan.override', p.id + ': ' + ch.reason, t.id, p.id); App.save(); App.$('#ovDlg').close(); App.render(); App.toast('تم التعديل وتسجيله');
  };

  /* ---------- print (A4, Arabic RTL) — via the browser's Print → Save as PDF ---------- */
  App.acts.printPlan = function (el) {
    var p = App.db.plans.filter(function (x) { return x.id === el.dataset.id; })[0], t = App.trainee(p.traineeId);
    App.$('#print').innerHTML = printHTML(p, t);
    App.audit('plan.print', 'طباعة ' + p.id, t.id, p.id); App.save();
    setTimeout(function () { window.print(); }, 50);
  };
  function printHTML(p, t) {
    var sc = App.db.screenings.filter(function (s) { return s.id === p.screeningId; })[0];
    var h = '<div class="p-head"><div><h1>الخطة التدريبية الأسبوعية — بوزن الجسم</h1><div><b>المتدرب:</b> ' + esc(t.displayName) + (t.internalId ? ' (' + esc(t.internalId) + ')' : '') + ' · <b>معرف المتدرب:</b> ' + esc(t.id) + '</div><div><b>المدرب:</b> ' + esc(t.coachName || App.db.settings.coachName || '................') + '</div></div>' +
      '<div class="meta"><div><b>رقم الخطة:</b> ' + esc(p.id) + '</div><div><b>الأسبوع:</b> ' + App.fmtDate(p.weekStart) + ' – ' + App.fmtDate(p.weekEnd) + '</div><div><b>تاريخ الإنشاء:</b> ' + App.fmtDate(p.createdAt) + '</div><div>' + esc(p.ruleVersion) + ' · ' + esc(sc ? sc.version : '') + ' · v' + esc(S.APP_VERSION) + '</div></div></div>';
    if (p.status === 'blocked') return h + '<div class="p-box"><b>لم تُصدر خطة تمارين.</b><ul>' + p.blockers.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul></div>' + footer(p);
    h += '<div class="p-box"><b>تعليمات السلامة:</b> إحماء قبل كل حصة وتهدئة بعدها. تنفس بانتظام ولا تحبس النفس. الجهد المستهدف 5–7 من 10 (تستطيع الكلام بجمل قصيرة). أوقف التمرين فوراً عند: ' + esc(X.STOP_ALL.join('؛ ')) + '. رقم الطوارئ: ' + esc(App.db.settings.emergencyNumber || '....') + '. الخطة أداة تدريبية وليست تصريحاً طبياً.' + (p.pathway === 'pregnancy' ? ' <b>مسار الحمل:</b> بموافقة مقدم الرعاية؛ دون قفز أو استلقاء طويل على الظهر؛ اشربي الماء وتجنبي الحرارة.' : p.pathway === 'postpartum' ? ' <b>ما بعد الولادة:</b> دون قفز حتى التقييم؛ أوقفي عند تسرب أو ثقل في الحوض.' : '') + '</div>';
    h += '<h2>جدول الأسبوع</h2><table><thead><tr><th style="width:16%">اليوم</th><th style="width:12%">النوع</th><th>التمارين والجرعة (مجموعات × عدد/مدة · راحة)</th><th style="width:9%">≈ دقائق</th></tr></thead><tbody>';
    p.days.forEach(function (d) {
      var body = d.type === 'rest' ? 'راحة' : d.type === 'recovery' ? (d.recovery || []).map(function (it) { return esc(App.exName(it.exId)) + ' ' + esc(App.dosageText(it)); }).join('<br>') + '<br>تهدئة: ' + (d.cooldown || []).map(function (it) { return esc(App.exName(it.exId)); }).join('، ') :
        '<b>إحماء:</b> ' + (d.warmup || []).map(function (it) { return esc(App.exName(it.exId)) + ' (' + esc(App.dosageText(it)) + ')'; }).join('، ') + '<br>' + d.main.map(function (it, i) { return (i + 1) + ') <b>' + esc(App.exName(it.exId)) + '</b> — ' + esc(App.dosageText(it)); }).join('<br>') + '<br><b>تهدئة:</b> ' + (d.cooldown || []).map(function (it) { return esc(App.exName(it.exId)) + ' (' + esc(App.dosageText(it)) + ')'; }).join('، ');
      h += '<tr><td><b>' + esc(d.dowAr) + '</b><br>' + App.fmtDate(d.date) + '</td><td>' + esc({ train: 'تدريب ' + (d.template || ''), recovery: 'استشفاء', rest: 'راحة' }[d.type]) + '</td><td>' + body + '</td><td>' + (d.estMinutes || '—') + '</td></tr>';
    });
    h += '</tbody></table>';
    var ids = []; p.days.forEach(function (d) { (d.main || []).concat(d.warmup || [], d.cooldown || [], d.recovery || []).forEach(function (it) { if (ids.indexOf(it.exId) < 0) ids.push(it.exId); }); });
    h += '<h2>بطاقات التمارين المصوّرة</h2><p class="meta">الرسوم أصلية مولدة برمجياً: الشكل الأول وضع البداية، والثاني وضع النهاية (الباهت = البداية، المنقط = المسار).</p>';
    ids.forEach(function (id) {
      var ex = X.byId(id); if (!ex) return;
      h += '<div class="exs"><div>' + App.thumb(id, 0) + '</div><div>' + App.thumb(id) + '</div><div><h3>' + esc(ex.ar) + ' <span class="meta">(' + esc(ex.en) + ' · ' + esc(ex.id) + ' · ' + esc(X.LEVEL[ex.lvl]) + ')</span></h3><div class="meta"><b>البداية:</b> ' + esc(ex.setup) + '</div><ol class="meta" style="margin:2px 18px 2px 0;padding:0">' + ex.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol><div class="meta"><b>التنفس:</b> ' + esc(ex.breath) + ' <b>أخطاء:</b> ' + esc(ex.errors.join('؛ ')) + ' <b>أوقف إذا:</b> ' + esc(ex.stop.join('؛ ')) + (ex.easier.length ? ' <b>أسهل:</b> ' + esc(ex.easier.map(App.exName).join('، ')) : '') + '</div></div></div>';
    });
    h += '<h2 class="pb">سجل المتابعة (يُملأ يدوياً ثم يُدخل في التطبيق)</h2><table class="fb"><thead><tr><th>اليوم</th><th>أُنجزت؟</th><th>الجهد 0–10</th><th>ألم 0–10 / المكان</th><th>التقنية</th><th>ملاحظات</th></tr></thead><tbody>' + p.days.filter(function (d) { return d.type !== 'rest'; }).map(function (d) { return '<tr><td>' + esc(d.dowAr) + ' ' + App.fmtDate(d.date) + '</td><td>☐ كاملة ☐ جزئية ☐ لا</td><td></td><td></td><td>☐ جيدة ☐ متوسطة ☐ ضعيفة</td><td></td></tr>'; }).join('') + '</tbody></table>';
    h += '<div class="p-box"><b>أسئلة نهاية الأسبوع:</b> 1) هل حدث ألم صدر/دوخة/إغماء/ضيق نفس غير معتاد/خفقان؟ ☐ لا ☐ نعم 2) أعلى ألم جديد 0–10 ومكانه: ...... 3) مرض مؤقت؟ ☐ لا ☐ نعم 4) النوم: ☐ جيد ☐ متوسط ☐ ضعيف 5) الإرهاق 0–10: ...... 6) ألم عضلي > 72 ساعة؟ ☐ لا ☐ نعم 7) هل الأيام والمدة مناسبة؟ ☐ نعم ☐ لا</div>';
    return h + footer(p);
  }
  function footer(p) { return '<p class="meta" style="margin-top:8px;border-top:1px solid #999;padding-top:4px">طُبعت عبر خاصية الطباعة في المتصفح (Print → Save as PDF)؛ لا يحتوي ملف PDF على قاعدة بيانات قابلة للاستيراد — للنقل بين الأجهزة استخدم ملف JSON المصدَّر. البحث برقم الخطة يعمل فقط عند وجود السجل محلياً. المصادر: انظر صفحة «المصادر والسلامة» في التطبيق. ' + esc(p.id) + '</p>'; }
})();
