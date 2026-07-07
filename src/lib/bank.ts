import type { BankQuestion, BankManifest } from "@/types";
import bundle from "@/data/bank/_bundle.json";
import manifest from "@/data/bank/manifest.json";

export interface SampleOpts {
  subject?: string; subtopic?: string; difficulty?: string;
  language?: string; count: number; excludeIds?: string[]; seed?: number;
}

// Mulberry32 deterministic PRNG.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  const rand = rng(seed);
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function matches(q: BankQuestion, o: SampleOpts, useSubtopic: boolean): boolean {
  if (o.subject && q.subject !== o.subject) return false;
  if (useSubtopic && o.subtopic && q.subtopic !== o.subtopic) return false;
  if (o.difficulty && q.difficulty !== o.difficulty) return false;
  if (o.language && o.language !== "bilingual" && q.language !== o.language && q.language !== "bilingual") return false;
  return true;
}

export function sampleFrom(questions: BankQuestion[], opts: SampleOpts): BankQuestion[] {
  const exclude = new Set(opts.excludeIds ?? []);
  const seed = opts.seed ?? 1;
  const pool = questions.filter((q) => !exclude.has(q.id));

  let filtered = pool.filter((q) => matches(q, opts, true));
  if (filtered.length < opts.count) {
    // broaden: drop subtopic constraint
    filtered = pool.filter((q) => matches(q, opts, false));
  }
  return shuffle(filtered, seed).slice(0, opts.count);
}

export function getAllQuestions(): BankQuestion[] {
  return bundle as BankQuestion[];
}
export function getManifest(): BankManifest {
  return manifest as BankManifest;
}
export function sample(opts: SampleOpts): BankQuestion[] {
  return sampleFrom(getAllQuestions(), opts);
}
