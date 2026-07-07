import { describe, it, expect } from "vitest";
import { applyQuizResult, weakestTopics } from "@/lib/stats";
import type { TopicStat } from "@/types";

describe("applyQuizResult", () => {
  it("creates and updates stats", () => {
    let s: TopicStat[] = [];
    s = applyQuizResult(s, [
      { subject: "gk", subtopic: "mh-geography", correct: true },
      { subject: "gk", subtopic: "mh-geography", correct: false },
    ], "2026-07-07");
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ attempts: 2, correct: 1, lastPracticed: "2026-07-07" });
  });
  it("accumulates across calls", () => {
    let s: TopicStat[] = [{ subject: "gk", subtopic: "x", attempts: 1, correct: 1, lastPracticed: "2026-07-01" }];
    s = applyQuizResult(s, [{ subject: "gk", subtopic: "x", correct: false }], "2026-07-07");
    expect(s[0]).toMatchObject({ attempts: 2, correct: 1 });
  });
});

describe("weakestTopics", () => {
  it("ranks by accuracy, needs >=3 attempts", () => {
    const s: TopicStat[] = [
      { subject: "a", subtopic: "1", attempts: 10, correct: 2, lastPracticed: "" }, // 20%
      { subject: "b", subtopic: "2", attempts: 10, correct: 9, lastPracticed: "" }, // 90%
      { subject: "c", subtopic: "3", attempts: 2, correct: 0, lastPracticed: "" },  // excluded (<3)
    ];
    const w = weakestTopics(s, 5);
    expect(w.map((t) => t.subtopic)).toEqual(["1", "2"]);
  });
});
