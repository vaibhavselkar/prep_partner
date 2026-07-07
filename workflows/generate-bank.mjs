export const meta = {
  name: 'generate-mpsc-bank',
  description: 'Generate + verify MPSC Group-C prelims questions and notes per subtopic',
  phases: [
    { title: 'Generate', detail: 'draft questions per subtopic' },
    { title: 'Verify', detail: 'fact-check + fix answer keys' },
    { title: 'Notes', detail: 'write concise study notes' },
  ],
}

const QUESTION_SCHEMA = {
  type: 'object',
  required: ['questions'],
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        required: ['question', 'options', 'answer', 'explanation', 'difficulty', 'language'],
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' }, minItems: 4, maxItems: 4 },
          answer: { enum: ['A', 'B', 'C', 'D'] },
          explanation: { type: 'string' },
          difficulty: { enum: ['easy', 'medium', 'hard'] },
          language: { enum: ['marathi', 'english', 'bilingual'] },
        },
      },
    },
  },
}

const VERIFY_SCHEMA = {
  type: 'object',
  required: ['verdicts'],
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        required: ['index', 'keep'],
        properties: {
          index: { type: 'number' },
          keep: { type: 'boolean' },
          fixedAnswer: { enum: ['A', 'B', 'C', 'D', ''] },
          reason: { type: 'string' },
        },
      },
    },
  },
}

const NOTES_SCHEMA = {
  type: 'object',
  required: ['markdown'],
  properties: { markdown: { type: 'string' } },
}

const ITEMS = [
  { subject: 'marathi', subtopic: 'sandhi-samas', labelEn: 'Sandhi & Samas', lang: 'marathi' },
  { subject: 'marathi', subtopic: 'mhani-vakprachar', labelEn: 'Idioms & Proverbs', lang: 'marathi' },
  { subject: 'marathi', subtopic: 'shabdsampada', labelEn: 'Vocabulary (Syn/Antonyms)', lang: 'marathi' },
  { subject: 'marathi', subtopic: 'vyakaran', labelEn: 'Grammar (Kaal/Vachan/Ling)', lang: 'marathi' },
  { subject: 'marathi', subtopic: 'aakalan', labelEn: 'Reading Comprehension', lang: 'marathi' },
  { subject: 'english', subtopic: 'grammar', labelEn: 'Tenses/Articles/Prepositions', lang: 'english' },
  { subject: 'english', subtopic: 'vocabulary', labelEn: 'Synonyms/Antonyms', lang: 'english' },
  { subject: 'english', subtopic: 'comprehension', labelEn: 'Reading Comprehension', lang: 'english' },
  { subject: 'english', subtopic: 'sentence', labelEn: 'Sentence Correction/Rearrangement', lang: 'english' },
  { subject: 'english', subtopic: 'idioms', labelEn: 'Idioms & Phrases', lang: 'english' },
  { subject: 'gk', subtopic: 'mh-history', labelEn: 'Maharashtra History', lang: 'bilingual' },
  { subject: 'gk', subtopic: 'mh-geography', labelEn: 'Maharashtra Geography', lang: 'bilingual' },
  { subject: 'gk', subtopic: 'india-history', labelEn: 'India History', lang: 'bilingual' },
  { subject: 'gk', subtopic: 'india-geography', labelEn: 'India Geography', lang: 'bilingual' },
  { subject: 'gk', subtopic: 'constitution', labelEn: 'Indian Constitution', lang: 'bilingual' },
  { subject: 'gk', subtopic: 'economy', labelEn: 'Economy', lang: 'bilingual' },
  { subject: 'gk', subtopic: 'environment', labelEn: 'Environment', lang: 'bilingual' },
  { subject: 'aptitude', subtopic: 'series', labelEn: 'Number Series', lang: 'bilingual' },
  { subject: 'aptitude', subtopic: 'coding-decoding', labelEn: 'Coding-Decoding', lang: 'bilingual' },
  { subject: 'aptitude', subtopic: 'analogy', labelEn: 'Analogies', lang: 'bilingual' },
  { subject: 'aptitude', subtopic: 'direction-blood', labelEn: 'Direction & Blood Relations', lang: 'bilingual' },
  { subject: 'aptitude', subtopic: 'syllogism', labelEn: 'Syllogisms', lang: 'bilingual' },
  { subject: 'aptitude', subtopic: 'maths', labelEn: 'Arithmetic (%, Ratio, Time-Work)', lang: 'bilingual' },
  { subject: 'science', subtopic: 'physics', labelEn: 'Physics', lang: 'bilingual' },
  { subject: 'science', subtopic: 'chemistry', labelEn: 'Chemistry', lang: 'bilingual' },
  { subject: 'science', subtopic: 'biology', labelEn: 'Biology', lang: 'bilingual' },
  { subject: 'science', subtopic: 'tech', labelEn: 'Technology', lang: 'bilingual' },
  { subject: 'current_affairs', subtopic: 'mh-affairs', labelEn: 'Maharashtra Affairs', lang: 'bilingual', ca: true },
  { subject: 'current_affairs', subtopic: 'national', labelEn: 'National Affairs', lang: 'bilingual', ca: true },
  { subject: 'current_affairs', subtopic: 'sports-awards', labelEn: 'Sports & Awards', lang: 'bilingual', ca: true },
  { subject: 'current_affairs', subtopic: 'sci-tech-news', labelEn: 'Sci-Tech News', lang: 'bilingual', ca: true },
]

const TARGET = 12
const today = (args && args.today) || '2026-07-08'

function langInstruction(lang) {
  if (lang === 'english') return 'Write questions and options in English.'
  if (lang === 'marathi') return 'Write questions and options in Marathi (Devanagari script).'
  return 'Write bilingually: each question and its options give Marathi (Devanagari) followed by " / " and the English. Options prefixed "A. ", "B. ", "C. ", "D. ".'
}

const results = await pipeline(
  ITEMS,
  (it) => agent(
    `You are an expert MPSC (Maharashtra Public Service Commission) Group-C Combined Prelims question setter.\n` +
    (it.ca ? `First, use web search to gather accurate current-affairs facts as of ${today} (last ~12 months, Maharashtra + India). Base questions only on verified facts you found.\n` : '') +
    `Generate exactly ${TARGET} original multiple-choice questions for subject "${it.subject}", subtopic "${it.labelEn}". ` +
    `Match real MPSC prelims difficulty; Maharashtra-relevant where applicable. ` +
    `${langInstruction(it.lang)} ` +
    `Each question: exactly 4 options each prefixed "A. ", "B. ", "C. ", "D. "; exactly one correct answer letter; a one-sentence explanation. Mix easy/medium/hard. ` +
    `Only include facts you are confident are correct and unambiguous.`,
    { phase: 'Generate', label: `gen:${it.subject}/${it.subtopic}`, model: 'sonnet', schema: QUESTION_SCHEMA }
  ).then((r) => ({ it, questions: (r && r.questions) ? r.questions : [] })),

  (gen) => {
    if (!gen.questions.length) return { it: gen.it, kept: [] }
    return agent(
      `You are a strict MPSC exam answer-key checker. Below is a JSON array of ${gen.questions.length} MCQs for subtopic "${gen.it.labelEn}".\n` +
      `${gen.it.ca ? 'These are current-affairs items; use web search to confirm facts are accurate and current as of ' + today + '.\n' : ''}` +
      `For EACH question (by its 0-based index), decide keep=true only if: the marked answer is factually correct, the options are unambiguous with exactly one correct, the fact is in the MPSC Group-C prelims syllabus, and it is not outdated. ` +
      `If the intended answer is clearly a different letter, set fixedAnswer to that letter (else omit or ""). If in doubt, keep=false.\n\n` +
      `QUESTIONS:\n${JSON.stringify(gen.questions)}`,
      { phase: 'Verify', label: `verify:${gen.it.subject}/${gen.it.subtopic}`, model: 'sonnet', schema: VERIFY_SCHEMA }
    ).then((v) => {
      if (!v || !v.verdicts) return { it: gen.it, kept: gen.questions }
      const byIndex = new Map(v.verdicts.map((d) => [d.index, d]))
      const kept = []
      gen.questions.forEach((q, i) => {
        const d = byIndex.get(i)
        if (!d) { kept.push(q); return }
        if (!d.keep) return
        kept.push({ ...q, answer: (d.fixedAnswer && d.fixedAnswer !== '') ? d.fixedAnswer : q.answer })
      })
      return { it: gen.it, kept }
    })
  },

  (ver) => agent(
    `Write concise, exam-focused study notes in Markdown for MPSC Group-C prelims subtopic "${ver.it.labelEn}" (subject: ${ver.it.subject}).\n` +
    `Start with a single "# <Title>" heading (bilingual title: Marathi / English). Then 8-15 tight bullet points of the highest-yield facts/rules a candidate must memorize` +
    `${ver.it.ca ? ', current as of ' + today : ''}. ` +
    `${ver.it.lang === 'english' ? 'Write in English.' : ver.it.lang === 'marathi' ? 'Write in Marathi (Devanagari).' : 'Write bullets bilingually (Marathi with brief English).'} Keep it under 250 words.`,
    { phase: 'Notes', label: `notes:${ver.it.subject}/${ver.it.subtopic}`, model: 'haiku', schema: NOTES_SCHEMA }
  ).then((n) => ({
    subject: ver.it.subject,
    subtopic: ver.it.subtopic,
    ca: !!ver.it.ca,
    questions: ver.kept,
    markdown: (n && n.markdown) ? n.markdown : '',
  }))
)

const clean = results.filter(Boolean)
log(`Generated bank: ${clean.reduce((n, r) => n + r.questions.length, 0)} kept questions across ${clean.length} subtopics`)
return clean
