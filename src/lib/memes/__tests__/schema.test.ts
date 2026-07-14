import { describe, it, expect } from "vitest";
import { validateSpec } from "@/lib/memes/schema";
import type { Digest, Template, MemeSpec } from "@/lib/memes/types";

const templates: Template[] = [{
  id: "drake", file: "drake.jpg", width: 1200, height: 1200,
  zones: [
    { id: "reject", x: 0, y: 0, w: 1, h: 1, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 10 },
    { id: "approve", x: 0, y: 0, w: 1, h: 1, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 10 },
  ],
}];
const digest: Digest = { facts: [{ sourceRef: "history-x-0001", subject: "history", subtopic: "x", fact: "F" }], struggleThemes: [] };
const base: MemeSpec = {
  id: "m1", subject: "history", subtopic: "x", template: "drake", lang: "mix",
  zones: { reject: "a", approve: "b" }, caption: "c", tag: "#MPSC", altText: "alt",
};

describe("validateSpec", () => {
  it("accepts a well-formed non-factual spec", () => {
    expect(validateSpec(base, { digest, templates }).ok).toBe(true);
  });
  it("rejects unknown template", () => {
    const r = validateSpec({ ...base, template: "nope" }, { digest, templates });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/template/);
  });
  it("rejects missing zone coverage", () => {
    const r = validateSpec({ ...base, zones: { reject: "a" } }, { digest, templates });
    expect(r.ok).toBe(false);
  });
  it("rejects zone id not on the template", () => {
    const r = validateSpec({ ...base, zones: { reject: "a", approve: "b", ghost: "x" } }, { digest, templates });
    expect(r.ok).toBe(false);
  });
  it("rejects a factual spec whose sourceRef is not in the digest", () => {
    const r = validateSpec({ ...base, factLine: "F", sourceRef: "history-x-9999" }, { digest, templates });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/sourceRef|digest/);
  });
  it("accepts a factual spec with a valid sourceRef", () => {
    expect(validateSpec({ ...base, factLine: "F", sourceRef: "history-x-0001" }, { digest, templates }).ok).toBe(true);
  });
});
