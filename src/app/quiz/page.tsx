"use client";

import { useState, useEffect, useCallback } from "react";
import { QuizQuestion } from "@/components/QuizQuestion";
import type { QuizQuestion as QuizQuestionType } from "@/types";

interface PDFItem {
  id: string;
  filename: string;
}

type QuizLanguage = "english" | "marathi" | "both";

export default function QuizPage() {
  const [pdfs, setPdfs] = useState<PDFItem[]>([]);
  const [selectedPdfId, setSelectedPdfId] = useState("");
  const [count, setCount] = useState<5 | 10>(5);
  const [language, setLanguage] = useState<QuizLanguage>("english");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [questions, setQuestions] = useState<QuizQuestionType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizDone, setQuizDone] = useState(false);
  const [pdfName, setPdfName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPDFs = useCallback(async () => {
    const res = await fetch("/api/upload");
    const data = await res.json();
    if (Array.isArray(data)) {
      setPdfs(data);
      if (data.length > 0) setSelectedPdfId(data[0].id);
    }
  }, []);

  useEffect(() => { fetchPDFs(); }, [fetchPDFs]);

  const startQuiz = async () => {
    if (!selectedPdfId) return;
    setError("");
    setLoading(true);
    setAnswers({});
    setCurrentIndex(0);
    setQuizDone(false);

    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfId: selectedPdfId, count, language }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate quiz.");
      } else {
        setQuestions(data.questions);
        setPdfName(data.pdfName);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer: string) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: answer }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setQuizDone(true);
      saveResult();
    }
  };

  const score = Object.entries(answers).filter(
    ([i, a]) => questions[parseInt(i)]?.answer === a
  ).length;

  const saveResult = async () => {
    setSaving(true);
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pdfId: selectedPdfId,
        type: "quiz",
        score,
        total: questions.length,
        language,
        pdfName,
      }),
    }).catch(() => {});
    setSaving(false);
  };

  const resetQuiz = () => {
    setQuestions([]);
    setAnswers({});
    setCurrentIndex(0);
    setQuizDone(false);
  };

  // Quiz config screen
  if (questions.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">
            <span className="font-devanagari text-primary-400">प्रश्नमंजुषा</span>
            <span className="text-gray-300"> / Quiz</span>
          </h1>
          <p className="text-gray-500 text-sm">Test your knowledge from your uploaded notes</p>
        </div>

        <div className="bg-bg-card border border-gray-700/50 rounded-2xl p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm text-gray-400 font-devanagari">
              PDF निवडा / Select Notes
            </label>
            <select
              className="w-full bg-bg-hover border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
              value={selectedPdfId}
              onChange={(e) => setSelectedPdfId(e.target.value)}
            >
              {pdfs.length === 0 && <option value="">No PDFs uploaded</option>}
              {pdfs.map((p) => (
                <option key={p.id} value={p.id}>{p.filename}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400 font-devanagari">
              प्रश्नांची संख्या / Number of Questions
            </label>
            <div className="flex gap-3">
              {([5, 10] as const).map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                    count === n
                      ? "bg-primary-600/20 border-primary-500 text-primary-400"
                      : "bg-bg-hover border-gray-700/50 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {n} प्रश्न / Questions
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400 font-devanagari">
              भाषा / Language
            </label>
            <div className="flex gap-3">
              {(["english", "marathi", "both"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`flex-1 py-3 rounded-xl border text-xs font-medium transition-all font-devanagari ${
                    language === l
                      ? "bg-primary-600/20 border-primary-500 text-primary-400"
                      : "bg-bg-hover border-gray-700/50 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {l === "english" ? "English" : l === "marathi" ? "मराठी" : "दोन्ही / Both"}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-900/20 border border-red-700/40 rounded-lg p-3">
              {error}
            </p>
          )}

          <button
            onClick={startQuiz}
            disabled={loading || !selectedPdfId}
            className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white py-3.5 rounded-xl font-medium transition-colors font-devanagari text-base"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                प्रश्न तयार होत आहेत... / Generating...
              </span>
            ) : (
              "प्रश्नमंजुषा सुरू करा / Start Quiz"
            )}
          </button>
        </div>
      </div>
    );
  }

  // Score card
  if (quizDone) {
    const percent = Math.round((score / questions.length) * 100);
    const emoji = percent >= 80 ? "🎉" : percent >= 60 ? "👍" : "📚";
    return (
      <div className="max-w-lg mx-auto px-4 py-12 space-y-8">
        <div className="bg-bg-card border border-gray-700/50 rounded-2xl p-8 text-center space-y-6">
          <div className="text-6xl">{emoji}</div>
          <h2 className="text-2xl font-bold font-devanagari">
            {percent >= 80 ? "उत्कृष्ट!" : percent >= 60 ? "छान!" : "सराव करत राहा!"}
          </h2>
          <div className="text-6xl font-bold text-primary-400">{percent}%</div>
          <p className="text-gray-400">
            {score} / {questions.length} correct
          </p>
          <div className="w-full bg-gray-700/40 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-1000 ${
                percent >= 80 ? "bg-emerald-500" : percent >= 60 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${percent}%` }}
            />
          </div>
          {saving && <p className="text-xs text-gray-500">Saving result...</p>}
          <div className="flex gap-3">
            <button
              onClick={startQuiz}
              className="flex-1 bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-xl font-medium transition-colors font-devanagari"
            >
              पुन्हा खेळा / Retry
            </button>
            <button
              onClick={resetQuiz}
              className="flex-1 bg-bg-hover border border-gray-700/50 hover:border-gray-600 text-gray-300 py-3 rounded-xl font-medium transition-colors"
            >
              नवीन / New Quiz
            </button>
          </div>
        </div>

        {/* Answer review */}
        <div className="space-y-4">
          <h3 className="text-gray-400 text-sm font-medium">Review Answers</h3>
          {questions.map((q, i) => (
            <div key={i} className={`bg-bg-card border rounded-xl p-4 text-sm ${
              answers[i] === q.answer ? "border-emerald-700/50" : "border-red-700/50"
            }`}>
              <p className="font-devanagari text-gray-200 mb-2">{q.question}</p>
              <p className={answers[i] === q.answer ? "text-emerald-400" : "text-red-400"}>
                Your answer: {answers[i]} · Correct: {q.answer}
              </p>
              <p className="text-gray-500 mt-1">{q.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Active quiz
  const currentQ = questions[currentIndex];
  const isAnswered = currentIndex in answers;

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-devanagari text-gray-300">प्रश्नमंजुषा / Quiz</h1>
        <button onClick={resetQuiz} className="text-xs text-gray-500 hover:text-gray-300">
          ✕ Exit
        </button>
      </div>

      <div className="bg-bg-card border border-gray-700/50 rounded-2xl p-6">
        <QuizQuestion
          question={currentQ}
          questionNumber={currentIndex + 1}
          total={questions.length}
          selectedAnswer={answers[currentIndex] ?? null}
          onSelect={handleAnswer}
        />

        {isAnswered && (
          <button
            onClick={handleNext}
            className="mt-6 w-full bg-primary-600 hover:bg-primary-500 text-white py-3 rounded-xl font-medium transition-colors font-devanagari"
          >
            {currentIndex < questions.length - 1 ? "पुढे / Next →" : "निकाल पहा / See Results"}
          </button>
        )}
      </div>
    </div>
  );
}
