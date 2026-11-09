/* Exercise registry, vocabularies and shared helpers. Loaded before ex_*.js files. */
(function (root) {
  'use strict';
  var list = [];
  var MCEX = {
    list: list,
    add: function () { for (var i = 0; i < arguments.length; i++) list.push(arguments[i]); },
    byId: function (id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; },
    /* Muscle / area vocabulary (Arabic labels). */
    MUSCLE: {
      chest: 'الصدر', triceps: 'ثلاثية الرؤوس', delts_front: 'الكتف الأمامي', delts_side: 'الكتف الجانبي', delts_rear: 'الكتف الخلفي',
      upper_back: 'أعلى الظهر ولوحا الكتف', lats: 'العضلة الظهرية العريضة', biceps: 'ذات الرأسين', forearms: 'الساعد وقوة القبضة',
      core: 'عضلات البطن العميقة والأمامية', obliques: 'العضلات المائلة', lower_back: 'باسطات الظهر', glutes: 'الألوية', glute_med: 'الألوية الجانبية',
      quads: 'الفخذ الأمامية', hamstrings: 'الفخذ الخلفية', adductors: 'الضامة (الفخذ الداخلية)', hip_flexors: 'مثنيات الورك', calves: 'الساق الخلفية (السمانة)',
      tibialis: 'الساق الأمامية', cardio: 'الجهاز القلبي التنفسي', t_spine: 'العمود الصدري', hips: 'مفصل الورك', shoulders_mob: 'حركة الكتف',
      ankles: 'الكاحل', wrists: 'الرسغ', neck: 'الرقبة', pelvic_floor: 'قاع الحوض', diaphragm: 'الحجاب الحاجز', balance: 'التوازن'
    },
    PATTERN: {
      push_h: 'دفع أفقي', push_v: 'دفع رأسي', pull_h: 'سحب أفقي', pull_v: 'سحب رأسي', scap: 'تحكم لوح الكتف', squat: 'قرفصاء', hinge: 'مفصلة الورك',
      lunge: 'اندفاع/ساق واحدة', bridge: 'جسر/مد الورك', calf: 'الكاحل والساق', hip_abd: 'إبعاد الورك', core_ext: 'مقاومة تقوس الجذع', core_lat: 'ثبات جانبي',
      core_rot: 'مقاومة الدوران/دوران', core_flex: 'ثني الجذع', back_ext: 'مد الظهر', locomotion: 'تنقل', cardio: 'تحمل قلبي', plyo: 'قفز/انفجاري',
      mobility: 'حركية', stretch: 'إطالة', balance: 'توازن', breathing: 'تنفس'
    },
    CAT: { upper: 'الجزء العلوي', lower: 'الجزء السفلي', core: 'الجذع', cardio: 'تحمل وتنقل', mobility: 'حركية وإطالة', balance: 'توازن' },
    LEVEL: { 1: 'مبتدئ', 2: 'متوسط', 3: 'متقدم' },
    EQUIP: { none: 'بدون أدوات', wall: 'حائط', chair: 'كرسي ثابت', step: 'درجة/عتبة ثابتة', table: 'طاولة متينة', bar: 'عقلة ثابتة', low_bar: 'عارضة منخفضة ثابتة', towel: 'منشفة', mat: 'سجادة تمرين', space: 'مساحة مفتوحة', stairs: 'درج',
      dumbbell: 'دمبل', barbell: 'بار حديد وأقراص', rack: 'حامل بار (رف)', bench: 'بنش (مقعد)', kettlebell: 'كيتل بل', cable: 'جهاز كيبل', machine: 'أجهزة الصالة (مقعد/رافعة)', legpress: 'جهاز دفع الأرجل', pulldown: 'جهاز السحب العلوي' },
    EQUIP_EN: { dumbbell: 'Dumbbells', barbell: 'Barbell & plates', rack: 'Squat rack', bench: 'Bench', kettlebell: 'Kettlebell', cable: 'Cable machine', machine: 'Gym machines', legpress: 'Leg press', pulldown: 'Lat pulldown' },
    FLAG: {
      wrist: 'تحميل على الرسغ', shoulder: 'تحميل على الكتف', overhead: 'رفع الذراعين فوق الرأس', elbow: 'تحميل على المرفق', knee: 'ثني ركبة تحت حمل', hip: 'تحميل على الورك',
      lowback: 'تحميل أسفل الظهر', ankle: 'تحميل على الكاحل', neck: 'وضع الرقبة', supine: 'استلقاء على الظهر', prone: 'انبطاح على البطن', inversion: 'الرأس أخفض من القلب',
      impact: 'تأثير عالٍ (قفز/هبوط)', balance: 'يتطلب توازناً (خطر سقوط)', iap: 'ضغط مرتفع داخل البطن', isometric_long: 'ثبات طويل (خطر حبس النفس)', floor: 'النزول إلى الأرض', grip: 'قبضة وتعلق'
    },
    /* Universal stop signs shown with every exercise (see SOURCES: ACOG CO 804, AHA warning signs, PAR-Q+ guidance). */
    STOP_ALL: [
      'ألم أو ضغط أو انزعاج في الصدر أو الذراع أو الفك',
      'دوخة شديدة أو إغماء أو شعور بقرب فقدان الوعي',
      'ضيق نفس غير متناسب مع الجهد أو لا يتحسن بالراحة',
      'خفقان غير منتظم أو تسارع غير معتاد في القلب',
      'ألم حاد أو مفاجئ في مفصل أو عضلة، أو خدر أو تنميل',
      'للحامل: نزيف مهبلي، تسرب سوائل، انقباضات منتظمة مؤلمة، صداع شديد، ألم أو تورم في ربلة الساق'
    ]
  };
  root.MCEX = MCEX;
})(typeof window !== 'undefined' ? window : globalThis);
