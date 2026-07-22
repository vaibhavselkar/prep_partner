"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ExamPalette } from "@/components/ExamPalette";
import type { PublicQuestion, TestMeta, ScoreResult } from "@/lib/testSeries";

const USERS = ["Pranju", "Vaibhav"];

interface ReviewItem {
  id: string; chosen: string | null; correct: string; isCorrect: boolean;
  question: string; options: string[]; explanation: string;
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ExamPage() {
  const { id } = useParams<{ id: string }>();
  const [meta, setMeta] = useState<TestMeta | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [phase, setPhase] = useState<"loading" | "exam" | "submitting" | "result" | "error">("loading");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSubmit, setShowSubmit] = useState(false);
  const [user, setUser] = useState("");
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [saved, setSaved] = useState(false);
  const startRef = useRef<number>(0);
  const submittedRef = useRef(false);

  // Load the test.
  useEffect(() => {
    fetch(`/api/test-series/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.meta) { setPhase("error"); return; }
        setMeta(d.meta);
        setQuestions(d.questions);
        setTimeLeft(d.meta.durationMin * 60);
        startRef.current = d.meta.durationMin * 60;
        setVisited(new Set([d.questions[0]?.id]));
        setPhase("exam");
      })
      .catch(() => setPhase("error"));
  }, [id]);

  const ids = useMemo(() => questions.map((q) => q.id), [questions]);
  const current = questions[idx];

  const doSubmit = useCallback(async (chosenUser: string) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setPhase("submitting");
    const timeTakenSec = startRef.current - timeLeft;
    try {
      const res = await fetch(`/api/test-series/${id}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user: chosenUser, answers, timeTakenSec }),
      });
      const d = await res.json();
      if (d.result) { setResult(d.result); setReview(d.review ?? []); setSaved(Boolean(d.saved)); setPhase("result"); }
      else { setPhase("error"); }
    } catch { setPhase("error"); }
  }, [answers, id, timeLeft]);

  // Countdown; auto-submit at 0 (as the current or first user if none picked).
  useEffect(() => {
    if (phase !== "exam") return;
    if (timeLeft <= 0) { doSubmit(user || USERS[0]); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, doSubmit, user]);

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(questions.length - 1, i));
    setIdx(clamped);
    const qid = questions[clamped]?.id;
    if (qid) setVisited((v) => new Set(v).add(qid));
  };
  const choose = (letter: string) => current && setAnswers((a) => ({ ...a, [current.id]: letter }));
  const clearResp = () => current && setAnswers((a) => ({ ...a, [current.id]: null }));
  const toggleMark = () => {
    if (!current) return;
    setMarked((m) => { const n = new Set(m); n.has(current.id) ? n.delete(current.id) : n.add(current.id); return n; });
  };

  if (phase === "loading") return <Centered>Loading test…</Centered>;
  if (phase === "error") return <Centered>Something went wrong. <Link className="text-primary-400 underline" href="/test-series">Back</Link></Centered>;
  if (phase === "submitting") return <Centered>Submitting & scoring…</Centered>;

  if (phase === "result" && result && meta) {
    return <Results meta={meta} result={result} review={review} saved={saved} user={user || USERS[0]} />;
  }

  const answeredCount = ids.filter((i) => answers[i]).length;
  const low = timeLeft <= 60;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 pb-3 mb-4">
        <div>
          <h1 className="font-bold text-lg font-devanagari">{meta?.titleMr} <span className="text-gray-400 text-sm">/ {meta?.titleEn}</span></h1>
          <p className="text-xs text-gray-500">+{meta?.marksPerQ} correct · −{meta?.negativePerWrong} wrong · {questions.length} questions</p>
        </div>
        <div className={`text-right ${low ? "text-red-400" : "text-gray-200"}`}>
          <div className="text-xs text-gray-400">Time Left</div>
          <div className="text-2xl font-mono font-bold tabular-nums">{fmt(timeLeft)}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_260px] gap-6">
        {/* Question */}
        <div>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="font-semibold">Q {idx + 1} <span className="text-gray-500">of {questions.length}</span></span>
            <span className="text-gray-500">Marks: +{meta?.marksPerQ}, −{meta?.negativePerWrong}</span>
          </div>
          <p className="text-[15px] leading-relaxed mb-4 font-devanagari">{current?.question}</p>
          <div className="space-y-2">
            {current?.options.map((opt) => {
              const letter = opt.trim()[0];
              const sel = answers[current.id] === letter;
              return (
                <button key={letter} onClick={() => choose(letter)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border font-devanagari text-sm transition ${
                    sel ? "border-primary-500 bg-primary-600/20 text-white" : "border-gray-700 hover:bg-gray-800 text-gray-200"
                  }`}>
                  {opt}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <button onClick={clearResp} className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm">Clear Response</button>
            <button onClick={() => { toggleMark(); goTo(idx + 1); }} className="px-3 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-sm">Mark for Review & Next</button>
            <button onClick={() => goTo(idx - 1)} disabled={idx === 0} className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm disabled:opacity-40 ml-auto">Previous</button>
            <button onClick={() => goTo(idx + 1)} disabled={idx === questions.length - 1} className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm disabled:opacity-40">Save & Next</button>
          </div>
        </div>

        {/* Palette */}
        <aside className="border-l border-gray-800 md:pl-4">
          <ExamPalette ids={ids} current={idx} answers={answers} marked={marked} visited={visited} onJump={goTo} />
          <button onClick={() => setShowSubmit(true)} className="w-full mt-5 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white font-semibold">
            Submit Test
          </button>
        </aside>
      </div>

      {/* Submit modal — pick user */}
      {showSubmit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold text-lg">Submit test</h3>
            <p className="text-sm text-gray-400">Answered {answeredCount} of {questions.length}. Who is taking this test?</p>
            <select value={user} onChange={(e) => setUser(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
              <option value="">— Select name —</option>
              {USERS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowSubmit(false)} className="px-4 py-2 rounded-lg bg-gray-700 text-sm">Cancel</button>
              <button onClick={() => user && doSubmit(user)} disabled={!user}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium disabled:opacity-40">
                Submit & Score
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center justify-center h-72 text-gray-300 gap-2">{children}</div>;
}

function Results({ meta, result, review, saved, user }: {
  meta: TestMeta; result: ScoreResult; review: ReviewItem[]; saved: boolean; user: string;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">
        <span className="font-devanagari text-primary-400">निकाल</span> / Result
        <span className="block text-sm text-gray-400 font-normal font-devanagari mt-1">{meta.titleMr} / {meta.titleEn}</span>
      </h1>

      <div className="rounded-2xl border border-gray-700 bg-gray-900 p-6 text-center">
        <div className="text-4xl font-bold text-primary-400">{result.score} <span className="text-gray-500 text-2xl">/ {result.maxScore}</span></div>
        <div className="text-gray-400 mt-1">{result.percentage}%</div>
        <div className="grid grid-cols-3 gap-3 mt-5 text-sm">
          <Stat label="Correct" value={`${result.correct}`} cls="text-green-400" sub={`+${result.correct * meta.marksPerQ}`} />
          <Stat label="Wrong" value={`${result.wrong}`} cls="text-red-400" sub={`−${(result.wrong * meta.negativePerWrong).toFixed(2)}`} />
          <Stat label="Unanswered" value={`${result.unanswered}`} cls="text-gray-400" sub="0" />
        </div>
        <p className="text-xs text-gray-500 mt-4">
          {saved ? `Saved to ${user}'s history ✓` : "⚠ Not saved to the database (MONGODB_URI not reachable)."}
        </p>
      </div>

      <div className="flex gap-2">
        <Link href="/test-series" className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm">← All tests</Link>
      </div>

      <h2 className="text-lg font-semibold pt-2">Review</h2>
      <div className="space-y-3">
        {review.map((r, i) => (
          <div key={r.id} className={`rounded-xl border p-4 ${r.isCorrect ? "border-green-600/50" : r.chosen ? "border-red-600/50" : "border-gray-700"}`}>
            <p className="text-sm font-medium font-devanagari mb-2">{i + 1}. {r.question}</p>
            <div className="text-xs space-y-1 font-devanagari">
              {r.options.map((opt) => {
                const letter = opt.trim()[0];
                const isCorrect = letter === r.correct;
                const isChosen = letter === r.chosen;
                return (
                  <div key={letter} className={`px-2 py-1 rounded ${isCorrect ? "bg-green-900/40 text-green-300" : isChosen ? "bg-red-900/40 text-red-300" : "text-gray-400"}`}>
                    {opt} {isCorrect ? "✓" : isChosen ? "✗ (your answer)" : ""}
                  </div>
                );
              })}
            </div>
            {!r.chosen && <p className="text-xs text-gray-500 mt-1">Not answered</p>}
            <p className="text-xs text-gray-400 mt-2 font-devanagari"><b>स्पष्टीकरण:</b> {r.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, cls, sub }: { label: string; value: string; cls: string; sub: string }) {
  return (
    <div className="rounded-lg bg-gray-800 py-3">
      <div className={`text-2xl font-bold ${cls}`}>{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
      <div className="text-[11px] text-gray-500">{sub}</div>
    </div>
  );
}
