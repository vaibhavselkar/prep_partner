import { describe, it, expect } from "vitest";
import { buildDailyPlan, orderedPrelimsItems, dayIndexFrom, PLAN_DAYS } from "@/lib/dailyPlan";

describe("buildDailyPlan", () => {
  it("splits into exactly PLAN_DAYS buckets", () => {
    expect(buildDailyPlan()).toHaveLength(PLAN_DAYS);
  });

  it("covers every Prelims topic exactly once, no duplicates", () => {
    const all = orderedPrelimsItems();
    const flat = buildDailyPlan().flat();
    expect(flat).toHaveLength(all.length);
    const ids = flat.map((i) => i.topic.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every day at least one topic (there are far more than 30 topics)", () => {
    for (const bucket of buildDailyPlan()) {
      expect(bucket.length).toBeGreaterThan(0);
    }
  });

  it("only includes Prelims subjects (not Mains language)", () => {
    const subjects = new Set(orderedPrelimsItems().map((i) => i.subject));
    expect(subjects.has("mains-marathi")).toBe(false);
    expect(subjects.has("mains-english")).toBe(false);
    expect(subjects.has("history")).toBe(true);
  });
});

describe("dayIndexFrom", () => {
  it("is day 1 on the start date", () => {
    expect(dayIndexFrom("2026-07-10", new Date(2026, 6, 10))).toBe(1);
  });
  it("advances one per day", () => {
    expect(dayIndexFrom("2026-07-10", new Date(2026, 6, 15))).toBe(6);
  });
  it("clamps to PLAN_DAYS at the end", () => {
    expect(dayIndexFrom("2026-07-10", new Date(2026, 8, 30))).toBe(PLAN_DAYS);
  });
  it("never goes below 1", () => {
    expect(dayIndexFrom("2026-07-10", new Date(2026, 6, 1))).toBe(1);
  });
});
