import { NextRequest, NextResponse } from "next/server";
import { getTestMeta, loadQuestions, scoreTest } from "@/lib/testSeries";
import { getDb, isMongoConfigured } from "@/lib/mongodb";

export const runtime = "nodejs";

const ALLOWED_USERS = ["Pranju", "Vaibhav"];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, answers, timeTakenSec } = (await req.json()) as {
      user: string;
      answers: Record<string, string | null>;
      timeTakenSec?: number;
    };
    if (!ALLOWED_USERS.includes(user)) {
      return NextResponse.json({ error: "Please select a valid user." }, { status: 400 });
    }
    const meta = getTestMeta(params.id);
    if (!meta) return NextResponse.json({ error: "Unknown test." }, { status: 404 });

    const questions = loadQuestions(params.id);
    const result = scoreTest(questions, answers ?? {}, meta.marksPerQ, meta.negativePerWrong);

    // Enrich the per-question review with the question text, options, and explanation.
    const byId = new Map(questions.map((q) => [q.id, q]));
    const review = result.perQuestion.map((p) => {
      const q = byId.get(p.id)!;
      return { ...p, question: q.question, options: q.options, explanation: q.explanation };
    });

    // Persist the attempt (best-effort — never block the result on a DB hiccup).
    let saved = false;
    if (isMongoConfigured()) {
      try {
        const db = await getDb();
        await db.collection("test_attempts").insertOne({
          user,
          testId: meta.id,
          testTitle: meta.titleEn,
          score: result.score,
          maxScore: result.maxScore,
          correct: result.correct,
          wrong: result.wrong,
          unanswered: result.unanswered,
          percentage: result.percentage,
          timeTakenSec: typeof timeTakenSec === "number" ? timeTakenSec : null,
          submittedAt: new Date(),
        });
        saved = true;
      } catch (e) {
        console.warn("[test-series] failed to save attempt:", e);
      }
    }

    return NextResponse.json({ result, review, saved });
  } catch {
    return NextResponse.json({ error: "Failed to submit test." }, { status: 500 });
  }
}
