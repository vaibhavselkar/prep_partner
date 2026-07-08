import { NextRequest, NextResponse } from "next/server";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "AI key not configured" }, { status: 503 });
    }

    const { notes, count = 5 } = await req.json();

    if (!notes || typeof notes !== "string" || !notes.trim()) {
      return NextResponse.json({ error: "Notes are required." }, { status: 400 });
    }

    const clampedCount = Math.min(10, Math.max(1, Number(count) || 5));

    const prompt = `You are an MPSC exam tutor. Based ONLY on the following study notes written by a student, generate exactly ${clampedCount} multiple-choice questions that test whether the student has learned this material.

Each question: 4 options prefixed "A. ".."D. ", one correct answer letter, a one-line explanation.

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "question": "Question text here?",
    "options": ["A. Option one", "B. Option two", "C. Option three", "D. Option four"],
    "answer": "A",
    "explanation": "Brief explanation of why this is correct."
  }
]

The answer field must be exactly "A", "B", "C", or "D".

STUDENT NOTES:
${notes}`;

    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    });

    const raw = response.choices[0].message.content ?? "[]";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse quiz questions." }, { status: 500 });
    }

    const questions = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ questions });
  } catch (err) {
    console.error("Notes quiz error:", err);
    return NextResponse.json({ error: "Failed to generate quiz." }, { status: 500 });
  }
}
