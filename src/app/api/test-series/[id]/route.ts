import { NextResponse } from "next/server";
import { getTestMeta, loadQuestions, publicQuestions } from "@/lib/testSeries";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const meta = getTestMeta(params.id);
    if (!meta) return NextResponse.json({ error: "Unknown test." }, { status: 404 });
    const questions = publicQuestions(loadQuestions(params.id));
    return NextResponse.json({ meta, questions });
  } catch {
    return NextResponse.json({ error: "Failed to load test." }, { status: 500 });
  }
}
