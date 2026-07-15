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
