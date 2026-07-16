# शिकवणी / Shikvani — Voice Study Teacher — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A voice teacher at `/shikvani` that marches through the syllabus topic-by-topic (resumable), tells each as a short bilingual spoken story, checks understanding ("समजलं का?"), re-explains when needed, recaps, marks the topic done, and continues.

**Architecture:** Pure, testable logic in `src/lib/shikvani/*.ts` (curriculum order, control-tag protocol, teacher prompt, notes grounding). A streaming `/api/shikvani-chat` route (same `@ai-sdk/groq` + `streamText` stack as `/api/mpsc-chat`). A purpose-built `useVoiceConversation` hook for browser speech I/O. A `/shikvani` page wiring hook + curriculum + API + control-tag + the existing `useSyllabusProgress` store.

**Tech Stack:** Next.js 14 App Router, TypeScript, Vitest, `ai`/`ai/react` + `@ai-sdk/groq` (Groq llama-3.3-70b), browser Web Speech APIs.

## Global Constraints

- Imports inside `src/` use the `@/` alias.
- Streaming route mirrors `src/app/api/mpsc-chat/route.ts`: `createGroq`, `streamText({ model: groq("llama-3.3-70b-versatile"), system, messages })`, `return result.toDataStreamResponse()`, `export const runtime = "nodejs"`.
- Notes live at `src/data/notes/<subject>/<subtopic>.md` where `<subject>` is the syllabus key verbatim (e.g. `current_affairs`, `history`).
- The march covers `SYLLABUS` (the 8 prelims subjects) in array order → each subject's subtopics in order → `topicsFor(subject, subtopic)` in order. (Mains is a later extension.)
- Progress reuses the existing localStorage set via `useSyllabusProgress` (`src/lib/syllabusProgress.tsx`, key `mpsc-syllabus-progress`), so completions here also show in the existing syllabus UI.
- **Control-tag protocol:** the teacher ends EVERY reply with exactly one final line `CONTROL: {"state":"teaching"|"checking"|"recap"|"done","topicDone":<bool>}`. The client parses + strips it before speaking. Missing/invalid tag → client keeps current state (never blocks).
- Nav label: `शिकवणी / Shikvani`, route `/shikvani`, icon `🎓` (or `👩‍🏫`).
- Commit after each task.

## Plan-author deviation from spec (raise at pre-flight)

The spec proposed extracting `/study`'s voice code into a shared hook and refactoring `/study` to consume it. **This plan instead builds a fresh, purpose-built `useVoiceConversation` hook for `/shikvani` and leaves the working `/study` page untouched**, to avoid regressing a fragile 461-line working page. Cost: some duplicated speech logic. De-duplicating `/study` onto the hook is a deferred follow-up. If you'd rather do the risky refactor now, say so before Task 6.

---

## File Structure

- `src/lib/shikvani/curriculum.ts` (+test) — teaching order + next-unfinished picker (pure).
- `src/lib/shikvani/controlTag.ts` (+test) — parse/strip the CONTROL line (pure).
- `src/lib/shikvani/topicNotes.ts` (+test) — verified notes text for a subject/subtopic (grounding).
- `src/lib/shikvani/teacherPrompt.ts` (+test) — build the teacher system prompt (pure).
- `src/app/api/shikvani-chat/route.ts` — streaming teacher reply.
- `src/hooks/useVoiceConversation.ts` — browser speak/listen/orb hook.
- `src/components/ShikvaniProgressPanel.tsx` — subject→topic progress list.
- `src/app/shikvani/page.tsx` — the lesson page.
- `src/components/NavBar.tsx` — add nav item.

---

## Task 1: Curriculum order + next-topic picker

**Files:**
- Create: `src/lib/shikvani/curriculum.ts`
- Test: `src/lib/shikvani/__tests__/curriculum.test.ts`

**Interfaces:**
- Produces: `TeachingTopic { id: string; mr: string; en: string; subject: string; subtopic: string }`; `orderedTopics(): TeachingTopic[]`; `nextTopic(done: Set<string>): TeachingTopic | null`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/shikvani/__tests__/curriculum.test.ts
import { describe, it, expect } from "vitest";
import { orderedTopics, nextTopic } from "@/lib/shikvani/curriculum";

describe("orderedTopics", () => {
  const topics = orderedTopics();
  it("returns a non-empty, unique, ordered list with context", () => {
    expect(topics.length).toBeGreaterThan(20);
    const ids = topics.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length); // unique
    for (const t of topics) {
      expect(t.subject).toBeTruthy();
      expect(t.subtopic).toBeTruthy();
      expect(t.mr).toBeTruthy();
    }
  });
  it("starts with the first prelims subject (history)", () => {
    expect(topics[0].subject).toBe("history");
  });
});

describe("nextTopic", () => {
  it("returns the first not-done topic", () => {
    const all = orderedTopics();
    const done = new Set([all[0].id, all[1].id]);
    expect(nextTopic(done)!.id).toBe(all[2].id);
  });
  it("returns null when all done", () => {
    const done = new Set(orderedTopics().map((t) => t.id));
    expect(nextTopic(done)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/shikvani/__tests__/curriculum.test.ts`
Expected: FAIL — cannot find module `@/lib/shikvani/curriculum`.

- [ ] **Step 3: Write `curriculum.ts`**

```ts
// src/lib/shikvani/curriculum.ts
import { SYLLABUS } from "@/lib/syllabus";
import { topicsFor } from "@/lib/syllabusTopics";

export interface TeachingTopic {
  id: string;
  mr: string;
  en: string;
  subject: string;
  subtopic: string;
}

export function orderedTopics(): TeachingTopic[] {
  const out: TeachingTopic[] = [];
  for (const subject of SYLLABUS) {
    for (const sub of subject.subtopics) {
      for (const t of topicsFor(subject.key, sub.key)) {
        out.push({ id: t.id, mr: t.mr, en: t.en, subject: subject.key, subtopic: sub.key });
      }
    }
  }
  return out;
}

export function nextTopic(done: Set<string>): TeachingTopic | null {
  return orderedTopics().find((t) => !done.has(t.id)) ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/shikvani/__tests__/curriculum.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/shikvani/curriculum.ts src/lib/shikvani/__tests__/curriculum.test.ts
git commit -m "feat(shikvani): syllabus teaching order + next-topic picker"
```

---

## Task 2: Control-tag protocol

**Files:**
- Create: `src/lib/shikvani/controlTag.ts`
- Test: `src/lib/shikvani/__tests__/controlTag.test.ts`

**Interfaces:**
- Produces: `TeacherState = "teaching" | "checking" | "recap" | "done"`; `parseControlTag(text: string): { spoken: string; control: { state: TeacherState; topicDone: boolean } | null }`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/shikvani/__tests__/controlTag.test.ts
import { describe, it, expect } from "vitest";
import { parseControlTag } from "@/lib/shikvani/controlTag";

describe("parseControlTag", () => {
  it("parses a trailing CONTROL line and strips it from spoken text", () => {
    const raw = 'शिवाजी महाराज... समजलं का?\nCONTROL: {"state":"checking","topicDone":false}';
    const { spoken, control } = parseControlTag(raw);
    expect(control).toEqual({ state: "checking", topicDone: false });
    expect(spoken).toBe("शिवाजी महाराज... समजलं का?");
    expect(spoken).not.toMatch(/CONTROL/);
  });
  it("marks topicDone true", () => {
    const { control } = parseControlTag('छान!\nCONTROL: {"state":"done","topicDone":true}');
    expect(control).toEqual({ state: "done", topicDone: true });
  });
  it("returns null control and original text when no tag", () => {
    const { spoken, control } = parseControlTag("just teaching, no tag");
    expect(control).toBeNull();
    expect(spoken).toBe("just teaching, no tag");
  });
  it("ignores an invalid tag payload", () => {
    const { control } = parseControlTag("hi\nCONTROL: not-json");
    expect(control).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/shikvani/__tests__/controlTag.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write `controlTag.ts`**

```ts
// src/lib/shikvani/controlTag.ts
export type TeacherState = "teaching" | "checking" | "recap" | "done";

export function parseControlTag(text: string): {
  spoken: string;
  control: { state: TeacherState; topicDone: boolean } | null;
} {
  const m = text.match(/\n?\s*CONTROL:\s*(\{.*\})\s*$/s);
  if (!m) return { spoken: text.trim(), control: null };
  const spoken = text.slice(0, m.index).trim();
  try {
    const obj = JSON.parse(m[1]) as { state: TeacherState; topicDone: boolean };
    const states: TeacherState[] = ["teaching", "checking", "recap", "done"];
    if (!states.includes(obj.state) || typeof obj.topicDone !== "boolean") {
      return { spoken, control: null };
    }
    return { spoken, control: { state: obj.state, topicDone: obj.topicDone } };
  } catch {
    return { spoken, control: null };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/shikvani/__tests__/controlTag.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/shikvani/controlTag.ts src/lib/shikvani/__tests__/controlTag.test.ts
git commit -m "feat(shikvani): control-tag parse/strip protocol"
```

---

## Task 3: Notes grounding

**Files:**
- Create: `src/lib/shikvani/topicNotes.ts`
- Test: `src/lib/shikvani/__tests__/topicNotes.test.ts`

**Interfaces:**
- Produces: `notesForTopic(subject: string, subtopic: string): string` — the `.md` text for that subtopic, or `""` if none. Reads `src/data/notes/<subject>/<subtopic>.md`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/shikvani/__tests__/topicNotes.test.ts
import { describe, it, expect } from "vitest";
import { notesForTopic } from "@/lib/shikvani/topicNotes";

describe("notesForTopic", () => {
  it("returns non-empty notes for a subtopic that has a notes file", () => {
    const txt = notesForTopic("history", "ancient-medieval");
    expect(txt.length).toBeGreaterThan(50);
  });
  it("returns empty string for a missing notes file", () => {
    expect(notesForTopic("history", "no-such-subtopic")).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/shikvani/__tests__/topicNotes.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write `topicNotes.ts`**

```ts
// src/lib/shikvani/topicNotes.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

export function notesForTopic(subject: string, subtopic: string): string {
  try {
    return readFileSync(join(process.cwd(), "src", "data", "notes", subject, `${subtopic}.md`), "utf8");
  } catch {
    return "";
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/shikvani/__tests__/topicNotes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/shikvani/topicNotes.ts src/lib/shikvani/__tests__/topicNotes.test.ts
git commit -m "feat(shikvani): verified-notes grounding for a topic"
```

---

## Task 4: Teacher system prompt

**Files:**
- Create: `src/lib/shikvani/teacherPrompt.ts`
- Test: `src/lib/shikvani/__tests__/teacherPrompt.test.ts`

**Interfaces:**
- Consumes: `TeachingTopic` (type only).
- Produces: `buildTeacherPrompt(args: { topic: { mr: string; en: string; subject: string }; notes: string }): string`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/shikvani/__tests__/teacherPrompt.test.ts
import { describe, it, expect } from "vitest";
import { buildTeacherPrompt } from "@/lib/shikvani/teacherPrompt";

describe("buildTeacherPrompt", () => {
  const p = buildTeacherPrompt({
    topic: { mr: "सिंधू संस्कृती", en: "Indus Valley", subject: "history" },
    notes: "The Great Bath was at Mohenjo-daro.",
  });
  it("includes the topic, notes, and the teaching rules", () => {
    expect(p).toContain("सिंधू संस्कृती");
    expect(p).toContain("Great Bath");
    expect(p).toMatch(/story|गोष्ट|गोष्टी/i);          // storytelling
    expect(p).toMatch(/समजलं का|understood/i);          // understanding-check
    expect(p).toMatch(/CONTROL:/);                       // control-tag contract
    expect(p).toMatch(/only.*notes|फक्त.*नोट्स/i);       // facts-only rule
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/shikvani/__tests__/teacherPrompt.test.ts`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write `teacherPrompt.ts`**

```ts
// src/lib/shikvani/teacherPrompt.ts
export function buildTeacherPrompt(args: {
  topic: { mr: string; en: string; subject: string };
  notes: string;
}): string {
  const { topic, notes } = args;
  return `You are "शिकवणी", a warm, patient Marathi study teacher for MPSC Group-C aspirants. You teach ONE syllabus topic at a time as a spoken, two-way conversation.

CURRENT TOPIC: ${topic.mr} / ${topic.en}  (subject: ${topic.subject})

HOW YOU TEACH:
- Speak in a natural Marathi + English mix ("Minglish"), like a friendly teacher — keep technical terms in English.
- Teach as a STORY (गोष्ट): vivid, simple, memorable — not a dry list.
- Teach in SHORT passages (about 4-6 sentences), then STOP and ask an understanding-check like "हे समजलं का?" / "इथपर्यंत clear आहे का?".
- If the student says they did NOT understand or seems confused, RE-EXPLAIN the same point a different, simpler way (a new analogy) — do not just repeat.
- If the student understood, continue with the next short passage.
- When the whole topic is covered, ask ONE short RECAP question ("थोडक्यात सांग..."). If the answer is good, the topic is done. If weak, re-teach the shaky part.
- If the student asks a question anytime, answer it briefly, then resume.
- Keep each reply short enough to be spoken aloud comfortably (this is voice).

ACCURACY (important): Teach ONLY facts supported by the NOTES below. If the notes are thin, teach the concept at a high level and say the specifics can be revised from notes — never invent dates, names, or numbers.

NOTES FOR THIS TOPIC (your only source of specific facts):
"""
${notes || "(no detailed notes available — teach the concept at a conceptual level and keep claims general)"}
"""

OUTPUT CONTRACT: End EVERY reply with exactly one final line:
CONTROL: {"state":"teaching"|"checking"|"recap"|"done","topicDone":true|false}
- "checking" when you just asked an understanding-check; "recap" when you asked the final recap question; "done" with topicDone:true ONLY when the student has satisfactorily recapped and the topic is complete; otherwise "teaching".
- NEVER speak the word CONTROL or the JSON aloud — it is stripped by the app. Put it on its own final line.`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/shikvani/__tests__/teacherPrompt.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/shikvani/teacherPrompt.ts src/lib/shikvani/__tests__/teacherPrompt.test.ts
git commit -m "feat(shikvani): teacher system prompt builder"
```

---

## Task 5: Streaming API route

**Files:**
- Create: `src/app/api/shikvani-chat/route.ts`

**Interfaces:**
- Consumes: `buildTeacherPrompt`, `notesForTopic`, `orderedTopics`.
- HTTP: `POST { topicId: string, messages: {role,content}[] }` → streamed text response.

- [ ] **Step 1: Write `route.ts`**

```ts
// src/app/api/shikvani-chat/route.ts
import { NextRequest } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { orderedTopics } from "@/lib/shikvani/curriculum";
import { notesForTopic } from "@/lib/shikvani/topicNotes";
import { buildTeacherPrompt } from "@/lib/shikvani/teacherPrompt";

export const runtime = "nodejs";
export const maxDuration = 30;

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const { topicId, messages } = (await req.json()) as {
    topicId: string;
    messages: { role: string; content: string }[];
  };

  const topic = orderedTopics().find((t) => t.id === topicId);
  if (!topic) {
    return new Response(JSON.stringify({ error: "unknown topicId" }), { status: 400 });
  }
  const notes = notesForTopic(topic.subject, topic.subtopic);
  const system = buildTeacherPrompt({ topic, notes });

  const last12 = (messages ?? []).slice(-12);
  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system,
    messages: last12.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  });
  return result.toDataStreamResponse();
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Manual smoke (requires GROQ_API_KEY + dev server)**

Run: `npm run dev`, then:
```bash
curl -s -X POST http://localhost:3000/api/shikvani-chat -H "content-type: application/json" \
  -d '{"topicId":"history-ancient-medieval-1","messages":[{"role":"user","content":"सुरू करा"}]}' | head -c 400
```
Expected: a streamed teacher reply ending with a `CONTROL:` line. (If no API key locally, note it and skip.)

- [ ] **Step 4: Commit**

```bash
git add src/app/api/shikvani-chat/route.ts
git commit -m "feat(shikvani): streaming teacher chat API"
```

---

## Task 6: Voice conversation hook

**Files:**
- Create: `src/hooks/useVoiceConversation.ts`

**Interfaces:**
- Produces:
  ```ts
  useVoiceConversation(opts: {
    onUserUtterance: (text: string) => void; // called when the student finishes speaking
    lang?: SpeechLanguage;                    // default "mr-IN"
  }): {
    orbState: OrbState;
    conversationOn: boolean;
    startConversation: () => void;
    stopConversation: () => void;
    speak: (text: string) => void;            // speaks, then auto-listens if conversationOn
    micError: string;
    englishVoiceOnly: boolean;
  }
  ```
- Consumes: `OrbState`, `SpeechLanguage` from `@/types`.

This is a focused adaptation of the speech logic in `src/app/study/page.tsx` (lines ~55–232): `SpeechRecognition` with silence-timeout turn-end, `speechSynthesis` with sentence chunking + Marathi-voice detection → English fallback, and an orb-state machine. It does NOT include PDF/notes/useChat concerns — only voice.

- [ ] **Step 1: Read the source** — read `src/app/study/page.tsx` lines 30–260 to copy the exact speech behavior (voice selection, silence timer, chunked speak, `onvoiceschanged` handling).

- [ ] **Step 2: Write `useVoiceConversation.ts`**

```ts
// src/hooks/useVoiceConversation.ts
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { OrbState, SpeechLanguage } from "@/types";

export function useVoiceConversation(opts: {
  onUserUtterance: (text: string) => void;
  lang?: SpeechLanguage;
}) {
  const lang = opts.lang ?? "mr-IN";
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [conversationOn, setConversationOn] = useState(false);
  const [micError, setMicError] = useState("");
  const [englishVoiceOnly, setEnglishVoiceOnly] = useState(false);

  const conversationOnRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedRef = useRef("");
  const englishVoiceOnlyRef = useRef(false);
  const onUserRef = useRef(opts.onUserUtterance);
  onUserRef.current = opts.onUserUtterance;

  // Detect Marathi voice availability (English fallback if absent).
  useEffect(() => {
    const check = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      const hasMarathi = voices.some((v) => v.lang === "mr-IN" || v.lang.startsWith("mr"));
      if (!hasMarathi) { setEnglishVoiceOnly(true); englishVoiceOnlyRef.current = true; }
    };
    check();
    window.speechSynthesis.onvoiceschanged = check;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const startListening = useCallback(() => {
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition as (new () => SpeechRecognition) | undefined
      || (window as unknown as Record<string, unknown>).webkitSpeechRecognition as (new () => SpeechRecognition) | undefined;
    if (!SR) { setMicError("Speech recognition not supported in this browser."); return; }
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    accumulatedRef.current = "";
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tr = e.results[i][0].transcript;
        if (e.results[i].isFinal) accumulatedRef.current += tr + " ";
        else interim += tr;
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const text = (accumulatedRef.current + interim).trim();
        rec.stop();
        if (text) { setOrbState("thinking"); onUserRef.current(text); }
        else if (conversationOnRef.current) startListening();
      }, 1400);
    };
    rec.onerror = () => { /* keep silent; conversation loop recovers on next speak */ };
    rec.onend = () => { if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current); };
    recognitionRef.current = rec;
    setOrbState("listening");
    try { rec.start(); } catch { /* already started */ }
  }, [lang]);

  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    if (!text.trim()) { if (conversationOnRef.current) startListening(); return; }
    const chunks = text.match(/[^.!?।]+[.!?।]?/g) ?? [text];
    let idx = 0;
    const pickVoice = (u: SpeechSynthesisUtterance) => {
      const voices = window.speechSynthesis.getVoices();
      const mr = voices.find((v) => v.lang === "mr-IN" || v.lang.startsWith("mr"));
      const hi = voices.find((v) => v.lang.startsWith("hi"));
      const en = voices.find((v) => v.lang.startsWith("en"));
      u.voice = (englishVoiceOnlyRef.current ? en : mr || hi || en) ?? voices[0] ?? null;
      u.lang = u.voice?.lang ?? (englishVoiceOnlyRef.current ? "en-US" : "mr-IN");
    };
    const speakNext = () => {
      if (idx >= chunks.length) { if (conversationOnRef.current) startListening(); return; }
      const u = new SpeechSynthesisUtterance(chunks[idx].trim());
      pickVoice(u);
      if (idx === 0) u.onstart = () => setOrbState("speaking");
      u.onend = () => { idx++; speakNext(); };
      u.onerror = () => { idx++; speakNext(); };
      window.speechSynthesis.speak(u);
    };
    // Voices may load async on first call.
    if (window.speechSynthesis.getVoices().length) speakNext();
    else window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; speakNext(); };
  }, [startListening]);

  const startConversation = useCallback(() => {
    conversationOnRef.current = true; setConversationOn(true); setMicError("");
  }, []);
  const stopConversation = useCallback(() => {
    conversationOnRef.current = false; setConversationOn(false);
    window.speechSynthesis.cancel();
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setOrbState("idle");
  }, []);

  useEffect(() => () => { window.speechSynthesis.cancel(); try { recognitionRef.current?.stop(); } catch {} }, []);

  return { orbState, conversationOn, startConversation, stopConversation, speak, micError, englishVoiceOnly };
}
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean. (Reuses existing `SpeechRecognition` DOM types already used by `study/page.tsx`.)

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useVoiceConversation.ts
git commit -m "feat(shikvani): browser voice conversation hook"
```

---

## Task 7: Progress panel component

**Files:**
- Create: `src/components/ShikvaniProgressPanel.tsx`

**Interfaces:**
- Props: `{ currentId: string | null; done: Set<string> }`. Renders subjects → topics, marking ✅ done and ▶ current.

- [ ] **Step 1: Write `ShikvaniProgressPanel.tsx`**

```tsx
// src/components/ShikvaniProgressPanel.tsx
"use client";
import { SYLLABUS } from "@/lib/syllabus";
import { topicsFor } from "@/lib/syllabusTopics";

export function ShikvaniProgressPanel({ currentId, done }: { currentId: string | null; done: Set<string> }) {
  return (
    <div className="text-sm space-y-4">
      {SYLLABUS.map((subject) => {
        const topics = subject.subtopics.flatMap((s) => topicsFor(subject.key, s.key));
        if (!topics.length) return null;
        const doneCount = topics.filter((t) => done.has(t.id)).length;
        return (
          <div key={subject.key}>
            <div className="flex items-center justify-between font-medium text-gray-200">
              <span>{subject.icon} <span className="font-devanagari">{subject.label}</span></span>
              <span className="text-xs text-gray-500">{doneCount}/{topics.length}</span>
            </div>
            <ul className="mt-1 space-y-0.5">
              {topics.map((t) => {
                const isDone = done.has(t.id);
                const isCurrent = t.id === currentId;
                return (
                  <li key={t.id}
                    className={`flex gap-2 px-2 py-1 rounded font-devanagari ${
                      isCurrent ? "bg-primary-600/20 text-primary-300" : isDone ? "text-gray-500" : "text-gray-400"
                    }`}>
                    <span>{isDone ? "✅" : isCurrent ? "▶" : "•"}</span>
                    <span className="truncate">{t.mr}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/ShikvaniProgressPanel.tsx
git commit -m "feat(shikvani): syllabus progress panel"
```

---

## Task 8: The /shikvani page + nav + README

**Files:**
- Create: `src/app/shikvani/page.tsx`
- Modify: `src/components/NavBar.tsx` (add nav item)
- Modify: `README.md` (short section)

**Interfaces:**
- Consumes: `useVoiceConversation`, `useSyllabusProgress`, `orderedTopics`/`nextTopic`, `parseControlTag`, `ShikvaniProgressPanel`, `VoiceOrb`, `ChatTranscript`.

- [ ] **Step 1: Write `page.tsx`**

```tsx
// src/app/shikvani/page.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { VoiceOrb } from "@/components/VoiceOrb";
import { ChatTranscript } from "@/components/ChatTranscript";
import { ShikvaniProgressPanel } from "@/components/ShikvaniProgressPanel";
import { useVoiceConversation } from "@/hooks/useVoiceConversation";
import { useSyllabusProgress } from "@/lib/syllabusProgress";
import { orderedTopics, nextTopic } from "@/lib/shikvani/curriculum";
import { parseControlTag } from "@/lib/shikvani/controlTag";

interface Msg { role: "user" | "assistant"; content: string }

export default function ShikvaniPage() {
  const { done, toggle } = useSyllabusProgress();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [started, setStarted] = useState(false);
  const [busy, setBusy] = useState(false);
  const currentTopic = useMemo(() => nextTopic(done), [done]);
  const currentTopicRef = useRef(currentTopic);
  currentTopicRef.current = currentTopic;
  const messagesRef = useRef<Msg[]>([]);
  messagesRef.current = messages;

  // Send a user turn (or the initial "start") to the teacher and speak the reply.
  const sendTurn = async (userText: string) => {
    const topic = currentTopicRef.current;
    if (!topic) return;
    const nextMsgs: Msg[] = [...messagesRef.current, { role: "user", content: userText }];
    setMessages(nextMsgs);
    setBusy(true);
    try {
      const res = await fetch("/api/shikvani-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topicId: topic.id, messages: nextMsgs }),
      });
      const full = await res.text(); // data stream; take text (see Step 2 note)
      const clean = stripDataStream(full);
      const { spoken, control } = parseControlTag(clean);
      setMessages((m) => [...m, { role: "assistant", content: spoken }]);
      speak(spoken);
      if (control?.topicDone) toggle(topic.id); // advance: marks done -> nextTopic recomputes
    } finally {
      setBusy(false);
    }
  };

  const { orbState, conversationOn, startConversation, stopConversation, speak, micError, englishVoiceOnly } =
    useVoiceConversation({ onUserUtterance: (t) => sendTurn(t) });

  const begin = () => {
    setStarted(true);
    startConversation();
    sendTurn("सुरू करा"); // "let's begin"
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-[1fr_320px] gap-6">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold self-start">
          <span className="font-devanagari text-primary-400">शिकवणी</span>
          <span className="text-gray-300"> / Shikvani</span>
        </h1>
        {currentTopic ? (
          <p className="text-sm text-gray-400 self-start font-devanagari">
            आजचा विषय: <b className="text-gray-200">{currentTopic.mr}</b>
          </p>
        ) : (
          <p className="text-green-400">तुम्ही संपूर्ण अभ्यासक्रम पूर्ण केला! 🎉</p>
        )}
        <VoiceOrb state={orbState} />
        {englishVoiceOnly && (
          <p className="text-xs text-amber-400/80">या device वर मराठी आवाज नाही — English आवाजात बोलेल.</p>
        )}
        {micError && <p className="text-xs text-red-400">{micError}</p>}
        {!started ? (
          <button onClick={begin} disabled={!currentTopic}
            className="px-6 py-3 rounded-xl bg-primary-600 text-white font-medium disabled:opacity-50">
            ▶ सुरू करा / Start lesson
          </button>
        ) : (
          <button onClick={stopConversation}
            className="px-4 py-2 rounded-lg bg-gray-700 text-white text-sm">थांबा / Stop</button>
        )}
        <div className="w-full">
          <ChatTranscript messages={messages} />
        </div>
      </div>
      <aside className="border-l border-gray-800 pl-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">अभ्यासक्रम प्रगती</h2>
        <ShikvaniProgressPanel currentId={currentTopic?.id ?? null} done={done} />
      </aside>
    </div>
  );
}

// The chat route returns an AI-SDK data stream; extract the concatenated text deltas.
function stripDataStream(raw: string): string {
  // data-stream lines look like: 0:"chunk"\n  — concatenate the 0: string payloads.
  const parts = raw.split("\n").filter((l) => l.startsWith("0:"));
  if (!parts.length) return raw;
  return parts.map((l) => { try { return JSON.parse(l.slice(2)); } catch { return ""; } }).join("");
}
```

- [ ] **Step 2: Verify the data-stream parsing** — Confirm `toDataStreamResponse()` emits `0:"..."` text-delta lines (AI SDK v3 data stream protocol). If the installed `ai` version differs, adjust `stripDataStream` accordingly (check `node_modules/ai` version and its stream format). A robust alternative: switch the route to `result.toTextStreamResponse()` and read `res.text()` directly (plain text, no `0:` framing) — prefer this if it simplifies parsing.

- [ ] **Step 3: Add the nav item** in `src/components/NavBar.tsx` `NAV_ITEMS`, before `progress`:

```ts
  { href: "/shikvani", label: "शिकवणी", labelEn: "Shikvani", icon: "🎓" },
```

- [ ] **Step 4: README** — add a short "🎓 शिकवणी / Shikvani (voice teacher)" section: what it is, that it marches the syllabus resumably, teaches bilingually with understanding-checks, uses the free browser voice (Marathi where available), and grounds facts in the verified notes.

- [ ] **Step 5: Typecheck + manual browser test**

Run: `npx tsc --noEmit` (clean), then `npm run dev` → open `/shikvani` → click Start → confirm: it speaks a passage, asks a check, listens, and the transcript + progress panel update; saying "समजलं" advances, an unclear answer triggers a re-explain. (Voice quality depends on the device's Marathi voice.)

- [ ] **Step 6: Commit**

```bash
git add src/app/shikvani/page.tsx src/components/NavBar.tsx README.md
git commit -m "feat(shikvani): lesson page + nav link + README"
```

---

## Self-Review (completed by plan author)

- **Spec coverage:** guided resumable march (Task 1 + page), bilingual storytelling + check rhythm + recap (Task 4 prompt), voice I/O (Task 6), notes grounding (Task 3), control-tag protocol (Task 2 + prompt + page), `/api/shikvani-chat` (Task 5), progress panel + resume via `useSyllabusProgress` (Tasks 7–8), nav + README (Task 8). ✅
- **Documented deviation:** `/study` is NOT refactored onto the shared hook (safety) — flagged at top for pre-flight. The spec's extraction goal becomes a fresh purpose-built hook + a deferred `/study` dedup.
- **Risk flagged for implementation:** the AI-SDK data-stream text extraction (Task 8 Step 2) — verify against the installed `ai` version; prefer `toTextStreamResponse()` if simpler.
- **Type consistency:** `TeachingTopic`, `TeacherState`, `parseControlTag`, `buildTeacherPrompt`, `notesForTopic`, `orderedTopics`/`nextTopic`, `useVoiceConversation` signatures are consistent across producer/consumer tasks. ✅
- **Placeholder scan:** every code step has complete code; no TBD/TODO. ✅
