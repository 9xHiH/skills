/* Single-arm (unilateral) exercises used to train a weaker side. Geometry reuses the PU-WALL / PH-DOOR calibration. */
(function () {
  var RAD = Math.PI / 180;
  function r1(v) { return Math.round(v * 10) / 10; }
  function D(a) { return [Math.cos(a * RAD), -Math.sin(a * RAD)]; }
  function body(ax, ay, th, a, f) {
    var d = D(th), lg = r1(th + 180);
    return { h: [r1(ax + 66 * d[0]), r1(ay + 66 * d[1])], t: r1(th), a: a, l: [[lg, lg], [lg, lg]], f: f || [-75, -75] };
  }
  MCEX.add(
    {
      id: 'PU-SA-WALL', ar: 'ضغط الحائط بذراع واحدة', en: 'Single-arm wall push-up', fam: 'push-up', pat: 'push_h', cat: 'upper', role: ['main'], lvl: 2,
      prim: ['chest', 'triceps'], sec: ['delts_front', 'core', 'obliques'], eq: ['wall'], space: '1×1.5 م أمام حائط', impact: 'none', pos: 'standing', flags: ['wrist', 'shoulder'],
      dose: { u: 'reps', sets: [1, 3], reps: [5, 12], rest: [30, 60], tempo: '2-0-2', side: true },
      setup: 'قف مواجهاً للحائط أقرب قليلاً من الضغط العادي على الحائط، وضع كفاً واحدة على الحائط أمام الكتف، واليد الأخرى على الخصر.',
      steps: ['ابدأ بالذراع الأضعف.', 'شد البطن والألوية حتى يبقى الجسم مستقيماً ولا يدور الجذع.', 'اثنِ المرفق وقرّب الصدر من الحائط ببطء.', 'ادفع بالذراع نفسها حتى تمتد، ثم أكمل العدد وبدّل الذراع.'],
      breath: 'شهيق أثناء الاقتراب، زفير أثناء الدفع.',
      errors: ['دوران الجذع نحو الحائط', 'رفع الكتف نحو الأذن', 'الوقوف بعيداً جداً فتصعب الحركة'],
      stop: ['ألم في الرسغ أو الكتف أو المرفق', 'انزلاق القدمين'],
      prereq: 'إتقان الضغط على الحائط بالذراعين 3×15 دون ألم.',
      easier: ['PU-WALL'], harder: ['PU-STAGGER'], subs: ['PU-WALL'], src: ['ACSM-RT', 'NIA'],
      desc: 'رسم جانبي: الشخص مائل نحو حائط على يمينه، كف واحدة على الحائط والذراع الأخرى على الخصر، يثني المرفق فيقترب الصدر من الحائط ثم يدفع.',
      anim: { view: 'side', props: [{ k: 'wall', x: 206 }], trace: 'neck', keys: [
        { p: body(132, 147, 74, [{ p: [206, 52], b: -1 }, [-110, -20]], [-20, -20]), d: 1500, hold: 300, lab: 'اقترب بذراع واحدة — شهيق' },
        { p: body(132, 147, 65, [{ p: [206, 52], b: -1 }, [-110, -20]], [-20, -20]), d: 1300, hold: 200, lab: 'ادفع — زفير' }
      ] }
    },
    {
      id: 'PH-DOOR-SA', ar: 'سحب إطار الباب بذراع واحدة', en: 'Single-arm door-frame row', fam: 'row', pat: 'pull_h', cat: 'upper', role: ['main'], lvl: 2,
      prim: ['upper_back', 'lats'], sec: ['biceps', 'forearms', 'obliques'], eq: ['wall'], space: 'مدخل باب متين', impact: 'none', pos: 'standing', flags: ['grip', 'shoulder', 'elbow'],
      dose: { u: 'reps', sets: [1, 3], reps: [6, 12], rest: [45, 90], tempo: '2-1-2', side: true },
      setup: 'قف أمام إطار باب متين (حائط خرساني لا الباب نفسه)، أمسك حافة الإطار بيد واحدة بمستوى الصدر، والقدمان قريبتان من أسفل الإطار.',
      steps: ['ابدأ بالذراع الأضعف وتأكد أن القبضة لا تنزلق.', 'مل للخلف بجسم مستقيم حتى تمتد الذراع.', 'اسحب الصدر نحو الإطار بثني المرفق دون أن يدور الجذع.', 'عد ببطء، أكمل العدد ثم بدّل اليد.'],
      breath: 'زفير أثناء السحب، شهيق أثناء الرجوع.',
      errors: ['السحب من باب مفتوح أو مقبض', 'دوران الجذع بدل السحب بالظهر', 'الميل أكثر من القدرة على التحكم'],
      stop: ['أي حركة من الإطار أو انزلاق اليد — توقف فوراً', 'ألم في المرفق أو الكتف'],
      prereq: 'إتقان سحب إطار الباب بالذراعين 3×12 بتحكم.',
      easier: ['PH-DOOR'], harder: ['PH-TABLE'], subs: ['PH-TOWEL'], src: ['ACSM-RT'],
      desc: 'رسم جانبي: الشخص يمسك إطار الباب بيد واحدة والأخرى بجانب الجسم، يميل للخلف بجسم مستقيم ثم يسحب صدره نحو الإطار.',
      anim: { view: 'side', props: [{ k: 'wall', x: 190 }], trace: 'neck', keys: [
        { p: body(178, 149, 106, [{ p: [190, 62], b: -1 }, [-95, -85]], [0, 0]), d: 1300, hold: 300, lab: 'اسحب بيد واحدة — زفير' },
        { p: body(178, 149, 92, [{ p: [190, 62], b: -1 }, [-80, -80]], [0, 0]), d: 1600, hold: 500, lab: 'عد ببطء — شهيق' }
      ] }
    }
  );
})();
