import { describe, it, expect } from "vitest";
import { buildAuthorPrompt } from "@/lib/memes/prompt";
import { parseSpecs } from "@/lib/memes/parse";
import type { Digest, Template } from "@/lib/memes/types";

const digest: Digest = { facts: [{ sourceRef: "history-x-0001", subject: "history", subtopic: "x", fact: "The Great Bath was at Mohenjo-daro." }], struggleThemes: ["polity"] };
const templates: Template[] = [{ id: "drake", file: "d.jpg", width: 1, height: 1, zones: [{ id: "reject", x: 0, y: 0, w: 1, h: 1, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 10 }, { id: "approve", x: 0, y: 0, w: 1, h: 1, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 10 }] }];

describe("buildAuthorPrompt", () => {
  const p = buildAuthorPrompt({ digest, templates, count: 5, langMix: "balanced" });
  it("includes fact + sourceRef, template + zone ids, trust rule, count", () => {
    expect(p).toContain("history-x-0001");
    expect(p).toContain("Mohenjo-daro");
    expect(p).toContain("drake");
    expect(p).toContain("reject");
    expect(p).toMatch(/only.*facts.*digest/i);
    expect(p).toContain("5");
  });
});

describe("parseSpecs", () => {
  it("extracts a fenced JSON array", () => {
    const txt = "Here you go:\n```json\n[{\"id\":\"a\"}]\n```\nDone.";
    expect(parseSpecs(txt)).toEqual([{ id: "a" }]);
  });
  it("extracts a bare JSON array", () => {
    expect(parseSpecs('[{"id":"b"}]')).toEqual([{ id: "b" }]);
  });
  it("throws on no array", () => {
    expect(() => parseSpecs("no json here")).toThrow();
  });
});
