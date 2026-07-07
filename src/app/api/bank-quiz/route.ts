import { NextRequest, NextResponse } from "next/server";
import { buildBankQuiz, type BankQuizInput } from "@/lib/bankQuiz";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const input = (await req.json()) as BankQuizInput;
    return NextResponse.json(buildBankQuiz(input));
  } catch {
    return NextResponse.json({ error: "Failed to build quiz." }, { status: 500 });
  }
}
