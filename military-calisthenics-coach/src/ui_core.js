/* UI core: helpers, state, shell, dashboard, trainees, data management, sources. All dynamic text is escaped. */
(function () {
  'use strict';
  var S = window.MCStore, E = window.MCEngine, X = window.MCEX, SC = window.MCScreen;
  var App = window.App = { db: null, ui: { page: 'dash', traineeId: null }, pages: {}, acts: {}, forms: {}, changes: {} };

  /* ---------- helpers ---------- */
  var esc = App.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  App.$ = function (sel, root) { return (root || document).querySelector(sel); };
  App.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  App.fmtDate = function (iso) { if (!iso) return '—'; var d = String(iso).slice(0, 10).split('-'); return d.length === 3 ? d[2] + '/' + d[1] + '/' + d[0] : esc(iso); };
  App.fmtDT = function (iso) { if (!iso) return '—'; return App.fmtDate(iso) + ' ' + String(iso).slice(11, 16); };
  App.today = function () { var d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  App.toast = function (msg, ms) { var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, ms || 3500); };
  App.trainee = function (id) { return App.db.trainees.find(function (t) { return t.id === (id || App.ui.traineeId); }) || null; };
  App.latest = function (coll, tid, pred) { var a = App.db[coll].filter(function (r) { return r.traineeId === tid && (!pred || pred(r)); }); a.sort(function (x, y) { return (x.at || x.createdAt || '') < (y.at || y.createdAt || '') ? -1 : 1; }); return a[a.length - 1] || null; };
  App.plansOf = function (tid) { return App.db.plans.filter(function (p) { return p.traineeId === tid; }).sort(function (a, b) { return a.weekStart < b.weekStart ? -1 : a.weekStart > b.weekStart ? 1 : (a.createdAt < b.createdAt ? -1 : 1); }); };
  App.audit = function (type, msg, traineeId, ref) { App.db.audit.push({ id: S.uniqueId(App.db, 'audit'), at: S.nowISO(), type: type, msg: msg, traineeId: traineeId || null, ref: ref || null }); };
  App.save = function (why) { var ok = S.save(App.db); App.renderStatus(); if (!ok && S.status.mode !== 'memory') App.toast(S.status.error || 'فشل الحفظ'); return ok; };
  App.exName = function (id) { var e = X.byId(id); return e ? e.ar : id; };
  App.statusBadge = function (st) { var m = { cleared: ['b-ok', SC.LABEL.cleared], more_info: ['b-warn', SC.LABEL.more_info], refer: ['b-danger', SC.LABEL.refer] }; var x = m[st] || ['b-info', 'لم يُفحص']; return '<span class="badge ' + x[0] + '">' + (st === 'refer' ? '⛔ ' : st === 'cleared' ? '✔ ' : st === 'more_info' ? '⚠ ' : '○ ') + esc(x[1]) + '</span>'; };
  App.download = function (name, text, type) {
    var blob = new Blob([text], { type: type || 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = S.safeFileName(name); document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  };
  App.field = function (q, val, prefix) {
    var name = esc((prefix || '') + q.id), h = '<label for="f_' + name + '">' + esc(q.text) + (q.must ? '<span class="must">إلزامي</span>' : '') + (q.hint ? '<span class="hint">' + esc(q.hint) + '</span>' : '');
    if (q.type === 'yn') h += '<select id="f_' + name + '" name="' + name + '"><option value="">— اختر —</option>' + SC.YN.map(function (o) { return '<option value="' + o[0] + '"' + (val === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select>';
    else if (q.type === 'select') h += '<select id="f_' + name + '" name="' + name + '"><option value="">— اختر —</option>' + q.opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (val === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
    else if (q.type === 'num') h += '<input id="f_' + name + '" name="' + name + '" type="number" inputmode="numeric" min="' + q.min + '" max="' + q.max + '" value="' + esc(val == null ? '' : val) + '">';
    else if (q.type === 'multi') { h += '</label><div class="checks" role="group" aria-label="' + esc(q.text) + '">' + q.opts.map(function (o) { return '<label><input type="checkbox" name="' + name + '" value="' + esc(o[0]) + '"' + (Array.isArray(val) && val.indexOf(o[0]) >= 0 ? ' checked' : '') + '> ' + esc(o[1]) + '</label>'; }).join('') + '<label><input type="checkbox" name="' + name + '" value="__none"' + (Array.isArray(val) && !val.length ? ' checked' : '') + '> لا شيء مما سبق</label></div>'; return '<div class="q">' + h + '</div>'; }
    else h += '<input id="f_' + name + '" name="' + name + '" value="' + esc(val || '') + '">';
    return '<div class="q">' + h + '</label></div>';
  };
  App.readForm = function (form, qs, prefix) {
    var out = {}, fd = new FormData(form);
    qs.forEach(function (q) {
      var n = (prefix || '') + q.id;
      if (q.type === 'multi') { var v = fd.getAll(n); out[q.id] = v.length ? v.filter(function (x) { return x !== '__none'; }) : undefined; }
      else if (q.type === 'num') { var x = fd.get(n); out[q.id] = x === '' || x == null ? undefined : Math.max(q.min, Math.min(q.max, Number(x))); }
      else { var y = fd.get(n); out[q.id] = y === '' || y == null ? undefined : String(y); }
    });
    return out;
  };

  /* ---------- shell ---------- */
  var NAV = [['dash', '◎', 'لوحة القيادة'], ['trainees', '👥', 'المتدربون'], ['screen', '🩺', 'الفحص والتقييم'], ['library', '📚', 'مكتبة التمارين'], ['plan', '🗓', 'الخطة الأسبوعية'], ['session', '⏱', 'الحصة المباشرة'], ['review', '✅', 'المراجعة الأسبوعية'], ['history', '📈', 'السجل والتقدم'], ['data', '💾', 'التصدير والاستيراد'], ['sources', '⚖', 'المصادر والسلامة']];
  App.go = function (page, opts) { App.ui.page = page; Object.assign(App.ui, opts || {}); App.render(); var m = App.$('main'); if (m) { m.focus({ preventScroll: true }); window.scrollTo(0, 0); } };
  App.renderStatus = function () {
    var el = App.$('#storeStatus'); if (!el) return; var st = S.status;
    var cls = st.mode === 'memory' || st.error ? 'b-danger' : 'b-ok';
    var txt = st.mode === 'memory' ? 'غير محفوظ (ذاكرة مؤقتة)' : st.error ? 'خطأ في الحفظ' : 'محفوظ محلياً' + (st.lastSaved ? ' ' + String(st.lastSaved).slice(11, 16) : '');
    el.className = 'badge ' + cls; el.textContent = '💾 ' + txt; el.title = (st.error || 'التخزين: localStorage لهذا المتصفح وهذا الملف فقط. حجم البيانات ' + Math.round(st.bytes / 1024) + ' ك.ب');
  };
  App.renderTraineeSelect = function () {
    var sel = App.$('#activeTrainee'); if (!sel) return;
    var list = App.db.trainees.filter(function (t) { return !t.archived; });
    sel.innerHTML = '<option value="">— اختر المتدرب النشط —</option>' + list.map(function (t) { return '<option value="' + esc(t.id) + '"' + (t.id === App.ui.traineeId ? ' selected' : '') + '>' + esc(t.displayName) + ' · ' + esc(t.id) + '</option>'; }).join('');
  };
  App.render = function () {
    App.$$('nav.side button').forEach(function (b) { if (b.dataset.page === App.ui.page) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    App.renderTraineeSelect(); App.renderStatus();
    var v = App.$('#view'); var fn = App.pages[App.ui.page] || App.pages.dash;
    try { v.innerHTML = fn(); } catch (e) { console.error(e); v.innerHTML = '<div class="alert danger"><b>خطأ في عرض الصفحة</b>' + esc(e.message) + '</div>'; }
    if (App.after[App.ui.page]) App.after[App.ui.page]();
    var t = NAV.filter(function (n) { return n[0] === App.ui.page; })[0]; document.title = (t ? t[2] + ' | ' : '') + 'المدرب العسكري للياقة البدنية v5';
  };
  App.after = {};
  App.needTrainee = function (what) {
    if (App.trainee()) return '';
    return '<div class="empty"><p>اختر متدرباً نشطاً من الأعلى ' + (what ? 'ل' + esc(what) : '') + '، أو أنشئ ملفاً جديداً.</p><button data-act="go" data-page="trainees" data-new="1">+ متدرب جديد</button></div>';
  };

  /* ---------- dashboard ---------- */
  App.pages.dash = function () {
    var db = App.db, act = db.trainees.filter(function (t) { return !t.archived; });
    var h = '<h2>لوحة القيادة</h2>';
    if (S.status.mode === 'memory' || S.status.error) h += '<div class="alert danger"><b>تحذير التخزين</b>' + esc(S.status.error) + '</div>';
    var v4 = S.readV4Local();
    if (v4 && !db.legacy) h += '<div class="alert warn"><b>وُجدت بيانات من النسخة v4 في هذا المتصفح</b>يمكن ترحيلها (نسخاً للقراءة فقط دون تعديل بيانات v4) من صفحة <button class="sec" data-act="go" data-page="data">التصدير والاستيراد</button></div>';
    h += '<div class="kpi"><div><b>' + act.length + '</b>متدرب نشط</div><div><b>' + db.plans.filter(function (p) { return p.status !== 'blocked'; }).length + '</b>خطة أسبوعية</div><div><b>' + db.sessions.filter(function (s) { return s.status === 'complete'; }).length + '</b>حصة مكتملة</div><div><b>' + X.list.length + '</b>تمرين/تنويعة موثقة برسم متحرك</div></div>';
    if (!act.length) return h + '<div class="empty"><p>لا يوجد متدربون بعد. ابدأ بإنشاء ملف متدرب، ثم الفحص الصحي، ثم التقييم الأساسي، ثم الخطة الأسبوعية.</p><button data-act="go" data-page="trainees" data-new="1">+ متدرب جديد</button></div>';
    h += '<h3>حالة المتدربين</h3><div class="grid">';
    act.forEach(function (t) {
      var sc = App.latest('screenings', t.id), bl = App.latest('baselines', t.id), pls = App.plansOf(t.id), pl = pls[pls.length - 1];
      var next = '';
      if (!t.consent) next = 'سجّل موافقة الخصوصية';
      else if (!sc) next = 'أجرِ الفحص الصحي';
      else if (sc.outcome.status !== 'cleared') next = 'الفحص: ' + SC.LABEL[sc.outcome.status];
      else if (!bl) next = 'أجرِ التقييم الأساسي';
      else if (!pl) next = 'أنشئ أول خطة أسبوعية';
      else if (pl.status === 'blocked') next = 'الخطة موقوفة: راجع الأسباب';
      else if (!App.db.reviews.some(function (r) { return r.planId === pl.id; })) next = 'نفّذ الحصص ثم المراجعة الأسبوعية';
      else next = 'أنشئ خطة الأسبوع التالي';
      h += '<div class="card flat"><div class="row"><b class="grow">' + esc(t.displayName) + '</b>' + App.statusBadge(sc && sc.outcome.status) + '</div><div class="small muted">' + esc(t.id) + (t.internalId ? ' · ' + esc(t.internalId) : '') + '</div>' +
        '<p class="small">الخطوة التالية: <b>' + esc(next) + '</b>' + (pl ? '<br>آخر خطة: ' + esc(pl.id) + ' (' + App.fmtDate(pl.weekStart) + ')' : '') + '</p><button class="sec" data-act="pick" data-id="' + esc(t.id) + '">فتح</button></div>';
    });
    h += '</div><div class="alert"><b>تسلسل العمل</b>1) ملف المتدرب وموافقة الخصوصية ← 2) الفحص الصحي (قد يوقف الخطة) ← 3) التقييم الأساسي دون اختبار أقصى ← 4) خطة أسبوعية فقط ← 5) الحصص المباشرة وتسجيل الأداء ← 6) المراجعة الأسبوعية ← 7) خطة الأسبوع التالي. صدّر نسخة JSON دورياً.</div>';
    return h;
  };
  App.acts.pick = function (el) { App.ui.traineeId = el.dataset.id; App.go(el.dataset.page || 'trainees', { editId: null }); };
  App.acts.go = function (el) { var o = {}; if (el.dataset.new) o.editId = 'new'; App.go(el.dataset.page, o); };

  /* ---------- trainees ---------- */
  var GOALS = [['general', 'لياقة عامة'], ['endurance', 'تحمل'], ['strength', 'قوة بوزن الجسم'], ['weight', 'إدارة الوزن (مع نشاط)'], ['mobility', 'حركة ومرونة']];
  var EXP = [['beginner', 'مبتدئ / عائد بعد انقطاع'], ['intermediate', 'متوسط (تدريب منتظم 3 أشهر+)'], ['advanced', 'متقدم (تدريب منتظم سنة+)']];
  var EQ = ['wall', 'chair', 'step', 'table', 'low_bar', 'bar', 'towel', 'mat', 'space', 'stairs'];
  App.GOALS = GOALS; App.EXP = EXP;
  var CONSENT_TEXT = 'أُبلغ المتدرب بأن: البيانات تُحفظ محلياً على هذا الجهاز وهذا المتصفح فقط ولا تُرسل لأي خادم؛ مسح بيانات المتصفح أو التصفح الخاص قد يحذفها؛ النسخ الاحتياطي مسؤولية المدرب؛ الأداة مساعدة تدريبية وليست تشخيصاً أو تصريحاً طبياً ولا تضمن عدم الإصابة؛ يمكن طلب تصدير البيانات أو حذفها في أي وقت.';
  App.pages.trainees = function () {
    var ui = App.ui, h = '<div class="row"><h2 class="grow">المتدربون</h2><button data-act="tNew">+ متدرب جديد</button></div>';
    if (ui.editId) return h + traineeForm(ui.editId === 'new' ? null : App.trainee(ui.editId));
    var q = (ui.tq || '').trim().toLowerCase(), showArch = !!ui.tArch;
    h += '<div class="row"><label class="grow">بحث بالاسم أو المعرف<input id="tq" value="' + esc(ui.tq || '') + '" placeholder="الاسم، TR5-…، المعرف الداخلي"></label><label><input type="checkbox" id="tArch"' + (showArch ? ' checked' : '') + '> إظهار المؤرشفين</label></div>';
    var list = App.db.trainees.filter(function (t) { return (showArch || !t.archived) && (!q || (t.displayName + ' ' + t.id + ' ' + (t.internalId || '')).toLowerCase().indexOf(q) >= 0); });
    if (!list.length) return h + '<div class="empty">لا توجد نتائج.</div>';
    h += '<div class="scroll"><table><thead><tr><th>الاسم</th><th>المعرف</th><th>الفحص</th><th>الخطط</th><th>الحالة</th><th>إجراءات</th></tr></thead><tbody>';
    list.forEach(function (t) {
      var sc = App.latest('screenings', t.id);
      h += '<tr><td><b>' + esc(t.displayName) + '</b>' + (t.coachName ? '<div class="small muted">المدرب: ' + esc(t.coachName) + '</div>' : '') + '</td><td class="small">' + esc(t.id) + (t.internalId ? '<br>' + esc(t.internalId) : '') + '</td><td>' + App.statusBadge(sc && sc.outcome.status) + '</td><td>' + App.plansOf(t.id).length + '</td><td>' + (t.archived ? '<span class="pill">مؤرشف</span>' : t.consent ? '<span class="pill">موافقة مسجلة</span>' : '<span class="badge b-warn">بلا موافقة</span>') + '</td>' +
        '<td class="row"><button class="sec" data-act="pick" data-id="' + esc(t.id) + '" data-page="screen">فحص/تقييم</button><button class="sec" data-act="tEdit" data-id="' + esc(t.id) + '">تعديل</button><button class="ghost" data-act="tArchive" data-id="' + esc(t.id) + '">' + (t.archived ? 'إلغاء الأرشفة' : 'أرشفة') + '</button><button class="ghost" data-act="tExport" data-id="' + esc(t.id) + '">تصدير</button><button class="danger" data-act="tDelete" data-id="' + esc(t.id) + '">حذف</button></td></tr>';
    });
    return h + '</tbody></table></div>';
  };
  function traineeForm(t) {
    t = t || { days: [0, 2, 4], minutes: 30, equipment: [], limitations: [], goal: 'general', experience: 'beginner' };
    var dayChecks = E.DOW_AR.map(function (d, i) { return '<label><input type="checkbox" name="days" value="' + i + '"' + ((t.days || []).indexOf(i) >= 0 ? ' checked' : '') + '> ' + d + '</label>'; }).join('');
    var eqChecks = EQ.map(function (k) { return '<label><input type="checkbox" name="equipment" value="' + k + '"' + ((t.equipment || []).indexOf(k) >= 0 ? ' checked' : '') + '> ' + esc(X.EQUIP[k]) + '</label>'; }).join('');
    var limChecks = SC.AREAS.map(function (a) { return '<label><input type="checkbox" name="limitations" value="' + a[0] + '"' + ((t.limitations || []).indexOf(a[0]) >= 0 ? ' checked' : '') + '> ' + a[1] + '</label>'; }).join('');
    var opt = function (arr, v) { return arr.map(function (o) { return '<option value="' + o[0] + '"' + (v === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join(''); };
    return '<form class="card" data-form="trainee" data-id="' + esc(t.id || '') + '" novalidate><h3>' + (t.id ? 'تعديل ' + esc(t.displayName) : 'متدرب جديد') + '</h3>' +
      '<div class="alert small">اجمع الحد الأدنى من البيانات. الحقول الاختيارية يمكن تركها فارغة. لا تُدخل تشخيصات طبية تفصيلية — الفحص يسجل إجابات نعم/لا فقط.</div>' +
      '<div class="grid"><label>اسم العرض *<input name="displayName" required maxlength="120" value="' + esc(t.displayName || '') + '"></label>' +
      '<label>معرف داخلي (اختياري)<span class="hint">رقم عسكري/وظيفي إن لزم، للبحث فقط</span><input name="internalId" maxlength="40" value="' + esc(t.internalId || '') + '"></label>' +
      '<label>اسم المدرب<input name="coachName" maxlength="80" value="' + esc(t.coachName || App.db.settings.coachName || '') + '"></label>' +
      '<label>العمر بالسنوات *<span class="hint">مطلوب للفحص؛ أقل من 18 ⇒ لا خطة تلقائية</span><input name="age" type="number" min="10" max="100" value="' + esc(t.age || '') + '"></label>' +
      '<label>الجنس (اختياري)<span class="hint">يستخدم فقط لتحديد ظهور أسئلة الحمل/ما بعد الولادة، ولا يغيّر الشدة أو القدرة</span><select name="sex"><option value="">غير محدد</option>' + opt([['female', 'أنثى'], ['male', 'ذكر'], ['undisclosed', 'أفضّل عدم الذكر']], t.sex) + '</select></label>' +
      '<label>الهدف<select name="goal">' + opt(GOALS, t.goal) + '</select></label><label>الخبرة<select name="experience">' + opt(EXP, t.experience) + '</select></label>' +
      '<label>مدة الحصة (دقيقة)<input name="minutes" type="number" min="15" max="90" value="' + esc(t.minutes || 30) + '"></label></div>' +
      '<fieldset><legend>الأيام المتاحة</legend><div class="checks">' + dayChecks + '</div></fieldset>' +
      '<fieldset><legend>المعدات والمكان المتاح</legend><div class="checks">' + eqChecks + '</div></fieldset>' +
      '<fieldset><legend>قيود معروفة يحددها المدرب (تستبعد التمارين المحمِّلة)</legend><div class="checks">' + limChecks + '</div></fieldset>' +
      '<fieldset><legend>قياسات الجسم (اختيارية)</legend><label><input type="checkbox" name="bodyMetricsConsent"' + (t.bodyMetricsConsent ? ' checked' : '') + '> المتدرب يوافق على تسجيل الطول والوزن</label><div class="grid"><label>الطول (سم)<input name="heightCm" type="number" min="100" max="230" value="' + esc(t.heightCm || '') + '"></label><label>الوزن (كجم)<input name="weightKg" type="number" min="30" max="250" value="' + esc(t.weightKg || '') + '"></label></div><p class="small muted">لا تُستخدم القياسات في القرارات الآلية في هذه النسخة.</p></fieldset>' +
      '<label>احتياجات الوصول أو التفضيلات<textarea name="accessibility" rows="2" maxlength="600">' + esc(t.accessibility || '') + '</textarea></label>' +
      '<label>ملاحظات<textarea name="notes" rows="2" maxlength="1000">' + esc(t.notes || '') + '</textarea></label>' +
      '<fieldset><legend>إقرار الخصوصية والحدود *</legend><p class="small">' + esc(CONSENT_TEXT) + '</p><label><input type="checkbox" name="consent"' + (t.consent ? ' checked' : '') + '> تم إبلاغ المتدرب وموافقته</label>' + (t.consent ? '<p class="small muted">مسجلة في ' + App.fmtDT(t.consent.at) + '</p>' : '') + '</fieldset>' +
      '<div id="tErr" role="alert"></div><div class="row"><button type="submit">حفظ</button><button type="button" class="sec" data-act="tCancel">إلغاء</button></div></form>';
  }
  App.acts.tNew = function () { App.ui.editId = 'new'; App.render(); };
  App.acts.tEdit = function (el) { App.ui.editId = el.dataset.id; App.render(); };
  App.acts.tCancel = function () { App.ui.editId = null; App.render(); };
  App.forms.trainee = function (f) {
    var fd = new FormData(f), errs = [], id = f.dataset.id;
    var name = String(fd.get('displayName') || '').trim();
    if (!name) errs.push('اسم العرض مطلوب');
    var age = Number(fd.get('age')); if (!(age >= 10 && age <= 100)) errs.push('العمر مطلوب (10–100)');
    var days = fd.getAll('days').map(Number); if (!days.length) errs.push('اختر يوماً متاحاً واحداً على الأقل');
    var minutes = Number(fd.get('minutes')); if (!(minutes >= 15 && minutes <= 90)) errs.push('مدة الحصة 15–90 دقيقة');
    if (!fd.get('consent')) errs.push('يلزم تسجيل إقرار الخصوصية والحدود');
    var bm = !!fd.get('bodyMetricsConsent');
    if (!bm && (fd.get('heightCm') || fd.get('weightKg'))) errs.push('لا تُسجّل القياسات دون موافقة المتدرب');
    if (errs.length) { App.$('#tErr').innerHTML = '<div class="alert danger"><b>تحقق من الحقول</b>' + errs.map(esc).join('<br>') + '</div>'; return; }
    var now = S.nowISO(), t = id ? App.trainee(id) : null, isNew = !t;
    if (isNew) t = { id: S.uniqueId(App.db, 'trainees'), createdAt: now, archived: false, avoid: [], revisions: [] };
    else { t.revisions = t.revisions || []; var snap = JSON.parse(JSON.stringify(t)); delete snap.revisions; t.revisions.push({ at: now, snapshot: snap }); t.revisions = t.revisions.slice(-20); }
    Object.assign(t, { displayName: name.slice(0, 120), internalId: String(fd.get('internalId') || '').trim().slice(0, 40), coachName: String(fd.get('coachName') || '').trim().slice(0, 80), age: age, sex: String(fd.get('sex') || ''),
      goal: String(fd.get('goal')), experience: String(fd.get('experience')), minutes: minutes, days: days, equipment: fd.getAll('equipment').map(String), limitations: fd.getAll('limitations').map(String),
      bodyMetricsConsent: bm, heightCm: bm && fd.get('heightCm') ? Number(fd.get('heightCm')) : null, weightKg: bm && fd.get('weightKg') ? Number(fd.get('weightKg')) : null,
      accessibility: String(fd.get('accessibility') || '').slice(0, 600), notes: String(fd.get('notes') || '').slice(0, 1000), updatedAt: now });
    if (!t.consent) t.consent = { at: now, text: CONSENT_TEXT, version: 'CONSENT-5.0' };
    if (t.coachName) App.db.settings.coachName = t.coachName;
    if (isNew) App.db.trainees.push(t);
    App.audit(isNew ? 'trainee.create' : 'trainee.update', (isNew ? 'إنشاء ' : 'تعديل ') + t.displayName, t.id);
    App.save(); App.ui.traineeId = t.id; App.ui.editId = null;
    App.toast(isNew ? 'تم إنشاء الملف ' + t.id + '. الخطوة التالية: الفحص الصحي.' : 'تم الحفظ');
    App.go(isNew ? 'screen' : 'trainees');
  };
  App.acts.tArchive = function (el) { var t = App.trainee(el.dataset.id); t.archived = !t.archived; t.updatedAt = S.nowISO(); App.audit('trainee.archive', (t.archived ? 'أرشفة ' : 'إلغاء أرشفة ') + t.displayName, t.id); if (t.archived && App.ui.traineeId === t.id) App.ui.traineeId = null; App.save(); App.render(); };
  App.acts.tExport = function (el) { var t = App.trainee(el.dataset.id); var env = S.exportEnvelope(App.db, 'trainee', [t.id]); App.download('MCC5_' + t.id + '_' + App.today() + '.json', JSON.stringify(env, null, 2)); App.audit('export.trainee', 'تصدير سجل ' + t.displayName, t.id); App.save(); };
  App.acts.tDelete = function (el) {
    var t = App.trainee(el.dataset.id); var typed = prompt('حذف نهائي لكل سجلات «' + t.displayName + '» (فحوص، خطط، حصص، مراجعات). سيُحفظ نقطة استعادة واحدة مؤقتاً. للتأكيد اكتب: حذف');
    if (typed !== 'حذف') return;
    S.addRestorePoint(App.db, 'قبل حذف ' + t.displayName);
    ['screenings', 'baselines', 'plans', 'sessions', 'reviews'].forEach(function (c) { App.db[c] = App.db[c].filter(function (r) { return r.traineeId !== t.id; }); });
    App.db.audit = App.db.audit.filter(function (a) { return a.traineeId !== t.id; });
    App.db.trainees = App.db.trainees.filter(function (x) { return x.id !== t.id; });
    App.audit('trainee.delete', 'حذف متدرب (المعرف ' + t.id + ')', null);
    if (App.ui.traineeId === t.id) App.ui.traineeId = null; App.save(); App.render(); App.toast('تم الحذف');
  };
  App.changes.tq = function (el) { App.ui.tq = el.value; App.render(); var i = App.$('#tq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); };
  App.changes.tArch = function (el) { App.ui.tArch = el.checked; App.render(); };

  /* ---------- data: export / import / restore / migration ---------- */
  App.pages.data = function () {
    var st = S.status, rp = S.restorePoints(), v4 = S.readV4Local();
    var h = '<h2>التصدير والاستيراد والنسخ الاحتياطي</h2>';
    h += '<div class="card"><h3>حالة التخزين</h3><p>الوضع: <b>' + (st.mode === 'memory' ? 'ذاكرة مؤقتة (لن تُحفظ)' : 'localStorage لهذا المتصفح') + '</b> · الحجم ≈ ' + Math.round(st.bytes / 1024) + ' ك.ب · آخر حفظ: ' + App.fmtDT(st.lastSaved || App.db.updatedAt) + '</p>' + (st.error ? '<div class="alert danger">' + esc(st.error) + '</div>' : '') +
      '<div class="alert warn small"><b>حدود مهمة</b>البيانات مرتبطة بهذا المتصفح وهذا الجهاز (وفي بعض المتصفحات بمسار الملف أيضاً؛ في Chrome/Edge تتشارك كل الملفات المحلية مساحة تخزين واحدة). تُحذف عند مسح بيانات المتصفح، وقد لا تُحفظ في التصفح الخاص، ولا تنتقل تلقائياً لجهاز آخر. سلوك التخزين على iPhone/iPad يختلف (قد تُمسح البيانات بعد فترة عدم استخدام). الحل الوحيد الموثوق: تصدير JSON دورياً.</div></div>';
    h += '<div class="card"><h3>تصدير</h3><div class="row"><button data-act="expAll">تصدير كل البيانات (JSON)</button>' + (App.trainee() ? '<button class="sec" data-act="tExport" data-id="' + esc(App.ui.traineeId) + '">تصدير المتدرب النشط فقط</button>' : '') + '</div><p class="small muted">ملف التصدير يحتوي بيانات صحية حساسة (إجابات الفحص). شاركه فقط بإجراء صريح وبوسيلة آمنة. يتضمن الملف checksum للتحقق من السلامة (ليس تشفيراً).</p></div>';
    h += '<div class="card"><h3>استيراد</h3><label>ملف JSON (تصدير v5 أو نسخة v4)<input type="file" id="impFile" accept=".json,application/json"></label><div id="impPreview"></div><p class="small muted">PDF لا يُستورد: ملف PDF المطبوع لا يحتوي قاعدة بيانات قابلة للاستعادة. للنقل بين الأجهزة استخدم JSON.</p></div>';
    if (v4) h += '<div class="card"><h3>ترحيل بيانات v4 من هذا المتصفح</h3><p>وُجد مفتاح ' + esc(S.V4_KEY) + ' يحتوي ' + ((v4.people || []).length) + ' متدرب. الترحيل يقرأ البيانات فقط ولا يعدّل بيانات v4.</p><button data-act="migrateLocal">معاينة الترحيل</button></div>';
    h += '<div class="card"><h3>نقاط الاستعادة التلقائية (آخر 3)</h3>' + (rp.length ? '<table><tbody>' + rp.map(function (r, i) { return '<tr><td>' + App.fmtDT(r.at) + '</td><td>' + esc(r.reason) + '</td><td>' + ((r.db && r.db.trainees) || []).length + ' متدرب</td><td><button class="sec" data-act="restore" data-i="' + i + '">استعادة</button></td></tr>'; }).join('') + '</tbody></table>' : '<p class="muted">لا توجد. تُنشأ تلقائياً قبل الاستيراد والحذف.</p>') + '</div>';
    h += '<div class="card"><h3>الإعدادات</h3><form data-form="settings" class="grid"><label>رقم الطوارئ المحلي<span class="hint">يظهر عند علامات الإنذار (مثال قطر: 999)</span><input name="emergencyNumber" maxlength="12" value="' + esc(App.db.settings.emergencyNumber || '') + '"></label><label>اسم المدرب الافتراضي<input name="coachName" maxlength="80" value="' + esc(App.db.settings.coachName || '') + '"></label><div><button type="submit">حفظ الإعدادات</button></div></form></div>';
    h += '<div class="card"><h3>حذف كل البيانات</h3><p class="small">يحذف كل السجلات من هذا المتصفح (تبقى نقطة استعادة واحدة). صدّر نسخة أولاً.</p><button class="danger" data-act="wipe">حذف كل البيانات</button></div>';
    return h;
  };
  App.forms.settings = function (f) { var fd = new FormData(f); App.db.settings.emergencyNumber = String(fd.get('emergencyNumber') || '').replace(/[^0-9+]/g, '').slice(0, 12); App.db.settings.coachName = String(fd.get('coachName') || '').slice(0, 80); App.save(); App.toast('تم حفظ الإعدادات'); };
  App.acts.expAll = function () { var env = S.exportEnvelope(App.db, 'full', []); App.download('MCC5_backup_' + App.today() + '.json', JSON.stringify(env, null, 2)); App.audit('export.full', 'تصدير كامل'); App.save(); };
  App.changes.impFile = function (el) {
    var f = el.files[0]; if (!f) return;
    if (f.size > 20 * 1024 * 1024) { App.$('#impPreview').innerHTML = '<div class="alert danger">الملف أكبر من 20 ميغابايت.</div>'; return; }
    var r = new FileReader(); r.onload = function () { showImport(S.parseImport(String(r.result)), f.name); }; r.onerror = function () { App.$('#impPreview').innerHTML = '<div class="alert danger">تعذرت قراءة الملف.</div>'; }; r.readAsText(f);
  };
  App.acts.migrateLocal = function () { var p = S.parseImport(JSON.stringify(S.readV4Local())); App.go('data'); showImport(p, 'localStorage ' + S.V4_KEY); };
  var pendingImport = null;
  function showImport(p, name) {
    var box = App.$('#impPreview'); pendingImport = null;
    if (!p.ok) { box.innerHTML = '<div class="alert danger"><b>رُفض الاستيراد — لم يتغير شيء</b>' + p.errors.map(esc).join('<br>') + '</div>'; return; }
    var m = S.mergeInto(App.db, p.data, 'keep-local');
    pendingImport = p;
    box.innerHTML = '<div class="alert ok"><b>ملف صالح: ' + esc(name) + '</b>النوع: ' + esc(p.kind) + (p.meta ? ' · صُدّر ' + App.fmtDT(p.meta.exportedAt) + ' من ' + esc(p.meta.appVersion) : '') + '<br>سيُضاف: ' + S.COLLECTIONS.map(function (c) { return c + ' ' + m.report.added[c]; }).join('، ') + '<br>مطابق موجود: ' + m.report.skippedSame + ' · تعارضات (نفس المعرف ومحتوى مختلف): ' + m.report.conflicts.length + '</div>' +
      (p.warnings.length ? '<div class="alert warn">' + p.warnings.map(esc).join('<br>') + '</div>' : '') +
      '<label>عند التعارض<select id="impPolicy"><option value="keep-local">الإبقاء على النسخة المحلية (افتراضي)</option><option value="prefer-imported">استبدال بالنسخة المستوردة</option></select></label><button data-act="impConfirm">تأكيد الاستيراد (تُنشأ نقطة استعادة أولاً)</button>';
  }
  App.acts.impConfirm = function () {
    if (!pendingImport) return;
    S.addRestorePoint(App.db, 'قبل الاستيراد');
    var m = S.mergeInto(App.db, pendingImport.data, App.$('#impPolicy').value);
    App.db = m.db; App.audit('import', 'استيراد ' + pendingImport.kind + ': ' + JSON.stringify(m.report.added) + ' تعارضات ' + m.report.conflicts.length); App.save(); pendingImport = null;
    App.toast('تم الاستيراد'); App.go('trainees');
  };
  App.acts.restore = function (el) { var rp = S.restorePoints()[Number(el.dataset.i)]; if (!rp || !confirm('استعادة البيانات كما كانت في ' + App.fmtDT(rp.at) + '؟ ستُحفظ الحالة الحالية كنقطة استعادة.')) return; var v = S.validateDBShape(rp.db); if (!v.ok) { alert('نقطة الاستعادة تالفة: ' + v.errors[0]); return; } S.addRestorePoint(App.db, 'قبل الاستعادة'); App.db = rp.db; App.save(); App.toast('تمت الاستعادة'); App.go('dash'); };
  App.acts.wipe = function () { if (prompt('اكتب: حذف الكل') !== 'حذف الكل') return; S.addRestorePoint(App.db, 'قبل حذف الكل'); var s = App.db.settings; App.db = S.emptyDB(); App.db.settings = s; App.ui.traineeId = null; App.save(); App.go('dash'); };

  /* ---------- sources & safety ---------- */
  App.pages.sources = function () {
    var R = window.MCSRC, h = '<h2>المصادر والسلامة</h2>';
    h += '<div class="alert danger"><b>علامات الإيقاف الفوري (لكل التمارين)</b><ul>' + X.STOP_ALL.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>عند ألم الصدر المستمر أو الإغماء: اتصل بالطوارئ (' + esc(App.db.settings.emergencyNumber || '—') + ').</div>';
    h += '<div class="card"><h3>حدود الأداة</h3><ul><li>أداة مساعدة للمدرب، ليست تشخيصاً ولا تصريحاً طبياً ولا شهادة عسكرية، ولا تضمن عدم الإصابة.</li><li>أسئلة الفحص صياغة عربية خاصة بهذا التطبيق مستوحاة من محاور PAR-Q+ ومنطق ACSM؛ <b>ليست PAR-Q+</b> ولا ترجمة معتمدة له. لاستخدام PAR-Q+ الرسمي اطبع الاستمارة الأصلية كاملة من eparmedx.com.</li><li>قواعد الخطة حتمية ومُرقّمة (' + esc(E.RULES) + '، ' + esc(SC.VERSION) + '، ' + esc(E.BASELINE_VERSION) + ') وليست ذكاءً اصطناعياً أو تعلماً آلياً.</li><li>العلامة الحمراء توقف الإصدار التلقائي ولا يمكن تجاوزها بإعدادات المدرب؛ تتطلب فحصاً جديداً وتصريحاً موثقاً.</li><li>العد التلقائي بالكاميرا غير متوفر؛ العدادات يدوية.</li><li>سلم الجهد 0–10 بصياغة خاصة (لم يُضمَّن سلم Borg لأنه محمي بترخيص).</li><li>الرسوم المتحركة أصلية مولدة برمجياً لكل تمرين (لا صور منسوخة). هي توضيح تخطيطي وليست بديلاً عن الإشراف المباشر.</li></ul></div>';
    h += '<div class="card"><h3>القواعد المطبقة وأصلها</h3><div class="scroll"><table><thead><tr><th>القاعدة</th><th>المصدر</th></tr></thead><tbody>' + RULE_TABLE.map(function (r) { return '<tr><td>' + esc(r[0]) + '</td><td class="small">' + esc(r[1]) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
    h += '<div class="card"><h3>سجل المصادر</h3><p class="alert warn small">' + esc(R.note) + '</p><div class="scroll"><table><thead><tr><th>المفتاح</th><th>العنوان والناشر والتاريخ</th><th>الحالة</th><th>الاستخدام</th></tr></thead><tbody>' +
      R.list.map(function (s) { return '<tr><td><b>' + esc(s.key) + '</b></td><td>' + esc(s.title) + '<div class="small muted">' + esc(s.pub) + ' · ' + esc(s.date) + '</div><div class="small" dir="ltr" style="text-align:left">' + esc(s.url) + '</div></td><td>' + (s.status === 'search' ? '<span class="badge b-warn">من نتائج البحث فقط</span>' : s.status === 'local' ? '<span class="badge b-info">قاعدة محلية</span>' : '<span class="badge b-danger">غير مؤكد</span>') + '<div class="small muted">وصول ' + esc(R.accessDate) + '</div></td><td class="small">' + esc(s.use) + '</td></tr>'; }).join('') + '</tbody></table></div><p class="small muted">الروابط للقراءة فقط؛ التطبيق لا يتصل بأي منها.</p></div>';
    return h;
  };
  var RULE_TABLE = [
    ['أي عرض إنذار (ألم صدر، دوخة/إغماء، ضيق نفس غير معتاد، خفقان، تورم كاحل/ألم ساق عند المشي) ⇒ إحالة ولا خطة', 'RIEBE2015، PARQ، AHA-WARN'],
    ['أي إجابة إيجابية عن حالة مزمنة/أدوية/إشراف ⇒ تحتاج متابعة أو تصريحاً موثقاً', 'PARQ، EPARMEDX'],
    ['مرض قلبي/استقلابي/كلوي معروف: غير نشط ⇒ تصريح؛ نشط دون أعراض ⇒ شدة متوسطة فقط (لا قفز، مستوى ≤ 2)', 'RIEBE2015'],
    ['طلب إشراف طبي ⇒ إحالة دائمة (لا يمكن للتطبيق توفير الإشراف)', 'PARQ'],
    ['العمر < 18 ⇒ لا خطة تلقائية؛ العمر ≥ 65 ⇒ توازن في كل حصة ودون قفز', 'LOCAL، PAG2018'],
    ['الحمل: إقرار مقدم الرعاية؛ موانع مطلقة ⇒ إحالة؛ نسبية ⇒ تصريح؛ دون قفز/انقلاب/ضغط بطني/ثبات طويل؛ دون استلقاء ≥ 20 أسبوعاً؛ دون انبطاح ≥ 12 أسبوعاً (محلي)', 'ACOG804، LOCAL'],
    ['ما بعد الولادة: فحص ما بعد الولادة؛ لا قفز قبل 12 أسبوعاً؛ أعراض قاع الحوض ⇒ إحالة لأخصائي ومنع القفز والضغط البطني', 'ACOG804، GOOM2019، NICE-NG210'],
    ['التقييم الأساسي دون اختبار أقصى: إيقاف عند انكسار التقنية أو جهد 7/10 أو الحد الأعلى', 'LOCAL، ACSM-GETP'],
    ['تقوية كل المجموعات العضلية يومين أسبوعياً على الأقل، ودون تدريب النمط نفسه يومين متتاليين', 'ACSM-RT26، PAG2018، NIA'],
    ['التقدم: خطوة جرعة واحدة فقط إذا الإنجاز ≥ 100% وتقنية جيدة وجهد ≤ 7 ودون ألم في حصتين — حد 3 تقدمات أسبوعياً', 'ACSM-RT (مبدأ)، LOCAL (العتبات)'],
    ['الإحساس بالسهولة وحده لا يرفع الشدة', 'LOCAL'],
    ['ألم 4–6 ⇒ استبدال واستبعاد المنطقة أسبوعاً؛ ألم ≥ 7 أو تكرار الألم في المنطقة نفسها ⇒ إيقاف وإحالة', 'NPRS، LOCAL'],
    ['إنجاز < 70% أو تقنية ضعيفة أو جهد ≥ 9 ⇒ تخفيف', 'LOCAL'],
    ['مرض أو إرهاق مع نوم ضعيف ⇒ تخفيف عام؛ إنجاز أقل من نصف الحصص ⇒ لا تقدم', 'LOCAL'],
    ['تعديل المدرب مسموح فقط ضمن نطاقات التمرين ومرشحات السلامة مع سبب مسجل؛ ممنوع على الخطة الموقوفة', 'LOCAL'],
    ['لا تحبس النفس؛ زفير أثناء الجهد', 'AHA2007 (ثانوي)']
  ];
})();
