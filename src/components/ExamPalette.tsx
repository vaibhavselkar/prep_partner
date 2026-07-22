"use client";

export type QStatus = "not-visited" | "not-answered" | "answered" | "marked" | "ans-marked";

export function statusOf(
  id: string,
  answers: Record<string, string | null>,
  marked: Set<string>,
  visited: Set<string>,
): QStatus {
  const answered = Boolean(answers[id]);
  const isMarked = marked.has(id);
  if (answered && isMarked) return "ans-marked";
  if (answered) return "answered";
  if (isMarked) return "marked";
  if (visited.has(id)) return "not-answered";
  return "not-visited";
}

const CLS: Record<QStatus, string> = {
  "not-visited": "bg-gray-700 text-gray-200",
  "not-answered": "bg-red-600 text-white",
  answered: "bg-green-600 text-white",
  marked: "bg-purple-600 text-white",
  "ans-marked": "bg-purple-600 text-white ring-2 ring-green-400",
};

export function ExamPalette({
  ids,
  current,
  answers,
  marked,
  visited,
  onJump,
}: {
  ids: string[];
  current: number;
  answers: Record<string, string | null>;
  marked: Set<string>;
  visited: Set<string>;
  onJump: (i: number) => void;
}) {
  const counts = { answered: 0, "not-answered": 0, marked: 0, "ans-marked": 0, "not-visited": 0 } as Record<QStatus, number>;
  ids.forEach((id) => { counts[statusOf(id, answers, marked, visited)]++; });

  const legend: { s: QStatus; label: string }[] = [
    { s: "answered", label: `Answered (${counts.answered})` },
    { s: "not-answered", label: `Not Answered (${counts["not-answered"]})` },
    { s: "not-visited", label: `Not Visited (${counts["not-visited"]})` },
    { s: "marked", label: `Marked (${counts.marked})` },
    { s: "ans-marked", label: `Answered & Marked (${counts["ans-marked"]})` },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-300">
        {legend.map((l) => (
          <div key={l.s} className="flex items-center gap-1.5">
            <span className={`inline-block w-4 h-4 rounded ${CLS[l.s]}`} />
            <span>{l.label}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {ids.map((id, i) => {
          const s = statusOf(id, answers, marked, visited);
          return (
            <button
              key={id}
              onClick={() => onJump(i)}
              className={`h-9 rounded font-semibold text-sm ${CLS[s]} ${i === current ? "outline outline-2 outline-amber-400" : ""}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
