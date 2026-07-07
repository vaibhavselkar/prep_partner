import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { appendReport } from "@/lib/dataStore";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { questionId, reason, note } = await req.json();
    if (!questionId || !reason) return NextResponse.json({ error: "questionId and reason required" }, { status: 400 });
    await appendReport({ id: randomUUID(), questionId, reason, note: note ?? "", createdAt: new Date().toISOString() });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save report." }, { status: 500 });
  }
}
