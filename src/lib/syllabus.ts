export type SubjectKey =
  | "marathi" | "english" | "gk" | "aptitude" | "science" | "current_affairs";

export interface Subtopic { key: string; label: string; labelEn: string; }
export interface Subject {
  key: SubjectKey; label: string; labelEn: string; icon: string;
  prelimsMarks: number; subtopics: Subtopic[];
}

export const SYLLABUS: Subject[] = [
  {
    key: "marathi", label: "मराठी भाषा", labelEn: "Marathi Language", icon: "📖", prelimsMarks: 15,
    subtopics: [
      { key: "sandhi-samas", label: "संधी व समास", labelEn: "Sandhi & Samas" },
      { key: "mhani-vakprachar", label: "म्हणी व वाक्यप्रचार", labelEn: "Idioms & Proverbs" },
      { key: "shabdsampada", label: "शब्दसंपदा", labelEn: "Vocabulary (Syn/Antonyms)" },
      { key: "vyakaran", label: "व्याकरण", labelEn: "Grammar (Kaal/Vachan/Ling)" },
      { key: "aakalan", label: "उतारा आकलन", labelEn: "Comprehension" },
    ],
  },
  {
    key: "english", label: "English", labelEn: "English Language", icon: "🔤", prelimsMarks: 15,
    subtopics: [
      { key: "grammar", label: "Grammar", labelEn: "Tenses/Articles/Prepositions" },
      { key: "vocabulary", label: "Vocabulary", labelEn: "Synonyms/Antonyms" },
      { key: "comprehension", label: "Comprehension", labelEn: "Reading Comprehension" },
      { key: "sentence", label: "Sentence Correction", labelEn: "Correction/Rearrangement" },
      { key: "idioms", label: "Idioms & Phrases", labelEn: "Idioms & Phrases" },
    ],
  },
  {
    key: "gk", label: "सामान्य ज्ञान", labelEn: "General Knowledge", icon: "🌐", prelimsMarks: 30,
    subtopics: [
      { key: "mh-history", label: "महाराष्ट्र इतिहास", labelEn: "Maharashtra History" },
      { key: "mh-geography", label: "महाराष्ट्र भूगोल", labelEn: "Maharashtra Geography" },
      { key: "india-history", label: "भारत इतिहास", labelEn: "India History" },
      { key: "india-geography", label: "भारत भूगोल", labelEn: "India Geography" },
      { key: "constitution", label: "राज्यघटना", labelEn: "Indian Constitution" },
      { key: "economy", label: "अर्थव्यवस्था", labelEn: "Economy" },
      { key: "environment", label: "पर्यावरण", labelEn: "Environment" },
    ],
  },
  {
    key: "aptitude", label: "बौद्धिक क्षमता", labelEn: "Mental Ability & Aptitude", icon: "🧠", prelimsMarks: 25,
    subtopics: [
      { key: "series", label: "संख्यामालिका", labelEn: "Number Series" },
      { key: "coding-decoding", label: "कोडिंग-डिकोडिंग", labelEn: "Coding-Decoding" },
      { key: "analogy", label: "साधर्म्य", labelEn: "Analogies" },
      { key: "direction-blood", label: "दिशा व रक्तसंबंध", labelEn: "Direction & Blood Relations" },
      { key: "syllogism", label: "न्यायनिगमन", labelEn: "Syllogisms" },
      { key: "maths", label: "गणित", labelEn: "Arithmetic (%, Ratio, Time-Work)" },
    ],
  },
  {
    key: "science", label: "विज्ञान व तंत्रज्ञान", labelEn: "Science & Technology", icon: "🔬", prelimsMarks: 10,
    subtopics: [
      { key: "physics", label: "भौतिकशास्त्र", labelEn: "Physics" },
      { key: "chemistry", label: "रसायनशास्त्र", labelEn: "Chemistry" },
      { key: "biology", label: "जीवशास्त्र", labelEn: "Biology" },
      { key: "tech", label: "तंत्रज्ञान", labelEn: "Technology" },
    ],
  },
  {
    key: "current_affairs", label: "चालू घडामोडी", labelEn: "Current Affairs", icon: "📰", prelimsMarks: 5,
    subtopics: [
      { key: "mh-affairs", label: "महाराष्ट्र घडामोडी", labelEn: "Maharashtra Affairs" },
      { key: "national", label: "राष्ट्रीय घडामोडी", labelEn: "National Affairs" },
      { key: "sports-awards", label: "क्रीडा व पुरस्कार", labelEn: "Sports & Awards" },
      { key: "sci-tech-news", label: "विज्ञान-तंत्रज्ञान घडामोडी", labelEn: "Sci-Tech News" },
    ],
  },
];

export const PRELIMS_TOTAL_MARKS = SYLLABUS.reduce((n, s) => n + s.prelimsMarks, 0);

export function getSubject(key: string): Subject | undefined {
  return SYLLABUS.find((s) => s.key === key);
}
export function getSubtopic(subjectKey: string, subtopicKey: string): Subtopic | undefined {
  return getSubject(subjectKey)?.subtopics.find((t) => t.key === subtopicKey);
}
export function allSubtopicKeys(): { subject: string; subtopic: string }[] {
  return SYLLABUS.flatMap((s) => s.subtopics.map((t) => ({ subject: s.key, subtopic: t.key })));
}
