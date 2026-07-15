// scripts/memes/make-memes.ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { gatherDigest } from "../../src/lib/memes/gather.ts";
import { loadTemplates, getTemplate } from "../../src/lib/memes/templates.ts";
import { authorSpecs } from "./author.ts";
import { renderMeme } from "./render.ts";
import { mergeManifest } from "../../src/lib/memes/manifest.ts";
import type { MemeRecord, MemeSpec } from "../../src/lib/memes/types.ts";

export function assembleBatch(specs: MemeSpec[], date: string): MemeRecord[] {
  return specs.map((s) => ({ ...s, file: `${s.id}.png`, status: "pending", createdAt: date, reviewedAt: null }));
}

function arg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}

async function main() {
  const count = Number(arg("count", "20"));
  const subject = arg("subject");
  const langMix = arg("lang", "balanced")!;
  const date = arg("date") ?? new Date().toISOString().slice(0, 10);

  const digest = gatherDigest({ subject, maxFacts: 40 });
  const templates = loadTemplates();
  const specs = await authorSpecs({ digest, templates, count, langMix });
  console.log(`[make] authored ${specs.length} valid specs`);

  const outDir = join("memes", "out", date);
  await mkdir(outDir, { recursive: true });
  const records = assembleBatch(specs, date);

  let made = 0, skipped = 0;
  for (const rec of records) {
    try { await renderMeme(rec, getTemplate(rec.template), join(outDir, rec.file)); made++; }
    catch (e) { skipped++; console.warn(`[make] render failed for ${rec.id}:`, e); }
  }

  const manifestPath = join(outDir, "manifest.json");
  const existing: MemeRecord[] = existsSync(manifestPath) ? JSON.parse(await readFile(manifestPath, "utf8")) : [];
  await writeFile(manifestPath, JSON.stringify(mergeManifest(existing, records), null, 2));
  console.log(`[make] done: ${made} rendered, ${skipped} skipped -> ${manifestPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
