import { NextResponse } from "next/server";
import { loadRegistry } from "@/lib/testSeries";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ tests: loadRegistry() });
  } catch {
    return NextResponse.json({ error: "Failed to load tests." }, { status: 500 });
  }
}
