# MPSC Meme Engine — Phase 1 (Generation + Review) — Design

**Date:** 2026-07-14
**Status:** Approved for spec review
**Scope:** Phase 1 of a 3-part system. This spec covers **meme generation** and **local review/approval** only. Phase 2 (Instagram publishing + 3-hour scheduler) is deliberately out of scope and gets its own spec.

---

## 1. Goal & context

Turn the existing MPSC Group-C study material (`prep_partner/src/data/bank/*.json` verified question bank + `src/data/notes/*.md`) into shareable **image memes** for MPSC aspirants, authored by Claude CLI and rendered to PNG — with a human approval gate before anything is published.

**One engine, two uses:** the same PNGs + manifest serve both social posting (Phase 2) and potential in-app revision content (later).

**Non-negotiable trust rule:** MPSC aspirants will treat these as factual. Any meme that makes a factual claim may use **only** facts present in the material digest handed to Claude (the verified bank + notes). No free-recall general knowledge. Relatable "study struggle" memes with no factual claim are allowed and encouraged.

### Locked decisions (from brainstorming)
- **Format:** Claude-designed HTML → PNG. No external image-generation API.
- **Language/tone:** bilingual balanced — a mix of pure-Marathi, pure-English, and Marathi-English-mix memes; humor-forward with some motivational.
- **Delivery:** repeatable batch generator script (`npm run make:memes`).
- **Review:** simple local web page with Approve/Reject, writing status to the manifest.
- **Volume target (pilot):** up to ~56 memes over one week (feeds Phase 2's 8/day × 7). Generated in batches, not all at once.

---

## 2. Architecture

Two stages plus a review server, all under `prep_partner/`.

```
prep_partner/
  scripts/memes/
    gather.mjs          # sample verified bank + notes -> compact "material digest"
    author.mjs          # build prompt, invoke `claude -p`, parse + validate MemeSpec[]
    schema.mjs          # MemeSpec definition + validate()
    templates.mjs       # 4 HTML/CSS meme layouts (bilingual-aware, branded)
    render.mjs          # Playwright chromium: HTML -> 1080x1080 PNG
    review-server.mjs   # standalone local http server: gallery + approve/reject
  scripts/make-memes.mjs        # orchestrator CLI (gather -> author -> render -> manifest)
  assets/fonts/NotoSansDevanagari-Regular.ttf
  assets/fonts/NotoSansDevanagari-Bold.ttf
  memes/out/<YYYY-MM-DD>/
    <id>.png
    manifest.json               # array of MemeRecord (see schema)
  package.json                  # + "make:memes", "review" scripts; + playwright dep
```

**Data flow**

```
bank/*.json + notes/*.md
      │  gather.mjs (sample by subject, extract fact atoms)
      ▼
material digest (JSON, compact)
      │  author.mjs -> `claude -p` (headless) -> MemeSpec[] JSON
      ▼
validate schema.mjs  ──(bad JSON)──> one corrective retry ──> skip invalid specs
      │
      ▼  render.mjs (templates.mjs -> HTML -> Playwright PNG)
memes/out/<date>/<id>.png  +  manifest.json (status: "pending")
      │
      ▼  review-server.mjs  ("npm run review")
YOU approve/reject in browser -> manifest status updated ("approved"/"rejected")
```

**Why standalone review server, not a Next.js page:** keeps review decoupled from the app (per the "simple local web page, not in-app tab" decision) and lets `npm run review` run without booting the whole Next dev server. It is a ~single-file Node `http` server with no framework dependency.

---

## 3. Components (what / how-used / depends-on)

### 3.1 `gather.mjs`
- **What:** reads `src/data/bank/**/*.json` and `src/data/notes/**/*.md`, samples a spread across subjects, and emits a compact **material digest**: an array of "fact atoms" `{ sourceRef, subject, subtopic, fact }` plus a few "struggle themes" (topic names aspirants find hard, derived from subtopics). Caps size so the prompt stays small.
- **Used as:** `gatherDigest({ subject?, count }) -> Digest`.
- **Depends on:** filesystem only. No network.

### 3.2 `author.mjs`
- **What:** builds the authoring prompt (digest + rules + layout catalog + language mix target), invokes Claude CLI headless via `claude -p --output-format json`, extracts the model text, parses the `MemeSpec[]` JSON.
- **Retry:** if parse/validate fails, one corrective re-invocation including the validation errors. After that, invalid specs are dropped (logged), not fatal.
- **Used as:** `authorSpecs({ digest, count, langMix }) -> MemeSpec[]`.
- **Depends on:** `claude` CLI on PATH (authenticated). Fallback documented: swap this module to call the app's existing Groq client — same interface, out of scope to build now.

### 3.3 `schema.mjs`
- **What:** the `MemeSpec` shape + a `validate(spec, digest)` that enforces structure **and** the trust rule: if a spec has a `factLine`/factual `sourceRef`, that `sourceRef` must exist in the digest.
- **Used as:** `validate(spec, digest) -> { ok, errors }`.
- **Depends on:** nothing (hand-written validator; no zod needed, keeps deps minimal).

### 3.4 `templates.mjs`
- **What:** pure functions `spec -> HTML string` for 4 layouts. Bilingual-aware (renders Devanagari + Latin), branded (consistent palette, app wordmark, bundled Noto Sans Devanagari via `@font-face` data/`file://`). 1080×1080 canvas.
  - `drake` — two panels: ❌ wrong method / ✅ right method.
  - `brain` — expanding-brain escalating study levels.
  - `relatable` — single struggle line, big type (no factual claim).
  - `factflex` — one punchy verified fact, source-tagged footer.
- **Used as:** `renderHtml(spec) -> string`.
- **Depends on:** bundled font files.

### 3.5 `render.mjs`
- **What:** launches Playwright chromium, sets viewport 1080×1080 dpr 2, sets content to the template HTML, waits for fonts, screenshots to PNG.
- **Used as:** `renderPng(html, outPath) -> Promise<void>`. Per-meme failure is caught and skipped; batch continues.
- **Depends on:** `playwright` (new devDependency; chromium installed via `npx playwright install chromium`).

### 3.6 `make-memes.mjs` (orchestrator)
- **What:** CLI entry. Flags: `--count <n>` (default 8), `--subject <name>` (optional filter), `--lang <mr|en|mix|balanced>` (default balanced), `--out <date-dir>` (default today).
- **Flow:** gather → author → validate → render each valid spec → write/merge `manifest.json` with `status: "pending"`.
- **Used as:** `npm run make:memes -- --count 16`.

### 3.7 `review-server.mjs`
- **What:** `npm run review` starts a local server (e.g. `http://localhost:4321`). Serves a gallery of the latest batch: each meme's PNG + caption + `sourceRef`, with **Approve** / **Reject** buttons and a filter (pending/approved/rejected). Buttons POST to update the manifest `status`. Also an "export approved list" view.
- **Used as:** `npm run review [-- --dir memes/out/2026-07-14]`.
- **Depends on:** Node `http`/`fs` only; reads/writes `manifest.json` and serves PNGs from disk.

---

## 4. Data model

**MemeSpec** (authored by Claude, validated):
```jsonc
{
  "id": "history-ancient-medieval-0001-drake",  // subject-subtopic-source-template or generated
  "subject": "history",
  "subtopic": "ancient-medieval",
  "template": "drake",                 // drake | brain | relatable | factflex
  "lang": "mix",                       // mr | en | mix
  "topText": "...",                    // template-dependent fields
  "bottomText": "...",
  "panels": [{ "label": "...", "text": "..." }],  // for brain
  "factLine": "The Great Bath was found at Mohenjo-daro",  // factflex only
  "tag": "#MPSC #इतिहास",
  "altText": "accessible description of the meme",
  "sourceRef": "history-ancient-medieval-0001"   // bank/note id; required if factual
}
```

**MemeRecord** (manifest entry = spec + lifecycle):
```jsonc
{
  "...spec fields...": "",
  "file": "history-ancient-medieval-0001-drake.png",
  "status": "pending",                 // pending | approved | rejected
  "createdAt": "2026-07-14",
  "reviewedAt": null
}
```
`manifest.json` is an array of MemeRecord. Manifest format is intentionally forward-compatible with Phase 2 (which adds `postedAt`, `igMediaId`) and in-app reuse.

---

## 5. Error handling

- **Bad model JSON:** one corrective retry with the parser/validator errors appended; then drop unparseable output with a logged warning.
- **Spec fails schema/trust rule:** skipped, counted, logged with reason. Never fatal.
- **Render failure (one meme):** caught, that meme skipped, batch continues; summary reports made vs skipped.
- **`claude` CLI missing/unauthenticated:** fail fast with a clear message and the Groq-fallback note.
- **Missing font files:** fail fast at startup (deterministic Marathi rendering depends on them).
- **Re-runs:** `make:memes` merges into the day's manifest without clobbering already-reviewed records (match by `id`).

---

## 6. Testing (Vitest, matches existing `npm test`)

- **schema.test:** valid spec passes; missing required field fails; factual spec with a `sourceRef` absent from digest fails (trust rule); relatable spec with no fact passes without sourceRef.
- **templates.test:** each of the 4 templates returns HTML containing the spec's text and the expected structural markers; Devanagari string survives into the HTML unescaped-broken.
- **render smoke test:** a fixture spec → real PNG on disk that is non-empty and PNG-magic-bytes valid. (Guarded to skip if chromium not installed, so CI without browsers still green.)
- **manifest merge:** re-running author over an existing manifest preserves `approved`/`rejected` statuses.

Not tested (manual): the review-server UI interactions and actual Claude authoring quality (that's what human review is for).

---

## 7. Scope boundaries

**In scope (Phase 1):** the 7 modules above, 4 templates, bundled Devanagari fonts, `make:memes` + `review` npm scripts, tests, and a short README section documenting usage.

**Out of scope (Phase 2, separate spec):** Instagram Graph API publishing, public image hosting on Vercel, the every-3-hours 24h scheduler (Vercel Cron), and the Meta app/token setup guide. The manifest schema is designed so Phase 2 only *adds* fields.

**Out of scope (later):** in-app `/api/memes` route and gallery; AI-generated illustrative backgrounds (would need an image model).

---

## 8. New dependencies

- `playwright` (devDependency) + `npx playwright install chromium` (one-time).
- Two bundled font files (Noto Sans Devanagari Regular + Bold), committed under `assets/fonts/`.
- No new runtime deps for the Next app itself.
```
