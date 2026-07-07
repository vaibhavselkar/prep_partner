import notes from "@/data/notes/index.json";

export interface NoteDoc { subject: string; subtopic: string; title: string; body: string; }

export function getNotes(): NoteDoc[] { return notes as NoteDoc[]; }
export function getNotesFor(subject: string): NoteDoc[] {
  return (notes as NoteDoc[]).filter((n) => n.subject === subject);
}
