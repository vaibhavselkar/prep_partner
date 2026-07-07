import { describe, it, expect } from "vitest";
import { sampleFrom, getAllQuestions, getManifest } from "@/lib/bank";
import type { BankQuestion } from "@/types";

const Q = (over: Partial<BankQuestion>): BankQuestion => ({
  id: "x", subject: "gk", subtopic: "mh-geography", difficulty: "easy",
  language: "bilingual", question: "q", options: ["A", "B", "C", "D"],
  answer: "A", explanation: "e", tags: [], verifiedAt: "2026-07-07", ...over,
});

describe("sampleFrom", () => {
  const pool = Array.from({ length: 20 }, (_, i) => Q({ id: `id-${i}` }));

  it("returns exactly count when enough exist", () => {
    expect(sampleFrom(pool, { count: 5 })).toHaveLength(5);
  });
  it("is deterministic for a fixed seed", () => {
    const a = sampleFrom(pool, { count: 5, seed: 42 }).map((q) => q.id);
    const b = sampleFrom(pool, { count: 5, seed: 42 }).map((q) => q.id);
    expect(a).toEqual(b);
  });
  it("excludes ids", () => {
    const res = sampleFrom(pool, { count: 20, excludeIds: ["id-0", "id-1"] });
    expect(res.map((q) => q.id)).not.toContain("id-0");
    expect(res).toHaveLength(18);
  });
  it("filters by subtopic then broadens to subject when too few", () => {
    const mixed = [
      Q({ id: "a", subject: "gk", subtopic: "mh-history" }),
      Q({ id: "b", subject: "gk", subtopic: "mh-geography" }),
      Q({ id: "c", subject: "gk", subtopic: "mh-geography" }),
    ];
    const res = sampleFrom(mixed, { subject: "gk", subtopic: "mh-history", count: 3 });
    expect(res.length).toBe(3); // broadened to subject
  });
  it("english filter still allows bilingual questions", () => {
    const langs = [Q({ id: "e", language: "english" }), Q({ id: "bi", language: "bilingual" })];
    const res = sampleFrom(langs, { language: "english", count: 5 });
    expect(res.map((q) => q.id).sort()).toEqual(["bi", "e"]);
  });
});

describe("shipped bank integrity (guards content commits)", () => {
  it("every shipped question has 4 options, valid answer, unique id", () => {
    const all = getAllQuestions();
    const ids = new Set<string>();
    for (const q of all) {
      expect(q.options).toHaveLength(4);
      expect(["A", "B", "C", "D"]).toContain(q.answer);
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);
    }
  });
  it("manifest total matches bundle length", () => {
    expect(getManifest().total).toBe(getAllQuestions().length);
  });
});
