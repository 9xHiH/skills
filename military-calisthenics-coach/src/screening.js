/* MCScreen — locally-worded pre-participation screening (NOT the PAR-Q+; topics mapped to it) and its deterministic,
 * versioned outcome rules. Outcomes: 'cleared' (cleared-for-conservative-program), 'more_info' (needs-more-information),
 * 'refer' (do-not-auto-prescribe / refer). DOM-free. */
(function (root) {
  'use strict';
  var VERSION = 'SCR-5.1.0';
  /* Bilingual answer labels: [value, Arabic, English] */
  var YN = [['no', 'لا', 'No'], ['yes', 'نعم', 'Yes'], ['unsure', 'لست متأكداً', 'Not sure']];
  var AREAS = [['shoulder', 'الكتف', 'Shoulder'], ['elbow', 'المرفق', 'Elbow'], ['wrist', 'الرسغ/اليد', 'Wrist/hand'], ['neck', 'الرقبة', 'Neck'], ['lowback', 'أسفل الظهر', 'Lower back'], ['hip', 'الورك', 'Hip'], ['knee', 'الركبة', 'Knee'], ['ankle', 'الكاحل/القدم', 'Ankle/foot']];
  var notMale = function (a, t) { return t && t.sex !== 'male'; };
  var preg = function (a) { return a.pp_status === 'pregnant'; };
  var post = function (a) { return a.pp_status === 'postpartum'; };

  /* Short, plain, bilingual questions (custom wording — NOT the PAR-Q+). Topic = source topic each question covers. */
  var Q = [
    { id: 'cv_dx', sec: 'health', type: 'yn', text: 'هل قال لك طبيب إن لديك مرضاً في القلب أو ضغطاً مرتفعاً؟', en: 'Has a doctor said you have heart disease or high blood pressure?', topic: 'PAR-Q+ 1; ACSM known CV disease', src: ['PARQ', 'RIEBE2015'] },
    { id: 'chest', sec: 'health', type: 'yn', text: 'هل تشعر بألم أو ضغط في الصدر وقت الراحة أو عند الجهد؟', en: 'Do you get chest pain or pressure at rest or during effort?', topic: 'PAR-Q+ 2; ACSM symptoms', src: ['PARQ', 'RIEBE2015', 'AHA-WARN'], red: true },
    { id: 'dizzy', sec: 'health', type: 'yn', text: 'هل أصابتك دوخة شديدة أفقدتك التوازن، أو أُغمي عليك خلال السنة الماضية؟', en: 'In the past year, have you had severe dizziness causing loss of balance, or fainted?', topic: 'PAR-Q+ 3; ACSM symptoms', src: ['PARQ', 'RIEBE2015'], red: true },
    { id: 'breath', sec: 'health', type: 'yn', text: 'مع جهد خفيف: هل يضيق نفسك بشكل غير طبيعي، أو يخفق قلبك بقوة، أو تتورم كاحلاك؟', en: 'With light effort: unusual shortness of breath, a pounding/irregular heartbeat, or swollen ankles?', topic: 'ACSM symptoms', src: ['RIEBE2015'], red: true },
    { id: 'chronic', sec: 'health', type: 'yn', text: 'هل لديك مرض مزمن (سكري، ربو، كلى…) أو تأخذ دواءً يومياً بوصفة طبية؟', en: 'Do you have a chronic illness (diabetes, asthma, kidney…) or take a daily prescription medicine?', topic: 'PAR-Q+ 4–5; ACSM metabolic/renal', src: ['PARQ', 'RIEBE2015'] },
    { id: 'msk', sec: 'health', type: 'yn', text: 'هل لديك إصابة أو ألم حالي في مفصل أو عضلة أو في الظهر؟', en: 'Do you have a current injury or pain in a joint, muscle or your back?', topic: 'PAR-Q+ 6', src: ['PARQ'] },
    { id: 'msk_areas', sec: 'health', type: 'multi', opts: AREAS, when: function (a) { return a.msk === 'yes'; }, text: 'أين؟', en: 'Where?' },
    { id: 'msk_acute', sec: 'health', type: 'yn', when: function (a) { return a.msk === 'yes'; }, text: 'هل الألم شديد، أو الإصابة حديثة (أقل من 6 أسابيع)، أو أجريت عملية خلال 6 أشهر؟', en: 'Is the pain severe, the injury recent (under 6 weeks), or did you have surgery in the last 6 months?', src: ['LOCAL'] },
    { id: 'supervised', sec: 'health', type: 'yn', text: 'هل منعك طبيب من الرياضة، أو طلب أن تتمرن تحت إشراف طبي فقط؟', en: 'Has a doctor told you not to exercise, or only under medical supervision?', topic: 'PAR-Q+ 7', src: ['PARQ'] },
    { id: 'acute_ill', sec: 'health', type: 'yn', text: 'هل أنت مريض الآن (حمى، إنفلونزا، التهاب)؟', en: 'Are you sick right now (fever, flu, infection)?', src: ['LOCAL'] },
    { id: 'active', sec: 'fitness', type: 'yn', text: 'هل تتمرن بانتظام: 30 دقيقة، 3 أيام في الأسبوع، منذ 3 أشهر أو أكثر؟', en: 'Do you exercise regularly: 30 min, 3 days a week, for 3+ months?', topic: 'ACSM current exercise participation', src: ['RIEBE2015'] },
    { id: 'pp_status', sec: 'women', type: 'select', when: notMale, text: 'هل أنتِ حامل الآن أو ولدتِ خلال آخر 12 شهراً؟', en: 'Are you pregnant now, or gave birth in the last 12 months?', opts: [['none', 'لا', 'No'], ['pregnant', 'حامل', 'Pregnant'], ['postpartum', 'ولادة خلال 12 شهراً', 'Gave birth (last 12 months)']], src: ['ACOG804'] },
    { id: 'preg_weeks', sec: 'women', type: 'num', min: 1, max: 42, when: preg, text: 'كم أسبوعاً عمر الحمل؟', en: 'How many weeks pregnant?', src: ['ACOG804'] },
    { id: 'preg_provider', sec: 'women', type: 'yn', when: preg, text: 'هل وافق طبيب الحمل على ممارستك للرياضة؟', en: 'Has your pregnancy doctor approved exercise?', src: ['ACOG804'] },
    { id: 'preg_risk', sec: 'women', type: 'yn', when: preg, text: 'هل أخبرك الطبيب بمشكلة في الحمل تمنع الرياضة أو تحتاج حذراً خاصاً؟', en: 'Has your doctor mentioned a pregnancy problem that limits exercise?', src: ['ACOG804'] },
    { id: 'preg_warn', sec: 'women', type: 'yn', when: preg, text: 'هل لديك الآن نزيف، أو تسرب سوائل، أو انقباضات منتظمة، أو صداع شديد، أو ألم وتورم في الساق؟', en: 'Right now: bleeding, fluid leak, regular contractions, severe headache, or calf pain/swelling?', src: ['ACOG804'], red: true },
    { id: 'pp_weeks', sec: 'women', type: 'num', min: 0, max: 60, when: post, text: 'كم أسبوعاً مضى على الولادة؟', en: 'How many weeks since giving birth?', src: ['GOOM2019'] },
    { id: 'pp_check', sec: 'women', type: 'yn', when: post, text: 'هل أجريتِ فحص ما بعد الولادة ووافق الطبيب على العودة للرياضة؟', en: 'Did you have your postnatal check and get approval to return to exercise?', src: ['ACOG804'] },
    { id: 'pp_pelvic', sec: 'women', type: 'yn', when: post, text: 'هل يحدث تسرب بول، أو ثقل في الحوض، أو بروز في وسط البطن عند الجهد؟', en: 'Any urine leakage, pelvic heaviness, or a bulge in the middle of the tummy with effort?', src: ['GOOM2019', 'NICE-NG210'] },
    { id: 'pp_warn', sec: 'women', type: 'yn', when: post, text: 'هل لديك نزيف يزداد، أو ألم في الصدر، أو ألم وتورم في الساق، أو ضيق نفس مفاجئ؟', en: 'Increasing bleeding, chest pain, calf pain/swelling, or sudden breathlessness?', src: ['ACOG804'], red: true }
  ];

  function visible(answers, trainee) { return Q.filter(function (q) { return !q.when || q.when(answers, trainee); }); }
  function missing(answers, trainee) {
    return visible(answers, trainee).filter(function (q) { var v = answers[q.id]; return q.type === 'multi' ? !Array.isArray(v) : (v === undefined || v === null || v === ''); }).map(function (q) { return q.id; });
  }

  /* Evaluate answers. ctx: {trainee, prior (previous screening record or null), clearance (record or null)}.
   * Returns {status, reasons[{code,text,src,level}], exclusions:{flags[], maxLevel, noImpact}, referrals[], pathway, version}. */
  function evaluate(answers, ctx) {
    ctx = ctx || {};
    var t = ctx.trainee || {}, reasons = [], refs = [], flags = {}, maxLevel = 3;
    var R = function (level, code, text, src) { reasons.push({ level: level, code: code, text: text, src: src || [] }); };
    var miss = missing(answers, t);
    if (miss.length) R('more_info', 'incomplete', 'أسئلة لم يُجب عنها: ' + miss.length, ['LOCAL']);
    var age = Number(t.age);
    if (!isFinite(age) || !t.age) R('more_info', 'age_missing', 'العمر غير مسجل في ملف المتدرب.', ['LOCAL']);
    else if (age < 18) R('refer', 'minor', 'العمر أقل من 18 عاماً: هذا التطبيق مصمم للبالغين ولا يُصدر خططاً تلقائية للقاصرين.', ['LOCAL']);

    var symptomMap = { chest: 'ألم أو انزعاج في الصدر', dizzy: 'دوخة مع فقدان توازن أو فقدان وعي', breath: 'ضيق نفس غير معتاد أو خفقان أو تورم الكاحلين مع جهد خفيف' };
    var symptoms = Object.keys(symptomMap).filter(function (k) { return answers[k] === 'yes'; });
    var unsureSym = Object.keys(symptomMap).filter(function (k) { return answers[k] === 'unsure'; });
    symptoms.forEach(function (k) { R('refer', 'sym_' + k, 'عرض إنذار: ' + symptomMap[k] + '. لا تُصدر خطة تلقائية؛ يلزم تقييم طبي قبل أي جهد.', ['RIEBE2015', 'PARQ', 'AHA-WARN']); });
    unsureSym.forEach(function (k) { R('more_info', 'unsure_' + k, 'إجابة غير مؤكدة عن عرض إنذار: ' + symptomMap[k] + '.', ['LOCAL']); });
    if (symptoms.length) refs.push('تقييم طبي عاجل/قريب حسب شدة العرض. عند ألم الصدر المستمر أو الإغماء: اتصل بالطوارئ.');

    if (answers.supervised === 'yes') { R('refer', 'supervised', 'طُلب إشراف طبي على النشاط: لا يمكن للتطبيق توفير ذلك، لذا لا تُصدر خطة تلقائية.', ['PARQ']); refs.push('برنامج تحت إشراف طبي/تأهيلي.'); }
    else if (answers.supervised === 'unsure') R('more_info', 'supervised_unsure', 'غير مؤكد إن كان مطلوباً إشراف طبي.', ['PARQ']);

    var knownDisease = answers.cv_dx === 'yes';
    if (knownDisease) {
      if (answers.active === 'yes' && !symptoms.length) { R('cleared_limited', 'dx_active', 'مرض قلبي/استقلابي/كلوي معروف دون أعراض مع نشاط منتظم: يُسمح بشدة متوسطة فقط، ويلزم تصريح قبل الشدة العالية.', ['RIEBE2015']); maxLevel = Math.min(maxLevel, 2); flags.impact = 1; }
      else R('more_info', 'dx_inactive', 'مرض قلبي/استقلابي/كلوي معروف مع عدم انتظام النشاط: يوصى بتصريح طبي قبل البدء.', ['RIEBE2015']);
    }
    ['cv_dx', 'chronic', 'msk', 'active', 'acute_ill', 'msk_acute'].forEach(function (k) { if (answers[k] === 'unsure') R('more_info', 'unsure_' + k, 'إجابة "غير متأكد" تحتاج توضيحاً.', ['LOCAL']); });
    if (answers.chronic === 'yes') R('more_info', 'chronic', 'مرض مزمن أو دواء يومي: يلزم رأي الطبيب (تصريح موثق) قبل البدء.', ['PARQ', 'EPARMEDX', 'RIEBE2015']);
    if (answers.acute_ill === 'yes') R('more_info', 'acute_ill', 'مرض مؤقت حالي: أجّل البدء حتى التعافي ثم أعد الفحص.', ['LOCAL']);

    if (answers.msk === 'yes') {
      var areas = Array.isArray(answers.msk_areas) ? answers.msk_areas : [];
      areas.forEach(function (a) { flags[a] = 1; });
      if (areas.indexOf('shoulder') >= 0) flags.overhead = 1;
      if (areas.indexOf('wrist') >= 0) flags.grip = 1;
      if (answers.msk_acute === 'yes') R('more_info', 'msk_acute', 'إصابة حادة/جراحة حديثة/ألم متزايد: يلزم تصريح مختص (طبيب أو أخصائي علاج طبيعي) مع تحديد القيود.', ['PARQ', 'LOCAL']);
      else R('cleared_limited', 'msk_limits', 'مشكلة عضلية هيكلية مستقرة: تُستبعد التمارين التي تحمّل المنطقة/المناطق المحددة.', ['PARQ', 'LOCAL']);
    }

    var pathway = 'general';
    if (answers.pp_status === 'pregnant') {
      pathway = 'pregnancy';
      var wk = Number(answers.preg_weeks);
      if (answers.preg_warn === 'yes') { R('refer', 'preg_warn', 'علامة إنذار في الحمل: أوقفي التمرين وتواصلي مع طبيب الحمل فوراً.', ['ACOG804']); refs.push('طبيب الحمل فوراً.'); }
      if (answers.preg_risk === 'yes') R('more_info', 'preg_risk', 'مشكلة في الحمل ذكرها الطبيب: يلزم تصريح موثق من طبيب الحمل يحدد المسموح.', ['ACOG804']);
      if (answers.preg_risk === 'unsure' || answers.preg_warn === 'unsure') R('more_info', 'preg_unsure', 'إجابة غير مؤكدة عن الحمل: راجعي الطبيب.', ['ACOG804']);
      if (answers.preg_provider !== 'yes') R('more_info', 'preg_provider', 'يلزم إقرار مقدم رعاية الحمل بممارسة التمرين قبل إصدار خطة.', ['ACOG804']);
      flags.impact = 1; flags.inversion = 1; flags.iap = 1; flags.isometric_long = 1; flags.balance = 1;
      if (wk >= 20) flags.supine = 1;
      if (wk >= 12) flags.prone = 1;
      maxLevel = Math.min(maxLevel, 2);
      R('cleared_limited', 'preg_rules', 'مسار الحمل: لا قفز، لا انقلاب، لا ثبات طويل أو ضغط بطني مرتفع، لا تمارين توازن عالية الخطورة' + (wk >= 20 ? '، ولا استلقاء على الظهر (≥ 20 أسبوعاً)' : '') + (wk >= 12 ? '، ولا انبطاح على البطن (قاعدة محلية ≥ 12 أسبوعاً)' : '') + '. الشدة: يمكن التحدث أثناء الجهد.', ['ACOG804', 'LOCAL']);
    } else if (answers.pp_status === 'postpartum') {
      pathway = 'postpartum';
      var w = Number(answers.pp_weeks), pel = answers.pp_pelvic === 'yes' ? ['yes'] : [];
      if (answers.pp_warn === 'yes') { R('refer', 'pp_warn', 'علامة إنذار بعد الولادة: تواصلي مع مقدم الرعاية فوراً.', ['ACOG804']); refs.push('مقدم الرعاية فوراً.'); }
      if (answers.pp_check !== 'yes') R('more_info', 'pp_check', 'يلزم فحص ما بعد الولادة وإقرار مقدم الرعاية بالعودة التدريجية.', ['ACOG804']);
      if (pel.length) { R('cleared_limited', 'pp_pelvic', 'أعراض قاع الحوض: يوصى بالإحالة لأخصائي/ة علاج طبيعي لصحة الحوض؛ يُمنع القفز والضغط البطني المرتفع.', ['GOOM2019', 'NICE-NG210']); refs.push('أخصائي/ة علاج طبيعي لصحة الحوض.'); flags.impact = 1; flags.iap = 1; }
      if (!(w >= 12)) { flags.impact = 1; R('cleared_limited', 'pp_12w', 'أقل من 12 أسبوعاً بعد الولادة: لا قفز ولا جري.', ['GOOM2019']); }
      flags.iap = flags.iap || (w < 12 ? 1 : 0);
      if (!flags.iap) delete flags.iap;
      maxLevel = Math.min(maxLevel, w >= 12 && !pel.length ? 3 : 2);
    }

    /* A prior red-flag referral can only be resolved by a documented professional clearance. */
    if (ctx.prior && ctx.prior.outcome && ctx.prior.outcome.status === 'refer' && !ctx.clearance) R('more_info', 'prior_refer', 'الفحص السابق انتهى بإحالة بسبب علامة إنذار: يلزم توثيق تصريح مختص قبل إصدار خطة.', ['LOCAL']);

    var status = 'cleared';
    if (reasons.some(function (r) { return r.level === 'more_info'; })) status = 'more_info';
    if (reasons.some(function (r) { return r.level === 'refer'; })) status = 'refer';
    /* Documented clearance resolves 'more_info' only — never 'refer'. Clearance restrictions are added as notes. */
    if (status === 'more_info' && ctx.clearance && ctx.clearance.by && ctx.clearance.date) {
      var onlyIncomplete = reasons.some(function (r) { return r.code === 'incomplete' || r.code === 'age_missing'; });
      if (!onlyIncomplete) { status = 'cleared'; R('cleared_limited', 'clearance', 'تصريح موثق من: ' + ctx.clearance.by + ' بتاريخ ' + ctx.clearance.date + (ctx.clearance.limits ? ' — القيود: ' + ctx.clearance.limits : ''), ['EPARMEDX']); }
    }
    if (status === 'cleared' && reasons.every(function (r) { return r.level !== 'cleared_limited'; })) R('cleared', 'all_no', 'لا توجد إجابات إيجابية: مسموح ببرنامج تحفظي تدريجي يبدأ بشدة خفيفة إلى متوسطة.', ['PARQ', 'RIEBE2015']);
    if (answers.active !== 'yes') maxLevel = Math.min(maxLevel, 3);
    return { status: status, reasons: reasons, referrals: refs, pathway: pathway, exclusions: { flags: Object.keys(flags), maxLevel: maxLevel }, version: VERSION };
  }

  var LABEL = { cleared: 'مسموح ببرنامج تحفظي', more_info: 'يحتاج معلومات/تصريحاً', refer: 'لا تُصدر خطة — إحالة' };
  root.MCScreen = { VERSION: VERSION, QUESTIONS: Q, AREAS: AREAS, YN: YN, visible: visible, missing: missing, evaluate: evaluate, LABEL: LABEL };
})(typeof window !== 'undefined' ? window : globalThis);
