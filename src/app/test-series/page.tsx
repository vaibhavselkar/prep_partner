"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { TestMeta } from "@/lib/testSeries";

const USERS = ["Pranju", "Vaibhav"];

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">
          <span className="font-devanagari text-primary-400">चाचणी मालिका</span>
          <span className="text-gray-300"> / Test Series</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">Full MPSC-style tests — timed, with negative marking and instant scoring.</p>
      </header>

      {/* Available tests */}
      <section className="space-y-3">
        {tests.length === 0 && <p className="text-gray-500 text-sm">No tests yet.</p>}
        {tests.map((t) => (
          <div key={t.id} className="rounded-xl border border-gray-700 bg-gray-900 p-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold font-devanagari">{t.titleMr} <span className="text-gray-400 text-sm">/ {t.titleEn}</span></h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {t.questionCount} questions · {t.durationMin} min · +{t.marksPerQ} correct, −{t.negativePerWrong} wrong
              </p>
            </div>
            <Link href={`/test-series/${t.id}`} className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium whitespace-nowrap">
              ▶ Start test
            </Link>
          </div>
        ))}
      </section>

      {/* Performance history */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Performance</h2>
          <select value={user} onChange={(e) => setUser(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm">
            {USERS.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        {loadingHist ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : attempts.length === 0 ? (
          <p className="text-gray-500 text-sm">No attempts yet for {user}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-400 text-left border-b border-gray-700">
                <tr><th className="py-2">Test</th><th>Score</th><th>%</th><th>✓/✗/–</th><th>Date</th></tr>
              </thead>
              <tbody>
                {attempts.map((a, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="py-2">{a.testTitle}</td>
                    <td>{a.score}/{a.maxScore}</td>
                    <td>{a.percentage}%</td>
                    <td className="text-xs"><span className="text-green-400">{a.correct}</span>/<span className="text-red-400">{a.wrong}</span>/<span className="text-gray-500">{a.unanswered}</span></td>
                    <td className="text-xs text-gray-500">{new Date(a.submittedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
