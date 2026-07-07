import { NextRequest, NextResponse } from "next/server";
import { getAllQuestions } from "@/lib/bank";
import { assembleMock } from "@/lib/mock";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const raw = Number(req.nextUrl.searchParams.get("size") ?? 100);
    const size = Math.max(10, Math.min(100, Number.isFinite(raw) ? raw : 100));
    // Vary seed by hour bucket so repeated mocks differ without Date.now nondeterminism concerns at test time.
    const seed = Math.floor(Date.now() / 3_600_000);
    const questions = assembleMock(getAllQuestions(), size, seed);
    return NextResponse.json({ questions, size: questions.length });
  } catch {
    return NextResponse.json({ error: "Failed to assemble mock." }, { status: 500 });
  }
}
