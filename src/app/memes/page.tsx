"use client";

import { useEffect, useMemo, useState } from "react";
import type { MemeReviewRecord, MemeReviewStatus } from "@/lib/memes/reviewStore";

type Filter = "pending" | "approved" | "rejected" | "all";

export default function MemesReviewPage() {
  const [memes, setMemes] = useState<MemeReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/memes")
      .then((r) => r.json())
      .then((d) => setMemes(d.memes ?? []))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, all: memes.length };
    for (const m of memes) c[m.status]++;
    return c;
  }, [memes]);

  const shown = filter === "all" ? memes : memes.filter((m) => m.status === filter);

  async function updateStatus(id: string, status: MemeReviewStatus) {
    setBusyId(id);
    try {
      const res = await fetch("/api/memes", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const d = await res.json();
      if (d.memes) setMemes(d.memes);
    } finally {
      setBusyId(null);
    }
  }

  async function copyCaption(m: MemeReviewRecord) {
    try {
      await navigator.clipboard.writeText(m.caption);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId((c) => (c === m.id ? null : c)), 1500);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  }

  const tabs: { key: Filter; label: string }[] = [
    { key: "pending", label: `पेंडिंग / Pending (${counts.pending})` },
    { key: "approved", label: `स्वीकृत / Approved (${counts.approved})` },
    { key: "rejected", label: `नाकारलेले / Denied (${counts.rejected})` },
    { key: "all", label: `सर्व / All (${counts.all})` },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold">
          <span className="font-devanagari text-primary-400">मीम रिव्ह्यू</span>
          <span className="text-gray-300"> / Meme Review</span>
        </h1>
        <p className="text-sm text-gray-400">
          Check each meme, <b className="text-green-400">Accept</b> the ones to post or{" "}
          <b className="text-red-400">Deny</b> the rest, then copy the caption and post it on Instagram.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === t.key
                ? "bg-primary-500 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : shown.length === 0 ? (
        <p className="text-gray-400 py-16 text-center">इथे काही नाही / Nothing here.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {shown.map((m) => (
            <div
              key={m.id}
              className={`rounded-2xl border bg-gray-900 overflow-hidden flex flex-col ${
                m.status === "approved"
                  ? "border-green-500/60"
                  : m.status === "rejected"
                  ? "border-red-500/40 opacity-60"
                  : "border-gray-700"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/memes/${m.file}`}
                alt={`${m.subject} meme`}
                className="w-full bg-black object-contain max-h-[420px]"
              />

              <div className="p-4 space-y-3 flex-1 flex flex-col">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-300">{m.subject}</span>
                  <span className="px-2 py-0.5 rounded bg-gray-800 text-gray-400">{m.template}</span>
                  {m.kind === "factual" ? (
                    <span className="px-2 py-0.5 rounded bg-green-900/50 text-green-300">
                      ✅ Verified {m.sourceRef ? `· ${m.sourceRef}` : ""}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-blue-900/40 text-blue-300">😄 Relatable</span>
                  )}
                  <span className="ml-auto text-gray-500">{m.status}</span>
                </div>

                <div className="rounded-lg bg-gray-800/70 p-3 text-sm text-gray-200 whitespace-pre-wrap font-devanagari flex-1">
                  {m.caption}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => copyCaption(m)}
                    className="px-3 py-1.5 rounded-lg text-sm bg-gray-700 hover:bg-gray-600 text-white"
                  >
                    {copiedId === m.id ? "✓ Copied!" : "📋 Copy caption"}
                  </button>
                  <a
                    href={`/memes/${m.file}`}
                    download
                    className="px-3 py-1.5 rounded-lg text-sm bg-gray-700 hover:bg-gray-600 text-white"
                  >
                    ⬇ Download
                  </a>
                  <div className="ml-auto flex gap-2">
                    <button
                      disabled={busyId === m.id}
                      onClick={() => updateStatus(m.id, "approved")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 ${
                        m.status === "approved"
                          ? "bg-green-600 text-white"
                          : "bg-green-700/80 hover:bg-green-600 text-white"
                      }`}
                    >
                      ✅ Accept
                    </button>
                    <button
                      disabled={busyId === m.id}
                      onClick={() => updateStatus(m.id, "rejected")}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 ${
                        m.status === "rejected"
                          ? "bg-red-600 text-white"
                          : "bg-red-700/70 hover:bg-red-600 text-white"
                      }`}
                    >
                      ❌ Deny
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
