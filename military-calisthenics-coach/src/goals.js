/* MCGoals — measurable goals (e.g. 60 push-ups / 60 sit-ups in 2 minutes, target body weight), goal training blocks,
 * fortnightly tests, honest projections, and motivation (ranks, streaks, achievements). Deterministic, DOM-free. */
(function (root) {
  'use strict';
  var KINDS = {
    pushup: { ar: 'ضغط', en: 'Push-ups', unit: 'reps', exId: 'PU-STD', timed: true },
    situp: { ar: 'بطن (جلوس كامل)', en: 'Sit-ups', unit: 'reps', exId: 'CR-SITUP', timed: true, alt: 'PL-FA' },
    pullup: { ar: 'عقلة', en: 'Pull-ups', unit: 'reps', exId: 'PV-PULLUP' },
    squat: { ar: 'سكوات', en: 'Squats', unit: 'reps', exId: 'SQ-BW', timed: true },
    plank: { ar: 'بلانك', en: 'Plank', unit: 'sec', exId: 'PL-FA' },
    walk: { ar: 'مشي/جري متواصل', en: 'Continuous walk/run', unit: 'min', exId: 'CA-WALK' },
    weight: { ar: 'الوصول إلى وزن', en: 'Reach body weight', unit: 'kg' }
  };
  var UNIT_AR = { reps: 'تكرار', sec: 'ثانية', min: 'دقيقة', kg: 'كجم' };
  /* local, conservative planning assumptions — NOT evidence-based promises */
  var RATE = { low: 0.04, high: 0.08 }, WL = { low: 0.5, high: 1.0 };

  function best(t, kind) { var l = (t.goalLog || []).filter(function (x) { return x.kind === kind; }); return l.length ? Math.max.apply(null, l.map(function (x) { return Number(x.value) || 0; })) : null; }
  function latest(t, kind) { var l = (t.goalLog || []).filter(function (x) { return x.kind === kind; }); return l.length ? l[l.length - 1] : null; }
  function current(t) {
    var g = t.goalTarget; if (!g) return null;
    if (g.kind === 'weight') { var w = latest(t, 'weight'); return w ? Number(w.value) : Number(t.weightKg) || null; }
    return best(t, g.kind);
  }
  /* Projection in weeks (range) — an estimate, labelled as such everywhere it is shown. */
  function project(t) {
    var g = t.goalTarget, c = current(t); if (!g || c == null) return null;
    if (g.kind === 'weight') { var diff = c - g.target; if (diff <= 0) return { done: true }; return { lo: Math.ceil(diff / WL.high), hi: Math.ceil(diff / WL.low) }; }
    if (c >= g.target) return { done: true }; if (c <= 0) return null;
    var w = function (r) { return Math.ceil(Math.log(g.target / c) / Math.log(1 + r)); };
    return { lo: w(RATE.high), hi: w(RATE.low) };
  }
  function percent(t) {
    var g = t.goalTarget, c = current(t); if (!g || c == null) return 0;
    if (g.kind === 'weight') { var start = Number(g.start) || c; if (start <= g.target) return 100; return Math.max(0, Math.min(100, Math.round((start - c) / (start - g.target) * 100))); }
    return Math.max(0, Math.min(100, Math.round(c / g.target * 100)));
  }
  function label(g) { var k = KINDS[g.kind]; return k.ar + ' ' + g.target + ' ' + UNIT_AR[k.unit] + (g.timed ? ' خلال دقيقتين' : ''); }
  function labelEn(g) { var k = KINDS[g.kind]; return k.en + ' ' + g.target + ' ' + k.unit + (g.timed ? ' in 2 minutes' : ''); }

  /* Add goal training (+ fortnightly test) to a generated plan. */
  function apply(plan, input, ctx, H) {
    var t = input.trainee, g = t.goalTarget; if (!g || plan.status === 'blocked') return plan;
    var K = KINDS[g.kind], EX = H.EX();
    plan.goal = { kind: g.kind, target: g.target, timed: !!g.timed };
    if (g.kind === 'weight') {
      var pj = project(t);
      plan.notes.push('هدفك: ' + label(g) + '. الطريق: مشي يومي تقريباً + تمارين قوة للحفاظ على العضلات + غذاء متوازن. المعدل الآمن المعتاد نحو 0.5–1 كجم أسبوعياً' + (pj && !pj.done ? '، أي تقريباً ' + pj.lo + '–' + pj.hi + ' أسبوعاً (تقدير وليس وعداً)' : '') + '. [CDC-WL]');
      return plan;
    }
    var ex = EX.byId(K.exId);
    var why = H.excludedBy(ex, ctx, { ignoreLevel: true });
    if (why) {
      plan.goal.blocked = why; var alt = K.alt && EX.byId(K.alt);
      plan.notes.push('هدف «' + label(g) + '» غير مناسب الآن: ' + why + (alt && !H.excludedBy(alt, ctx, { ignoreLevel: true }) ? '. بديل آمن: ' + alt.ar + '.' : '.'));
      return plan;
    }
    var b = current(t), weekNo = input.weekNo || 0, isTest = weekNo % 2 === 0;
    var useEx = ex, base = b;
    if (b == null || b < 3) { var ez = (ex.easier || []).map(function (id) { return EX.byId(id); }).filter(function (e) { return e && !H.excludedBy(e, ctx, { ignoreLevel: true }); })[0]; if (ez && K.unit === 'reps') { useEx = ez; base = 12; } }
    var unit = K.unit === 'sec' ? 'time' : K.unit === 'min' ? 'time' : 'reps';
    var tgt = K.unit === 'reps' ? Math.max(3, Math.round((base || 5) * 0.6)) : K.unit === 'sec' ? Math.max(15, Math.round((base || 20) * 0.6)) : Math.max(10, Math.round((base || 10) * 0.8)) * 60;
    var first = true;
    plan.days.forEach(function (d) {
      if (d.type !== 'train') return;
      if (isTest && first) {
        d.main.unshift({ slot: 'GOALTEST', exId: ex.id, step: 0, u: unit, sets: 1, target: g.target * (K.unit === 'min' ? 60 : 1), rest: 0, test: 1, goal: 1,
          why: ['🎯 اختبار الهدف (كل أسبوعين): ' + (g.timed ? 'أكبر عدد بأداء صحيح خلال دقيقتين' : 'أكبر عدد/مدة بأداء صحيح دون توقف') + '. توقف عند انكسار الأداء أو أي ألم. يُسجَّل تلقائياً كأفضل محاولة.'] });
        first = false;
      } else if (K.unit !== 'min') {
        d.main.push({ slot: 'GOAL', exId: useEx.id, step: 0, u: unit, sets: 4, target: tgt, rest: 75, goal: 1,
          why: ['🎯 تدريب الهدف: 4 مجموعات بنحو 60% من أفضل محاولة (' + (b == null ? 'لم تُختبر بعد' : b) + ')' + (useEx !== ex ? ' بتمرين تمهيدي أسهل حتى تتجاوز 3 تكرارات في الاختبار' : '') + '. قاعدة محلية تحفظية.'] });
      }
    });
    var pj2 = project(t);
    plan.notes.push('هدفك: ' + label(g) + '. أفضل محاولة: ' + (b == null ? 'لم تُختبر بعد — الاختبار هذا الأسبوع' : b) + (pj2 && !pj2.done ? ' — المدة المتوقعة تقريباً ' + pj2.lo + '–' + pj2.hi + ' أسبوعاً بافتراض تحسن 4–8% أسبوعياً (تقدير محلي وليس وعداً).' : pj2 && pj2.done ? ' — وصلت للهدف! 🎉' : '.'));
    return plan;
  }

  /* ---------- motivation ---------- */
  var RANKS = [[0, 'مستجد', 'Recruit'], [3, 'جندي', 'Private'], [10, 'جندي أول', 'Private First Class'], [20, 'عريف', 'Corporal'], [35, 'رقيب', 'Sergeant'], [55, 'رقيب أول', 'Staff Sergeant'], [80, 'ملازم', 'Lieutenant'], [110, 'نقيب', 'Captain'], [150, 'رائد', 'Major']];
  function rank(done) { var r = RANKS[0], nx = null; for (var i = 0; i < RANKS.length; i++) { if (done >= RANKS[i][0]) { r = RANKS[i]; nx = RANKS[i + 1] || null; } } return { ar: r[1], en: r[2], at: r[0], next: nx ? { ar: nx[1], en: nx[2], at: nx[0], left: nx[0] - done } : null, level: RANKS.indexOf(r) }; }
  function weekKey(iso) { var d = new Date(String(iso).slice(0, 10) + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); }
  /* consecutive weeks (ending this or last week) with at least 2 completed sessions */
  function streak(sessions, today) {
    var per = {}; sessions.filter(function (s) { return s.status === 'complete'; }).forEach(function (s) { var k = weekKey(s.endedAt || s.startedAt || s.date); per[k] = (per[k] || 0) + 1; });
    var k = weekKey(today), n = 0; if (!(per[k] >= 2)) { var d0 = new Date(k + 'T12:00:00Z'); d0.setUTCDate(d0.getUTCDate() - 7); k = d0.toISOString().slice(0, 10); }
    while (per[k] >= 2) { n++; var d = new Date(k + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - 7); k = d.toISOString().slice(0, 10); }
    return n;
  }
  function achievements(t, sessions) {
    var done = sessions.filter(function (s) { return s.status === 'complete'; }).length, out = [];
    var add = function (ok, ic, ar, en) { out.push({ ok: !!ok, ic: ic, ar: ar, en: en }); };
    add(done >= 1, '🎖', 'أول تمرين', 'First workout'); add(done >= 10, '🏅', '10 تمارين', '10 workouts'); add(done >= 30, '🏆', '30 تمريناً', '30 workouts');
    add(streak(sessions, new Date().toISOString()) >= 4, '🔥', '4 أسابيع متتالية', '4-week streak');
    if (t.goalTarget) { var p = percent(t); add(p >= 50, '⭐', 'نصف الطريق للهدف', 'Halfway to goal'); add(p >= 100, '👑', 'تحقق الهدف', 'Goal reached'); }
    return out;
  }
  var CHEERS = ['أحسنت! الالتزام يصنع الفرق.', 'خطوة أقرب لهدفك. استمر.', 'عمل ممتاز اليوم — اشرب ماء وارتح.', 'الانضباط أقوى من الحماس. أحسنت.', 'تمرين آخر في السجل. فخور بك.'];
  function cheer(n) { return CHEERS[n % CHEERS.length]; }

  root.MCGoals = { KINDS: KINDS, UNIT_AR: UNIT_AR, apply: apply, project: project, percent: percent, current: current, best: best, label: label, labelEn: labelEn, rank: rank, streak: streak, achievements: achievements, cheer: cheer, RANKS: RANKS };
})(typeof window !== 'undefined' ? window : globalThis);
