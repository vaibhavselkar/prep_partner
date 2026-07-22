"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { TestMeta } from "@/lib/testSeries";

const USERS = ["Pranju", "Vaibhav"];

const SUBJECTS: Record<string, { mr: string; en: string; icon: string }> = {
  geography: { mr: "भूगोल", en: "Geography", icon: "🗺️" },
  arithmetic: { mr: "गणित", en: "Maths", icon: "🔢" },
  reasoning: { mr: "बुद्धिमत्ता", en: "Reasoning", icon: "🧠" },
  history: { mr: "इतिहास", en: "History", icon: "🏛️" },
  polity: { mr: "राज्यशास्त्र", en: "Polity", icon: "⚖️" },
  economy: { mr: "अर्थशास्त्र", en: "Economy", icon: "💰" },
  science: { mr: "विज्ञान", en: "Science", icon: "🔬" },
  current_affairs: { mr: "चालू घडामोडी", en: "Current Affairs", icon: "📰" },
};

interface Attempt {
  testTitle: string; score: number; maxScore: number; percentage: number;
  correct: number; wrong: number; unanswered: number; submittedAt: string;
}

export default function TestSeriesPage() {
  const [tests, setTests] = useState<TestMeta[]>([]);
  const [user, setUser] = useState<string>(USERS[0]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);

  useEffect(() => {
    fetch("/api/test-series").then((r) => r.json()).then((d) => setTests(d.tests ?? []));
  }, []);

  useEffect(() => {
    setLoadingHist(true);
    fetch(`/api/test-series/attempts?user=${encodeURIComponent(user)}`)
      .then((r) => r.json())
      .then((d) => setAttempts(d.attempts ?? []))
      .finally(() => setLoadingHist(false));
  }, [user]);

  // Group tests into subject blocks.
  const blocks = useMemo(() => {
    const map = new Map<string, TestMeta[]>();
    for (const t of tests) {
      if (!map.has(t.subject)) map.set(t.subject, []);
      map.get(t.subject)!.push(t);
    }
    return [...map.entries()];
  }, [tests]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        <header>
          <h1 className="text-xl sm:text-2xl font-bold">
            <span className="font-devanagari text-primary-600">चाचणी मालिका</span>
            <span className="text-gray-700"> / Test Series</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">MPSC-style tests — timed, negative marking, instant scoring.</p>
        </header>

        {/* Subject blocks */}
        {blocks.length === 0 && <p className="text-gray-400 text-sm">No tests yet.</p>}
        {blocks.map(([subjectKey, subjectTests]) => {
          const s = SUBJECTS[subjectKey] ?? { mr: subjectKey, en: subjectKey, icon: "📘" };
          return (
            <section key={subjectKey} className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold border-b border-gray-200 pb-2">
                <span className="text-2xl">{s.icon}</span>
                <span className="font-devanagari">{s.mr}</span>
                <span className="text-gray-400 text-sm font-normal">/ {s.en}</span>
                <span className="ml-auto text-xs font-normal text-gray-400">{subjectTests.length} test{subjectTests.length > 1 ? "s" : ""}</span>
              </h2>
              <div className="space-y-3">
                {subjectTests.map((t) => (
                  <div key={t.id} className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold font-devanagari">{t.titleMr} <span className="text-gray-400 text-sm">/ {t.titleEn}</span></h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {t.questionCount} questions · {t.durationMin} min · +{t.marksPerQ} / −{t.negativePerWrong}
                      </p>
                    </div>
                    <Link href={`/test-series/${t.id}`}
                      className="sm:ml-auto text-center px-4 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium whitespace-nowrap">
                      ▶ Start test
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {/* Performance history */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-semibold">Performance</h2>
            <select value={user} onChange={(e) => setUser(e.target.value)}
              className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
              {USERS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          {loadingHist ? (
            <p className="text-gray-400 text-sm">Loading…</p>
          ) : attempts.length === 0 ? (
            <p className="text-gray-400 text-sm">No attempts yet for {user}.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="text-gray-500 text-left bg-gray-50 border-b border-gray-200">
                  <tr><th className="py-2 px-3">Test</th><th className="px-2">Score</th><th className="px-2">%</th><th className="px-2">✓/✗/–</th><th className="px-2">Date</th></tr>
                </thead>
                <tbody>
                  {attempts.map((a, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 px-3">{a.testTitle}</td>
                      <td className="px-2 whitespace-nowrap">{a.score}/{a.maxScore}</td>
                      <td className="px-2">{a.percentage}%</td>
                      <td className="px-2 text-xs whitespace-nowrap"><span className="text-green-600">{a.correct}</span>/<span className="text-red-600">{a.wrong}</span>/<span className="text-gray-400">{a.unanswered}</span></td>
                      <td className="px-2 text-xs text-gray-400 whitespace-nowrap">{new Date(a.submittedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
