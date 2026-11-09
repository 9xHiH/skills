/* Upper-body exercises, expansion batch 2: archer, staggered, negative and close-grip push-up variants,
 * feet-elevated inverted row and commando pull-up.
 * Poses face RIGHT (x grows forward). Geometry helpers follow the calibration used in ex_upper.js. */
(function () {
  var RAD = Math.PI / 180;
  function r1(v) { return Math.round(v * 10) / 10; }
  function D(a) { return [Math.cos(a * RAD), -Math.sin(a * RAD)]; }
  /* angle of a straight body whose pivot (ankle/knee) is at height py, with the shoulder at height sy; len = pivot->shoulder */
  function ang(py, sy, len) { return Math.asin((py - sy) / len) / RAD; }
  /* straight body from ankle [ax,ay] at angle th (legs straight, in line with the torso) */
  function body(ax, ay, th, a, f, n) {
    var d = D(th), lg = r1(th + 180);
    var p = { h: [r1(ax + 66 * d[0]), r1(ay + 66 * d[1])], t: r1(th), a: a, l: [[lg, lg], [lg, lg]], f: f || [-75, -75] };
    if (n) p.n = n;
    return p;
  }
  /* straight body from the knee [kx,ky] (thighs in line with torso), shin at absolute angle sh */
  function kbody(kx, ky, th, sh, a, f, n) {
    var d = D(th), tg = r1(th + 180);
    var p = { h: [r1(kx + 34 * d[0]), r1(ky + 34 * d[1])], t: r1(th), a: a, l: [[tg, sh], [tg, sh]], f: f || [-60, -60] };
    if (n) p.n = n;
    return p;
  }
  function HA(x, y, b) { return [{ p: [x, y], b: b }, { p: [x, y], b: b }]; }

  /* Standard floor push-up geometry (same calibration as PU-STD / ex_upper.js) */
  var PA = [58.5, 140], PH = HA(160, 150, -1);
  var PU_TOP = body(PA[0], PA[1], ang(140, 103, 108), PH);
  var PU_BOT = body(PA[0], PA[1], ang(140, 131, 108), PH);
  /* knee push-up geometry (same as PU-KNEE) */
  var KN = [97, 146];
  var KN_TOP = kbody(KN[0], KN[1], ang(146, 103, 76), 170, PH);
  var KN_BOT = kbody(KN[0], KN[1], ang(146, 130, 76), 170, PH);
  /* staggered hands: near hand forward, far hand back (both reachable with straight arms at the top) */
  var STG = [{ p: [174, 150], b: -1 }, { p: [146, 150], b: -1 }];

  /* Archer push-up seen from the FRONT (viewer in front of the head). The torso and legs point away from the
   * viewer, so they are foreshortened (k) and the legs are drawn rising behind the shoulders. t = -90: neck below hip.
   * With t = -90 the "near" limbs are on screen-RIGHT. Hands are wide: x = 82 and 158. */
  var AK = [0.35, 1, 1, 0.3, 0.3];
  var AL = [[104, 104], [76, 76]];
  var AHN = 161, AHF = 79;
  function arch(hx, hy, t, bn, bf) { return { h: [hx, hy], t: t, k: AK, a: [{ p: [AHN, 150], b: bn }, { p: [AHF, 150], b: bf }], l: AL, f: [90, 90] }; }

  /* Feet-elevated inverted row: heels on a chair seat (chair h 55 → seat top y 95), bar end-on above the chest */
  var FA = [38, 92];
  var FBAR = [134.6, 83.5];

  /* Commando pull-up, front view: the bar runs toward the viewer (seen end-on); both hands on it, one behind the other.
   * Knees slightly bent with the shins pointing back (away from the viewer), so the legs are foreshortened (k). */
  var BAR = [120, 20];
  function cmd(hx, hy, t, bn, bf) { return { h: [hx, hy], t: t, k: [1, 1, 1, 0.7, 0.7], a: [{ p: BAR, b: bn }, { p: BAR, b: bf }], l: [[-95, -100], [-85, -80]] }; }

  MCEX.add(
    {
      id: 'PU-ARCHER', ar: 'ضغط آرتشر مساعد', en: 'Assisted archer push-up', fam: 'push-up', pat: 'push_h', cat: 'upper', role: ['main'], lvl: 3,
      prim: ['chest', 'triceps'], sec: ['delts_front', 'core', 'obliques'], eq: [], space: '2×2 م', impact: 'none', pos: 'prone', flags: ['wrist', 'shoulder', 'elbow', 'floor'],
      dose: { u: 'reps', sets: [1, 3], reps: [3, 8], rest: [90, 120], side: true, tempo: '2-0-1' },
      setup: 'اتخذ وضع الضغط والكفان متباعدتان نحو ضعف عرض الكتفين، وأصابع اليدين للأمام أو للخارج قليلاً، والجسم مستقيم على أطراف القدمين.',
      steps: ['انقل وزنك نحو يد واحدة واثنِ مرفقها وانزل بالصدر فوقها.', 'أبقِ الذراع الأخرى شبه ممدودة جانباً، وادفع بها الأرض بالقدر الذي تحتاجه لتساعدك؛ كلما قل دفعها زادت الصعوبة.', 'توقف عندما يقترب الصدر من اليد المثنية دون أن يهبط الحوض أو يدور.', 'ادفع لتعود إلى المنتصف ثم كرر نحو اليد الأخرى.'],
      breath: 'شهيق أثناء النزول، زفير أثناء الدفع.',
      errors: ['دوران الحوض أو هبوطه أثناء الانتقال الجانبي', 'ثني الذراع المساعدة فتصبح ضغطة واسعة عادية', 'انفتاح مرفق الذراع العاملة للخارج بزاوية 90 درجة', 'النزول أعمق من المدى المريح للكتف'],
      stop: ['ألم في الكتف أو المرفق أو الرسغ', 'فقدان استقامة الجسم في أكثر من تكرارين'],
      prereq: 'إتقان الضغط بقبضة واسعة 3×12 والضغط بيدين متفاوتتين 3×8 لكل جهة دون ألم.',
      easier: ['PU-STAGGER', 'PU-WIDE'], harder: [], subs: ['PU-WIDE', 'PU-SL'], src: ['ACSM-RT'],
      desc: 'رسم أمامي من جهة الرأس: الكفان على الأرض متباعدتان كثيراً، والجذع والساقان ممتدة بعيداً عن الناظر فتظهر قصيرة وترتفع الساقان خلف الكتفين. ينتقل الجسم نحو يد واحدة وينثني مرفقها بينما تبقى الذراع الأخرى ممدودة جانباً، ثم يعود إلى المنتصف وينتقل نحو اليد الأخرى.',
      anim: { view: 'front', trace: 'neck', keys: [
        { p: arch(120, 101, -90, 1, -1), d: 1500, hold: 300, lab: 'انتقل وانزل نحو اليد اليمنى — شهيق' },
        { p: arch(131, 112, -84, 1, -1), d: 1200, hold: 300, lab: 'ادفع للمنتصف — زفير' },
        { p: arch(120, 101, -90, 1, -1), d: 1500, hold: 300, lab: 'انزل نحو اليد الأخرى — شهيق' },
        { p: arch(109, 112, -96, 1, -1), d: 1200, hold: 300, lab: 'ادفع للمنتصف — زفير' }
      ] }
    },
    {
      id: 'PU-STAGGER', ar: 'ضغط بيدين متفاوتتين', en: 'Staggered-hand push-up', fam: 'push-up', pat: 'push_h', cat: 'upper', role: ['main'], lvl: 2,
      prim: ['chest', 'triceps'], sec: ['delts_front', 'core', 'obliques'], eq: [], space: '1×2 م', impact: 'none', pos: 'prone', flags: ['wrist', 'shoulder', 'floor'],
      dose: { u: 'reps', sets: [1, 3], reps: [4, 10], rest: [60, 90], side: true, tempo: '2-0-1' },
      setup: 'اتخذ وضع الضغط العادي، ثم حرّك يداً واحدة للأمام نحو شبر والأخرى للخلف نحو شبر، والكفان بعرض الكتفين تقريباً.',
      steps: ['شد البطن والألوية ليبقى الحوض مستوياً ولا يدور.', 'اثنِ المرفقين وانزل بالصدر نحو الأرض بالتساوي بين اليدين.', 'ادفع الأرض لتعود والجسم مستقيم.', 'بعد إكمال التكرارات بدّل وضع اليدين وكرر العدد نفسه.'],
      breath: 'شهيق أثناء النزول، زفير أثناء الدفع.',
      errors: ['دوران الحوض أو الكتفين نحو اليد الأمامية', 'تفاوت كبير جداً بين اليدين يُجهد الكتف', 'هبوط الحوض', 'نسيان تبديل اليدين'],
      stop: ['ألم في كتف اليد الأمامية أو رسغها', 'فقدان استقامة الجسم'],
      prereq: 'إتقان الضغط العادي 3×10 بتقنية جيدة ودون ألم.',
      easier: ['PU-STD'], harder: ['PU-ARCHER'], subs: ['PU-STD', 'PU-WIDE'], src: ['ACSM-RT'],
      desc: 'رسم جانبي: جسم مستقيم على الكفين وأطراف القدمين، والكف القريبة من الناظر أمام الكتف بينما الكف البعيدة (الأفتح لوناً) خلفه، ينزل الصدر نحو الأرض ثم يدفع للعودة. التبديل بين اليدين يكون بين المجموعات.',
      anim: { view: 'side', trace: 'neck', keys: [
        { p: body(PA[0], PA[1], ang(140, 105, 108), STG), d: 1500, hold: 300, lab: 'نزول — شهيق' },
        { p: body(PA[0], PA[1], ang(140, 131, 108), STG), d: 1100, hold: 200, lab: 'دفع — زفير' }
      ] }
    },
    {
      id: 'PU-NEG', ar: 'ضغط سلبي (نزول بطيء)', en: 'Eccentric (negative) push-up', fam: 'push-up', pat: 'push_h', cat: 'upper', role: ['main'], lvl: 2,
      prim: ['chest', 'triceps'], sec: ['delts_front', 'core'], eq: ['mat'], space: '1×2 م', impact: 'none', pos: 'prone', flags: ['wrist', 'shoulder', 'floor'],
      dose: { u: 'reps', sets: [1, 3], reps: [3, 8], rest: [60, 90], tempo: '4-0-x' },
      setup: 'اتخذ وضع الضغط العادي: الكفان أسفل الكتفين والجسم مستقيم على أطراف القدمين.',
      steps: ['انزل ببطء خلال 3–5 ثوانٍ بالعد والجسم خط مستقيم حتى يقترب الصدر من الأرض.', 'أنزل الركبتين إلى الأرض بهدوء.', 'ادفع الأرض من وضع الركبتين لتمد الذراعين.', 'أرجع الساقين واحدة تلو الأخرى إلى وضع الضغط وكرر النزول البطيء.'],
      breath: 'شهيق طويل أثناء النزول البطيء، زفير أثناء الدفع من الركبتين.',
      errors: ['تسارع النزول في نصفه الأخير', 'هبوط الحوض أثناء النزول', 'حبس النفس', 'إلقاء الجسم على الأرض في النهاية'],
      stop: ['ألم في الرسغ أو الكتف أو المرفق', 'ارتعاش شديد يفقدك استقامة الجسم — قلل مدة النزول'],
      prereq: 'إتقان الضغط على الركبتين 3×10 والبلانك المرتفع 20 ثانية دون ألم.',
      easier: ['PU-KNEE', 'PU-INCL'], harder: ['PU-STD', 'PU-TEMPO'], subs: ['PU-INCL', 'PU-KNEE'], src: ['ACSM-RT'],
      desc: 'رسم جانبي: يبدأ الشخص في وضع الضغط ويهبط بجسم مستقيم ببطء شديد (نحو أربع ثوانٍ) حتى يقترب الصدر من الأرض، ثم ينزل الركبتين ويدفع من وضع الركبتين، ثم يمد الساقين ليعود إلى وضع الضغط. لا يوجد دفع من أطراف القدمين.',
      anim: { view: 'side', trace: 'neck', keys: [
        { p: PU_TOP, d: 4300, hold: 300, lab: 'انزل ببطء 4 ثوانٍ — شهيق' },
        { p: PU_BOT, d: 1000, hold: 200, lab: 'أنزل الركبتين' },
        { p: KN_BOT, d: 1100, hold: 200, lab: 'ادفع من الركبتين — زفير' },
        { p: KN_TOP, d: 1100, hold: 200, lab: 'مد الساقين إلى وضع الضغط' }
      ] }
    },
    {
      id: 'PU-INCL-CLOSE', ar: 'ضغط مائل بقبضة ضيقة', en: 'Close-grip incline push-up', fam: 'push-up', pat: 'push_h', cat: 'upper', role: ['main'], lvl: 1,
      prim: ['triceps', 'chest'], sec: ['delts_front', 'core'], eq: ['table'], space: '1×2 م أمام طاولة', impact: 'none', pos: 'standing', flags: ['wrist', 'shoulder', 'elbow'],
      dose: { u: 'reps', sets: [1, 3], reps: [6, 15], rest: [45, 90], tempo: '2-0-2' },
      setup: 'ضع الكفين على حافة طاولة متينة لا تنزلق بعرض الكتفين أو أضيق قليلاً، ثم أرجع القدمين حتى يستقيم الجسم على أطراف الأصابع.',
      steps: ['تأكد أن الطاولة ثابتة ومسنودة إلى حائط إن أمكن.', 'شد البطن والألوية واجعل الجسم خطاً مستقيماً.', 'اثنِ المرفقين وأبقهما ملاصقين للجذع متجهين للخلف وانزل بالصدر نحو الحافة.', 'ادفع حتى تمتد الذراعان دون قفل عنيف للمرفقين.'],
      breath: 'شهيق أثناء النزول، زفير أثناء الدفع.',
      errors: ['انفتاح المرفقين للخارج', 'تقريب الكفين حتى يتلامسا فيُجهد الرسغ', 'هبوط الحوض', 'استخدام سطح متحرك'],
      stop: ['تحرك الطاولة أو انزلاقها — توقف فوراً', 'ألم في المرفق أو الرسغ أو الكتف'],
      easier: ['PU-INCL', 'PU-WALL'], harder: ['PU-KNEE-CLOSE'], subs: ['PU-INCL', 'PU-WALL'], src: ['ACSM-RT'],
      desc: 'رسم جانبي: الكفان على حافة طاولة والقدمان على الأرض خلف الشخص، الجسم مستقيم ومائل، ينثني المرفقان للخلف بمحاذاة الجذع فينزل الصدر نحو الحافة ثم يدفع للعودة. الرسم الجانبي لا يُظهر ضيق القبضة، لذلك يُظهر الإطار الصغير في الزاوية منظراً علوياً لموضع الكفين: أضيق قليلاً من الكتفين.',
      anim: { view: 'side', props: [{ k: 'table', x: 170, w: 50, h: 52 }, { k: 'hands', r: 0.55 }], trace: 'neck', keys: [
        { p: body(103, 140, 54.6, HA(176, 98, -1)), d: 1400, hold: 300, lab: 'انزل والمرفقان للخلف — شهيق' },
        { p: body(103, 140, 40, HA(176, 98, -1)), d: 1100, hold: 200, lab: 'ادفع — زفير' }
      ] }
    },
    {
      id: 'PU-KNEE-CLOSE', ar: 'ضغط على الركبتين بقبضة ضيقة', en: 'Close-grip knee push-up', fam: 'push-up', pat: 'push_h', cat: 'upper', role: ['main'], lvl: 2,
      prim: ['triceps', 'chest'], sec: ['delts_front', 'core'], eq: ['mat'], space: '1×2 م', impact: 'none', pos: 'prone', flags: ['wrist', 'shoulder', 'elbow', 'floor'],
      dose: { u: 'reps', sets: [1, 3], reps: [6, 12], rest: [45, 90], tempo: '2-0-2' },
      setup: 'ارتكز على الكفين والركبتين، الكفان أسفل الكتفين مباشرة أو أضيق قليلاً، ثم حرك الركبتين للخلف حتى يستقيم الخط من الكتفين إلى الركبتين.',
      steps: ['شد البطن والألوية ولا تدع الوركين ينثنيان.', 'اثنِ المرفقين وأبقهما ملاصقين للجذع متجهين للخلف أثناء النزول.', 'انزل حتى يقترب الصدر من الأرض.', 'ادفع الأرض بقوة الذراعين لتعود والجسم كتلة واحدة.'],
      breath: 'شهيق أثناء النزول، زفير أثناء الدفع.',
      errors: ['انفتاح المرفقين للخارج', 'ثني الوركين ورفع المقعدة', 'تقريب الكفين حتى يتلامسا'],
      stop: ['ألم في المرفق أو الرسغ', 'ألم في الركبة من الضغط على الأرض — استخدم سجادة'],
      prereq: 'إتقان الضغط على الركبتين 3×12 والضغط المائل بقبضة ضيقة 3×12 دون ألم في المرفق.',
      easier: ['PU-INCL-CLOSE', 'PU-KNEE'], harder: ['PU-CLOSE'], subs: ['PU-KNEE', 'PU-INCL-CLOSE'], src: ['ACSM-RT'],
      desc: 'رسم جانبي: الشخص مرتكز على الكفين والركبتين، الخط مستقيم من الكتفين إلى الركبتين، ينثني المرفقان للخلف بمحاذاة الجذع فينزل الصدر نحو الأرض ثم يدفع للعودة. الرسم الجانبي لا يُظهر ضيق القبضة، لذلك يُظهر الإطار الصغير في الزاوية منظراً علوياً لموضع الكفين: أضيق قليلاً من الكتفين.',
      anim: { view: 'side', props: [{ k: 'mat', x1: 50, x2: 200 }, { k: 'hands', r: 0.55 }], trace: 'neck', keys: [
        { p: KN_TOP, d: 1400, hold: 300, lab: 'نزول والمرفقان للخلف — شهيق' },
        { p: KN_BOT, d: 1100, hold: 200, lab: 'دفع — زفير' }
      ] }
    },
    {
      id: 'PH-INV-FEETUP', ar: 'سحب أفقي بقدمين مرتفعتين', en: 'Feet-elevated inverted row', fam: 'row', pat: 'pull_h', cat: 'upper', role: ['main'], lvl: 3,
      prim: ['upper_back', 'lats'], sec: ['biceps', 'forearms', 'core', 'glutes'], eq: ['low_bar', 'chair'], space: 'تحت عارضة منخفضة + كرسي، 2.5 م', impact: 'none', pos: 'supine', flags: ['supine', 'floor', 'grip', 'shoulder', 'elbow', 'inversion'],
      dose: { u: 'reps', sets: [1, 3], reps: [4, 10], rest: [90, 120], tempo: '2-1-2' },
      setup: 'تأكد أن العارضة ثابتة ومحكمة وأن الكرسي ثابت ومسنود. استلقِ تحت العارضة وأمسكها فوق الصدر بقبضة علوية بعرض الكتفين، وضع الكعبين على مقعد الكرسي والساقان ممدودتان.',
      steps: ['شد البطن والألوية ليستقيم الجسم من الكتفين إلى الكعبين.', 'اسحب الصدر نحو العارضة بثني المرفقين وضم لوحي الكتف حتى يصبح الجسم أفقياً تقريباً.', 'توقف لحظة في الأعلى.', 'انزل ببطء حتى تمتد الذراعان والجسم مستقيم ومائل والرأس أخفض من القدمين.'],
      breath: 'زفير أثناء السحب، شهيق أثناء النزول.',
      errors: ['هبوط الحوض وانثناء الوركين', 'شد الذقن نحو العارضة بدل الصدر', 'السقوط السريع في النزول', 'كرسي أو عارضة غير ثابتين'],
      stop: ['أي حركة في العارضة أو انزلاق الكرسي', 'انزلاق القبضة', 'ألم في الكتف أو المرفق أو دوخة'],
      prereq: 'إتقان السحب الأفقي بساقين ممدودتين على الأرض 3×10 بتقنية جيدة.',
      easier: ['PH-INV'], harder: [], subs: ['PH-INV', 'PH-TABLE'], src: ['ACSM-RT'],
      desc: 'رسم جانبي: العارضة مرئية من طرفها فوق الصدر والكعبان على كرسي خلف الشخص، يسحب الجسم المستقيم نحو العارضة حتى يصبح شبه أفقي، ثم ينزل حتى تمتد الذراعان فيميل الجسم والرأس أخفض من القدمين.',
      anim: { view: 'side', props: [{ k: 'chair', x: 22, w: 32, h: 55, back: 'l' }, { k: 'barx', x: FBAR[0], y: FBAR[1] }], trace: 'neck', keys: [
        { p: body(FA[0], FA[1], -21, HA(FBAR[0], FBAR[1], 1), [80, 80]), d: 1300, hold: 200, lab: 'اسحب — زفير' },
        { p: body(FA[0], FA[1], 5, HA(FBAR[0], FBAR[1], 1), [80, 80], 10), d: 1800, hold: 400, lab: 'انزل ببطء — شهيق' }
      ] }
    },
    {
      id: 'PV-COMMANDO', ar: 'عقلة الكوماندوز', en: 'Commando pull-up (neutral side grip)', fam: 'pull-up', pat: 'pull_v', cat: 'upper', role: ['main'], lvl: 3,
      prim: ['lats', 'biceps'], sec: ['upper_back', 'forearms', 'core', 'obliques'], eq: ['bar'], space: 'تحت عقلة ثابتة', impact: 'none', pos: 'hanging', flags: ['shoulder', 'elbow', 'grip', 'overhead'],
      dose: { u: 'reps', sets: [1, 3], reps: [2, 6], rest: [90, 120], side: true },
      setup: 'قف تحت العقلة بحيث تمتد فوق رأسك من الأمام إلى الخلف، وأمسكها بكلتا اليدين متقاربتين إحداهما أمام الأخرى والكفان متقابلتان، ثم تعلق والذراعان ممدودتان.',
      steps: ['اسحب لوحي الكتف للأسفل قبل ثني المرفقين.', 'اسحب الجسم للأعلى وأمل الرأس قليلاً ليمر بجانب العقلة حتى يتجاوز الذقن مستواها.', 'انزل ببطء حتى تمتد الذراعان.', 'في التكرار التالي مرر الرأس من الجانب الآخر، أو بدّل وضع اليدين بين المجموعات.'],
      breath: 'زفير أثناء السحب، شهيق أثناء النزول.',
      errors: ['التأرجح أو الدوران حول العقلة', 'ضرب الرأس بالعقلة', 'السحب إلى جانب واحد دائماً', 'السقوط السريع في النزول'],
      stop: ['ألم في الكتف أو المرفق أو الرسغ', 'انزلاق القبضة'],
      prereq: 'إتقان العقلة بقبضة سفلية 3×5 دون ألم.',
      easier: ['PV-CHIN', 'PV-NEG'], harder: [], subs: ['PV-CHIN', 'PV-PULLUP'], src: ['ACSM-RT'],
      desc: 'رسم أمامي: العقلة ممتدة نحو الناظر فتظهر من طرفها فوق الرأس، والكفان متقاربتان عليها (إحداهما خلف الأخرى فتتطابقان في الرسم). يسحب الشخص جسمه فيمر الرأس بجانب العقلة من جهة، ثم ينزل، ثم يسحب ويمر الرأس من الجهة الأخرى.',
      anim: { view: 'front', hang: true, floor: false, props: [{ k: 'barx', x: BAR[0], y: BAR[1] }], trace: 'head', keys: [
        { p: cmd(120, 108, 90, -1, -1), d: 1300, hold: 300, lab: 'اسحب والرأس لجهة — زفير' },
        { p: cmd(108, 69, 94, -1, -1), d: 1800, hold: 300, lab: 'انزل ببطء — شهيق' },
        { p: cmd(120, 108, 90, 1, 1), d: 1300, hold: 300, lab: 'اسحب والرأس للجهة الأخرى — زفير' },
        { p: cmd(132, 69, 86, 1, 1), d: 1800, hold: 300, lab: 'انزل ببطء — شهيق' }
      ] }
    }
  );

})();
