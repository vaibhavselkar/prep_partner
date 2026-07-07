import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readMpscProgress, writeMpscTopicStats, appendMockAttempt } from "@/lib/dataStore";
import { applyQuizResult, weakestTopics } from "@/lib/stats";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { topicStats, mockAttempts } = await readMpscProgress();
    return NextResponse.json({ topicStats, mockAttempts, weakest: weakestTopics(topicStats, 5) });
  } catch {
    return NextResponse.json({ error: "Failed to read progress." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = new Date().toISOString().slice(0, 10);
    const { topicStats } = await readMpscProgress();

    if (body.type === "quiz" && Array.isArray(body.items)) {
      const updated = applyQuizResult(topicStats, body.items, now);
      await writeMpscTopicStats(updated);
    } else if (body.type === "mock" && body.mock) {
      const m = body.mock as { total: number; score: number; durationSec?: number; bySubject?: Record<string, { correct: number; total: number }> };
      await appendMockAttempt({
        id: randomUUID(), date: new Date().toISOString(),
        total: m.total, score: m.score, durationSec: m.durationSec ?? 0, bySubject: m.bySubject ?? {},
      });
      // fold each subject's mock result into topic stats at subject granularity
      const items = Object.entries(m.bySubject ?? {}).flatMap(([subject, v]) =>
        Array.from({ length: v.total }, (_, i) => ({ subject, subtopic: "_mock", correct: i < v.correct }))
      );
      await writeMpscTopicStats(applyQuizResult(topicStats, items, now));
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("mpsc-progress POST error:", err);
    return NextResponse.json({ error: "Failed to update progress." }, { status: 500 });
  }
}
