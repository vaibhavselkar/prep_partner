import { describe, it, expect } from "vitest";
import { existsSync, statSync, readFileSync, mkdirSync } from "node:fs";
import { renderMeme } from "../render.ts";
import { getTemplate } from "@/lib/memes/templates";
import type { MemeSpec } from "@/lib/memes/types";

const hasChromium = existsSync("node_modules/playwright") && existsSync("assets/memes/templates/drake.jpg");
const maybe = hasChromium ? it : it.skip;

describe("renderMeme smoke", () => {
  maybe("renders a valid PNG", async () => {
    mkdirSync("memes/out/_test", { recursive: true });
    const tpl = getTemplate("drake");
    const spec: MemeSpec = { id: "smoke", subject: "s", subtopic: "t", template: "drake", lang: "mix",
      zones: { reject: "रट्टा", approve: "roj practice" }, caption: "c", tag: "#x", altText: "a" };
    const out = "memes/out/_test/smoke.png";
    await renderMeme(spec, tpl, out);
    expect(existsSync(out)).toBe(true);
    expect(statSync(out).size).toBeGreaterThan(1000);
    const magic = readFileSync(out).subarray(0, 4);
    expect([...magic]).toEqual([0x89, 0x50, 0x4e, 0x47]); // PNG magic
  }, 60000);
});
