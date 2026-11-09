/* MCGym — weighted gym program (separate from bodyweight plans). Deterministic double progression:
 * all working sets reach the top of the rep range without pain/"too hard" → next week +load step (ACSM: 2–10 % when
 * the target is exceeded); a set below the bottom of the range or "too hard" → −1 step; otherwise same load, +1 rep. */
(function (root) {
  'use strict';
  var GROUPS = {
    squat: { ar: 'قرفصاء', p: ['squat'] }, hinge: { ar: 'مفصلة الورك', p: ['hinge', 'bridge'] }, lunge: { ar: 'ساق واحدة', p: ['lunge'] },
    push_h: { ar: 'دفع أفقي', p: ['push_h'] }, push_v: { ar: 'دفع للأعلى', p: ['push_v'] }, pull_h: { ar: 'سحب أفقي', p: ['pull_h'] }, pull_v: { ar: 'سحب علوي', p: ['pull_v'] },
    core: { ar: 'الجذع', p: ['core_rot', 'core_lat', 'core_ext', 'core_flex'] },
    shoulder_acc: { ar: 'صحة الكتف', ids: ['GY-FACEPULL', 'GY-DB-LATRAISE'] }, arms: { ar: 'الذراعان', ids: ['GY-DB-CURL', 'GY-PUSHDOWN'] }, legs_acc: { ar: 'تكميلي للساقين', ids: ['GY-LEGCURL', 'GY-LEGEXT', 'GY-DB-CALF'] }
  };
  var TEMPLATES = {
    A: ['squat', 'push_h', 'pull_v', 'hinge', 'core', 'arms', 'shoulder_acc'],
    B: ['hinge', 'push_v', 'pull_h', 'lunge', 'core', 'legs_acc', 'shoulder_acc'],
    U: ['push_h', 'pull_h', 'push_v', 'pull_v', 'shoulder_acc', 'arms', 'core'],
    L: ['squat', 'hinge', 'lunge', 'legs_acc', 'core', 'legs_acc']
  };
  function sideAr(x) { return x === 'left' ? 'اليسرى' : 'اليمنى'; }

  /* Previous working load and outcome for an exercise from the most recent sessions. */
  function lastPerformance(exId, sessions) {
    var list = (sessions || []).filter(function (s) { return s.status !== 'stopped'; }).slice().sort(function (a, b) { return (a.startedAt || '') < (b.startedAt || '') ? 1 : -1; });
    for (var i = 0; i < list.length; i++) {
      var it = (list[i].items || []).filter(function (x) { return x.exId === exId && (x.sets || []).length; })[0];
      if (it) {
        var loads = it.sets.map(function (x) { return Number(x.load) || 0; }).filter(function (v) { return v > 0; });
        return { load: loads.length ? Math.max.apply(null, loads) : null, reps: it.sets.map(function (x) { return Number(x.value) || 0; }), range: it.prescribed && it.prescribed.repRange, rate: it.rate || '', pain: Number(it.pain) || 0, setsPlanned: it.prescribed ? it.prescribed.sets : it.sets.length };
      }
    }
    return null;
  }
  function progress(ex, perf, lo, hi) {
    var inc = ex.load.inc, why;
    if (!perf || !perf.load) return { load: null, target: hi, why: 'الأسبوع الأول لهذا التمرين: ' + ex.load.start };
    var allTop = perf.reps.length >= perf.setsPlanned && perf.reps.every(function (r) { return r >= hi; });
    var below = perf.reps.some(function (r) { return r < lo; });
    if (perf.pain >= 4) return { load: Math.max(0, perf.load - inc), target: lo, why: 'ألم في المرة الماضية: الوزن أقل بخطوة (' + inc + ' كجم) — إن تكرر الألم استبدل التمرين.' };
    if (allTop && perf.rate !== 'hard') return { load: perf.load + inc, target: lo, why: 'أكملت ' + hi + ' تكراراً في كل المجموعات: الوزن +' + inc + ' كجم والعدد يبدأ من ' + lo + '. [ACSM-RT]' };
    if (below || perf.rate === 'hard') return { load: Math.max(0, perf.load - inc), target: lo, why: 'كان الوزن ثقيلاً (أقل من ' + lo + ' أو «صعب جداً»): الوزن أقل بخطوة.' };
    var best = Math.min.apply(null, perf.reps);
    return { load: perf.load, target: Math.min(hi, Math.max(lo, best + 1)), why: 'نفس الوزن (' + perf.load + ' كجم) وحاول زيادة تكرار واحد في كل مجموعة.' };
  }

  function build(plan, input, ctx, H) {
    var t = input.trainee, EX = H.EX(), why = plan.notes, minutes = Math.max(20, Math.min(90, Number(t.minutes) || 45));
    var gl = Math.max(1, Math.min(3, Number(t.gymLevel) || 1));
    ctx.levels = { push: gl, squat: gl, core: gl, pull: gl, aerobic: ctx.levels.aerobic || 1, balance: ctx.levels.balance || 2 };
    var avail = (t.days && t.days.length ? t.days : [0, 2, 4]).map(Number), n = Math.min(avail.length, gl === 1 ? 3 : 4);
    var trainDows = H.chooseDays(avail, n), split = n >= 4 ? ['U', 'L'] : ['A', 'B'];
    var nSlots = minutes <= 30 ? 4 : minutes <= 45 ? 5 : minutes <= 60 ? 6 : 7;
    var setsBy = { 1: function (d) { return d.sets[0]; }, 2: function (d) { return Math.min(d.sets[1], d.sets[0] + 1); }, 3: function (d) { return d.sets[1]; } };
    var rirBy = { 1: 3, 2: 2, 3: 2 };
    why.push('برنامج صالة بالأوزان (منفصل عن تمارين وزن الجسم): ' + n + ' أيام، تقسيم ' + (n >= 4 ? 'علوي/سفلي' : 'جسم كامل A/B') + '، خبرة بالأوزان مستوى ' + gl + '. [ACSM-RT, ACSM-RT26]');
    why.push('طريقة التقدم: عندما تكمل أعلى عدد تكرارات في كل المجموعات يزيد الوزن خطوة في الأسبوع التالي؛ وإذا كان ثقيلاً ينقص خطوة. اترك ' + rirBy[gl] + ' تكرارات احتياطاً في كل مجموعة (لا تصل للفشل). [ACSM-RT, ACSM-RT26]');
    if (ctx.bmi) why.push('مؤشر كتلة الجسم ≈ ' + ctx.bmi.toFixed(1) + '. هو مؤشر تقريبي لا يقيس اللياقة.');
    var used = {}, assign = {};
    function pick(group, key) {
      if (assign[key]) return assign[key];
      var g = GROUPS[group];
      var cands = H.allowedList(ctx, function (e) { return e.mode === 'gym' && e.role.indexOf('main') >= 0 && (g.ids ? g.ids.indexOf(e.id) >= 0 : g.p.indexOf(e.pat) >= 0); });
      var prevAct = input.decision && input.decision.items ? Object.keys(input.decision.items).map(function (k) { return input.decision.items[k]; }).filter(function (x) { return x.slot === key && x.action === 'substitute'; })[0] : null;
      var prev = null; if (input.prevPlan) input.prevPlan.days.forEach(function (d) { (d.main || []).forEach(function (it) { if (it.slot === key) prev = it; }); });
      var keep = prev && !prevAct && cands.filter(function (c) { return c.id === prev.exId; })[0];
      var ch = keep || null;
      if (!ch) {
        var pool = cands.filter(function (c) { return !used[c.id] && (!prevAct || c.id !== prevAct.exId); });
        if (!pool.length) return null;
        var top = Math.max.apply(null, pool.map(function (c) { return c.lvl; }));
        var best = pool.filter(function (c) { return c.lvl === top; });
        ch = best[H.hash(t.id + key) % best.length];
      }
      used[ch.id] = 1; assign[key] = ch; return ch;
    }
    var trainIdx = 0;
    for (var i = 0; i < 7; i++) {
      var date = H.addDays(input.weekStart, i), dw = H.dow(date), day = { index: i, date: date, dow: dw, dowAr: H.DOW_AR[dw] };
      if (trainDows.indexOf(dw) >= 0) {
        var tp = split[trainIdx % 2]; trainIdx++;
        day.type = 'train'; day.template = tp; day.place = 'gym';
        var items = [];
        TEMPLATES[tp].slice(0, nSlots).forEach(function (grp, k) {
          var key = tp + k + '-' + grp, ex = pick(grp, key);
          if (!ex) { why.push('«' + GROUPS[grp].ar + '» في يوم ' + tp + ': لا يوجد تمرين مناسب لمعداتك وقيود السلامة — حُذف.'); return; }
          var d = ex.dose, isT = d.u === 'time', range = isT ? d.sec : d.reps, lo = range[0], hi = range[1], perf = lastPerformance(ex.id, input.sessions);
          var pr = isT ? { load: perf && perf.load || null, target: hi, why: 'تمرين بالمدة: ' + hi + ' ثانية بوزن تتحكم به جيداً. ' + (perf && perf.load ? 'نفس وزن المرة الماضية (' + perf.load + ' كجم).' : ex.load.start) } : progress(ex, perf, lo, hi);
          var it = { slot: key, exId: ex.id, step: 0, u: isT ? 'time' : 'reps', sets: setsBy[gl](d), target: pr.target, repRange: isT ? null : [lo, hi], rest: gl === 1 ? d.rest[0] + 15 : d.rest[1], side: !!d.side, load: pr.load, inc: ex.load.inc, rir: rirBy[gl], gym: 1, why: [pr.why] };
          var weak = (t.weakArm !== 'none' && t.weakArm && (grp === 'pull_h' || grp === 'push_h' || grp === 'arms') && it.side) ? { limb: 'arm', side: t.weakArm } : (t.weakLeg !== 'none' && t.weakLeg && grp === 'lunge' && it.side) ? { limb: 'leg', side: t.weakLeg } : null;
          if (weak) { it.weak = weak; it.why.unshift('الجانب الأضعف: ابدأ بالجهة ' + sideAr(weak.side) + ' وأعطها مجموعة إضافية.'); }
          items.push(it);
        });
        day.main = items;
        day.warmup = H.pickBlock(ctx, 'warmup', t.id + date, 3, ['CA-MARCH', 'MO-CATCAMEL', 'MO-HIPCIRCLE']);
        day.cooldown = H.pickBlock(ctx, 'cooldown', t.id + date, 4, ['ST-HIPFLEX', 'ST-CHEST']);
        day.note = 'قبل أول تمرين: مجموعتا إحماء خفيفتان (نحو 40% ثم 70% من وزن العمل). بعد التمرين: إطالة للمرونة.';
        day.estMinutes = Math.round(items.reduce(function (s, x) { return s + x.sets * ((x.u === 'time' ? x.target : x.target * 4) * (x.side ? 2 : 1) + x.rest); }, 0) / 60) + 14;
      } else if (avail.indexOf(dw) >= 0) {
        var outdoor = t.place === 'both' || t.place === 'gym';
        var wex = EX.byId(outdoor ? 'CA-WALK' : 'CA-MARCH'), wm = H.walkMinutesFor(t, input.prevPlan, input.decision);
        day.type = 'recovery'; day.place = outdoor ? 'outdoor' : 'home'; day.main = [];
        day.recovery = wex && !H.excludedBy(wex, ctx, { ignoreLevel: true }) ? [{ exId: wex.id, u: 'time', sets: 1, target: wm * 60, rest: 0, walk: 1, why: ['يوم استشفاء: مشي ' + wm + ' دقيقة بإيقاع مريح لتحسين اللياقة والتعافي. [PAG2018]'] }] : [];
        day.cooldown = H.pickBlock(ctx, 'cooldown', t.id + date + 'r', 3, []);
        day.estMinutes = wm + 5;
      } else { day.type = 'rest'; day.main = []; }
      plan.days.push(day);
    }
    if (!plan.days.some(function (d) { return d.type === 'rest'; })) { var last = plan.days.filter(function (d) { return d.type === 'recovery'; }).pop(); if (last) { last.type = 'rest'; last.recovery = []; last.cooldown = []; } }
    return plan;
  }
  root.MCGym = { build: build, progress: progress, lastPerformance: lastPerformance, GROUPS: GROUPS, TEMPLATES: TEMPLATES };
})(typeof window !== 'undefined' ? window : globalThis);
