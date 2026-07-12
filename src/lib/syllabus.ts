// Official MPSC Group-C Combined 2026 syllabus (Advt. 017/2026).
// Source of truth: docs/official-syllabus-2026.md.
// Prelims = 8 subjects (100 marks). Mains = Paper 1 Language (common) + Paper 2 (post-specific).
//
// Per-subject prelims `marks` = real question weightage, derived from Lokseva Academy's
// "Combine 60+ Marks Strategy" PYQ analysis of the 3 most recent papers (1 Jun 2025,
// 2 Feb 2025, 30 Apr 2023): Maths 20 (Arithmetic 11 + Reasoning 9), Polity 15,
// Economy 15, Science 15, Current Affairs 15, History 10, Geography 10 = 100.
// This weightage drives the mock assembler (src/lib/mock.ts).

export type Stage = "prelims" | "mains";
export type Post = "common" | "industry-inspector" | "technical-assistant";

export interface Subtopic {
  key: string;
  label: string;
  labelEn: string;
}

export interface Subject {
  key: string;
  label: string;
  labelEn: string;
  icon: string;
  marks: number; // prelims: contribution to the 100-mark paper; mains: paper marks
  stage: Stage;
  paper?: 1 | 2; // mains only
  post?: Post; // mains only
  subtopics: Subtopic[];
}

// ── PRELIMS (8 subjects, 100 marks, common to all Group-C posts) ────────────────

export const PRELIMS_SUBJECTS: Subject[] = [
  {
    key: "history", label: "इतिहास", labelEn: "History", icon: "🏛️", marks: 10, stage: "prelims",
    subtopics: [
      { key: "ancient-medieval", label: "प्राचीन व मध्ययुगीन भारत", labelEn: "Ancient & Medieval India" },
      { key: "modern-india", label: "आधुनिक भारत", labelEn: "Modern India" },
      { key: "maharashtra-reformers", label: "महाराष्ट्र समाजसुधारक", labelEn: "Maharashtra Reformers" },
      { key: "post-independence", label: "स्वातंत्र्योत्तर भारत", labelEn: "Post-Independence" },
    ],
  },
  {
    key: "geography", label: "भूगोल", labelEn: "Geography", icon: "🗺️", marks: 10, stage: "prelims",
    subtopics: [
      { key: "maharashtra-geo", label: "महाराष्ट्र भूगोल", labelEn: "Maharashtra Geography" },
      { key: "india-geo", label: "भारत भूगोल", labelEn: "India Geography" },
      { key: "world-geo", label: "जग भूगोल", labelEn: "World Geography" },
    ],
  },
  {
    key: "polity", label: "राज्यशास्त्र", labelEn: "Polity & Governance", icon: "⚖️", marks: 15, stage: "prelims",
    subtopics: [
      { key: "constitution-framework", label: "राज्यघटना रचना", labelEn: "Constitutional Framework" },
      { key: "rights-duties", label: "मूलभूत हक्क व कर्तव्ये", labelEn: "Rights & Duties" },
      { key: "union-govt", label: "केंद्र सरकार", labelEn: "Union Government" },
      { key: "state-govt", label: "राज्य सरकार", labelEn: "State Government" },
      { key: "judiciary", label: "न्यायव्यवस्था", labelEn: "Judiciary" },
      { key: "local-govt", label: "स्थानिक स्वराज्य संस्था", labelEn: "Local Self-Government" },
    ],
  },
  {
    key: "current_affairs", label: "चालू घडामोडी", labelEn: "Current Affairs", icon: "📰", marks: 15, stage: "prelims",
    subtopics: [
      { key: "national-intl", label: "राष्ट्रीय व आंतरराष्ट्रीय", labelEn: "National & International" },
      { key: "maharashtra-ca", label: "महाराष्ट्र घडामोडी", labelEn: "Maharashtra Affairs" },
      { key: "sports-misc", label: "क्रीडा व संकीर्ण", labelEn: "Sports & Misc" },
    ],
  },
  {
    key: "science", label: "सामान्य विज्ञान", labelEn: "General Science", icon: "🔬", marks: 15, stage: "prelims",
    subtopics: [
      { key: "physics", label: "भौतिकशास्त्र", labelEn: "Physics" },
      { key: "chemistry", label: "रसायनशास्त्र", labelEn: "Chemistry" },
      { key: "biology", label: "जीवशास्त्र", labelEn: "Biology" },
      { key: "health-hygiene", label: "आरोग्य व स्वच्छता", labelEn: "Health & Hygiene" },
      { key: "sci-tech-dev", label: "विज्ञान-तंत्रज्ञान व पर्यावरण", labelEn: "Sci-Tech & Environment" },
    ],
  },
  {
    key: "economy", label: "अर्थशास्त्र", labelEn: "Economy", icon: "💰", marks: 15, stage: "prelims",
    subtopics: [
      { key: "national-income", label: "राष्ट्रीय उत्पन्न", labelEn: "National Income" },
      { key: "agriculture-eco", label: "कृषी अर्थव्यवस्था", labelEn: "Agriculture" },
      { key: "industry-eco", label: "उद्योग", labelEn: "Industry" },
      { key: "trade-banking", label: "व्यापार व बँकिंग", labelEn: "Trade & Banking" },
      { key: "population-social", label: "लोकसंख्या व सामाजिक निर्देशक", labelEn: "Population & Social" },
      { key: "govt-finance", label: "सरकारी वित्त", labelEn: "Government Finance" },
    ],
  },
  {
    key: "arithmetic", label: "अंकगणित", labelEn: "Arithmetic", icon: "🔢", marks: 11, stage: "prelims",
    subtopics: [
      { key: "number-system", label: "संख्या पद्धती", labelEn: "Number System" },
      { key: "commercial-maths", label: "वाणिज्य गणित", labelEn: "Commercial Maths" },
      { key: "time-work-speed", label: "काळ-काम-वेग", labelEn: "Time, Work & Speed" },
      { key: "data-interpretation", label: "सामग्री विश्लेषण", labelEn: "Data Interpretation" },
    ],
  },
  {
    key: "reasoning", label: "बुद्धिमत्ता चाचणी", labelEn: "Reasoning", icon: "🧠", marks: 9, stage: "prelims",
    subtopics: [
      { key: "series-coding", label: "मालिका व कोडिंग", labelEn: "Series & Coding-Decoding" },
      { key: "relations-direction", label: "नातेसंबंध व दिशा", labelEn: "Relations & Direction" },
      { key: "clock-calendar", label: "घड्याळ व दिनदर्शिका", labelEn: "Clock & Calendar" },
      { key: "analogy-classification", label: "सहसंबंध व वर्गीकरण", labelEn: "Analogy & Classification" },
      { key: "logical", label: "तार्किक विचार", labelEn: "Logical Reasoning" },
    ],
  },
];

// ── MAINS ───────────────────────────────────────────────────────────────────────

export const MAINS_SUBJECTS: Subject[] = [
  // Paper 1 — Language (common to all posts, 100 marks: Marathi 50 + English 50)
  {
    key: "mains-marathi", label: "मराठी (मुख्य)", labelEn: "Marathi (Mains P1)", icon: "📖", marks: 50, stage: "mains", paper: 1, post: "common",
    subtopics: [
      { key: "vyakaran", label: "व्याकरण (संधी, समास, अलंकार)", labelEn: "Grammar (Sandhi/Samas/Alankar)" },
      { key: "shabdsampada", label: "शब्दसंपदा", labelEn: "Vocabulary" },
      { key: "mhani-vakprachar", label: "म्हणी व वाक्प्रचार", labelEn: "Idioms & Proverbs" },
      { key: "vakyarachana", label: "वाक्यरचना व शुद्धलेखन", labelEn: "Sentence & Correction" },
      { key: "aakalan", label: "उतारा व भाषांतर", labelEn: "Comprehension & Translation" },
    ],
  },
  {
    key: "mains-english", label: "English (Mains)", labelEn: "English (Mains P1)", icon: "🔤", marks: 50, stage: "mains", paper: 1, post: "common",
    subtopics: [
      { key: "grammar", label: "Grammar (Tenses/Voice/Speech)", labelEn: "Grammar" },
      { key: "vocabulary", label: "Vocabulary", labelEn: "Vocabulary" },
      { key: "sentence", label: "Sentence Correction/Rearrangement", labelEn: "Sentence Structure" },
      { key: "idioms", label: "Idioms & Phrasal Verbs", labelEn: "Idioms & Phrases" },
      { key: "comprehension", label: "Comprehension", labelEn: "Comprehension" },
    ],
  },
  // Paper 2 — Industry Inspector (उद्योग निरीक्षक)
  {
    key: "ii-general", label: "सामान्य क्षमता (उद्योग निरीक्षक)", labelEn: "General Ability (Ind. Inspector)", icon: "🏭", marks: 40, stage: "mains", paper: 2, post: "industry-inspector",
    subtopics: [
      { key: "current-affairs", label: "चालू घडामोडी", labelEn: "Current Affairs" },
      { key: "reasoning", label: "बुद्धिमत्ता चाचणी", labelEn: "Intelligence Test" },
      { key: "rti-act", label: "माहिती अधिकार कायदा 2005", labelEn: "RTI Act 2005" },
      { key: "rts-act", label: "सेवा हमी कायदा 2015", labelEn: "Right to Public Service Act 2015" },
      { key: "constitution-admin", label: "राज्यघटना (प्रशासकीय)", labelEn: "Constitution (Administrative)" },
      { key: "computer-it", label: "संगणक व माहिती तंत्रज्ञान", labelEn: "Computer & IT" },
    ],
  },
  {
    key: "ii-industry", label: "औद्योगिक ज्ञान (उद्योग निरीक्षक)", labelEn: "Industrial Knowledge (Ind. Inspector)", icon: "⚙️", marks: 60, stage: "mains", paper: 2, post: "industry-inspector",
    subtopics: [
      { key: "industrial-policy", label: "औद्योगिक धोरण", labelEn: "Industrial Policy" },
      { key: "industrial-acts", label: "औद्योगिक कायदे", labelEn: "Industrial Acts (Factories/MSMED/IDR)" },
      { key: "industrial-tribunal", label: "औद्योगिक न्यायाधिकरण व पुनर्वसन", labelEn: "Tribunal & Rehabilitation" },
      { key: "industrial-bodies", label: "औद्योगिक विकास संस्था", labelEn: "Development Bodies (MIDC/SICOM)" },
    ],
  },
  // Paper 2 — Technical Assistant (तांत्रिक सहायक, विमा संचालनालय)
  {
    key: "ta-general", label: "सामान्य क्षमता (तांत्रिक सहायक)", labelEn: "General Ability (Tech. Assistant)", icon: "📊", marks: 40, stage: "mains", paper: 2, post: "technical-assistant",
    subtopics: [
      { key: "general-knowledge", label: "सामान्य ज्ञान", labelEn: "General Knowledge" },
      { key: "current-affairs", label: "चालू घडामोडी", labelEn: "Current Affairs" },
      { key: "reasoning", label: "बुद्धिमत्ता चाचणी", labelEn: "Intelligence Test" },
      { key: "math-stats", label: "गणित व सांख्यिकी", labelEn: "Maths & Statistics" },
      { key: "rti-act", label: "माहिती अधिकार कायदा 2005", labelEn: "RTI Act 2005" },
      { key: "computer-it", label: "संगणक व माहिती तंत्रज्ञान", labelEn: "Computer & IT" },
    ],
  },
  {
    key: "ta-insurance", label: "विमा ज्ञान (तांत्रिक सहायक)", labelEn: "Insurance Knowledge (Tech. Assistant)", icon: "🛡️", marks: 60, stage: "mains", paper: 2, post: "technical-assistant",
    subtopics: [
      { key: "insurance-concepts", label: "विमा संकल्पना", labelEn: "Insurance Concepts" },
      { key: "irda", label: "IRDA", labelEn: "IRDA" },
      { key: "directorate-insurance", label: "विमा संचालनालय (महाराष्ट्र)", labelEn: "Directorate of Insurance (MH)" },
    ],
  },
];

export const ALL_SUBJECTS: Subject[] = [...PRELIMS_SUBJECTS, ...MAINS_SUBJECTS];

// Backward-compatible alias: SYLLABUS = the prelims paper (drives the mock assembler).
export const SYLLABUS = PRELIMS_SUBJECTS;

export const PRELIMS_TOTAL_MARKS = PRELIMS_SUBJECTS.reduce((n, s) => n + s.marks, 0);

// Exam pattern facts (official — Advt. 017/2026).
export const EXAM_PATTERN = {
  prelims: { questions: 100, marks: 100, durationMin: 60, negativeMarking: 0.25, mode: "CBT" as const },
  mains: { papers: 2, marksPerPaper: 100, durationMinPerPaper: 60, marksPerQuestion: 2, negativeMarking: 0.25 },
  prelimsForShortlistingOnly: true,
};

export function getSubject(key: string): Subject | undefined {
  return ALL_SUBJECTS.find((s) => s.key === key);
}
export function getSubtopic(subjectKey: string, subtopicKey: string): Subtopic | undefined {
  return getSubject(subjectKey)?.subtopics.find((t) => t.key === subtopicKey);
}
export function allSubtopicKeys(): { subject: string; subtopic: string }[] {
  return ALL_SUBJECTS.flatMap((s) => s.subtopics.map((t) => ({ subject: s.key, subtopic: t.key })));
}
