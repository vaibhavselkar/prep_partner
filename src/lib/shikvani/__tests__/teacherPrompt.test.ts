import { describe, it, expect } from "vitest";
import { buildTeacherPrompt } from "@/lib/shikvani/teacherPrompt";

describe("buildTeacherPrompt", () => {
  const p = buildTeacherPrompt({
    topic: { mr: "सिंधू संस्कृती", en: "Indus Valley", subject: "history" },
    notes: "The Great Bath was at Mohenjo-daro.",
  });
  it("includes the topic, notes, and the teaching rules", () => {
    expect(p).toContain("सिंधू संस्कृती");
    expect(p).toContain("Great Bath");
    expect(p).toMatch(/story|गोष्ट|गोष्टी/i);          // storytelling
    expect(p).toMatch(/समजलं का|understood/i);          // understanding-check
    expect(p).toMatch(/CONTROL:/);                       // control-tag contract
    expect(p).toMatch(/only.*notes|फक्त.*नोट्स/i);       // facts-only rule
  });
});
