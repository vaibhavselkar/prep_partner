import { describe, it, expect, vi } from "vitest";
import { authorSpecs } from "../../../../scripts/memes/author.ts";
import type { Digest, Template } from "@/lib/memes/types";

const digest: Digest = { facts: [{ sourceRef: "history-x-0001", subject: "history", subtopic: "x", fact: "F" }], struggleThemes: ["x"] };
const templates: Template[] = [{ id: "drake", file: "d.jpg", width: 1, height: 1, zones: [
  { id: "reject", x: 0, y: 0, w: 1, h: 1, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 10 },
  { id: "approve", x: 0, y: 0, w: 1, h: 1, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 10 },
]}];
const good = JSON.stringify([{ id: "m1", subject: "history", subtopic: "x", template: "drake", lang: "mix", zones: { reject: "a", approve: "b" }, caption: "c", tag: "#MPSC", altText: "alt" }]);

describe("authorSpecs", () => {
  it("returns valid specs from the runner", async () => {
    const run = vi.fn().mockResolvedValue(good);
    const specs = await authorSpecs({ digest, templates, count: 1, langMix: "balanced" }, run);
    expect(specs).toHaveLength(1);
    expect(run).toHaveBeenCalledTimes(1);
  });
  it("retries once on invalid output then succeeds", async () => {
    const run = vi.fn().mockResolvedValueOnce("garbage").mockResolvedValueOnce(good);
    const specs = await authorSpecs({ digest, templates, count: 1, langMix: "balanced" }, run);
    expect(specs).toHaveLength(1);
    expect(run).toHaveBeenCalledTimes(2);
  });
  it("returns [] if both attempts fail", async () => {
    const run = vi.fn().mockResolvedValue("garbage");
    const specs = await authorSpecs({ digest, templates, count: 1, langMix: "balanced" }, run);
    expect(specs).toEqual([]);
    expect(run).toHaveBeenCalledTimes(2);
  });
});
