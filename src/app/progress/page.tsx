"use client";

import { useEffect, useState } from "react";
import { ProgressBar } from "@/components/ProgressBar";
import type { ProgressStore, QuizResult } from "@/types";

export default function ProgressPage() {
  const [progress, setProgress] = useState<ProgressStore>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/progress")
      .then((r) => r.json())
      .then((d) => setProgress(d))
      .finally(() => setLoading(false));
  }, []);

  const entries = Object.values(progress);
  const totalSessions = entries.reduce((sum, e) => sum + e.sessionCount, 0);
  const allQuizResults = entries.flatMap((e) => e.quizResults);
  const avgScore =
    allQuizResults.length > 0
      ? Math.round(
          (allQuizResults.reduce((sum, r) => sum + r.score / r.total, 0) / allQuizResults.length) * 100
        )
      : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">
        <span className="font-devanagari text-primary-400">प्रगती</span>
        <span className="text-gray-300"> / Progress</span>
      </h1>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "अभ्यास सत्रे / Sessions", value: totalSessions, icon: "🎤" },
          { label: "क्विझ घेतलेल्या / Quizzes", value: allQuizResults.length, icon: "❓" },
          {
            label: "अभ्यास वेळ / Study Time",
            value: `~${Math.round((totalSessions * 5) / 60)}h ${(totalSessions * 5) % 60}m`,
            icon: "⏱",
          },
        ].map((s) => (
          <div key={s.label} className="bg-bg-card border border-gray-700/50 rounded-xl p-4 text-center space-y-2">
            <div className="text-2xl">{s.icon}</div>
            <div className="text-2xl font-bold text-primary-400">{s.value}</div>
            <p className="text-xs text-gray-500 font-devanagari">{s.label}</p>
          </div>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-gray-500 space-y-3">
          <p className="text-4xl">📊</p>
          <p className="font-devanagari text-lg">अजून प्रगती नाही</p>
          <p className="text-sm">Start studying or take a quiz to track progress!</p>
        </div>
      ) : (
        <>
          {/* Per-PDF progress */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-200">
              <span className="font-devanagari">नोट्स कव्हरेज</span>
              <span className="text-gray-500 ml-2 font-normal text-sm">/ Coverage per PDF</span>
            </h2>
            <div className="space-y-4">
              {entries.map((entry) => (
                <div key={entry.pdfId} className="bg-bg-card border border-gray-700/50 rounded-xl p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-200 truncate">{entry.filename}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {entry.sessionCount} sessions ·{" "}
                        {entry.lastStudied
                          ? `Last: ${new Date(entry.lastStudied).toLocaleDateString("en-IN")}`
                          : "Not studied yet"}
                      </p>
                    </div>
                    <span className="text-2xl font-bold text-primary-400 shrink-0">
                      {entry.coveragePercent}%
                    </span>
                  </div>
                  <ProgressBar value={entry.coveragePercent} showPercent={false} />
                  {entry.quizResults.length > 0 && (
                    <p className="text-xs text-gray-500">
                      Quiz avg:{" "}
                      <span className="text-primary-400">
                        {Math.round(
                          (entry.quizResults.reduce((s, r) => s + r.score / r.total, 0) /
                            entry.quizResults.length) *
                            100
                        )}%
                      </span>{" "}
                      over {entry.quizResults.length} quiz{entry.quizResults.length !== 1 ? "zes" : ""}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quiz history */}
          {allQuizResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-200">
                <span className="font-devanagari">क्विझ इतिहास</span>
                <span className="text-gray-500 ml-2 font-normal text-sm">/ Quiz History</span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs border-b border-gray-700/50">
                      <th className="pb-2 pr-4">Date</th>
                      <th className="pb-2 pr-4">PDF</th>
                      <th className="pb-2 pr-4">Score</th>
                      <th className="pb-2">Language</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    {[...allQuizResults]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((r: QuizResult) => (
                        <tr key={r.id} className="border-b border-gray-700/20">
                          <td className="py-3 pr-4 text-gray-400">
                            {new Date(r.date).toLocaleDateString("en-IN")}
                          </td>
                          <td className="py-3 pr-4 text-gray-300 max-w-[150px] truncate">
                            {r.pdfName}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`font-medium ${
                                r.score / r.total >= 0.8
                                  ? "text-emerald-400"
                                  : r.score / r.total >= 0.6
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              }`}
                            >
                              {r.score}/{r.total} ({Math.round((r.score / r.total) * 100)}%)
                            </span>
                          </td>
                          <td className="py-3 text-gray-500 capitalize">{r.language}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {avgScore > 0 && (
                <div className="bg-bg-card border border-gray-700/50 rounded-xl p-4">
                  <p className="text-sm text-gray-400">
                    Overall quiz average:{" "}
                    <span className="text-primary-400 font-bold">{avgScore}%</span>
                  </p>
                  <ProgressBar value={avgScore} showPercent={false} />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
