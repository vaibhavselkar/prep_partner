import { NextRequest, NextResponse } from "next/server";
import { getGroqClient, GROQ_MODEL } from "@/lib/groq";

export const runtime = "nodejs";
export const maxDuration = 30;

const TOPICS: Record<string, string> = {
  marathi: "मराठी व्याकरण आणि भाषा (Marathi Grammar & Language) - संधी, समास, म्हणी, वाक्यप्रचार, शब्दसंपदा",
  english: "English Grammar & Language - Tenses, Articles, Prepositions, Vocabulary, Comprehension",
  maharashtra_gk: "महाराष्ट्र सामान्य ज्ञान - इतिहास, भूगोल, राज्यघटना, लोकप्रशासन, अर्थव्यवस्था",
  india_gk: "भारत सामान्य ज्ञान - इतिहास, भूगोल, राज्यघटना, विज्ञान, चालू घडामोडी",
  aptitude: "बौद्धिक क्षमता चाचणी - Series, Coding-Decoding, Analogies, Directions, Blood Relations, Syllogisms",
  maths: "गणित - Percentages, Ratio, Time-Work, Profit-Loss, Simple Interest, Average, Number System",
  science: "विज्ञान - Basic Physics, Chemistry, Biology, Environment, Technology",
  current_affairs: "चालू घडामोडी - महाराष्ट्र व भारत (Maharashtra & India Current Affairs 2025-2026)",
  constitution: "भारतीय राज्यघटना - Fundamental Rights, DPSP, Parliament, State Government, Local Bodies",
  reasoning: "तर्कशक्ती - Logical Reasoning, Verbal Reasoning, Critical Thinking, Data Interpretation",
};

export async function POST(req: NextRequest) {
  try {
    const { topic = "maharashtra_gk", count = 5, difficulty = "medium", language = "bilingual" } = await req.json();

    const topicDesc = TOPICS[topic] || TOPICS["maharashtra_gk"];

    const langInstruction =
      language === "marathi"
        ? "Write ALL questions and options in Marathi (Devanagari script)."
        : language === "english"
        ? "Write ALL questions and options in English."
        : "Mix Marathi and English questions. Some questions in Marathi (Devanagari), some in English.";

    const difficultyGuide =
      difficulty === "easy"
        ? "Easy level - basic concept questions suitable for a beginner."
        : difficulty === "hard"
        ? "Hard level - tricky, application-based questions that test deep understanding."
        : "Medium level - standard MPSC exam pattern questions.";

    const prompt = `You are an MPSC exam question generator for the Maharashtra Group-C Combined Examination 2026.

Generate exactly ${count} multiple choice questions on the topic: ${topicDesc}

${langInstruction}
${difficultyGuide}

These questions should match the actual MPSC exam pattern and difficulty. Focus on Maharashtra-specific content where applicable.

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "question": "Question text here?",
    "options": ["A. Option one", "B. Option two", "C. Option three", "D. Option four"],
    "answer": "A",
    "explanation": "Brief explanation of why this is correct, with MPSC-relevant context."
  }
]

The answer field must be exactly "A", "B", "C", or "D".`;

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
    return NextResponse.json({ questions, topic, topicLabel: topicDesc });
  } catch (err) {
    console.error("MPSC quiz error:", err);
    return NextResponse.json({ error: "Failed to generate quiz." }, { status: 500 });
  }
}
