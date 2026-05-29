import { NextRequest } from "next/server";
import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";
import { readPDFs, readProgress, writeProgress } from "@/lib/dataStore";
import type { ChatMessage } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

function buildSystemPrompt(pdfText?: string, englishVoiceOnly?: boolean): string {
  const contextSection = pdfText
    ? `\n\n--- STUDENT'S NOTES CONTEXT ---\n${pdfText.slice(0, 8000)}\n--- END OF NOTES ---\n`
    : "";

  const langRule = englishVoiceOnly
    ? `1. Always reply in ENGLISH only. The student's device does not have a Marathi TTS voice, so English is used for listening. Content from the Marathi notes should be explained in English.`
    : `1. Detect the language of the student's message and reply in the same language (Marathi or English).`;

  return `You are Marathi Notes AI, a helpful bilingual study tutor for Maharashtra Geography and other subjects.
Your role is to help students understand their handwritten Marathi notes.

RULES:
${langRule}
2. Answer length: 2-3 sentences by default. If student asks "explain in detail", "विस्तारात सांग", "tell me more" — give up to 6 sentences.
3. Speak in natural flowing sentences. No bullet lists or numbered points.
4. Be encouraging, patient, and educational.
5. Reference the student's notes when answering subject questions.
6. If student says "याची नोंद कर" or "save this as a note", respond with NOTE_SAVE: <content> on the first line, then your normal reply.${contextSection}`;
}

export async function POST(req: NextRequest) {
  const { messages, pdfId, englishVoiceOnly } = (await req.json()) as {
    messages: ChatMessage[];
    pdfId?: string;
    englishVoiceOnly?: boolean;
  };

  let pdfText: string | undefined;

  if (pdfId) {
    const pdfs = await readPDFs();
    const pdf = pdfs.find((p) => p.id === pdfId);
    if (pdf) {
      pdfText = pdf.text;
      try {
        const progress = await readProgress();
        if (progress[pdfId]) {
          progress[pdfId].sessionCount += 1;
          progress[pdfId].lastStudied = new Date().toISOString();
          progress[pdfId].coveragePercent = Math.min(95, progress[pdfId].coveragePercent + 2);
        }
        await writeProgress(progress);
      } catch {}
    }
  }

  const systemPrompt = buildSystemPrompt(pdfText, englishVoiceOnly);
  const last10 = messages.slice(-10);

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    system: systemPrompt,
    messages: last10.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  });

  return result.toDataStreamResponse();
}
