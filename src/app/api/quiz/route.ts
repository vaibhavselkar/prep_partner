import { NextRequest, NextResponse } from "next/server";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";
import { readPDFs } from "@/lib/dataStore";
import type { QuizQuestion } from "@/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { pdfId, count = 5, language = "english" } = await req.json();

    const pdfs = await readPDFs();
    const pdf = pdfs.find((p) => p.id === pdfId);

    if (!pdf) {
      return NextResponse.json({ error: "PDF not found." }, { status: 404 });
    }

    const langInstruction =
      language === "marathi"
        ? "Write ALL questions and options in Marathi (Devanagari script)."
        : language === "both"
        ? "Write questions alternating between Marathi (Devanagari) and English."
        : "Write ALL questions and options in English.";

    const context = pdf.text.slice(0, 6000);

    const prompt = `You are a quiz generator. Based on the following student notes, generate exactly ${count} multiple choice questions.

${langInstruction}

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "question": "Question text here?",
    "options": ["A. Option one", "B. Option two", "C. Option three", "D. Option four"],
    "answer": "A",
    "explanation": "Brief explanation of why A is correct."
  }
]

The answer field must be exactly "A", "B", "C", or "D".

STUDENT NOTES:
${context}`;

    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const raw = response.choices[0].message.content ?? "[]";

    // Extract JSON array from response
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse quiz questions." }, { status: 500 });
    }

    const questions: QuizQuestion[] = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ questions, pdfName: pdf.filename });
  } catch (err) {
    console.error("Quiz generation error:", err);
    return NextResponse.json({ error: "Failed to generate quiz." }, { status: 500 });
  }
}
