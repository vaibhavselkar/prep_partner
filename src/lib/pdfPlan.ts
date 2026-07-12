// 30-day Prelims study plan grounded in Lokseva Academy's "Combine 60+ Marks Strategy" PDF
// (weightage + per-subject high-yield components). Two daily threads run through every day:
// Maths (~2 hr practice) and Current Affairs (reading), exactly as the PDF prescribes.
// Each task has a stable id so checkboxes persist via useSyllabusProgress (localStorage).
//
// Structure: MAIN_BLOCKS is the ordered list of daily learning blocks — reorder these to
// change the subject sequence (currently Geography → Polity → Economy → Science → History →
// Consolidation). MATHS and CA are day-keyed threads (day 1..30) that stay put when the
// main blocks are reordered. Task ids are subject-based (not day-based) so they remain
// stable across reorders and never lose a student's ticked progress.

export interface PlanTask {
  id: string;
  mr: string;
  en: string;
}

export interface MainBlock {
  phaseMr: string;
  phaseEn: string;
  icon: string;
  main: PlanTask[];
}

export interface PlanDay extends MainBlock {
  day: number;
  maths: PlanTask;
  ca: PlanTask;
}

const t = (id: string, mr: string, en: string): PlanTask => ({ id, mr, en });

// ── Learning blocks, in study order (reorder freely) ───────────────────────────
const GEO = "🗺️", POL = "⚖️", ECO = "💰", SCI = "🔬", HIS = "🏛️", REV = "📝";

const MAIN_BLOCKS: MainBlock[] = [
  // ── Geography (first) · 10 marks ─────────────────────────────────────────────
  {
    phaseMr: "भूगोल", phaseEn: "Geography", icon: GEO,
    main: [
      t("pp-geo-01", "महाराष्ट्र: स्थान/विस्तार/क्षेत्रफळ, प्रशासकीय विभाग (1960 vs 2025)", "Maharashtra: location/extent/area, admin divisions (1960 vs 2025)"),
      t("pp-geo-02", "प्राकृतिक विभाग (कोकण, सह्याद्री, पठार), डोंगररांगा/शिखरे/घाट", "Physical divisions (Konkan, Sahyadri, plateau), ranges/peaks/ghats"),
    ],
  },
  {
    phaseMr: "भूगोल", phaseEn: "Geography", icon: GEO,
    main: [
      t("pp-geo-03", "महाराष्ट्र: नदीप्रणाली (खोरे, उपनद्या, धरणे), वने (उद्याने/अभयारण्ये/व्याघ्र प्रकल्प)", "Maharashtra: rivers (basins, tributaries, dams), forests (parks/sanctuaries/tiger reserves)"),
      t("pp-geo-04", "खनिज व ऊर्जा (कोळसा/औष्णिक/जल/पवन/अणू)", "Minerals & energy (coal/thermal/hydro/wind/nuclear)"),
    ],
  },
  {
    phaseMr: "भूगोल", phaseEn: "Geography", icon: GEO,
    main: [
      t("pp-geo-05", "महाराष्ट्र: लोकसंख्या (2001-2011, स्थलांतर, आदिवासी), हवामान", "Maharashtra: population (2001-2011, migration, tribes), climate"),
      t("pp-geo-06", "कृषी/पशुधन/मासेमारी, जलसिंचन प्रकल्प, उद्योग, कोकण रेल्वे", "Agriculture/livestock/fishing, irrigation projects, industry, Konkan Railway"),
    ],
  },
  {
    phaseMr: "भूगोल", phaseEn: "Geography", icon: GEO,
    main: [
      t("pp-geo-07", "भारत: प्राकृतिक भूगोल (सर्वाधिक प्रश्न), नदीप्रणाली, हवामान", "India: physical geography (most Qs), rivers, climate"),
      t("pp-geo-08", "भारत: लोकसंख्या, ऊर्जा/खनिज, वाहतूक, कृषी + जग भूगोल पाया", "India: population, energy/minerals, transport, agriculture + World basics"),
    ],
  },
  // ── Polity · 15 marks ────────────────────────────────────────────────────────
  {
    phaseMr: "राज्यशास्त्र", phaseEn: "Polity", icon: POL,
    main: [
      t("pp-pol-01", "घटना निर्मिती: 1919 व 1935 चा कायदा", "Constitution making: Acts of 1919 & 1935"),
      t("pp-pol-02", "संविधानसभा: मागणी, समित्या व अध्यक्ष, बैठका", "Constituent Assembly: demand, committees & chairpersons, sessions"),
      t("pp-pol-03", "घटनेचे स्रोत (देशनिहाय)", "Sources of the Constitution (country-wise)"),
    ],
  },
  {
    phaseMr: "राज्यशास्त्र", phaseEn: "Polity", icon: POL,
    main: [
      t("pp-pol-04", "प्रस्तावना: की-वर्ड्स, 42 वी घटनादुरुस्ती, खटले", "Preamble: keywords, 42nd Amendment, cases"),
      t("pp-pol-05", "संघराज्य व राज्यक्षेत्र: कलम 1-4 (विशेषतः कलम 3)", "Union & Territory: Articles 1-4 (esp. Article 3)"),
      t("pp-pol-06", "राज्य पुनर्रचना: धार आयोग, JVP समिती", "State reorganisation: Dhar Commission, JVP Committee"),
    ],
  },
  {
    phaseMr: "राज्यशास्त्र", phaseEn: "Polity", icon: POL,
    main: [
      t("pp-pol-07", "मूलभूत हक्क: कलम 12-35", "Fundamental Rights: Articles 12-35"),
      t("pp-pol-08", "याचिका (Writs) व त्यांचे प्रकार", "Writs and their types"),
      t("pp-pol-09", "मूलभूत हक्क वि. मार्गदर्शक तत्त्वे फरक", "Fundamental Rights vs DPSP"),
    ],
  },
  {
    phaseMr: "राज्यशास्त्र", phaseEn: "Polity", icon: POL,
    main: [
      t("pp-pol-10", "मार्गदर्शक तत्त्वे (DPSP): कलम 36-51, वर्गीकरण", "DPSP: Articles 36-51, classification"),
      t("pp-pol-11", "मूलभूत कर्तव्ये: कलम 51A, स्वर्णसिंह समिती, 42/86 वी दुरुस्ती", "Fundamental Duties: Art 51A, Swaran Singh, 42nd/86th Amendments"),
    ],
  },
  {
    phaseMr: "राज्यशास्त्र", phaseEn: "Polity", icon: POL,
    main: [
      t("pp-pol-12", "केंद्र सरकार: राष्ट्रपती, उपराष्ट्रपती (कलम 66)", "Union Govt: President, Vice-President (Art 66)"),
      t("pp-pol-13", "पंतप्रधान व मंत्रिमंडळ, संसद", "PM & Council of Ministers, Parliament"),
      t("pp-pol-14", "महान्यायवादी (कलम 76)", "Attorney General (Article 76)"),
    ],
  },
  {
    phaseMr: "राज्यशास्त्र", phaseEn: "Polity", icon: POL,
    main: [
      t("pp-pol-15", "राज्य सरकार: राज्यपाल (कलम 153-163)", "State Govt: Governor (Articles 153-163)"),
      t("pp-pol-16", "मुख्यमंत्री व मंत्रिमंडळ, विधिमंडळ (विधानसभा/परिषद, कलम 168)", "CM & Council, Legislature (Assembly/Council, Art 168)"),
      t("pp-pol-17", "महाधिवक्ता (कलम 165)", "Advocate General (Article 165)"),
    ],
  },
  {
    phaseMr: "राज्यशास्त्र", phaseEn: "Polity", icon: POL,
    main: [
      t("pp-pol-18", "न्यायमंडळ: सर्वोच्च व उच्च न्यायालय (कलम 214-228)", "Judiciary: Supreme Court & High Courts (Art 214-228)"),
      t("pp-pol-19", "स्थानिक स्वराज्य: 73/74 वी दुरुस्ती, कलम 243, अधिनियम", "Local Self-Govt: 73rd/74th Amendments, Art 243, Acts"),
      t("pp-pol-20", "आयोग (UPSC/MPSC/निवडणूक/नीती), केंद्र-राज्य संबंध, कलमे/अनुसूची/सूची", "Bodies (UPSC/MPSC/EC/NITI), Centre-State, Articles/Schedules/Lists"),
    ],
  },
  // ── Economy · 15 marks ───────────────────────────────────────────────────────
  {
    phaseMr: "अर्थशास्त्र", phaseEn: "Economy", icon: ECO,
    main: [
      t("pp-eco-01", "सार्वजनिक वित्त व कर: राजकोषीय धोरण, FRBM, तुटी", "Public finance & tax: fiscal policy, FRBM, deficits"),
      t("pp-eco-02", "अर्थसंकल्पाचे प्रकार, जेंडर/बाल बजेट, 16 वा वित्त आयोग", "Budget types, Gender/Child budget, 16th Finance Commission"),
    ],
  },
  {
    phaseMr: "अर्थशास्त्र", phaseEn: "Economy", icon: ECO,
    main: [
      t("pp-eco-03", "CAG, GST, प्रत्यक्ष-अप्रत्यक्ष कर, कर समित्या", "CAG, GST, direct/indirect tax, tax committees"),
      t("pp-eco-04", "महाराष्ट्र आर्थिक पाहणी 2024-25", "Maharashtra Economic Survey 2024-25"),
    ],
  },
  {
    phaseMr: "अर्थशास्त्र", phaseEn: "Economy", icon: ECO,
    main: [
      t("pp-eco-05", "राष्ट्रीय उत्पन्न: GDP/GNP/NDP/NNP, आधारभूत वर्ष, CSO/NSSO", "National income: GDP/GNP/NDP/NNP, base year, CSO/NSSO"),
      t("pp-eco-06", "भारतीय अर्थव्यवस्था: क्षेत्रीय कल (GDP व रोजगारातील वाटा)", "Indian economy: sectoral trends (GDP & employment share)"),
    ],
  },
  {
    phaseMr: "अर्थशास्त्र", phaseEn: "Economy", icon: ECO,
    main: [
      t("pp-eco-07", "बँकिंग: RBI (स्थापना, कार्ये, पतनियंत्रण साधने, राष्ट्रीयीकरण)", "Banking: RBI (setup, functions, credit-control tools, nationalisation)"),
      t("pp-eco-08", "व्यावसायिक बँका, RRBs, नरसिंहम समित्या, SBI", "Commercial banks, RRBs, Narasimham committees, SBI"),
    ],
  },
  {
    phaseMr: "अर्थशास्त्र", phaseEn: "Economy", icon: ECO,
    main: [
      t("pp-eco-09", "दारिद्र्य: समित्या, URP/MRP/MMRP, MPI/GHI", "Poverty: committees, URP/MRP/MMRP, MPI/GHI"),
      t("pp-eco-10", "बेरोजगारी: PLFS/NSSO प्रकार", "Unemployment: PLFS/NSSO types"),
      t("pp-eco-11", "विकासाचे निर्देशांक: HDI/IHDI/GDI/GII/PQLI", "Development indices: HDI/IHDI/GDI/GII/PQLI"),
    ],
  },
  {
    phaseMr: "अर्थशास्त्र", phaseEn: "Economy", icon: ECO,
    main: [
      t("pp-eco-12", "कृषी (क्रांती, NAFED, PM-KISAN/PMFBY) व उद्योग (महारत्न, 1991 धोरण, MSME)", "Agriculture (revolutions, NAFED, schemes) & Industry (Maharatna, 1991 policy, MSME)"),
      t("pp-eco-13", "आंतरराष्ट्रीय व्यापार व संस्था (IMF/WB/WTO/ADB/BRICS), पंचवार्षिक योजना 9-12", "Intl trade & bodies (IMF/WB/WTO/ADB/BRICS), Five-Year Plans 9-12"),
      t("pp-eco-14", "केंद्रीय अर्थसंकल्प 2025-26", "Union Budget 2025-26"),
    ],
  },
  // ── Science · 15 marks ───────────────────────────────────────────────────────
  {
    phaseMr: "सामान्य विज्ञान", phaseEn: "Science", icon: SCI,
    main: [
      t("pp-sci-01", "जीवशास्त्र: सजीवांचे वर्गीकरण (लिनियस, बेंथम-हूकर, व्हिटाकर)", "Biology: classification of organisms (Linnaeus, Bentham-Hooker, Whittaker)"),
      t("pp-sci-02", "वनस्पतींचे वर्गीकरण, नायट्रोजन स्थिरीकरण, कीटकभक्षी वनस्पती", "Plant classification, nitrogen fixation, insectivorous plants"),
    ],
  },
  {
    phaseMr: "सामान्य विज्ञान", phaseEn: "Science", icon: SCI,
    main: [
      t("pp-sci-03", "प्राण्यांचे वर्गीकरण: 10 संघ सविस्तर, Symmetry, वैज्ञानिक नावे", "Animal classification: 10 phyla in detail, symmetry, scientific names"),
      t("pp-sci-04", "उदाहरणे: Petromyzon, कांगारू, प्लॅटिपस, हायड्रा", "Examples: Petromyzon, kangaroo, platypus, hydra"),
    ],
  },
  {
    phaseMr: "सामान्य विज्ञान", phaseEn: "Science", icon: SCI,
    main: [
      t("pp-sci-05", "रोग (जीवाणू/विषाणू/लस), पोषणमूल्ये (जीवनसत्त्वे/प्रथिने)", "Diseases (pathogen/vaccine), nutrition (vitamins/proteins)"),
      t("pp-sci-06", "ग्रंथी व संप्रेरके, वनस्पती संप्रेरके", "Glands & hormones, plant hormones"),
    ],
  },
  {
    phaseMr: "सामान्य विज्ञान", phaseEn: "Science", icon: SCI,
    main: [
      t("pp-sci-07", "भौतिकशास्त्र: ध्वनी, प्रकाश, विद्युतधारा, किरणोत्सारिता, ऊर्जा", "Physics: sound, light, current, radioactivity, energy"),
      t("pp-sci-08", "रसायनशास्त्र: द्रव्य/अणुरचना/आवर्तसारणी, कार्बन, आम्ल-आम्लारी, धातू", "Chemistry: matter/atomic structure/periodic table, carbon, acids-bases, metals"),
    ],
  },
  // ── History · 10 marks ───────────────────────────────────────────────────────
  {
    phaseMr: "इतिहास", phaseEn: "History", icon: HIS,
    main: [
      t("pp-his-01", "1857 चा उठाव (महाराष्ट्र व भारत): ठिकाणे, नेतृत्व, बिमोड, 1858 कायदा", "1857 revolt (MH & India): centres, leaders, suppressors, Act of 1858"),
      t("pp-his-02", "1857 पूर्वीचे उठाव: भिल्ल/कोळी/रामोशी (उमाजी नाईक, तंट्या भिल्ल)", "Pre-1857 revolts: Bhil/Koli/Ramoshi (Umaji Naik, Tantya Bhil)"),
    ],
  },
  {
    phaseMr: "इतिहास", phaseEn: "History", icon: HIS,
    main: [
      t("pp-his-03", "महाराष्ट्राची शेतकरी चळवळ: सुपे उठाव, डेक्कन रायट्स कमिशन", "Maharashtra farmer movement: Supe revolt, Deccan Riots Commission"),
      t("pp-his-04", "कामगार चळवळ: बॉम्बे मिल हँड असोसिएशन, ना. मे. लोखंडे, संघटना", "Labour movement: Bombay Mill Hand Assoc, N.M. Lokhande, unions"),
    ],
  },
  {
    phaseMr: "इतिहास", phaseEn: "History", icon: HIS,
    main: [
      t("pp-his-05", "सामाजिक-धार्मिक सुधारणा (ब्राह्मो/प्रार्थना/आर्य/सत्यशोधक): संस्थापक/उद्देश/वृत्तपत्रे", "Social-religious reform (Brahmo/Prarthana/Arya/Satyashodhak): founders/aims/papers"),
      t("pp-his-06", "समाजसुधारक: फुले, आंबेडकर, शाहू, कर्वे, रानडे इ.", "Social reformers: Phule, Ambedkar, Shahu, Karve, Ranade, etc."),
    ],
  },
  {
    phaseMr: "इतिहास", phaseEn: "History", icon: HIS,
    main: [
      t("pp-his-07", "काँग्रेसपूर्व संघटना + काँग्रेस स्थापना व महत्त्वाची अधिवेशने (अध्यक्ष/ठिकाण)", "Pre-Congress orgs + Congress founding & key sessions (presidents/venues)"),
      t("pp-his-08", "राष्ट्रीय चळवळ (असहकार, सविनय कायदेभंग) + क्रांतिकारी चळवळ", "National movement (Non-cooperation, Civil Disobedience) + revolutionary movement"),
    ],
  },
  {
    phaseMr: "इतिहास", phaseEn: "History", icon: HIS,
    main: [
      t("pp-his-09", "ब्रिटिशांचे आर्थिक धोरण: संपत्ती निःसारण (नौरोजी/रानडे), रेल्वे-तार, दुष्काळ आयोग", "British economic policy: drain (Naoroji/Ranade), railway-telegraph, Famine Commissions"),
      t("pp-his-10", "भूसुधारणा पद्धती (रयतवारी/महालवारी/कायमधारा), गव्हर्नर जनरल-व्हाईसरॉय, वृत्तपत्रे", "Land-revenue systems (Ryotwari/Mahalwari/Permanent), Governors-General/Viceroys, newspapers"),
    ],
  },
  // ── Consolidation (last) ─────────────────────────────────────────────────────
  {
    phaseMr: "उजळणी व सराव परीक्षा", phaseEn: "Revision & Mocks", icon: REV,
    main: [
      t("pp-rev-01", "पूर्ण सराव परीक्षा #1 → तपासणी + Weak Areas", "Full Mock #1 → review + Weak Areas"),
      t("pp-rev-02", "राज्यशास्त्र + अर्थशास्त्र Exam Focus नोट्स उजळणी", "Revise Polity + Economy Exam-Focus notes"),
    ],
  },
  {
    phaseMr: "उजळणी व सराव परीक्षा", phaseEn: "Revision & Mocks", icon: REV,
    main: [
      t("pp-rev-03", "पूर्ण सराव परीक्षा #2 → तपासणी", "Full Mock #2 → review"),
      t("pp-rev-04", "पाठांतर: कलमे, गव्हर्नर जनरल, समित्या, महाराष्ट्र भूगोल तथ्ये", "Memorise: Articles, Governors-General, committees, MH geography facts"),
    ],
  },
  {
    phaseMr: "उजळणी व सराव परीक्षा", phaseEn: "Revision & Mocks", icon: REV,
    main: [
      t("pp-rev-05", "पूर्ण सराव परीक्षा #3 → तपासणी", "Full Mock #3 → review"),
      t("pp-rev-06", "विज्ञान + इतिहास + भूगोल उच्च-गुणदायी मुद्दे उजळणी", "Revise Science + History + Geography high-yield points"),
    ],
  },
  {
    phaseMr: "अंतिम उजळणी", phaseEn: "Final Revision", icon: "🏁",
    main: [
      t("pp-rev-07", "सर्व 8 Exam Focus नोट्स अंतिम उजळणी", "Final revision of all 8 Exam-Focus notes"),
      t("pp-rev-08", "चालू घडामोडी: मागील 12-18 महिने", "Current Affairs: last 12-18 months"),
      t("pp-rev-09", "हलका गणित सराव व विश्रांती", "Light Maths practice & rest"),
    ],
  },
];

// ── Daily Maths thread (day 1..30) ─────────────────────────────────────────────
const MATHS: PlanTask[] = [
  t("pp-mt-01", "गणित: संख्या पद्धती", "Maths: Number System"),
  t("pp-mt-02", "गणित: सरळरूप (Simplification)", "Maths: Simplification"),
  t("pp-mt-03", "गणित: पदावली (BODMAS)", "Maths: BODMAS"),
  t("pp-mt-04", "गणित: शेकडेवारी (Percentage)", "Maths: Percentage"),
  t("pp-mt-05", "गणित: गुणोत्तर व प्रमाण", "Maths: Ratio & Proportion"),
  t("pp-mt-06", "गणित: सरासरी (Average)", "Maths: Average"),
  t("pp-mt-07", "गणित: नफा-तोटा (Profit & Loss)", "Maths: Profit & Loss"),
  t("pp-mt-08", "गणित: काळ-काम (Time & Work)", "Maths: Time & Work"),
  t("pp-mt-09", "गणित: वेग-वेळ-अंतर (रेल्वे)", "Maths: Time-Speed-Distance (Railway)"),
  t("pp-mt-10", "गणित: क्षेत्रमिती (Mensuration)", "Maths: Mensuration"),
  t("pp-mt-11", "गणित: त्रिकोणमिती (Trigonometry)", "Maths: Trigonometry"),
  t("pp-mt-12", "गणित: माहितीचे विश्लेषण (DI)", "Maths: Data Interpretation"),
  t("pp-mt-13", "गणित: वयवारी (Ages)", "Maths: Ages"),
  t("pp-mt-14", "गणित: ल.सा.वि.-म.सा.वि.", "Maths: LCM-HCF"),
  t("pp-mt-15", "गणित: घातांक (Powers/Indices)", "Maths: Powers/Indices"),
  t("pp-mt-16", "गणित: संख्यामालिका", "Maths: Number Series"),
  t("pp-mt-17", "बुद्धिमत्ता: बैठकव्यवस्था", "Reasoning: Seating Arrangement"),
  t("pp-mt-18", "बुद्धिमत्ता: संख्यामालिका", "Reasoning: Number Series"),
  t("pp-mt-19", "बुद्धिमत्ता: Syllogism", "Reasoning: Syllogism"),
  t("pp-mt-20", "बुद्धिमत्ता: दिशा (Directions)", "Reasoning: Directions"),
  t("pp-mt-21", "बुद्धिमत्ता: नातेसंबंध (Blood Relation)", "Reasoning: Blood Relations"),
  t("pp-mt-22", "बुद्धिमत्ता: रांगेतील स्थान (Ranking)", "Reasoning: Ranking"),
  t("pp-mt-23", "बुद्धिमत्ता: Analogy", "Reasoning: Analogy"),
  t("pp-mt-24", "बुद्धिमत्ता: सांकेतिक भाषा (Coding-Decoding)", "Reasoning: Coding-Decoding"),
  t("pp-mt-25", "बुद्धिमत्ता: संख्यांची कोडी (Number Puzzle)", "Reasoning: Number Puzzle"),
  t("pp-mt-26", "बुद्धिमत्ता: घड्याळ व दिनदर्शिका", "Reasoning: Clock & Calendar"),
  t("pp-mt-27", "बुद्धिमत्ता: वर्णमाला/आकृत्यांची कोडी", "Reasoning: Alphabet/Figure puzzles"),
  t("pp-mt-28", "गणित: कमकुवत प्रकारांचा सराव", "Maths: practice weak types"),
  t("pp-mt-29", "गणित: कमकुवत प्रकारांचा सराव", "Maths: practice weak types"),
  t("pp-mt-30", "गणित: मिश्र झटपट सराव", "Maths: quick mixed practice"),
];

// ── Daily Current Affairs thread (day 1..30) ───────────────────────────────────
const CA: PlanTask[] = [
  t("pp-ca-01", "चालू घडामोडी: आंतरराष्ट्रीय पुरस्कार (नोबेल/ऑस्कर/बुकर)", "CA: International awards (Nobel/Oscar/Booker)"),
  t("pp-ca-02", "चालू घडामोडी: राष्ट्रीय पुरस्कार (पद्म/ज्ञानपीठ)", "CA: National awards (Padma/Jnanpith)"),
  t("pp-ca-03", "चालू घडामोडी: नेमणुका", "CA: Appointments"),
  t("pp-ca-04", "चालू घडामोडी: निधनवार्ता", "CA: Obituaries"),
  t("pp-ca-05", "चालू घडामोडी: ऑलिंपिक/पॅरालिंपिक 2024", "CA: Olympics/Paralympics 2024"),
  t("pp-ca-06", "चालू घडामोडी: क्रिकेट (चॅम्पियन्स ट्रॉफी, विश्वचषक)", "CA: Cricket (Champions Trophy, World Cups)"),
  t("pp-ca-07", "चालू घडामोडी: इतर क्रीडा व निवृत्ती", "CA: Other sports & retirements"),
  t("pp-ca-08", "चालू घडामोडी: निर्देशांक/अहवाल (जेंडर गॅप, HDI)", "CA: Indices/reports (Gender Gap, HDI)"),
  t("pp-ca-09", "चालू घडामोडी: राजकीय घडामोडी", "CA: Political developments"),
  t("pp-ca-10", "चालू घडामोडी: आर्थिक घडामोडी", "CA: Economic developments"),
  t("pp-ca-11", "चालू घडामोडी: कृषी-पर्यावरण", "CA: Agri-environment"),
  t("pp-ca-12", "चालू घडामोडी: राष्ट्रीय घडामोडी", "CA: National developments"),
  t("pp-ca-13", "चालू घडामोडी: प्रादेशिक (महाराष्ट्र)", "CA: Regional (Maharashtra)"),
  t("pp-ca-14", "चालू घडामोडी: आंतरराष्ट्रीय शिखर परिषदा (NATO/BRICS/WTO)", "CA: International summits (NATO/BRICS/WTO)"),
  t("pp-ca-15", "चालू घडामोडी: अंतराळ (Axiom-4, चांद्रयान, गगनयान)", "CA: Space (Axiom-4, Chandrayaan, Gaganyaan)"),
  t("pp-ca-16", "चालू घडामोडी: शासकीय योजना", "CA: Government schemes"),
  t("pp-ca-17", "चालू घडामोडी: चर्चेतील पुस्तके/दिनविशेष/समित्या", "CA: Books/Days/Committees in news"),
  t("pp-ca-18", "चालू घडामोडी: संरक्षण घडामोडी", "CA: Defence developments"),
  t("pp-ca-19", "चालू घडामोडी: नवीन पुरस्कार (उजळणी)", "CA: New awards (revisit)"),
  t("pp-ca-20", "चालू घडामोडी: नेमणुका (उजळणी)", "CA: Appointments (revisit)"),
  t("pp-ca-21", "चालू घडामोडी: क्रीडा (उजळणी)", "CA: Sports (revisit)"),
  t("pp-ca-22", "चालू घडामोडी: निर्देशांक (उजळणी)", "CA: Indices (revisit)"),
  t("pp-ca-23", "चालू घडामोडी: प्रादेशिक (महाराष्ट्र धोरणे)", "CA: Regional (Maharashtra policies)"),
  t("pp-ca-24", "चालू घडामोडी: राष्ट्रीय (उजळणी)", "CA: National (revisit)"),
  t("pp-ca-25", "चालू घडामोडी: आर्थिक (उजळणी)", "CA: Economic (revisit)"),
  t("pp-ca-26", "चालू घडामोडी: अंतराळ/विज्ञान", "CA: Space/Science"),
  t("pp-ca-27", "चालू घडामोडी: महिन्याची उजळणी", "CA: Monthly revision"),
  t("pp-ca-28", "चालू घडामोडी: पुरस्कार+व्यक्तिविशेष उजळणी", "CA: Awards + persons revision"),
  t("pp-ca-29", "चालू घडामोडी: निर्देशांक+योजना उजळणी", "CA: Indices + schemes revision"),
  t("pp-ca-30", "चालू घडामोडी: अंतिम झटपट उजळणी", "CA: final quick revision"),
];

export const PDF_PLAN: PlanDay[] = MAIN_BLOCKS.map((b, i) => ({
  day: i + 1,
  ...b,
  maths: MATHS[i],
  ca: CA[i],
}));

export const PDF_PLAN_TASK_IDS: string[] = PDF_PLAN.flatMap((d) => [
  ...d.main.map((m) => m.id),
  d.maths.id,
  d.ca.id,
]);
