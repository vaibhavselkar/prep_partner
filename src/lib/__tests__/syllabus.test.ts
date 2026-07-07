import { describe, it, expect } from "vitest";
import {
  PRELIMS_SUBJECTS, MAINS_SUBJECTS, ALL_SUBJECTS, SYLLABUS,
  getSubject, getSubtopic, allSubtopicKeys, PRELIMS_TOTAL_MARKS, EXAM_PATTERN,
} from "@/lib/syllabus";

describe("official prelims syllabus", () => {
  it("covers the 8 official prelims subjects", () => {
    const keys = PRELIMS_SUBJECTS.map((s) => s.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "history", "geography", "polity", "current_affairs",
        "science", "economy", "arithmetic", "reasoning",
      ])
    );
    expect(keys.length).toBe(8);
  });

  it("prelims marks sum to 100", () => {
    expect(PRELIMS_TOTAL_MARKS).toBe(100);
  });

  it("SYLLABUS is the prelims paper (drives the mock)", () => {
    expect(SYLLABUS).toBe(PRELIMS_SUBJECTS);
    expect(SYLLABUS.every((s) => s.stage === "prelims")).toBe(true);
  });

  it("every subject has at least one subtopic with unique keys", () => {
    for (const s of ALL_SUBJECTS) {
      expect(s.subtopics.length).toBeGreaterThan(0);
      const ks = s.subtopics.map((t) => t.key);
      expect(new Set(ks).size).toBe(ks.length);
    }
  });
});

describe("mains syllabus", () => {
  it("has Paper 1 language (common) and Paper 2 per post", () => {
    expect(getSubject("mains-marathi")?.paper).toBe(1);
    expect(getSubject("mains-english")?.post).toBe("common");
    expect(getSubject("ii-industry")?.post).toBe("industry-inspector");
    expect(getSubject("ta-insurance")?.post).toBe("technical-assistant");
    expect(MAINS_SUBJECTS.every((s) => s.stage === "mains")).toBe(true);
  });

  it("exposes both posts' Paper-2 subject-specific sections", () => {
    expect(getSubtopic("ta-insurance", "irda")?.key).toBe("irda");
    expect(getSubtopic("ii-industry", "industrial-acts")?.key).toBe("industrial-acts");
  });
});

describe("lookups", () => {
  it("looks up prelims subjects and subtopics", () => {
    expect(getSubject("geography")?.labelEn).toBe("Geography");
    expect(getSubtopic("geography", "maharashtra-geo")?.key).toBe("maharashtra-geo");
    expect(getSubject("nope")).toBeUndefined();
  });

  it("lists all subtopic keys across prelims + mains", () => {
    const all = allSubtopicKeys();
    expect(all.length).toBe(ALL_SUBJECTS.reduce((n, s) => n + s.subtopics.length, 0));
    expect(all[0]).toHaveProperty("subject");
    expect(all[0]).toHaveProperty("subtopic");
  });
});

describe("exam pattern facts (official)", () => {
  it("prelims has negative marking and is for shortlisting only", () => {
    expect(EXAM_PATTERN.prelims.negativeMarking).toBe(0.25);
    expect(EXAM_PATTERN.prelims.questions).toBe(100);
    expect(EXAM_PATTERN.prelims.durationMin).toBe(60);
    expect(EXAM_PATTERN.prelimsForShortlistingOnly).toBe(true);
  });
  it("mains has 2 papers of 100 marks with negative marking", () => {
    expect(EXAM_PATTERN.mains.papers).toBe(2);
    expect(EXAM_PATTERN.mains.marksPerPaper).toBe(100);
    expect(EXAM_PATTERN.mains.negativeMarking).toBe(0.25);
  });
});
