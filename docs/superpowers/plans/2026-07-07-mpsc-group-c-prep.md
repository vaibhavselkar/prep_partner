# MPSC Combined Group-C Prep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `/technical-sahayak` page exam-ready for the Combined MPSC Group-C prelims by shipping a pre-built verified question bank + study notes, adding full-length mock tests, and adding progress / weak-area tracking.

**Architecture:** A verified question bank lives as per-subtopic JSON files (source of truth) that a build script flattens into a bundler-safe `_bundle.json` + `manifest.json`; the runtime imports these statically. Pure-logic modules (`syllabus`, `bank`, `mock`, `stats`) hold all sampling/scoring/aggregation logic and are unit-tested with Vitest. New API routes serve bank quizzes, mock assembly, reports, and MPSC-specific progress, all reusing the existing dual-mode (Neon ↔ flat-file) persistence.

**Tech Stack:** Next.js 14 App Router, TypeScript (strict), Tailwind, Groq SDK (`llama-3.3-70b-versatile`), Neon serverless Postgres, Vitest (new), Node `fs` build script.

## Global Constraints

- Next.js version: `14.2.5`. React `^18`. TypeScript `strict: true`. Do not upgrade.
- Path alias: `@/*` → `./src/*` (tsconfig `paths`). Use it in all imports.
- All new API routes that touch `fs`, `crypto`, or the bank use `export const runtime = "nodejs";`.
- Persistence MUST follow the existing dual-mode pattern in `src/lib/dataStore.ts`: use Neon when `process.env.DATABASE_URL` is set, else flat files under `data/`. Never assume a DB exists.
- The runtime app MUST read bank content only from generated `src/data/bank/_bundle.json` and `src/data/bank/manifest.json` (static imports), never by `fs`-walking the per-subtopic tree — that tree is not reliably present in the Vercel serverless bundle.
- Bilingual UI copy convention (from existing code): Marathi (Devanagari, class `font-devanagari`) plus English. Match existing Tailwind tokens: `bg-bg`, `bg-bg-card`, `bg-bg-hover`, `primary-*`, `border-gray-700/50`.
- The content-generation Workflow (Task 7) is a developer tool run via the Claude Workflow harness. It is NOT imported by or callable from the deployed app.
- Question answer field is exactly one of `"A" | "B" | "C" | "D"`; every question has exactly 4 options.
- Commit after every task. Use conventional-commit prefixes (`feat:`, `test:`, `chore:`, `docs:`).

---

## File Structure

**New files:**
- `vitest.config.ts` — test runner config with `@/` alias.
- `src/lib/syllabus.ts` — canonical subject/subtopic keys, bilingual labels, prelims weightage.
- `src/lib/bank.ts` — pure sampling/query functions over a question array + bundle-backed wrappers.
- `src/lib/mock.ts` — pure mock assembly + scoring.
- `src/lib/stats.ts` — pure topic-stat aggregation.
- `src/data/bank/<subject>/<subtopic>.json` — verified questions (source of truth).
- `src/data/bank/_bundle.json` — generated flat array of all questions (bundler-safe).
- `src/data/bank/manifest.json` — generated coverage index.
- `src/data/notes/<subject>/<subtopic>.md` — study notes.
- `src/data/notes/index.json` — generated notes index.
- `scripts/build-bank.mjs` — validates per-subtopic files, writes `_bundle.json` + `manifest.json`.
- `scripts/build-notes.mjs` — writes `src/data/notes/index.json` from the notes tree.
- `src/app/api/bank-quiz/route.ts` — serve sampled bank questions.
- `src/app/api/mock/route.ts` — assemble + score a mock.
- `src/app/api/report/route.ts` — persist reported questions.
- `src/app/api/mpsc-progress/route.ts` — read/write MPSC topic stats + mock attempts.
- `src/lib/__tests__/*.test.ts` — unit tests.
- `workflows/generate-bank.mjs` — Workflow script (developer tool, Task 7).

**Modified files:**
- `package.json` — add Vitest deps + scripts, `prebuild` hook.
- `src/types/index.ts` — add `BankQuestion`, `MockAttempt`, `TopicStat`, `ReportedQuestion`, `MpscProgress`.
- `src/lib/db.ts` — add tables + read/write for mock attempts, topic stats, reports.
- `src/lib/dataStore.ts` — add dual-mode wrappers for the above.
- `src/app/technical-sahayak/page.tsx` — bank-backed Quiz tab; new Mock, Notes tabs; report buttons; weak-areas.

---

## Phase 1 — Test harness + bank foundation

### Task 1: Add Vitest test harness

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/__tests__/smoke.test.ts`

**Interfaces:**
- Produces: `npm test` runs Vitest once; `@/` alias resolves in tests.

- [ ] **Step 1: Add dev deps and scripts**

In `package.json` `devDependencies` add:
```json
"vitest": "^2.1.9",
"vite-tsconfig-paths": "^5.1.4"
```
In `scripts` add:
```json
"test": "vitest run",
"test:watch": "vitest",
"build:bank": "node scripts/build-bank.mjs && node scripts/build-notes.mjs",
"prebuild": "node scripts/build-bank.mjs && node scripts/build-notes.mjs"
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: exits 0, `node_modules/.bin/vitest` exists.

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Write the smoke test**

`src/lib/__tests__/smoke.test.ts`:
```ts
import { describe, it, expect } from "vitest";

describe("harness", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run and verify pass**

Run: `npm test`
Expected: PASS, 1 test passed.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/__tests__/smoke.test.ts
git commit -m "test: add Vitest harness with tsconfig path resolution"
```

---

### Task 2: Canonical syllabus config

**Files:**
- Create: `src/lib/syllabus.ts`
- Create: `src/lib/__tests__/syllabus.test.ts`

**Interfaces:**
- Produces:
  - `type SubjectKey` (string literal union)
  - `interface Subtopic { key: string; label: string; labelEn: string }`
  - `interface Subject { key: SubjectKey; label: string; labelEn: string; icon: string; prelimsMarks: number; subtopics: Subtopic[] }`
  - `const SYLLABUS: Subject[]`
  - `getSubject(key: string): Subject | undefined`
  - `getSubtopic(subjectKey: string, subtopicKey: string): Subtopic | undefined`
  - `allSubtopicKeys(): { subject: string; subtopic: string }[]`
  - `PRELIMS_TOTAL_MARKS: number` (sum of `prelimsMarks`)

- [ ] **Step 1: Write the failing test**

`src/lib/__tests__/syllabus.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { SYLLABUS, getSubject, getSubtopic, allSubtopicKeys, PRELIMS_TOTAL_MARKS } from "@/lib/syllabus";

describe("syllabus", () => {
  it("covers the 6 prelims subjects", () => {
    const keys = SYLLABUS.map((s) => s.key);
    expect(keys).toEqual(
      expect.arrayContaining(["marathi", "english", "gk", "aptitude", "science", "current_affairs"])
    );
  });
  it("prelims marks sum to 100", () => {
    expect(PRELIMS_TOTAL_MARKS).toBe(100);
  });
  it("every subject has at least one subtopic with unique keys", () => {
    for (const s of SYLLABUS) {
      expect(s.subtopics.length).toBeGreaterThan(0);
      const ks = s.subtopics.map((t) => t.key);
      expect(new Set(ks).size).toBe(ks.length);
    }
  });
  it("looks up subjects and subtopics", () => {
    expect(getSubject("gk")?.labelEn).toBe("General Knowledge");
    expect(getSubtopic("gk", "mh-geography")?.key).toBe("mh-geography");
    expect(getSubject("nope")).toBeUndefined();
  });
  it("lists all subtopic keys", () => {
    const all = allSubtopicKeys();
    expect(all.length).toBe(SYLLABUS.reduce((n, s) => n + s.subtopics.length, 0));
    expect(all[0]).toHaveProperty("subject");
    expect(all[0]).toHaveProperty("subtopic");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- syllabus`
Expected: FAIL — cannot find module `@/lib/syllabus`.

- [ ] **Step 3: Implement `src/lib/syllabus.ts`**

```ts
export type SubjectKey =
  | "marathi" | "english" | "gk" | "aptitude" | "science" | "current_affairs";

export interface Subtopic { key: string; label: string; labelEn: string; }
export interface Subject {
  key: SubjectKey; label: string; labelEn: string; icon: string;
  prelimsMarks: number; subtopics: Subtopic[];
}

export const SYLLABUS: Subject[] = [
  {
    key: "marathi", label: "मराठी भाषा", labelEn: "Marathi Language", icon: "📖", prelimsMarks: 15,
    subtopics: [
      { key: "sandhi-samas", label: "संधी व समास", labelEn: "Sandhi & Samas" },
      { key: "mhani-vakprachar", label: "म्हणी व वाक्यप्रचार", labelEn: "Idioms & Proverbs" },
      { key: "shabdsampada", label: "शब्दसंपदा", labelEn: "Vocabulary (Syn/Antonyms)" },
      { key: "vyakaran", label: "व्याकरण", labelEn: "Grammar (Kaal/Vachan/Ling)" },
      { key: "aakalan", label: "उतारा आकलन", labelEn: "Comprehension" },
    ],
  },
  {
    key: "english", label: "English", labelEn: "English Language", icon: "🔤", prelimsMarks: 15,
    subtopics: [
      { key: "grammar", label: "Grammar", labelEn: "Tenses/Articles/Prepositions" },
      { key: "vocabulary", label: "Vocabulary", labelEn: "Synonyms/Antonyms" },
      { key: "comprehension", label: "Comprehension", labelEn: "Reading Comprehension" },
      { key: "sentence", label: "Sentence Correction", labelEn: "Correction/Rearrangement" },
      { key: "idioms", label: "Idioms & Phrases", labelEn: "Idioms & Phrases" },
    ],
  },
  {
    key: "gk", label: "सामान्य ज्ञान", labelEn: "General Knowledge", icon: "🌐", prelimsMarks: 30,
    subtopics: [
      { key: "mh-history", label: "महाराष्ट्र इतिहास", labelEn: "Maharashtra History" },
      { key: "mh-geography", label: "महाराष्ट्र भूगोल", labelEn: "Maharashtra Geography" },
      { key: "india-history", label: "भारत इतिहास", labelEn: "India History" },
      { key: "india-geography", label: "भारत भूगोल", labelEn: "India Geography" },
      { key: "constitution", label: "राज्यघटना", labelEn: "Indian Constitution" },
      { key: "economy", label: "अर्थव्यवस्था", labelEn: "Economy" },
      { key: "environment", label: "पर्यावरण", labelEn: "Environment" },
    ],
  },
  {
    key: "aptitude", label: "बौद्धिक क्षमता", labelEn: "Mental Ability & Aptitude", icon: "🧠", prelimsMarks: 25,
    subtopics: [
      { key: "series", label: "संख्यामालिका", labelEn: "Number Series" },
      { key: "coding-decoding", label: "कोडिंग-डिकोडिंग", labelEn: "Coding-Decoding" },
      { key: "analogy", label: "साधर्म्य", labelEn: "Analogies" },
      { key: "direction-blood", label: "दिशा व रक्तसंबंध", labelEn: "Direction & Blood Relations" },
      { key: "syllogism", label: "न्यायनिगमन", labelEn: "Syllogisms" },
      { key: "maths", label: "गणित", labelEn: "Arithmetic (%, Ratio, Time-Work)" },
    ],
  },
  {
    key: "science", label: "विज्ञान व तंत्रज्ञान", labelEn: "Science & Technology", icon: "🔬", prelimsMarks: 10,
    subtopics: [
      { key: "physics", label: "भौतिकशास्त्र", labelEn: "Physics" },
      { key: "chemistry", label: "रसायनशास्त्र", labelEn: "Chemistry" },
      { key: "biology", label: "जीवशास्त्र", labelEn: "Biology" },
      { key: "tech", label: "तंत्रज्ञान", labelEn: "Technology" },
    ],
  },
  {
    key: "current_affairs", label: "चालू घडामोडी", labelEn: "Current Affairs", icon: "📰", prelimsMarks: 5,
    subtopics: [
      { key: "mh-affairs", label: "महाराष्ट्र घडामोडी", labelEn: "Maharashtra Affairs" },
      { key: "national", label: "राष्ट्रीय घडामोडी", labelEn: "National Affairs" },
      { key: "sports-awards", label: "क्रीडा व पुरस्कार", labelEn: "Sports & Awards" },
      { key: "sci-tech-news", label: "विज्ञान-तंत्रज्ञान घडामोडी", labelEn: "Sci-Tech News" },
    ],
  },
];

export const PRELIMS_TOTAL_MARKS = SYLLABUS.reduce((n, s) => n + s.prelimsMarks, 0);

export function getSubject(key: string): Subject | undefined {
  return SYLLABUS.find((s) => s.key === key);
}
export function getSubtopic(subjectKey: string, subtopicKey: string): Subtopic | undefined {
  return getSubject(subjectKey)?.subtopics.find((t) => t.key === subtopicKey);
}
export function allSubtopicKeys(): { subject: string; subtopic: string }[] {
  return SYLLABUS.flatMap((s) => s.subtopics.map((t) => ({ subject: s.key, subtopic: t.key })));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- syllabus`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/syllabus.ts src/lib/__tests__/syllabus.test.ts
git commit -m "feat: add canonical MPSC prelims syllabus config"
```

---

### Task 3: Bank types + seed data + build script

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/data/bank/gk/mh-geography.json` (seed, ~3 real questions)
- Create: `scripts/build-bank.mjs`
- Create: `src/data/bank/_bundle.json` (generated)
- Create: `src/data/bank/manifest.json` (generated)

**Interfaces:**
- Produces:
  - `interface BankQuestion { id: string; subject: string; subtopic: string; difficulty: "easy"|"medium"|"hard"; language: "marathi"|"english"|"bilingual"; question: string; options: [string,string,string,string]; answer: "A"|"B"|"C"|"D"; explanation: string; tags: string[]; verifiedAt: string; isCurrentAffairs?: boolean; asOfDate?: string }`
  - `interface BankManifest { generatedAt: string; total: number; bySubject: Record<string, number>; bySubtopic: Record<string, number> }`
  - `_bundle.json` = `BankQuestion[]`; `manifest.json` = `BankManifest`.

- [ ] **Step 1: Add types to `src/types/index.ts`**

Append:
```ts
export interface BankQuestion {
  id: string;
  subject: string;
  subtopic: string;
  difficulty: "easy" | "medium" | "hard";
  language: "marathi" | "english" | "bilingual";
  question: string;
  options: [string, string, string, string];
  answer: "A" | "B" | "C" | "D";
  explanation: string;
  tags: string[];
  verifiedAt: string;
  isCurrentAffairs?: boolean;
  asOfDate?: string;
}

export interface BankManifest {
  generatedAt: string;
  total: number;
  bySubject: Record<string, number>;
  bySubtopic: Record<string, number>;
}
```

- [ ] **Step 2: Create seed data `src/data/bank/gk/mh-geography.json`**

```json
[
  {
    "id": "gk-mh-geography-0001",
    "subject": "gk",
    "subtopic": "mh-geography",
    "difficulty": "easy",
    "language": "bilingual",
    "question": "महाराष्ट्रातील सर्वात लांब नदी कोणती? / Which is the longest river in Maharashtra?",
    "options": ["A. गोदावरी / Godavari", "B. कृष्णा / Krishna", "C. भीमा / Bhima", "D. तापी / Tapi"],
    "answer": "A",
    "explanation": "गोदावरी ही महाराष्ट्रातील सर्वात लांब नदी असून तिचा उगम त्र्यंबकेश्वर (नाशिक) येथे होतो. / The Godavari is the longest river in Maharashtra, originating at Trimbakeshwar, Nashik.",
    "tags": ["rivers", "maharashtra"],
    "verifiedAt": "2026-07-07"
  },
  {
    "id": "gk-mh-geography-0002",
    "subject": "gk",
    "subtopic": "mh-geography",
    "difficulty": "medium",
    "language": "bilingual",
    "question": "महाराष्ट्राची राजधानी व उपराजधानी अनुक्रमे कोणती? / What are the capital and sub-capital of Maharashtra respectively?",
    "options": ["A. पुणे व नागपूर", "B. मुंबई व नागपूर", "C. मुंबई व पुणे", "D. नागपूर व मुंबई"],
    "answer": "B",
    "explanation": "मुंबई ही राजधानी तर नागपूर ही उपराजधानी (हिवाळी अधिवेशन) आहे. / Mumbai is the capital and Nagpur is the sub-capital (winter session).",
    "tags": ["administration", "maharashtra"],
    "verifiedAt": "2026-07-07"
  },
  {
    "id": "gk-mh-geography-0003",
    "subject": "gk",
    "subtopic": "mh-geography",
    "difficulty": "medium",
    "language": "bilingual",
    "question": "महाराष्ट्रातील कोणत्या जिल्ह्याला सर्वाधिक समुद्रकिनारा लाभला आहे? / Which district of Maharashtra has the longest coastline?",
    "options": ["A. रायगड / Raigad", "B. रत्नागिरी / Ratnagiri", "C. सिंधुदुर्ग / Sindhudurg", "D. ठाणे / Thane"],
    "answer": "B",
    "explanation": "रत्नागिरी जिल्ह्याला महाराष्ट्रातील सर्वाधिक लांबीचा समुद्रकिनारा लाभला आहे. / Ratnagiri district has the longest coastline in Maharashtra.",
    "tags": ["coast", "maharashtra"],
    "verifiedAt": "2026-07-07"
  }
]
```

- [ ] **Step 3: Create `scripts/build-bank.mjs`**

```js
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

// Fixed timestamp source: use file mtime max to stay deterministic-ish; fall back to env.
const generatedAt = process.env.BANK_BUILD_DATE ?? new Date().toISOString().slice(0, 10);

await writeFile(join(BANK_DIR, "_bundle.json"), JSON.stringify(all), "utf-8");
await writeFile(
  join(BANK_DIR, "manifest.json"),
  JSON.stringify({ generatedAt, total: all.length, bySubject, bySubtopic }, null, 2),
  "utf-8"
);
console.log(`build-bank: ${all.length} questions from ${files.length} files`);
```

- [ ] **Step 4: Run the build script**

Run: `node scripts/build-bank.mjs`
Expected: prints `build-bank: 3 questions from 1 files`; `src/data/bank/_bundle.json` and `src/data/bank/manifest.json` exist.

- [ ] **Step 5: Verify bundle contents**

Run: `node -e "const b=require('./src/data/bank/_bundle.json');console.log(b.length, b[0].id)"`
Expected: `3 gk-mh-geography-0001`.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/data/bank scripts/build-bank.mjs
git commit -m "feat: add bank question schema, seed data, and build script"
```

---

### Task 4: Bank loader with schema-guard test

**Files:**
- Create: `src/lib/bank.ts`
- Create: `src/lib/__tests__/bank.test.ts`

**Interfaces:**
- Consumes: `BankQuestion`, `BankManifest` from `@/types`; `_bundle.json`, `manifest.json`.
- Produces:
  - `sampleFrom(questions: BankQuestion[], opts: SampleOpts): BankQuestion[]`
  - `interface SampleOpts { subject?: string; subtopic?: string; difficulty?: string; language?: string; count: number; excludeIds?: string[]; seed?: number }`
  - `getAllQuestions(): BankQuestion[]`
  - `getManifest(): BankManifest`
  - `sample(opts: SampleOpts): BankQuestion[]` (wrapper over `getAllQuestions`)

Sampling rules: filter by provided fields (a `language` filter of `"bilingual"` matches any; otherwise exact match OR `"bilingual"` questions always eligible), drop `excludeIds`, deterministic shuffle by `seed` (default 1) so results are testable, return first `count`. If fewer than `count` after filtering by subtopic, broaden to subject-level; if still fewer, return what exists.

- [ ] **Step 1: Write the failing test**

`src/lib/__tests__/bank.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { sampleFrom, getAllQuestions, getManifest } from "@/lib/bank";
import type { BankQuestion } from "@/types";

const Q = (over: Partial<BankQuestion>): BankQuestion => ({
  id: "x", subject: "gk", subtopic: "mh-geography", difficulty: "easy",
  language: "bilingual", question: "q", options: ["A", "B", "C", "D"],
  answer: "A", explanation: "e", tags: [], verifiedAt: "2026-07-07", ...over,
});

describe("sampleFrom", () => {
  const pool = Array.from({ length: 20 }, (_, i) => Q({ id: `id-${i}` }));

  it("returns exactly count when enough exist", () => {
    expect(sampleFrom(pool, { count: 5 })).toHaveLength(5);
  });
  it("is deterministic for a fixed seed", () => {
    const a = sampleFrom(pool, { count: 5, seed: 42 }).map((q) => q.id);
    const b = sampleFrom(pool, { count: 5, seed: 42 }).map((q) => q.id);
    expect(a).toEqual(b);
  });
  it("excludes ids", () => {
    const res = sampleFrom(pool, { count: 20, excludeIds: ["id-0", "id-1"] });
    expect(res.map((q) => q.id)).not.toContain("id-0");
    expect(res).toHaveLength(18);
  });
  it("filters by subtopic then broadens to subject when too few", () => {
    const mixed = [
      Q({ id: "a", subject: "gk", subtopic: "mh-history" }),
      Q({ id: "b", subject: "gk", subtopic: "mh-geography" }),
      Q({ id: "c", subject: "gk", subtopic: "mh-geography" }),
    ];
    const res = sampleFrom(mixed, { subject: "gk", subtopic: "mh-history", count: 3 });
    expect(res.length).toBe(3); // broadened to subject
  });
  it("english filter still allows bilingual questions", () => {
    const langs = [Q({ id: "e", language: "english" }), Q({ id: "bi", language: "bilingual" })];
    const res = sampleFrom(langs, { language: "english", count: 5 });
    expect(res.map((q) => q.id).sort()).toEqual(["bi", "e"]);
  });
});

describe("shipped bank integrity (guards content commits)", () => {
  it("every shipped question has 4 options, valid answer, unique id", () => {
    const all = getAllQuestions();
    const ids = new Set<string>();
    for (const q of all) {
      expect(q.options).toHaveLength(4);
      expect(["A", "B", "C", "D"]).toContain(q.answer);
      expect(ids.has(q.id)).toBe(false);
      ids.add(q.id);
    }
  });
  it("manifest total matches bundle length", () => {
    expect(getManifest().total).toBe(getAllQuestions().length);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- bank`
Expected: FAIL — cannot find module `@/lib/bank`.

- [ ] **Step 3: Implement `src/lib/bank.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- bank`
Expected: PASS (7 tests). If `@/data` import fails to resolve, confirm `resolveJsonModule` is true (it is) and that `_bundle.json` exists from Task 3.

- [ ] **Step 5: Commit**

```bash
git add src/lib/bank.ts src/lib/__tests__/bank.test.ts
git commit -m "feat: add bank loader with deterministic sampling and integrity test"
```

---

## Phase 2 — Bank-backed quiz

### Task 5: `/api/bank-quiz` route

**Files:**
- Create: `src/app/api/bank-quiz/route.ts`
- Create: `src/lib/__tests__/bankQuizContract.test.ts`

**Interfaces:**
- Consumes: `sample` from `@/lib/bank`.
- Produces: `POST /api/bank-quiz` body `{ subject?, subtopic?, difficulty?, language?, count?, excludeIds? }` → `{ questions: BankQuestion[], count: number, requested: number }`. `count` defaults to 5, clamped 1–50.

- [ ] **Step 1: Write the failing test (pure request handler)**

`src/lib/__tests__/bankQuizContract.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { buildBankQuiz } from "@/app/api/bank-quiz/route";

describe("buildBankQuiz", () => {
  it("clamps count to 1..50 and returns questions", () => {
    const res = buildBankQuiz({ count: 999 });
    expect(res.requested).toBe(50);
    expect(res.questions.length).toBeLessThanOrEqual(50);
  });
  it("defaults count to 5", () => {
    expect(buildBankQuiz({}).requested).toBe(5);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- bankQuizContract`
Expected: FAIL — `buildBankQuiz` not exported.

- [ ] **Step 3: Implement `src/app/api/bank-quiz/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { sample } from "@/lib/bank";
import type { BankQuestion } from "@/types";

export const runtime = "nodejs";

export interface BankQuizInput {
  subject?: string; subtopic?: string; difficulty?: string;
  language?: string; count?: number; excludeIds?: string[]; seed?: number;
}

export function buildBankQuiz(input: BankQuizInput): {
  questions: BankQuestion[]; count: number; requested: number;
} {
  const requested = Math.max(1, Math.min(50, Math.floor(input.count ?? 5)));
  const questions = sample({
    subject: input.subject, subtopic: input.subtopic,
    difficulty: input.difficulty, language: input.language,
    count: requested, excludeIds: input.excludeIds, seed: input.seed,
  });
  return { questions, count: questions.length, requested };
}

export async function POST(req: NextRequest) {
  try {
    const input = (await req.json()) as BankQuizInput;
    return NextResponse.json(buildBankQuiz(input));
  } catch {
    return NextResponse.json({ error: "Failed to build quiz." }, { status: 500 });
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -- bankQuizContract`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/bank-quiz src/lib/__tests__/bankQuizContract.test.ts
git commit -m "feat: add bank-backed quiz API route"
```

---

### Task 6: Wire Quiz tab to the bank

**Files:**
- Modify: `src/app/technical-sahayak/page.tsx` (the `QuizSection` component and its `TOPICS` usage)

**Interfaces:**
- Consumes: `POST /api/bank-quiz`, `SYLLABUS` from `@/lib/syllabus`, `getManifest` is NOT imported client-side (server-only import of JSON is fine in a client component via a fetched route — instead read counts from the quiz response).

- [ ] **Step 1: Add a subtopic selector + bank fetch to `QuizSection`**

Replace the body of `generateQuiz` in `QuizSection` (currently posting to `/api/mpsc-quiz`) with a bank call, and add a subtopic `<select>`. Concretely:

In `QuizSection`, add state:
```tsx
const [selectedSubtopic, setSelectedSubtopic] = useState<string>("");
```

Replace `generateQuiz`'s fetch block:
```tsx
const res = await fetch("/api/bank-quiz", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    subject: selectedTopic,
    subtopic: selectedSubtopic || undefined,
    difficulty,
    language,
    count: 5,
  }),
});
const data = await res.json();
if (!res.ok) throw new Error(data.error);
if (!data.questions?.length) {
  setError("या विषयासाठी अजून प्रश्न उपलब्ध नाहीत. दुसरा विषय निवडा. / No questions yet for this topic.");
  setQuestions([]);
} else {
  setQuestions(data.questions);
}
```

- [ ] **Step 2: Point the subject `<select>` at SYLLABUS and add subtopic select**

At the top of `page.tsx`, add import:
```tsx
import { SYLLABUS, getSubject } from "@/lib/syllabus";
```
Change the subject select's option source from `TOPICS` to `SYLLABUS` (use `s.key`, `s.icon`, `s.label`, `s.labelEn`), reset `selectedSubtopic` to `""` on subject change, and add directly beneath it:
```tsx
<div className="space-y-1">
  <label className="text-xs text-gray-500 font-devanagari">उप-विषय / Sub-topic</label>
  <select
    value={selectedSubtopic}
    onChange={(e) => setSelectedSubtopic(e.target.value)}
    className="w-full bg-bg-hover border border-gray-700/50 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
  >
    <option value="">All / सर्व</option>
    {getSubject(selectedTopic)?.subtopics.map((t) => (
      <option key={t.key} value={t.key}>{t.label} / {t.labelEn}</option>
    ))}
  </select>
</div>
```
Keep the initial `selectedTopic` default as a valid SYLLABUS key: change `useState("maharashtra_gk")` to `useState("gk")`.

- [ ] **Step 3: Verify build + typecheck**

Run: `npm run build`
Expected: compiles with no type errors. (`prebuild` regenerates the bundle first.)

- [ ] **Step 4: Manual smoke via dev server**

Run: `npm run dev` then open `http://localhost:3000/technical-sahayak`, Quiz tab, subject "General Knowledge", subtopic "Maharashtra Geography", generate. Expected: the 3 seeded questions render and can be checked. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/app/technical-sahayak/page.tsx
git commit -m "feat: back the Quiz tab with the verified question bank"
```

---

## Phase 3 — Generate the real bank (developer Workflow)

### Task 7: Content-generation Workflow (developer tool)

> This task is run by the developer via the Claude **Workflow** harness, not shipped. It requires explicit user go-ahead because it spawns many agents and consumes token budget. It produces per-subtopic JSON files under `src/data/bank/` and notes under `src/data/notes/`, which are then committed.

**Files:**
- Create: `workflows/generate-bank.mjs` (Workflow script)
- Produces (data, committed): `src/data/bank/<subject>/<subtopic>.json`, `src/data/notes/<subject>/<subtopic>.md`

**Interfaces:**
- Consumes: `SYLLABUS` shape (subject/subtopic keys) — hardcode the same keys in the script's item list since Workflow scripts can't import app modules.
- Produces: JSON arrays matching `BankQuestion` (minus `id`, which the script assigns as `${subject}-${subtopic}-NNNN`).

- [ ] **Step 1: Author the Workflow script**

`workflows/generate-bank.mjs` (run via the Workflow tool; pseudocode-complete):
```js
export const meta = {
  name: "generate-mpsc-bank",
  description: "Generate + adversarially verify MPSC prelims questions per subtopic",
  phases: [{ title: "Generate" }, { title: "Verify" }, { title: "Assemble" }],
};

const QUESTION_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        required: ["question", "options", "answer", "explanation", "difficulty", "language"],
        properties: {
          question: { type: "string" },
          options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
          answer: { enum: ["A", "B", "C", "D"] },
          explanation: { type: "string" },
          difficulty: { enum: ["easy", "medium", "hard"] },
          language: { enum: ["marathi", "english", "bilingual"] },
        },
      },
    },
  },
  required: ["questions"],
};

const VERDICT_SCHEMA = {
  type: "object",
  required: ["keep", "reason"],
  properties: { keep: { type: "boolean" }, reason: { type: "string" }, fixedAnswer: { enum: ["A","B","C","D",""] } },
};

// Same keys as SYLLABUS. Current-affairs subtopics get web grounding.
const SUBTOPICS = [
  { subject: "gk", subtopic: "mh-geography", ca: false, target: 40 },
  // ... one entry per subtopic in SYLLABUS ...
];

const results = await pipeline(
  SUBTOPICS,
  // Stage 1: generate (ground current affairs with web search first)
  (st) => agent(
    `${st.ca ? "First use web search for the latest (as of args.today) facts. " : ""}` +
    `Generate ${st.target} MPSC Group-C prelims MCQs for subject "${st.subject}", subtopic "${st.subtopic}". ` +
    `Maharashtra-focused where relevant. Each: 4 options prefixed "A. ".."D. ", one correct answer letter, a 1-2 sentence explanation. ` +
    `Mix difficulties. Bilingual (Marathi Devanagari + English) unless it is an English-language subtopic.`,
    { phase: "Generate", label: `gen:${st.subject}/${st.subtopic}`, schema: QUESTION_SCHEMA }
  ).then((r) => ({ st, questions: r?.questions ?? [] })),
  // Stage 2: adversarial verify each question with 3 refuters (majority keep)
  (gen) => parallel(gen.questions.map((q) => () =>
    parallel([0, 1, 2].map((i) => () =>
      agent(
        `You are refuting an exam question. Question: ${JSON.stringify(q)}. ` +
        `Is the marked answer correct, options unambiguous, fact current, and in the MPSC Group-C syllabus? ` +
        `Set keep=false if ANY doubt. If the answer letter is wrong but fixable, set fixedAnswer.`,
        { phase: "Verify", label: `verify:${gen.st.subtopic}#${i}`, schema: VERDICT_SCHEMA }
      )
    )).then((verdicts) => {
      const kept = verdicts.filter(Boolean);
      const keeps = kept.filter((v) => v.keep).length;
      const fix = kept.find((v) => v.fixedAnswer)?.fixedAnswer;
      return keeps >= 2 ? { ...q, answer: fix || q.answer, _st: gen.st } : null;
    })
  )).then((verified) => ({ st: gen.st, kept: verified.filter(Boolean) }))
);

// Stage 3: emit files — the developer writes results to disk after the run using the journal.
log(`Done. Kept counts: ${results.filter(Boolean).map((r) => `${r.st.subtopic}=${r.kept.length}`).join(", ")}`);
return results.filter(Boolean).map((r) => ({ subject: r.st.subject, subtopic: r.st.subtopic, questions: r.kept }));
```

- [ ] **Step 2: Run the Workflow (developer action, with user go-ahead)**

Invoke the Workflow with `args: { today: "2026-07-07" }`. After it completes, read the returned array and write each `{subject, subtopic, questions}` to `src/data/bank/<subject>/<subtopic>.json`, assigning ids `${subject}-${subtopic}-0001`… and `verifiedAt: "2026-07-07"` (and `isCurrentAffairs: true` + `asOfDate` for current-affairs subtopics). Also have the workflow (or a follow-up agent per subtopic) produce a concise notes markdown → `src/data/notes/<subject>/<subtopic>.md`.

- [ ] **Step 3: Rebuild bundle + run integrity test**

Run: `npm run build:bank && npm test -- bank`
Expected: bundle count jumps to the real total; integrity test passes (this is the gate that rejects malformed generated content).

- [ ] **Step 4: Commit the generated content**

```bash
git add src/data/bank src/data/notes workflows/generate-bank.mjs
git commit -m "feat: generate verified MPSC prelims question bank and notes"
```

---

## Phase 4 — Mock tests

### Task 8: Mock assembler + scorer (pure logic)

**Files:**
- Create: `src/lib/mock.ts`
- Create: `src/lib/__tests__/mock.test.ts`
- Modify: `src/types/index.ts`

**Interfaces:**
- Consumes: `SYLLABUS`, `PRELIMS_TOTAL_MARKS` from `@/lib/syllabus`; `sampleFrom` from `@/lib/bank`; `BankQuestion`.
- Produces:
  - `interface MockAttempt { id: string; date: string; total: number; score: number; durationSec: number; bySubject: Record<string, { correct: number; total: number }> }` (in `@/types`)
  - `assembleMock(questions: BankQuestion[], size: number, seed?: number): BankQuestion[]` — picks `size` questions distributed by each subject's `prelimsMarks` share.
  - `scoreMock(questions: BankQuestion[], answers: Record<number, string>): { score: number; total: number; bySubject: Record<string, {correct:number; total:number}> }`

- [ ] **Step 1: Add `MockAttempt` to `src/types/index.ts`**

```ts
export interface MockAttempt {
  id: string;
  date: string;
  total: number;
  score: number;
  durationSec: number;
  bySubject: Record<string, { correct: number; total: number }>;
}
```

- [ ] **Step 2: Write the failing test**

`src/lib/__tests__/mock.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { assembleMock, scoreMock } from "@/lib/mock";
import type { BankQuestion } from "@/types";

const mk = (subject: string, i: number): BankQuestion => ({
  id: `${subject}-${i}`, subject, subtopic: "x", difficulty: "easy",
  language: "bilingual", question: "q", options: ["A", "B", "C", "D"],
  answer: "A", explanation: "e", tags: [], verifiedAt: "2026-07-07",
});

describe("assembleMock", () => {
  const pool = ["marathi","english","gk","aptitude","science","current_affairs"]
    .flatMap((s) => Array.from({ length: 40 }, (_, i) => mk(s, i)));

  it("returns the requested size", () => {
    expect(assembleMock(pool, 100, 7)).toHaveLength(100);
  });
  it("has no duplicate questions", () => {
    const ids = assembleMock(pool, 100, 7).map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("weights gk (30 marks) more than science (10 marks)", () => {
    const m = assembleMock(pool, 100, 7);
    const gk = m.filter((q) => q.subject === "gk").length;
    const sci = m.filter((q) => q.subject === "science").length;
    expect(gk).toBeGreaterThan(sci);
  });
});

describe("scoreMock", () => {
  it("scores correct answers and per-subject breakdown", () => {
    const qs = [mk("gk", 1), mk("gk", 2), mk("science", 1)];
    const res = scoreMock(qs, { 0: "A", 1: "B", 2: "A" }); // q0 correct, q1 wrong, q2 correct
    expect(res.score).toBe(2);
    expect(res.total).toBe(3);
    expect(res.bySubject.gk).toEqual({ correct: 1, total: 2 });
    expect(res.bySubject.science).toEqual({ correct: 1, total: 1 });
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- mock`
Expected: FAIL — cannot find `@/lib/mock`.

- [ ] **Step 4: Implement `src/lib/mock.ts`**

```ts
import type { BankQuestion } from "@/types";
import { SYLLABUS, PRELIMS_TOTAL_MARKS } from "@/lib/syllabus";
import { sampleFrom } from "@/lib/bank";

export function assembleMock(questions: BankQuestion[], size: number, seed = 1): BankQuestion[] {
  const picked: BankQuestion[] = [];
  const used = new Set<string>();
  // Allocate slots per subject by prelims-marks share (largest-remainder rounding).
  const raw = SYLLABUS.map((s) => ({
    key: s.key, exact: (s.prelimsMarks / PRELIMS_TOTAL_MARKS) * size,
  }));
  const alloc = raw.map((r) => ({ key: r.key, n: Math.floor(r.exact), frac: r.exact - Math.floor(r.exact) }));
  let assigned = alloc.reduce((n, a) => n + a.n, 0);
  for (const a of [...alloc].sort((x, y) => y.frac - x.frac)) {
    if (assigned >= size) break;
    a.n += 1; assigned += 1;
  }
  for (const a of alloc) {
    const got = sampleFrom(questions, { subject: a.key, count: a.n, seed, excludeIds: [...used] });
    for (const q of got) { if (!used.has(q.id)) { used.add(q.id); picked.push(q); } }
  }
  // Backfill if any subject was short of questions.
  if (picked.length < size) {
    const extra = sampleFrom(questions, { count: size - picked.length, seed: seed + 1, excludeIds: [...used] });
    for (const q of extra) { if (!used.has(q.id)) { used.add(q.id); picked.push(q); } }
  }
  return picked.slice(0, size);
}

export function scoreMock(
  questions: BankQuestion[],
  answers: Record<number, string>
): { score: number; total: number; bySubject: Record<string, { correct: number; total: number }> } {
  const bySubject: Record<string, { correct: number; total: number }> = {};
  let score = 0;
  questions.forEach((q, i) => {
    const b = (bySubject[q.subject] ??= { correct: 0, total: 0 });
    b.total += 1;
    if (answers[i] === q.answer) { score += 1; b.correct += 1; }
  });
  return { score, total: questions.length, bySubject };
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- mock`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/mock.ts src/lib/__tests__/mock.test.ts src/types/index.ts
git commit -m "feat: add weighted mock assembler and scorer"
```

---

### Task 9: `/api/mock` route

**Files:**
- Create: `src/app/api/mock/route.ts`

**Interfaces:**
- Consumes: `getAllQuestions` from `@/lib/bank`, `assembleMock` from `@/lib/mock`.
- Produces: `GET /api/mock?size=100` → `{ questions: BankQuestion[], size: number }`. `size` clamped 10–100, default 100.

- [ ] **Step 1: Implement route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { getAllQuestions } from "@/lib/bank";
import { assembleMock } from "@/lib/mock";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const raw = Number(req.nextUrl.searchParams.get("size") ?? 100);
    const size = Math.max(10, Math.min(100, Number.isFinite(raw) ? raw : 100));
    // Vary seed by hour bucket so repeated mocks differ without Date.now nondeterminism concerns at test time.
    const seed = Math.floor(Date.now() / 3_600_000);
    const questions = assembleMock(getAllQuestions(), size, seed);
    return NextResponse.json({ questions, size: questions.length });
  } catch {
    return NextResponse.json({ error: "Failed to assemble mock." }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: compiles clean.

- [ ] **Step 3: Manual smoke**

Run: `npm run dev`, then `curl "http://localhost:3000/api/mock?size=20"` → JSON with `size` ≤ 20 and a `questions` array. Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/mock
git commit -m "feat: add mock assembly API route"
```

---

### Task 10: Mock Test tab UI

**Files:**
- Modify: `src/app/technical-sahayak/page.tsx`

**Interfaces:**
- Consumes: `GET /api/mock`, `POST /api/mpsc-progress` (Task 13). Adds `"mock"` to the `Tab` union and a `MockSection` component.

- [ ] **Step 1: Add `"mock"` to the `Tab` type and TABS array**

Change `type Tab = ...` to include `"mock"`; add `{ id: "mock", label: "सराव परीक्षा", labelEn: "Mock Test", icon: "📝" }` to `TABS` (place after quiz).

- [ ] **Step 2: Add `MockSection` component**

Add this component in `page.tsx` (above `TechnicalSahayakPage`):
```tsx
function MockSection() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(60 * 60); // 60 min
  const startedAt = useRef<number>(0);

  useEffect(() => {
    if (!started || submitted) return;
    const id = setInterval(() => setRemaining((r) => (r <= 1 ? (clearInterval(id), setSubmitted(true), 0) : r - 1)), 1000);
    return () => clearInterval(id);
  }, [started, submitted]);

  const start = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mock?size=100");
      const data = await res.json();
      setQuestions(data.questions);
      setAnswers({}); setSubmitted(false); setRemaining(60 * 60);
      setStarted(true); startedAt.current = Date.now();
    } finally { setLoading(false); }
  };

  const submit = useCallback(() => {
    setSubmitted(true);
    const bySubject: Record<string, { correct: number; total: number }> = {};
    let score = 0;
    questions.forEach((q, i) => {
      const subj = (q as unknown as { subject: string }).subject;
      const b = (bySubject[subj] ??= { correct: 0, total: 0 });
      b.total += 1;
      if (answers[i] === q.answer) { score += 1; b.correct += 1; }
    });
    fetch("/api/mpsc-progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "mock",
        mock: { score, total: questions.length, durationSec: Math.round((Date.now() - startedAt.current) / 1000), bySubject },
      }),
    }).catch(() => {});
  }, [questions, answers]);

  if (!started) {
    return (
      <div className="bg-bg-card border border-gray-700/50 rounded-2xl p-6 text-center space-y-4">
        <p className="text-4xl">📝</p>
        <h3 className="font-semibold text-gray-200 font-devanagari">पूर्ण लांबीची सराव परीक्षा</h3>
        <p className="text-sm text-gray-400 font-devanagari">100 प्रश्न · 60 मिनिटे · विषयनिहाय गुणभार / 100 Q · 60 min · real weightage</p>
        <button onClick={start} disabled={loading}
          className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium font-devanagari">
          {loading ? "तयार होत आहे..." : "सुरू करा / Start Mock"}
        </button>
      </div>
    );
  }

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const score = submitted ? questions.filter((q, i) => answers[i] === q.answer).length : 0;

  return (
    <div className="space-y-4">
      <div className="sticky top-16 z-10 flex items-center justify-between bg-bg-card border border-gray-700/50 rounded-xl px-4 py-3">
        <span className="text-sm text-gray-400">{Object.keys(answers).length}/{questions.length} answered</span>
        {!submitted && <span className={`font-mono font-bold ${remaining < 300 ? "text-red-400" : "text-primary-300"}`}>⏱ {mm}:{ss}</span>}
        {!submitted && <button onClick={submit} className="bg-green-700 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-devanagari">जमा करा</button>}
      </div>

      {submitted && (
        <div className="bg-bg-card border border-primary-700/40 rounded-xl p-5 text-center">
          <p className="text-3xl font-bold text-primary-300">{score}/{questions.length}</p>
          <p className="text-sm text-gray-400 mt-1">{Math.round((score / questions.length) * 100)}%</p>
        </div>
      )}

      {questions.map((q, idx) => {
        const chosen = answers[idx];
        return (
          <div key={idx} className="bg-bg-card border border-gray-700/50 rounded-xl p-4 space-y-2">
            <p className="text-gray-200 text-sm font-medium"><span className="text-primary-400 mr-2">Q{idx + 1}.</span>{q.question}</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {q.options.map((opt) => {
                const letter = opt[0];
                let cls = "text-left px-3 py-2 rounded-lg border text-sm ";
                if (!submitted) cls += chosen === letter ? "border-primary-500 bg-primary-600/20 text-primary-300" : "border-gray-700/50 bg-bg-hover text-gray-300";
                else if (letter === q.answer) cls += "border-green-500 bg-green-900/20 text-green-300";
                else if (letter === chosen) cls += "border-red-500 bg-red-900/20 text-red-300";
                else cls += "border-gray-700/30 bg-bg text-gray-500";
                return <button key={letter} disabled={submitted} onClick={() => setAnswers((a) => ({ ...a, [idx]: letter }))} className={cls}>{opt}</button>;
              })}
            </div>
            {submitted && <p className="text-xs text-gray-400">{q.explanation}</p>}
          </div>
        );
      })}

      {submitted && (
        <button onClick={() => { setStarted(false); setQuestions([]); }} className="w-full bg-bg-card border border-gray-700/50 text-gray-300 py-3 rounded-xl font-devanagari">नवीन सराव परीक्षा / New Mock</button>
      )}
    </div>
  );
}
```
Note: `QuizQuestion` interface at top of file lacks `subject`; the mock questions carry it at runtime (accessed via cast above). No type change needed.

- [ ] **Step 3: Render the tab**

Add near the other tab renders:
```tsx
{activeTab === "mock" && <MockSection />}
```

- [ ] **Step 4: Build + manual smoke**

Run: `npm run build` (expect clean), then `npm run dev`, open Mock Test tab, start, answer a few, submit; verify score + timer. Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/app/technical-sahayak/page.tsx
git commit -m "feat: add full-length timed mock test tab"
```

---

## Phase 5 — Study notes

### Task 11: Notes build script + loader + tab

**Files:**
- Create: `scripts/build-notes.mjs`
- Create: `src/data/notes/gk/mh-geography.md` (seed)
- Create: `src/data/notes/index.json` (generated)
- Create: `src/lib/notes.ts`
- Modify: `src/app/technical-sahayak/page.tsx`

**Interfaces:**
- Produces:
  - `src/data/notes/index.json` = `{ subject: string; subtopic: string; title: string; body: string }[]`
  - `src/lib/notes.ts`: `getNotes(): NoteDoc[]`, `getNotesFor(subject: string): NoteDoc[]`, `interface NoteDoc { subject; subtopic; title; body }`.

- [ ] **Step 1: Seed note `src/data/notes/gk/mh-geography.md`**

```md
# महाराष्ट्र भूगोल / Maharashtra Geography

- **सर्वात लांब नदी:** गोदावरी (उगम: त्र्यंबकेश्वर, नाशिक).
- **राजधानी / उपराजधानी:** मुंबई / नागपूर.
- **सर्वाधिक समुद्रकिनारा:** रत्नागिरी जिल्हा.
- **प्रमुख पर्वतरांग:** सह्याद्री (पश्चिम घाट).
```

- [ ] **Step 2: Create `scripts/build-notes.mjs`**

```js
import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

const NOTES_DIR = "src/data/notes";

async function walk(dir, subject = null) {
  const out = [];
  for (const entry of await readdir(dir)) {
    if (entry === "index.json") continue;
    const full = join(dir, entry);
    if ((await stat(full)).isDirectory()) out.push(...(await walk(full, entry)));
    else if (entry.endsWith(".md")) {
      const body = await readFile(full, "utf-8");
      const title = (body.match(/^#\s+(.+)$/m)?.[1] ?? entry.replace(/\.md$/, "")).trim();
      out.push({ subject, subtopic: entry.replace(/\.md$/, ""), title, body });
    }
  }
  return out;
}

const notes = await walk(NOTES_DIR);
await writeFile(join(NOTES_DIR, "index.json"), JSON.stringify(notes, null, 2), "utf-8");
console.log(`build-notes: ${notes.length} notes`);
```

- [ ] **Step 3: Run it**

Run: `node scripts/build-notes.mjs`
Expected: `build-notes: 1 notes`; `src/data/notes/index.json` exists.

- [ ] **Step 4: Create `src/lib/notes.ts`**

```ts
import notes from "@/data/notes/index.json";

export interface NoteDoc { subject: string; subtopic: string; title: string; body: string; }

export function getNotes(): NoteDoc[] { return notes as NoteDoc[]; }
export function getNotesFor(subject: string): NoteDoc[] {
  return (notes as NoteDoc[]).filter((n) => n.subject === subject);
}
```

- [ ] **Step 5: Add Notes tab**

In `page.tsx`: add `"notes"` to `Tab`, add `{ id: "notes", label: "अभ्यास नोट्स", labelEn: "Study Notes", icon: "📚" }` to `TABS`. Add a `NotesSection` client component that imports `getNotes`/`SYLLABUS` (JSON import is client-safe here since it's static) and renders a subject filter + markdown-ish body in a `<pre className="whitespace-pre-wrap font-devanagari">`:
```tsx
function NotesSection() {
  const [subject, setSubject] = useState<string>(SYLLABUS[0].key);
  const docs = getNotes().filter((n) => n.subject === subject);
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {SYLLABUS.map((s) => (
          <button key={s.key} onClick={() => setSubject(s.key)}
            className={`px-3 py-1 rounded-full text-xs ${subject === s.key ? "bg-primary-600 text-white" : "bg-bg-hover text-gray-400"}`}>
            {s.icon} {s.labelEn}
          </button>
        ))}
      </div>
      {docs.length === 0 ? (
        <p className="text-center text-gray-500 py-10 font-devanagari">या विषयासाठी नोट्स लवकरच येत आहेत.</p>
      ) : docs.map((d) => (
        <div key={d.subtopic} className="bg-bg-card border border-gray-700/50 rounded-xl p-5">
          <pre className="whitespace-pre-wrap text-sm text-gray-300 font-devanagari">{d.body}</pre>
        </div>
      ))}
    </div>
  );
}
```
Add `import { getNotes } from "@/lib/notes";` at the top, and render `{activeTab === "notes" && <NotesSection />}`.

- [ ] **Step 6: Build + smoke + commit**

Run: `npm run build` (clean). Then:
```bash
git add scripts/build-notes.mjs src/data/notes src/lib/notes.ts src/app/technical-sahayak/page.tsx
git commit -m "feat: add study notes build pipeline, loader, and Notes tab"
```

---

## Phase 6 — Tracking + report flow

### Task 12: Topic-stat aggregation (pure logic) + persistence

**Files:**
- Create: `src/lib/stats.ts`
- Create: `src/lib/__tests__/stats.test.ts`
- Modify: `src/types/index.ts`
- Modify: `src/lib/db.ts`
- Modify: `src/lib/dataStore.ts`

**Interfaces:**
- Produces:
  - `interface TopicStat { subject: string; subtopic: string; attempts: number; correct: number; lastPracticed: string }` (in `@/types`)
  - `interface ReportedQuestion { id: string; questionId: string; reason: string; note: string; createdAt: string }` (in `@/types`)
  - `interface MpscProgress { topicStats: TopicStat[]; mockAttempts: MockAttempt[] }` (in `@/types`)
  - `applyQuizResult(stats: TopicStat[], items: {subject:string; subtopic:string; correct:boolean}[], now: string): TopicStat[]` in `src/lib/stats.ts` (pure).
  - `weakestTopics(stats: TopicStat[], n: number): TopicStat[]` — lowest accuracy first, min 3 attempts.
  - dataStore: `readMpscProgress()`, `writeMpscTopicStats(stats)`, `appendMockAttempt(a)`, `appendReport(r)`, `readReports()`.

- [ ] **Step 1: Add types to `src/types/index.ts`**

```ts
export interface TopicStat {
  subject: string; subtopic: string; attempts: number; correct: number; lastPracticed: string;
}
export interface ReportedQuestion {
  id: string; questionId: string; reason: string; note: string; createdAt: string;
}
export interface MpscProgress {
  topicStats: TopicStat[];
  mockAttempts: MockAttempt[];
}
```

- [ ] **Step 2: Write failing test for `stats.ts`**

`src/lib/__tests__/stats.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { applyQuizResult, weakestTopics } from "@/lib/stats";
import type { TopicStat } from "@/types";

describe("applyQuizResult", () => {
  it("creates and updates stats", () => {
    let s: TopicStat[] = [];
    s = applyQuizResult(s, [
      { subject: "gk", subtopic: "mh-geography", correct: true },
      { subject: "gk", subtopic: "mh-geography", correct: false },
    ], "2026-07-07");
    expect(s).toHaveLength(1);
    expect(s[0]).toMatchObject({ attempts: 2, correct: 1, lastPracticed: "2026-07-07" });
  });
  it("accumulates across calls", () => {
    let s: TopicStat[] = [{ subject: "gk", subtopic: "x", attempts: 1, correct: 1, lastPracticed: "2026-07-01" }];
    s = applyQuizResult(s, [{ subject: "gk", subtopic: "x", correct: false }], "2026-07-07");
    expect(s[0]).toMatchObject({ attempts: 2, correct: 1 });
  });
});

describe("weakestTopics", () => {
  it("ranks by accuracy, needs >=3 attempts", () => {
    const s: TopicStat[] = [
      { subject: "a", subtopic: "1", attempts: 10, correct: 2, lastPracticed: "" }, // 20%
      { subject: "b", subtopic: "2", attempts: 10, correct: 9, lastPracticed: "" }, // 90%
      { subject: "c", subtopic: "3", attempts: 2, correct: 0, lastPracticed: "" },  // excluded (<3)
    ];
    const w = weakestTopics(s, 5);
    expect(w.map((t) => t.subtopic)).toEqual(["1", "2"]);
  });
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `npm test -- stats`
Expected: FAIL — cannot find `@/lib/stats`.

- [ ] **Step 4: Implement `src/lib/stats.ts`**

```ts
import type { TopicStat } from "@/types";

export function applyQuizResult(
  stats: TopicStat[],
  items: { subject: string; subtopic: string; correct: boolean }[],
  now: string
): TopicStat[] {
  const map = new Map(stats.map((s) => [`${s.subject}/${s.subtopic}`, { ...s }]));
  for (const it of items) {
    const key = `${it.subject}/${it.subtopic}`;
    const cur = map.get(key) ?? { subject: it.subject, subtopic: it.subtopic, attempts: 0, correct: 0, lastPracticed: now };
    cur.attempts += 1;
    if (it.correct) cur.correct += 1;
    cur.lastPracticed = now;
    map.set(key, cur);
  }
  return [...map.values()];
}

export function weakestTopics(stats: TopicStat[], n: number): TopicStat[] {
  return stats
    .filter((s) => s.attempts >= 3)
    .sort((a, b) => a.correct / a.attempts - b.correct / b.attempts)
    .slice(0, n);
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `npm test -- stats`
Expected: PASS (3 tests).

- [ ] **Step 6: Add DB tables + functions in `src/lib/db.ts`**

In `initDb()` add three `CREATE TABLE IF NOT EXISTS` statements:
```ts
await sql`CREATE TABLE IF NOT EXISTS mpsc_topic_stats (
  subject TEXT NOT NULL, subtopic TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0, correct INTEGER NOT NULL DEFAULT 0,
  last_practiced TEXT NOT NULL DEFAULT '', PRIMARY KEY (subject, subtopic)
)`;
await sql`CREATE TABLE IF NOT EXISTS mpsc_mock_attempts (
  id TEXT PRIMARY KEY, date TEXT NOT NULL, total INTEGER NOT NULL,
  score INTEGER NOT NULL, duration_sec INTEGER NOT NULL, by_subject JSONB NOT NULL DEFAULT '{}'
)`;
await sql`CREATE TABLE IF NOT EXISTS mpsc_reports (
  id TEXT PRIMARY KEY, question_id TEXT NOT NULL, reason TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
)`;
```
Add exported functions:
```ts
import type { TopicStat, MockAttempt, ReportedQuestion } from "@/types";

export async function dbReadTopicStats(): Promise<TopicStat[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM mpsc_topic_stats`;
  return rows.map((r) => ({ subject: r.subject as string, subtopic: r.subtopic as string,
    attempts: r.attempts as number, correct: r.correct as number, lastPracticed: r.last_practiced as string }));
}
export async function dbWriteTopicStats(stats: TopicStat[]) {
  const sql = getDb();
  for (const s of stats) {
    await sql`INSERT INTO mpsc_topic_stats (subject, subtopic, attempts, correct, last_practiced)
      VALUES (${s.subject}, ${s.subtopic}, ${s.attempts}, ${s.correct}, ${s.lastPracticed})
      ON CONFLICT (subject, subtopic) DO UPDATE SET
        attempts = EXCLUDED.attempts, correct = EXCLUDED.correct, last_practiced = EXCLUDED.last_practiced`;
  }
}
export async function dbReadMockAttempts(): Promise<MockAttempt[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM mpsc_mock_attempts ORDER BY date DESC`;
  return rows.map((r) => ({ id: r.id as string, date: r.date as string, total: r.total as number,
    score: r.score as number, durationSec: r.duration_sec as number,
    bySubject: r.by_subject as MockAttempt["bySubject"] }));
}
export async function dbAppendMockAttempt(a: MockAttempt) {
  const sql = getDb();
  await sql`INSERT INTO mpsc_mock_attempts (id, date, total, score, duration_sec, by_subject)
    VALUES (${a.id}, ${a.date}, ${a.total}, ${a.score}, ${a.durationSec}, ${JSON.stringify(a.bySubject)})`;
}
export async function dbAppendReport(r: ReportedQuestion) {
  const sql = getDb();
  await sql`INSERT INTO mpsc_reports (id, question_id, reason, note, created_at)
    VALUES (${r.id}, ${r.questionId}, ${r.reason}, ${r.note}, ${r.createdAt})`;
}
export async function dbReadReports(): Promise<ReportedQuestion[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM mpsc_reports ORDER BY created_at DESC`;
  return rows.map((r) => ({ id: r.id as string, questionId: r.question_id as string,
    reason: r.reason as string, note: r.note as string, createdAt: r.created_at as string }));
}
```

- [ ] **Step 7: Add flat-file dual-mode wrappers in `src/lib/dataStore.ts`**

Add file paths and functions (mirrors existing pattern):
```ts
import type { TopicStat, MockAttempt, ReportedQuestion, MpscProgress } from "@/types";
import {
  dbReadTopicStats, dbWriteTopicStats, dbReadMockAttempts,
  dbAppendMockAttempt, dbAppendReport, dbReadReports,
} from "./db";

const STATS_FILE = path.join(DATA_DIR, "mpsc_topic_stats.json");
const MOCKS_FILE = path.join(DATA_DIR, "mpsc_mock_attempts.json");
const REPORTS_FILE = path.join(DATA_DIR, "mpsc_reports.json");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try { return JSON.parse(await fs.readFile(file, "utf-8")) as T; } catch { return fallback; }
}

export async function readMpscProgress(): Promise<MpscProgress> {
  if (useDb()) { await initDb(); return { topicStats: await dbReadTopicStats(), mockAttempts: await dbReadMockAttempts() }; }
  await ensureDataFiles();
  return { topicStats: await readJson(STATS_FILE, [] as TopicStat[]), mockAttempts: await readJson(MOCKS_FILE, [] as MockAttempt[]) };
}
export async function writeMpscTopicStats(stats: TopicStat[]) {
  if (useDb()) { await initDb(); return dbWriteTopicStats(stats); }
  await ensureDataFiles();
  await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2), "utf-8");
}
export async function appendMockAttempt(a: MockAttempt) {
  if (useDb()) { await initDb(); return dbAppendMockAttempt(a); }
  await ensureDataFiles();
  const cur = await readJson(MOCKS_FILE, [] as MockAttempt[]);
  cur.unshift(a);
  await fs.writeFile(MOCKS_FILE, JSON.stringify(cur, null, 2), "utf-8");
}
export async function appendReport(r: ReportedQuestion) {
  if (useDb()) { await initDb(); return dbAppendReport(r); }
  await ensureDataFiles();
  const cur = await readJson(REPORTS_FILE, [] as ReportedQuestion[]);
  cur.unshift(r);
  await fs.writeFile(REPORTS_FILE, JSON.stringify(cur, null, 2), "utf-8");
}
export async function readReports(): Promise<ReportedQuestion[]> {
  if (useDb()) { await initDb(); return dbReadReports(); }
  await ensureDataFiles();
  return readJson(REPORTS_FILE, [] as ReportedQuestion[]);
}
```
Note: `ensureDataFiles` currently only seeds three files; that is fine — `readJson` tolerates missing files via its try/catch.

- [ ] **Step 8: Run full test suite + build**

Run: `npm test && npm run build`
Expected: all tests pass; build clean.

- [ ] **Step 9: Commit**

```bash
git add src/lib/stats.ts src/lib/__tests__/stats.test.ts src/types/index.ts src/lib/db.ts src/lib/dataStore.ts
git commit -m "feat: add MPSC topic stats, mock attempts, reports persistence"
```

---

### Task 13: `/api/mpsc-progress` and `/api/report` routes

**Files:**
- Create: `src/app/api/mpsc-progress/route.ts`
- Create: `src/app/api/report/route.ts`

**Interfaces:**
- Consumes: dataStore functions from Task 12, `applyQuizResult`/`weakestTopics` from `@/lib/stats`, `randomUUID`.
- Produces:
  - `GET /api/mpsc-progress` → `{ topicStats, mockAttempts, weakest }`.
  - `POST /api/mpsc-progress` body either `{ type:"quiz", items:[{subject,subtopic,correct}] }` or `{ type:"mock", mock:{score,total,durationSec,bySubject} }` → `{ success:true }`.
  - `POST /api/report` body `{ questionId, reason, note? }` → `{ success:true }`.

- [ ] **Step 1: Implement `src/app/api/mpsc-progress/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readMpscProgress, writeMpscTopicStats, appendMockAttempt } from "@/lib/dataStore";
import { applyQuizResult, weakestTopics } from "@/lib/stats";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { topicStats, mockAttempts } = await readMpscProgress();
    return NextResponse.json({ topicStats, mockAttempts, weakest: weakestTopics(topicStats, 5) });
  } catch {
    return NextResponse.json({ error: "Failed to read progress." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = new Date().toISOString().slice(0, 10);
    const { topicStats } = await readMpscProgress();

    if (body.type === "quiz" && Array.isArray(body.items)) {
      const updated = applyQuizResult(topicStats, body.items, now);
      await writeMpscTopicStats(updated);
    } else if (body.type === "mock" && body.mock) {
      const m = body.mock;
      await appendMockAttempt({
        id: randomUUID(), date: new Date().toISOString(),
        total: m.total, score: m.score, durationSec: m.durationSec ?? 0, bySubject: m.bySubject ?? {},
      });
      // fold each subject's mock result into topic stats at subject granularity
      const items = Object.entries(m.bySubject ?? {}).flatMap(([subject, v]: [string, { correct: number; total: number }]) =>
        Array.from({ length: v.total }, (_, i) => ({ subject, subtopic: "_mock", correct: i < v.correct }))
      );
      await writeMpscTopicStats(applyQuizResult(topicStats, items, now));
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("mpsc-progress POST error:", err);
    return NextResponse.json({ error: "Failed to update progress." }, { status: 500 });
  }
}
```

- [ ] **Step 2: Implement `src/app/api/report/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { appendReport } from "@/lib/dataStore";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { questionId, reason, note } = await req.json();
    if (!questionId || !reason) return NextResponse.json({ error: "questionId and reason required" }, { status: 400 });
    await appendReport({ id: randomUUID(), questionId, reason, note: note ?? "", createdAt: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save report." }, { status: 500 });
  }
}
```

- [ ] **Step 3: Build + smoke**

Run: `npm run build` (clean). Then `npm run dev` and:
`curl -X POST localhost:3000/api/report -H "Content-Type: application/json" -d '{"questionId":"gk-mh-geography-0001","reason":"wrong-answer"}'` → `{"success":true}`; confirm `data/mpsc_reports.json` created (no DB locally). Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/mpsc-progress src/app/api/report
git commit -m "feat: add MPSC progress and question-report API routes"
```

---

### Task 14: Report buttons + record quiz results + weak-areas panel

**Files:**
- Modify: `src/app/technical-sahayak/page.tsx`

**Interfaces:**
- Consumes: `POST /api/report`, `POST /api/mpsc-progress` (quiz), `GET /api/mpsc-progress`.

- [ ] **Step 1: Record quiz results into topic stats on check**

In `QuizSection`, in the "Check Answers" button handler, after `setSubmitted(true)`, POST results:
```tsx
onClick={() => {
  setSubmitted(true);
  const items = questions.map((q, i) => ({
    subject: (q as unknown as { subject?: string }).subject ?? selectedTopic,
    subtopic: (q as unknown as { subtopic?: string }).subtopic ?? (selectedSubtopic || "_mixed"),
    correct: answers[i] === q.answer,
  }));
  fetch("/api/mpsc-progress", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "quiz", items }),
  }).catch(() => {});
}}
```
(The bank-quiz response includes `subject`/`subtopic` on each question, so the casts resolve at runtime.)

- [ ] **Step 2: Add a report button under each submitted question**

In the per-question block of `QuizSection` (inside the `submitted` branch), add:
```tsx
<button
  onClick={async () => {
    const reason = prompt("काय चूक आहे? (उत्तर/अस्पष्ट/जुनी माहिती) / What's wrong?") || "";
    if (!reason) return;
    await fetch("/api/report", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: (q as unknown as { id: string }).id, reason }),
    });
    alert("धन्यवाद! तक्रार नोंदवली. / Reported. Thanks!");
  }}
  className="text-xs text-gray-500 hover:text-red-400 mt-1"
>🚩 चूक कळवा / Report</button>
```

- [ ] **Step 3: Add a Weak-Areas panel to the Strategy tab**

In `page.tsx`, add a `WeakAreas` component and render it at the top of the Strategy tab:
```tsx
function WeakAreas() {
  const [weak, setWeak] = useState<{ subject: string; subtopic: string; attempts: number; correct: number }[]>([]);
  useEffect(() => {
    fetch("/api/mpsc-progress").then((r) => r.json()).then((d) => setWeak(d.weakest ?? [])).catch(() => {});
  }, []);
  if (weak.length === 0) return null;
  return (
    <div className="bg-bg-card border border-red-700/40 rounded-xl p-5 space-y-3">
      <h3 className="font-semibold text-red-300 font-devanagari">⚠️ कमकुवत विषय / Weak Areas</h3>
      {weak.map((w) => {
        const pct = Math.round((w.correct / w.attempts) * 100);
        const subj = getSubject(w.subject);
        return (
          <div key={`${w.subject}/${w.subtopic}`} className="flex items-center justify-between text-sm">
            <span className="text-gray-300 font-devanagari">{subj?.icon} {subj?.labelEn} · {w.subtopic}</span>
            <span className={pct < 40 ? "text-red-400" : "text-yellow-400"}>{pct}% ({w.attempts})</span>
          </div>
        );
      })}
    </div>
  );
}
```
Render `<WeakAreas />` as the first child inside the `activeTab === "strategy"` block.

- [ ] **Step 4: Build + full manual smoke**

Run: `npm run build` (clean), `npm run dev`. Take a bank quiz, check answers (stats POST fires), report a question (file/DB row created), open Strategy tab and confirm the Weak Areas panel appears after enough attempts. Stop server.

- [ ] **Step 5: Run entire test suite**

Run: `npm test`
Expected: all suites pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/technical-sahayak/page.tsx
git commit -m "feat: record quiz stats, add report buttons and weak-areas panel"
```

---

## Final verification

- [ ] **Run:** `npm test` — all unit tests pass.
- [ ] **Run:** `npm run build` — clean production build (with `prebuild` regenerating bank + notes).
- [ ] **Manual:** `/technical-sahayak` — Quiz (bank), Mock (timed, scored), Notes, Strategy (weak areas), report buttons all work.
- [ ] Update `README.md` "Features" and "Pages" sections to describe the verified bank, mock tests, notes, and tracking. Commit `docs: update README for MPSC prep features`.

## Notes for the implementer

- Run tasks in order; Phase 3 (Task 7) is a developer Workflow needing explicit user go-ahead and can be deferred — Phases 4–6 work against the seed bank, just with fewer questions.
- If a `@/data/...json` import errors at build, ensure `scripts/build-bank.mjs` / `build-notes.mjs` ran (the `prebuild`/`build:bank` script does this) so the generated files exist.
- Keep current-affairs questions dated; the integrity test does not check freshness — that is enforced by the `asOfDate` UI flag, added opportunistically if time permits.
