import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Digest, FactAtom } from "@/lib/memes/types";

interface BankQ { id: string; subject: string; subtopic: string; explanation: string; }

function readBank(root = "src/data/bank"): BankQ[] {
  const out: BankQ[] = [];
  for (const sub of readdirSync(root, { withFileTypes: true })) {
    if (!sub.isDirectory()) continue;
    const dir = join(root, sub.name);
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      const arr = JSON.parse(readFileSync(join(dir, f), "utf8")) as BankQ[];
      out.push(...arr);
    }
  }
  return out;
}

// Deterministic seeded shuffle (mulberry32) so batches vary but tests can pin a seed.
function shuffle<T>(arr: T[], seed: number): T[] {
  let a = seed >>> 0;
  const rng = () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
  return copy;
}

export function gatherDigest(opts: { subject?: string; maxFacts?: number; seed?: number } = {}): Digest {
  const { subject, maxFacts = 40, seed = 1 } = opts;
  let bank = readBank();
  if (subject) bank = bank.filter((q) => q.subject === subject);
  const facts: FactAtom[] = shuffle(bank, seed)
    .filter((q) => q.explanation && q.explanation.trim().length > 0)
    .slice(0, maxFacts)
    .map((q) => ({ sourceRef: q.id, subject: q.subject, subtopic: q.subtopic, fact: q.explanation.trim() }));
  const struggleThemes = [...new Set(bank.map((q) => q.subtopic))].slice(0, 12);
  return { facts, struggleThemes };
}
