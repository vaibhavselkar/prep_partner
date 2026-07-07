# MPSC Combined Group-C Prep — Verified Bank, Mocks & Tracking

**Date:** 2026-07-07
**Status:** Approved design, ready for implementation planning
**Scope:** Prelims-first, deep. Mains deferred.

## 1. Goal & Context

The app (`marathi-notes-ai`, Next.js 14 App Router) already has a `/technical-sahayak`
page for the Maharashtra Group-C Combined Examination 2026 with tabs: Overview,
Syllabus, AI Tutor (Groq chat), MCQ Quiz (live LLM-generated), and Strategy.

The problem: quiz questions are generated live by the LLM on every use, so they can be
factually wrong or hallucinated, coverage is inconsistent, and there is no reliable,
full-syllabus study material, no realistic mock tests, and no weak-area tracking.

This project makes the app **exam-ready for the Combined MPSC Group-C prelims** (exam
date 27 Sep 2026) by shipping a **pre-built, verified question bank + study notes**,
adding **full-length mock tests**, and adding **progress / weak-area tracking**.

Prelims subjects in scope (Combined Prelims, 100 marks):
1. मराठी भाषा — Marathi Language & Grammar
2. English Language
3. सामान्य ज्ञान — General Knowledge (Maharashtra + India)
4. बौद्धिक क्षमता — Mental Ability / Aptitude / Reasoning / Maths
5. विज्ञान व तंत्रज्ञान — Science & Technology
6. चालू घडामोडी — Current Affairs (datable, kept separate)

## 2. Reliability Strategy (the core decision)

Content trustworthiness comes from **process, not assertion**:

- **Adversarial verification pipeline (primary):** each generated question is
  independently attacked by 2–3 verifier agents whose job is to *refute* it — wrong
  answer key, ambiguous/multiple-correct options, outdated fact, out-of-syllabus. Only
  questions that survive majority approval enter the bank; others are dropped or fixed.
- **Web-grounding for current affairs (targeted):** current-affairs subtopics are
  grounded with live web search before question generation, and every such question is
  stamped with `asOfDate`.
- **In-app report button (permanent safety net):** every question shows a 🚩 report
  control; reports persist to the DB for later batch correction. This catches whatever
  slips through.

Static-fact subjects (Maharashtra geography, Constitution, math, grammar) verify very
reliably this way; current affairs are explicitly dated and treated as perishable.

## 3. Architecture

### 3.1 The Bank (shipped data files, committed to git)

```
src/data/bank/<subject>/<subtopic>.json   verified questions
src/data/notes/<subject>/<subtopic>.md    study notes
src/data/bank/manifest.json               coverage index (counts per subject/subtopic)
```

Question schema (`BankQuestion`):
```ts
{
  id: string;            // stable, e.g. "mh-geo-0001"
  subject: string;       // subject key
  subtopic: string;      // subtopic key
  difficulty: "easy" | "medium" | "hard";
  language: "marathi" | "english" | "bilingual";
  question: string;
  options: [string, string, string, string];
  answer: "A" | "B" | "C" | "D";
  explanation: string;
  tags: string[];
  verifiedAt: string;    // ISO date
  isCurrentAffairs?: boolean;
  asOfDate?: string;     // ISO date, only for current affairs
}
```

Committed to the repo → no DB needed to read the bank, works offline, identical on every
load. Loader module (`src/lib/bank.ts`) reads/indexes files, with helpers:
`getSubjects()`, `getSubtopics(subject)`, `sampleQuestions({subject, subtopic,
difficulty, language, count, excludeIds})`, `getManifest()`.

### 3.2 Generation Pipeline (dev-time, not a runtime user feature)

A **Workflow** script run by the developer (Claude), not shipped to end users. Per
subtopic: generate a batch → 2–3 adversarial verifiers refute each → survivors deduped
(by normalized question text) → written to the subtopic JSON with stable ids and
`verifiedAt`. Current-affairs subtopics get a web-search grounding stage first. Output is
reviewed and committed as data files. Re-runnable to grow the bank incrementally without
disturbing existing verified questions.

### 3.3 Runtime Features (`/technical-sahayak`)

- **Quiz tab (changed):** samples the verified bank via a new `/api/bank-quiz` route
  instead of live LLM. Filters: subject, subtopic, difficulty, language, count. The
  existing live-LLM `/api/mpsc-quiz` stays available only as an optional
  "generate extra practice" fallback.
- **Mock Test tab (new):** full-length timed prelims mock — 100 questions across the
  subjects at real weightage, countdown timer, auto-scoring, per-subject breakdown, and
  an answer-review mode. Mock composition is defined by a weightage config so it mirrors
  the real paper.
- **Study Notes tab (new):** browse the notes markdown by subject → subtopic, rendered
  in-app.
- **Report control (new):** 🚩 on every question (quiz and mock) → `/api/report`
  persists `{questionId, reason, note}`.
- **AI Tutor (kept):** unchanged behavior; lightly prompted to reference bank subtopics.

### 3.4 Progress & Weak-Area Tracking

New persistence (extends existing dual-mode `dataStore.ts` / `db.ts`, Neon ↔ flat-file):

- `mock_attempts` — one row per completed mock: id, date, total, score, per-subject
  breakdown (JSONB), duration.
- `topic_stats` — aggregated per subtopic: attempts, correct, last practiced. Updated
  after each quiz/mock submission.
- `reported_questions` — id, question_id, reason, note, created_at, resolved.

Progress view gains a **weak-areas panel**: accuracy per subtopic, ranked worst-first,
each with a "practice this" button that deep-links to a filtered quiz.

### 3.5 Persistence

Reuses the existing pattern exactly: DB path when `DATABASE_URL` is set, flat-file
fallback otherwise (`data/mock_attempts.json`, `data/topic_stats.json`,
`data/reported_questions.json`). New `initDb` migrations create the tables idempotently.

## 4. Build Order (each independently shippable)

1. **Bank schema + loader + manifest** — types, `src/lib/bank.ts`, empty/seed data dir,
   manifest generator. Foundation for everything else.
2. **Generation pipeline** — Workflow script; produce the real prelims bank and commit
   it. (Developer-run; requires explicit go-ahead due to multi-agent token cost.)
3. **Bank-backed Quiz tab** — `/api/bank-quiz` + Quiz tab wired to the bank; keep live
   LLM as optional fallback.
4. **Mock Test engine + tab** — weightage config, mock assembler, timer, scoring,
   review mode.
5. **Study Notes tab** — notes loader + renderer.
6. **Progress weak-area tracking + report flow** — DB tables, `/api/report`,
   stat updates on submission, weak-areas panel.

## 5. Component Boundaries

| Unit | Purpose | Depends on |
|------|---------|-----------|
| `src/types` (BankQuestion, MockAttempt, TopicStat, ReportedQuestion) | Shared shapes | — |
| `src/lib/bank.ts` | Load/index/sample the shipped bank | data files, types |
| `src/data/bank`, `src/data/notes` | Verified content | — |
| generation Workflow script | Produce & verify content offline | LLM, web search |
| `/api/bank-quiz` | Serve sampled bank questions | bank.ts |
| `/api/mock` | Assemble + score a mock | bank.ts, weightage config |
| `/api/report` | Persist question reports | dataStore |
| mock/stats DB additions | Durable attempts + stats | db.ts / dataStore.ts |
| Quiz / Mock / Notes / Weak-areas UI | Presentation | the above APIs |

## 6. Error Handling

- Bank loader tolerates missing/empty subtopic files (returns empty, never throws);
  manifest reflects actual counts so the UI can show coverage honestly.
- Quiz/mock request for a subtopic with too few questions falls back to broadening the
  filter (subject-level) and surfaces a notice rather than erroring.
- DB writes for stats/reports are best-effort and must never block the user's result
  screen; failures are logged, not fatal.
- Current-affairs questions older than a threshold are visually flagged as "may be
  outdated" using `asOfDate`.

## 7. Testing

- Bank loader: unit tests for sampling filters, exclusion, and empty-file tolerance.
- Manifest: generated counts match on-disk question counts.
- Mock assembler: produces the correct total and per-subject weightage; no duplicate
  questions within one mock.
- Scoring: known answer sheet → known score and per-subject breakdown.
- Stats update: submitting a result updates `topic_stats` correctly (attempts/correct).
- Schema validation: every shipped bank JSON validates against `BankQuestion`
  (id unique, answer ∈ A–D, exactly 4 options). This test also guards content commits.

## 8. Out of Scope (deferred)

- Mains-specific content and papers.
- Multi-user auth / per-user accounts (app remains single-user/personal).
- Spaced-repetition scheduling (possible future iteration).
- Voice features for the MPSC page (existing voice study page unchanged).

## 9. Non-Obvious Constraints

- The generation pipeline is a developer tool run via the Workflow harness; it is **not**
  bundled or callable from the deployed app.
- Current-affairs content is perishable and must be regenerable independently of the
  static bank.
- Reliability is a *process guarantee*, not a correctness proof — the report button and
  dated current-affairs flags are load-bearing, not optional polish.
