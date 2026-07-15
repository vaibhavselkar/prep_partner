import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export type MemeReviewStatus = "pending" | "approved" | "rejected";

export interface MemeReviewRecord {
  id: string;
  file: string;
  subject: string;
  subtopic: string;
  template: string;
  lang: string;
  kind: "factual" | "relatable";
  sourceRef?: string;
  caption: string;
  status: MemeReviewStatus;
  createdAt: string;
  reviewedAt: string | null;
}

const MANIFEST_PATH = join(process.cwd(), "data", "memes-manifest.json");

export async function readMemes(): Promise<MemeReviewRecord[]> {
  try {
    return JSON.parse(await readFile(MANIFEST_PATH, "utf8")) as MemeReviewRecord[];
  } catch {
    return [];
  }
}

export async function setMemeStatus(
  id: string,
  status: MemeReviewStatus,
  reviewedAt: string,
): Promise<MemeReviewRecord[]> {
  const memes = await readMemes();
  const next = memes.map((m) => (m.id === id ? { ...m, status, reviewedAt } : m));
  await writeFile(MANIFEST_PATH, JSON.stringify(next, null, 2));
  return next;
}

/** Shape of a generated meme record (subset of the engine's MemeRecord). */
export interface GeneratedMeme {
  id: string;
  file: string;
  subject: string;
  subtopic: string;
  template: string;
  lang: string;
  caption: string;
  sourceRef?: string;
  factLine?: string;
  createdAt: string;
}

/** Map an engine-generated meme into a pending review record. */
export function toReviewRecord(m: GeneratedMeme): MemeReviewRecord {
  return {
    id: m.id,
    file: m.file,
    subject: m.subject,
    subtopic: m.subtopic,
    template: m.template,
    lang: m.lang,
    kind: m.factLine || m.sourceRef ? "factual" : "relatable",
    sourceRef: m.sourceRef,
    caption: m.caption,
    status: "pending",
    createdAt: m.createdAt,
    reviewedAt: null,
  };
}

/** Add new review records by id, preserving existing records' status/reviewedAt. */
export async function mergeReviewRecords(incoming: MemeReviewRecord[]): Promise<MemeReviewRecord[]> {
  const existing = await readMemes();
  const byId = new Map(existing.map((m) => [m.id, m]));
  for (const r of incoming) if (!byId.has(r.id)) byId.set(r.id, r);
  const next = [...byId.values()];
  await writeFile(MANIFEST_PATH, JSON.stringify(next, null, 2));
  return next;
}
