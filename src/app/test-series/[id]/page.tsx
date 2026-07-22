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
  const [showPalette, setShowPalette] = useState(false);
  const [user, setUser] = useState("");
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [saved, setSaved] = useState(false);
  const startRef = useRef<number>(0);
  const submittedRef = useRef(false);

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

  useEffect(() => {
    if (phase !== "exam") return;
    if (timeLeft <= 0) { doSubmit(user || USERS[0]); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, doSubmit, user]);

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(questions.length - 1, i));
    setIdx(clamped);
    setShowPalette(false);
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
  if (phase === "error") return <Centered>Something went wrong. <Link className="text-primary-600 underline" href="/test-series">Back</Link></Centered>;
  if (phase === "submitting") return <Centered>Submitting &amp; scoring…</Centered>;
  if (phase === "result" && result && meta) return <Results meta={meta} result={result} review={review} saved={saved} user={user || USERS[0]} />;

  const answeredCount = ids.filter((i) => answers[i]).length;
  const low = timeLeft <= 60;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4 gap-3">
          <div className="min-w-0">
            <h1 className="font-bold text-base sm:text-lg font-devanagari truncate">{meta?.titleMr}</h1>
            <p className="text-[11px] sm:text-xs text-gray-500">+{meta?.marksPerQ} / −{meta?.negativePerWrong} · {questions.length} Q</p>
          </div>
          <div className={`text-right shrink-0 ${low ? "text-red-600" : "text-gray-800"}`}>
            <div className="text-[10px] text-gray-400 uppercase">Time Left</div>
            <div className="text-xl sm:text-2xl font-mono font-bold tabular-nums">{fmt(timeLeft)}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr_240px] gap-5">
          {/* Question */}
          <div>
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="font-semibold">Q {idx + 1} <span className="text-gray-400">of {questions.length}</span></span>
              {/* Mobile palette toggle */}
              <button onClick={() => setShowPalette((v) => !v)} className="md:hidden text-xs px-2 py-1 rounded border border-gray-300 text-gray-600">
                {showPalette ? "Hide" : "Questions"} ▾
              </button>
            </div>
            <p className="text-[15px] leading-relaxed mb-4 font-devanagari">{current?.question}</p>
            <div className="space-y-2">
              {current?.options.map((opt) => {
                const letter = opt.trim()[0];
                const sel = answers[current.id] === letter;
                return (
                  <button key={letter} onClick={() => choose(letter)}
                    className={`w-full text-left px-4 py-3 rounded-lg border font-devanagari text-sm transition ${
                      sel ? "border-primary-500 bg-primary-50 text-primary-900 ring-1 ring-primary-400" : "border-gray-200 bg-white hover:bg-gray-50 text-gray-800"
                    }`}>
                    {opt}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mt-5">
              <button onClick={clearResp} className="px-3 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm">Clear</button>
              <button onClick={() => { toggleMark(); goTo(idx + 1); }} className="px-3 py-2.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 text-sm">Mark &amp; Next</button>
              <button onClick={() => goTo(idx - 1)} disabled={idx === 0} className="px-3 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm disabled:opacity-40 sm:ml-auto">Previous</button>
              <button onClick={() => goTo(idx + 1)} disabled={idx === questions.length - 1} className="px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium disabled:opacity-40">Save &amp; Next</button>
            </div>
          </div>

          {/* Palette — sidebar on desktop, collapsible panel on mobile */}
          <aside className={`${showPalette ? "block" : "hidden"} md:block md:border-l md:border-gray-200 md:pl-4`}>
            <ExamPalette ids={ids} current={idx} answers={answers} marked={marked} visited={visited} onJump={goTo} />
            <button onClick={() => setShowSubmit(true)} className="w-full mt-5 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold">
              Submit Test
            </button>
          </aside>
        </div>

        {/* Sticky mobile submit bar */}
        <button onClick={() => setShowSubmit(true)}
          className="md:hidden fixed bottom-3 right-3 left-3 z-30 px-4 py-3 rounded-xl bg-green-600 text-white font-semibold shadow-lg">
          Submit Test ({answeredCount}/{questions.length})
        </button>

        {/* Submit modal */}
        {showSubmit && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
              <h3 className="font-semibold text-lg text-gray-900">Submit test</h3>
              <p className="text-sm text-gray-500">Answered {answeredCount} of {questions.length}. Who is taking this test?</p>
              <select value={user} onChange={(e) => setUser(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— Select name —</option>
                {USERS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowSubmit(false)} className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm">Cancel</button>
                <button onClick={() => user && doSubmit(user)} disabled={!user}
                  className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-40">
                  Submit &amp; Score
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white flex items-center justify-center text-gray-600 gap-2 px-4 text-center">{children}</div>;
}

function Results({ meta, result, review, saved, user }: {
  meta: TestMeta; result: ScoreResult; review: ReviewItem[]; saved: boolean; user: string;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold">
          <span className="font-devanagari text-primary-600">निकाल</span> / Result
          <span className="block text-sm text-gray-500 font-normal font-devanagari mt-1">{meta.titleMr} / {meta.titleEn}</span>
        </h1>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
          <div className="text-4xl font-bold text-primary-600">{result.score} <span className="text-gray-400 text-2xl">/ {result.maxScore}</span></div>
          <div className="text-gray-500 mt-1">{result.percentage}%</div>
          <div className="grid grid-cols-3 gap-3 mt-5 text-sm">
            <Stat label="Correct" value={`${result.correct}`} cls="text-green-600" sub={`+${result.correct * meta.marksPerQ}`} />
            <Stat label="Wrong" value={`${result.wrong}`} cls="text-red-600" sub={`−${(result.wrong * meta.negativePerWrong).toFixed(2)}`} />
            <Stat label="Unanswered" value={`${result.unanswered}`} cls="text-gray-500" sub="0" />
          </div>
          <p className="text-xs text-gray-400 mt-4">
            {saved ? `Saved to ${user}'s history ✓` : "⚠ Not saved (database not reachable)."}
          </p>
        </div>

        <Link href="/test-series" className="inline-block px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm">← All tests</Link>

        <h2 className="text-lg font-semibold pt-2">Review</h2>
        <div className="space-y-3">
          {review.map((r, i) => (
            <div key={r.id} className={`rounded-xl border p-4 ${r.isCorrect ? "border-green-300 bg-green-50/50" : r.chosen ? "border-red-300 bg-red-50/50" : "border-gray-200"}`}>
              <p className="text-sm font-medium font-devanagari mb-2">{i + 1}. {r.question}</p>
              <div className="text-xs space-y-1 font-devanagari">
                {r.options.map((opt) => {
                  const letter = opt.trim()[0];
                  const isCorrect = letter === r.correct;
                  const isChosen = letter === r.chosen;
                  return (
                    <div key={letter} className={`px-2 py-1 rounded ${isCorrect ? "bg-green-100 text-green-800" : isChosen ? "bg-red-100 text-red-800" : "text-gray-500"}`}>
                      {opt} {isCorrect ? "✓" : isChosen ? "✗ (your answer)" : ""}
                    </div>
                  );
                })}
              </div>
              {!r.chosen && <p className="text-xs text-gray-400 mt-1">Not answered</p>}
              <p className="text-xs text-gray-600 mt-2 font-devanagari"><b>स्पष्टीकरण:</b> {r.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, cls, sub }: { label: string; value: string; cls: string; sub: string }) {
  return (
    <div className="rounded-lg bg-white border border-gray-200 py-3">
      <div className={`text-2xl font-bold ${cls}`}>{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-[11px] text-gray-400">{sub}</div>
    </div>
  );
}
