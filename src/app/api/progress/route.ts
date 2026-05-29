import { NextRequest, NextResponse } from "next/server";
import { readProgress, writeProgress } from "@/lib/dataStore";
import type { QuizResult } from "@/types";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const progress = await readProgress();
    return NextResponse.json(progress);
  } catch {
    return NextResponse.json({ error: "Failed to read progress." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pdfId, type, score, total, language, pdfName } = body;

    const progress = await readProgress();

    if (!progress[pdfId]) {
      return NextResponse.json({ error: "PDF progress not found." }, { status: 404 });
    }

    if (type === "quiz" && typeof score === "number" && typeof total === "number") {
      const result: QuizResult = {
        id: randomUUID(),
        pdfId,
        pdfName: pdfName ?? progress[pdfId].filename,
        score,
        total,
        language: language ?? "english",
        date: new Date().toISOString(),
      };
      progress[pdfId].quizResults.push(result);
      // Boost coverage on quiz completion
      progress[pdfId].coveragePercent = Math.min(
        95,
        progress[pdfId].coveragePercent + Math.round((score / total) * 10)
      );
    } else if (type === "session") {
      progress[pdfId].sessionCount += 1;
      progress[pdfId].lastStudied = new Date().toISOString();
    }

    await writeProgress(progress);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Progress update error:", err);
    return NextResponse.json({ error: "Failed to update progress." }, { status: 500 });
  }
}
