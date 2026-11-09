/* Source register. status: 'search' = title/URL/facts seen in web-search results on 2026-11-09 (the document itself
 * could not be opened from the build environment — network policy blocked the hosts); 'unverified' = from prior
 * knowledge, not confirmed. NO source below was opened in full. Nothing here implies endorsement by any publisher. */
(function (root) {
  'use strict';
  var ACCESS = '2026-11-09';
  root.MCSRC = {
    accessDate: ACCESS,
    note: 'جميع المصادر رُصدت عبر نتائج البحث بتاريخ 2026-11-09 فقط؛ لم يكن فتح المستندات الأصلية ممكناً من بيئة البناء (حجب الشبكة). يجب على المدرب أو المطوّر مراجعة النص الأصلي قبل الاعتماد. لا يدّعي التطبيق اعتماداً أو تصديقاً من أي جهة.',
    list: [
      { key: 'PARQ', title: 'The Physical Activity Readiness Questionnaire for Everyone (PAR-Q+) — 2025 version', pub: 'PAR-Q+ Collaboration (Warburton, Jamnik, Bredin, Gledhill)', date: '2025 (some copies dated 01-11-2024)', url: 'https://eparmedx.com/', status: 'search',
        use: 'محاور أسئلة الفحص السبعة (صيغة عربية محلية خاصة بالتطبيق، وليست PAR-Q+ ولا ترجمة له). الاستمارة الرسمية تشترط استخدامها كاملة دون تعديل؛ لم يُعثر على ترخيص للاستخدام البرمجي/الترجمة، لذلك لم تُنسخ.' },
      { key: 'EPARMEDX', title: 'ePARmed-X+ (online follow-up) and Physician Clearance Follow-Up form', pub: 'PAR-Q+ Collaboration', date: '2024 form copy', url: 'https://eparmedx.com/', status: 'search',
        use: 'قاعدة: أي إجابة إيجابية تحيل إلى متابعة/تصريح مختص، ونشاط منخفض الشدة فقط حتى التصريح.' },
      { key: 'RIEBE2015', title: "Updating ACSM's Recommendations for Exercise Preparticipation Health Screening", pub: 'Riebe D, Franklin BA, Thompson PD, et al. Med Sci Sports Exerc 47(11):2473–2479', date: '2015', url: 'https://doi.org/10.1249/MSS.0000000000000664', status: 'search',
        use: 'منطق: النشاط الحالي + مرض قلبي/استقلابي/كلوي معروف + أعراض ⇒ الإحالة أو التدرج من شدة خفيفة–متوسطة.' },
      { key: 'ACSM-GETP', title: "ACSM's Guidelines for Exercise Testing and Prescription, 12th ed.", pub: 'American College of Sports Medicine / Wolters Kluwer', date: '2025', url: 'https://acsm.org/certification-exam-2025-getp12/', status: 'search',
        use: 'مرجع عام لوصف الإحماء والتهدئة والتدرج. لم تُنقل أي جداول منه.' },
      { key: 'ACSM-RT', title: 'ACSM Position Stand: Progression Models in Resistance Training for Healthy Adults', pub: 'American College of Sports Medicine. Med Sci Sports Exerc 41(3):687–708', date: '2009 (superseded 2026)', url: 'https://pubmed.ncbi.nlm.nih.gov/19204579/', status: 'search',
        use: 'المبتدئ 8–12 تكراراً، 2–3 أيام/أسبوع؛ زيادة الحمل عند تجاوز الهدف بتكرار أو تكرارين — تُرجمت لوزن الجسم إلى +خطوة جرعة أو بديل أصعب. شرط "جلستين متتاليتين" اختيار تحفّظي من التطبيق.' },
      { key: 'ACSM-RT26', title: 'ACSM Position Stand: Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults', pub: 'Phillips SM et al., Med Sci Sports Exerc (DOI not confirmed)', date: 'March 2026', url: 'https://acsm.org/resistance-training-guidelines-update-2026/', status: 'search',
        use: 'تدريب جميع المجموعات العضلية الرئيسة مرتين أسبوعياً على الأقل؛ لا حاجة للتدريب حتى الفشل ⇒ هدف الجهد 6–7 من 10.' },
      { key: 'AHA2007', title: 'Resistance Exercise in Individuals With and Without Cardiovascular Disease: 2007 Update', pub: 'Williams MA et al., Circulation 116(5):572–584', date: '2007', url: 'https://doi.org/10.1161/CIRCULATIONAHA.107.185214', status: 'search',
        use: 'تجنب حبس النفس (فالسالفا) — العبارة رُصدت في مصادر ثانوية فقط.' },
      { key: 'AHA2023', title: 'Resistance Exercise Training in Individuals With and Without Cardiovascular Disease: 2023 Update', pub: 'Paluch AE et al., Circulation 149(3):e217–e231', date: '2024', url: 'https://doi.org/10.1161/CIR.0000000000001189', status: 'search',
        use: 'تمارين المقاومة يومان أسبوعياً على الأقل ضمن برنامج متوازن.' },
      { key: 'AHA-WARN', title: 'Warning Signs of a Heart Attack', pub: 'American Heart Association', date: 'undated web page', url: 'https://www.heart.org/en/health-topics/heart-attack/warning-signs-of-a-heart-attack', status: 'search',
        use: 'علامات الإيقاف الفوري والاتصال بالطوارئ (ألم/ضغط الصدر، انتشار الألم للذراع/الفك/الظهر، ضيق النفس، عرق بارد، غثيان، دوار).' },
      { key: 'PAG2018', title: 'Physical Activity Guidelines for Americans, 2nd edition', pub: 'U.S. Department of Health and Human Services', date: '2018', url: 'https://health.gov/PAGuidelines', status: 'search',
        use: '150–300 دقيقة نشاطاً متوسطاً أسبوعياً، تقوية عضلية ≥ يومين، تمارين توازن لمن هم ≥ 65 عاماً، ≥150 دقيقة للحامل وبعد الولادة.' },
      { key: 'CDC-ADULT', title: 'Adult Activity: An Overview', pub: 'Centers for Disease Control and Prevention', date: 'web page', url: 'https://www.cdc.gov/physical-activity-basics/guidelines/adults.html', status: 'search', use: 'ملخص التوصيات نفسها للبالغين (عرض في الملخص الأسبوعي).' },
      { key: 'WHO2020', title: 'WHO guidelines on physical activity and sedentary behaviour', pub: 'World Health Organization, ISBN 978-92-4-001512-8 (CC BY-NC-SA 3.0 IGO)', date: '2020', url: 'https://www.who.int/publications/i/item/9789240015128', status: 'search', use: 'توصيات الحمل وما بعد الولادة وكبار السن.' },
      { key: 'ACOG804', title: 'Physical Activity and Exercise During Pregnancy and the Postpartum Period. Committee Opinion No. 804', pub: 'American College of Obstetricians and Gynecologists, Obstet Gynecol 135(4):e178–e188', date: 'April 2020 (reaffirmation status not confirmed)', url: 'https://doi.org/10.1097/AOG.0000000000003772', status: 'search',
        use: 'مسار الحمل: موافقة مقدم الرعاية، موانع مطلقة/نسبية، علامات إيقاف التمرين، تجنب الاستلقاء على الظهر لفترات طويلة (بعد نحو 20 أسبوعاً)، تجنب أنشطة السقوط والتلامس. بعض البنود من ملخصات ثانوية.' },
      { key: 'GOOM2019', title: 'Returning to running postnatal – guidelines for medical, health and fitness professionals managing this population', pub: 'Goom T, Donnelly G, Brockwell E', date: 'March 2019', url: 'https://www.running-physio.com/postnatal-guide', status: 'search',
        use: 'منع القفز/الجري قبل 12 أسبوعاً بعد الولادة ومع أعراض قاع الحوض؛ الإحالة لأخصائي صحة الحوض.' },
      { key: 'NICE-NG210', title: 'Pelvic floor dysfunction: prevention and non-surgical management (NG210)', pub: 'National Institute for Health and Care Excellence', date: '9 December 2021', url: 'https://www.nice.org.uk/guidance/ng210', status: 'search', use: 'أعراض قاع الحوض ⇒ تقييم مختص؛ التطبيق لا يشخّص ولا يعلّم تمارين قاع الحوض العلاجية.' },
      { key: 'FM722', title: 'FM 7-22 Holistic Health and Fitness', pub: 'Headquarters, Department of the Army', date: '1 October 2020 (a newer edition may exist — not confirmed)', url: 'https://armypubs.army.mil/', status: 'search', use: 'مبادئ البرمجة العسكرية العامة (إحماء، تدريب، استشفاء).' },
      { key: 'ATP722', title: 'ATP 7-22.02 Holistic Health and Fitness Drills and Exercises', pub: 'Headquarters, Department of the Army', date: 'October 2020', url: 'https://armypubs.army.mil/', status: 'search', use: 'أسماء تمارين تدريبات التحضير والاستشفاء والتكييف (أسماء فقط؛ الشرح بصياغة التطبيق).' },
      { key: 'AFT', title: 'Army Fitness Test (AFT)', pub: 'U.S. Army', date: 'test of record from 1 June 2025', url: 'https://www.army.mil/aft/', status: 'search', use: 'اسم حدث الضغط برفع اليدين (Hand-Release Push-Up) فقط؛ لا تُستخدم معايير التسجيل.' },
      { key: 'USMC', title: 'MCO 6100.13A W/ADMIN CH 5 (PFT/CFT) and HITT resources', pub: 'U.S. Marine Corps', date: '28 May 2025', url: 'https://www.fitness.marines.mil/', status: 'search', use: 'سياق فقط؛ لم تُستخدم معايير أو برامج HITT.' },
      { key: 'OMNI', title: 'Concurrent validation of the OMNI perceived exertion scale for resistance exercise', pub: 'Robertson RJ et al., Med Sci Sports Exerc 35(2):333–341', date: '2003', url: 'https://doi.org/10.1249/01.MSS.0000048831.15016.2A', status: 'unverified',
        use: 'سلم جهد رقمي 0–10 بصياغة عربية خاصة بالتطبيق (ليس سلم OMNI المصوّر). DOI من المعرفة السابقة — غير مؤكد.' },
      { key: 'BORG', title: 'Psychophysical bases of perceived exertion', pub: 'Borg GA, Med Sci Sports Exerc 14(5):377–381', date: '1982', url: 'https://pubmed.ncbi.nlm.nih.gov/7154893/', status: 'search', use: 'لم يُضمَّن سلم Borg لأنه محمي بحقوق ويتطلب ترخيصاً. رابط PubMed من المعرفة السابقة.' },
      { key: 'FOSTER2001', title: 'A new approach to monitoring exercise training', pub: 'Foster C et al., J Strength Cond Res 15(1):109–115', date: '2001', url: 'https://pubmed.ncbi.nlm.nih.gov/11708692/', status: 'search', use: 'حمل الحصة = جهد الحصة (0–10) × الدقائق. رابط PubMed من المعرفة السابقة.' },
      { key: 'NPRS', title: 'Measures of adult pain (NRS-11 among others)', pub: 'Hawker GA et al., Arthritis Care Res 63(S11):S240–S252', date: '2011', url: 'https://doi.org/10.1002/acr.20543', status: 'search', use: 'سلم الألم الرقمي 0–10. عتبات التطبيق (≥4 استبدال، ≥7 إيقاف وإحالة) اختيار تحفّظي من التطبيق وليست من المصدر.' },
      { key: 'NHS-STR', title: 'Strength exercises (NHS Live Well)', pub: 'NHS (UK)', date: 'web page', url: 'https://www.nhs.uk/live-well/exercise/strength-and-flexibility-exercises/strength-exercises/', status: 'search', use: 'مرجع عام لوصف تمارين وزن الجسم الأساسية (دون نسخ النص).' },
      { key: 'NIA', title: 'Four Types of Exercise Can Improve Your Health and Physical Ability', pub: 'National Institute on Aging / health.gov', date: 'web page', url: 'https://health.gov/healthypeople/tools-action/browse-evidence-based-resources/exercise-and-physical-activity-four-types-exercise-can-improve-your-health-and-physical-ability', status: 'search', use: 'عدم تدريب المجموعة العضلية نفسها في يومين متتاليين؛ أمثلة التوازن (المشي كعب-أصابع).' },
      { key: 'HPRC', title: 'Physical Fitness Training Series — USMC PFT', pub: 'DoD Human Performance Resources by CHAMP', date: 'web page', url: 'https://hprc-online.org/physical-fitness/training-performance/physical-fitness-training-series-usmc-physical-fitness-test', status: 'search', use: 'سياق فقط.' },
      { key: 'LOCAL', title: 'Local conservative product rules (this application)', pub: 'Military Calisthenics Coach v5 development', date: '2026-11', url: '', status: 'local',
        use: 'قواعد اختيارية تحفّظية ليست مأخوذة من مصدر: حد 3 تقدمات أسبوعياً، عتبات الألم، الإنجاز ≥100% مع جهد ≤7 للتقدم، استبعاد الانبطاح للحامل بعد 12 أسبوعاً، تحديد المستوى من الاختبار الأساسي.' }
    ]
  };
})(typeof window !== 'undefined' ? window : globalThis);
