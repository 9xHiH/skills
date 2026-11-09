/* Boot + global event delegation. */
(function () {
  'use strict';
  var App = window.App, S = window.MCStore;
  var NAV = [['dash', '◎', 'لوحة القيادة'], ['trainees', '👥', 'المتدربون'], ['screen', '🩺', 'الفحص والتقييم'], ['library', '📚', 'مكتبة التمارين'], ['plan', '🗓', 'الخطة الأسبوعية'], ['session', '⏱', 'الحصة المباشرة'], ['review', '✅', 'المراجعة الأسبوعية'], ['history', '📈', 'السجل والتقدم'], ['data', '💾', 'التصدير والاستيراد'], ['sources', '⚖', 'المصادر والسلامة']];
  document.getElementById('nav').innerHTML = NAV.map(function (n) { return '<button data-page="' + n[0] + '"><span class="ico" aria-hidden="true">' + n[1] + '</span>' + n[2] + '</button>'; }).join('');
  document.getElementById('appver').textContent = S.APP_VERSION + ' · ' + window.MCEngine.RULES;
  try { var th = localStorage.getItem('MCC_V5_THEME'); if (th) document.documentElement.dataset.theme = th; } catch (e) { /* ignore */ }
  App.db = S.load();
  App.acts.theme = function () { var r = document.documentElement, n = r.dataset.theme === 'light' ? 'dark' : 'light'; r.dataset.theme = n; try { localStorage.setItem('MCC_V5_THEME', n); } catch (e) { /* ignore */ } };
  document.addEventListener('click', function (e) {
    var nb = e.target.closest('nav.side button[data-page]'); if (nb) { App.go(nb.dataset.page); return; }
    var b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
    var fn = App.acts[b.dataset.act]; if (fn) { e.preventDefault(); fn(b, e); }
  });
  document.addEventListener('submit', function (e) { var f = e.target.closest('form[data-form]'); if (!f) return; e.preventDefault(); var fn = App.forms[f.dataset.form]; if (fn) fn(f, e); });
  document.addEventListener('change', function (e) { var el = e.target; if (el.id === 'activeTrainee') { App.ui.traineeId = el.value || null; App.ui.planId = null; App.ui.revPlan = null; App.ui.run = null; App.ui.screenMode = null; App.render(); return; } var fn = App.changes[el.id]; if (fn) fn(el, e); });
  document.addEventListener('input', function (e) { var el = e.target; if (el.id === 'runInput' && App.changes.runInput) App.changes.runInput(el); });
  /* No save-on-unload: every change is saved immediately. Another tab writing the same data is detected here and in MCStore.save. */
  window.addEventListener('storage', function (e) { if (e.key === S.KEY) { S.status.conflict = true; S.status.error = 'عُدّلت البيانات من تبويب/نافذة أخرى. أعد تحميل الصفحة (F5) قبل أي تعديل.'; App.renderStatus(); App.toast(S.status.error, 8000); } });
  var first = App.db.trainees.filter(function (t) { return !t.archived; })[0]; if (first) App.ui.traineeId = first.id;
  App.render();
})();
