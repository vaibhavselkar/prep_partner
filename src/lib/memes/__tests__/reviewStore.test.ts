import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { readMemes, setMemeStatus, toReviewRecord } from "@/lib/memes/reviewStore";

const MANIFEST_PATH = join(process.cwd(), "data", "memes-manifest.json");

describe("readMemes", () => {
  it("resolves to an array", async () => {
    const memes = await readMemes();
    expect(Array.isArray(memes)).toBe(true);
  });
});

describe("toReviewRecord", () => {
  const base = {
    id: "x",
    file: "x.png",
    subject: "history",
    subtopic: "ancient-medieval",
    template: "drake",
    lang: "mix",
    caption: "c",
    createdAt: "2026-07-15",
  };

  it("maps factLine presence to kind: factual", () => {
    const rec = toReviewRecord({ ...base, factLine: "some fact" });
    expect(rec.kind).toBe("factual");
  });

  it("maps sourceRef presence to kind: factual", () => {
    const rec = toReviewRecord({ ...base, sourceRef: "ref-0001" });
    expect(rec.kind).toBe("factual");
  });

  it("maps absence of factLine/sourceRef to kind: relatable", () => {
    const rec = toReviewRecord({ ...base });
    expect(rec.kind).toBe("relatable");
  });
});

describe("setMemeStatus concurrency", () => {
  let originalRaw: string;

  beforeAll(async () => {
    originalRaw = await readFile(MANIFEST_PATH, "utf8");
    const seeded = [
      {
        id: "concurrent-a",
        file: "a.png",
        subject: "history",
        subtopic: "t",
        template: "drake",
        lang: "mix",
        kind: "relatable" as const,
        caption: "a",
        status: "pending" as const,
        createdAt: "2026-07-15",
        reviewedAt: null,
      },
      {
        id: "concurrent-b",
        file: "b.png",
        subject: "history",
        subtopic: "t",
        template: "drake",
        lang: "mix",
        kind: "relatable" as const,
        caption: "b",
        status: "pending" as const,
        createdAt: "2026-07-15",
        reviewedAt: null,
      },
    ];
    await writeFile(MANIFEST_PATH, JSON.stringify(seeded, null, 2));
  });

  afterAll(async () => {
    await writeFile(MANIFEST_PATH, originalRaw);
  });

  it("persists both decisions when two calls overlap", async () => {
    await Promise.all([
      setMemeStatus("concurrent-a", "approved", "2026-07-15"),
      setMemeStatus("concurrent-b", "rejected", "2026-07-15"),
    ]);

    const memes = await readMemes();
    const a = memes.find((m) => m.id === "concurrent-a");
    const b = memes.find((m) => m.id === "concurrent-b");
    expect(a?.status).toBe("approved");
    expect(b?.status).toBe("rejected");
  });
});
