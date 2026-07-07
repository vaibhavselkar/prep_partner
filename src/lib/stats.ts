import type { TopicStat } from "@/types";

export function applyQuizResult(
  stats: TopicStat[],
  items: { subject: string; subtopic: string; correct: boolean }[],
  now: string
): TopicStat[] {
  const map = new Map(stats.map((s) => [`${s.subject}/${s.subtopic}`, { ...s }]));
  for (const it of items) {
    const key = `${it.subject}/${it.subtopic}`;
    const cur = map.get(key) ?? { subject: it.subject, subtopic: it.subtopic, attempts: 0, correct: 0, lastPracticed: now };
    cur.attempts += 1;
    if (it.correct) cur.correct += 1;
    cur.lastPracticed = now;
    map.set(key, cur);
  }
  return [...map.values()];
}

export function weakestTopics(stats: TopicStat[], n: number): TopicStat[] {
  return stats
    .filter((s) => s.attempts >= 3)
    .sort((a, b) => a.correct / a.attempts - b.correct / b.attempts)
    .slice(0, n);
}
