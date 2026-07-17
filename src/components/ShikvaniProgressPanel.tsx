"use client";
import { SYLLABUS } from "@/lib/syllabus";
import { topicsFor } from "@/lib/syllabusTopics";

export function ShikvaniProgressPanel({
  currentId,
  done,
  marathi = false,
}: {
  currentId: string | null;
  done: Set<string>;
  marathi?: boolean;
}) {
  const useMr = marathi;
  return (
    <div className="text-sm space-y-4">
      {SYLLABUS.map((subject) => {
        const topics = subject.subtopics.flatMap((s) => topicsFor(subject.key, s.key));
        if (!topics.length) return null;
        const doneCount = topics.filter((t) => done.has(t.id)).length;
        return (
          <div key={subject.key}>
            <div className="flex items-center justify-between font-medium text-gray-200">
              <span>{subject.icon} {useMr ? <span className="font-devanagari">{subject.label}</span> : subject.labelEn}</span>
              <span className="text-xs text-gray-500">{doneCount}/{topics.length}</span>
            </div>
            <ul className="mt-1 space-y-0.5">
              {topics.map((t) => {
                const isDone = done.has(t.id);
                const isCurrent = t.id === currentId;
                return (
                  <li key={t.id}
                    className={`flex gap-2 px-2 py-1 rounded ${useMr ? "font-devanagari" : ""} ${
                      isCurrent ? "bg-primary-600/20 text-primary-300" : isDone ? "text-gray-500" : "text-gray-400"
                    }`}>
                    <span>{isDone ? "✅" : isCurrent ? "▶" : "•"}</span>
                    <span className="truncate">{useMr ? t.mr : t.en}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
