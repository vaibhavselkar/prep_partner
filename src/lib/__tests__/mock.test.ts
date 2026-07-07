import { describe, it, expect } from "vitest";
import { assembleMock, scoreMock } from "@/lib/mock";
import type { BankQuestion } from "@/types";

const mk = (subject: string, i: number): BankQuestion => ({
  id: `${subject}-${i}`, subject, subtopic: "x", difficulty: "easy",
  language: "bilingual", question: "q", options: ["A", "B", "C", "D"],
  answer: "A", explanation: "e", tags: [], verifiedAt: "2026-07-07",
});

describe("assembleMock", () => {
  const pool = ["marathi","english","gk","aptitude","science","current_affairs"]
    .flatMap((s) => Array.from({ length: 40 }, (_, i) => mk(s, i)));

  it("returns the requested size", () => {
    expect(assembleMock(pool, 100, 7)).toHaveLength(100);
  });
  it("has no duplicate questions", () => {
    const ids = assembleMock(pool, 100, 7).map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("weights gk (30 marks) more than science (10 marks)", () => {
    const m = assembleMock(pool, 100, 7);
    const gk = m.filter((q) => q.subject === "gk").length;
    const sci = m.filter((q) => q.subject === "science").length;
    expect(gk).toBeGreaterThan(sci);
  });
});

describe("scoreMock", () => {
  it("scores correct answers and per-subject breakdown", () => {
    const qs = [mk("gk", 1), mk("gk", 2), mk("science", 1)];
    const res = scoreMock(qs, { 0: "A", 1: "B", 2: "A" }); // q0 correct, q1 wrong, q2 correct
    expect(res.score).toBe(2);
    expect(res.total).toBe(3);
    expect(res.bySubject.gk).toEqual({ correct: 1, total: 2 });
    expect(res.bySubject.science).toEqual({ correct: 1, total: 1 });
  });
});
