import type { MemeRecord, MemeStatus } from "@/lib/memes/types";

export function mergeManifest(existing: MemeRecord[], incoming: MemeRecord[]): MemeRecord[] {
  const byId = new Map(existing.map((r) => [r.id, r]));
  for (const r of incoming) if (!byId.has(r.id)) byId.set(r.id, r);
  return [...byId.values()];
}

export function setStatus(m: MemeRecord[], id: string, status: MemeStatus, reviewedAt: string): MemeRecord[] {
  return m.map((r) => (r.id === id ? { ...r, status, reviewedAt } : r));
}
