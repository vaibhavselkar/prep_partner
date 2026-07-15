import { describe, it, expect } from "vitest";
import { assembleBatch } from "../make-memes.ts";
import type { MemeSpec } from "@/lib/memes/types";

const spec: MemeSpec = { id: "m1", subject: "s", subtopic: "t", template: "drake", lang: "mix",
  zones: { reject: "a", approve: "b" }, caption: "c", tag: "#x", altText: "alt" };

describe("assembleBatch", () => {
  it("wraps specs into pending records with file + date", () => {
    const recs = assembleBatch([spec], "2026-07-14");
    expect(recs[0].status).toBe("pending");
    expect(recs[0].file).toBe("m1.png");
    expect(recs[0].createdAt).toBe("2026-07-14");
    expect(recs[0].reviewedAt).toBeNull();
  });
});
