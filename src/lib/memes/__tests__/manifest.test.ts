import { describe, it, expect } from "vitest";
import { mergeManifest, setStatus } from "@/lib/memes/manifest";
import type { MemeRecord } from "@/lib/memes/types";

const rec = (id: string, status: MemeRecord["status"]): MemeRecord => ({
  id, subject: "s", subtopic: "t", template: "drake", lang: "mix", zones: {}, caption: "c",
  tag: "#x", altText: "a", file: `${id}.png`, status, createdAt: "2026-07-14", reviewedAt: null,
});

describe("mergeManifest", () => {
  it("adds new records and preserves existing statuses", () => {
    const existing = [rec("a", "approved")];
    const incoming = [rec("a", "pending"), rec("b", "pending")];
    const merged = mergeManifest(existing, incoming);
    expect(merged.find((r) => r.id === "a")!.status).toBe("approved");
    expect(merged.find((r) => r.id === "b")!.status).toBe("pending");
    expect(merged).toHaveLength(2);
  });
});

describe("setStatus", () => {
  it("updates status + reviewedAt for one id", () => {
    const out = setStatus([rec("a", "pending")], "a", "approved", "2026-07-14");
    expect(out[0].status).toBe("approved");
    expect(out[0].reviewedAt).toBe("2026-07-14");
  });
});
