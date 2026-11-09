# SOURCES_RESEARCH — Military bodyweight calisthenics coach (Arabic, offline)

Research date: 2026-11-09. Researcher: Claude (subagent).

## Method and verification status (read first)

- **WebFetch failed for every host tried** (eparmedx.com, southlake.ca, acsm.org, digitalcommons.uri.edu):
  `getaddrinfo ENOTFOUND` — hosts are outside this session's allowed network. Per session policy I stopped
  trying more hosts. curl is blocked too. **No source in this file was actually opened (no VERIFIED-OPENED).**
- **WebSearch worked.** Everything below comes from search result titles, URLs and snippets.
- Status labels used:
  - `SEEN-IN-SEARCH` — URL and the stated facts appeared in search results/snippets (often secondary summaries).
  - `SEEN-IN-SEARCH (secondary)` — the fact came from a third-party summary citing the source, not from the source.
  - `UNVERIFIED (prior knowledge)` — I believe this from training knowledge but did NOT confirm it this session.
    The app team must check these against the primary document before shipping.
- To upgrade to VERIFIED-OPENED, allow these hosts in the environment network settings and re-run:
  eparmedx.com, acsm.org, journals.lww.com, ahajournals.org, heart.org, cdc.gov, health.gov (odphp.health.gov),
  acog.org, nice.org.uk, armypubs.army.mil, fitness.marines.mil, who.int, pubmed.ncbi.nlm.nih.gov, nhs.uk, nia.nih.gov.

---

## 1. PAR-Q+ and ePARmed-X+

### 1a. The 2025 PAR-Q+ (Physical Activity Readiness Questionnaire for Everyone)
- Publisher: PAR-Q+ Collaboration (Warburton DER, Jamnik VK, Bredin SSD, Gledhill N). Official site www.eparmedx.com; contact email printed on the forms: eparmedx@gmail.com.
- Version: Third-party copies show a "2025 PAR-Q+" form with "Copyright © 2025 PAR-Q+ Collaboration"; some copies have a footer date of 01-11-2024. So the current form is the **2025 PAR-Q+** (footer date 01-11-2024 on some copies). A 2023 version was described in HFJC as superseding all earlier ones.
- URLs:
  - Official site: https://eparmedx.com/ — UNVERIFIED (fetch failed, DNS blocked)
  - Third-party copy of the 2025 form: https://southlake.ca/wp-content/uploads/2025/02/PARQPlus2025-Form-fillable.pdf — SEEN-IN-SEARCH (fetch failed)
  - Third-party copy: https://vancouver.ca/files/cov/parq-plus.pdf — SEEN-IN-SEARCH
  - HFJC article: Bredin, Jamnik, Gledhill, Warburton (2025) "The PAR-Q+ and ePARmed-X+: As easy as 1, 2, 3", Health & Fitness Journal of Canada 18(1):75-79 — citation SEEN-IN-SEARCH only; article URL not confirmed. Related HFJC page: https://hfjc.library.ubc.ca/index.php/HFJC/article/view/753 ("The PAR-Q+ and ePARmed-X+: Knowledge Mobilization Resources for Clients and Practitioners") — SEEN-IN-SEARCH.
- **Licensing / permission (SEEN-IN-SEARCH, from form copies):**
  - The form encourages photocopying, but says you **must use the entire questionnaire and no changes are permitted**.
  - No explicit licence was found for software use or for translating/adapting it. **Implication for the app:** do NOT embed a modified, partial or translated PAR-Q+ and label it "PAR-Q+". Options: (a) get written permission (eparmedx@gmail.com) for an Arabic in-app version; (b) link to or print the official form, then record in the app only the outcome ("all NO" / "any YES → referred / cleared by"); (c) write your own screening questions (own wording, inspired by ACSM topics) and do not call them PAR-Q+.
- **Topics of the 7 general health questions** (paraphrased; SEEN-IN-SEARCH from 2025/2022 form snippets):
  1. Has a doctor said the person has a heart condition or high blood pressure?
  2. Chest pain at rest, during daily activities, or during physical activity?
  3. Loss of balance from dizziness, or loss of consciousness, in the last 12 months? (The forms tell people to answer NO if dizziness was linked to over-breathing, including during vigorous exercise — UNVERIFIED wording detail.)
  4. Diagnosis of another chronic medical condition (other than heart disease or high blood pressure)?
  5. Currently taking prescribed medication for a chronic condition?
  6. A current or recent (about 12 months) bone, joint or soft-tissue problem that physical activity could make worse? (Exact wording not confirmed; topic is musculoskeletal problem.)
  7. Has a doctor said the person should only do medically supervised physical activity?
- **What the instrument says** (SEEN-IN-SEARCH):
  - All NO → cleared for physical activity. The form gives general advice: start slowly, build up gradually, follow international guidelines for the person's age. Other advice is UNVERIFIED (prior knowledge): consult a QEP for a fitness assessment; people over 45 not used to vigorous exercise should consult a QEP first; delay starting if unwell with a temporary illness; pregnant people should talk to a provider.
  - Any YES → complete the follow-up questions on pages 2–3. The follow-up categories (2022/2025 snippets plus prior knowledge) are: arthritis/osteoporosis/back problems; cancer; heart or cardiovascular condition; high blood pressure; metabolic conditions (diabetes etc.); mental health/learning problems; respiratory disease; spinal cord injury; stroke; other conditions. Each asks, for example, whether the condition is hard to control with medication. If all follow-ups are NO, the person is cleared. If any are YES, they go to ePARmed-X+ or see a qualified exercise professional / doctor.
  - A change in health → stop and reassess (UNVERIFIED wording).

### 1b. ePARmed-X+
- What it is (SEEN-IN-SEARCH, HealthLinkBC page https://www.healthlinkbc.ca/living-well/physical-activity/general-information-and-tools/tools-and-resources/par-q-and-eparmed-x): an interactive online tool (www.eparmedx.com) used when the person answers YES to any follow-up question on PAR-Q+ pages 2–3. It can be completed alone or with a qualified exercise professional.
- ePARmed-X+ Physician Clearance Follow-Up form: lets the health care provider say which exercises to include or avoid. A 2024 copy is at https://vancouver.ca/files/cov/eparmedx-physician-clearance-form.pdf (SEEN-IN-SEARCH), © PAR-Q+ Collaboration.
- Secondary (SEEN-IN-SEARCH, BCRPA): until medical clearance is received, the participant is limited to **low-intensity** activity.
- Reported referral rate: around 1–2% of respondents referred (secondary, SEEN-IN-SEARCH).

---

## 2. ACSM preparticipation health screening

### 2a. Riebe D et al. 2015
- Citation: Riebe D, Franklin BA, Thompson PD, Garber CE, Whitfield GP, Magal M, Pescatello LS. "Updating ACSM's Recommendations for Exercise Preparticipation Health Screening." Med Sci Sports Exerc. 2015;47(11):2473–2479. **DOI 10.1249/MSS.0000000000000664** — SEEN-IN-SEARCH (several records; one secondary listing gave other volume/issue numbers, so the DOI is the reliable identifier).
- URLs: https://doi.org/10.1249/MSS.0000000000000664 (constructed from the confirmed DOI; not opened); repository record https://digitalcommons.uri.edu/kinesiology_facpubs/180 — SEEN-IN-SEARCH (fetch failed).
- Algorithm logic (SEEN-IN-SEARCH from ACE/IDEA/NFPT summaries, plus UNVERIFIED detail from prior knowledge):
  - The inputs are (1) current exercise participation (planned moderate exercise, at least 30 min, at least 3 d/wk, for at least the last 3 months); (2) known cardiovascular, metabolic (type 1/2 diabetes) or renal disease; (3) signs/symptoms suggestive of these diseases; (4) desired exercise intensity.
  - **Not currently exercising:**
    - No disease, no symptoms → no medical clearance needed. Start at light–moderate intensity and progress gradually to vigorous.
    - Known disease, no symptoms → medical clearance recommended. After clearance, light–moderate intensity, then progress.
    - Any signs/symptoms, with or without disease → medical clearance recommended. After clearance, light–moderate intensity, then progress.
  - **Currently exercising:**
    - No disease, no symptoms → no clearance needed. Continue moderate or vigorous and progress.
    - Known disease, no symptoms → no clearance needed for moderate intensity. Clearance recommended before vigorous (UNVERIFIED wording: "within the last 12 months if no change in signs/symptoms").
    - Any signs/symptoms → **stop exercise** and get medical clearance before resuming at any intensity.
  - Signs/symptoms list (UNVERIFIED, prior knowledge of the ACSM table): pain or discomfort in the chest, neck, jaw or arms that may be ischaemic; shortness of breath at rest or with mild exertion; dizziness or syncope; orthopnoea or paroxysmal nocturnal dyspnoea; ankle oedema; palpitations or tachycardia; intermittent claudication; known heart murmur; unusual fatigue or shortness of breath with usual activities.
  - The removed step: risk-factor counting no longer drives referral. It was dropped because it caused excessive physician referrals (SEEN-IN-SEARCH).
- ACSM consumer brochure "Who needs a stress test before exercising": https://acsm.org/docs/default-source/files-for-resource-library/cpi-who-needs-a-stress-test-before-exercising-brochure.pdf — SEEN-IN-SEARCH.

### 2b. ACSM's Guidelines for Exercise Testing and Prescription — latest edition
- **12th edition (GETP12)**, Wolters Kluwer, 2025; publication dates in retailer listings range from 23–31 March 2025 (around April 2025). ISBN 9781975219208 (paperback); 9781975219215 (another format). ACSM certification exams have reflected GETP12 since **10 July 2025**. — SEEN-IN-SEARCH.
- URLs: https://acsm.org/certification-exam-2025-getp12/ (fetch failed, DNS blocked); excerpt PDF https://acsm.org/wp-content/uploads/2025/03/GETP12_excerpt.pdf — SEEN-IN-SEARCH.
- Editors: not confirmed (retailers name Ozemek; some name Liguori). Do not print an editor name without checking.

---

## 3. ACSM resistance-training position stands

### 3a. 2009 Position Stand (now superseded)
- American College of Sports Medicine. "American College of Sports Medicine position stand. Progression models in resistance training for healthy adults." Med Sci Sports Exerc. 2009;41(3):687–708. DOI 10.1249/MSS.0b013e3181915670. PubMed 19204579: https://pubmed.ncbi.nlm.nih.gov/19204579/ — SEEN-IN-SEARCH. (Lead author Ratamess NA — UNVERIFIED, prior knowledge.)
- Key facts (from abstract snippets — SEEN-IN-SEARCH):
  - The core principles are progressive overload, specificity and variation.
  - **Novices: 8–12 RM loads.**
  - **Load progression: increase load 2–10% when the person can do the current load for 1–2 reps more than the target number.** (The "on two consecutive sessions" condition was NOT found in the snippets; treat it as UNVERIFIED. It may come from NSCA's "2-for-2 rule", not from this stand.)
  - Frequency: novice 2–3 d/wk; intermediate 3–4 d/wk; advanced 4–5 d/wk.
  - Rest: at least 2–3 min for core multi-joint exercises with heavier loads; 1–2 min may be enough for assistance exercises or moderate loads (partly SEEN-IN-SEARCH, partly UNVERIFIED).
  - For muscular endurance, novices use light loads at 10–15 reps (UNVERIFIED, prior knowledge).
  - Novices get similar gains from single- and multiple-set programmes (SEEN-IN-SEARCH, secondary). A sets range of 1–3 sets for novices is UNVERIFIED.
  - Emphasis on multi-joint exercises (SEEN-IN-SEARCH).

### 3b. NEW 2026 Position Stand (replaces 2009)
- Title: "Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews." ACSM Position Stand, Med Sci Sports Exerc, **March 2026** (McMaster release dated 16 Mar 2026). Lead: Stuart M. Phillips (McMaster). Based on 137 systematic reviews, over 30,000 participants. DOI/volume not found. — SEEN-IN-SEARCH (news releases).
- URLs: https://news.mcmaster.ca/consistency-over-perfection-new-resistance-training-guidelines-say/ ; https://www.eurekalert.org/news-releases/1119943 ; ACSM summary page https://acsm.org/resistance-training-guidelines-update-2026/ — all SEEN-IN-SEARCH.
- Key messages (SEEN-IN-SEARCH, secondary):
  - Train all major muscle groups **at least 2 times per week**. Consistency and adherence matter more than "perfect" programme design.
  - Training to momentary failure is not needed for the average healthy adult.
  - Prescribe by goal (strength / hypertrophy / power), adjusted to the individual.
  - Secondary reports say about **10 sets per muscle group per week** for hypertrophy, and 2–3 sets per exercise at about 80% 1RM for strength. These are not verified against the paper.
- **App implication:** cite the 2026 stand as current. Use 2009 only for the explicit numeric progression rule (2–10% / +1–2 reps), which the 2026 stand may not restate. For bodyweight training, translate "load" into a harder variation, more reps, or slower tempo.

---

## 4. American Heart Association

### 4a. Williams MA et al. 2007
- Williams MA, Haskell WL, Ades PA, et al. "Resistance Exercise in Individuals With and Without Cardiovascular Disease: 2007 Update. A Scientific Statement From the AHA Council on Clinical Cardiology and Council on Nutrition, Physical Activity, and Metabolism." Circulation. 2007;116(5):572–584. DOI 10.1161/CIRCULATIONAHA.107.185214 — SEEN-IN-SEARCH. (Co-authors beyond Williams: UNVERIFIED.)
- Valsalva/breath-holding: no snippet quoted the statement itself. Secondary sources attributed to AHA/ACSM say: avoid breath-holding (Valsalva) because it can cause marked blood-pressure spikes, dizziness and fainting. Exhale during the exertion phase and keep a steady breathing rhythm, especially for beginners and people with CVD or hypertension. — SEEN-IN-SEARCH (secondary). From prior knowledge, the 2007 statement also recommends a moderate, controlled speed, full range of motion, avoiding a sustained tight grip, and stopping if warning symptoms appear (dizziness, arrhythmia, unusual shortness of breath, angina) — UNVERIFIED.

### 4b. Newer AHA statement (supersedes 2007)
- Paluch AE, et al. "Resistance Exercise Training in Individuals With and Without Cardiovascular Disease: 2023 Update. A Scientific Statement From the American Heart Association." Circulation. 2024;149(3):e217–e231. DOI 10.1161/CIR.0000000000001189 — SEEN-IN-SEARCH.
- Key facts (SEEN-IN-SEARCH): resistance training is at least as safe as aerobic exercise for people with and without CVD. At least 2 days/week of resistance training is recommended as part of a balanced routine.
- "Top Things to Know" page: https://professional.heart.org/en/science-news/resistance-exercise-training-in-individuals-with-and-without-cardiovascular-disease-2023-update/top-things-to-know — SEEN-IN-SEARCH.

### 4c. AHA "Warning Signs of a Heart Attack"
- URL: https://www.heart.org/en/health-topics/heart-attack/warning-signs-of-a-heart-attack — SEEN-IN-SEARCH. Date not confirmed.
- Signs (SEEN-IN-SEARCH, AHA/Go Red infographic snippets):
  - chest discomfort (pressure, squeezing, fullness or pain that lasts more than a few minutes, or goes away and comes back);
  - discomfort in one or both arms, the back, neck, jaw or stomach;
  - shortness of breath, with or without chest discomfort;
  - other signs: cold sweat, nausea/vomiting, lightheadedness.
  - Women more often have shortness of breath, nausea/vomiting, and back or jaw pain.
- Action: call emergency services (911 in the US) immediately. **In the app, use the local emergency number (e.g., 999 in Qatar / 997 or 911 in Saudi Arabia), set by configuration and not hard-coded.**

---

## 5. CDC and Physical Activity Guidelines for Americans, 2nd edition

- U.S. Department of Health and Human Services. *Physical Activity Guidelines for Americans, 2nd edition.* Washington, DC: HHS; 2018. Official hub: https://health.gov/PAGuidelines (cited in search; also odphp.health.gov). JAMA summary: Piercy KL et al., JAMA 2018;320(19):2020–2028, https://jamanetwork.com/journals/jama/fullarticle/2712935 — SEEN-IN-SEARCH. (Author list and pages are partly UNVERIFIED.)
- CDC "Adult Activity: An Overview": https://www.cdc.gov/physical-activity-basics/guidelines/adults.html — SEEN-IN-SEARCH.
- Key numbers (SEEN-IN-SEARCH):
  - Adults: **150–300 min/week moderate**, or **75–150 min/week vigorous**, or an equivalent mix. More gives additional benefit.
  - **Muscle-strengthening, moderate or greater intensity, on ≥2 days/week**, covering all major muscle groups (legs, hips, back, abdomen, chest, shoulders, arms).
  - Older adults (65+): **multicomponent activity including balance training** plus aerobic and muscle-strengthening. If chronic conditions prevent 150 min, be as active as abilities allow.
  - Pregnancy/postpartum: **at least 150 min/week moderate aerobic** activity. Women who did vigorous activity before pregnancy can continue during pregnancy and postpartum. They should consult their healthcare provider about adjusting activity (partly SEEN-IN-SEARCH; the "habitually vigorous may continue" part is UNVERIFIED).

---

## 6. ACOG

### 6a. Committee Opinion No. 804
- ACOG Committee on Obstetric Practice. "Physical Activity and Exercise During Pregnancy and the Postpartum Period. ACOG Committee Opinion No. 804." Obstet Gynecol. 2020 Apr;135(4):e178–e188. DOI 10.1097/AOG.0000000000003772. PubMed 32217980. — Number, year, journal and DOI SEEN-IN-SEARCH; volume/pages UNVERIFIED. It replaced Committee Opinion 650 (2015). **Reaffirmation status: not found** (check acog.org).
- URL (expected, not confirmed): https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2020/04/physical-activity-and-exercise-during-pregnancy-and-the-postpartum-period — UNVERIFIED.
- Core position (SEEN-IN-SEARCH): without obstetric or medical complications or contraindications, physical activity in pregnancy is safe and desirable. Previously active women can continue. A clinical evaluation is suggested before starting a programme. Target: about 150 min/week of moderate activity.
- **Absolute contraindications** (Box; SEEN-IN-SEARCH via Lamaze/DONA summaries for the items marked *, rest UNVERIFIED prior knowledge):
  - hemodynamically significant heart disease*; restrictive lung disease*;
  - incompetent cervix or cerclage; multiple gestation at risk of premature labour;
  - persistent 2nd/3rd-trimester bleeding; placenta previa after 26 weeks;
  - premature labour during the current pregnancy*; ruptured membranes*;
  - preeclampsia or pregnancy-induced hypertension*; severe anaemia*.
- **Relative contraindications** (SEEN-IN-SEARCH partial*; rest UNVERIFIED):
  - poorly controlled type 1 diabetes*, hypertension*, seizure disorder*, hyperthyroidism*;
  - mild/moderate cardiovascular or respiratory disease; anaemia; unevaluated maternal arrhythmia; chronic bronchitis;
  - extreme morbid obesity; extreme underweight (BMI <12); very sedentary lifestyle;
  - fetal growth restriction in the current pregnancy; orthopaedic limitations; heavy smoker.
- **Warning signs to stop exercising** (SEEN-IN-SEARCH via ACE summary citing ACOG 2020; matches prior knowledge of ACOG Box 3):
  vaginal bleeding; regular painful contractions; amniotic fluid leakage; dyspnea before exertion; dizziness; headache; chest pain; muscle weakness affecting balance; calf pain or swelling; (abdominal pain — listed in one ACE entry).
- **Supine position:** avoid prolonged supine (lying on the back) positions, especially after about 20 weeks, because the uterus compresses the vena cava → reduced venous return / hypotension. Older guidance said "after the first trimester". — SEEN-IN-SEARCH (secondary). Also avoid motionless standing for long periods (UNVERIFIED).
- **Activities to avoid** (SEEN-IN-SEARCH secondary + UNVERIFIED): contact sports (e.g., boxing, soccer, basketball, ice hockey); activities with high fall risk (e.g., skiing, horseback riding, gymnastics); scuba diving; skydiving; "hot yoga"/"hot Pilates"; exercising in excessive heat and humidity.
- **Postpartum** (SEEN-IN-SEARCH secondary + UNVERIFIED): pelvic floor exercises can begin in the immediate postpartum period. Resume or begin exercise gradually as soon as medically safe, depending on mode of delivery and complications. Return to 150 min/week. Breastfeeding is not a barrier, given good hydration.
- RPE may be a better intensity monitor than heart rate in pregnancy (SEEN-IN-SEARCH, secondary).

### 6b. ACOG patient FAQ "Exercise During Pregnancy"
- Expected URL: https://www.acog.org/womens-health/faqs/exercise-during-pregnancy — **UNVERIFIED** (this exact URL did not come up in search; not opened).

---

## 7. Postpartum return to running / pelvic floor

### 7a. Goom, Donnelly, Brockwell 2019
- Goom T, Donnelly G, Brockwell E. *Returning to running postnatal – guidelines for medical, health and fitness professionals managing this population.* March 2019. Hosted PDF: https://athleticsni.org/download/files/Returning_to_running_postnatal_guideline_for_medical_health_and_fitness_professionals_managing_this_population.05.pdf — SEEN-IN-SEARCH. Also https://www.running-physio.com/postnatal-guide (SEEN-IN-SEARCH). Licence not determined; do not reproduce text.
- Key criteria (SEEN-IN-SEARCH, secondary summaries):
  - Do not return to running **before 12 weeks (3 months) postnatal**, and only after passing the tests. Individualised, not a fixed protocol.
  - All postnatal women, whatever the delivery mode, should ideally be assessed by a pelvic health physiotherapist before high-impact exercise.
  - **Load and impact tests, all to be done without symptoms:**
    - walk 30 min;
    - single-leg balance 10 s;
    - single-leg squat 10 reps each side;
    - jog on the spot 1 min;
    - forward bounds 10;
    - hop on the spot 10 each leg;
    - single-leg "running man" 10 each side (this last one is UNVERIFIED; not in the snippets).
  - Strength testing (prior knowledge, UNVERIFIED): 20 reps each side of single-leg calf raise, single-leg bridge, single-leg sit-to-stand, side-lying leg lift.
  - Pelvic floor: running less advisable if Modified Oxford grade is below 3. That is a clinician test and **out of scope for a coach app**.
  - **Symptoms needing pelvic-health referral** (SEEN-IN-SEARCH, partial; list completed from prior knowledge, UNVERIFIED):
    - urinary or faecal incontinence or urgency that is hard to defer;
    - heaviness/pressure/bulge/dragging in the pelvis (prolapse symptoms);
    - pain with intercourse;
    - obstructive defaecation;
    - pendular abdomen, separation/doming of the abdominal wall;
    - pelvic or low-back pain.

### 7b. NICE NG210
- NICE. *Pelvic floor dysfunction: prevention and non-surgical management.* NICE guideline NG210, published **9 December 2021**. https://www.nice.org.uk/guidance/ng210 — SEEN-IN-SEARCH.
- Scope (SEEN-IN-SEARCH): women aged 12+; covers prevention, assessment and non-surgical management (pelvic floor muscle training, devices, behavioural approaches, etc.). The specific referral thresholds were not visible in the snippets. UNVERIFIED (prior knowledge): it recommends supervised pelvic floor muscle training (at least 3 months) for symptoms of urinary/faecal incontinence or prolapse, and referral for specialist assessment where indicated.
- **App rule:** the coach does not diagnose. Any listed pelvic floor symptom → advise the trainee to see a doctor or pelvic-health physiotherapist, and avoid high-impact drills (jumps, running, bounds) until cleared.

---

## 8. U.S. Army — FM 7-22 and ATP 7-22.02; Army Fitness Test

### 8a. FM 7-22
- Headquarters, Department of the Army. **FM 7-22, *Holistic Health and Fitness*, 1 October 2020.** It supersedes chapters 1–6 and appendix D of FM 7-22 (26 Oct 2012). — SEEN-IN-SEARCH.
- Official PDF: https://armypubs.army.mil/epubs/DR_pubs/DR_a/ARN30964-FM_7-22-001-WEB-4.pdf (link quoted in an Army.mil Feb 2021 article; not opened).
- Mirror: https://media.defense.gov/2023/Jul/27/2003268908/-1/-1/1/H2F-FM-7-22-2020.PDF — SEEN-IN-SEARCH.
- **Possible newer edition:** an Army.mil "H2F System Update (Doctrine): Publications Update" (https://www.army.mil/article/295085/h2f_system_update_doctrine_publications_update) lists https://armypubs.army.mil/epubs/DR_pubs/DR_a/ARN44522-FM_7-22-002-WEB-7.pdf. Its date was NOT confirmed — check before citing "Oct 2020" as current.
- Copyright: works of US Government employees are not protected by US copyright (17 U.S.C. §105). Army doctrine like this typically carries "Distribution Statement A: Approved for public release; distribution is unlimited". **Confirming this statement on FM 7-22's cover was NOT done** (general rule SEEN-IN-SEARCH; FM 7-22-specific statement UNVERIFIED). Practical note: drill names and paraphrased descriptions are safe to use. Images may include third-party content; check credits.

### 8b. ATP 7-22.02 — where the drills actually are
- HQDA. **ATP 7-22.02, *Holistic Health and Fitness Drills and Exercises*, October 2020.** It supersedes chapters 7–10 and appendixes B, C, E of FM 7-22 (2012). Approved for public release (per search snippet). — SEEN-IN-SEARCH.
- Copies: https://maxacft-d36345ffc7d1.herokuapp.com/assets/docs/202010-ATP_7-22.02.pdf (third party); Colorado NG extracts https://co.ng.mil/Portals/25/H2F/ATP%207.22.02%20Preparation,%20Recovery%20&%20PMCS%20Drills.pdf — SEEN-IN-SEARCH. The official armypubs URL was not found in search.
- Companion: ATP 7-22.01 *Holistic Health and Fitness Testing* (Oct 2020) — SEEN-IN-SEARCH.
- **Drill names** (status per line):
  - **Preparation Drill (PD), 10 exercises** — SEEN-IN-SEARCH (flashcards + NG template): Bend and Reach; Rear Lunge; High Jumper; Rower; Squat Bender; Windmill; Forward Lunge; Prone Row; Bent-Leg Body Twist; Push-Up.
  - **Recovery Drill (RD)** — SEEN-IN-SEARCH: Overhead Arm Pull; Rear Lunge; Extend and Flex; Thigh Stretch; Single-Leg Over (stretches held about 20–30 s). Groin, Calf and Hamstring stretches appear as RD items 6–8 on an unofficial site — UNVERIFIED for the 2020 version.
  - **Conditioning Drill 1 (CD1)** — SEEN-IN-SEARCH (flashcards): Power Jump; V-Up; Mountain Climber; Leg Tuck and Twist; Single-Leg Push-Up.
  - **Conditioning Drill 2 (CD2)** — SEEN-IN-SEARCH (2013 drill card, pre-2020): Turn and Lunge; Supine Bicycle; Half Jacks; Swimmer; 8-Count Push-Up. ("Push-Up and Roll" was NOT found.)
  - **Conditioning Drill 3 (CD3)** — SEEN-IN-SEARCH (flashcards, partial): "Y" Squat; Single-Leg Deadlift; Side-to-Side Knee Lifts; Front Kick Alternate Toe Touch; Tuck Jump; Straddle-Run Forward and Backward; Half-Squat Laterals; Frog Jumps Forward and Backward; Alternate 1/4-Turn Jump; Alternate-Staggered Squat Jump. Only some of these were confirmed by snippets; treat the full list as UNVERIFIED.
  - **Climbing Drills 1 and 2 (CL1/CL2)** — SEEN-IN-SEARCH: off-ground upper-body pulling with core endurance and coordination. Bar required (out of scope for a pure bodyweight/no-equipment plan). Exercise names UNVERIFIED (prior knowledge: CL1 = Straight-Arm Pull, Heel Hook, Pull-Up, Leg Tuck, Alternating Grip Pull-Up).
  - **4 for the Core (4C)** — partly SEEN-IN-SEARCH: Bent-Leg Raise (1st), Quadraplex (last). Side Bridge and Back Bridge in the middle = UNVERIFIED (prior knowledge).
  - **Hip Stability Drill (HSD)** — partly SEEN-IN-SEARCH: Lateral Leg Raise; Medial Leg Raise; Bent-Leg Lateral Raise; Single-Leg Tuck; Single-Leg Over. Guidance seen: no more than 10 reps of exercises 1–4.
  - Other ATP 7-22.02 drills: Military Movement Drill, Strength Training Circuit, Guerrilla Drill, Shuttle Sprint — UNVERIFIED for the 2020 edition (names from the 2012 FM 7-22, prior knowledge).
  - Modified versions of the drills appear in ATP 7-22.02 (e.g., Bend and Reach can be done with reduced range of motion) — SEEN-IN-SEARCH.

### 8c. Army Fitness Test (AFT)
- The AFT became the test of record on **1 June 2025**, replacing the ACFT. Standards apply from 1 Jan 2026 (active component) and 1 Jun 2026 (Guard/Reserve). — SEEN-IN-SEARCH.
- **5 events:** 3-Repetition Maximum Deadlift (MDL); Hand-Release Push-Up – Arm Extension (HRP); Sprint-Drag-Carry (SDC); Plank (PLK); 2-Mile Run (2MR). The Standing Power Throw was removed. Each event scores 0–100; maximum 500. — SEEN-IN-SEARCH.
- Official page: https://www.army.mil/aft/ — SEEN-IN-SEARCH. Scoring standards are not reproduced here (only third-party tables were seen).

---

## 9. U.S. Marine Corps

- **MCO 6100.13A, *Marine Corps Physical Fitness and Combat Fitness Tests (PFT/CFT)*.** The current listing is "MCO 6100.13A W/ADMIN CH 5", dated **28 May 2025** — SEEN-IN-SEARCH. MCPEL page: https://www.marines.mil/News/Publications/MCPEL/Electronic-Library-Display/Article/2524537/mco-610013a-wadmin-ch-5/ .
- Older copies on fitness.marines.mil (SEEN-IN-SEARCH):
  - https://www.fitness.marines.mil/Portals/211/Docs/PFT_CFT/MCO%206100.13A%20with%20CH-3.pdf
- MARADMIN 613/25 gives advance notice of PFT and body-composition changes. Contents not retrieved.
- **HITT (High Intensity Tactical Training)** — Semper Fit / MCCS programme. A methodology document is at https://www.fitness.marines.mil/Portals/211/Docs/HITT%20Methodology.pdf (SEEN-IN-SEARCH), describing "five unified components" of functional training (including movement prep and strength & power). HITT announcement MARADMIN: https://www.marines.mil/News/Messages/Messages-Display/Article/895087/announcement-of-high-intensity-tactical-training-program/ — SEEN-IN-SEARCH.
- Force Fitness site: https://www.fitness.marines.mil (hosts PFT/CFT videos and docs) — SEEN-IN-SEARCH.
- Also useful: DoD HPRC USMC PFT training series, https://hprc-online.org/physical-fitness/training-performance/physical-fitness-training-series-usmc-physical-fitness-test — SEEN-IN-SEARCH.
- PFT events (UNVERIFIED, prior knowledge): pull-ups or push-ups; plank (crunches phased out); 3-mile run. Changes are pending under MARADMIN 613/25.

---

## 10. Perceived exertion and pain scales

- **Borg 1982:** Borg GA. "Psychophysical bases of perceived exertion." Med Sci Sports Exerc. 1982;14(5):377–381. — SEEN-IN-SEARCH. Describes the RPE 6–20 category scale and a category-ratio (CR10) method.
  - **Licensing:** the Borg scales are copyrighted. "Borg RPE Scale®" is shown as a registered mark. RehabMeasures (Shirley Ryan AbilityLab, https://www.sralab.org/rehabilitation-measures/borg-rating-scale-perceived-exertion) says there is a fee (up to US$1,100 for large organisations) and that instructions must not be shortened or modified. — SEEN-IN-SEARCH. Rights holder: Borg Perception (borgperception.se) — UNVERIFIED (site not reached).
  - **App implication:** do NOT embed Borg verbal anchors/layout without a licence. Use OMNI-RES 0–10 or a plain numeric 0–10 effort rating in your own wording.
- **OMNI-RES:** Robertson RJ, Goss FL, Rutkowski J, Lenz B, Dixon C, Timmer J, Frazee K, Dube J, Andreacci J. "Concurrent validation of the OMNI perceived exertion scale for resistance exercise." Med Sci Sports Exerc. 2003;35(2):333–341. — SEEN-IN-SEARCH.
  - 0–10 picture/verbal scale. Validated in 20 women and 20 men, aged 18–30, recreationally trained, doing biceps curl and knee extension. Rated for both the active muscle and the overall body; the active-muscle rating is higher.
  - Licence status of the OMNI pictograms: UNKNOWN. Using a numeric 0–10 with own wording is safest.
- **Session-RPE:** Foster C, Florhaug JA, Franklin J, Gottschall L, Hrovatin LA, Parker S, Doleshal P, Dodge C. "A new approach to monitoring exercise training." J Strength Cond Res. 2001;15(1):109–115. — Citation SEEN-IN-SEARCH via secondary (co-authors UNVERIFIED).
  - Method: a modified CR10 (0 = rest … 10 = maximal), rated for the whole session about 30 min after it ends (timing from secondary sources).
  - **Session load (AU) = sRPE × duration (min)** (e.g., 60 min × 5 = 300 AU).
  - Monotony (weekly mean/SD) and strain (weekly load × monotony) are in the paper per secondary sources. The "monotony > 2.0" threshold is UNVERIFIED.
- **Numeric Pain Rating Scale (NPRS/NRS-11):** Hawker GA, Mian S, Kendzerska T, French M. "Measures of adult pain…" Arthritis Care Res (Hoboken). 2011;63(Suppl 11):S240–S252. DOI 10.1002/acr.20543. — SEEN-IN-SEARCH.
  - 11-point 0–10 scale, from 0 = no pain to 10 = worst imaginable pain.
  - Severity bands mild 1–3 / moderate 4–6 or 4–7 / severe 7–10 or 8–10 vary between sources; the bands seen came from RehabMeasures (https://www.sralab.org/rehabilitation-measures/numeric-pain-rating-scale), not Hawker. Pick one and cite it.

---

## 11. WHO 2020 Guidelines

- World Health Organization. *WHO guidelines on physical activity and sedentary behaviour.* Geneva: WHO; 2020. **ISBN 978-92-4-001512-8 (electronic); 978-92-4-001513-5 (print).** Licence **CC BY-NC-SA 3.0 IGO**. — SEEN-IN-SEARCH.
- URLs: https://www.who.int/publications/i/item/9789240015128 (who.int redirect variant seen); NCBI Bookshelf NBK566045 https://www.ncbi.nlm.nih.gov/books/NBK566045/ — SEEN-IN-SEARCH.
- Companion: Bull FC et al. "World Health Organization 2020 guidelines on physical activity and sedentary behaviour." Br J Sports Med. 2020;54(24):1451–1462. DOI 10.1136/bjsports-2020-102955 — SEEN-IN-SEARCH.
- Adults: 150–300 min moderate or 75–150 min vigorous per week; muscle-strengthening ≥2 d/wk; limit sedentary time. — SEEN-IN-SEARCH.
- **Pregnant and postpartum women, without contraindication:**
  - ≥150 min/week moderate aerobic activity, plus a variety of aerobic and muscle-strengthening activities. Gentle stretching may help (stretching part UNVERIFIED). Limit sedentary time. — SEEN-IN-SEARCH.
  - Previously vigorous/active women can continue (UNVERIFIED wording).
  - Safety points (UNVERIFIED, prior knowledge): avoid exercise in excessive heat; stay hydrated; avoid contact sports and activities with fall risk or that limit oxygenation; know the danger signs to stop and seek care.
- Licence note: CC BY-NC-SA allows adapted Arabic paraphrase with attribution, for non-commercial use, under the same licence. Check that this fits the app's distribution.

---

## 12. Open / public-domain exercise technique references (URLs)

- ATP 7-22.02 (US Gov work; see §8) — drill descriptions and modified versions (URLs in §8b).
- FM 7-22 (US Gov work) — programming principles (URLs in §8a).
- NIA (US Gov work) — "Four types of exercise" (endurance, strength, balance, flexibility). Strength: all major muscle groups at least 2 days/week, not the same group on consecutive days. Balance examples: heel-to-toe walk, tai chi. Stretch without pain.
  - health.gov page: https://health.gov/healthypeople/tools-action/browse-evidence-based-resources/exercise-and-physical-activity-four-types-exercise-can-improve-your-health-and-physical-ability — SEEN-IN-SEARCH.
  - NIA exercise topic: https://www.nia.nih.gov/health/exercise-and-physical-activity — UNVERIFIED URL (only an archived 2013 copy was seen).
  - Go4Life has been retired (UNVERIFIED).
- NHS Live Well (Crown copyright; re-use terms vary, so link rather than copy):
  - Strength exercises: https://www.nhs.uk/live-well/exercise/strength-and-flexibility-exercises/strength-exercises/ — SEEN-IN-SEARCH.
  - Strength & Flex plan videos: https://www.nhs.uk/live-well/exercise/strength-and-flexibility-exercises/strength-and-flex-exercise-plan-how-to-videos/ — SEEN-IN-SEARCH.
  - Adults 19–64 guidelines: https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-for-adults-aged-19-to-64/ (last reviewed 22 May 2024 per snippet) — SEEN-IN-SEARCH.
  - Older adults: https://www.nhs.uk/live-well/exercise/physical-activity-guidelines-older-adults/ — SEEN-IN-SEARCH.
  - Advice seen: gentle start, build up slowly, at least twice a week.
- UK CMO Physical Activity Guidelines (GOV.UK, updated 10 July 2026 per snippet): https://www.gov.uk/government/publications/physical-activity-guidelines-uk-chief-medical-officers-report — SEEN-IN-SEARCH. Content of the 2026 update not checked.
- CDC "What Counts as Physical Activity for Adults": https://www.cdc.gov/physical-activity-basics/adding-adults/what-counts.html — SEEN-IN-SEARCH.

---

## Rules derived for the app

Deterministic rules. Brackets give the source(s); "(V?)" means the rule depends on an item that was not confirmed this session — confirm it before release.

### A. Screening / intake
1. **Every trainee completes a health screen before the first plan.** No plan can be generated while screening is "pending". [PAR-Q+; ACSM/Riebe 2015]
2. **Screen content:** use the official PAR-Q+ (printed/linked) and record its outcome. Or, if permission for an Arabic version is not obtained, use the app's own question set covering the same 7 topics (heart condition/high BP; chest pain; dizziness/fainting in the last 12 months; other chronic condition; medication for a chronic condition; bone/joint/soft-tissue problem; told to exercise only under medical supervision), and do not label it PAR-Q+. [PAR-Q+ terms: entire form, no changes]
3. **All NO → status `CLEARED`.** The plan starts at light-to-moderate intensity with gradual progression. [PAR-Q+; Riebe 2015]
4. **Any YES → status `REFER`.** No plan until the coach records "medical clearance obtained" (date + who cleared + any restrictions text). Until then, at most low-intensity activity is allowed (e.g., walking, mobility/recovery drill only). [PAR-Q+/ePARmed-X+; BCRPA summary]
5. **ACSM logic (extra intake fields):** "currently active (planned exercise ≥30 min, ≥3 d/wk, ≥3 months)?", "known heart/metabolic(diabetes)/kidney disease?", "signs/symptoms?".
   - Symptoms present → `REFER`. If currently active, stop training until cleared.
   - Known disease, no symptoms, inactive → `REFER` before any training.
   - Known disease, no symptoms, active → moderate allowed; `REFER` before vigorous.
   - No disease, no symptoms → no referral. [Riebe 2015 (V? exact wording)]
6. **Re-screen** whenever health status changes (new illness, injury, pregnancy, surgery). Recommended at least every 12 months. [PAR-Q+ (V?); Riebe 2015 "12 months" (V?)]
7. **Pregnancy flag** → pregnancy screen against ACOG absolute contraindications (Box list, §6a).
   - Any absolute contraindication → no exercise plan; refer.
   - Any relative contraindication → `REFER` and require obstetric-provider clearance.
   - Otherwise: pregnancy-safe template only, with provider approval recorded. [ACOG CO 804]
8. **Postpartum flag**:
   - Low-impact plan + pelvic-floor-friendly drills only until the coach records provider clearance.
   - High-impact items (running, jumps, bounds, hops, CD1 power jump, frog jumps, tuck jumps) are locked before **12 weeks postnatal**, and also until the trainee reports no pelvic-floor symptoms and passes the load/impact checklist (walk 30 min, single-leg balance 10 s, single-leg squat 10/side, jog on the spot 1 min, forward bounds 10, hop on the spot 10/leg) without symptoms. [Goom et al. 2019; ACOG CO 804]
9. **Pelvic-floor symptom present** (leakage, urgency, heaviness/bulge, pelvic pain) → refer to a doctor or pelvic-health physiotherapist; lock high-impact items. [Goom et al. 2019; NICE NG210]
10. **Age ≥65 flag** → each week's plan must include ≥1 balance component (multicomponent). [PAG 2nd ed.; WHO 2020]

### B. Stop-exercise / emergency rules (in-session "red button")
11. **Stop immediately and call the local emergency number** (configurable) if:
    - chest pain/pressure/squeezing;
    - discomfort spreading to arm(s), back, neck, jaw or stomach;
    - shortness of breath out of proportion to the effort;
    - fainting or near-fainting;
    - cold sweat with nausea/lightheadedness. [AHA Warning Signs; Riebe 2015 symptom list (V?)]
12. **Stop the session and refer** (no further sessions until cleared) if the trainee reports:
    - dizziness or lightheadedness;
    - palpitations / irregular heartbeat;
    - unusual breathlessness;
    - new joint pain, or pain ≥ the app's threshold (e.g., NPRS ≥5 — the threshold value is a product choice, not from a source). [AHA 2007/2023 (V?); NPRS Hawker 2011]
13. **Pregnancy stop list:** stop and contact the obstetric provider for:
    - vaginal bleeding; regular painful contractions; amniotic fluid leakage;
    - dyspnea before exertion; dizziness; headache; chest pain;
    - muscle weakness affecting balance; calf pain or swelling. [ACOG CO 804 (via secondary; V?)]
14. **Breathing cue on every strength exercise:** "do not hold your breath; breathe out during the effort". [AHA (secondary; V?); ACSM]

### C. Plan generation (weekly)
15. **Strength frequency:** every major muscle group trained **≥2 days/week**. Novices: 2–3 full-body strength days/week, with no same-muscle-group days back to back (≥48 h rest — the 48 h figure is a common practice; the "not consecutive days" rule is from NIA). [ACSM 2009; ACSM 2026; PAG 2018; NIA]
16. **Aerobic target shown in the weekly summary:** 150–300 min moderate or 75–150 min vigorous. Pregnancy/postpartum: ≥150 min moderate. [PAG 2018; WHO 2020; CDC]
17. **Session structure:** warm-up = Preparation Drill (10 exercises); main block; cool-down = Recovery Drill (stretches held about 20–30 s). [ATP 7-22.02]
18. **Novice volume:** 1–3 sets × 8–12 reps per exercise (bodyweight equivalent of an 8–12RM). Rest 1–2 min (up to 2–3 min for hard multi-joint sets). [ACSM 2009 (sets range V?)]
19. **Pregnant (after about 20 weeks):** exclude supine-lying exercises (e.g., supine bicycle, V-up, bent-leg raise, crunch-type), plus prone and contact/fall-risk drills. Substitute side-lying, seated or standing variants. Avoid heat; allow hydration breaks. [ACOG CO 804; WHO 2020]
20. **Intensity tracking:** use **OMNI-RES-style 0–10 effort** (own Arabic wording) per set and a **session-RPE 0–10** at the end. Do not embed Borg 6–20/CR10 text without a licence. [Robertson 2003; Foster 2001; Borg licence]
21. **Session load** = sRPE (0–10) × session minutes (AU). Weekly load = sum of session loads. Flag if weekly load rises by more than the app's threshold vs the previous week (the threshold is a product choice; no source confirmed). [Foster 2001]

### D. Progression rules
22. **Progress only when** the trainee completes the prescribed reps for all sets **and exceeds the target by 1–2 reps**. Then progress by one step: harder variation (e.g., knee → full push-up), or +2–10% equivalent difficulty (bodyweight: +1–2 reps per set or one step up in variation). [ACSM 2009]
    - Requiring this on **two consecutive sessions** is a conservative product choice. It is NOT confirmed as ACSM wording (V?).
23. **Do not progress** if the last session's effort was ≥9/10, any pain ≥ threshold was reported, or any stop rule fired. Repeat the same week, or step back one variation. [ACSM 2009 principle; product choice]
24. **Failure training is not required.** Default the target effort to about 7–8/10 (2–3 reps in reserve). [ACSM 2026 (secondary)]
25. **Missed sessions:** if more than X days are missed (product choice), restart at the previous week's level. [product choice; not source-based]

### E. Licensing / attribution in the app
26. Show a "Sources" screen citing: PAR-Q+ Collaboration (if the form is used), ACSM 2009/2026, Riebe 2015, AHA 2007/2023, ACOG CO 804, PAG 2018, WHO 2020 (CC BY-NC-SA 3.0 IGO attribution), FM 7-22/ATP 7-22.02 (US Gov), Robertson 2003, Foster 2001, Hawker 2011, Goom et al. 2019, NICE NG210.
27. Show a disclaimer: the app is a coaching aid, not medical advice. All referrals go to a qualified health professional.
