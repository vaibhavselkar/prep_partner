import { describe, it, expect } from "vitest";
import { gatherDigest } from "@/lib/memes/gather";

describe("gatherDigest", () => {
  it("returns fact atoms sourced from the real bank", () => {
    const d = gatherDigest({ maxFacts: 10 });
    expect(d.facts.length).toBeGreaterThan(0);
    expect(d.facts.length).toBeLessThanOrEqual(10);
    for (const f of d.facts) {
      expect(f.sourceRef).toMatch(/-\d{4}$/);
      expect(f.fact.length).toBeGreaterThan(0);
    }
  });
  it("filters by subject", () => {
    const d = gatherDigest({ subject: "history", maxFacts: 20 });
    for (const f of d.facts) expect(f.subject).toBe("history");
  });
  it("surfaces struggle themes", () => {
    expect(gatherDigest().struggleThemes.length).toBeGreaterThan(0);
  });
});
