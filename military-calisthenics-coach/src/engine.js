/* MCEngine — deterministic, versioned, explainable weekly plan rules (NOT machine learning). DOM-free. */
(function (root) {
  'use strict';
  var RULES = 'RULES-5.0.0';
  var BASELINE_VERSION = 'BL-5.0.0';
  var EX = function () { return root.MCEX; };

  /* ---------- baseline (sub-maximal; stop at form break, pain, effort ≥ 7/10 or the cap) ---------- */
  var TESTS = [
    { id: 'push', ar: 'الدفع', u: 'reps', cap: 20, variants: ['PU-WALL', 'PU-INCL', 'PU-KNEE', 'PU-STD'], hint: 'اختر أصعب نسخة يستطيع أداءها بتقنية جيدة. عُدّ التكرارات الصحيحة حتى تنكسر التقنية أو يبلغ الجهد 7/10 أو 20 تكراراً — أيها أسبق. ليس اختباراً أقصى.' },
    { id: 'squat', ar: 'الساقان', u: 'reps', cap: 25, variants: ['SQ-CHAIR', 'SQ-BOX', 'SQ-BW'], hint: 'تكرارات صحيحة حتى انكسار التقنية أو جهد 7/10 أو 25 تكراراً.' },
    { id: 'core', ar: 'الجذع', u: 'time', cap: 60, variants: ['PL-INCL', 'PL-KNEE', 'PL-FA'], hint: 'ثوانٍ بوضعية صحيحة وتنفس منتظم حتى 60 ثانية. أوقف عند هبوط الحوض أو حبس النفس.' },
    { id: 'pull', ar: 'السحب', u: 'reps', cap: 12, optional: true, variants: ['PH-DOOR', 'PH-TABLE', 'PH-INV', 'PV-PULLUP'], hint: 'اختياري حسب المعدات. تكرارات صحيحة حتى 12. تحقق من ثبات الطاولة/العارضة أولاً.' },
    { id: 'aerobic', ar: 'التحمل', u: 'min', cap: 20, variants: ['CA-MARCH', 'CA-WALK'], hint: 'دقائق مشي/مشي في المكان بإيقاع يسمح بالكلام (اختبار الكلام) حتى 20 دقيقة.' },
    { id: 'balance', ar: 'التوازن', u: 'time', cap: 30, variants: ['BA-SLSTAND'], hint: 'ثوانٍ على ساق واحدة (الأقل بين الساقين) حتى 30 ثانية، بجانب حائط للأمان.' }
  ];
  var PATTERN_TEST = { push_h: 'push', push_v: 'push', pull_h: 'pull', pull_v: 'pull', scap: 'pull', back_ext: 'core', squat: 'squat', hinge: 'squat', lunge: 'squat', bridge: 'squat', calf: 'squat', hip_abd: 'squat',
    core_ext: 'core', core_lat: 'core', core_rot: 'core', core_flex: 'core', locomotion: 'aerobic', cardio: 'aerobic', plyo: 'aerobic', balance: 'balance', mobility: null, stretch: null, breathing: null };

  function testLevel(test, r) {
    if (!r || r.skipped) return { level: 1, note: 'لم يُجرَ — المستوى الافتراضي 1' };
    var vi = test.variants.indexOf(r.variant), v = Number(r.value) || 0, L = 1;
    if (test.id === 'push') L = vi === 3 && v >= 10 ? 3 : (vi === 3 && v >= 3) || (vi === 2 && v >= 10) ? 2 : 1;
    if (test.id === 'squat') L = vi === 2 && v >= 20 ? 3 : (vi === 2 && v >= 10) || (vi === 1 && v >= 15) ? 2 : 1;
    if (test.id === 'core') L = vi === 2 && v >= 45 ? 3 : (vi === 2 && v >= 20) || (vi === 1 && v >= 40) ? 2 : 1;
    if (test.id === 'pull') L = (vi === 3 && v >= 3) || (vi === 2 && v >= 12) ? 3 : (vi >= 2 && v >= 5) || (vi === 1 && v >= 8) ? 2 : 1;
    if (test.id === 'aerobic') L = v >= 20 && r.talk !== 'no' ? 2 : 1;
    if (test.id === 'balance') L = v >= 30 ? 2 : 1;
    var notes = [];
    if (r.technique === 'poor') { L = Math.max(1, L - 1); notes.push('تقنية ضعيفة: −1'); }
    if (r.technique === 'fair' && L > 2) { L = 2; notes.push('تقنية متوسطة: حد أقصى 2'); }
    if (Number(r.effort) >= 9) { L = Math.max(1, L - 1); notes.push('جهد ≥ 9: −1'); }
    if (Number(r.pain) >= 4) { L = 1; notes.push('ألم ≥ 4 أثناء الاختبار: مستوى 1 وتوصية بتقييم'); }
    return { level: L, note: notes.join('؛ ') };
  }
  /* Returns {levels:{push..}, notes, flags[], status:'ok'|'refer'|'caution'} */
  function evaluateBaseline(results, trainee) {
    var levels = {}, notes = {}, flags = [], status = 'ok', msgs = [];
    TESTS.forEach(function (t) {
      var r = results[t.id], x = testLevel(t, r);
      var L = x.level;
      if (trainee && trainee.experience === 'beginner' && L > 2) { L = 2; x.note = (x.note ? x.note + '؛ ' : '') + 'خبرة مبتدئ: حد أقصى 2 في الأسبوع الأول'; }
      levels[t.id] = L; notes[t.id] = x.note;
      if (r && Number(r.pain) >= 7) { status = 'refer'; msgs.push('ألم ' + r.pain + '/10 أثناء اختبار ' + t.ar + ': أوقف التقييم وأحِل لمختص.'); }
      else if (r && Number(r.pain) >= 4) { status = status === 'refer' ? status : 'caution'; if (r.painArea) flags.push(r.painArea); msgs.push('ألم أثناء اختبار ' + t.ar + ': تُستبعد التمارين المحمِّلة للمنطقة ويوصى بالتقييم.'); }
      if (r && r.symptom === 'yes') { status = 'refer'; msgs.push('عرض إنذار أثناء الاختبار (' + t.ar + '): لا تُصدر خطة.'); }
    });
    return { levels: levels, notes: notes, flags: flags, status: status, messages: msgs, version: BASELINE_VERSION };
  }

  /* ---------- helpers ---------- */
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
  function addDays(iso, n) { var d = new Date(iso + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function dow(iso) { return new Date(iso + 'T12:00:00Z').getUTCDay(); }
  var DOW_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var SOFT_EQ = { mat: 1 };

  /* Context of everything that limits exercise choice for this trainee this week. */
  function safetyContext(trainee, screening, baseline, extraFlags) {
    var flags = {};
    ((screening && screening.outcome && screening.outcome.exclusions && screening.outcome.exclusions.flags) || []).forEach(function (f) { flags[f] = 1; });
    (trainee.limitations || []).forEach(function (f) { flags[f] = 1; if (f === 'shoulder') flags.overhead = 1; });
    ((baseline && baseline.result && baseline.result.flags) || []).forEach(function (f) { flags[f] = 1; });
    (extraFlags || []).forEach(function (f) { flags[f] = 1; });
    var age = Number(trainee.age);
    if (age >= 65) flags.impact = 1; /* local conservative rule */
    var maxLevel = (screening && screening.outcome && screening.outcome.exclusions && screening.outcome.exclusions.maxLevel) || 3;
    var eq = {}; (trainee.equipment || []).forEach(function (e) { eq[e] = 1; });
    return { flags: flags, maxLevel: maxLevel, eq: eq, levels: (baseline && baseline.result && baseline.result.levels) || {}, avoid: trainee.avoid || [], pathway: screening && screening.outcome && screening.outcome.pathway };
  }
  /* Is exercise allowed? returns '' if allowed, or the Arabic reason it is excluded. */
  function excludedBy(ex, ctx, opts) {
    opts = opts || {};
    if (ctx.avoid.indexOf(ex.id) >= 0) return 'مستبعد يدوياً من المدرب';
    for (var i = 0; i < ex.eq.length; i++) if (!ctx.eq[ex.eq[i]] && !SOFT_EQ[ex.eq[i]]) return 'يتطلب: ' + (EX().EQUIP[ex.eq[i]] || ex.eq[i]);
    for (var j = 0; j < ex.flags.length; j++) if (ctx.flags[ex.flags[j]]) return 'مستبعد للسلامة: ' + (EX().FLAG[ex.flags[j]] || ex.flags[j]);
    if (ex.lvl > ctx.maxLevel) return 'أعلى من الحد المسموح بالفحص (' + ctx.maxLevel + ')';
    if (!opts.ignoreLevel) { var t = PATTERN_TEST[ex.pat]; var L = t ? (ctx.levels[t] || 1) : 3; if (ex.lvl > L) return 'أعلى من مستوى المتدرب في هذا النمط (' + L + ')'; }
    return '';
  }
  function allowedList(ctx, pred, opts) { return EX().list.filter(function (e) { return pred(e) && !excludedBy(e, ctx, opts); }); }

  /* ---------- dose ---------- */
  function doseFor(ex, step, goal, pathway) {
    var d = ex.dose, s = Math.max(0, Math.min(4, step | 0));
    var sets = d.sets[0]; if (s >= 2) sets = Math.min(d.sets[1], d.sets[0] + 1); if (s >= 4) sets = d.sets[1];
    var range = d.u === 'reps' ? d.reps : d.sec, delta = Math.max(1, Math.round((range[1] - range[0]) / 4));
    var target = Math.min(range[1], range[0] + s * delta);
    var rest = goal === 'strength' || pathway === 'pregnancy' ? d.rest[1] : goal === 'endurance' || goal === 'weight' ? d.rest[0] : Math.round((d.rest[0] + d.rest[1]) / 2);
    rest = Math.round(rest / 5) * 5;
    return { u: d.u, sets: sets, target: target, rest: rest, side: !!d.side, step: s };
  }
  function itemSeconds(it) { var work = it.u === 'reps' ? it.target * 4 : it.target; if (it.side) work *= 2; return it.sets * (work + it.rest); }

  /* ---------- slot templates ---------- */
  var SLOTS = {
    A: [{ k: 'A1', p: ['squat'] }, { k: 'A2', p: ['push_h'] }, { k: 'A3', p: ['pull_h', 'pull_v', 'scap'] }, { k: 'A4', p: ['core_ext'] }, { k: 'A5', p: ['lunge', 'calf'] }, { k: 'A6', p: ['core_lat', 'core_rot'] }, { k: 'A7', p: ['cardio', 'locomotion', 'plyo'], cond: 1 }],
    B: [{ k: 'B1', p: ['hinge', 'bridge'] }, { k: 'B2', p: ['push_v', 'push_h'] }, { k: 'B3', p: ['pull_h', 'pull_v', 'scap', 'back_ext'] }, { k: 'B4', p: ['core_flex', 'core_rot', 'back_ext'] }, { k: 'B5', p: ['lunge', 'hip_abd'] }, { k: 'B6', p: ['core_ext', 'core_lat'] }, { k: 'B7', p: ['cardio', 'locomotion', 'plyo'], cond: 1 }]
  };
  function slotsFor(type, trainee, minutes) {
    var n = minutes <= 20 ? 4 : minutes <= 30 ? 5 : minutes <= 45 ? 6 : 7, goal = trainee.goal;
    if (goal === 'mobility') n = Math.max(4, n - 1);
    var s = SLOTS[type].slice(0, n);
    if ((goal === 'endurance' || goal === 'weight') && !s.some(function (x) { return x.cond; })) s[s.length - 1] = SLOTS[type][6];
    if (Number(trainee.age) >= 65) { var bi = s.length - 1; while (bi > 0 && s[bi].cond) bi--; s[bi] = { k: type + 'BAL', p: ['balance'], bal: 1 }; }
    return s;
  }

  /* Choose training days: maximise the smallest gap between chosen days (circular week), deterministic. */
  function chooseDays(avail, n) {
    avail = avail.slice().sort(function (a, b) { return a - b; });
    if (n >= avail.length) return avail;
    var best = null, bestGap = -1;
    (function rec(start, picked) {
      if (picked.length === n) {
        var gap = 99; for (var i = 0; i < n; i++) { var a = picked[i], b = picked[(i + 1) % n]; var g = (b - a + 7) % 7 || 7; gap = Math.min(gap, g); }
        if (gap > bestGap) { bestGap = gap; best = picked.slice(); } return;
      }
      for (var j = start; j < avail.length; j++) { picked.push(avail[j]); rec(j + 1, picked); picked.pop(); }
    })(0, []);
    return best;
  }

  /* ---------- plan generation ---------- */
  /* input: {trainee, screening, baseline, prevPlan, decision, weekStart, planId} → plan object (not saved). */
  function generatePlan(input) {
    var t = input.trainee, sc = input.screening, bl = input.baseline, dec = input.decision, why = [], blockers = [];
    var plan = { id: input.planId, traineeId: t.id, weekStart: input.weekStart, weekEnd: addDays(input.weekStart, 6), createdAt: input.now || new Date().toISOString(), ruleVersion: RULES,
      screeningId: sc ? sc.id : null, baselineId: bl ? bl.id : null, prevPlanId: input.prevPlan ? input.prevPlan.id : null, decisionFrom: dec ? dec.reviewId || null : null,
      status: 'active', blockers: blockers, notes: why, days: [], overrides: [], revisions: [], pathway: 'general', coachName: t.coachName || '', traineeName: t.displayName };
    if (!sc) blockers.push('لا يوجد فحص صحي مسجل. أكمل الفحص أولاً.');
    else if (sc.outcome.status === 'refer') blockers.push('نتيجة الفحص: إحالة — لا تُصدر خطة تلقائية حتى تقييم مختص وفحص جديد.');
    else if (sc.outcome.status === 'more_info') blockers.push('نتيجة الفحص: تحتاج معلومات/تصريحاً موثقاً قبل إصدار خطة.');
    if (sc && !bl) blockers.push('لا يوجد تقييم أساسي للقدرات. أجرِ التقييم الأساسي (دون اختبار أقصى) بعد السماح بالفحص.');
    if (bl && bl.result.status === 'refer') blockers.push('التقييم الأساسي أظهر ألماً شديداً أو عرض إنذار: إحالة.');
    if (bl && sc && bl.at < sc.at && sc.outcome.status === 'cleared' && input.requireFreshBaseline) blockers.push('أُجري فحص جديد بعد التقييم الأساسي: أعد التقييم.');
    var referResolved = dec && dec.overall === 'refer' && sc && sc.at > (dec.at || '') && sc.outcome.status === 'cleared' && sc.clearance && sc.clearance.by;
    if (dec && dec.overall === 'refer' && !referResolved) blockers.push('مراجعة الأسبوع السابق انتهت بإحالة: ' + dec.reasons.filter(function (r) { return r.level === 'refer'; }).map(function (r) { return r.text; }).join(' ') + ' — يلزم فحص جديد بعد المراجعة مع تصريح مختص موثق.');
    if (blockers.length) { plan.status = 'blocked'; return plan; }

    plan.pathway = sc.outcome.pathway;
    plan.tempFlagsIn = dec && !referResolved ? (dec.tempFlags || []) : [];
    var ctx = safetyContext(t, sc, bl, plan.tempFlagsIn);
    var minutes = Math.max(15, Math.min(90, Number(t.minutes) || 30));
    var avail = (t.days && t.days.length ? t.days : [0, 2, 4]).map(Number);
    var levels = ctx.levels, overall = Math.round(((levels.push || 1) + (levels.squat || 1) + (levels.core || 1)) / 3);
    var cap = overall <= 1 ? 3 : 4;
    var nTrain = Math.min(avail.length, cap);
    var trainDows = chooseDays(avail, nTrain);
    why.push('أيام التدريب: ' + nTrain + ' من ' + avail.length + ' أيام متاحة (حد ' + cap + ' للمستوى العام ' + overall + ')، موزعة لتعظيم أيام الراحة بينها. [ACSM-RT, NIA]');
    if (nTrain < 2) why.push('تنبيه: أقل من يومين تقوية أسبوعياً لا يحقق التوصية (يومان على الأقل). [PAG2018, ACSM-RT26]');
    why.push('مدة الحصة المتاحة ' + minutes + ' دقيقة ⇒ ' + slotsFor('A', t, minutes).length + ' تمارين رئيسية.');
    if (plan.pathway !== 'general') why.push('مسار ' + (plan.pathway === 'pregnancy' ? 'الحمل' : 'ما بعد الولادة') + ': تُطبَّق استبعادات الفحص. [ACOG804, GOOM2019]');
    if (Number(t.age) >= 65) why.push('العمر ≥ 65: إضافة تمرين توازن لكل حصة واستبعاد القفز (قاعدة محلية). [PAG2018]');
    if (dec) why.push('قرار المراجعة السابقة: ' + (DECISION_AR[dec.overall] || dec.overall) + '.');

    /* previous assignment per slot */
    var prevBySlot = {};
    if (input.prevPlan && input.prevPlan.status !== 'blocked') input.prevPlan.days.forEach(function (d) { (d.main || []).forEach(function (it) { prevBySlot[it.slot] = it; }); });
    var actions = (dec && dec.items) || {};
    var used = {};
    var assign = {};
    function pick(slot) {
      if (assign[slot.k]) return assign[slot.k];
      var cands = allowedList(ctx, function (e) { return e.role.indexOf('main') >= 0 && slot.p.indexOf(e.pat) >= 0; });
      var prev = prevBySlot[slot.k], act = prev ? actions[slot.k + '|' + prev.exId] : null, out = null, reason = [];
      var inC = function (id) { return cands.filter(function (c) { return c.id === id; })[0]; };
      if (prev && inC(prev.exId)) {
        var ex = inC(prev.exId), step = prev.step;
        var a = act ? act.action : 'maintain';
        if (a === 'progress') {
          if (step < 4) { step++; reason.push('تقدم بخطوة جرعة واحدة: ' + act.why); }
          else { var h = (ex.harder || []).map(inC).filter(Boolean)[0]; if (h) { ex = h; step = 0; reason.push('انتقال للبديل الأصعب بعد بلوغ أعلى جرعة: ' + act.why); } else reason.push('أعلى جرعة ولا يوجد بديل أصعب مسموح: تثبيت.'); }
        } else if (a === 'reduce') {
          if (step > 0) { step--; reason.push('تخفيف خطوة جرعة: ' + act.why); }
          else { var ez = (ex.easier || []).map(function (id) { return EX().byId(id); }).filter(function (e) { return e && !excludedBy(e, ctx, { ignoreLevel: true }); })[0]; if (ez) { ex = ez; step = 2; reason.push('الانتقال لبديل أسهل: ' + act.why); } else reason.push('أدنى جرعة: تثبيت مع مراقبة. ' + act.why); }
        } else if (a === 'substitute') {
          var sb = (ex.easier || []).concat(ex.subs || []).map(function (id) { return EX().byId(id); }).filter(function (e) { return e && e.id !== ex.id && !excludedBy(e, ctx, { ignoreLevel: true }) && slot.p.indexOf(e.pat) >= 0; })[0];
          if (sb) { ex = sb; step = 0; reason.push('استبدال: ' + act.why); } else { ex = null; reason.push('لا بديل آمن للاستبدال: ' + act.why); }
        } else reason.push(act ? 'تثبيت: ' + act.why : 'استمرار التمرين نفسه للمقارنة الأسبوعية.');
        if (ex) out = { ex: ex, step: step, reason: reason };
      } else if (prev && !inC(prev.exId)) {
        reason.push('التمرين السابق (' + prev.exId + ') لم يعد مسموحاً: ' + (excludedBy(EX().byId(prev.exId) || { eq: [], flags: [], lvl: 1, id: prev.exId }, ctx) || 'تغير السياق'));
      }
      if (!out) {
        var banned = prev && act && (act.action === 'substitute') ? prev.exId : null;
        var pool = cands.filter(function (c) { return !used[c.id] && c.id !== banned; });
        if (!pool.length) return null;
        var top = Math.max.apply(null, pool.map(function (c) { return c.lvl; }));
        var best = pool.filter(function (c) { return c.lvl === top; });
        var ch = best[hash(t.id + slot.k) % best.length];
        var tr = bl && bl.tests ? Object.keys(bl.tests).map(function (k) { return bl.tests[k]; }).filter(function (r) { return r && r.variant === ch.id && !r.skipped; })[0] : null;
        var st = 0;
        if (tr) { for (var s = 4; s >= 0; s--) { if (doseFor(ch, s).target <= 0.6 * Number(tr.value)) { st = s; break; } } reason.push('الجرعة الأولى ≈ 60% أو أقل من نتيجة التقييم الأساسي (' + tr.value + ').'); }
        reason.push('اختير لأنه أعلى مستوى مسموح (' + EX().LEVEL[top] + ') لنمط «' + EX().PATTERN[ch.pat] + '» ضمن المعدات وقيود السلامة.');
        out = { ex: ch, step: st, reason: reason };
      }
      used[out.ex.id] = 1;
      assign[slot.k] = out;
      return out;
    }

    var trainIdx = 0;
    for (var i = 0; i < 7; i++) {
      var date = addDays(input.weekStart, i), dw = dow(date), day = { index: i, date: date, dow: dw, dowAr: DOW_AR[dw] };
      if (trainDows.indexOf(dw) >= 0) {
        var type = trainIdx % 2 === 0 ? 'A' : 'B'; trainIdx++;
        day.type = 'train'; day.template = type;
        var slots = slotsFor(type, t, minutes), items = [];
        slots.forEach(function (sl) {
          var p = pick(sl); if (!p) { why.push('الخانة ' + sl.k + ' (' + sl.p.map(function (x) { return EX().PATTERN[x]; }).join('/') + '): لا يوجد تمرين آمن مناسب — حُذفت.'); return; }
          var d = doseFor(p.ex, p.step, t.goal, plan.pathway);
          items.push({ slot: sl.k, exId: p.ex.id, step: d.step, u: d.u, sets: d.sets, target: d.target, rest: d.rest, side: d.side, why: p.reason.slice() });
        });
        day.warmup = pickBlock(ctx, 'warmup', t.id + date, 3, ['CA-MARCH', 'CA-STEPJACK']);
        day.cooldown = pickBlock(ctx, 'cooldown', t.id + date, t.goal === 'mobility' ? 5 : 3, ['BT-DIAPH']);
        var budget = (minutes - 11) * 60, total = items.reduce(function (s, it) { return s + itemSeconds(it); }, 0);
        if (total > budget) { items.forEach(function (it) { var ex = EX().byId(it.exId); if (it.sets > ex.dose.sets[0]) { it.sets = ex.dose.sets[0]; it.why.push('خُفضت المجموعات لتناسب مدة الحصة.'); } }); total = items.reduce(function (s, it) { return s + itemSeconds(it); }, 0); }
        while (total > budget && items.length > 3) { var rm = items.pop(); why.push('حُذف ' + rm.exId + ' من يوم ' + DOW_AR[dw] + ' لتجاوز المدة.'); total = items.reduce(function (s, it) { return s + itemSeconds(it); }, 0); }
        day.main = items; day.estMinutes = Math.round(total / 60) + 11;
      } else if (avail.indexOf(dw) >= 0) {
        day.type = 'recovery'; day.main = [];
        var walk = allowedList(ctx, function (e) { return e.id === 'CA-WALK' || e.id === 'CA-MARCH'; }, { ignoreLevel: true })[0];
        day.recovery = walk ? [{ exId: walk.id, u: 'time', sets: 1, target: Math.min(20, Math.max(10, Math.round(minutes / 2))) * 60, rest: 0, why: ['نشاط استشفائي خفيف يسمح بالكلام.'] }] : [];
        day.cooldown = pickBlock(ctx, 'cooldown', t.id + date + 'r', 3, []);
        day.estMinutes = walk ? Math.round(day.recovery[0].target / 60) + 5 : 5;
      } else { day.type = 'rest'; day.main = []; }
      plan.days.push(day);
    }
    if (!plan.days.some(function (d) { return d.type === 'rest'; })) { var last = plan.days.filter(function (d) { return d.type === 'recovery'; }).pop(); if (last) { last.type = 'rest'; last.recovery = []; last.cooldown = []; why.push('حُوِّل يوم استشفاء إلى راحة تامة لضمان يوم راحة واحد على الأقل.'); } }
    return plan;
  }
  function pickBlock(ctx, role, seed, n, prefer) {
    var pool = allowedList(ctx, function (e) { return e.role.indexOf(role) >= 0; }, { ignoreLevel: role !== 'warmup' ? true : false });
    pool = pool.filter(function (e) { return e.lvl <= (role === 'warmup' ? 2 : 2); });
    var out = [], used = {};
    prefer.forEach(function (id) { var e = pool.filter(function (x) { return x.id === id; })[0]; if (e && out.length < n) { out.push(e); used[id] = 1; } });
    var rest = pool.filter(function (e) { return !used[e.id]; });
    var h = hash(seed);
    while (out.length < n && rest.length) { var k = h % rest.length; out.push(rest.splice(k, 1)[0]); h = Math.floor(h / 7) + 13; }
    return out.map(function (e) { var d = e.dose; return { exId: e.id, u: d.u, sets: 1, target: d.u === 'reps' ? d.reps[0] : d.sec[0], rest: 0, side: !!d.side }; });
  }

  /* ---------- adaptation from logged sessions + weekly review ---------- */
  var DECISION_AR = { progress: 'تقدّم محدود', maintain: 'تثبيت', reduce: 'تخفيف', substitute: 'استبدال', refer: 'إيقاف وإحالة', hold: 'تثبيت (لا تقدم)' };
  function adapt(plan, sessions, review) {
    var reasons = [], items = {}, global = 'normal', tempFlags = [];
    var R = function (level, text, src) { reasons.push({ level: level, text: text, src: src || ['LOCAL'] }); };
    var a = (review && review.answers) || {};
    var planned = plan.days.filter(function (d) { return d.type === 'train'; }).length;
    var done = sessions.filter(function (s) { return s.status === 'complete' && s.kind !== 'recovery'; }).length;
    var partial = sessions.filter(function (s) { return s.status === 'partial' && s.kind !== 'recovery'; }).length;
    if (sessions.some(function (s) { return s.redFlag; })) R('refer', 'سُجل عرض إنذار أثناء حصة.', ['AHA-WARN', 'RIEBE2015']);
    if (a.safety === 'yes') R('refer', 'عرض إنذار خلال الأسبوع (ألم صدر/دوخة/إغماء/ضيق نفس غير معتاد/خفقان).', ['AHA-WARN', 'RIEBE2015']);
    if (a.preg_warn === 'yes' || a.pp_warn === 'yes') R('refer', 'علامة إنذار في الحمل أو بعد الولادة.', ['ACOG804']);
    var maxPain = Math.max(0, Number(a.pain_nrs) || 0);
    sessions.forEach(function (s) { (s.items || []).forEach(function (it) { maxPain = Math.max(maxPain, Number(it.pain) || 0); }); maxPain = Math.max(maxPain, Number(s.check && s.check.pain) || 0); });
    if (maxPain >= 7) R('refer', 'ألم شديد (' + maxPain + '/10): ليس ألماً عضلياً عادياً — إيقاف وتقييم مختص.', ['NPRS', 'LOCAL']);
    if (a.pain_area && a.pain_nrs >= 4) { tempFlags.push(a.pain_area); R('substitute', 'ألم ' + a.pain_nrs + '/10 في ' + areaAr(a.pain_area) + ': تُستبعد التمارين المحمِّلة لها الأسبوع القادم.', ['NPRS', 'LOCAL']); }
    if (a.pain_area && a.pain_nrs >= 4 && plan.tempFlagsIn && plan.tempFlagsIn.indexOf(a.pain_area) >= 0) R('refer', 'ألم متكرر في المنطقة نفسها لأسبوعين: يلزم تقييم مختص.', ['LOCAL']);
    if (a.pelvic_new === 'yes') { tempFlags.push('impact', 'iap'); R('substitute', 'أعراض قاع حوض جديدة/متزايدة: لا قفز ولا ضغط بطني مرتفع، ويوصى بأخصائي صحة الحوض.', ['GOOM2019', 'NICE-NG210']); }
    if (a.illness === 'yes') { global = 'reduce'; R('reduce', 'مرض خلال الأسبوع: تخفيف عام.', ['LOCAL']); }
    var strain = (Number(a.fatigue) >= 8 ? 1 : 0) + (a.sleep === 'poor' ? 1 : 0) + (a.soreness72 === 'yes' ? 1 : 0);
    if (strain >= 2 && global !== 'reduce') { global = 'reduce'; R('reduce', 'إرهاق مرتفع مع نوم ضعيف أو ألم عضلي يتجاوز 72 ساعة: تخفيف عام.', ['LOCAL']); }
    else if (strain === 1 && global === 'normal') { global = 'hold'; R('maintain', 'مؤشر تعافٍ سلبي واحد: لا تقدم هذا الأسبوع.', ['LOCAL']); }
    if (planned && (done + partial * 0.5) / planned < 0.5) { if (global === 'normal') global = 'hold'; R('maintain', 'أُنجز أقل من نصف الحصص المخططة (' + done + ' كاملة، ' + partial + ' جزئية من ' + planned + '): لا تقدم.', ['LOCAL']); }

    /* aggregate per slot|exercise */
    var agg = {};
    plan.days.forEach(function (d) { (d.main || []).forEach(function (it) { var k = it.slot + '|' + it.exId; agg[k] = agg[k] || { slot: it.slot, exId: it.exId, step: it.step, planned: 0, n: 0, comp: [], effort: [], tech: [], pain: 0 }; agg[k].planned++; }); });
    sessions.forEach(function (s) { (s.items || []).forEach(function (it) {
      var k = it.slot + '|' + it.exId; var g = agg[k]; if (!g) return;
      var presc = it.prescribed || {}; var tgt = (presc.sets || 1) * (presc.target || 1);
      var got = (it.sets || []).reduce(function (x, y) { return x + (Number(y.value) || 0); }, 0);
      if (!(it.sets || []).length) return;
      if (Number(it.pain) >= 4 && it.painArea && tempFlags.indexOf(it.painArea) < 0) tempFlags.push(it.painArea);
      g.n++; g.comp.push(Math.min(1.5, got / tgt)); if (it.effort !== undefined && it.effort !== '') g.effort.push(Number(it.effort)); if (it.technique) g.tech.push(it.technique); g.pain = Math.max(g.pain, Number(it.pain) || 0);
    }); });
    var perEx = (review && review.answers && review.answers.perEx) || {};
    var progressCands = [];
    Object.keys(agg).forEach(function (k) {
      var g = agg[k], avg = function (arr) { return arr.length ? arr.reduce(function (x, y) { return x + y; }, 0) / arr.length : null; };
      var comp = avg(g.comp), eff = avg(g.effort), pe = perEx[g.exId] || {};
      var techPoor = g.tech.indexOf('poor') >= 0 || pe.technique === 'poor', techGood = g.tech.length && g.tech.every(function (x) { return x === 'good'; }) && pe.technique !== 'poor' && pe.technique !== 'fair';
      var act = 'maintain', why = '';
      if (g.pain >= 4) { act = 'substitute'; why = 'ألم ' + g.pain + '/10 أثناء التمرين'; }
      else if (!g.n) { act = 'maintain'; why = 'لا توجد بيانات أداء مسجلة'; }
      else if (comp < 0.7 || techPoor || eff >= 9 || Number(pe.difficulty) >= 9) { act = 'reduce'; why = 'إنجاز ' + Math.round(comp * 100) + '%' + (techPoor ? '، تقنية ضعيفة' : '') + (eff >= 9 ? '، جهد ' + eff.toFixed(1) : ''); }
      else if (comp >= 1 && techGood && eff !== null && eff <= 7 && g.pain <= 0 && g.n >= Math.min(2, g.planned) && global === 'normal') { act = 'progress'; why = 'إنجاز ' + Math.round(comp * 100) + '% بتقنية جيدة وجهد ' + eff.toFixed(1) + ' دون ألم في ' + g.n + ' حصة'; progressCands.push({ k: k, eff: eff }); }
      else { why = 'إنجاز ' + Math.round((comp || 0) * 100) + '%' + (eff !== null ? '، جهد ' + eff.toFixed(1) : '') + (g.pain ? '، ألم خفيف ' + g.pain : '') + (global !== 'normal' ? '، قيد عام' : ''); }
      if (global === 'reduce' && act !== 'substitute') { act = 'reduce'; why += ' — تخفيف عام'; }
      items[k] = { slot: g.slot, exId: g.exId, action: act, why: why, completion: comp, effort: eff, sessions: g.n };
    });
    progressCands.sort(function (x, y) { return x.eff - y.eff; }).slice(3).forEach(function (c) { items[c.k].action = 'maintain'; items[c.k].why += ' — حد 3 تقدمات أسبوعياً (قاعدة محلية)'; });
    var acts = Object.keys(items).map(function (k) { return items[k].action; });
    var overall = reasons.some(function (r) { return r.level === 'refer'; }) ? 'refer' : global === 'reduce' || acts.indexOf('reduce') >= 0 ? 'reduce' : acts.indexOf('substitute') >= 0 || reasons.some(function (r) { return r.level === 'substitute'; }) ? 'substitute' : acts.indexOf('progress') >= 0 ? 'progress' : 'maintain';
    if (a.easy === 'yes' && overall !== 'progress') R('maintain', 'الشعور بالسهولة وحده لا يرفع الشدة تلقائياً؛ التقدم يعتمد على الإنجاز الفعلي والتقنية وغياب الألم.', ['LOCAL']);
    return { overall: overall, reasons: reasons, items: items, tempFlags: tempFlags, completed: done, partial: partial, planned: planned, ruleVersion: RULES };
  }
  function areaAr(k) { var m = {}; (root.MCScreen ? root.MCScreen.AREAS : []).forEach(function (x) { m[x[0]] = x[1]; }); return m[k] || k; }

  /* Weekly review questions: mandatory safety items + branches + adaptive per-exercise questions (max 3). */
  function reviewQuestions(plan, sessions, trainee, screening) {
    var q = [
      { id: 'safety', type: 'yn', must: 1, text: 'خلال هذا الأسبوع، هل حدث ألم/ضغط في الصدر، دوخة شديدة أو إغماء، ضيق نفس غير معتاد، أو خفقان غير طبيعي؟' },
      { id: 'pain_nrs', type: 'num', min: 0, max: 10, must: 1, text: 'أعلى ألم جديد أو متزايد (غير الإرهاق العضلي المعتاد) خلال الأسبوع، 0–10:' },
      { id: 'pain_area', type: 'select', when: function (a) { return Number(a.pain_nrs) >= 1; }, opts: [['', '—']].concat(root.MCScreen.AREAS).concat([['other', 'أخرى']]), text: 'أين كان الألم؟' },
      { id: 'illness', type: 'yn', must: 1, text: 'هل أصبت بمرض مؤقت (حمى، عدوى) هذا الأسبوع؟' },
      { id: 'sleep', type: 'select', opts: [['good', 'جيد'], ['fair', 'متوسط'], ['poor', 'ضعيف']], text: 'جودة النوم هذا الأسبوع:' },
      { id: 'fatigue', type: 'num', min: 0, max: 10, text: 'الإرهاق العام (0 = نشيط جداً، 10 = منهك):' },
      { id: 'soreness72', type: 'yn', text: 'هل استمر ألم العضلات بعد التمرين أكثر من 72 ساعة؟' },
      { id: 'missed_reason', type: 'select', opts: [['none', 'لم تفُت حصص'], ['time', 'ضيق الوقت'], ['fatigue', 'إرهاق'], ['pain', 'ألم'], ['ill', 'مرض'], ['other', 'سبب آخر']], text: 'سبب الحصص الفائتة (إن وجد):' },
      { id: 'schedule_ok', type: 'yn', text: 'هل كانت أيام ومدة التدريب مناسبة؟' },
      { id: 'easy', type: 'yn', text: 'هل شعرت أن الخطة كانت سهلة بشكل عام؟' },
      { id: 'motivation', type: 'num', min: 0, max: 10, text: 'الرغبة في الاستمرار (0–10):' }
    ];
    var pw = screening && screening.outcome ? screening.outcome.pathway : 'general';
    if (pw === 'pregnancy') q.push({ id: 'preg_warn', type: 'yn', must: 1, text: 'هل ظهرت أي علامة إنذار للحمل (نزيف، تسرب سوائل، انقباضات منتظمة، صداع شديد، ألم/تورم الساق، ضعف يؤثر على التوازن)؟' });
    if (pw === 'postpartum') { q.push({ id: 'pp_warn', type: 'yn', must: 1, text: 'هل ظهر نزيف متزايد أو ألم صدر أو تورم/ألم في الساق؟' }); q.push({ id: 'pelvic_new', type: 'yn', must: 1, text: 'هل ظهرت أو زادت أعراض قاع الحوض (تسرب، ثقل، ألم، بروز البطن عند الجهد)؟' }); }
    /* adaptive: pick up to 3 exercises with the weakest data */
    var stats = {};
    plan.days.forEach(function (d) { (d.main || []).forEach(function (it) { stats[it.exId] = stats[it.exId] || { exId: it.exId, score: 0 }; }); });
    sessions.forEach(function (s) { (s.items || []).forEach(function (it) { var st = stats[it.exId]; if (!st) return; if (it.technique && it.technique !== 'good') st.score += 2; if (Number(it.effort) >= 8) st.score += 2; if (Number(it.pain) > 0) st.score += 3; st.logged = 1; }); });
    var pickEx = Object.keys(stats).map(function (k) { var s = stats[k]; if (!s.logged) s.score += 1; return s; }).sort(function (a, b) { return b.score - a.score || (a.exId < b.exId ? -1 : 1); }).slice(0, 3);
    pickEx.forEach(function (s) { var ex = root.MCEX.byId(s.exId); if (!ex) return;
      q.push({ id: 'perEx.' + s.exId + '.technique', ex: s.exId, type: 'select', opts: [['good', 'جيدة'], ['fair', 'متوسطة'], ['poor', 'ضعيفة']], text: 'تقنية «' + ex.ar + '» في آخر أداء:' });
      q.push({ id: 'perEx.' + s.exId + '.difficulty', ex: s.exId, type: 'num', min: 0, max: 10, text: 'صعوبة «' + ex.ar + '» (0–10):' }); });
    return q;
  }

  /* Coach override within safe bounds. Returns {ok, error, plan}. Never allowed on a blocked plan. */
  function applyOverride(plan, change, ctxInput) {
    if (plan.status === 'blocked') return { ok: false, error: 'الخطة موقوفة لأسباب السلامة: لا يمكن تعديلها يدوياً.' };
    if (!change.reason || change.reason.trim().length < 5) return { ok: false, error: 'سبب التعديل مطلوب (5 أحرف على الأقل).' };
    var day = plan.days[change.dayIndex], it = day && day.main && day.main[change.itemIndex];
    if (!it) return { ok: false, error: 'عنصر غير موجود' };
    var ctx = safetyContext(ctxInput.trainee, ctxInput.screening, ctxInput.baseline, plan.tempFlagsIn || []);
    var ex = root.MCEX.byId(change.exId || it.exId);
    if (!ex) return { ok: false, error: 'تمرين غير معروف' };
    var ex0 = root.MCEX.byId(it.exId);
    if (change.exId && change.exId !== it.exId) {
      var why = excludedBy(ex, ctx, { ignoreLevel: false });
      if (why) return { ok: false, error: 'غير مسموح: ' + why };
      if (ex.pat !== ex0.pat && !sameSlotPattern(it.slot, ex.pat)) return { ok: false, error: 'نمط حركة مختلف عن الخانة' };
    }
    var d = ex.dose, sets = change.sets != null ? Number(change.sets) : it.sets, target = change.target != null ? Number(change.target) : it.target;
    var rng = d.u === 'reps' ? d.reps : d.sec;
    if (change.exId && change.exId !== it.exId && change.target == null) { var df = doseFor(ex, 0); sets = df.sets; target = df.target; }
    if (!(sets >= d.sets[0] && sets <= d.sets[1])) return { ok: false, error: 'المجموعات خارج النطاق الآمن ' + d.sets.join('–') };
    if (!(target >= rng[0] && target <= rng[1])) return { ok: false, error: 'العدد/المدة خارج النطاق ' + rng.join('–') };
    var snap = JSON.parse(JSON.stringify(plan.days));
    plan.revisions.push({ at: new Date().toISOString(), reason: 'تعديل المدرب: ' + change.reason.trim(), ruleVersion: RULES, days: snap });
    plan.overrides.push({ at: new Date().toISOString(), dayIndex: change.dayIndex, slot: it.slot, from: { exId: it.exId, sets: it.sets, target: it.target }, to: { exId: ex.id, sets: sets, target: target }, reason: change.reason.trim() });
    var nu = { slot: it.slot, exId: ex.id, step: ex.id === it.exId ? it.step : 0, u: d.u, sets: sets, target: target, rest: it.rest, side: !!d.side, why: ['تعديل يدوي من المدرب ضمن الحدود الآمنة: ' + change.reason.trim()], override: true };
    if (change.allDays) plan.days.forEach(function (dd) { (dd.main || []).forEach(function (x, j) { if (x.slot === it.slot && x.exId === it.exId) dd.main[j] = JSON.parse(JSON.stringify(nu)); }); });
    else day.main[change.itemIndex] = nu;
    return { ok: true, plan: plan };
  }
  function sameSlotPattern(slotKey, pat) { var all = SLOTS.A.concat(SLOTS.B); var s = all.filter(function (x) { return x.k === slotKey; })[0]; return s ? s.p.indexOf(pat) >= 0 : pat === 'balance'; }
  function candidatesFor(plan, dayIndex, itemIndex, ctxInput) {
    var it = plan.days[dayIndex].main[itemIndex]; var all = SLOTS.A.concat(SLOTS.B); var s = all.filter(function (x) { return x.k === it.slot; })[0];
    var pats = s ? s.p : ['balance']; var ctx = safetyContext(ctxInput.trainee, ctxInput.screening, ctxInput.baseline, plan.tempFlagsIn || []);
    return allowedList(ctx, function (e) { return e.role.indexOf('main') >= 0 && pats.indexOf(e.pat) >= 0; });
  }

  root.MCEngine = { RULES: RULES, BASELINE_VERSION: BASELINE_VERSION, TESTS: TESTS, PATTERN_TEST: PATTERN_TEST, evaluateBaseline: evaluateBaseline, testLevel: testLevel,
    safetyContext: safetyContext, excludedBy: excludedBy, doseFor: doseFor, generatePlan: generatePlan, adapt: adapt, reviewQuestions: reviewQuestions,
    applyOverride: applyOverride, candidatesFor: candidatesFor, chooseDays: chooseDays, addDays: addDays, DOW_AR: DOW_AR, DECISION_AR: DECISION_AR, hash: hash };
})(typeof window !== 'undefined' ? window : globalThis);
