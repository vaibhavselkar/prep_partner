import { describe, it, expect } from "vitest";
import { composeHtml } from "@/lib/memes/compose";
import type { MemeSpec, Template } from "@/lib/memes/types";

const tpl: Template = {
  id: "drake", file: "drake.jpg", width: 1200, height: 1200,
  zones: [
    { id: "reject", x: 640, y: 20, w: 520, h: 520, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 52 },
    { id: "approve", x: 640, y: 620, w: 520, h: 520, align: "center", valign: "center", color: "#111", style: "impact", fontSize: 52 },
  ],
};
const spec: MemeSpec = {
  id: "m1", subject: "history", subtopic: "x", template: "drake", lang: "mix",
  zones: { reject: "रोज अभ्यास", approve: "daily study" }, caption: "c", tag: "#MPSC", altText: "alt",
};

describe("composeHtml", () => {
  const html = composeHtml(spec, tpl, { imageBaseUrl: "http://localhost:9999" });
  it("references the template image", () => {
    expect(html).toContain("http://localhost:9999/drake.jpg");
  });
  it("keeps Devanagari text intact", () => {
    expect(html).toContain("रोज अभ्यास");
  });
  it("positions zones by geometry", () => {
    expect(html).toContain("left:640px");
    expect(html).toContain("top:620px");
  });
  it("upper-cases impact zones", () => {
    expect(html).toMatch(/text-transform:\s*uppercase/);
  });
  it("escapes HTML in zone text", () => {
    const h = composeHtml({ ...spec, zones: { reject: "<b>x</b>", approve: "y" } }, tpl, { imageBaseUrl: "http://x" });
    expect(h).toContain("&lt;b&gt;x&lt;/b&gt;");
  });
});
