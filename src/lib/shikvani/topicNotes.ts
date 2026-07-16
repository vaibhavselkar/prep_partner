import { readFileSync } from "node:fs";
import { join } from "node:path";

export function notesForTopic(subject: string, subtopic: string): string {
  try {
    return readFileSync(join(process.cwd(), "src", "data", "notes", subject, `${subtopic}.md`), "utf8");
  } catch {
    return "";
  }
}
