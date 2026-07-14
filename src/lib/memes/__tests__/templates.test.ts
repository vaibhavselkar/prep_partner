import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { loadTemplates, getTemplate } from "@/lib/memes/templates";

describe("loadTemplates", () => {
  const tpls = loadTemplates();
  it("loads at least 6 templates", () => {
    expect(tpls.length).toBeGreaterThanOrEqual(6);
  });
  it("every template image exists on disk", () => {
    for (const t of tpls) expect(existsSync(`assets/memes/templates/${t.file}`)).toBe(true);
  });
  it("every zone has complete geometry", () => {
    for (const t of tpls) for (const z of t.zones) {
      for (const k of ["x", "y", "w", "h", "fontSize"] as const) expect(typeof z[k]).toBe("number");
    }
  });
  it("getTemplate returns by id and throws on unknown", () => {
    expect(getTemplate("drake").id).toBe("drake");
    expect(() => getTemplate("nope")).toThrow();
  });
});
