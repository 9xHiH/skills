/* MCScreen — locally-worded pre-participation screening (NOT the PAR-Q+; topics mapped to it) and its deterministic,
 * versioned outcome rules. Outcomes: 'cleared' (cleared-for-conservative-program), 'more_info' (needs-more-information),
 * 'refer' (do-not-auto-prescribe / refer). DOM-free. */
(function (root) {
  'use strict';
  var VERSION = 'SCR-5.0.0';
  var YN = [['no', 'لا'], ['yes', 'نعم'], ['unsure', 'غير متأكد']];
  var AREAS = [['shoulder', 'الكتف'], ['elbow', 'المرفق'], ['wrist', 'الرسغ/اليد'], ['neck', 'الرقبة'], ['lowback', 'أسفل الظهر'], ['hip', 'الورك'], ['knee', 'الركبة'], ['ankle', 'الكاحل/القدم']];
  var notMale = function (a, t) { return t && t.sex !== 'male'; };
  var preg = function (a) { return a.pp_status === 'pregnant'; };
  var post = function (a) { return a.pp_status === 'postpartum'; };

  /* topic: maps the question to its source topic; custom: wording written for this app */
  var Q = [
    { id: 'cv_dx', sec: 'عام', type: 'yn', text: 'هل أخبرك طبيب أو مختص صحي بأن لديك مرضاً في القلب أو ارتفاعاً في ضغط الدم؟', topic: 'PAR-Q+ محور 1؛ ACSM مرض قلبي وعائي معروف', src: ['PARQ', 'RIEBE2015'] },
    { id: 'chest', sec: 'عام', type: 'yn', text: 'هل تشعر بألم أو ضغط أو انزعاج في الصدر أثناء الراحة أو الأنشطة اليومية أو الجهد البدني؟', topic: 'PAR-Q+ محور 2؛ أعراض ACSM', src: ['PARQ', 'RIEBE2015', 'AHA-WARN'], red: true },
    { id: 'dizzy', sec: 'عام', type: 'yn', text: 'خلال آخر 12 شهراً، هل فقدت توازنك بسبب دوخة أو فقدت الوعي؟ (لا تُحتسب الدوخة الناتجة عن التنفس السريع أثناء جهد شديد)', topic: 'PAR-Q+ محور 3؛ أعراض ACSM', src: ['PARQ', 'RIEBE2015'], red: true },
    { id: 'breath', sec: 'عام', type: 'yn', text: 'هل تعاني من ضيق نفس غير معتاد وأنت مرتاح أو مع جهد خفيف (مثل المشي الهادئ أو صعود بضع درجات)؟', topic: 'أعراض ACSM', src: ['RIEBE2015'], red: true },
    { id: 'palp', sec: 'عام', type: 'yn', text: 'هل تشعر بخفقان أو تسارع غير طبيعي في ضربات القلب دون سبب واضح؟', topic: 'أعراض ACSM', src: ['RIEBE2015'], red: true },
    { id: 'legs', sec: 'عام', type: 'yn', text: 'هل لديك تورم غير مفسَّر في الكاحلين، أو ألم في الساق عند المشي يزول بالراحة؟', topic: 'أعراض ACSM', src: ['RIEBE2015'], red: true },
    { id: 'chronic', sec: 'عام', type: 'yn', text: 'هل لديك حالة مزمنة أخرى مشخّصة (مثل السكري، مرض الكلى، الربو أو مرض رئوي، الصرع، السرطان)؟', topic: 'PAR-Q+ محور 4؛ ACSM مرض استقلابي/كلوي', src: ['PARQ', 'RIEBE2015'] },
    { id: 'chronic_type', sec: 'عام', type: 'multi', when: function (a) { return a.chronic === 'yes'; }, text: 'حدّد نوع الحالة (لأغراض القاعدة فقط، دون تفاصيل طبية):', opts: [['metabolic', 'سكري أو حالة استقلابية'], ['renal', 'مرض كلوي'], ['resp', 'ربو أو مرض رئوي'], ['neuro', 'صرع أو حالة عصبية'], ['cancer', 'سرطان حالي أو حديث'], ['other', 'أخرى']], src: ['RIEBE2015'] },
    { id: 'meds', sec: 'عام', type: 'yn', text: 'هل تتناول حالياً أدوية موصوفة لحالة مزمنة؟', topic: 'PAR-Q+ محور 5', src: ['PARQ'] },
    { id: 'msk', sec: 'عام', type: 'yn', text: 'هل لديك حالياً أو خلال آخر 12 شهراً مشكلة في العظام أو المفاصل أو العضلات قد تتفاقم بالنشاط البدني؟', topic: 'PAR-Q+ محور 6', src: ['PARQ'] },
    { id: 'msk_areas', sec: 'عام', type: 'multi', when: function (a) { return a.msk === 'yes'; }, text: 'أين؟', opts: AREAS },
    { id: 'msk_acute', sec: 'عام', type: 'yn', when: function (a) { return a.msk === 'yes'; }, text: 'هل هي إصابة حادة حديثة (أقل من 6 أسابيع)، أو جراحة خلال آخر 6 أشهر، أو ألم يزداد سوءاً؟', src: ['LOCAL'] },
    { id: 'msk_pain', sec: 'عام', type: 'num', min: 0, max: 10, when: function (a) { return a.msk === 'yes'; }, text: 'شدة الألم الآن أثناء الراحة (0 = لا ألم، 10 = أسوأ ألم يمكن تخيله):', src: ['NPRS'] },
    { id: 'supervised', sec: 'عام', type: 'yn', text: 'هل أخبرك طبيب بأن تمارس النشاط البدني تحت إشراف طبي فقط؟', topic: 'PAR-Q+ محور 7', src: ['PARQ'] },
    { id: 'acute_ill', sec: 'عام', type: 'yn', text: 'هل أنت مريض حالياً بمرض مؤقت (حمى، عدوى، إنفلونزا) أو تتعافى منه؟', src: ['LOCAL'] },
    { id: 'active', sec: 'عام', type: 'yn', text: 'هل تمارس نشاطاً بدنياً مخططاً بشدة متوسطة على الأقل 30 دقيقة، 3 أيام أسبوعياً، منذ 3 أشهر أو أكثر؟', topic: 'ACSM: المشاركة الحالية في التمرين', src: ['RIEBE2015'] },
    /* pregnancy / postpartum gate: asked of anyone not recorded as male; never assumed from sex */
    { id: 'pp_status', sec: 'الحمل وما بعد الولادة', type: 'select', when: notMale, text: 'هل ينطبق عليك أحد الآتي؟', opts: [['none', 'لا ينطبق'], ['pregnant', 'حمل حالي'], ['postpartum', 'ولادة خلال آخر 12 شهراً'], ['decline', 'أفضّل عدم الإجابة']], src: ['ACOG804'] },
    { id: 'preg_weeks', sec: 'الحمل', type: 'num', min: 1, max: 42, when: preg, text: 'عمر الحمل التقريبي بالأسابيع:', src: ['ACOG804'] },
    { id: 'preg_provider', sec: 'الحمل', type: 'yn', when: preg, text: 'هل راجعت مقدم رعاية الحمل وأقرّ ممارسة التمرين في هذا الحمل؟', src: ['ACOG804'] },
    { id: 'preg_abs', sec: 'الحمل', type: 'multi', when: preg, text: 'هل أخبرك مقدم الرعاية بأي من الآتي؟ (اختر ما ينطبق)', opts: [['heart_lung', 'مرض قلبي مؤثر أو مرض رئوي تقييدي'], ['cervix', 'قصور عنق الرحم أو ربط عنق الرحم'], ['multiple', 'حمل متعدد مع خطر ولادة مبكرة'], ['bleeding', 'نزيف مستمر في الثلث الثاني أو الثالث'], ['previa', 'مشيمة منزاحة بعد 26 أسبوعاً'], ['preterm', 'مخاض مبكر في هذا الحمل'], ['rupture', 'تمزق الأغشية'], ['preeclampsia', 'تسمم الحمل أو ارتفاع ضغط الحمل'], ['anemia', 'فقر دم شديد']], src: ['ACOG804'] },
    { id: 'preg_rel', sec: 'الحمل', type: 'multi', when: preg, text: 'هل لديك أي من الآتي؟ (اختر ما ينطبق)', opts: [['diabetes', 'سكري غير مضبوط'], ['htn', 'ارتفاع ضغط غير مضبوط'], ['seizure', 'صرع غير مضبوط'], ['thyroid', 'فرط نشاط الغدة الدرقية'], ['growth', 'تأخر نمو الجنين في هذا الحمل'], ['ortho', 'قيود عظمية/مفصلية'], ['smoker', 'تدخين شديد'], ['sedentary', 'خمول شديد قبل الحمل']], src: ['ACOG804'] },
    { id: 'preg_warn', sec: 'الحمل', type: 'multi', when: preg, text: 'هل تعانين حالياً من أي من علامات الإنذار؟', opts: [['bleed', 'نزيف مهبلي'], ['fluid', 'تسرب سوائل'], ['contractions', 'انقباضات منتظمة مؤلمة'], ['dyspnea', 'ضيق نفس قبل الجهد'], ['dizzy', 'دوخة'], ['headache', 'صداع شديد'], ['chest', 'ألم صدر'], ['weak', 'ضعف عضلي يؤثر على التوازن'], ['calf', 'ألم أو تورم في ربلة الساق']], src: ['ACOG804'] },
    { id: 'pp_weeks', sec: 'ما بعد الولادة', type: 'num', min: 0, max: 60, when: post, text: 'كم أسبوعاً مضى على الولادة؟', src: ['GOOM2019'] },
    { id: 'pp_check', sec: 'ما بعد الولادة', type: 'yn', when: post, text: 'هل أجريتِ فحص ما بعد الولادة وأقرّ مقدم الرعاية العودة التدريجية للتمرين؟', src: ['ACOG804'] },
    { id: 'pp_pelvic', sec: 'ما بعد الولادة', type: 'multi', when: post, text: 'هل تلاحظين أياً من الآتي؟', opts: [['leak', 'تسرب بول أو غازات أو براز'], ['urgency', 'إلحاح بولي يصعب تأجيله'], ['heavy', 'ثقل أو ضغط أو بروز في منطقة الحوض'], ['pain', 'ألم في الحوض أو أسفل الظهر'], ['doming', 'بروز/تقبب في خط منتصف البطن عند الجهد']], src: ['GOOM2019', 'NICE-NG210'] },
    { id: 'pp_warn', sec: 'ما بعد الولادة', type: 'yn', when: post, text: 'هل يوجد نزيف يزداد، أو ألم في الصدر، أو ألم/تورم في ربلة الساق، أو ضيق نفس مفاجئ؟', src: ['ACOG804'], red: true }
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

    var symptomMap = { chest: 'ألم أو انزعاج في الصدر', dizzy: 'دوخة مع فقدان توازن أو فقدان وعي', breath: 'ضيق نفس غير معتاد', palp: 'خفقان غير طبيعي', legs: 'تورم الكاحلين أو ألم الساق عند المشي' };
    var symptoms = Object.keys(symptomMap).filter(function (k) { return answers[k] === 'yes'; });
    var unsureSym = Object.keys(symptomMap).filter(function (k) { return answers[k] === 'unsure'; });
    symptoms.forEach(function (k) { R('refer', 'sym_' + k, 'عرض إنذار: ' + symptomMap[k] + '. لا تُصدر خطة تلقائية؛ يلزم تقييم طبي قبل أي جهد.', ['RIEBE2015', 'PARQ', 'AHA-WARN']); });
    unsureSym.forEach(function (k) { R('more_info', 'unsure_' + k, 'إجابة غير مؤكدة عن عرض إنذار: ' + symptomMap[k] + '.', ['LOCAL']); });
    if (symptoms.length) refs.push('تقييم طبي عاجل/قريب حسب شدة العرض. عند ألم الصدر المستمر أو الإغماء: اتصل بالطوارئ.');

    if (answers.supervised === 'yes') { R('refer', 'supervised', 'طُلب إشراف طبي على النشاط: لا يمكن للتطبيق توفير ذلك، لذا لا تُصدر خطة تلقائية.', ['PARQ']); refs.push('برنامج تحت إشراف طبي/تأهيلي.'); }
    else if (answers.supervised === 'unsure') R('more_info', 'supervised_unsure', 'غير مؤكد إن كان مطلوباً إشراف طبي.', ['PARQ']);

    var knownDisease = answers.cv_dx === 'yes' || (Array.isArray(answers.chronic_type) && (answers.chronic_type.indexOf('metabolic') >= 0 || answers.chronic_type.indexOf('renal') >= 0));
    if (knownDisease) {
      if (answers.active === 'yes' && !symptoms.length) { R('cleared_limited', 'dx_active', 'مرض قلبي/استقلابي/كلوي معروف دون أعراض مع نشاط منتظم: يُسمح بشدة متوسطة فقط، ويلزم تصريح قبل الشدة العالية.', ['RIEBE2015']); maxLevel = Math.min(maxLevel, 2); flags.impact = 1; }
      else R('more_info', 'dx_inactive', 'مرض قلبي/استقلابي/كلوي معروف مع عدم انتظام النشاط: يوصى بتصريح طبي قبل البدء.', ['RIEBE2015']);
    }
    ['cv_dx', 'chronic', 'meds', 'msk', 'active', 'acute_ill'].forEach(function (k) { if (answers[k] === 'unsure') R('more_info', 'unsure_' + k, 'إجابة "غير متأكد" تحتاج توضيحاً.', ['LOCAL']); });
    if (answers.chronic === 'yes' && !knownDisease) R('more_info', 'chronic', 'حالة مزمنة أخرى: تحتاج متابعة (يقابل صفحات المتابعة في PAR-Q+) أو تصريح مختص.', ['PARQ', 'EPARMEDX']);
    if (answers.meds === 'yes') R('more_info', 'meds', 'أدوية لحالة مزمنة: تحتاج متابعة أو تصريح مختص.', ['PARQ', 'EPARMEDX']);
    if (answers.acute_ill === 'yes') R('more_info', 'acute_ill', 'مرض مؤقت حالي: أجّل البدء حتى التعافي ثم أعد الفحص.', ['LOCAL']);

    if (answers.msk === 'yes') {
      var areas = Array.isArray(answers.msk_areas) ? answers.msk_areas : [];
      areas.forEach(function (a) { flags[a] = 1; });
      if (areas.indexOf('shoulder') >= 0) flags.overhead = 1;
      if (areas.indexOf('wrist') >= 0) flags.grip = 1;
      var pain = Number(answers.msk_pain);
      if (answers.msk_acute === 'yes') R('more_info', 'msk_acute', 'إصابة حادة/جراحة حديثة/ألم متزايد: يلزم تصريح مختص (طبيب أو أخصائي علاج طبيعي) مع تحديد القيود.', ['PARQ', 'LOCAL']);
      else if (isFinite(pain) && pain >= 4) R('more_info', 'msk_pain', 'ألم أثناء الراحة بدرجة ' + pain + '/10: يلزم تقييم مختص قبل التمرين.', ['NPRS', 'LOCAL']);
      else R('cleared_limited', 'msk_limits', 'مشكلة عضلية هيكلية مستقرة: تُستبعد التمارين التي تحمّل المنطقة/المناطق المحددة.', ['PARQ', 'LOCAL']);
    }

    var pathway = 'general';
    if (answers.pp_status === 'pregnant') {
      pathway = 'pregnancy';
      var wk = Number(answers.preg_weeks);
      var warn = Array.isArray(answers.preg_warn) ? answers.preg_warn : [];
      var abs = Array.isArray(answers.preg_abs) ? answers.preg_abs : [];
      var rel = Array.isArray(answers.preg_rel) ? answers.preg_rel : [];
      if (warn.length) { R('refer', 'preg_warn', 'علامة إنذار في الحمل: أوقفي التمرين وتواصلي مع مقدم رعاية الحمل.', ['ACOG804']); refs.push('مقدم رعاية الحمل فوراً.'); }
      if (abs.length) { R('refer', 'preg_abs', 'مانع مطلق للتمرين الهوائي في الحمل حسب ACOG: لا تُصدر خطة.', ['ACOG804']); refs.push('مقدم رعاية الحمل.'); }
      if (rel.length) R('more_info', 'preg_rel', 'مانع نسبي: يلزم تصريح موثق من مقدم رعاية الحمل يحدد المسموح.', ['ACOG804']);
      if (answers.preg_provider !== 'yes') R('more_info', 'preg_provider', 'يلزم إقرار مقدم رعاية الحمل بممارسة التمرين قبل إصدار خطة.', ['ACOG804']);
      flags.impact = 1; flags.inversion = 1; flags.iap = 1; flags.isometric_long = 1; flags.balance = 1;
      if (wk >= 20) flags.supine = 1;
      if (wk >= 12) flags.prone = 1;
      maxLevel = Math.min(maxLevel, 2);
      R('cleared_limited', 'preg_rules', 'مسار الحمل: لا قفز، لا انقلاب، لا ثبات طويل أو ضغط بطني مرتفع، لا تمارين توازن عالية الخطورة' + (wk >= 20 ? '، ولا استلقاء على الظهر (≥ 20 أسبوعاً)' : '') + (wk >= 12 ? '، ولا انبطاح على البطن (قاعدة محلية ≥ 12 أسبوعاً)' : '') + '. الشدة: يمكن التحدث أثناء الجهد.', ['ACOG804', 'LOCAL']);
    } else if (answers.pp_status === 'postpartum') {
      pathway = 'postpartum';
      var w = Number(answers.pp_weeks), pel = Array.isArray(answers.pp_pelvic) ? answers.pp_pelvic : [];
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
