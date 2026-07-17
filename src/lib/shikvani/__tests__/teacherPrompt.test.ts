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
    expect(p).toMatch(/समजलं का|make sense|understood/i); // understanding-check
    expect(p).toMatch(/CONTROL:/);                       // control-tag contract
    expect(p).toMatch(/only.*notes|फक्त.*नोट्स/i);       // facts-only rule
  });

  it("teaches in English when language is 'en'", () => {
    const en = buildTeacherPrompt({
      topic: { mr: "सिंधू संस्कृती", en: "Indus Valley", subject: "history" },
      notes: "x",
      language: "en",
    });
    expect(en).toMatch(/Teach in clear, simple English/);
    expect(en).toMatch(/make sense/i);
  });

  it("teaches in Marathi when language is 'mr'", () => {
    const mr = buildTeacherPrompt({
      topic: { mr: "सिंधू संस्कृती", en: "Indus Valley", subject: "history" },
      notes: "x",
      language: "mr",
    });
    expect(mr).toMatch(/Teach in natural Marathi/);
  });
});
