/* Exercise library, interactive animation player, rep counter, interval timer, audio cues. */
(function () {
  'use strict';
  var App = window.App, E = window.MCEngine, X = window.MCEX, A = window.MCAnim, esc = App.esc;
  var thumbCache = {};
  App.thumb = function (id, key) {
    var ex = X.byId(id); if (!ex) return '';
    var k = id + '|' + (key == null ? 'last' : key);
    if (!thumbCache[k]) thumbCache[k] = A.staticSVG(ex.anim, key == null ? Math.min(1, ex.anim.keys.length - 1) : key);
    return thumbCache[k];
  };

  /* ---------- audio (WebAudio, generated tones, no files) ---------- */
  var actx = null;
  App.beep = function (freq, ms, n) {
    if (App.ui.mute) return;
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    n = n || 1;
    for (var i = 0; i < n; i++) (function (i) {
      var o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + i * (ms / 1000 + 0.08);
      o.frequency.value = freq || 880; o.type = 'sine'; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
      o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + ms / 1000 + 0.02);
    })(i);
  };
  App.vibrate = function (p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { /* ignore */ } };

  /* ---------- player: mounts an animated figure with controls into a container ---------- */
  App.mountPlayer = function (box, ex, opts) {
    opts = opts || {};
    box.innerHTML = '<div class="stage"><div class="phase" aria-live="polite"></div></div><div class="ctl" role="group" aria-label="التحكم بالرسم المتحرك">' +
      '<button type="button" class="sec" data-p="play" aria-label="تشغيل/إيقاف">⏸</button><button type="button" class="sec" data-p="k0" title="وضع البداية">⏮ البداية</button><button type="button" class="sec" data-p="kN" title="وضع النهاية">النهاية ⏭</button>' +
      '<label class="sr" for="scrub_' + esc(ex.id) + '">موضع الحركة</label><input type="range" id="scrub_' + esc(ex.id) + '" min="0" max="1000" value="0" data-p="scrub" aria-label="موضع الحركة">' +
      '<select data-p="speed" aria-label="السرعة" style="width:auto"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="1.5">1.5×</option></select>' +
      '<button type="button" class="sec" data-p="mirror" title="عكس الاتجاه">⇋</button></div>';
    var stage = box.querySelector('.stage'), phase = box.querySelector('.phase');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var fig = new A.Figure(stage, ex.anim, { autoplay: !reduce && opts.autoplay !== false, title: ex.ar + ' — ' + ex.desc, onLabel: function (l) { phase.textContent = l; } });
    A.track(fig);
    var playBtn = box.querySelector('[data-p=play]'), scrub = box.querySelector('[data-p=scrub]');
    function sync() { playBtn.textContent = fig.playing ? '⏸' : '▶'; playBtn.setAttribute('aria-pressed', fig.playing ? 'true' : 'false'); }
    sync();
    var iv = setInterval(function () { if (!box.isConnected) { clearInterval(iv); return; } if (fig.playing) scrub.value = Math.round(fig.fraction() * 1000); }, 120);
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-p]'); if (!b) return;
      var p = b.dataset.p;
      if (p === 'play') { fig.playing = !fig.playing; sync(); }
      if (p === 'k0') { fig.playing = false; fig.seekKey(0); sync(); }
      if (p === 'kN') { fig.playing = false; fig.seekKey(Math.min(1, ex.anim.keys.length - 1)); sync(); }
      if (p === 'mirror') { fig.svg.classList.toggle('mc-mirror'); }
    });
    scrub.addEventListener('input', function () { fig.playing = false; sync(); fig.seekFraction(scrub.value / 1000); });
    box.querySelector('[data-p=speed]').addEventListener('change', function (e) { fig.speed = Number(e.target.value); });
    return fig;
  };

  /* ---------- rep counter + interval timer widget ---------- */
  App.counterWidget = function (id, preset) {
    preset = preset || {};
    return '<div class="counter" data-counter="' + esc(id) + '"><div class="card flat"><h4>عداد التكرارات (يدوي)</h4><div class="bignum" data-c="reps" aria-live="polite">0</div><div class="row" style="justify-content:center"><button type="button" class="bigbtn sec" data-c="minus" aria-label="إنقاص">−</button><button type="button" class="bigbtn" data-c="plus" aria-label="إضافة تكرار">+1</button><button type="button" class="ghost" data-c="reset">تصفير</button></div><p class="small muted">العد بالكاميرا غير متوفر. اضغط +1 أو مفتاح المسافة عند التركيز على الزر.</p></div>' +
      '<div class="card flat"><h4>مؤقت فترات</h4><div class="bignum" data-c="time" aria-live="off">00:00</div><div class="small" data-c="tlabel" style="text-align:center" aria-live="polite">جاهز</div><div class="grid g3"><label>عمل (ث)<input type="number" data-c="work" min="5" max="600" value="' + (preset.work || 30) + '"></label><label>راحة (ث)<input type="number" data-c="rest" min="0" max="600" value="' + (preset.rest || 30) + '"></label><label>جولات<input type="number" data-c="rounds" min="1" max="20" value="' + (preset.rounds || 3) + '"></label></div><div class="row" style="justify-content:center"><button type="button" data-c="start">بدء</button><button type="button" class="sec" data-c="pause">إيقاف مؤقت</button><button type="button" class="ghost" data-c="treset">إعادة</button><label style="margin:0"><input type="checkbox" data-c="mute"' + (App.ui.mute ? ' checked' : '') + '> كتم الصوت</label></div></div></div>';
  };
  App.bindCounter = function (root) {
    root.querySelectorAll('[data-counter]').forEach(function (w) {
      var reps = 0, st = { phase: 'idle', left: 0, round: 0, iv: null };
      var $ = function (k) { return w.querySelector('[data-c=' + k + ']'); };
      var num = function (k, d, lo, hi) { var v = Number($(k).value); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
      function show() { var m = Math.floor(st.left / 60), s = st.left % 60; $('time').textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
      function label(t) { $('tlabel').textContent = t; }
      function next() {
        var rounds = num('rounds', 3, 1, 20);
        if (st.phase === 'idle' || st.phase === 'rest') { st.round++; if (st.round > rounds) { stop(); label('انتهت الجولات ✔'); App.beep(660, 250, 3); App.vibrate([200, 100, 200]); return; } st.phase = 'work'; st.left = num('work', 30, 5, 600); label('عمل — الجولة ' + st.round + ' من ' + rounds); App.beep(988, 180, 1); }
        else { var r = num('rest', 30, 0, 600); if (!r) { st.phase = 'rest'; return next(); } st.phase = 'rest'; st.left = r; label('راحة — تنفس بهدوء'); App.beep(520, 300, 2); }
        App.vibrate(150); show();
      }
      function tick() { st.left--; if (st.left <= 3 && st.left > 0) App.beep(740, 90, 1); if (st.left <= 0) next(); else show(); }
      function stop() { clearInterval(st.iv); st.iv = null; }
      w.addEventListener('click', function (e) {
        var b = e.target.closest('[data-c]'); if (!b) return; var c = b.dataset.c;
        if (c === 'plus') { reps++; $('reps').textContent = reps; App.beep(1200, 50, 1); }
        if (c === 'minus') { reps = Math.max(0, reps - 1); $('reps').textContent = reps; }
        if (c === 'reset') { reps = 0; $('reps').textContent = 0; }
        if (c === 'start') { if (st.iv) return; if (st.phase === 'idle') { st.round = 0; next(); } st.iv = setInterval(function () { if (!w.isConnected) return stop(); tick(); }, 1000); }
        if (c === 'pause') { stop(); label('متوقف مؤقتاً'); }
        if (c === 'treset') { stop(); st = { phase: 'idle', left: 0, round: 0, iv: null }; show(); label('جاهز'); }
        if (c === 'mute') App.ui.mute = b.checked;
      });
    });
  };

  /* ---------- library page ---------- */
  App.pages.library = function () {
    var ui = App.ui, f = ui.lib || (ui.lib = { q: '', cat: '', pat: '', lvl: '', role: '', safe: false });
    var t = App.trainee(), ctx = null;
    if (t && f.safe) { var sc = App.latest('screenings', t.id), bl = App.latest('baselines', t.id); ctx = E.safetyContext(t, sc, bl, []); }
    var fams = {}; X.list.forEach(function (e) { fams[e.fam] = 1; });
    var h = '<h2>مكتبة التمارين</h2><p>تضم المكتبة <b>' + X.list.length + '</b> تمريناً/تنويعة، لكل منها سجل كامل ورسم متحرك أصلي خاص بها، ضمن <b>' + Object.keys(fams).length + '</b> عائلة حركية. العدد هو ما اكتمل وتحقق آلياً فقط؛ الهدف 200 لم يُبلغ بعد.</p>';
    var opt = function (obj, v) { return Object.keys(obj).map(function (k) { return '<option value="' + esc(k) + '"' + (String(v) === String(k) ? ' selected' : '') + '>' + esc(obj[k]) + '</option>'; }).join(''); };
    h += '<div class="card flat"><div class="grid g3"><label>بحث<input id="libq" value="' + esc(f.q) + '" placeholder="اسم عربي أو إنجليزي"></label><label>الفئة<select id="libcat"><option value="">الكل</option>' + opt(X.CAT, f.cat) + '</select></label><label>نمط الحركة<select id="libpat"><option value="">الكل</option>' + opt(X.PATTERN, f.pat) + '</select></label><label>المستوى<select id="liblvl"><option value="">الكل</option>' + opt(X.LEVEL, f.lvl) + '</select></label><label>الدور<select id="librole"><option value="">الكل</option>' + opt({ main: 'تمرين رئيسي', warmup: 'إحماء', cooldown: 'تهدئة' }, f.role) + '</select></label>' +
      '<label>' + (t ? '<input type="checkbox" id="libsafe"' + (f.safe ? ' checked' : '') + '> المسموح فقط لـ ' + esc(t.displayName) : '<span class="muted small">اختر متدرباً لتصفية المسموح له</span>') + '</label></div></div>';
    var list = X.list.filter(function (e) {
      if (f.q && (e.ar + ' ' + e.en + ' ' + e.id).toLowerCase().indexOf(f.q.toLowerCase()) < 0) return false;
      if (f.cat && e.cat !== f.cat) return false; if (f.pat && e.pat !== f.pat) return false; if (f.lvl && String(e.lvl) !== String(f.lvl)) return false; if (f.role && e.role.indexOf(f.role) < 0) return false;
      if (ctx && E.excludedBy(e, ctx, { ignoreLevel: true })) return false; return true;
    });
    h += '<p class="muted small" aria-live="polite">النتائج: ' + list.length + '</p>';
    if (!list.length) return h + '<div class="empty">لا توجد تمارين مطابقة.</div>';
    h += '<div class="grid">' + list.map(function (e) {
      return '<button class="excard" data-act="exOpen" data-id="' + esc(e.id) + '" aria-label="' + esc(e.ar) + ' — عرض التفاصيل"><div class="thumb">' + App.thumb(e.id) + '</div><h4>' + esc(e.ar) + '</h4><div class="small muted" dir="ltr" style="text-align:right">' + esc(e.en) + '</div><div><span class="pill">' + esc(X.LEVEL[e.lvl]) + '</span><span class="pill">' + esc(X.PATTERN[e.pat]) + '</span>' + (e.eq.length ? '<span class="pill">🧰 ' + esc(e.eq.map(function (q) { return X.EQUIP[q]; }).join('، ')) + '</span>' : '') + (e.impact === 'high' ? '<span class="pill">⤴ قفز</span>' : '') + (e.mil ? '<span class="pill">🎖 تدريب عسكري مسمّى</span>' : '') + '</div></button>';
    }).join('') + '</div>';
    return h;
  };
  ['libq', 'libcat', 'libpat', 'liblvl', 'librole', 'libsafe'].forEach(function (id) {
    App.changes[id] = function (el) { var k = { libq: 'q', libcat: 'cat', libpat: 'pat', liblvl: 'lvl', librole: 'role', libsafe: 'safe' }[id]; App.ui.lib[k] = el.type === 'checkbox' ? el.checked : el.value; App.render(); if (id === 'libq') { var i = App.$('#libq'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); } };
  });

  /* ---------- exercise detail dialog ---------- */
  App.acts.exOpen = function (el) { App.openExercise(el.dataset.id); };
  App.openExercise = function (id) {
    var ex = X.byId(id); if (!ex) return;
    var dlg = App.$('#exDialog');
    var refs = function (arr) { return arr.length ? arr.map(function (r) { var x = X.byId(r); return x ? '<button class="sec" data-act="exOpen" data-id="' + esc(r) + '">' + esc(x.ar) + ' <span class="small">(' + esc(X.LEVEL[x.lvl]) + ')</span></button>' : '<span class="pill">' + esc(r) + ' (غير متوفر)</span>'; }).join(' ') : '<span class="muted">—</span>'; };
    var d = ex.dose, dose = d.sets.join('–') + ' مجموعات × ' + (d.u === 'reps' ? d.reps.join('–') + ' تكرار' : d.sec.join('–') + ' ثانية') + (d.side ? ' لكل جانب' : '') + ' · راحة ' + d.rest.join('–') + ' ث' + (d.tempo ? ' · إيقاع ' + d.tempo : '');
    var t = App.trainee(), safety = '';
    if (t) { var ctx = E.safetyContext(t, App.latest('screenings', t.id), App.latest('baselines', t.id), []); var why = E.excludedBy(ex, ctx); safety = why ? '<div class="alert warn"><b>غير مناسب حالياً لـ ' + esc(t.displayName) + '</b>' + esc(why) + '</div>' : '<div class="alert ok small">مسموح ضمن قيود ' + esc(t.displayName) + ' الحالية.</div>'; }
    var srcs = ex.src.map(function (k) { var s = window.MCSRC.list.filter(function (x) { return x.key === k; })[0]; return '<span class="pill" title="' + esc(s ? s.title : k) + '">' + esc(k) + '</span>'; }).join('');
    App.$('#exTitle').textContent = ex.ar + ' · ' + ex.en;
    App.$('#exBody').innerHTML = '<div class="player"><div><div id="exPlayer"></div><p class="small muted">' + esc(ex.desc) + '</p><p class="small muted">الشكل الباهت = وضع البداية؛ الخط المنقط = مسار المفصل الرئيسي. الرسم أصلي ومولّد برمجياً (ليس صورة فوتوغرافية).</p></div><div>' + safety +
      '<p><span class="pill">' + esc(ex.id) + '</span><span class="pill">' + esc(X.LEVEL[ex.lvl]) + '</span><span class="pill">' + esc(X.CAT[ex.cat]) + '</span><span class="pill">' + esc(X.PATTERN[ex.pat]) + '</span><span class="pill">عائلة: ' + esc(ex.fam) + '</span></p>' +
      '<p><b>العضلات الأساسية:</b> ' + esc(ex.prim.map(function (m) { return X.MUSCLE[m]; }).join('، ')) + '<br><b>الثانوية:</b> ' + esc(ex.sec.map(function (m) { return X.MUSCLE[m]; }).join('، ') || '—') + '</p>' +
      '<p><b>المعدات:</b> ' + esc(ex.eq.length ? ex.eq.map(function (q) { return X.EQUIP[q]; }).join('، ') : 'بدون أدوات') + ' · <b>المساحة:</b> ' + esc(ex.space) + ' · <b>التأثير:</b> ' + esc({ none: 'بدون', low: 'منخفض', high: 'مرتفع (قفز)' }[ex.impact]) + '</p>' +
      '<p><b>الجرعة الافتراضية (قابلة للتعديل، ليست وصفة طبية):</b> ' + esc(dose) + '</p>' +
      (ex.mil ? '<p class="small"><b>🎖 مرجع عسكري:</b> ' + esc(ex.mil) + ' (الاسم فقط؛ الشرح بصياغة التطبيق)</p>' : '') +
      (ex.prereq ? '<p><b>المتطلب المسبق:</b> ' + esc(ex.prereq) + '</p>' : '') + '</div></div>' +
      '<div class="grid" style="margin-top:12px"><div class="card flat"><h4>وضع البداية</h4><p>' + esc(ex.setup) + '</p><h4>الخطوات</h4><ol class="steps">' + ex.steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol><p><b>التنفس:</b> ' + esc(ex.breath) + '</p></div>' +
      '<div class="card flat"><h4>أخطاء شائعة</h4><ul>' + ex.errors.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul><h4>أوقف التمرين إذا</h4><ul>' + ex.stop.concat(X.STOP_ALL).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="card flat"><h4>تنبيهات واعتماديات الفحص</h4><p>' + (ex.flags.length ? ex.flags.map(function (f) { return '<span class="pill">' + esc(X.FLAG[f]) + '</span>'; }).join('') : 'لا يوجد') + '</p><p class="small muted">تُستخدم هذه الوسوم لاستبعاد التمرين آلياً حسب الفحص (حمل، ما بعد الولادة، إصابات، قيود).</p><h4>أسهل</h4><p>' + refs(ex.easier) + '</p><h4>أصعب</h4><p>' + refs(ex.harder) + '</p><h4>بدائل أكثر أماناً</h4><p>' + refs(ex.subs) + '</p><p class="small"><b>أساس عام:</b> ' + srcs + '</p></div></div>' +
      App.counterWidget('ex_' + ex.id, { work: d.u === 'time' ? d.sec[0] : 40, rest: d.rest[0], rounds: d.sets[0] });
    App.mountPlayer(App.$('#exPlayer'), ex);
    App.bindCounter(App.$('#exBody'));
    if (!dlg.open) dlg.showModal();
    App.$('#exBody').scrollTop = 0;
  };
  App.acts.exClose = function () { App.$('#exDialog').close(); };
})();
