import { describe, it, expect } from "vitest";
import type { MemeSpec, MemeRecord } from "@/lib/memes/types";

describe("meme types", () => {
  it("a MemeRecord is a MemeSpec plus lifecycle fields", () => {
    const spec: MemeSpec = {
      id: "history-x-0001-drake", subject: "history", subtopic: "x",
      template: "drake", lang: "mix", zones: { reject: "a", approve: "b" },
      caption: "c", tag: "#MPSC", altText: "alt",
    };
    const rec: MemeRecord = { ...spec, file: "x.png", status: "pending", createdAt: "2026-07-14", reviewedAt: null };
    expect(rec.status).toBe("pending");
    expect(rec.template).toBe("drake");
  });
});
