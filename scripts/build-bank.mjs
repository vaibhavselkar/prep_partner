import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

const BANK_DIR = "src/data/bank";
const VALID_ANSWERS = new Set(["A", "B", "C", "D"]);

async function collectFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir)) {
    if (entry.startsWith("_") || entry === "manifest.json") continue;
    const full = join(dir, entry);
    if ((await stat(full)).isDirectory()) out.push(...(await collectFiles(full)));
    else if (entry.endsWith(".json")) out.push(full);
  }
  return out;
}

function validate(q, file, seenIds) {
  const errs = [];
  if (!q.id) errs.push("missing id");
  if (seenIds.has(q.id)) errs.push(`duplicate id ${q.id}`);
  if (!Array.isArray(q.options) || q.options.length !== 4) errs.push("must have exactly 4 options");
  if (!VALID_ANSWERS.has(q.answer)) errs.push(`answer must be A-D, got ${q.answer}`);
  if (!q.subject || !q.subtopic) errs.push("missing subject/subtopic");
  if (errs.length) throw new Error(`${file} [${q.id}]: ${errs.join("; ")}`);
  seenIds.add(q.id);
}

const files = await collectFiles(BANK_DIR);
const all = [];
const seenIds = new Set();
for (const file of files) {
  const arr = JSON.parse(await readFile(file, "utf-8"));
  for (const q of arr) { validate(q, file, seenIds); all.push(q); }
}

const bySubject = {};
const bySubtopic = {};
for (const q of all) {
  bySubject[q.subject] = (bySubject[q.subject] ?? 0) + 1;
  const k = `${q.subject}/${q.subtopic}`;
  bySubtopic[k] = (bySubtopic[k] ?? 0) + 1;
}

// Deterministic timestamp: the newest verifiedAt across all questions, so re-running the
// build without content changes doesn't dirty git. BANK_BUILD_DATE env override still wins.
const maxVerifiedAt = all.reduce((max, q) => (q.verifiedAt && q.verifiedAt > max ? q.verifiedAt : max), "1970-01-01");
const generatedAt = process.env.BANK_BUILD_DATE ?? maxVerifiedAt;

await writeFile(join(BANK_DIR, "_bundle.json"), JSON.stringify(all), "utf-8");
await writeFile(
  join(BANK_DIR, "manifest.json"),
  JSON.stringify({ generatedAt, total: all.length, bySubject, bySubtopic }, null, 2),
  "utf-8"
);
console.log(`build-bank: ${all.length} questions from ${files.length} files`);
