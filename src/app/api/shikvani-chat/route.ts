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
  return result.toTextStreamResponse();
}
