"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useChat } from "ai/react";
import { ALL_SUBJECTS, PRELIMS_SUBJECTS, MAINS_SUBJECTS, EXAM_PATTERN, getSubject } from "@/lib/syllabus";
import { getNotes } from "@/lib/notes";
import { useLangPref, pickLang, pickOption, pickLangMultiline, prefToLanguage } from "@/lib/langPref";
import { useMyNotes } from "@/lib/myNotes";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  answer: string;
  explanation: string;
}

type Tab = "overview" | "syllabus" | "chat" | "quiz" | "mock" | "notes" | "mynotes" | "strategy";

// ── Constants ──────────────────────────────────────────────────────────────────

const TOPICS = PRELIMS_SUBJECTS.map((s) => ({ id: s.key, label: s.label, labelEn: s.labelEn, icon: s.icon }));

const EXAM_DATES = [
  { date: "27 जून 2026", event: "अर्ज सुरुवात", eventEn: "Application Opens", done: true, color: "green" },
  { date: "17 जुलै 2026", event: "अर्ज अंतिम मुदत", eventEn: "Application Closes", done: false, color: "yellow" },
  { date: "20 जुलै 2026", event: "चलन भरणे अंतिम", eventEn: "Challan Last Date", done: false, color: "yellow" },
  { date: "27 सप्टेंबर 2026", event: "पूर्व परीक्षा", eventEn: "Prelims Exam", done: false, color: "blue" },
  { date: "TBD", event: "मुख्य परीक्षा", eventEn: "Mains Exam", done: false, color: "purple" },
];

// Countdown-driven prep phases (daysMin/daysMax = days-left window this phase is active).
const STUDY_PHASES = [
  {
    icon: "🏗️", daysMin: 36, daysMax: 9999,
    titleMr: "टप्पा 1 — पाया मजबूत करा", titleEn: "Phase 1 — Build the Foundation",
    rangeMr: "आत्ता → परीक्षेच्या ~5 आठवडे आधी", rangeEn: "Now → ~5 weeks before exam",
    tips: [
      { mr: "Notes टॅब वापरून प्रत्येक विषय क्रमाने संपूर्ण समजून घ्या (खालील साप्ताहिक नियोजन पाहा).", en: "Cover each subject in order using the Notes tab (see the weekly plan below)." },
      { mr: "दररोज अंकगणित + बुद्धिमत्ता + चालू घडामोडी यांचा सराव न चुकता करा.", en: "Practice Arithmetic + Reasoning + Current Affairs every single day without fail." },
      { mr: "प्रत्येक विषय झाल्यावर त्यावर Quiz सोडवा — संकल्पना पक्की करा.", en: "After each subject, take a Quiz on it to lock in the concepts." },
      { mr: "मागील 5 वर्षांच्या प्रश्नपत्रिका सोडवा, स्वतःची छोटी उजळणी-नोंद तयार करा.", en: "Solve last 5 years' papers and make your own short revision notes." },
    ],
  },
  {
    icon: "🎯", daysMin: 7, daysMax: 35,
    titleMr: "टप्पा 2 — सराव व मॉक टेस्ट", titleEn: "Phase 2 — Practice & Mock Tests",
    rangeMr: "परीक्षेच्या ~5 आठवडे → 1 आठवडा आधी", rangeEn: "~5 weeks → 1 week before exam",
    tips: [
      { mr: "आठवड्यातून 3–4 पूर्ण मॉक टेस्ट द्या (सराव परीक्षा टॅब) — वेळेचे व्यवस्थापन शिका.", en: "Give 3–4 full mock tests a week (Mock Test tab) — master time management." },
      { mr: "प्रत्येक मॉकनंतर चुका तपासा; कमकुवत विषयांवर (रणनीती → Weak Areas) जास्त लक्ष द्या.", en: "Analyze mistakes after every mock; focus on weak areas (Strategy → Weak Areas)." },
      { mr: "चालू घडामोडी: मागील 6–12 महिन्यांची पक्की उजळणी करा.", en: "Current Affairs: thoroughly revise the last 6–12 months." },
      { mr: "अचूकता व वेग दोन्ही वाढवा — negative marking (0.25) लक्षात ठेवून guessing टाळा.", en: "Build both accuracy and speed — mind the 0.25 negative marking, avoid blind guessing." },
    ],
  },
  {
    icon: "🔥", daysMin: 0, daysMax: 6,
    titleMr: "टप्पा 3 — अंतिम उजळणी", titleEn: "Phase 3 — Final Revision",
    rangeMr: "परीक्षेपूर्वीचा शेवटचा आठवडा", rangeEn: "Final week before exam",
    tips: [
      { mr: "नवीन विषय सुरू करू नका — फक्त Notes व सूत्रांची उजळणी करा.", en: "Start no new topics — only revise your Notes and formulas." },
      { mr: "रोज 1 हलका मॉक द्या, पण विश्रांतीला प्राधान्य द्या.", en: "One light mock a day, but prioritise rest." },
      { mr: "Admit card डाउनलोड करा व परीक्षा केंद्र आधी पाहून ठेवा.", en: "Download your admit card and scout the exam centre in advance." },
      { mr: "रात्री चांगली झोप घ्या — शांत व ताजे मन सर्वात महत्त्वाचे.", en: "Sleep well — a calm, fresh mind matters most on exam day." },
    ],
  },
];

// Ideal daily timetable — ~8 hours from 12 noon (Prelims focus). tab = app tab to jump to.
const DAILY_SCHEDULE: { timeMr: string; timeEn: string; actMr: string; actEn: string; dur: string; tab?: Tab }[] = [
  { timeMr: "दु. 12:00–1:30", timeEn: "12:00–1:30 PM", actMr: "आजचा मुख्य विषय (इतिहास/भूगोल/राज्यशास्त्र)", actEn: "Core subject of the day (History/Geography/Polity)", dur: "90 min", tab: "notes" },
  { timeMr: "दु. 1:30–2:00", timeEn: "1:30–2:00 PM", actMr: "जेवण व विश्रांती", actEn: "Lunch & rest", dur: "30 min" },
  { timeMr: "दु. 2:00–3:15", timeEn: "2:00–3:15 PM", actMr: "दुसरा विषय (विज्ञान/अर्थशास्त्र)", actEn: "Second subject (Science/Economy)", dur: "75 min", tab: "notes" },
  { timeMr: "दु. 3:15–3:30", timeEn: "3:15–3:30 PM", actMr: "विश्रांती", actEn: "Break", dur: "15 min" },
  { timeMr: "दु. 3:30–4:30", timeEn: "3:30–4:30 PM", actMr: "अंकगणित सराव", actEn: "Arithmetic practice", dur: "60 min", tab: "quiz" },
  { timeMr: "सं. 4:30–5:30", timeEn: "4:30–5:30 PM", actMr: "बुद्धिमत्ता (Reasoning) सराव", actEn: "Reasoning practice", dur: "60 min", tab: "quiz" },
  { timeMr: "सं. 5:30–6:00", timeEn: "5:30–6:00 PM", actMr: "चहा व विश्रांती", actEn: "Tea & break", dur: "30 min" },
  { timeMr: "सं. 6:00–7:00", timeEn: "6:00–7:00 PM", actMr: "चालू घडामोडी (रोज)", actEn: "Current Affairs (daily)", dur: "60 min", tab: "notes" },
  { timeMr: "रा. 7:00–8:00", timeEn: "7:00–8:00 PM", actMr: "आजच्या विषयांवर MCQ सराव", actEn: "MCQ practice on today's subjects", dur: "60 min", tab: "quiz" },
  { timeMr: "रा. 8:00–8:45", timeEn: "8:00–8:45 PM", actMr: "चुका तपासा + कमकुवत विषय", actEn: "Review mistakes + weak areas", dur: "45 min", tab: "strategy" },
  { timeMr: "रा. 8:45–9:00", timeEn: "8:45–9:00 PM", actMr: "उद्याचे नियोजन व झटपट उजळणी", actEn: "Plan tomorrow + quick revision", dur: "15 min" },
];

// Week-by-week foundation roadmap (Phase 1). Arithmetic, Reasoning & Current Affairs run DAILY throughout.
const WEEKLY_ROADMAP = [
  { wk: "1", mr: "इतिहास — प्राचीन/मध्ययुगीन + आधुनिक भारत", en: "History — Ancient/Medieval + Modern India" },
  { wk: "2", mr: "इतिहास — महाराष्ट्र समाजसुधारक + स्वातंत्र्योत्तर; भूगोल — महाराष्ट्र", en: "History — MH Reformers + Post-Independence; Geography — Maharashtra" },
  { wk: "3", mr: "भूगोल — भारत + जग; राज्यशास्त्र — राज्यघटना + हक्क", en: "Geography — India + World; Polity — Constitution + Rights" },
  { wk: "4", mr: "राज्यशास्त्र — केंद्र, राज्य, न्यायव्यवस्था, स्थानिक स्वराज्य", en: "Polity — Union, State, Judiciary, Local Govt" },
  { wk: "5", mr: "अर्थशास्त्र — सर्व उपविषय (राष्ट्रीय उत्पन्न, कृषी, उद्योग, बँकिंग, वित्त)", en: "Economy — all subtopics (national income, agriculture, industry, banking, finance)" },
  { wk: "6", mr: "सामान्य विज्ञान — भौतिक, रसायन, जीव, आरोग्य, विज्ञान-तंत्रज्ञान", en: "General Science — Physics, Chemistry, Biology, Health, Sci-Tech" },
  { wk: "7", mr: "चालू घडामोडींची उजळणी + बफर; पूर्ण मॉक टेस्ट सुरू करा", en: "Current Affairs consolidation + buffer; begin full mock tests" },
];

// ── Countdown Hook ─────────────────────────────────────────────────────────────

function useCountdown(targetDate: string) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    const update = () => {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) return;
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return timeLeft;
}

// ── Quiz Component ─────────────────────────────────────────────────────────────

function QuizSection() {
  const { pref } = useLangPref();
  const L = (mr: string, en: string) => (pref === "mr" ? mr : pref === "en" ? en : `${mr} / ${en}`);
  const [selectedTopic, setSelectedTopic] = useState("history");
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState("medium");
  const [language, setLanguage] = useState<string>(prefToLanguage(pref));
  // Keep the quiz language filter in sync with the global content-language toggle.
  useEffect(() => { setLanguage(prefToLanguage(pref)); }, [pref]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateQuiz = async () => {
    setLoading(true);
    setError("");
    setAnswers({});
    setSubmitted(false);
    try {
      const res = await fetch("/api/bank-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedTopic,
          subtopic: selectedSubtopic || undefined,
          difficulty,
          language,
          count: 5,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (!data.questions?.length) {
        setError(L("या विषयासाठी अजून प्रश्न उपलब्ध नाहीत. दुसरा विषय निवडा.", "No questions yet for this topic. Choose another subject."));
        setQuestions([]);
      } else {
        setQuestions(data.questions);
      }
    } catch {
      setError(L("Quiz निर्मिती अयशस्वी. पुन्हा प्रयत्न करा.", "Quiz generation failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const score = submitted
    ? questions.filter((q, i) => answers[i] === q.answer).length
    : 0;
  const pct = questions.length > 0 ? score / questions.length : 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-bg-card border border-gray-700/50 rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-gray-200 font-devanagari">{L("MCQ सराव निर्माण करा", "Generate MCQ Practice")}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-devanagari">{L("विषय निवडा", "Choose Subject")}</label>
            <select
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                setSelectedSubtopic("");
              }}
              className="w-full bg-bg-hover border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
            >
              {ALL_SUBJECTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.icon} {L(s.label, s.labelEn)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-devanagari">{L("उप-विषय", "Sub-topic")}</label>
            <select
              value={selectedSubtopic}
              onChange={(e) => setSelectedSubtopic(e.target.value)}
              className="w-full bg-bg-hover border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
            >
              <option value="">{L("सर्व", "All")}</option>
              {getSubject(selectedTopic)?.subtopics.map((t) => (
                <option key={t.key} value={t.key}>{L(t.label, t.labelEn)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full bg-bg-hover border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
            >
              <option value="easy">Easy — सोपे</option>
              <option value="medium">Medium — मध्यम</option>
              <option value="hard">Hard — कठीण</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-bg-hover border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
            >
              <option value="bilingual">मराठी + English (Mix)</option>
              <option value="marathi">मराठी Only</option>
              <option value="english">English Only</option>
            </select>
          </div>
        </div>

        <button
          onClick={generateQuiz}
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors font-devanagari"
        >
          {loading ? L("⏳ प्रश्न तयार होत आहेत...", "⏳ Generating questions...") : L("🎯 5 प्रश्न निर्माण करा", "🎯 Generate 5 Questions")}
        </button>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>

      {/* Questions */}
      {questions.length > 0 && (
        <div className="space-y-4">
          {submitted && (
            <div className={`rounded-xl p-4 text-center border ${pct >= 0.8 ? "bg-green-900/20 border-green-700/40 text-green-400" : pct >= 0.6 ? "bg-yellow-900/20 border-yellow-700/40 text-yellow-400" : "bg-red-900/20 border-red-700/40 text-red-400"}`}>
              <p className="text-2xl font-bold">{score}/{questions.length}</p>
              <p className="text-sm mt-1">
                {pct === 1
                  ? L("उत्कृष्ट! 🎉", "Excellent! 🎉 Perfect Score!")
                  : pct >= 0.8
                  ? L("छान! 👍", "Great! 👍 Keep it up!")
                  : pct >= 0.6
                  ? L("ठीक आहे — थोडा सराव करा", "Okay — practice a bit more")
                  : L("अजून सराव हवा — AI Tutor कडून मदत घ्या", "Needs more practice — get help from AI Tutor")}
              </p>
            </div>
          )}

          {questions.map((q, idx) => {
            const chosen = answers[idx];
            const correct = q.answer;
            const isCorrect = chosen === correct;

            return (
              <div key={idx} className="bg-bg-card border border-gray-700/50 rounded-xl p-5 space-y-3">
                <p className="text-gray-200 font-medium">
                  <span className="text-primary-400 mr-2">Q{idx + 1}.</span>
                  {pickLang(q.question, pref)}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt) => {
                    const letter = opt[0];
                    let cls = "text-left px-3 py-2 rounded-lg border text-sm transition-all ";
                    if (!submitted) {
                      cls += chosen === letter
                        ? "border-primary-500 bg-primary-600/20 text-primary-300"
                        : "border-gray-700/50 bg-bg-hover text-gray-300 hover:border-primary-500/50";
                    } else {
                      if (letter === correct) cls += "border-green-500 bg-green-900/20 text-green-300";
                      else if (letter === chosen && !isCorrect) cls += "border-red-500 bg-red-900/20 text-red-300";
                      else cls += "border-gray-700/30 bg-bg text-gray-500";
                    }
                    return (
                      <button
                        key={letter}
                        onClick={() => !submitted && setAnswers((a) => ({ ...a, [idx]: letter }))}
                        className={cls}
                      >
                        {pickOption(opt, pref)}
                      </button>
                    );
                  })}
                </div>
                {submitted && (
                  <div className={`text-xs p-3 rounded-lg ${isCorrect ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"}`}>
                    {isCorrect ? L("✓ बरोबर!", "✓ Correct!") : L(`✗ चुकले — उत्तर: ${correct}`, `✗ Wrong — Answer: ${correct}`)}
                    <span className="text-gray-400 ml-2">{pickLang(q.explanation, pref)}</span>
                  </div>
                )}
                {submitted && (
                  <button
                    onClick={async () => {
                      const reason = prompt(pickLang("काय चूक आहे? (उत्तर/अस्पष्ट/जुनी माहिती) / What's wrong?", pref)) || "";
                      if (!reason) return;
                      await fetch("/api/report", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ questionId: (q as unknown as { id: string }).id, reason }),
                      });
                      alert(pickLang("धन्यवाद! तक्रार नोंदवली. / Reported. Thanks!", pref));
                    }}
                    className="text-xs text-gray-500 hover:text-red-400 mt-1"
                  >🚩 {pickLang("चूक कळवा / Report", pref)}</button>
                )}
              </div>
            );
          })}

          {!submitted && Object.keys(answers).length > 0 && (
            <button
              onClick={() => {
                setSubmitted(true);
                const items = questions.map((q, i) => ({
                  subject: (q as unknown as { subject?: string }).subject ?? selectedTopic,
                  subtopic: (q as unknown as { subtopic?: string }).subtopic ?? (selectedSubtopic || "_mixed"),
                  correct: answers[i] === q.answer,
                }));
                fetch("/api/mpsc-progress", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ type: "quiz", items }),
                }).catch(() => {});
              }}
              className="w-full bg-green-700 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-colors font-devanagari"
            >
              {pickLang("उत्तरे तपासा / Check Answers", pref)}
            </button>
          )}
          {submitted && (
            <button
              onClick={() => { setQuestions([]); setAnswers({}); setSubmitted(false); }}
              className="w-full bg-bg-card border border-gray-700/50 hover:border-primary-500/50 text-gray-300 py-3 rounded-xl font-medium transition-colors"
            >
              {pickLang("नवीन Quiz / New Quiz", pref)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Weak Areas Component ───────────────────────────────────────────────────────

function WeakAreas() {
  const { pref } = useLangPref();
  const [weak, setWeak] = useState<{ subject: string; subtopic: string; attempts: number; correct: number }[]>([]);
  useEffect(() => {
    fetch("/api/mpsc-progress").then((r) => r.json()).then((d) => setWeak(d.weakest ?? [])).catch(() => {});
  }, []);
  if (weak.length === 0) return null;
  return (
    <div className="bg-bg-card border border-red-700/40 rounded-xl p-5 space-y-3">
      <h3 className="font-semibold text-red-300 font-devanagari">⚠️ {pickLang("कमकुवत विषय / Weak Areas", pref)}</h3>
      {weak.map((w) => {
        const pct = Math.round((w.correct / w.attempts) * 100);
        const subj = getSubject(w.subject);
        return (
          <div key={`${w.subject}/${w.subtopic}`} className="flex items-center justify-between text-sm">
            <span className="text-gray-300 font-devanagari">
              {subj?.icon} {subj?.labelEn}{w.subtopic.startsWith("_") ? "" : ` · ${w.subtopic}`}
            </span>
            <span className={pct < 40 ? "text-red-400" : "text-yellow-400"}>{pct}% ({w.attempts})</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Mock Test Component ──────────────────────────────────────────────────────

function MockSection() {
  const { pref } = useLangPref();
  const L = (mr: string, en: string) => (pref === "mr" ? mr : pref === "en" ? en : `${mr} / ${en}`);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(60 * 60); // 60 min
  const startedAt = useRef<number>(0);
  const persisted = useRef(false);

  useEffect(() => {
    if (!started || submitted) return;
    const id = setInterval(() => setRemaining((r) => (r <= 1 ? (clearInterval(id), setSubmitted(true), 0) : r - 1)), 1000);
    return () => clearInterval(id);
  }, [started, submitted]);

  const start = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mock?size=100");
      const data = await res.json();
      setQuestions(data.questions);
      setAnswers({}); setSubmitted(false); setRemaining(60 * 60);
      persisted.current = false;
      setStarted(true); startedAt.current = Date.now();
    } finally { setLoading(false); }
  };

  const submit = useCallback(() => {
    setSubmitted(true);
  }, []);

  // Persist the attempt exactly once whenever `submitted` flips to true, regardless of
  // whether that happened via the manual "जमा करा" button or the countdown timing out.
  useEffect(() => {
    if (!submitted || persisted.current) return;
    persisted.current = true;
    const bySubject: Record<string, { correct: number; total: number }> = {};
    let score = 0;
    questions.forEach((q, i) => {
      const subj = (q as unknown as { subject: string }).subject;
      const b = (bySubject[subj] ??= { correct: 0, total: 0 });
      b.total += 1;
      if (answers[i] === q.answer) { score += 1; b.correct += 1; }
    });
    fetch("/api/mpsc-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "mock",
        mock: { score, total: questions.length, durationSec: Math.round((Date.now() - startedAt.current) / 1000), bySubject },
      }),
    }).catch(() => {});
  }, [submitted, questions, answers]);

  if (!started) {
    return (
      <div className="bg-bg-card border border-gray-700/50 rounded-2xl p-6 text-center space-y-4">
        <p className="text-4xl">📝</p>
        <h3 className="font-semibold text-gray-200 font-devanagari">{L("पूर्ण लांबीची सराव परीक्षा", "Full-Length Mock Test")}</h3>
        <p className="text-sm text-gray-400 font-devanagari">{pickLang("100 प्रश्न · 60 मिनिटे · विषयनिहाय गुणभार / 100 Q · 60 min · real weightage", pref)}</p>
        <button onClick={start} disabled={loading}
          className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium font-devanagari">
          {loading ? L("तयार होत आहे...", "Preparing...") : pickLang("सुरू करा / Start Mock", pref)}
        </button>
      </div>
    );
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const score = submitted ? questions.filter((q, i) => answers[i] === q.answer).length : 0;

  return (
    <div className="space-y-4">
      <div className="sticky top-16 z-10 flex items-center justify-between bg-bg-card border border-gray-700/50 rounded-xl px-4 py-3">
        <span className="text-sm text-gray-400">{Object.keys(answers).length}/{questions.length} {L("उत्तरे दिली", "answered")}</span>
        {!submitted && <span className={`font-mono font-bold ${remaining < 300 ? "text-red-400" : "text-primary-300"}`}>⏱ {mm}:{ss}</span>}
        {!submitted && <button onClick={submit} className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-devanagari">{L("जमा करा", "Submit")}</button>}
      </div>

      {submitted && (
        <div className="bg-bg-card border border-primary-700/40 rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-primary-300">{score}/{questions.length}</p>
          <p className="text-sm text-gray-400 mt-1">{Math.round((score / questions.length) * 100)}%</p>
        </div>
      )}

      {questions.map((q, idx) => {
        const chosen = answers[idx];
        return (
          <div key={idx} className="bg-bg-card border border-gray-700/50 rounded-xl p-4 space-y-2">
            <p className="text-gray-200 text-sm font-medium"><span className="text-primary-400 mr-2">Q{idx + 1}.</span>{pickLang(q.question, pref)}</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {q.options.map((opt) => {
                const letter = opt[0];
                let cls = "text-left px-3 py-2 rounded-lg border text-sm ";
                if (!submitted) cls += chosen === letter ? "border-primary-500 bg-primary-600/20 text-primary-300" : "border-gray-700/50 bg-bg-hover text-gray-300";
                else if (letter === q.answer) cls += "border-green-500 bg-green-900/20 text-green-300";
                else if (letter === chosen) cls += "border-red-500 bg-red-900/20 text-red-300";
                else cls += "border-gray-700/30 bg-bg text-gray-500";
                return <button key={letter} disabled={submitted} onClick={() => setAnswers((a) => ({ ...a, [idx]: letter }))} className={cls}>{pickOption(opt, pref)}</button>;
              })}
            </div>
            {submitted && <p className="text-xs text-gray-400">{pickLang(q.explanation, pref)}</p>}
          </div>
        );
      })}

      {submitted && (
        <button onClick={() => { setStarted(false); setQuestions([]); }} className="w-full bg-bg-card border border-gray-700/50 text-gray-300 py-3 rounded-xl font-devanagari">{pickLang("नवीन सराव परीक्षा / New Mock", pref)}</button>
      )}
    </div>
  );
}

// ── Chat Component ─────────────────────────────────────────────────────────────

function ChatSection() {
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [inputValue, setInputValue] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, append, isLoading, setMessages } = useChat({
    api: "/api/mpsc-chat",
    body: { topic: selectedTopic },
    onFinish: (message) => {
      const noteMatch = message.content.match(/^NOTE_SAVE:\s*(.+)/im);
      if (noteMatch) {
        fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: `[MPSC] ${noteMatch[1].trim()}` }),
        }).catch(() => {});
      }
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!inputValue.trim() || isLoading) return;
    const text = inputValue.trim();
    setInputValue("");
    await append({ role: "user", content: text });
  };

  const quickPrompts = [
    { label: "महाराष्ट्र भूगोल explain करा", emoji: "🗺️" },
    { label: "Exam pattern व negative marking काय आहे?", emoji: "📋" },
    { label: "राज्यघटना चे मूलभूत हक्क सांगा", emoji: "⚖️" },
    { label: "5 reasoning tricks दे", emoji: "🧠" },
    { label: "Current affairs quiz घे", emoji: "📰" },
    { label: "उद्योग निरीक्षक व तांत्रिक सहायक पदांबद्दल सांगा", emoji: "💼" },
  ];

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Topic selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500">Topic focus:</span>
        <button
          onClick={() => setSelectedTopic("")}
          className={`px-3 py-1 rounded-full text-xs transition-colors ${!selectedTopic ? "bg-primary-600 text-white" : "bg-bg-hover text-gray-400 hover:text-gray-200"}`}
        >
          All Topics
        </button>
        {TOPICS.slice(0, 5).map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTopic(t.id)}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${selectedTopic === t.id ? "bg-primary-600 text-white" : "bg-bg-hover text-gray-400 hover:text-gray-200"}`}
          >
            {t.icon} {t.labelEn}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px] max-h-[420px] pr-1">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-center text-gray-500 text-sm py-4 font-devanagari">
              MPSC AI Tutor तयार आहे — कोणताही प्रश्न विचारा!
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickPrompts.map((p) => (
                <button
                  key={p.label}
                  onClick={() => append({ role: "user", content: p.label })}
                  className="text-left bg-bg-card border border-gray-700/50 hover:border-primary-500/50 rounded-xl p-3 text-xs text-gray-400 hover:text-gray-200 transition-all font-devanagari"
                >
                  <span className="mr-1">{p.emoji}</span> {p.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap font-devanagari ${
                  m.role === "user"
                    ? "bg-primary-600 text-white rounded-br-sm"
                    : "bg-bg-card border border-gray-700/50 text-gray-200 rounded-bl-sm"
                }`}
              >
                {m.content.replace(/^NOTE_SAVE:.*\n?/im, "").trim()}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-bg-card border border-gray-700/50 rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="प्रश्न विचारा... Ask anything about MPSC exam"
          className="flex-1 bg-bg-hover border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 font-devanagari"
        />
        <button
          onClick={send}
          disabled={!inputValue.trim() || isLoading}
          className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors"
        >
          पाठवा
        </button>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-gray-500 hover:text-gray-300 px-3 py-3 rounded-xl transition-colors text-xs"
            title="Clear chat"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// ── Notes Component ───────────────────────────────────────────────────────────

function NotesSection() {
  const { pref } = useLangPref();
  const [subject, setSubject] = useState<string>(ALL_SUBJECTS[0].key);
  const docs = getNotes().filter((n) => n.subject === subject);
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {ALL_SUBJECTS.map((s) => (
          <button key={s.key} onClick={() => setSubject(s.key)}
            className={`px-3 py-1 rounded-full text-xs ${subject === s.key ? "bg-primary-600 text-white" : "bg-bg-hover text-gray-400"}`}>
            {s.icon} {pref === "mr" ? s.label : pref === "en" ? s.labelEn : `${s.label} / ${s.labelEn}`}
          </button>
        ))}
      </div>
      {docs.length === 0 ? (
        <p className="text-center text-gray-500 py-10 font-devanagari">
          {pref === "mr" ? "या विषयासाठी नोट्स लवकरच येत आहेत." : pref === "en" ? "Notes for this subject are coming soon." : "या विषयासाठी नोट्स लवकरच येत आहेत. / Notes for this subject are coming soon."}
        </p>
      ) : docs.map((d) => (
        <div key={d.subtopic} className="bg-bg-card border border-gray-700/50 rounded-xl p-5">
          <pre className="whitespace-pre-wrap text-sm text-gray-300 font-devanagari">{pickLangMultiline(d.body, pref)}</pre>
        </div>
      ))}
    </div>
  );
}

// ── My Voice Notes Component ───────────────────────────────────────────────────

function MyNotesQuiz({ notes, disabled }: { notes: string; disabled: boolean }) {
  const { pref } = useLangPref();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateQuiz = async () => {
    setLoading(true);
    setError("");
    setAnswers({});
    setSubmitted(false);
    setQuestions([]);
    try {
      const res = await fetch("/api/notes-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, count: 5 }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 503) {
          setError(pickLang("AI क्विझसाठी Vercel मध्ये GROQ_API_KEY सेट करा / Set GROQ_API_KEY in Vercel to enable quiz-from-notes.", pref));
        } else {
          setError(data.error || pickLang("Quiz निर्मिती अयशस्वी. पुन्हा प्रयत्न करा. / Quiz generation failed. Please try again.", pref));
        }
        return;
      }
      setQuestions(data.questions ?? []);
    } catch {
      setError(pickLang("Quiz निर्मिती अयशस्वी. पुन्हा प्रयत्न करा. / Quiz generation failed. Please try again.", pref));
    } finally {
      setLoading(false);
    }
  };

  const score = submitted ? questions.filter((q, i) => answers[i] === q.answer).length : 0;

  return (
    <div className="space-y-4">
      <button
        onClick={generateQuiz}
        disabled={loading || disabled}
        className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors font-devanagari"
      >
        {loading
          ? pickLang("⏳ प्रश्न तयार होत आहेत... / Generating questions...", pref)
          : pickLang("🎯 माझ्या नोट्सवर Quiz घ्या / Quiz me on my notes", pref)}
      </button>
      {error && <p className="text-red-400 text-sm text-center font-devanagari">{error}</p>}

      {questions.length > 0 && (
        <div className="space-y-4">
          {submitted && (
            <div className="rounded-xl p-4 text-center border border-primary-700/40 bg-primary-900/10 text-primary-300">
              <p className="text-2xl font-bold">{score}/{questions.length}</p>
            </div>
          )}
          {questions.map((q, idx) => {
            const chosen = answers[idx];
            const correct = q.answer;
            const isCorrect = chosen === correct;
            return (
              <div key={idx} className="bg-bg-card border border-gray-700/50 rounded-xl p-5 space-y-3">
                <p className="text-gray-200 font-medium">
                  <span className="text-primary-400 mr-2">Q{idx + 1}.</span>
                  {pickLang(q.question, pref)}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt) => {
                    const letter = opt[0];
                    let cls = "text-left px-3 py-2 rounded-lg border text-sm transition-all ";
                    if (!submitted) {
                      cls += chosen === letter
                        ? "border-primary-500 bg-primary-600/20 text-primary-300"
                        : "border-gray-700/50 bg-bg-hover text-gray-300 hover:border-primary-500/50";
                    } else {
                      if (letter === correct) cls += "border-green-500 bg-green-900/20 text-green-300";
                      else if (letter === chosen && !isCorrect) cls += "border-red-500 bg-red-900/20 text-red-300";
                      else cls += "border-gray-700/30 bg-bg text-gray-500";
                    }
                    return (
                      <button
                        key={letter}
                        onClick={() => !submitted && setAnswers((a) => ({ ...a, [idx]: letter }))}
                        className={cls}
                      >
                        {pickOption(opt, pref)}
                      </button>
                    );
                  })}
                </div>
                {submitted && (
                  <div className={`text-xs p-3 rounded-lg ${isCorrect ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"}`}>
                    {isCorrect ? pickLang("✓ बरोबर! / Correct!", pref) : pickLang(`✗ चुकले — उत्तर: ${correct} / Wrong — Answer: ${correct}`, pref)}
                    <span className="text-gray-400 ml-2">{pickLang(q.explanation, pref)}</span>
                  </div>
                )}
              </div>
            );
          })}

          {!submitted && Object.keys(answers).length > 0 && (
            <button
              onClick={() => setSubmitted(true)}
              className="w-full bg-green-700 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-colors font-devanagari"
            >
              {pickLang("उत्तरे तपासा / Check Answers", pref)}
            </button>
          )}
          {submitted && (
            <button
              onClick={() => { setQuestions([]); setAnswers({}); setSubmitted(false); }}
              className="w-full bg-bg-card border border-gray-700/50 hover:border-primary-500/50 text-gray-300 py-3 rounded-xl font-medium transition-colors"
            >
              {pickLang("नवीन Quiz / New Quiz", pref)}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MyNotesSection() {
  const { pref } = useLangPref();
  const L = (mr: string, en: string) => (pref === "mr" ? mr : pref === "en" ? en : `${mr} / ${en}`);
  const { notes, add, remove } = useMyNotes();
  const [draft, setDraft] = useState("");

  const { isListening, supported, error, start, stop, setLanguage, language } = useSpeechRecognition(
    (final) => setDraft((d) => (d ? d + " " : "") + final)
  );

  // Default the mic to English on first mount, per the task's default language.
  useEffect(() => {
    setLanguage("en-IN");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const combinedNotesText = notes.map((n) => n.text).join("\n\n");

  return (
    <div className="space-y-6">
      {/* Dictation card */}
      <div className="bg-bg-card border border-gray-700/50 rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-gray-200 font-devanagari">{L("नवीन नोट बोला", "Dictate a New Note")}</h3>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{L("भाषा", "Mic language")}:</span>
          <button
            onClick={() => setLanguage("en-IN")}
            className={`px-3 py-1 rounded-full text-xs transition-colors ${language === "en-IN" ? "bg-primary-600 text-white" : "bg-bg-hover text-gray-400 hover:text-gray-200"}`}
          >
            ENG
          </button>
          <button
            onClick={() => setLanguage("mr-IN")}
            className={`px-3 py-1 rounded-full text-xs transition-colors font-devanagari ${language === "mr-IN" ? "bg-primary-600 text-white" : "bg-bg-hover text-gray-400 hover:text-gray-200"}`}
          >
            मराठी
          </button>
        </div>

        {!supported && (
          <p className="text-xs text-yellow-400 font-devanagari">
            {L("आवाजासाठी Chrome किंवा Edge आवश्यक; तुम्ही खाली टाइप करू शकता.", "Voice needs Chrome or Edge; you can type your note below.")}
          </p>
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          onClick={() => (isListening ? stop() : start())}
          disabled={!supported}
          className={`w-full py-3 rounded-xl font-medium transition-colors font-devanagari flex items-center justify-center gap-2 disabled:opacity-50 ${
            isListening ? "bg-red-700 hover:bg-red-600 text-white" : "bg-primary-600 hover:bg-primary-500 text-white"
          }`}
        >
          {isListening && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
          {isListening ? L("⏹ थांबा", "⏹ Stop") : L("🎤 बोला", "🎤 Speak")}
        </button>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={L("तुमची नोट येथे बोला किंवा टाइप करा", "Speak or type your note here")}
          rows={5}
          className="w-full bg-bg-hover border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 font-devanagari resize-y"
        />

        <button
          onClick={() => { add(draft.trim()); setDraft(""); }}
          disabled={!draft.trim()}
          className="w-full bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white py-3 rounded-xl font-medium transition-colors font-devanagari"
        >
          {L("💾 जतन करा", "💾 Save note")}
        </button>
      </div>

      {/* Saved notes list */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-200 font-devanagari">{L("माझ्या नोट्स", "My Notes")}</h3>
        {notes.length === 0 ? (
          <p className="text-center text-gray-500 py-8 font-devanagari">
            {L("अजून कोणतीही नोट नाही — वर बोला किंवा टाइप करा!", "No notes yet — speak or type one above!")}
          </p>
        ) : (
          notes.map((note) => (
            <div key={note.id} className="bg-bg-card border border-gray-700/50 rounded-xl p-4 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 whitespace-pre-wrap font-devanagari">{note.text}</p>
                <p className="text-[10px] text-gray-500 mt-1">{new Date(note.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => remove(note.id)}
                className="text-gray-500 hover:text-red-400 transition-colors shrink-0"
                title={L("हटवा", "Delete")}
              >
                🗑
              </button>
            </div>
          ))
        )}
      </div>

      {/* Quiz-from-notes */}
      <div className="bg-bg-card border border-gray-700/50 rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-gray-200 font-devanagari">{L("माझ्या नोट्सवर Quiz", "Quiz on My Notes")}</h3>
        <MyNotesQuiz notes={combinedNotesText} disabled={notes.length === 0} />
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function TechnicalSahayakPage() {
  const { pref } = useLangPref();
  // Renders a Marathi/English pair according to the global toggle: mr-only, en-only, or "mr / en".
  const L = (mr: string, en: string) => (pref === "mr" ? mr : pref === "en" ? en : `${mr} / ${en}`);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const countdown = useCountdown("2026-09-27T09:00:00+05:30");
  const appDeadline = useCountdown("2026-07-17T23:59:00+05:30");

  const TABS: { id: Tab; label: string; labelEn: string; icon: string }[] = [
    { id: "overview", label: "विहंगावलोकन", labelEn: "Overview", icon: "📋" },
    { id: "syllabus", label: "अभ्यासक्रम", labelEn: "Syllabus", icon: "📚" },
    { id: "chat", label: "AI Tutor", labelEn: "AI Tutor", icon: "🤖" },
    { id: "quiz", label: "MCQ सराव", labelEn: "Quiz", icon: "❓" },
    { id: "mock", label: "सराव परीक्षा", labelEn: "Mock Test", icon: "📝" },
    { id: "notes", label: "अभ्यास नोट्स", labelEn: "Study Notes", icon: "📚" },
    { id: "mynotes", label: "माझ्या नोट्स", labelEn: "My Notes", icon: "🎤" },
    { id: "strategy", label: "रणनीती", labelEn: "Strategy", icon: "🎯" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-primary-900/40 via-bg-card to-purple-900/30 border border-primary-700/30 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl">⚙️</span>
              <div>
                <h1 className="text-xl font-bold text-white font-devanagari">
                  {L("उद्योग निरीक्षक व तांत्रिक सहायक", "Industry Inspector & Technical Assistant")}
                </h1>
                <p className="text-primary-400 text-sm">{L("MPSC Group-C 2026", "MPSC Group-C 2026")}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="bg-primary-600/20 border border-primary-500/30 text-primary-300 text-xs px-3 py-1 rounded-full font-devanagari">
                {L("उद्योग निरीक्षक", "Industry Inspector")} | ₹34,400–1,12,400
              </span>
              <span className="bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs px-3 py-1 rounded-full font-devanagari">
                {L("तांत्रिक सहायक (विमा संचालनालय)", "Technical Assistant (Insurance Directorate)")} | ₹29,200–92,300
              </span>
              <span className="bg-green-600/20 border border-green-500/30 text-green-300 text-xs px-3 py-1 rounded-full font-devanagari">
                {L("2,619 Group-C पदे", "2,619 Group-C Vacancies")}
              </span>
            </div>
          </div>

          {/* Countdown to Prelims */}
          <div className="bg-bg/60 border border-gray-700/50 rounded-xl p-4 text-center min-w-[200px]">
            <p className="text-xs text-gray-500 mb-2 font-devanagari">{L("पूर्व परीक्षेसाठी उरलेले दिवस", "Days left for Prelims")}</p>
            <div className="flex gap-2 justify-center">
              {[
                { n: countdown.days, l: L("दिवस", "Days") },
                { n: countdown.hours, l: L("तास", "Hrs") },
                { n: countdown.minutes, l: L("मिनिटे", "Min") },
                { n: countdown.seconds, l: L("सेकंद", "Sec") },
              ].map((c) => (
                <div key={c.l} className="bg-primary-600/20 rounded-lg p-2 min-w-[42px]">
                  <p className="text-lg font-bold text-primary-300">{String(c.n).padStart(2, "0")}</p>
                  <p className="text-[9px] text-gray-500 font-devanagari">{c.l}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-yellow-400 mt-2 font-devanagari">
              📅 {L("27 सप्टेंबर 2026", "27 September 2026")}
            </p>
          </div>
        </div>

        {/* Application deadline alert */}
        {appDeadline.days >= 0 && appDeadline.days <= 30 && (
          <div className="mt-4 bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-3 flex items-center gap-2">
            <span className="text-yellow-400">⚠️</span>
            <p className="text-yellow-300 text-sm font-devanagari">
              {L(
                `अर्ज मुदत: ${appDeadline.days} दिवस उरले — 17 जुलै 2026 पर्यंत अर्ज करा!`,
                `Application deadline: ${appDeadline.days} days left — apply by 17 July 2026!`
              )}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-card border border-gray-700/50 rounded-xl p-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 min-w-[80px] px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeTab === t.id
                ? "bg-primary-600 text-white"
                : "text-gray-400 hover:text-gray-200 hover:bg-bg-hover"
            }`}
          >
            <span className="mr-1">{t.icon}</span>
            <span className="font-devanagari">{L(t.label, t.labelEn)}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {/* Post Details */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-bg-card border border-gray-700/50 rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-gray-200 flex items-center gap-2">
                <span>📄</span>
                <span className="font-devanagari">{L("पद तपशील", "Post Details")}</span>
              </h2>
              {[
                { k: "पद १ / Post 1", v: "उद्योग निरीक्षक / Industry Inspector" },
                { k: "वेतन १ / Pay 1", v: "₹34,400 – ₹1,12,400" },
                { k: "पद २ / Post 2", v: "तांत्रिक सहायक, विमा संचालनालय / Technical Assistant, Insurance Directorate" },
                { k: "वेतन २ / Pay 2", v: "₹29,200 – ₹92,300" },
                { k: "विभाग / Dept", v: "वित्त विभाग / Finance Department" },
                { k: "एकूण Group-C पदे / Total Group-C Vacancies", v: "2,619" },
                { k: "परीक्षा शुल्क / Exam Fee", v: "₹394 (General) | ₹294 (Reserved)" },
              ].map(({ k, v }) => (
                <div key={k} className="flex justify-between items-start gap-2 py-1.5 border-b border-gray-700/30 last:border-0">
                  <span className="text-xs text-gray-500 font-devanagari shrink-0">{pickLang(k, pref)}</span>
                  <span className="text-sm text-gray-200 text-right font-devanagari">{pickLang(v, pref)}</span>
                </div>
              ))}
            </div>

            <div className="bg-bg-card border border-gray-700/50 rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-gray-200 flex items-center gap-2">
                <span>🎓</span>
                <span className="font-devanagari">{L("पात्रता", "Eligibility")}</span>
              </h2>
              {[
                { k: "किमान वय / Min Age", v: "19 वर्षे (01 Oct 2026) / 19 years (as of 01 Oct 2026)" },
                { k: "कमाल वय (General) / Max Age (General)", v: "38 वर्षे / 38 years" },
                { k: "कमाल वय (Reserved) / Max Age (Reserved)", v: "43 वर्षे (OBC/SC/ST) / 43 years (OBC/SC/ST)" },
                { k: "कमाल वय (PH/दिव्यांग) / Max Age (PH)", v: "45 वर्षे / 45 years" },
                { k: "शैक्षणिक अर्हता / Qualification", v: "Diploma-level (पदानुसार) / Diploma-level (per post)" },
                { k: "मराठी भाषा / Marathi Language", v: "अनिवार्य / Mandatory" },
              ].map(({ k, v }) => (
                <div key={k} className="flex justify-between items-start gap-2 py-1.5 border-b border-gray-700/30 last:border-0">
                  <span className="text-xs text-gray-500 font-devanagari shrink-0">{pickLang(k, pref)}</span>
                  <span className="text-sm text-gray-200 text-right font-devanagari">{pickLang(v, pref)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Exam Pattern */}
          <div className="bg-bg-card border border-gray-700/50 rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-gray-200 flex items-center gap-2">
              <span>🏆</span>
              <span className="font-devanagari">{L("परीक्षेचे स्वरूप", "Exam Pattern")}</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: "संयुक्त पूर्व परीक्षा",
                  titleEn: "Combined Prelims",
                  color: "primary",
                  details: [
                    { mr: `${EXAM_PATTERN.prelims.mode} (संगणकाधारित चाचणी)`, en: `${EXAM_PATTERN.prelims.mode} (Computer Based Test)` },
                    { mr: `प्रश्न: ${EXAM_PATTERN.prelims.questions} · एकूण गुण: ${EXAM_PATTERN.prelims.marks}`, en: `Questions: ${EXAM_PATTERN.prelims.questions} · Total Marks: ${EXAM_PATTERN.prelims.marks}` },
                    { mr: `कालावधी: ${EXAM_PATTERN.prelims.durationMin} मिनिटे`, en: `Duration: ${EXAM_PATTERN.prelims.durationMin} minutes` },
                    { mr: `प्रत्येक चुकीच्या उत्तरास ${EXAM_PATTERN.prelims.negativeMarking} गुण वजा`, en: `${EXAM_PATTERN.prelims.negativeMarking} negative marking per wrong answer` },
                    { mr: "तारीख: 27 सप्टेंबर 2026", en: "Date: 27 September 2026" },
                    { mr: "गुण केवळ पात्रतेसाठी (शॉर्टलिस्टिंग) — अंतिम गुणवत्तेत मोजले जात नाहीत", en: "Marks for shortlisting only — not counted in final merit" },
                    { mr: "सर्व Group-C पदांसाठी एकच परीक्षा", en: "One common exam for all Group-C posts" },
                  ],
                },
                {
                  title: "संयुक्त मुख्य परीक्षा",
                  titleEn: "Combined Mains",
                  color: "purple",
                  details: [
                    { mr: `${EXAM_PATTERN.mains.papers} Papers × ${EXAM_PATTERN.mains.marksPerPaper} गुण (Paper 1: भाषा — सर्व पदांसाठी समान, Paper 2: पदनिहाय)`, en: `${EXAM_PATTERN.mains.papers} Papers × ${EXAM_PATTERN.mains.marksPerPaper} marks (Paper 1: Language — common, Paper 2: post-specific)` },
                    { mr: `प्रत्येक Paper: ${EXAM_PATTERN.mains.durationMinPerPaper} मिनिटे · MCQ प्रत्येकी ${EXAM_PATTERN.mains.marksPerQuestion} गुण`, en: `Each Paper: ${EXAM_PATTERN.mains.durationMinPerPaper} minutes · ${EXAM_PATTERN.mains.marksPerQuestion} marks per MCQ` },
                    { mr: `प्रत्येक चुकीच्या उत्तरास ${EXAM_PATTERN.mains.negativeMarking} गुण वजा`, en: `${EXAM_PATTERN.mains.negativeMarking} negative marking per wrong answer` },
                    { mr: "Prelims qualify केल्यानंतरच", en: "Only after qualifying Prelims" },
                    { mr: "तारीख: TBD (नंतर जाहीर होईल)", en: "Date: TBD (announced later)" },
                  ],
                },
              ].map((exam) => (
                <div
                  key={exam.title}
                  className={`border rounded-xl p-4 space-y-3 ${
                    exam.color === "primary"
                      ? "border-primary-700/40 bg-primary-900/10"
                      : "border-purple-700/40 bg-purple-900/10"
                  }`}
                >
                  <div>
                    <p className={`font-semibold font-devanagari ${exam.color === "primary" ? "text-primary-300" : "text-purple-300"}`}>
                      {L(exam.title, exam.titleEn)}
                    </p>
                  </div>
                  <ul className="space-y-1.5">
                    {exam.details.map((d) => (
                      <li key={d.mr} className="text-sm text-gray-300 flex items-start gap-2 font-devanagari">
                        <span className={`mt-0.5 shrink-0 ${exam.color === "primary" ? "text-primary-400" : "text-purple-400"}`}>•</span>
                        {L(d.mr, d.en)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Important Dates */}
          <div className="bg-bg-card border border-gray-700/50 rounded-xl p-5 space-y-3">
            <h2 className="font-semibold text-gray-200 flex items-center gap-2">
              <span>📅</span>
              <span className="font-devanagari">{L("महत्त्वाच्या तारखा", "Important Dates")}</span>
            </h2>
            <div className="space-y-2">
              {EXAM_DATES.map((d, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-700/30 last:border-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    d.color === "green" ? "bg-green-400" :
                    d.color === "yellow" ? "bg-yellow-400" :
                    d.color === "blue" ? "bg-blue-400" : "bg-purple-400"
                  }`} />
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-300 font-devanagari">{L(d.event, d.eventEn)}</span>
                    <span className="text-xs text-gray-500 font-devanagari shrink-0">{d.date}</span>
                  </div>
                  {d.done && <span className="text-xs text-green-400 font-devanagari">{L("✓ सुरू", "✓ Started")}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Syllabus ────────────────────────────────────────────────── */}
      {activeTab === "syllabus" && (
        <div className="space-y-4">
          <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-4 text-sm text-yellow-300 font-devanagari">
            ⚡ {L(
              `पूर्व परीक्षा: ${EXAM_PATTERN.prelims.questions} प्रश्न · ${EXAM_PATTERN.prelims.marks} गुण · ${EXAM_PATTERN.prelims.durationMin} मिनिटे — सर्व Group-C पदांसाठी एकत्रित परीक्षा (CBT), प्रत्येक चुकीच्या उत्तरास ${EXAM_PATTERN.prelims.negativeMarking} गुण वजा`,
              `Prelims: ${EXAM_PATTERN.prelims.questions} Questions, ${EXAM_PATTERN.prelims.marks} Marks, ${EXAM_PATTERN.prelims.durationMin} min — Combined CBT for all Group-C posts, ${EXAM_PATTERN.prelims.negativeMarking} negative marking`
            )}
          </div>

          <h2 className="font-semibold text-gray-200 font-devanagari">{L(`पूर्व परीक्षा अभ्यासक्रम (8 विषय)`, "Prelims Syllabus (8 subjects)")}</h2>
          {PRELIMS_SUBJECTS.map((sub) => (
            <div key={sub.key} className="bg-bg-card border border-gray-700/50 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 bg-bg-hover border-b border-gray-700/40">
                <span className="text-2xl">{sub.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-200 font-devanagari">{L(sub.label, sub.labelEn)}</p>
                </div>
                <span className="bg-primary-600/20 border border-primary-500/30 text-primary-300 text-xs px-3 py-1 rounded-full">
                  ~{sub.marks} marks
                </span>
              </div>
              <div className="px-5 py-4">
                <ul className="grid sm:grid-cols-2 gap-2">
                  {sub.subtopics.map((t) => (
                    <li key={t.key} className="flex items-start gap-2 text-sm text-gray-400 font-devanagari">
                      <span className="text-primary-400 mt-0.5 shrink-0">→</span>
                      {L(t.label, t.labelEn)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          {/* Mains */}
          <h2 className="font-semibold text-gray-200 font-devanagari pt-2">{L("मुख्य परीक्षा अभ्यासक्रम", "Mains Syllabus")}</h2>
          <div className="bg-purple-900/20 border border-purple-700/40 rounded-xl p-4 text-sm text-purple-300 font-devanagari">
            {L(
              `प्रत्येक Paper: ${EXAM_PATTERN.mains.marksPerPaper} गुण · ${EXAM_PATTERN.mains.durationMinPerPaper} मिनिटे · MCQ प्रत्येकी ${EXAM_PATTERN.mains.marksPerQuestion} गुण · ${EXAM_PATTERN.mains.negativeMarking} negative marking`,
              `Each Paper: ${EXAM_PATTERN.mains.marksPerPaper} marks · ${EXAM_PATTERN.mains.durationMinPerPaper} minutes · ${EXAM_PATTERN.mains.marksPerQuestion} marks per MCQ · ${EXAM_PATTERN.mains.negativeMarking} negative marking`
            )}
          </div>

          <div>
            <h3 className="font-semibold text-purple-300 font-devanagari mb-2">{L("Paper 1 — भाषा (सर्व पदांसाठी समान)", "Paper 1 — Language (common)")}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {MAINS_SUBJECTS.filter((s) => s.paper === 1).map((sub) => (
                <div key={sub.key} className="bg-bg-card border border-gray-700/50 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-bg-hover border-b border-gray-700/40">
                    <span className="text-xl">{sub.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-200 font-devanagari">{L(sub.label, sub.labelEn)}</p>
                    </div>
                    <span className="bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs px-2 py-1 rounded-full">
                      {sub.marks} marks
                    </span>
                  </div>
                  <ul className="px-4 py-3 space-y-1.5">
                    {sub.subtopics.map((t) => (
                      <li key={t.key} className="flex items-start gap-2 text-xs text-gray-400 font-devanagari">
                        <span className="text-purple-400 mt-0.5 shrink-0">→</span>
                        {L(t.label, t.labelEn)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {(["industry-inspector", "technical-assistant"] as const).map((post) => (
            <div key={post}>
              <h3 className="font-semibold text-purple-300 font-devanagari mb-2 mt-3">
                {L(
                  `Paper 2 — ${post === "industry-inspector" ? "उद्योग निरीक्षक" : "तांत्रिक सहायक"}`,
                  `Paper 2 — ${post === "industry-inspector" ? "Industry Inspector" : "Technical Assistant"}`
                )}
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {MAINS_SUBJECTS.filter((s) => s.paper === 2 && s.post === post).map((sub) => (
                  <div key={sub.key} className="bg-bg-card border border-gray-700/50 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-bg-hover border-b border-gray-700/40">
                      <span className="text-xl">{sub.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-gray-200 font-devanagari">{L(sub.label, sub.labelEn)}</p>
                      </div>
                      <span className="bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs px-2 py-1 rounded-full">
                        {sub.marks} marks
                      </span>
                    </div>
                    <ul className="px-4 py-3 space-y-1.5">
                      {sub.subtopics.map((t) => (
                        <li key={t.key} className="flex items-start gap-2 text-xs text-gray-400 font-devanagari">
                          <span className="text-purple-400 mt-0.5 shrink-0">→</span>
                          {L(t.label, t.labelEn)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: AI Chat ─────────────────────────────────────────────────── */}
      {activeTab === "chat" && (
        <div className="bg-bg-card border border-gray-700/50 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🤖</span>
            <div>
              <h2 className="font-semibold text-gray-200 font-devanagari">MPSC AI Tutor</h2>
              <p className="text-xs text-gray-500">तांत्रिक सहायक परीक्षेसाठी तज्ज्ञ मार्गदर्शक</p>
            </div>
          </div>
          <ChatSection />
        </div>
      )}

      {/* ── Tab: Quiz ────────────────────────────────────────────────────── */}
      {activeTab === "quiz" && <QuizSection />}

      {/* ── Tab: Mock Test ───────────────────────────────────────────────── */}
      {activeTab === "mock" && <MockSection />}

      {/* ── Tab: Notes ───────────────────────────────────────────────────── */}
      {activeTab === "notes" && <NotesSection />}

      {/* ── Tab: My Voice Notes ──────────────────────────────────────────── */}
      {activeTab === "mynotes" && <MyNotesSection />}

      {/* ── Tab: Strategy ────────────────────────────────────────────────── */}
      {activeTab === "strategy" && (
        <div className="space-y-4">
          <WeakAreas />

          {/* Key stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: "📅", label: "परीक्षा तारीख", labelEn: "Exam Date", value: "27 Sep 2026" },
              { icon: "⏳", label: "उरलेले दिवस", labelEn: "Days Left", value: `${countdown.days}` },
              { icon: "⏰", label: "रोजचे लक्ष्य", labelEn: "Daily Target", value: "~8 hrs" },
              { icon: "🏆", label: "पूर्व परीक्षा", labelEn: "Prelims", value: "100 marks" },
            ].map((s) => (
              <div key={s.label} className="bg-bg-card border border-gray-700/50 rounded-xl p-4 text-center">
                <span className="text-2xl">{s.icon}</span>
                <p className="text-lg font-bold text-primary-300 mt-1">{s.value}</p>
                <p className="text-xs text-gray-500 font-devanagari">{L(s.label, s.labelEn)}</p>
              </div>
            ))}
          </div>

          {/* Prep phases — the current one is highlighted based on days left */}
          <h3 className="font-semibold text-gray-200 font-devanagari flex items-center gap-2">
            <span>🗺️</span> {L("परीक्षेपर्यंतची रणनीती", "Roadmap to the Exam")}
          </h3>
          {STUDY_PHASES.map((p) => {
            const active = countdown.days >= p.daysMin && countdown.days <= p.daysMax;
            return (
              <div key={p.titleEn} className={`rounded-xl overflow-hidden border ${active ? "border-primary-500 bg-primary-900/10" : "border-gray-700/50 bg-bg-card"}`}>
                <div className="flex items-center gap-3 px-5 py-4 bg-bg-hover border-b border-gray-700/40">
                  <span className="text-2xl">{p.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-200 font-devanagari">{L(p.titleMr, p.titleEn)}</p>
                    <p className="text-xs text-gray-500 font-devanagari">{L(p.rangeMr, p.rangeEn)}</p>
                  </div>
                  {active && <span className="bg-primary-600 text-white text-xs px-3 py-1 rounded-full font-devanagari shrink-0">{L("तुम्ही येथे", "You are here")}</span>}
                </div>
                <ul className="px-5 py-4 space-y-2.5">
                  {p.tips.map((tip) => (
                    <li key={tip.en} className="flex items-start gap-2 text-sm text-gray-300 font-devanagari">
                      <span className="text-primary-400 mt-0.5 shrink-0">✓</span>
                      {L(tip.mr, tip.en)}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* Weekly foundation roadmap */}
          <div className="bg-bg-card border border-gray-700/50 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-gray-200 flex items-center gap-2">
              <span>📆</span>
              <span className="font-devanagari">{L("साप्ताहिक विषय-नियोजन (पाया टप्पा)", "Weekly Subject Plan (Foundation)")}</span>
            </h3>
            <p className="text-xs text-gray-500 font-devanagari">{L("अंकगणित, बुद्धिमत्ता व चालू घडामोडी — हे रोज सुरू ठेवा.", "Arithmetic, Reasoning & Current Affairs — keep these going daily.")}</p>
            <div className="space-y-2">
              {WEEKLY_ROADMAP.map((w) => (
                <div key={w.wk} className="flex items-start gap-3 py-2 border-b border-gray-700/30 last:border-0">
                  <span className="bg-primary-600/20 text-primary-300 text-xs font-semibold rounded-lg px-2.5 py-1 shrink-0 font-devanagari">{L(`आठवडा ${w.wk}`, `Week ${w.wk}`)}</span>
                  <span className="text-sm text-gray-300 font-devanagari">{L(w.mr, w.en)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Daily timetable — tap a row to jump to that tool */}
          <div className="bg-bg-card border border-gray-700/50 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-gray-200 flex items-center gap-2">
              <span>⏰</span>
              <span className="font-devanagari">{L("रोजचे वेळापत्रक (दुपारी 12 पासून · ~8 तास)", "Daily Timetable (from 12 noon · ~8 hrs)")}</span>
            </h3>
            <div className="space-y-1">
              {DAILY_SCHEDULE.map((s) => (
                <button
                  key={s.timeEn}
                  onClick={() => s.tab && setActiveTab(s.tab)}
                  disabled={!s.tab}
                  className={`w-full flex items-center justify-between gap-2 py-2 px-2 rounded-lg border-b border-gray-700/30 last:border-0 text-left transition-colors ${s.tab ? "hover:bg-bg-hover cursor-pointer" : "cursor-default"}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-primary-400 font-semibold w-24 shrink-0 font-devanagari">{L(s.timeMr, s.timeEn)}</span>
                    <span className="text-sm text-gray-300 font-devanagari truncate">{L(s.actMr, s.actEn)}{s.tab ? " ↗" : ""}</span>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{s.dur}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick action */}
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab("quiz")}
              className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-xl font-medium transition-colors font-devanagari"
            >
              🎯 {L("MCQ सराव सुरू करा", "Start MCQ Practice")}
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className="flex-1 bg-bg-card border border-gray-700/50 hover:border-primary-500/50 text-gray-300 py-3 rounded-xl font-medium transition-colors font-devanagari"
            >
              🤖 {L("AI Tutor विचारा", "Ask AI Tutor")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
