# शिकवणी / Shikvani — Voice Study Teacher — Design

**Date:** 2026-07-16
**Status:** Approved for spec review
**Route:** `/shikvani` · **Nav label:** शिकवणी / Shikvani

---

## 1. Goal & context

A voice-first, two-way study **teacher** that walks an MPSC Group-C aspirant through the **whole syllabus**, one topic at a time, told as a short spoken story in a Marathi+English mix — pausing to check "हे समजलं का?", re-explaining when the student is lost, recapping at the end of each topic, and resuming from where the student left off next session.

This is a distinct guided-teaching experience, separate from the existing free-form voice chat at `/study`. It **reuses** the app's proven voice engine (browser Speech Recognition + Speech Synthesis, the talking orb, streaming AI) and the app's **already-structured syllabus** (`src/lib/syllabusTopics.ts` over `src/data/syllabus-topics.json`) and **progress store** (`src/lib/syllabusProgress.tsx`, localStorage).

**Design stance:** the AI model runs the *pedagogy* (passage sizing, phrasing the understanding-check, re-explaining, judging the recap). The app runs the *machinery* (which topic is next, saving progress, the speak/listen loop, and feeding verified facts). Thin controller + smart prompt.

### Locked decisions (from brainstorming)
- **Progression:** guided march through the whole syllabus in a sensible order; **resumable** across sessions.
- **Language:** bilingual Marathi+English mix ("Minglish"), conversational.
- **Voice:** reuse the **free browser** Speech APIs already in `/study`; graceful English fallback where a Marathi voice is unavailable. (Cloud TTS is a later upgrade, out of scope.)
- **Rhythm:** short passage (≈1–2 min) → check "समजलं का?" → branch (clear→continue, unclear→re-explain) → recap question at end of topic → mark done → next.
- **Placement:** new dedicated page `/shikvani`.
- **Accuracy:** teach only from the verified notes/bank for the current topic (no hallucinated GK) — same trust principle the app already applies to its question bank.

---

## 2. The teaching loop (state machine)

The lesson controller (client) tracks a small state machine; the model produces the spoken content for each state.

```
                 ┌────────────────────────────────────────────┐
   [pick next unfinished topic from syllabus order]            │
                 ↓                                              │
             TEACHING ──speaks a short passage──▶ CHECKING      │
                 ▲                                   │          │
     re-explain  │        student: "समजलं / got it" │          │
    (simpler)    │                                   ↓          │
             (unclear)                     more passages left?  │
                 │                          ├─ yes ─▶ TEACHING  │
   student:"नाही/│                          └─ no  ─▶ RECAP      │
    confused" ───┘                                   │          │
                                        student answers recap   │
                                          ├─ good ─▶ mark ✅ ───┘  (→ next topic)
                                          └─ weak ─▶ TEACHING (re-teach shaky part)

   Anytime the student asks a question → ANSWER it, then resume the prior state.
```

- **TEACHING** — model narrates one short passage of the current topic as a story, then ends with an understanding-check question. Client speaks it, then listens.
- **CHECKING** — client sends the student's spoken reply; model classifies intent (understood / confused / off-topic question / "repeat") and responds accordingly.
- **RECAP** — after the model signals the topic is fully taught, it asks one short recap question; a satisfactory answer marks the topic complete.
- **Topic completion** — client marks the topic id done in the progress store and advances to the next unfinished topic.

**How the client knows the state:** the model returns a small **control tag** at the end of each turn — a single fenced JSON line like `{"state":"teaching","topicDone":false}` (parsed and stripped before speaking). The client uses it to decide whether to advance the topic or mark it complete. If the tag is missing/unparseable, the client stays in the current state (safe default) and keeps the conversation going.

---

## 3. Architecture & components

Reuses `/study`'s voice code by **extracting it into a shared hook**, then builds the teacher on top.

```
src/
  app/
    shikvani/
      page.tsx                 # the /shikvani page: orb + lesson flow + progress panel
    api/
      shikvani-chat/route.ts   # streams the teacher's reply for the current topic
  components/
    VoiceOrb.tsx               # (existing, reused)
    ShikvaniProgressPanel.tsx  # subject→topic list with ✅/▶ current marker
  hooks/
    useVoiceConversation.ts    # EXTRACTED from study/page.tsx: STT + TTS + orb state,
                               #   Marathi-voice detection + English fallback, conversation mode
  lib/
    shikvani/
      curriculum.ts            # ordered topic list + next-unfinished picker (pure)
      teacherPrompt.ts         # buildTeacherPrompt(topic, notes, history-summary) (pure)
      controlTag.ts            # parseControlTag(modelText) -> {state, topicDone} | null (pure)
      topicNotes.ts            # verified notes/bank text for a topic id (grounding)
```

### 3.1 `useVoiceConversation.ts` (extracted, shared)
- **What:** the speak/listen engine lifted out of `study/page.tsx` unchanged in behavior — `SpeechRecognition` (mr-IN with fallback), `speechSynthesis` (Marathi-voice detection → English fallback flag), orb state, continuous "conversation mode", silence-timeout turn-taking.
- **Used by:** both `/study` (refactored to consume it — behavior preserved) and `/shikvani`.
- **Why extract:** avoid duplicating ~200 lines of fragile speech code; one place to fix voice bugs.

### 3.2 `curriculum.ts` (pure)
- **What:** produces the ordered teaching sequence over the syllabus (by subject weightage/order, then subtopic, then granular topic via `subjectTopicIds`/`topicsFor`), and `nextTopic(doneIds)` → the first topic id not in the done set (or `null` when the syllabus is complete).
- **Used as:** `orderedTopics(): SyllabusTopic[]`, `nextTopic(done: Set<string>): SyllabusTopic | null`.

### 3.3 `teacherPrompt.ts` (pure)
- **What:** `buildTeacherPrompt({ topic, notes, recentSummary })` → the system prompt encoding: persona (warm Marathi teacher, storytelling), bilingual Marathi+English mix, the passage→check rhythm, the re-explain-on-confusion rule, the recap-at-end rule, the **facts-only-from-notes** rule, and the **control-tag** output contract.
- **Used as:** `buildTeacherPrompt(args): string`.

### 3.4 `controlTag.ts` (pure)
- **What:** extracts and strips the trailing control-tag JSON from the model text; returns `{ state, topicDone }` or `null` if absent/invalid. Also returns the cleaned spoken text (tag removed) so it's never read aloud.
- **Used as:** `parseControlTag(text): { spoken: string; control: { state: string; topicDone: boolean } | null }`.

### 3.5 `topicNotes.ts` (grounding)
- **What:** given a topic (subject/subtopic), returns the relevant verified notes text from `src/data/notes/**` (and optionally a few bank explanations) to inject as grounding. Keeps facts accurate.
- **Used as:** `notesForTopic(subject, subtopic): string`.

### 3.6 `shikvani-chat/route.ts`
- **What:** `POST` with `{ topicId, messages }`; resolves the topic + its notes, builds the teacher prompt, streams the model reply (same streaming stack `/study` uses — `ai` SDK over the Groq client). Node runtime.

### 3.7 `page.tsx` + `ShikvaniProgressPanel.tsx`
- **What:** the orb-centered lesson UI. On load, resumes at `nextTopic(done)`; a "सुरू करा / Start" begins the spoken lesson; the panel shows subjects→topics with ✅ done and ▶ current. A visible transcript (reusing `ChatTranscript`) and manual text input for noisy environments.

---

## 4. Data flow

```
useSyllabusProgress (done ids)  ──▶ curriculum.nextTopic ──▶ current topic
                                                              │
topicNotes.notesForTopic(topic) ─────────────────────────────┤
recent transcript summary ───────────────────────────────────┤
                                                              ▼
                                        teacherPrompt.buildTeacherPrompt
                                                              │
                                          POST /api/shikvani-chat (stream)
                                                              ▼
                              model reply  ──parseControlTag──▶ { spoken, control }
                                                              │
                          speak(spoken) via useVoiceConversation; listen for reply
                                                              │
                    control.topicDone === true  ──▶ mark topic done, advance
```

---

## 5. Accuracy, error handling, edge cases

- **Facts-only-from-notes:** the prompt instructs the teacher to teach only what's supported by the injected notes for the current topic; if notes are thin, teach the concept at a high level and say so rather than inventing specifics. (Mirrors the app's verified-bank trust stance.)
- **No Marathi voice on device:** reuse `/study`'s existing detection → set English-voice-only; the teacher still *writes* bilingual text but is spoken with the available voice. Surfaced as a one-line notice.
- **Speech recognition unavailable/denied:** fall back to the manual text input (already a pattern in `/study`); the lesson works typed.
- **Missing/!invalid control tag:** client keeps current state and continues — never blocks the conversation.
- **Model drifts off-topic or too long:** the prompt caps passage length and the check cadence; the student can always say "पुढे चला / next" or "परत सांग / repeat".
- **Syllabus complete:** `nextTopic` returns `null` → a "तुम्ही संपूर्ण अभ्यासक्रम पूर्ण केला 🎉" completion state.
- **Progress compatibility:** reuses the existing `mpsc-syllabus-progress` localStorage set, so topics completed here also reflect in the existing syllabus progress UI (and vice-versa).

---

## 6. Testing (Vitest)

- **curriculum.test:** `orderedTopics` covers every topic id once, in a stable order; `nextTopic` returns the first not-done id and `null` when all done.
- **controlTag.test:** parses a valid trailing tag and returns cleaned spoken text; returns `null` + original text when absent; tolerates a tag wrapped in ```json fences.
- **teacherPrompt.test:** the built prompt contains the topic label, the injected notes, the bilingual + storytelling + check-understanding rules, the facts-only rule, and the control-tag contract.
- **topicNotes.test:** returns non-empty grounding for a topic that has notes; returns a safe empty/short string for one that doesn't.
- Voice I/O and live model pedagogy are validated manually (browser), not unit-tested.

---

## 7. Scope boundaries

**In scope:** `/shikvani` page + progress panel; `useVoiceConversation` extraction (with `/study` refactored to use it, behavior preserved); curriculum driver; teacher prompt; control-tag protocol; verified-notes grounding; `/api/shikvani-chat`; nav link; the tests above.

**Out of scope (later):** cloud TTS for a more natural Marathi voice; spoken-answer auto-grading beyond the model's own judgement; per-topic spaced-repetition scheduling; multi-student profiles.

**Reuses (not rebuilt):** `VoiceOrb`, `ChatTranscript`, the streaming stack, `syllabusTopics`/`syllabus`, `useSyllabusProgress`, notes data, the Groq client.
