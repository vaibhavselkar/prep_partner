import { NextRequest, NextResponse } from "next/server";
import { readMemes, setMemeStatus, type MemeReviewStatus } from "@/lib/memes/reviewStore";

export const runtime = "nodejs";

const VALID: MemeReviewStatus[] = ["pending", "approved", "rejected"];

export async function GET() {
  try {
    return NextResponse.json({ memes: await readMemes() });
  } catch {
    return NextResponse.json({ error: "Failed to read memes." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = (await req.json()) as { id?: string; status?: MemeReviewStatus };
    if (!id || !status || !VALID.includes(status)) {
      return NextResponse.json({ error: "id and a valid status are required." }, { status: 400 });
    }
    const reviewedAt = new Date().toISOString().slice(0, 10);
    const memes = await setMemeStatus(id, status, reviewedAt);
    return NextResponse.json({ memes });
  } catch {
    return NextResponse.json({ error: "Failed to update meme status." }, { status: 500 });
  }
}
