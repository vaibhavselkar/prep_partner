import { describe, it, expect } from "vitest";
import { orderedTopics, nextTopic } from "@/lib/shikvani/curriculum";

describe("orderedTopics", () => {
  const topics = orderedTopics();
  it("returns a non-empty, unique, ordered list with context", () => {
    expect(topics.length).toBeGreaterThan(20);
    const ids = topics.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length); // unique
    for (const t of topics) {
      expect(t.subject).toBeTruthy();
      expect(t.subtopic).toBeTruthy();
      expect(t.mr).toBeTruthy();
    }
  });
  it("starts with the first prelims subject (history)", () => {
    expect(topics[0].subject).toBe("history");
  });
});

describe("nextTopic", () => {
  it("returns the first not-done topic", () => {
    const all = orderedTopics();
    const done = new Set([all[0].id, all[1].id]);
    expect(nextTopic(done)!.id).toBe(all[2].id);
  });
  it("returns null when all done", () => {
    const done = new Set(orderedTopics().map((t) => t.id));
    expect(nextTopic(done)).toBeNull();
  });
});
