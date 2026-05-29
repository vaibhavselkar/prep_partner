import { NextRequest, NextResponse } from "next/server";
import { readNotes, appendNote, deleteNote, clearNotes } from "@/lib/dataStore";

export async function GET() {
  try {
    const notes = await readNotes();
    return NextResponse.json({ notes });
  } catch {
    return NextResponse.json({ error: "Failed to read notes." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "Note content is required." }, { status: 400 });
    }
    await appendNote(content.trim());
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to save note." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body.index === "number") {
      await deleteNote(body.index);
    } else {
      await clearNotes();
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete note." }, { status: 500 });
  }
}
