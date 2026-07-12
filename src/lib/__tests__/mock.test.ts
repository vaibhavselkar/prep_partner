import { describe, it, expect } from "vitest";
import { assembleMock, scoreMock } from "@/lib/mock";
import type { BankQuestion } from "@/types";

const mk = (subject: string, i: number): BankQuestion => ({
  id: `${subject}-${i}`, subject, subtopic: "x", difficulty: "easy",
  language: "bilingual", question: "q", options: ["A", "B", "C", "D"],
  answer: "A", explanation: "e", tags: [], verifiedAt: "2026-07-07",
});

describe("assembleMock", () => {
  // Official prelims subjects (keys must match src/lib/syllabus.ts).
  const pool = ["history","geography","polity","current_affairs","science","economy","arithmetic","reasoning"]
    .flatMap((s) => Array.from({ length: 40 }, (_, i) => mk(s, i)));

  it("returns the requested size", () => {
    expect(assembleMock(pool, 100, 7)).toHaveLength(100);
  });
  it("has no duplicate questions", () => {
    const ids = assembleMock(pool, 100, 7).map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("weights economy (15 marks) more than history (10 marks)", () => {
    const m = assembleMock(pool, 100, 7);
    const history = m.filter((q) => q.subject === "history").length;
    const economy = m.filter((q) => q.subject === "economy").length;
    expect(economy).toBeGreaterThan(history);
  });
  it("gives Maths (arithmetic 11 + reasoning 9 = 20) the largest share", () => {
    const m = assembleMock(pool, 100, 7);
    const maths = m.filter((q) => q.subject === "arithmetic" || q.subject === "reasoning").length;
    const polity = m.filter((q) => q.subject === "polity").length;
    expect(maths).toBeGreaterThan(polity); // 20 vs 15
  });
});

describe("scoreMock", () => {
  it("scores correct answers and per-subject breakdown", () => {
    const qs = [mk("history", 1), mk("history", 2), mk("science", 1)];
    const res = scoreMock(qs, { 0: "A", 1: "B", 2: "A" }); // q0 correct, q1 wrong, q2 correct
    expect(res.score).toBe(2);
    expect(res.total).toBe(3);
    expect(res.bySubject.history).toEqual({ correct: 1, total: 2 });
    expect(res.bySubject.science).toEqual({ correct: 1, total: 1 });
  });
});
