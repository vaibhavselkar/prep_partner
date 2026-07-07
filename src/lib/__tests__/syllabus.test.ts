import { describe, it, expect } from "vitest";
import { SYLLABUS, getSubject, getSubtopic, allSubtopicKeys, PRELIMS_TOTAL_MARKS } from "@/lib/syllabus";

describe("syllabus", () => {
  it("covers the 6 prelims subjects", () => {
    const keys = SYLLABUS.map((s) => s.key);
    expect(keys).toEqual(
      expect.arrayContaining(["marathi", "english", "gk", "aptitude", "science", "current_affairs"])
    );
  });
  it("prelims marks sum to 100", () => {
    expect(PRELIMS_TOTAL_MARKS).toBe(100);
  });
  it("every subject has at least one subtopic with unique keys", () => {
    for (const s of SYLLABUS) {
      expect(s.subtopics.length).toBeGreaterThan(0);
      const ks = s.subtopics.map((t) => t.key);
      expect(new Set(ks).size).toBe(ks.length);
    }
  });
  it("looks up subjects and subtopics", () => {
    expect(getSubject("gk")?.labelEn).toBe("General Knowledge");
    expect(getSubtopic("gk", "mh-geography")?.key).toBe("mh-geography");
    expect(getSubject("nope")).toBeUndefined();
  });
  it("lists all subtopic keys", () => {
    const all = allSubtopicKeys();
    expect(all.length).toBe(SYLLABUS.reduce((n, s) => n + s.subtopics.length, 0));
    expect(all[0]).toHaveProperty("subject");
    expect(all[0]).toHaveProperty("subtopic");
  });
});
