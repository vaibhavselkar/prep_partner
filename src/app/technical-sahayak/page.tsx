"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useChat } from "ai/react";
import { SYLLABUS, getSubject } from "@/lib/syllabus";
import { getNotes } from "@/lib/notes";

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  answer: string;
  explanation: string;
}

type Tab = "overview" | "syllabus" | "chat" | "quiz" | "mock" | "notes" | "strategy";

// ── Constants ──────────────────────────────────────────────────────────────────

const TOPICS = [
  { id: "maharashtra_gk", label: "महाराष्ट्र GK", labelEn: "Maharashtra GK", icon: "🗺️" },
  { id: "marathi", label: "मराठी भाषा", labelEn: "Marathi Language", icon: "📖" },
  { id: "english", label: "English", labelEn: "English", icon: "🔤" },
  { id: "aptitude", label: "बौद्धिक क्षमता", labelEn: "Aptitude", icon: "🧠" },
  { id: "maths", label: "गणित", labelEn: "Mathematics", icon: "🔢" },
  { id: "science", label: "विज्ञान", labelEn: "Science", icon: "🔬" },
  { id: "india_gk", label: "भारत GK", labelEn: "India GK", icon: "🇮🇳" },
  { id: "constitution", label: "राज्यघटना", labelEn: "Constitution", icon: "⚖️" },
  { id: "reasoning", label: "तर्कशक्ती", labelEn: "Reasoning", icon: "🔍" },
  { id: "current_affairs", label: "चालू घडामोडी", labelEn: "Current Affairs", icon: "📰" },
];

const SYLLABUS_PRELIMS = [
  {
    subject: "मराठी भाषा",
    subjectEn: "Marathi Language",
    icon: "📖",
    marks: "~20",
    topics: [
      "संधी (Sandhi) व समास (Samas)",
      "म्हणी व वाक्यप्रचार",
      "विरुद्धार्थी व समानार्थी शब्द",
      "शब्दसंपदा व वाक्यरचना",
      "उतारा आकलन (Reading Comprehension)",
      "व्याकरण — काळ, वचन, लिंग",
    ],
  },
  {
    subject: "English",
    subjectEn: "English Language",
    icon: "🔤",
    marks: "~15",
    topics: [
      "Grammar — Tenses, Articles, Prepositions",
      "Vocabulary — Synonyms, Antonyms",
      "Reading Comprehension",
      "Sentence Correction & Rearrangement",
      "Idioms & Phrases",
    ],
  },
  {
    subject: "सामान्य ज्ञान",
    subjectEn: "General Knowledge",
    icon: "🌐",
    marks: "~30",
    topics: [
      "महाराष्ट्राचा इतिहास (History of Maharashtra)",
      "महाराष्ट्राचा भूगोल (Geography of Maharashtra)",
      "भारताचा इतिहास व भूगोल",
      "भारतीय राज्यघटना (Indian Constitution)",
      "विज्ञान व तंत्रज्ञान (Science & Technology)",
      "पर्यावरण (Environment)",
      "महाराष्ट्र व भारत अर्थव्यवस्था",
    ],
  },
  {
    subject: "बौद्धिक क्षमता",
    subjectEn: "Mental Ability & Aptitude",
    icon: "🧠",
    marks: "~25",
    topics: [
      "संख्यामालिका (Number Series)",
      "कोडिंग-डिकोडिंग (Coding-Decoding)",
      "साधर्म्य (Analogies)",
      "दिशा चाचणी (Direction Test)",
      "रक्तसंबंध (Blood Relations)",
      "न्यायनिगमन (Syllogisms)",
      "गणितीय तर्क (Mathematical Reasoning)",
    ],
  },
  {
    subject: "चालू घडामोडी",
    subjectEn: "Current Affairs",
    icon: "📰",
    marks: "~10",
    topics: [
      "महाराष्ट्र शासन घडामोडी",
      "राष्ट्रीय घडामोडी",
      "क्रीडा व पुरस्कार",
      "विज्ञान व तंत्रज्ञान घडामोडी",
    ],
  },
];

const EXAM_DATES = [
  { date: "27 जून 2026", event: "अर्ज सुरुवात", eventEn: "Application Opens", done: true, color: "green" },
  { date: "17 जुलै 2026", event: "अर्ज अंतिम मुदत", eventEn: "Application Closes", done: false, color: "yellow" },
  { date: "20 जुलै 2026", event: "चलन भरणे अंतिम", eventEn: "Challan Last Date", done: false, color: "yellow" },
  { date: "27 सप्टेंबर 2026", event: "पूर्व परीक्षा", eventEn: "Prelims Exam", done: false, color: "blue" },
  { date: "TBD", event: "मुख्य परीक्षा", eventEn: "Mains Exam", done: false, color: "purple" },
];

const STRATEGY_TIPS = [
  {
    phase: "Phase 1 (आत्ता – ऑगस्ट)",
    phaseEn: "Now – August",
    icon: "🏗️",
    tips: [
      "महाराष्ट्र भूगोल: जिल्हे, नद्या, पर्वत, खनिजे पाठ करा",
      "मराठी व्याकरण पुस्तक वाचा — संधी, समास नीट समजून घ्या",
      "दररोज 30 मिनिटे Mental Ability चा सराव करा",
      "MPSC च्या मागील 5 वर्षांचे प्रश्नपत्रिका सोडवा",
    ],
  },
  {
    phase: "Phase 2 (सप्टेंबर)",
    phaseEn: "September",
    icon: "🎯",
    tips: [
      "Mock Test दररोज द्या — वेळेचे व्यवस्थापन शिका",
      "Weak subjects वर जास्त लक्ष द्या",
      "चालू घडामोडी: मागील 6 महिन्यांचा आढावा घ्या",
      "Answer key analysis करा — चुका का झाल्या ते समजा",
    ],
  },
  {
    phase: "Phase 3 (परीक्षेपूर्वी 1 आठवडा)",
    phaseEn: "1 Week Before Exam",
    icon: "🔥",
    tips: [
      "नवीन विषय सुरू करू नका — revision करा",
      "Admit card डाउनलोड करून ठेवा",
      "परीक्षा केंद्र आधीच पाहून ठेवा",
      "रात्री चांगली झोप घ्या — fresh mind महत्त्वाचे",
    ],
  },
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
  const [selectedTopic, setSelectedTopic] = useState("gk");
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("");
  const [difficulty, setDifficulty] = useState("medium");
  const [language, setLanguage] = useState("bilingual");
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
        setError("या विषयासाठी अजून प्रश्न उपलब्ध नाहीत. दुसरा विषय निवडा. / No questions yet for this topic.");
        setQuestions([]);
      } else {
        setQuestions(data.questions);
      }
    } catch {
      setError("Quiz निर्मिती अयशस्वी. पुन्हा प्रयत्न करा.");
    } finally {
      setLoading(false);
    }
  };

  const score = submitted
    ? questions.filter((q, i) => answers[i] === q.answer).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-bg-card border border-gray-700/50 rounded-2xl p-5 space-y-4">
        <h3 className="font-semibold text-gray-200 font-devanagari">MCQ सराव निर्माण करा</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-devanagari">विषय निवडा</label>
            <select
              value={selectedTopic}
              onChange={(e) => {
                setSelectedTopic(e.target.value);
                setSelectedSubtopic("");
              }}
              className="w-full bg-bg-hover border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
            >
              {SYLLABUS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.icon} {s.label} / {s.labelEn}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-gray-500 font-devanagari">उप-विषय / Sub-topic</label>
            <select
              value={selectedSubtopic}
              onChange={(e) => setSelectedSubtopic(e.target.value)}
              className="w-full bg-bg-hover border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
            >
              <option value="">All / सर्व</option>
              {getSubject(selectedTopic)?.subtopics.map((t) => (
                <option key={t.key} value={t.key}>{t.label} / {t.labelEn}</option>
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
          {loading ? "⏳ प्रश्न तयार होत आहेत..." : "🎯 5 प्रश्न निर्माण करा"}
        </button>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
      </div>

      {/* Questions */}
      {questions.length > 0 && (
        <div className="space-y-4">
          {submitted && (
            <div className={`rounded-xl p-4 text-center border ${score >= 4 ? "bg-green-900/20 border-green-700/40 text-green-400" : score >= 3 ? "bg-yellow-900/20 border-yellow-700/40 text-yellow-400" : "bg-red-900/20 border-red-700/40 text-red-400"}`}>
              <p className="text-2xl font-bold">{score}/5</p>
              <p className="text-sm mt-1">
                {score === 5 ? "उत्कृष्ट! 🎉 Perfect Score!" : score >= 4 ? "छान! 👍 Keep it up!" : score >= 3 ? "ठीक आहे — थोडा सराव करा" : "अजून सराव हवा — AI Tutor कडून मदत घ्या"}
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
                  {q.question}
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
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {submitted && (
                  <div className={`text-xs p-3 rounded-lg ${isCorrect ? "bg-green-900/20 text-green-400" : "bg-red-900/20 text-red-400"}`}>
                    {isCorrect ? "✓ बरोबर!" : `✗ चुकले — उत्तर: ${correct}`}
                    <span className="text-gray-400 ml-2">{q.explanation}</span>
                  </div>
                )}
                {submitted && (
                  <button
                    onClick={async () => {
                      const reason = prompt("काय चूक आहे? (उत्तर/अस्पष्ट/जुनी माहिती) / What's wrong?") || "";
                      if (!reason) return;
                      await fetch("/api/report", {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ questionId: (q as unknown as { id: string }).id, reason }),
                      });
                      alert("धन्यवाद! तक्रार नोंदवली. / Reported. Thanks!");
                    }}
                    className="text-xs text-gray-500 hover:text-red-400 mt-1"
                  >🚩 चूक कळवा / Report</button>
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
              उत्तरे तपासा / Check Answers
            </button>
          )}
          {submitted && (
            <button
              onClick={() => { setQuestions([]); setAnswers({}); setSubmitted(false); }}
              className="w-full bg-bg-card border border-gray-700/50 hover:border-primary-500/50 text-gray-300 py-3 rounded-xl font-medium transition-colors"
            >
              नवीन Quiz / New Quiz
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Weak Areas Component ───────────────────────────────────────────────────────

function WeakAreas() {
  const [weak, setWeak] = useState<{ subject: string; subtopic: string; attempts: number; correct: number }[]>([]);
  useEffect(() => {
    fetch("/api/mpsc-progress").then((r) => r.json()).then((d) => setWeak(d.weakest ?? [])).catch(() => {});
  }, []);
  if (weak.length === 0) return null;
  return (
    <div className="bg-bg-card border border-red-700/40 rounded-xl p-5 space-y-3">
      <h3 className="font-semibold text-red-300 font-devanagari">⚠️ कमकुवत विषय / Weak Areas</h3>
      {weak.map((w) => {
        const pct = Math.round((w.correct / w.attempts) * 100);
        const subj = getSubject(w.subject);
        return (
          <div key={`${w.subject}/${w.subtopic}`} className="flex items-center justify-between text-sm">
            <span className="text-gray-300 font-devanagari">{subj?.icon} {subj?.labelEn} · {w.subtopic}</span>
            <span className={pct < 40 ? "text-red-400" : "text-yellow-400"}>{pct}% ({w.attempts})</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Mock Test Component ──────────────────────────────────────────────────────

function MockSection() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(60 * 60); // 60 min
  const startedAt = useRef<number>(0);

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
      setStarted(true); startedAt.current = Date.now();
    } finally { setLoading(false); }
  };

  const submit = useCallback(() => {
    setSubmitted(true);
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
  }, [questions, answers]);

  if (!started) {
    return (
      <div className="bg-bg-card border border-gray-700/50 rounded-2xl p-6 text-center space-y-4">
        <p className="text-4xl">📝</p>
        <h3 className="font-semibold text-gray-200 font-devanagari">पूर्ण लांबीची सराव परीक्षा</h3>
        <p className="text-sm text-gray-400 font-devanagari">100 प्रश्न · 60 मिनिटे · विषयनिहाय गुणभार / 100 Q · 60 min · real weightage</p>
        <button onClick={start} disabled={loading}
          className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium font-devanagari">
          {loading ? "तयार होत आहे..." : "सुरू करा / Start Mock"}
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
        <span className="text-sm text-gray-400">{Object.keys(answers).length}/{questions.length} answered</span>
        {!submitted && <span className={`font-mono font-bold ${remaining < 300 ? "text-red-400" : "text-primary-300"}`}>⏱ {mm}:{ss}</span>}
        {!submitted && <button onClick={submit} className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-devanagari">जमा करा</button>}
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
            <p className="text-gray-200 text-sm font-medium"><span className="text-primary-400 mr-2">Q{idx + 1}.</span>{q.question}</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {q.options.map((opt) => {
                const letter = opt[0];
                let cls = "text-left px-3 py-2 rounded-lg border text-sm ";
                if (!submitted) cls += chosen === letter ? "border-primary-500 bg-primary-600/20 text-primary-300" : "border-gray-700/50 bg-bg-hover text-gray-300";
                else if (letter === q.answer) cls += "border-green-500 bg-green-900/20 text-green-300";
                else if (letter === chosen) cls += "border-red-500 bg-red-900/20 text-red-300";
                else cls += "border-gray-700/30 bg-bg text-gray-500";
                return <button key={letter} disabled={submitted} onClick={() => setAnswers((a) => ({ ...a, [idx]: letter }))} className={cls}>{opt}</button>;
              })}
            </div>
            {submitted && <p className="text-xs text-gray-400">{q.explanation}</p>}
          </div>
        );
      })}

      {submitted && (
        <button onClick={() => { setStarted(false); setQuestions([]); }} className="w-full bg-bg-card border border-gray-700/50 text-gray-300 py-3 rounded-xl font-devanagari">नवीन सराव परीक्षा / New Mock</button>
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
    { label: "Exam pattern काय आहे?", emoji: "📋" },
    { label: "संधी चे प्रकार सांगा", emoji: "📖" },
    { label: "5 reasoning tricks दे", emoji: "🧠" },
    { label: "Current affairs quiz घे", emoji: "📰" },
    { label: "Technical Sahayak पदाबद्दल सांगा", emoji: "💼" },
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
  const [subject, setSubject] = useState<string>(SYLLABUS[0].key);
  const docs = getNotes().filter((n) => n.subject === subject);
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {SYLLABUS.map((s) => (
          <button key={s.key} onClick={() => setSubject(s.key)}
            className={`px-3 py-1 rounded-full text-xs ${subject === s.key ? "bg-primary-600 text-white" : "bg-bg-hover text-gray-400"}`}>
            {s.icon} {s.labelEn}
          </button>
        ))}
      </div>
      {docs.length === 0 ? (
        <p className="text-center text-gray-500 py-10 font-devanagari">या विषयासाठी नोट्स लवकरच येत आहेत.</p>
      ) : docs.map((d) => (
        <div key={d.subtopic} className="bg-bg-card border border-gray-700/50 rounded-xl p-5">
          <pre className="whitespace-pre-wrap text-sm text-gray-300 font-devanagari">{d.body}</pre>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function TechnicalSahayakPage() {
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
                <h1 className="text-xl font-bold text-white font-devanagari">तांत्रिक सहायक</h1>
                <p className="text-primary-400 text-sm">Technical Sahayak — MPSC Group-C 2026</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="bg-primary-600/20 border border-primary-500/30 text-primary-300 text-xs px-3 py-1 rounded-full font-devanagari">
                वित्त विभाग | Finance Dept
              </span>
              <span className="bg-purple-600/20 border border-purple-500/30 text-purple-300 text-xs px-3 py-1 rounded-full">
                3 Vacancies
              </span>
              <span className="bg-green-600/20 border border-green-500/30 text-green-300 text-xs px-3 py-1 rounded-full">
                S-10 | ₹29,200-92,300
              </span>
            </div>
          </div>

          {/* Countdown to Prelims */}
          <div className="bg-bg/60 border border-gray-700/50 rounded-xl p-4 text-center min-w-[200px]">
            <p className="text-xs text-gray-500 mb-2 font-devanagari">पूर्व परीक्षेसाठी उरलेले दिवस</p>
            <div className="flex gap-2 justify-center">
              {[
                { n: countdown.days, l: "Days" },
                { n: countdown.hours, l: "Hrs" },
                { n: countdown.minutes, l: "Min" },
                { n: countdown.seconds, l: "Sec" },
              ].map((c) => (
                <div key={c.l} className="bg-primary-600/20 rounded-lg p-2 min-w-[42px]">
                  <p className="text-lg font-bold text-primary-300">{String(c.n).padStart(2, "0")}</p>
                  <p className="text-[9px] text-gray-500">{c.l}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-yellow-400 mt-2 font-devanagari">
              📅 27 सप्टेंबर 2026
            </p>
          </div>
        </div>

        {/* Application deadline alert */}
        {appDeadline.days >= 0 && appDeadline.days <= 30 && (
          <div className="mt-4 bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-3 flex items-center gap-2">
            <span className="text-yellow-400">⚠️</span>
            <p className="text-yellow-300 text-sm font-devanagari">
              अर्ज मुदत: {appDeadline.days} दिवस उरले — 17 जुलै 2026 पर्यंत अर्ज करा!
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
            <span className="font-devanagari">{t.label}</span>
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
                <span className="font-devanagari">पद तपशील</span>
                <span className="text-gray-500 text-sm">/ Post Details</span>
              </h2>
              {[
                { k: "पद / Post", v: "तांत्रिक सहायक (Technical Sahayak)" },
                { k: "विभाग / Dept", v: "वित्त विभाग, विमा संचालनालय" },
                { k: "एकूण पदे / Vacancies", v: "3 पदे" },
                { k: "वेतन / Pay", v: "S-10: ₹29,200 – ₹92,300 + DA" },
                { k: "परीक्षा शुल्क", v: "₹394 (General) | ₹294 (Reserved)" },
              ].map(({ k, v }) => (
                <div key={k} className="flex justify-between items-start gap-2 py-1.5 border-b border-gray-700/30 last:border-0">
                  <span className="text-xs text-gray-500 font-devanagari shrink-0">{k}</span>
                  <span className="text-sm text-gray-200 text-right font-devanagari">{v}</span>
                </div>
              ))}
            </div>

            <div className="bg-bg-card border border-gray-700/50 rounded-xl p-5 space-y-3">
              <h2 className="font-semibold text-gray-200 flex items-center gap-2">
                <span>🎓</span>
                <span className="font-devanagari">पात्रता</span>
                <span className="text-gray-500 text-sm">/ Eligibility</span>
              </h2>
              {[
                { k: "किमान वय / Min Age", v: "19 वर्षे (01 Oct 2026)" },
                { k: "कमाल वय (General)", v: "38 वर्षे" },
                { k: "कमाल वय (Reserved)", v: "43 वर्षे (OBC/SC/ST)" },
                { k: "कमाल वय (PH/दिव्यांग)", v: "45 वर्षे" },
                { k: "शैक्षणिक अर्हता", v: "Diploma / B.E. / B.Tech (Mechanical / Electrical / Related)" },
                { k: "मराठी भाषा", v: "माहिती असणे आवश्यक" },
              ].map(({ k, v }) => (
                <div key={k} className="flex justify-between items-start gap-2 py-1.5 border-b border-gray-700/30 last:border-0">
                  <span className="text-xs text-gray-500 font-devanagari shrink-0">{k}</span>
                  <span className="text-sm text-gray-200 text-right font-devanagari">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Exam Pattern */}
          <div className="bg-bg-card border border-gray-700/50 rounded-xl p-5 space-y-4">
            <h2 className="font-semibold text-gray-200 flex items-center gap-2">
              <span>🏆</span>
              <span className="font-devanagari">परीक्षेचे स्वरूप</span>
              <span className="text-gray-500 text-sm">/ Exam Pattern</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  title: "संयुक्त पूर्व परीक्षा",
                  titleEn: "Combined Prelims",
                  color: "primary",
                  details: [
                    "CBT (Computer Based Test)",
                    "एकूण गुण: 100",
                    "तारीख: 27 सप्टेंबर 2026",
                    "सर्व Group-C पदांसाठी एकच परीक्षा",
                    "Negative marking नाही",
                  ],
                },
                {
                  title: "संयुक्त मुख्य परीक्षा",
                  titleEn: "Combined Mains",
                  color: "purple",
                  details: [
                    "एकूण गुण: 400",
                    "Papers: मराठी+English, GS, Aptitude, Technical",
                    "प्रत्येक Paper: 100 गुण",
                    "Prelims qualify केल्यानंतरच",
                    "तारीख: TBD (announced later)",
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
                      {exam.title}
                    </p>
                    <p className="text-xs text-gray-500">{exam.titleEn}</p>
                  </div>
                  <ul className="space-y-1.5">
                    {exam.details.map((d) => (
                      <li key={d} className="text-sm text-gray-300 flex items-start gap-2 font-devanagari">
                        <span className={`mt-0.5 shrink-0 ${exam.color === "primary" ? "text-primary-400" : "text-purple-400"}`}>•</span>
                        {d}
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
              <span className="font-devanagari">महत्त्वाच्या तारखा</span>
              <span className="text-gray-500 text-sm">/ Important Dates</span>
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
                    <span className="text-sm text-gray-300 font-devanagari">{d.event}</span>
                    <span className="text-xs text-gray-500 font-devanagari shrink-0">{d.date}</span>
                  </div>
                  {d.done && <span className="text-xs text-green-400">✓ सुरू</span>}
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
            ⚡ पूर्व परीक्षा: 100 गुण — सर्व Group-C पदांसाठी एकत्रित परीक्षा (CBT) | Prelims: 100 Marks — Combined CBT for all Group-C posts
          </div>
          {SYLLABUS_PRELIMS.map((sub) => (
            <div key={sub.subject} className="bg-bg-card border border-gray-700/50 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 bg-bg-hover border-b border-gray-700/40">
                <span className="text-2xl">{sub.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-200 font-devanagari">{sub.subject}</p>
                  <p className="text-xs text-gray-500">{sub.subjectEn}</p>
                </div>
                <span className="bg-primary-600/20 border border-primary-500/30 text-primary-300 text-xs px-3 py-1 rounded-full">
                  ~{sub.marks} marks
                </span>
              </div>
              <div className="px-5 py-4">
                <ul className="grid sm:grid-cols-2 gap-2">
                  {sub.topics.map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm text-gray-400 font-devanagari">
                      <span className="text-primary-400 mt-0.5 shrink-0">→</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          {/* Mains note */}
          <div className="bg-purple-900/20 border border-purple-700/40 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-purple-300 font-devanagari">मुख्य परीक्षा (Mains) — 400 गुण</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { paper: "Paper 1", topic: "मराठी व English भाषा", marks: "100" },
                { paper: "Paper 2", topic: "सामान्य अध्ययन (General Studies)", marks: "100" },
                { paper: "Paper 3", topic: "बौद्धिक क्षमता व अभियोग्यता", marks: "100" },
                { paper: "Paper 4", topic: "तांत्रिक/विषय ज्ञान (Technical)", marks: "100" },
              ].map((p) => (
                <div key={p.paper} className="flex items-center justify-between bg-bg/60 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-xs text-purple-400 font-semibold">{p.paper}</p>
                    <p className="text-sm text-gray-300 font-devanagari">{p.topic}</p>
                  </div>
                  <span className="text-purple-300 font-bold">{p.marks}</span>
                </div>
              ))}
            </div>
          </div>
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

      {/* ── Tab: Strategy ────────────────────────────────────────────────── */}
      {activeTab === "strategy" && (
        <div className="space-y-4">
          <WeakAreas />

          {/* Key stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: "📅", label: "परीक्षा तारीख", value: "27 Sep 2026" },
              { icon: "⏳", label: "उरलेला वेळ", value: `${countdown.days} days` },
              { icon: "📖", label: "विषय", value: "5 Subjects" },
              { icon: "🏆", label: "एकूण गुण", value: "500 (Pre+Main)" },
            ].map((s) => (
              <div key={s.label} className="bg-bg-card border border-gray-700/50 rounded-xl p-4 text-center">
                <span className="text-2xl">{s.icon}</span>
                <p className="text-lg font-bold text-primary-300 mt-1">{s.value}</p>
                <p className="text-xs text-gray-500 font-devanagari">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Strategy phases */}
          {STRATEGY_TIPS.map((phase) => (
            <div key={phase.phase} className="bg-bg-card border border-gray-700/50 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 bg-bg-hover border-b border-gray-700/40">
                <span className="text-2xl">{phase.icon}</span>
                <div>
                  <p className="font-semibold text-gray-200 font-devanagari">{phase.phase}</p>
                  <p className="text-xs text-gray-500">{phase.phaseEn}</p>
                </div>
              </div>
              <ul className="px-5 py-4 space-y-2.5">
                {phase.tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-sm text-gray-300 font-devanagari">
                    <span className="text-primary-400 mt-0.5 shrink-0">✓</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Daily schedule */}
          <div className="bg-bg-card border border-gray-700/50 rounded-xl p-5 space-y-3">
            <h3 className="font-semibold text-gray-200 flex items-center gap-2">
              <span>⏰</span>
              <span className="font-devanagari">आदर्श दैनंदिन वेळापत्रक</span>
              <span className="text-gray-500 text-sm">/ Daily Study Plan</span>
            </h3>
            <div className="space-y-2">
              {[
                { time: "सकाळी 6-7", activity: "मराठी व्याकरण / English", duration: "60 min" },
                { time: "सकाळी 8-10", activity: "महाराष्ट्र GK (History/Geography)", duration: "120 min" },
                { time: "दुपारी 2-3", activity: "Mental Ability / Reasoning", duration: "60 min" },
                { time: "संध्याकाळी 5-6", activity: "Mathematics Practice", duration: "60 min" },
                { time: "रात्री 7-8", activity: "Current Affairs Review", duration: "60 min" },
                { time: "रात्री 8-9", activity: "MCQ Practice (यावर AI Quiz वापरा)", duration: "60 min" },
              ].map((s) => (
                <div key={s.time} className="flex items-center justify-between py-2 border-b border-gray-700/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-primary-400 font-semibold w-24 shrink-0 font-devanagari">{s.time}</span>
                    <span className="text-sm text-gray-300 font-devanagari">{s.activity}</span>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{s.duration}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick action */}
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab("quiz")}
              className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-xl font-medium transition-colors font-devanagari"
            >
              🎯 MCQ सराव सुरू करा
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className="flex-1 bg-bg-card border border-gray-700/50 hover:border-primary-500/50 text-gray-300 py-3 rounded-xl font-medium transition-colors font-devanagari"
            >
              🤖 AI Tutor विचारा
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
