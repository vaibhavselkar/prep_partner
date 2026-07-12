// 30-day Prelims study plan grounded in Lokseva Academy's "Combine 60+ Marks Strategy" PDF
// (weightage + per-subject high-yield components). Two daily threads run through every day:
// Maths (~2 hr practice) and Current Affairs (reading), exactly as the PDF prescribes.
// Each task has a stable id so checkboxes persist via useSyllabusProgress (localStorage).

export interface PlanTask {
  id: string;
  mr: string;
  en: string;
}

export interface PlanDay {
  day: number;
  phaseMr: string;
  phaseEn: string;
  icon: string;
  main: PlanTask[];
  maths: PlanTask;
  ca: PlanTask;
}

const t = (id: string, mr: string, en: string): PlanTask => ({ id, mr, en });

export const PDF_PLAN: PlanDay[] = [
  // ── Polity (Days 1–7) · 15 marks ─────────────────────────────────────────────
  {
    day: 1, phaseMr: "राज्यशास्त्र", phaseEn: "Polity", icon: "⚖️",
    main: [
      t("pp-d01-m1", "घटना निर्मिती: 1919 व 1935 चा कायदा", "Constitution making: Acts of 1919 & 1935"),
      t("pp-d01-m2", "संविधानसभा: मागणी, समित्या व अध्यक्ष, बैठका", "Constituent Assembly: demand, committees & chairpersons, sessions"),
      t("pp-d01-m3", "घटनेचे स्रोत (देशनिहाय)", "Sources of the Constitution (country-wise)"),
    ],
    maths: t("pp-d01-mt", "गणित: संख्या पद्धती", "Maths: Number System"),
    ca: t("pp-d01-ca", "चालू घडामोडी: आंतरराष्ट्रीय पुरस्कार (नोबेल/ऑस्कर/बुकर)", "CA: International awards (Nobel/Oscar/Booker)"),
  },
  {
    day: 2, phaseMr: "राज्यशास्त्र", phaseEn: "Polity", icon: "⚖️",
    main: [
      t("pp-d02-m1", "प्रस्तावना: की-वर्ड्स, 42 वी घटनादुरुस्ती, खटले", "Preamble: keywords, 42nd Amendment, cases"),
      t("pp-d02-m2", "संघराज्य व राज्यक्षेत्र: कलम 1-4 (विशेषतः कलम 3)", "Union & Territory: Articles 1-4 (esp. Article 3)"),
      t("pp-d02-m3", "राज्य पुनर्रचना: धार आयोग, JVP समिती", "State reorganisation: Dhar Commission, JVP Committee"),
    ],
    maths: t("pp-d02-mt", "गणित: सरळरूप (Simplification)", "Maths: Simplification"),
    ca: t("pp-d02-ca", "चालू घडामोडी: राष्ट्रीय पुरस्कार (पद्म/ज्ञानपीठ)", "CA: National awards (Padma/Jnanpith)"),
  },
  {
    day: 3, phaseMr: "राज्यशास्त्र", phaseEn: "Polity", icon: "⚖️",
    main: [
      t("pp-d03-m1", "मूलभूत हक्क: कलम 12-35", "Fundamental Rights: Articles 12-35"),
      t("pp-d03-m2", "याचिका (Writs) व त्यांचे प्रकार", "Writs and their types"),
      t("pp-d03-m3", "मूलभूत हक्क वि. मार्गदर्शक तत्त्वे फरक", "Fundamental Rights vs DPSP"),
    ],
    maths: t("pp-d03-mt", "गणित: पदावली (BODMAS)", "Maths: BODMAS"),
    ca: t("pp-d03-ca", "चालू घडामोडी: नेमणुका", "CA: Appointments"),
  },
  {
    day: 4, phaseMr: "राज्यशास्त्र", phaseEn: "Polity", icon: "⚖️",
    main: [
      t("pp-d04-m1", "मार्गदर्शक तत्त्वे (DPSP): कलम 36-51, वर्गीकरण", "DPSP: Articles 36-51, classification"),
      t("pp-d04-m2", "मूलभूत कर्तव्ये: कलम 51A, स्वर्णसिंह समिती, 42/86 वी दुरुस्ती", "Fundamental Duties: Art 51A, Swaran Singh, 42nd/86th Amendments"),
    ],
    maths: t("pp-d04-mt", "गणित: शेकडेवारी (Percentage)", "Maths: Percentage"),
    ca: t("pp-d04-ca", "चालू घडामोडी: निधनवार्ता", "CA: Obituaries"),
  },
  {
    day: 5, phaseMr: "राज्यशास्त्र", phaseEn: "Polity", icon: "⚖️",
    main: [
      t("pp-d05-m1", "केंद्र सरकार: राष्ट्रपती, उपराष्ट्रपती (कलम 66)", "Union Govt: President, Vice-President (Art 66)"),
      t("pp-d05-m2", "पंतप्रधान व मंत्रिमंडळ, संसद", "PM & Council of Ministers, Parliament"),
      t("pp-d05-m3", "महान्यायवादी (कलम 76)", "Attorney General (Article 76)"),
    ],
    maths: t("pp-d05-mt", "गणित: गुणोत्तर व प्रमाण", "Maths: Ratio & Proportion"),
    ca: t("pp-d05-ca", "चालू घडामोडी: ऑलिंपिक/पॅरालिंपिक 2024", "CA: Olympics/Paralympics 2024"),
  },
  {
    day: 6, phaseMr: "राज्यशास्त्र", phaseEn: "Polity", icon: "⚖️",
    main: [
      t("pp-d06-m1", "राज्य सरकार: राज्यपाल (कलम 153-163)", "State Govt: Governor (Articles 153-163)"),
      t("pp-d06-m2", "मुख्यमंत्री व मंत्रिमंडळ, विधिमंडळ (विधानसभा/परिषद, कलम 168)", "CM & Council, Legislature (Assembly/Council, Art 168)"),
      t("pp-d06-m3", "महाधिवक्ता (कलम 165)", "Advocate General (Article 165)"),
    ],
    maths: t("pp-d06-mt", "गणित: सरासरी (Average)", "Maths: Average"),
    ca: t("pp-d06-ca", "चालू घडामोडी: क्रिकेट (चॅम्पियन्स ट्रॉफी, विश्वचषक)", "CA: Cricket (Champions Trophy, World Cups)"),
  },
  {
    day: 7, phaseMr: "राज्यशास्त्र", phaseEn: "Polity", icon: "⚖️",
    main: [
      t("pp-d07-m1", "न्यायमंडळ: सर्वोच्च व उच्च न्यायालय (कलम 214-228)", "Judiciary: Supreme Court & High Courts (Art 214-228)"),
      t("pp-d07-m2", "स्थानिक स्वराज्य: 73/74 वी दुरुस्ती, कलम 243, अधिनियम", "Local Self-Govt: 73rd/74th Amendments, Art 243, Acts"),
      t("pp-d07-m3", "आयोग (UPSC/MPSC/निवडणूक/नीती), केंद्र-राज्य संबंध, कलमे/अनुसूची/सूची", "Bodies (UPSC/MPSC/EC/NITI), Centre-State, Articles/Schedules/Lists"),
    ],
    maths: t("pp-d07-mt", "गणित: नफा-तोटा (Profit & Loss)", "Maths: Profit & Loss"),
    ca: t("pp-d07-ca", "चालू घडामोडी: इतर क्रीडा व निवृत्ती", "CA: Other sports & retirements"),
  },
  // ── Economy (Days 8–13) · 15 marks ───────────────────────────────────────────
  {
    day: 8, phaseMr: "अर्थशास्त्र", phaseEn: "Economy", icon: "💰",
    main: [
      t("pp-d08-m1", "सार्वजनिक वित्त व कर: राजकोषीय धोरण, FRBM, तुटी", "Public finance & tax: fiscal policy, FRBM, deficits"),
      t("pp-d08-m2", "अर्थसंकल्पाचे प्रकार, जेंडर/बाल बजेट, 16 वा वित्त आयोग", "Budget types, Gender/Child budget, 16th Finance Commission"),
    ],
    maths: t("pp-d08-mt", "गणित: काळ-काम (Time & Work)", "Maths: Time & Work"),
    ca: t("pp-d08-ca", "चालू घडामोडी: निर्देशांक/अहवाल (जेंडर गॅप, HDI)", "CA: Indices/reports (Gender Gap, HDI)"),
  },
  {
    day: 9, phaseMr: "अर्थशास्त्र", phaseEn: "Economy", icon: "💰",
    main: [
      t("pp-d09-m1", "CAG, GST, प्रत्यक्ष-अप्रत्यक्ष कर, कर समित्या", "CAG, GST, direct/indirect tax, tax committees"),
      t("pp-d09-m2", "महाराष्ट्र आर्थिक पाहणी 2024-25", "Maharashtra Economic Survey 2024-25"),
    ],
    maths: t("pp-d09-mt", "गणित: वेग-वेळ-अंतर (रेल्वे)", "Maths: Time-Speed-Distance (Railway)"),
    ca: t("pp-d09-ca", "चालू घडामोडी: राजकीय घडामोडी", "CA: Political developments"),
  },
  {
    day: 10, phaseMr: "अर्थशास्त्र", phaseEn: "Economy", icon: "💰",
    main: [
      t("pp-d10-m1", "राष्ट्रीय उत्पन्न: GDP/GNP/NDP/NNP, आधारभूत वर्ष, CSO/NSSO", "National income: GDP/GNP/NDP/NNP, base year, CSO/NSSO"),
      t("pp-d10-m2", "भारतीय अर्थव्यवस्था: क्षेत्रीय कल (GDP व रोजगारातील वाटा)", "Indian economy: sectoral trends (GDP & employment share)"),
    ],
    maths: t("pp-d10-mt", "गणित: क्षेत्रमिती (Mensuration)", "Maths: Mensuration"),
    ca: t("pp-d10-ca", "चालू घडामोडी: आर्थिक घडामोडी", "CA: Economic developments"),
  },
  {
    day: 11, phaseMr: "अर्थशास्त्र", phaseEn: "Economy", icon: "💰",
    main: [
      t("pp-d11-m1", "बँकिंग: RBI (स्थापना, कार्ये, पतनियंत्रण साधने, राष्ट्रीयीकरण)", "Banking: RBI (setup, functions, credit-control tools, nationalisation)"),
      t("pp-d11-m2", "व्यावसायिक बँका, RRBs, नरसिंहम समित्या, SBI", "Commercial banks, RRBs, Narasimham committees, SBI"),
    ],
    maths: t("pp-d11-mt", "गणित: त्रिकोणमिती (Trigonometry)", "Maths: Trigonometry"),
    ca: t("pp-d11-ca", "चालू घडामोडी: कृषी-पर्यावरण", "CA: Agri-environment"),
  },
  {
    day: 12, phaseMr: "अर्थशास्त्र", phaseEn: "Economy", icon: "💰",
    main: [
      t("pp-d12-m1", "दारिद्र्य: समित्या, URP/MRP/MMRP, MPI/GHI", "Poverty: committees, URP/MRP/MMRP, MPI/GHI"),
      t("pp-d12-m2", "बेरोजगारी: PLFS/NSSO प्रकार", "Unemployment: PLFS/NSSO types"),
      t("pp-d12-m3", "विकासाचे निर्देशांक: HDI/IHDI/GDI/GII/PQLI", "Development indices: HDI/IHDI/GDI/GII/PQLI"),
    ],
    maths: t("pp-d12-mt", "गणित: माहितीचे विश्लेषण (DI)", "Maths: Data Interpretation"),
    ca: t("pp-d12-ca", "चालू घडामोडी: राष्ट्रीय घडामोडी", "CA: National developments"),
  },
  {
    day: 13, phaseMr: "अर्थशास्त्र", phaseEn: "Economy", icon: "💰",
    main: [
      t("pp-d13-m1", "कृषी (क्रांती, NAFED, PM-KISAN/PMFBY) व उद्योग (महारत्न, 1991 धोरण, MSME)", "Agriculture (revolutions, NAFED, schemes) & Industry (Maharatna, 1991 policy, MSME)"),
      t("pp-d13-m2", "आंतरराष्ट्रीय व्यापार व संस्था (IMF/WB/WTO/ADB/BRICS), पंचवार्षिक योजना 9-12", "Intl trade & bodies (IMF/WB/WTO/ADB/BRICS), Five-Year Plans 9-12"),
      t("pp-d13-m3", "केंद्रीय अर्थसंकल्प 2025-26", "Union Budget 2025-26"),
    ],
    maths: t("pp-d13-mt", "गणित: वयवारी (Ages)", "Maths: Ages"),
    ca: t("pp-d13-ca", "चालू घडामोडी: प्रादेशिक (महाराष्ट्र)", "CA: Regional (Maharashtra)"),
  },
  // ── Science (Days 14–17) · 15 marks ──────────────────────────────────────────
  {
    day: 14, phaseMr: "सामान्य विज्ञान", phaseEn: "Science", icon: "🔬",
    main: [
      t("pp-d14-m1", "जीवशास्त्र: सजीवांचे वर्गीकरण (लिनियस, बेंथम-हूकर, व्हिटाकर)", "Biology: classification of organisms (Linnaeus, Bentham-Hooker, Whittaker)"),
      t("pp-d14-m2", "वनस्पतींचे वर्गीकरण, नायट्रोजन स्थिरीकरण, कीटकभक्षी वनस्पती", "Plant classification, nitrogen fixation, insectivorous plants"),
    ],
    maths: t("pp-d14-mt", "गणित: ल.सा.वि.-म.सा.वि.", "Maths: LCM-HCF"),
    ca: t("pp-d14-ca", "चालू घडामोडी: आंतरराष्ट्रीय शिखर परिषदा (NATO/BRICS/WTO)", "CA: International summits (NATO/BRICS/WTO)"),
  },
  {
    day: 15, phaseMr: "सामान्य विज्ञान", phaseEn: "Science", icon: "🔬",
    main: [
      t("pp-d15-m1", "प्राण्यांचे वर्गीकरण: 10 संघ सविस्तर, Symmetry, वैज्ञानिक नावे", "Animal classification: 10 phyla in detail, symmetry, scientific names"),
      t("pp-d15-m2", "उदाहरणे: Petromyzon, कांगारू, प्लॅटिपस, हायड्रा", "Examples: Petromyzon, kangaroo, platypus, hydra"),
    ],
    maths: t("pp-d15-mt", "गणित: घातांक (Powers/Indices)", "Maths: Powers/Indices"),
    ca: t("pp-d15-ca", "चालू घडामोडी: अंतराळ (Axiom-4, चांद्रयान, गगनयान)", "CA: Space (Axiom-4, Chandrayaan, Gaganyaan)"),
  },
  {
    day: 16, phaseMr: "सामान्य विज्ञान", phaseEn: "Science", icon: "🔬",
    main: [
      t("pp-d16-m1", "रोग (जीवाणू/विषाणू/लस), पोषणमूल्ये (जीवनसत्त्वे/प्रथिने)", "Diseases (pathogen/vaccine), nutrition (vitamins/proteins)"),
      t("pp-d16-m2", "ग्रंथी व संप्रेरके, वनस्पती संप्रेरके", "Glands & hormones, plant hormones"),
    ],
    maths: t("pp-d16-mt", "गणित: संख्यामालिका", "Maths: Number Series"),
    ca: t("pp-d16-ca", "चालू घडामोडी: शासकीय योजना", "CA: Government schemes"),
  },
  {
    day: 17, phaseMr: "सामान्य विज्ञान", phaseEn: "Science", icon: "🔬",
    main: [
      t("pp-d17-m1", "भौतिकशास्त्र: ध्वनी, प्रकाश, विद्युतधारा, किरणोत्सारिता, ऊर्जा", "Physics: sound, light, current, radioactivity, energy"),
      t("pp-d17-m2", "रसायनशास्त्र: द्रव्य/अणुरचना/आवर्तसारणी, कार्बन, आम्ल-आम्लारी, धातू", "Chemistry: matter/atomic structure/periodic table, carbon, acids-bases, metals"),
    ],
    maths: t("pp-d17-mt", "बुद्धिमत्ता: बैठकव्यवस्था", "Reasoning: Seating Arrangement"),
    ca: t("pp-d17-ca", "चालू घडामोडी: चर्चेतील पुस्तके/दिनविशेष/समित्या", "CA: Books/Days/Committees in news"),
  },
  // ── History (Days 18–22) · 10 marks ──────────────────────────────────────────
  {
    day: 18, phaseMr: "इतिहास", phaseEn: "History", icon: "🏛️",
    main: [
      t("pp-d18-m1", "1857 चा उठाव (महाराष्ट्र व भारत): ठिकाणे, नेतृत्व, बिमोड, 1858 कायदा", "1857 revolt (MH & India): centres, leaders, suppressors, Act of 1858"),
      t("pp-d18-m2", "1857 पूर्वीचे उठाव: भिल्ल/कोळी/रामोशी (उमाजी नाईक, तंट्या भिल्ल)", "Pre-1857 revolts: Bhil/Koli/Ramoshi (Umaji Naik, Tantya Bhil)"),
    ],
    maths: t("pp-d18-mt", "बुद्धिमत्ता: संख्यामालिका", "Reasoning: Number Series"),
    ca: t("pp-d18-ca", "चालू घडामोडी: संरक्षण घडामोडी", "CA: Defence developments"),
  },
  {
    day: 19, phaseMr: "इतिहास", phaseEn: "History", icon: "🏛️",
    main: [
      t("pp-d19-m1", "महाराष्ट्राची शेतकरी चळवळ: सुपे उठाव, डेक्कन रायट्स कमिशन", "Maharashtra farmer movement: Supe revolt, Deccan Riots Commission"),
      t("pp-d19-m2", "कामगार चळवळ: बॉम्बे मिल हँड असोसिएशन, ना. मे. लोखंडे, संघटना", "Labour movement: Bombay Mill Hand Assoc, N.M. Lokhande, unions"),
    ],
    maths: t("pp-d19-mt", "बुद्धिमत्ता: Syllogism", "Reasoning: Syllogism"),
    ca: t("pp-d19-ca", "चालू घडामोडी: नवीन पुरस्कार (उजळणी)", "CA: New awards (revisit)"),
  },
  {
    day: 20, phaseMr: "इतिहास", phaseEn: "History", icon: "🏛️",
    main: [
      t("pp-d20-m1", "सामाजिक-धार्मिक सुधारणा (ब्राह्मो/प्रार्थना/आर्य/सत्यशोधक): संस्थापक/उद्देश/वृत्तपत्रे", "Social-religious reform (Brahmo/Prarthana/Arya/Satyashodhak): founders/aims/papers"),
      t("pp-d20-m2", "समाजसुधारक: फुले, आंबेडकर, शाहू, कर्वे, रानडे इ.", "Social reformers: Phule, Ambedkar, Shahu, Karve, Ranade, etc."),
    ],
    maths: t("pp-d20-mt", "बुद्धिमत्ता: दिशा (Directions)", "Reasoning: Directions"),
    ca: t("pp-d20-ca", "चालू घडामोडी: नेमणुका (उजळणी)", "CA: Appointments (revisit)"),
  },
  {
    day: 21, phaseMr: "इतिहास", phaseEn: "History", icon: "🏛️",
    main: [
      t("pp-d21-m1", "काँग्रेसपूर्व संघटना + काँग्रेस स्थापना व महत्त्वाची अधिवेशने (अध्यक्ष/ठिकाण)", "Pre-Congress orgs + Congress founding & key sessions (presidents/venues)"),
      t("pp-d21-m2", "राष्ट्रीय चळवळ (असहकार, सविनय कायदेभंग) + क्रांतिकारी चळवळ", "National movement (Non-cooperation, Civil Disobedience) + revolutionary movement"),
    ],
    maths: t("pp-d21-mt", "बुद्धिमत्ता: नातेसंबंध (Blood Relation)", "Reasoning: Blood Relations"),
    ca: t("pp-d21-ca", "चालू घडामोडी: क्रीडा (उजळणी)", "CA: Sports (revisit)"),
  },
  {
    day: 22, phaseMr: "इतिहास", phaseEn: "History", icon: "🏛️",
    main: [
      t("pp-d22-m1", "ब्रिटिशांचे आर्थिक धोरण: संपत्ती निःसारण (नौरोजी/रानडे), रेल्वे-तार, दुष्काळ आयोग", "British economic policy: drain (Naoroji/Ranade), railway-telegraph, Famine Commissions"),
      t("pp-d22-m2", "भूसुधारणा पद्धती (रयतवारी/महालवारी/कायमधारा), गव्हर्नर जनरल-व्हाईसरॉय, वृत्तपत्रे", "Land-revenue systems (Ryotwari/Mahalwari/Permanent), Governors-General/Viceroys, newspapers"),
    ],
    maths: t("pp-d22-mt", "बुद्धिमत्ता: रांगेतील स्थान (Ranking)", "Reasoning: Ranking"),
    ca: t("pp-d22-ca", "चालू घडामोडी: निर्देशांक (उजळणी)", "CA: Indices (revisit)"),
  },
  // ── Geography (Days 23–26) · 10 marks ────────────────────────────────────────
  {
    day: 23, phaseMr: "भूगोल", phaseEn: "Geography", icon: "🗺️",
    main: [
      t("pp-d23-m1", "महाराष्ट्र: स्थान/विस्तार/क्षेत्रफळ, प्रशासकीय विभाग (1960 vs 2025)", "Maharashtra: location/extent/area, admin divisions (1960 vs 2025)"),
      t("pp-d23-m2", "प्राकृतिक विभाग (कोकण, सह्याद्री, पठार), डोंगररांगा/शिखरे/घाट", "Physical divisions (Konkan, Sahyadri, plateau), ranges/peaks/ghats"),
    ],
    maths: t("pp-d23-mt", "बुद्धिमत्ता: Analogy", "Reasoning: Analogy"),
    ca: t("pp-d23-ca", "चालू घडामोडी: प्रादेशिक (महाराष्ट्र धोरणे)", "CA: Regional (Maharashtra policies)"),
  },
  {
    day: 24, phaseMr: "भूगोल", phaseEn: "Geography", icon: "🗺️",
    main: [
      t("pp-d24-m1", "महाराष्ट्र: नदीप्रणाली (खोरे, उपनद्या, धरणे), वने (उद्याने/अभयारण्ये/व्याघ्र प्रकल्प)", "Maharashtra: rivers (basins, tributaries, dams), forests (parks/sanctuaries/tiger reserves)"),
      t("pp-d24-m2", "खनिज व ऊर्जा (कोळसा/औष्णिक/जल/पवन/अणू)", "Minerals & energy (coal/thermal/hydro/wind/nuclear)"),
    ],
    maths: t("pp-d24-mt", "बुद्धिमत्ता: सांकेतिक भाषा (Coding-Decoding)", "Reasoning: Coding-Decoding"),
    ca: t("pp-d24-ca", "चालू घडामोडी: राष्ट्रीय (उजळणी)", "CA: National (revisit)"),
  },
  {
    day: 25, phaseMr: "भूगोल", phaseEn: "Geography", icon: "🗺️",
    main: [
      t("pp-d25-m1", "महाराष्ट्र: लोकसंख्या (2001-2011, स्थलांतर, आदिवासी), हवामान", "Maharashtra: population (2001-2011, migration, tribes), climate"),
      t("pp-d25-m2", "कृषी/पशुधन/मासेमारी, जलसिंचन प्रकल्प, उद्योग, कोकण रेल्वे", "Agriculture/livestock/fishing, irrigation projects, industry, Konkan Railway"),
    ],
    maths: t("pp-d25-mt", "बुद्धिमत्ता: संख्यांची कोडी (Number Puzzle)", "Reasoning: Number Puzzle"),
    ca: t("pp-d25-ca", "चालू घडामोडी: आर्थिक (उजळणी)", "CA: Economic (revisit)"),
  },
  {
    day: 26, phaseMr: "भूगोल", phaseEn: "Geography", icon: "🗺️",
    main: [
      t("pp-d26-m1", "भारत: प्राकृतिक भूगोल (सर्वाधिक प्रश्न), नदीप्रणाली, हवामान", "India: physical geography (most Qs), rivers, climate"),
      t("pp-d26-m2", "भारत: लोकसंख्या, ऊर्जा/खनिज, वाहतूक, कृषी + जग भूगोल पाया", "India: population, energy/minerals, transport, agriculture + World basics"),
    ],
    maths: t("pp-d26-mt", "बुद्धिमत्ता: घड्याळ व दिनदर्शिका", "Reasoning: Clock & Calendar"),
    ca: t("pp-d26-ca", "चालू घडामोडी: अंतराळ/विज्ञान", "CA: Space/Science"),
  },
  // ── Consolidation (Days 27–30) ───────────────────────────────────────────────
  {
    day: 27, phaseMr: "उजळणी व सराव परीक्षा", phaseEn: "Revision & Mocks", icon: "📝",
    main: [
      t("pp-d27-m1", "पूर्ण सराव परीक्षा #1 → तपासणी + Weak Areas", "Full Mock #1 → review + Weak Areas"),
      t("pp-d27-m2", "राज्यशास्त्र + अर्थशास्त्र Exam Focus नोट्स उजळणी", "Revise Polity + Economy Exam-Focus notes"),
    ],
    maths: t("pp-d27-mt", "बुद्धिमत्ता: वर्णमाला/आकृत्यांची कोडी", "Reasoning: Alphabet/Figure puzzles"),
    ca: t("pp-d27-ca", "चालू घडामोडी: महिन्याची उजळणी", "CA: Monthly revision"),
  },
  {
    day: 28, phaseMr: "उजळणी व सराव परीक्षा", phaseEn: "Revision & Mocks", icon: "📝",
    main: [
      t("pp-d28-m1", "पूर्ण सराव परीक्षा #2 → तपासणी", "Full Mock #2 → review"),
      t("pp-d28-m2", "पाठांतर: कलमे, गव्हर्नर जनरल, समित्या, महाराष्ट्र भूगोल तथ्ये", "Memorise: Articles, Governors-General, committees, MH geography facts"),
    ],
    maths: t("pp-d28-mt", "गणित: कमकुवत प्रकारांचा सराव", "Maths: practice weak types"),
    ca: t("pp-d28-ca", "चालू घडामोडी: पुरस्कार+व्यक्तिविशेष उजळणी", "CA: Awards + persons revision"),
  },
  {
    day: 29, phaseMr: "उजळणी व सराव परीक्षा", phaseEn: "Revision & Mocks", icon: "📝",
    main: [
      t("pp-d29-m1", "पूर्ण सराव परीक्षा #3 → तपासणी", "Full Mock #3 → review"),
      t("pp-d29-m2", "विज्ञान + इतिहास + भूगोल उच्च-गुणदायी मुद्दे उजळणी", "Revise Science + History + Geography high-yield points"),
    ],
    maths: t("pp-d29-mt", "गणित: कमकुवत प्रकारांचा सराव", "Maths: practice weak types"),
    ca: t("pp-d29-ca", "चालू घडामोडी: निर्देशांक+योजना उजळणी", "CA: Indices + schemes revision"),
  },
  {
    day: 30, phaseMr: "अंतिम उजळणी", phaseEn: "Final Revision", icon: "🏁",
    main: [
      t("pp-d30-m1", "सर्व 8 Exam Focus नोट्स अंतिम उजळणी", "Final revision of all 8 Exam-Focus notes"),
      t("pp-d30-m2", "चालू घडामोडी: मागील 12-18 महिने", "Current Affairs: last 12-18 months"),
      t("pp-d30-m3", "हलका गणित सराव व विश्रांती", "Light Maths practice & rest"),
    ],
    maths: t("pp-d30-mt", "गणित: मिश्र झटपट सराव", "Maths: quick mixed practice"),
    ca: t("pp-d30-ca", "चालू घडामोडी: अंतिम झटपट उजळणी", "CA: final quick revision"),
  },
];

export const PDF_PLAN_TASK_IDS: string[] = PDF_PLAN.flatMap((d) => [
  ...d.main.map((m) => m.id),
  d.maths.id,
  d.ca.id,
]);
