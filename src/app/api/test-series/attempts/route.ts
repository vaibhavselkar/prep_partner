import { NextRequest, NextResponse } from "next/server";
import { getDb, isMongoConfigured } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = req.nextUrl.searchParams.get("user");
  if (!user) return NextResponse.json({ attempts: [] });
  if (!isMongoConfigured()) return NextResponse.json({ attempts: [], dbConfigured: false });
  try {
    const db = await getDb();
    const attempts = await db
      .collection("test_attempts")
      .find({ user }, { projection: { _id: 0 } })
      .sort({ submittedAt: -1 })
      .limit(20)
      .toArray();
    return NextResponse.json({ attempts, dbConfigured: true });
  } catch {
    return NextResponse.json({ error: "Failed to load attempts." }, { status: 500 });
  }
}
