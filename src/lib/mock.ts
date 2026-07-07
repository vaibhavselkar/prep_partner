import type { BankQuestion } from "@/types";
import { SYLLABUS, PRELIMS_TOTAL_MARKS } from "@/lib/syllabus";
import { sampleFrom } from "@/lib/bank";

export function assembleMock(questions: BankQuestion[], size: number, seed = 1): BankQuestion[] {
  const picked: BankQuestion[] = [];
  const used = new Set<string>();
  // Allocate slots per subject by prelims-marks share (largest-remainder rounding).
  const raw = SYLLABUS.map((s) => ({
    key: s.key, exact: (s.marks / PRELIMS_TOTAL_MARKS) * size,
  }));
  const alloc = raw.map((r) => ({ key: r.key, n: Math.floor(r.exact), frac: r.exact - Math.floor(r.exact) }));
  let assigned = alloc.reduce((n, a) => n + a.n, 0);
  for (const a of [...alloc].sort((x, y) => y.frac - x.frac)) {
    if (assigned >= size) break;
    a.n += 1; assigned += 1;
  }
  for (const a of alloc) {
    const got = sampleFrom(questions, { subject: a.key, count: a.n, seed, excludeIds: [...used] });
    for (const q of got) { if (!used.has(q.id)) { used.add(q.id); picked.push(q); } }
  }
  // Backfill if any subject was short of questions.
  if (picked.length < size) {
    const extra = sampleFrom(questions, { count: size - picked.length, seed: seed + 1, excludeIds: [...used] });
    for (const q of extra) { if (!used.has(q.id)) { used.add(q.id); picked.push(q); } }
  }
  return picked.slice(0, size);
}

export function scoreMock(
  questions: BankQuestion[],
  answers: Record<number, string>
): { score: number; total: number; bySubject: Record<string, { correct: number; total: number }> } {
  const bySubject: Record<string, { correct: number; total: number }> = {};
  let score = 0;
  questions.forEach((q, i) => {
    const b = (bySubject[q.subject] ??= { correct: 0, total: 0 });
    b.total += 1;
    if (answers[i] === q.answer) { score += 1; b.correct += 1; }
  });
  return { score, total: questions.length, bySubject };
}
