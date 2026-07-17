import { describe, it, expect } from "vitest";
import { notesForTopic } from "@/lib/shikvani/topicNotes";

describe("notesForTopic", () => {
  it("returns non-empty notes for a subtopic that has a notes file", () => {
    const txt = notesForTopic("history", "ancient-medieval");
    expect(txt.length).toBeGreaterThan(50);
  });
  it("returns empty string for a missing notes file", () => {
    expect(notesForTopic("history", "no-such-subtopic")).toBe("");
  });
});
