import { describe, it, expect } from "vitest";
import { scoreTest, publicQuestions, type TestQuestion } from "@/lib/testSeries";

const Q = (id: string, answer: string): TestQuestion => ({
  id, difficulty: "easy", question: "q", options: ["A. a", "B. b", "C. c", "D. d"], answer, explanation: "e",
});

describe("scoreTest (MPSC +1 / -0.25)", () => {
  const questions = [Q("q1", "A"), Q("q2", "B"), Q("q3", "C"), Q("q4", "D")];

  it("scores correct/wrong/unanswered with negative marking", () => {
    // q1 correct, q2 wrong, q3 unanswered, q4 correct
    const r = scoreTest(questions, { q1: "A", q2: "C", q4: "D" }, 1, 0.25);
    expect(r.correct).toBe(2);
    expect(r.wrong).toBe(1);
    expect(r.unanswered).toBe(1);
    expect(r.score).toBe(1.75); // 2*1 - 1*0.25
    expect(r.maxScore).toBe(4);
    expect(r.percentage).toBe(43.8); // 1.75/4 = 43.75 -> 43.8
  });

  it("all correct = full marks, no negatives", () => {
    const r = scoreTest(questions, { q1: "A", q2: "B", q3: "C", q4: "D" }, 1, 0.25);
    expect(r.score).toBe(4);
    expect(r.wrong).toBe(0);
    expect(r.percentage).toBe(100);
  });

  it("blank answers map to unanswered (no penalty)", () => {
    const r = scoreTest(questions, {}, 1, 0.25);
    expect(r.unanswered).toBe(4);
    expect(r.score).toBe(0);
  });

  it("per-question review carries chosen + correct", () => {
    const r = scoreTest(questions, { q1: "B" }, 1, 0.25);
    const q1 = r.perQuestion.find((p) => p.id === "q1")!;
    expect(q1.chosen).toBe("B");
    expect(q1.correct).toBe("A");
    expect(q1.isCorrect).toBe(false);
  });
});

describe("publicQuestions", () => {
  it("strips answer and explanation", () => {
    const pub = publicQuestions([Q("q1", "A")]);
    expect(pub[0]).not.toHaveProperty("answer");
    expect(pub[0]).not.toHaveProperty("explanation");
    expect(pub[0].options).toHaveLength(4);
  });
});
