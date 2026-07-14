# MPSC Meme Engine — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local, repeatable engine that turns the verified MPSC study material into real meme-template images (Claude writes captions, overlaid on template art → PNG), plus a local Accept/Deny review page — with facts drawn only from the verified bank/notes.

**Architecture:** Pure, testable logic lives in `src/lib/memes/*.ts` (Vitest picks up `src/**/*.test.ts`). The imperative shell — Claude CLI invocation, Playwright rendering, the review HTTP server, and CLI entry points — lives in `scripts/memes/*.ts`, run directly by Node 24's native TypeScript execution (no build step). A batch run does: gather material digest → Claude authors `MemeSpec[]` → validate (structure + facts-only rule) → compose HTML (template image + text zones) → Playwright screenshot → write PNGs + `manifest.json` (status `pending`). `npm run review` serves an Accept/Deny gallery that flips manifest status.

**Tech Stack:** TypeScript, Node 24 (native `.ts` execution), Vitest, Playwright (chromium), Claude CLI (`claude -p`), Node `http`/`fs` for the review server. No new runtime deps for the Next app.

## Global Constraints

- **Language/tone:** bilingual balanced — mix of pure-Marathi, pure-English, and Marathi-English-mix memes; humor-forward with some motivational.
- **Trust rule (non-negotiable):** any meme with a `factLine`/factual claim may use only facts present in the digest handed to Claude; every factual meme carries a `sourceRef` that MUST exist in that digest. Relatable "struggle" memes carry no factual claim and need no `sourceRef`.
- **Real meme templates:** captions are overlaid on real template images stored in `assets/memes/templates/`; no AI image generation.
- **Output size:** each PNG renders at its template's native pixel size.
- **Fonts:** Marathi/mix text uses bundled bold Noto Sans Devanagari (`assets/fonts/`), falling back to system `Nirmala UI`; English-only zones may use the Impact "meme font" look.
- **Import conventions:** inside `src/`, import via the `@/` alias (Vitest resolves it via `vite-tsconfig-paths`). In `scripts/*.ts` run by Node, import lib modules by relative path **with the `.ts` extension** (e.g. `import { gatherDigest } from "../../src/lib/memes/gather.ts"`).
- **Node commands:** run scripts with `node scripts/memes/<file>.ts` (Node 24 strips types natively). Run tests with `npm test` (Vitest).
- **Data sources (read-only):** `src/data/bank/**/*.json` (verified question bank), `src/data/notes/**/*.md` (per-subtopic notes).
- **Commits:** commit after each task with a `feat:`/`chore:`/`test:` message.

---

## File Structure

**Pure logic (TypeScript, unit-tested by Vitest):**
- `src/lib/memes/types.ts` — `Zone`, `Template`, `FactAtom`, `Digest`, `MemeSpec`, `MemeRecord`.
- `src/lib/memes/templates.ts` — `loadTemplates()` reads/validates `assets/memes/templates.json`.
- `src/lib/memes/gather.ts` — `gatherDigest()` samples bank + notes into a capped `Digest`.
- `src/lib/memes/schema.ts` — `validateSpec()` structural + trust-rule validation.
- `src/lib/memes/compose.ts` — `composeHtml()` template image + text-zone overlay → HTML.
- `src/lib/memes/prompt.ts` — `buildAuthorPrompt()` builds the Claude authoring prompt.
- `src/lib/memes/parse.ts` — `parseSpecs()` extracts `MemeSpec[]` from model output.
- `src/lib/memes/manifest.ts` — `mergeManifest()`, `setStatus()` (pure manifest ops).

**Imperative shell (TypeScript, run by Node):**
- `scripts/memes/fetch-templates.ts` — one-time: download template images + fonts, write `templates.json`.
- `scripts/memes/author.ts` — invoke Claude CLI with one corrective retry (injectable runner).
- `scripts/memes/render.ts` — Playwright chromium: composed HTML → PNG.
- `scripts/memes/make-memes.ts` — orchestrator CLI.
- `scripts/memes/review-server.ts` — local Accept/Deny HTTP server.

**Assets & output:**
- `assets/memes/templates/*.jpg`, `assets/memes/templates.json`
- `assets/fonts/NotoSansDevanagari-Bold.ttf`
- `memes/out/<YYYY-MM-DD>/<id>.png` + `manifest.json`

---

## Task 1: Types + project setup

**Files:**
- Create: `src/lib/memes/types.ts`
- Modify: `package.json` (add `playwright` devDependency + npm scripts)
- Create: `.gitignore` entry note (ensure `memes/out/` is committed, not ignored)
- Test: `src/lib/memes/__tests__/types.test.ts`

**Interfaces:**
- Produces: the type set every later task imports.

```ts
// src/lib/memes/types.ts
export type ZoneStyle = "plain" | "impact";
export interface Zone {
  id: string;
  x: number; y: number; w: number; h: number;
  align: "left" | "center" | "right";
  valign: "top" | "center" | "bottom";
  color: string;
  style: ZoneStyle;
  fontSize: number;
}
export interface Template {
  id: string;
  file: string;      // basename under assets/memes/templates/
  width: number;
  height: number;
  zones: Zone[];
}
export interface FactAtom {
  sourceRef: string; // bank question id or note id
  subject: string;
  subtopic: string;
  fact: string;
}
export interface Digest {
  facts: FactAtom[];
  struggleThemes: string[];
}
export type Lang = "mr" | "en" | "mix";
export interface MemeSpec {
  id: string;
  subject: string;
  subtopic: string;
  template: string;                 // Template.id
  lang: Lang;
  zones: Record<string, string>;    // keyed by Template zone ids
  caption: string;                  // IG post caption (used in Phase 2)
  factLine?: string;                // present only for factual memes
  sourceRef?: string;               // required iff factLine present
  tag: string;
  altText: string;
}
export type MemeStatus = "pending" | "approved" | "rejected";
export interface MemeRecord extends MemeSpec {
  file: string;                     // png basename
  status: MemeStatus;
  createdAt: string;                // YYYY-MM-DD (passed in; no Date.now in lib)
  reviewedAt: string | null;
}
```

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/memes/__tests__/types.test.ts
import { describe, it, expect } from "vitest";
import type { MemeSpec, MemeRecord } from "@/lib/memes/types";

describe("meme types", () => {
  it("a MemeRecord is a MemeSpec plus lifecycle fields", () => {
    const spec: MemeSpec = {
      id: "history-x-0001-drake", subject: "history", subtopic: "x",
      template: "drake", lang: "mix", zones: { reject: "a", approve: "b" },
      caption: "c", tag: "#MPSC", altText: "alt",
    };
    const rec: MemeRecord = { ...spec, file: "x.png", status: "pending", createdAt: "2026-07-14", reviewedAt: null };
    expect(rec.status).toBe("pending");
    expect(rec.template).toBe("drake");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/memes/__tests__/types.test.ts`
Expected: FAIL — cannot find module `@/lib/memes/types`.

- [ ] **Step 3: Create `types.ts`** with the content above.

- [ ] **Step 4: Add deps and scripts to `package.json`.** Add to `devDependencies`: `"playwright": "^1.48.0"`. Add to `scripts`:

```json
"memes:setup": "node scripts/memes/fetch-templates.ts",
"make:memes": "node scripts/memes/make-memes.ts",
"review": "node scripts/memes/review-server.ts"
```

Then run: `npm install` and `npx playwright install chromium`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/lib/memes/__tests__/types.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/memes/types.ts src/lib/memes/__tests__/types.test.ts package.json package-lock.json
git commit -m "feat(memes): add core types and project setup"
```

---

## Task 2: Template library loader

**Files:**
- Create: `scripts/memes/fetch-templates.ts`
- Create: `src/lib/memes/templates.ts`
- Create: `assets/memes/templates.json` (produced by the fetch script, then committed)
- Test: `src/lib/memes/__tests__/templates.test.ts`

**Interfaces:**
- Consumes: `Template`, `Zone` from `types.ts`.
- Produces: `loadTemplates(dir?: string): Template[]`, `getTemplate(id: string, dir?: string): Template`.

**Starter templates** (imgflip public template images; `i.imgflip.com/<id>.jpg`): `drake` (30b1gx, 1200×1200), `two-buttons` (1g8my4, 600×908), `distracted-boyfriend` (1ur9b0, 1200×800), `expanding-brain` (1jwhww, 857×1202), `change-my-mind` (24y43o, 482×361), `gru-plan` (26jxvz, 700×707). Zone geometry is authored by hand in `fetch-templates.ts` (values below are the committed source of truth).

- [ ] **Step 1: Write `fetch-templates.ts`** — downloads each image into `assets/memes/templates/` and writes `assets/memes/templates.json`. Also downloads the Devanagari font.

```ts
// scripts/memes/fetch-templates.ts
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import type { Template } from "../../src/lib/memes/types.ts";

const TPL_DIR = "assets/memes/templates";
const FONT_DIR = "assets/fonts";

const IMAGES: Record<string, string> = {
  drake: "https://i.imgflip.com/30b1gx.jpg",
  "two-buttons": "https://i.imgflip.com/1g8my4.jpg",
  "distracted-boyfriend": "https://i.imgflip.com/1ur9b0.jpg",
  "expanding-brain": "https://i.imgflip.com/1jwhww.jpg",
  "change-my-mind": "https://i.imgflip.com/24y43o.jpg",
  "gru-plan": "https://i.imgflip.com/26jxvz.jpg",
};

const FONT_URL =
  "https://github.com/google/fonts/raw/main/ofl/notosansdevanagari/NotoSansDevanagari%5Bwdth%2Cwght%5D.ttf";

const TEMPLATES: Template[] = [
  { id: "drake", file: "drake.jpg", width: 1200, height: 1200, zones: [
    { id: "reject",  x: 640, y: 20,  w: 520, h: 520, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 52 },
    { id: "approve", x: 640, y: 620, w: 520, h: 520, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 52 },
  ]},
  { id: "two-buttons", file: "two-buttons.jpg", width: 600, height: 908, zones: [
    { id: "left",  x: 60,  y: 60, w: 210, h: 150, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 26 },
    { id: "right", x: 300, y: 20, w: 230, h: 150, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 26 },
    { id: "who",   x: 20,  y: 720, w: 560, h: 170, align: "center", valign: "center", color: "#fff", style: "impact", fontSize: 40 },
  ]},
  { id: "distracted-boyfriend", file: "distracted-boyfriend.jpg", width: 1200, height: 800, zones: [
    { id: "girlfriend", x: 820, y: 380, w: 300, h: 180, align: "center", valign: "center", color: "#fff", style: "impact", fontSize: 40 },
    { id: "man",        x: 470, y: 470, w: 260, h: 160, align: "center", valign: "center", color: "#fff", style: "impact", fontSize: 40 },
    { id: "other",      x: 120, y: 250, w: 260, h: 180, align: "center", valign: "center", color: "#fff", style: "impact", fontSize: 40 },
  ]},
  { id: "expanding-brain", file: "expanding-brain.jpg", width: 857, height: 1202, zones: [
    { id: "p1", x: 20, y: 20,  w: 420, h: 280, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 30 },
    { id: "p2", x: 20, y: 320, w: 420, h: 280, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 30 },
    { id: "p3", x: 20, y: 620, w: 420, h: 280, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 30 },
    { id: "p4", x: 20, y: 920, w: 420, h: 260, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 30 },
  ]},
  { id: "change-my-mind", file: "change-my-mind.jpg", width: 482, height: 361, zones: [
    { id: "sign", x: 150, y: 210, w: 300, h: 90, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 22 },
  ]},
  { id: "gru-plan", file: "gru-plan.jpg", width: 700, height: 707, zones: [
    { id: "s1", x: 20,  y: 10,  w: 320, h: 160, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 24 },
    { id: "s2", x: 360, y: 10,  w: 320, h: 160, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 24 },
    { id: "s3", x: 20,  y: 360, w: 320, h: 160, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 24 },
    { id: "s4", x: 360, y: 360, w: 320, h: 160, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 24 },
  ]},
];

async function download(url: string, dest: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed ${res.status}: ${url}`);
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  console.log("saved", dest);
}

async function main() {
  await mkdir(TPL_DIR, { recursive: true });
  await mkdir(FONT_DIR, { recursive: true });
  for (const [id, url] of Object.entries(IMAGES)) {
    const dest = `${TPL_DIR}/${id}.jpg`;
    if (existsSync(dest)) { console.log("skip", dest); continue; }
    await download(url, dest);
  }
  const font = `${FONT_DIR}/NotoSansDevanagari-Bold.ttf`;
  if (!existsSync(font)) await download(FONT_URL, font);
  await writeFile("assets/memes/templates.json", JSON.stringify(TEMPLATES, null, 2));
  console.log("wrote templates.json");
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run the fetch script**

Run: `node scripts/memes/fetch-templates.ts`
Expected: 6 `.jpg` files in `assets/memes/templates/`, a font file in `assets/fonts/`, and `assets/memes/templates.json` written.

- [ ] **Step 3: Write the failing test**

```ts
// src/lib/memes/__tests__/templates.test.ts
import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { loadTemplates, getTemplate } from "@/lib/memes/templates";

describe("loadTemplates", () => {
  const tpls = loadTemplates();
  it("loads at least 6 templates", () => {
    expect(tpls.length).toBeGreaterThanOrEqual(6);
  });
  it("every template image exists on disk", () => {
    for (const t of tpls) expect(existsSync(`assets/memes/templates/${t.file}`)).toBe(true);
  });
  it("every zone has complete geometry", () => {
    for (const t of tpls) for (const z of t.zones) {
      for (const k of ["x", "y", "w", "h", "fontSize"] as const) expect(typeof z[k]).toBe("number");
    }
  });
  it("getTemplate returns by id and throws on unknown", () => {
    expect(getTemplate("drake").id).toBe("drake");
    expect(() => getTemplate("nope")).toThrow();
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `npm test -- src/lib/memes/__tests__/templates.test.ts`
Expected: FAIL — cannot find module `@/lib/memes/templates`.

- [ ] **Step 5: Write `templates.ts`**

```ts
// src/lib/memes/templates.ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { Template } from "@/lib/memes/types";

export function loadTemplates(dir = "assets/memes"): Template[] {
  const json = readFileSync(resolve(dir, "templates.json"), "utf8");
  return JSON.parse(json) as Template[];
}

export function getTemplate(id: string, dir = "assets/memes"): Template {
  const t = loadTemplates(dir).find((x) => x.id === id);
  if (!t) throw new Error(`unknown template: ${id}`);
  return t;
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `npm test -- src/lib/memes/__tests__/templates.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add scripts/memes/fetch-templates.ts src/lib/memes/templates.ts src/lib/memes/__tests__/templates.test.ts assets/memes/templates.json assets/memes/templates/ assets/fonts/
git commit -m "feat(memes): template library loader + fetched templates/fonts"
```

---

## Task 3: Material digest (gather)

**Files:**
- Create: `src/lib/memes/gather.ts`
- Test: `src/lib/memes/__tests__/gather.test.ts`

**Interfaces:**
- Consumes: `Digest`, `FactAtom` from `types.ts`.
- Produces: `gatherDigest(opts?: { subject?: string; maxFacts?: number; seed?: number }): Digest`.

Reads `src/data/bank/**/*.json` (each file an array of bank questions with `id`, `subject`, `subtopic`, `explanation`) and derives one `FactAtom` per question from its `explanation` (the verified statement), plus `struggleThemes` from distinct subtopics. Caps at `maxFacts` (default 40).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/memes/__tests__/gather.test.ts
import { describe, it, expect } from "vitest";
import { gatherDigest } from "@/lib/memes/gather";

describe("gatherDigest", () => {
  it("returns fact atoms sourced from the real bank", () => {
    const d = gatherDigest({ maxFacts: 10 });
    expect(d.facts.length).toBeGreaterThan(0);
    expect(d.facts.length).toBeLessThanOrEqual(10);
    for (const f of d.facts) {
      expect(f.sourceRef).toMatch(/-\d{4}$/);
      expect(f.fact.length).toBeGreaterThan(0);
    }
  });
  it("filters by subject", () => {
    const d = gatherDigest({ subject: "history", maxFacts: 20 });
    for (const f of d.facts) expect(f.subject).toBe("history");
  });
  it("surfaces struggle themes", () => {
    expect(gatherDigest().struggleThemes.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/memes/__tests__/gather.test.ts`
Expected: FAIL — cannot find module `@/lib/memes/gather`.

- [ ] **Step 3: Write `gather.ts`**

```ts
// src/lib/memes/gather.ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/memes/__tests__/gather.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/memes/gather.ts src/lib/memes/__tests__/gather.test.ts
git commit -m "feat(memes): gather verified material into a capped digest"
```

---

## Task 4: Spec validation (structure + trust rule)

**Files:**
- Create: `src/lib/memes/schema.ts`
- Test: `src/lib/memes/__tests__/schema.test.ts`

**Interfaces:**
- Consumes: `MemeSpec`, `Digest`, `Template` from `types.ts`.
- Produces: `validateSpec(spec: unknown, ctx: { digest: Digest; templates: Template[] }): { ok: boolean; errors: string[] }`.

Rules: required string fields present (`id`, `subject`, `subtopic`, `template`, `caption`, `tag`, `altText`); `lang` ∈ {mr,en,mix}; `template` exists in `templates`; every key in `spec.zones` is a real zone id of that template AND every zone of the template is filled; if `factLine` present then `sourceRef` present and found in `digest.facts`; if `sourceRef` present then it must exist in the digest.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/memes/__tests__/schema.test.ts
import { describe, it, expect } from "vitest";
import { validateSpec } from "@/lib/memes/schema";
import type { Digest, Template, MemeSpec } from "@/lib/memes/types";

const templates: Template[] = [{
  id: "drake", file: "drake.jpg", width: 1200, height: 1200,
  zones: [
    { id: "reject", x: 0, y: 0, w: 1, h: 1, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 10 },
    { id: "approve", x: 0, y: 0, w: 1, h: 1, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 10 },
  ],
}];
const digest: Digest = { facts: [{ sourceRef: "history-x-0001", subject: "history", subtopic: "x", fact: "F" }], struggleThemes: [] };
const base: MemeSpec = {
  id: "m1", subject: "history", subtopic: "x", template: "drake", lang: "mix",
  zones: { reject: "a", approve: "b" }, caption: "c", tag: "#MPSC", altText: "alt",
};

describe("validateSpec", () => {
  it("accepts a well-formed non-factual spec", () => {
    expect(validateSpec(base, { digest, templates }).ok).toBe(true);
  });
  it("rejects unknown template", () => {
    const r = validateSpec({ ...base, template: "nope" }, { digest, templates });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/template/);
  });
  it("rejects missing zone coverage", () => {
    const r = validateSpec({ ...base, zones: { reject: "a" } }, { digest, templates });
    expect(r.ok).toBe(false);
  });
  it("rejects zone id not on the template", () => {
    const r = validateSpec({ ...base, zones: { reject: "a", approve: "b", ghost: "x" } }, { digest, templates });
    expect(r.ok).toBe(false);
  });
  it("rejects a factual spec whose sourceRef is not in the digest", () => {
    const r = validateSpec({ ...base, factLine: "F", sourceRef: "history-x-9999" }, { digest, templates });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/sourceRef|digest/);
  });
  it("accepts a factual spec with a valid sourceRef", () => {
    expect(validateSpec({ ...base, factLine: "F", sourceRef: "history-x-0001" }, { digest, templates }).ok).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/memes/__tests__/schema.test.ts`
Expected: FAIL — cannot find module `@/lib/memes/schema`.

- [ ] **Step 3: Write `schema.ts`**

```ts
// src/lib/memes/schema.ts
import type { Digest, MemeSpec, Template } from "@/lib/memes/types";

export function validateSpec(
  spec: unknown,
  ctx: { digest: Digest; templates: Template[] },
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const s = spec as Partial<MemeSpec>;
  const reqStr: (keyof MemeSpec)[] = ["id", "subject", "subtopic", "template", "caption", "tag", "altText"];
  for (const k of reqStr) if (typeof s[k] !== "string" || !(s[k] as string).length) errors.push(`missing/empty field: ${k}`);
  if (!["mr", "en", "mix"].includes(s.lang as string)) errors.push(`invalid lang: ${s.lang}`);

  const tpl = ctx.templates.find((t) => t.id === s.template);
  if (!tpl) {
    errors.push(`unknown template: ${s.template}`);
  } else {
    const zoneIds = new Set(tpl.zones.map((z) => z.id));
    const given = s.zones ?? {};
    for (const id of Object.keys(given)) if (!zoneIds.has(id)) errors.push(`zone id not on template: ${id}`);
    for (const id of zoneIds) if (typeof given[id] !== "string" || !given[id].length) errors.push(`missing zone text: ${id}`);
  }

  if (s.factLine && !s.sourceRef) errors.push("factLine present without sourceRef");
  if (s.sourceRef && !ctx.digest.facts.some((f) => f.sourceRef === s.sourceRef)) {
    errors.push(`sourceRef not in digest: ${s.sourceRef}`);
  }
  return { ok: errors.length === 0, errors };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/memes/__tests__/schema.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/memes/schema.ts src/lib/memes/__tests__/schema.test.ts
git commit -m "feat(memes): spec validation with facts-only trust rule"
```

---

## Task 5: Compose HTML (template + text overlay)

**Files:**
- Create: `src/lib/memes/compose.ts`
- Test: `src/lib/memes/__tests__/compose.test.ts`

**Interfaces:**
- Consumes: `MemeSpec`, `Template` from `types.ts`.
- Produces: `composeHtml(spec: MemeSpec, tpl: Template, opts?: { imageBaseUrl?: string; fontPath?: string }): string`.

Builds a full HTML doc: template image as full-bleed background at native size, each zone absolutely positioned per its geometry, Devanagari via bundled font (`@font-face`) with `Nirmala UI` fallback, `impact` zones upper-cased white text with black text-stroke. `imageBaseUrl` defaults to `http://localhost:<port>` at render time; in tests it is passed explicitly. Text is HTML-escaped.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/memes/__tests__/compose.test.ts
import { describe, it, expect } from "vitest";
import { composeHtml } from "@/lib/memes/compose";
import type { MemeSpec, Template } from "@/lib/memes/types";

const tpl: Template = {
  id: "drake", file: "drake.jpg", width: 1200, height: 1200,
  zones: [
    { id: "reject", x: 640, y: 20, w: 520, h: 520, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 52 },
    { id: "approve", x: 640, y: 620, w: 520, h: 520, align: "center", valign: "center", color: "#111", style: "impact", fontSize: 52 },
  ],
};
const spec: MemeSpec = {
  id: "m1", subject: "history", subtopic: "x", template: "drake", lang: "mix",
  zones: { reject: "रोज अभ्यास", approve: "daily study" }, caption: "c", tag: "#MPSC", altText: "alt",
};

describe("composeHtml", () => {
  const html = composeHtml(spec, tpl, { imageBaseUrl: "http://localhost:9999" });
  it("references the template image", () => {
    expect(html).toContain("http://localhost:9999/drake.jpg");
  });
  it("keeps Devanagari text intact", () => {
    expect(html).toContain("रोज अभ्यास");
  });
  it("positions zones by geometry", () => {
    expect(html).toContain("left:640px");
    expect(html).toContain("top:620px");
  });
  it("upper-cases impact zones", () => {
    expect(html).toMatch(/text-transform:\s*uppercase/);
  });
  it("escapes HTML in zone text", () => {
    const h = composeHtml({ ...spec, zones: { reject: "<b>x</b>", approve: "y" } }, tpl, { imageBaseUrl: "http://x" });
    expect(h).toContain("&lt;b&gt;x&lt;/b&gt;");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/memes/__tests__/compose.test.ts`
Expected: FAIL — cannot find module `@/lib/memes/compose`.

- [ ] **Step 3: Write `compose.ts`**

```ts
// src/lib/memes/compose.ts
import type { MemeSpec, Template, Zone } from "@/lib/memes/types";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function zoneCss(z: Zone): string {
  const justify = z.align === "left" ? "flex-start" : z.align === "right" ? "flex-end" : "center";
  const items = z.valign === "top" ? "flex-start" : z.valign === "bottom" ? "flex-end" : "center";
  const impact = z.style === "impact"
    ? "text-transform:uppercase;color:#fff;-webkit-text-stroke:2px #000;paint-order:stroke fill;font-family:'Anton','Arial Black',sans-serif;"
    : `color:${z.color};font-family:'NotoDeva','Nirmala UI','Segoe UI',sans-serif;`;
  return `position:absolute;left:${z.x}px;top:${z.y}px;width:${z.w}px;height:${z.h}px;` +
    `display:flex;justify-content:${justify};align-items:${items};text-align:${z.align};` +
    `font-size:${z.fontSize}px;font-weight:800;line-height:1.18;padding:8px;box-sizing:border-box;${impact}`;
}

export function composeHtml(
  spec: MemeSpec,
  tpl: Template,
  opts: { imageBaseUrl?: string; fontPath?: string } = {},
): string {
  const base = opts.imageBaseUrl ?? "http://localhost:8791";
  const fontFace = opts.fontPath
    ? `@font-face{font-family:'NotoDeva';src:url('${opts.fontPath}');font-weight:400 900;}`
    : "";
  const zones = tpl.zones.map((z) => `<div style="${zoneCss(z)}">${esc(spec.zones[z.id] ?? "")}</div>`).join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box;}
    ${fontFace}
    html,body{width:${tpl.width}px;height:${tpl.height}px;overflow:hidden;}
    body{position:relative;}
    img.bg{position:absolute;inset:0;width:${tpl.width}px;height:${tpl.height}px;display:block;}
  </style></head><body>
    <img class="bg" src="${base}/${tpl.file}" alt="">
    ${zones}
  </body></html>`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/memes/__tests__/compose.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/memes/compose.ts src/lib/memes/__tests__/compose.test.ts
git commit -m "feat(memes): compose template+text overlay HTML"
```

---

## Task 6: Author prompt + model output parsing

**Files:**
- Create: `src/lib/memes/prompt.ts`
- Create: `src/lib/memes/parse.ts`
- Test: `src/lib/memes/__tests__/prompt.test.ts`

**Interfaces:**
- Consumes: `Digest`, `Template` from `types.ts`.
- Produces: `buildAuthorPrompt(ctx: { digest: Digest; templates: Template[]; count: number; langMix: string }): string`; `parseSpecs(modelText: string): unknown[]`.

`buildAuthorPrompt` embeds the digest facts (with sourceRefs), the template ids + zone ids, the trust rule, and the language-mix instruction, and demands a raw JSON array of `MemeSpec`. `parseSpecs` extracts the first JSON array from the text (tolerating ```json fences and surrounding prose).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/memes/__tests__/prompt.test.ts
import { describe, it, expect } from "vitest";
import { buildAuthorPrompt } from "@/lib/memes/prompt";
import { parseSpecs } from "@/lib/memes/parse";
import type { Digest, Template } from "@/lib/memes/types";

const digest: Digest = { facts: [{ sourceRef: "history-x-0001", subject: "history", subtopic: "x", fact: "The Great Bath was at Mohenjo-daro." }], struggleThemes: ["polity"] };
const templates: Template[] = [{ id: "drake", file: "d.jpg", width: 1, height: 1, zones: [{ id: "reject", x: 0, y: 0, w: 1, h: 1, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 10 }, { id: "approve", x: 0, y: 0, w: 1, h: 1, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 10 }] }];

describe("buildAuthorPrompt", () => {
  const p = buildAuthorPrompt({ digest, templates, count: 5, langMix: "balanced" });
  it("includes fact + sourceRef, template + zone ids, trust rule, count", () => {
    expect(p).toContain("history-x-0001");
    expect(p).toContain("Mohenjo-daro");
    expect(p).toContain("drake");
    expect(p).toContain("reject");
    expect(p).toMatch(/only.*facts.*digest/i);
    expect(p).toContain("5");
  });
});

describe("parseSpecs", () => {
  it("extracts a fenced JSON array", () => {
    const txt = "Here you go:\n```json\n[{\"id\":\"a\"}]\n```\nDone.";
    expect(parseSpecs(txt)).toEqual([{ id: "a" }]);
  });
  it("extracts a bare JSON array", () => {
    expect(parseSpecs('[{"id":"b"}]')).toEqual([{ id: "b" }]);
  });
  it("throws on no array", () => {
    expect(() => parseSpecs("no json here")).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/memes/__tests__/prompt.test.ts`
Expected: FAIL — cannot find modules `@/lib/memes/prompt` / `parse`.

- [ ] **Step 3: Write `parse.ts`**

```ts
// src/lib/memes/parse.ts
export function parseSpecs(modelText: string): unknown[] {
  const fence = modelText.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : modelText;
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) throw new Error("no JSON array found in model output");
  const arr = JSON.parse(candidate.slice(start, end + 1));
  if (!Array.isArray(arr)) throw new Error("parsed value is not an array");
  return arr;
}
```

- [ ] **Step 4: Write `prompt.ts`**

```ts
// src/lib/memes/prompt.ts
import type { Digest, Template } from "@/lib/memes/types";

export function buildAuthorPrompt(ctx: { digest: Digest; templates: Template[]; count: number; langMix: string }): string {
  const { digest, templates, count, langMix } = ctx;
  const facts = digest.facts.map((f) => `- [${f.sourceRef}] (${f.subject}/${f.subtopic}) ${f.fact}`).join("\n");
  const tpls = templates.map((t) => `- ${t.id}: zones = [${t.zones.map((z) => z.id).join(", ")}]`).join("\n");
  return `You are a witty Marathi+English meme writer for MPSC Group-C exam aspirants.
Write ${count} memes as a JSON array of MemeSpec objects. Output ONLY the JSON array.

LANGUAGE MIX: ${langMix} — mix pure-Marathi, pure-English, and Marathi-English ("Minglish") memes. Humor-forward, a few motivational. Keep captions short and punchy.

TRUST RULE: If a meme states a factual claim, it MUST use only facts from the DIGEST below, and set "factLine" to that fact and "sourceRef" to its [id]. Relatable study-struggle memes need no fact and omit factLine/sourceRef. Never invent facts.

TEMPLATES (pick one per meme; fill EVERY listed zone id):
${tpls}

DIGEST (the only allowed facts):
${facts}

STRUGGLE THEMES (for relatable memes): ${digest.struggleThemes.join(", ")}

Each MemeSpec: { "id": kebab-unique, "subject", "subtopic", "template": one id above, "lang": "mr"|"en"|"mix", "zones": { <every zone id>: text }, "caption": Instagram caption with emojis, "tag": hashtags, "altText": description, and for factual memes also "factLine" + "sourceRef" }.`;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/lib/memes/__tests__/prompt.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/memes/prompt.ts src/lib/memes/parse.ts src/lib/memes/__tests__/prompt.test.ts
git commit -m "feat(memes): author prompt builder + model output parser"
```

---

## Task 7: Author orchestration (Claude CLI + retry)

**Files:**
- Create: `scripts/memes/author.ts`
- Test: `src/lib/memes/__tests__/author.test.ts` (tests the pure retry logic via an injected runner)

**Interfaces:**
- Consumes: `buildAuthorPrompt`, `parseSpecs`, `validateSpec`, `Digest`, `Template`, `MemeSpec`.
- Produces (in `author.ts`):
  - `authorSpecs(ctx, run): Promise<MemeSpec[]>` where `run: (prompt: string) => Promise<string>` is the model runner (injectable for tests; defaults to the Claude CLI runner).
  - `claudeRunner(prompt: string): Promise<string>` — spawns `claude -p --output-format text`.

`authorSpecs`: build prompt → `run` → `parseSpecs` → keep specs passing `validateSpec`; if zero valid OR parse throws, retry once with an appended correction listing the errors; return the valid specs (possibly empty, logged).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/memes/__tests__/author.test.ts
import { describe, it, expect, vi } from "vitest";
import { authorSpecs } from "../../../../scripts/memes/author.ts";
import type { Digest, Template } from "@/lib/memes/types";

const digest: Digest = { facts: [{ sourceRef: "history-x-0001", subject: "history", subtopic: "x", fact: "F" }], struggleThemes: ["x"] };
const templates: Template[] = [{ id: "drake", file: "d.jpg", width: 1, height: 1, zones: [
  { id: "reject", x: 0, y: 0, w: 1, h: 1, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 10 },
  { id: "approve", x: 0, y: 0, w: 1, h: 1, align: "center", valign: "center", color: "#111", style: "plain", fontSize: 10 },
]}];
const good = JSON.stringify([{ id: "m1", subject: "history", subtopic: "x", template: "drake", lang: "mix", zones: { reject: "a", approve: "b" }, caption: "c", tag: "#MPSC", altText: "alt" }]);

describe("authorSpecs", () => {
  it("returns valid specs from the runner", async () => {
    const run = vi.fn().mockResolvedValue(good);
    const specs = await authorSpecs({ digest, templates, count: 1, langMix: "balanced" }, run);
    expect(specs).toHaveLength(1);
    expect(run).toHaveBeenCalledTimes(1);
  });
  it("retries once on invalid output then succeeds", async () => {
    const run = vi.fn().mockResolvedValueOnce("garbage").mockResolvedValueOnce(good);
    const specs = await authorSpecs({ digest, templates, count: 1, langMix: "balanced" }, run);
    expect(specs).toHaveLength(1);
    expect(run).toHaveBeenCalledTimes(2);
  });
  it("returns [] if both attempts fail", async () => {
    const run = vi.fn().mockResolvedValue("garbage");
    const specs = await authorSpecs({ digest, templates, count: 1, langMix: "balanced" }, run);
    expect(specs).toEqual([]);
    expect(run).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/memes/__tests__/author.test.ts`
Expected: FAIL — cannot find `scripts/memes/author.ts`.

- [ ] **Step 3: Write `author.ts`**

```ts
// scripts/memes/author.ts
import { spawn } from "node:child_process";
import { buildAuthorPrompt } from "../../src/lib/memes/prompt.ts";
import { parseSpecs } from "../../src/lib/memes/parse.ts";
import { validateSpec } from "../../src/lib/memes/schema.ts";
import type { Digest, MemeSpec, Template } from "../../src/lib/memes/types.ts";

export type ModelRunner = (prompt: string) => Promise<string>;

export function claudeRunner(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("claude", ["-p", "--output-format", "text"], { stdio: ["pipe", "pipe", "inherit"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(`claude exited ${code}`))));
    child.stdin.write(prompt);
    child.stdin.end();
  });
}

function keepValid(raw: unknown[], ctx: { digest: Digest; templates: Template[] }): { specs: MemeSpec[]; errors: string[] } {
  const specs: MemeSpec[] = [];
  const errors: string[] = [];
  for (const r of raw) {
    const v = validateSpec(r, ctx);
    if (v.ok) specs.push(r as MemeSpec);
    else errors.push(...v.errors);
  }
  return { specs, errors };
}

export async function authorSpecs(
  ctx: { digest: Digest; templates: Template[]; count: number; langMix: string },
  run: ModelRunner = claudeRunner,
): Promise<MemeSpec[]> {
  const prompt = buildAuthorPrompt(ctx);
  const attempt = async (p: string) => {
    try { return keepValid(parseSpecs(await run(p)), ctx); }
    catch (e) { return { specs: [] as MemeSpec[], errors: [String(e)] }; }
  };
  let res = await attempt(prompt);
  if (res.specs.length === 0) {
    const fix = `${prompt}\n\nYOUR PREVIOUS OUTPUT WAS INVALID. Fix these and output ONLY the JSON array:\n- ${res.errors.slice(0, 10).join("\n- ")}`;
    res = await attempt(fix);
  }
  if (res.specs.length === 0) console.warn("[author] no valid specs after retry:", res.errors.slice(0, 5));
  return res.specs;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/memes/__tests__/author.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/memes/author.ts src/lib/memes/__tests__/author.test.ts
git commit -m "feat(memes): author orchestration with Claude CLI + one retry"
```

---

## Task 8: Render (Playwright) + manifest ops

**Files:**
- Create: `scripts/memes/render.ts`
- Create: `src/lib/memes/manifest.ts`
- Test: `src/lib/memes/__tests__/manifest.test.ts`
- Test: `scripts/memes/__tests__/render.smoke.test.ts`

**Interfaces:**
- Consumes: `composeHtml`, `Template`, `MemeSpec`, `MemeRecord`.
- Produces:
  - `mergeManifest(existing: MemeRecord[], incoming: MemeRecord[]): MemeRecord[]` — add new by `id`; preserve existing records' `status`/`reviewedAt`.
  - `setStatus(m: MemeRecord[], id: string, status: MemeStatus, reviewedAt: string): MemeRecord[]`.
  - `renderMeme(spec, tpl, outPath, opts): Promise<void>` — serve template dir, screenshot to PNG.

- [ ] **Step 1: Write the failing manifest test**

```ts
// src/lib/memes/__tests__/manifest.test.ts
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
```

- [ ] **Step 2: Run manifest test to verify it fails**

Run: `npm test -- src/lib/memes/__tests__/manifest.test.ts`
Expected: FAIL — cannot find `@/lib/memes/manifest`.

- [ ] **Step 3: Write `manifest.ts`**

```ts
// src/lib/memes/manifest.ts
import type { MemeRecord, MemeStatus } from "@/lib/memes/types";

export function mergeManifest(existing: MemeRecord[], incoming: MemeRecord[]): MemeRecord[] {
  const byId = new Map(existing.map((r) => [r.id, r]));
  for (const r of incoming) if (!byId.has(r.id)) byId.set(r.id, r);
  return [...byId.values()];
}

export function setStatus(m: MemeRecord[], id: string, status: MemeStatus, reviewedAt: string): MemeRecord[] {
  return m.map((r) => (r.id === id ? { ...r, status, reviewedAt } : r));
}
```

- [ ] **Step 4: Run manifest test to verify it passes**

Run: `npm test -- src/lib/memes/__tests__/manifest.test.ts`
Expected: PASS.

- [ ] **Step 5: Write `render.ts`**

```ts
// scripts/memes/render.ts
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { chromium } from "playwright";
import { composeHtml } from "../../src/lib/memes/compose.ts";
import type { MemeSpec, Template } from "../../src/lib/memes/types.ts";

const TPL_DIR = "assets/memes/templates";
const FONT = "assets/fonts/NotoSansDevanagari-Bold.ttf";

async function serveAssets(): Promise<{ url: string; close: () => void }> {
  const server = createServer(async (req, res) => {
    try {
      const name = decodeURIComponent((req.url ?? "/").slice(1));
      const buf = await readFile(name.startsWith("fonts/") ? name.replace("fonts/", "assets/fonts/") : join(TPL_DIR, name));
      res.writeHead(200); res.end(buf);
    } catch { res.writeHead(404); res.end(); }
  });
  await new Promise<void>((r) => server.listen(0, r));
  const port = (server.address() as { port: number }).port;
  return { url: `http://localhost:${port}`, close: () => server.close() };
}

export async function renderMeme(spec: MemeSpec, tpl: Template, outPath: string): Promise<void> {
  const assets = await serveAssets();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: tpl.width, height: tpl.height } });
    const html = composeHtml(spec, tpl, { imageBaseUrl: assets.url, fontPath: `${assets.url}/fonts/${FONT.split("/").pop()}` });
    await page.setContent(html, { waitUntil: "networkidle" });
    await page.evaluate(() => (document as any).fonts.ready);
    await page.screenshot({ path: outPath, type: "png" });
  } finally {
    await browser.close();
    assets.close();
  }
}
```

- [ ] **Step 6: Write the render smoke test**

```ts
// scripts/memes/__tests__/render.smoke.test.ts
import { describe, it, expect } from "vitest";
import { existsSync, statSync, readFileSync, mkdirSync } from "node:fs";
import { renderMeme } from "../render.ts";
import { getTemplate } from "@/lib/memes/templates";
import type { MemeSpec } from "@/lib/memes/types";

const hasChromium = existsSync("node_modules/playwright") && existsSync("assets/memes/templates/drake.jpg");
const maybe = hasChromium ? it : it.skip;

describe("renderMeme smoke", () => {
  maybe("renders a valid PNG", async () => {
    mkdirSync("memes/out/_test", { recursive: true });
    const tpl = getTemplate("drake");
    const spec: MemeSpec = { id: "smoke", subject: "s", subtopic: "t", template: "drake", lang: "mix",
      zones: { reject: "रट्टा", approve: "roj practice" }, caption: "c", tag: "#x", altText: "a" };
    const out = "memes/out/_test/smoke.png";
    await renderMeme(spec, tpl, out);
    expect(existsSync(out)).toBe(true);
    expect(statSync(out).size).toBeGreaterThan(1000);
    const magic = readFileSync(out).subarray(0, 4);
    expect([...magic]).toEqual([0x89, 0x50, 0x4e, 0x47]); // PNG magic
  }, 60000);
});
```

- [ ] **Step 7: Run render + manifest tests**

Run: `npm test -- src/lib/memes/__tests__/manifest.test.ts scripts/memes/__tests__/render.smoke.test.ts`
Expected: manifest PASS; smoke test PASS (or SKIP if chromium/templates absent).

Note: add `scripts/**/*.test.ts` to `vitest.config.mts` `include` so the smoke test runs:
```ts
include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
```

- [ ] **Step 8: Commit**

```bash
git add scripts/memes/render.ts src/lib/memes/manifest.ts src/lib/memes/__tests__/manifest.test.ts scripts/memes/__tests__/render.smoke.test.ts vitest.config.mts
git commit -m "feat(memes): Playwright render + manifest merge/status ops"
```

---

## Task 9: Orchestrator CLI (`make:memes`)

**Files:**
- Create: `scripts/memes/make-memes.ts`
- Test: `scripts/memes/__tests__/make-memes.test.ts` (tests the pure `assembleBatch` step with a stub author)

**Interfaces:**
- Consumes: `gatherDigest`, `loadTemplates`, `authorSpecs`, `getTemplate`, `renderMeme`, `mergeManifest`, types.
- Produces: `assembleBatch(specs: MemeSpec[], date: string): MemeRecord[]`; `main()` (CLI).

CLI flags: `--count` (default 8), `--subject`, `--lang` (default balanced), `--date` (default: read from `process.env` or arg — **no `Date.now()` in lib**; the CLI computes the date string via `new Date().toISOString().slice(0,10)` which is allowed in a script entry, not in `src/lib`).

- [ ] **Step 1: Write the failing test**

```ts
// scripts/memes/__tests__/make-memes.test.ts
import { describe, it, expect } from "vitest";
import { assembleBatch } from "../make-memes.ts";
import type { MemeSpec } from "@/lib/memes/types";

const spec: MemeSpec = { id: "m1", subject: "s", subtopic: "t", template: "drake", lang: "mix",
  zones: { reject: "a", approve: "b" }, caption: "c", tag: "#x", altText: "alt" };

describe("assembleBatch", () => {
  it("wraps specs into pending records with file + date", () => {
    const recs = assembleBatch([spec], "2026-07-14");
    expect(recs[0].status).toBe("pending");
    expect(recs[0].file).toBe("m1.png");
    expect(recs[0].createdAt).toBe("2026-07-14");
    expect(recs[0].reviewedAt).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scripts/memes/__tests__/make-memes.test.ts`
Expected: FAIL — cannot find `../make-memes.ts`.

- [ ] **Step 3: Write `make-memes.ts`**

```ts
// scripts/memes/make-memes.ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
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
  const count = Number(arg("count", "8"));
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

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scripts/memes/__tests__/make-memes.test.ts`
Expected: PASS.

- [ ] **Step 5: End-to-end dry run** (real Claude CLI; requires `claude` authenticated)

Run: `node scripts/memes/make-memes.ts --count 3`
Expected: `memes/out/<today>/manifest.json` + up to 3 PNGs. Open a PNG and eyeball it.

- [ ] **Step 6: Commit**

```bash
git add scripts/memes/make-memes.ts scripts/memes/__tests__/make-memes.test.ts
git commit -m "feat(memes): make:memes orchestrator CLI"
```

---

## Task 10: Accept/Deny review server

**Files:**
- Create: `scripts/memes/review-server.ts`
- Test: `scripts/memes/__tests__/review-handlers.test.ts`

**Interfaces:**
- Consumes: `setStatus`, `MemeRecord`.
- Produces: `handleAction(manifest, body): { manifest, changed }` (pure); `main()` starts the HTTP server on `localhost:4321` serving the gallery + PNGs and applying actions.

The gallery HTML lists each record's PNG, caption, subject, `sourceRef`, and its status, with **✅ Accept** / **❌ Deny** buttons that POST `{ id, status }` to `/action`; the handler flips status via `setStatus` and rewrites `manifest.json`. A filter (`?filter=pending|approved|rejected`) narrows the list.

- [ ] **Step 1: Write the failing test**

```ts
// scripts/memes/__tests__/review-handlers.test.ts
import { describe, it, expect } from "vitest";
import { handleAction } from "../review-server.ts";
import type { MemeRecord } from "@/lib/memes/types";

const rec: MemeRecord = { id: "a", subject: "s", subtopic: "t", template: "drake", lang: "mix", zones: {},
  caption: "c", tag: "#x", altText: "alt", file: "a.png", status: "pending", createdAt: "2026-07-14", reviewedAt: null };

describe("handleAction", () => {
  it("approves a record", () => {
    const { manifest, changed } = handleAction([rec], { id: "a", status: "approved" }, "2026-07-14");
    expect(changed).toBe(true);
    expect(manifest[0].status).toBe("approved");
  });
  it("ignores unknown id", () => {
    const { changed } = handleAction([rec], { id: "zzz", status: "approved" }, "2026-07-14");
    expect(changed).toBe(false);
  });
  it("rejects invalid status", () => {
    expect(() => handleAction([rec], { id: "a", status: "banana" as any }, "2026-07-14")).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- scripts/memes/__tests__/review-handlers.test.ts`
Expected: FAIL — cannot find `../review-server.ts`.

- [ ] **Step 3: Write `review-server.ts`**

```ts
// scripts/memes/review-server.ts
import { createServer } from "node:http";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { setStatus } from "../../src/lib/memes/manifest.ts";
import type { MemeRecord, MemeStatus } from "../../src/lib/memes/types.ts";

const VALID: MemeStatus[] = ["pending", "approved", "rejected"];

export function handleAction(
  manifest: MemeRecord[],
  body: { id: string; status: MemeStatus },
  reviewedAt: string,
): { manifest: MemeRecord[]; changed: boolean } {
  if (!VALID.includes(body.status)) throw new Error(`invalid status: ${body.status}`);
  if (!manifest.some((r) => r.id === body.id)) return { manifest, changed: false };
  return { manifest: setStatus(manifest, body.id, body.status, reviewedAt), changed: true };
}

function page(records: MemeRecord[], filter: string): string {
  const shown = filter === "all" ? records : records.filter((r) => r.status === filter);
  const cards = shown.map((r) => `
    <div class="card ${r.status}">
      <img src="/png/${r.file}" width="360">
      <div class="meta"><b>${r.subject}</b> · ${r.template} · <i>${r.status}</i><br>
      <small>${r.caption}</small><br><small>src: ${r.sourceRef ?? "—"}</small></div>
      <div class="btns">
        <button onclick="act('${r.id}','approved')">✅ Accept</button>
        <button onclick="act('${r.id}','rejected')">❌ Deny</button>
      </div>
    </div>`).join("");
  return `<!doctype html><meta charset=utf-8><title>Meme review</title>
  <style>body{font-family:system-ui;background:#0f172a;color:#fff;padding:20px}
  .card{display:inline-block;width:380px;vertical-align:top;margin:10px;background:#1e293b;border-radius:12px;padding:12px}
  .approved{outline:3px solid #22c55e}.rejected{opacity:.5}
  button{font-size:16px;padding:8px 14px;margin:6px 4px;border:0;border-radius:8px;cursor:pointer}
  nav a{color:#93c5fd;margin-right:12px}</style>
  <nav>Filter: <a href="?filter=pending">pending</a><a href="?filter=approved">approved</a>
  <a href="?filter=rejected">rejected</a><a href="?filter=all">all</a></nav>
  <div>${cards || "<p>Nothing here.</p>"}</div>
  <script>async function act(id,status){await fetch('/action',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id,status})});location.reload();}</script>`;
}

async function main() {
  const i = process.argv.indexOf("--dir");
  const date = new Date().toISOString().slice(0, 10);
  const dir = i >= 0 ? process.argv[i + 1] : join("memes", "out", date);
  const manifestPath = join(dir, "manifest.json");
  if (!existsSync(manifestPath)) { console.error("no manifest at", manifestPath); process.exit(1); }

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    const manifest: MemeRecord[] = JSON.parse(await readFile(manifestPath, "utf8"));
    if (url.pathname === "/action" && req.method === "POST") {
      let raw = ""; for await (const c of req) raw += c;
      try {
        const { manifest: next, changed } = handleAction(manifest, JSON.parse(raw), new Date().toISOString().slice(0, 10));
        if (changed) await writeFile(manifestPath, JSON.stringify(next, null, 2));
        res.writeHead(200); res.end("ok");
      } catch (e) { res.writeHead(400); res.end(String(e)); }
      return;
    }
    if (url.pathname.startsWith("/png/")) {
      try { res.writeHead(200, { "content-type": "image/png" }); res.end(await readFile(join(dir, url.pathname.slice(5)))); }
      catch { res.writeHead(404); res.end(); }
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(page(manifest, url.searchParams.get("filter") ?? "pending"));
  });
  server.listen(4321, () => console.log("review UI: http://localhost:4321"));
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- scripts/memes/__tests__/review-handlers.test.ts`
Expected: PASS.

- [ ] **Step 5: Manual check**

Run: `node scripts/memes/review-server.ts` → open `http://localhost:4321` → Accept/Deny a couple → confirm `manifest.json` statuses change.

- [ ] **Step 6: Commit**

```bash
git add scripts/memes/review-server.ts scripts/memes/__tests__/review-handlers.test.ts
git commit -m "feat(memes): local Accept/Deny review server"
```

---

## Task 11: README + full test pass

**Files:**
- Modify: `prep_partner/README.md` (add a "🖼️ Meme engine" section)

- [ ] **Step 1: Add README section** documenting: `npm run memes:setup` (one-time), `npm run make:memes -- --count 16 --subject history`, `npm run review`; the Accept/Deny flow; the facts-only rule; where PNGs/manifest land; and that Instagram publishing is Phase 2.

- [ ] **Step 2: Run the whole suite**

Run: `npm test`
Expected: all meme tests green (render smoke may skip without chromium).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(memes): document the meme engine usage"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** gather (Task 3), author + Claude CLI + retry (Tasks 6–7), schema/trust rule (Task 4), compose/templates (Tasks 2, 5), render (Task 8), orchestrator + manifest pending (Tasks 8–9), review Accept/Deny (Task 10), tests throughout, README (Task 11), new deps + template/font fetch (Tasks 1–2). Real-template pivot reflected in Tasks 2 & 5. ✅
- **Out of scope (correctly absent):** Instagram publishing, scheduler, public hosting — all Phase 2.
- **Type consistency:** `MemeSpec`/`MemeRecord`/`Template`/`Zone`/`Digest`/`FactAtom` defined in Task 1 and used verbatim after; `validateSpec`, `composeHtml`, `authorSpecs`, `mergeManifest`, `setStatus`, `handleAction`, `assembleBatch`, `renderMeme` signatures are consistent across producer/consumer tasks. ✅
- **No `Date.now()` in `src/lib`:** date strings are passed in; only script entry `main()`s call `new Date()`. ✅
- **Placeholder scan:** no TBD/TODO; every code step has complete code. ✅
