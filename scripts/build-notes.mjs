import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";

const NOTES_DIR = "src/data/notes";

async function walk(dir, subject = null) {
  const out = [];
  for (const entry of await readdir(dir)) {
    if (entry === "index.json") continue;
    const full = join(dir, entry);
    if ((await stat(full)).isDirectory()) out.push(...(await walk(full, entry)));
    else if (entry.endsWith(".md")) {
      const body = await readFile(full, "utf-8");
      const title = (body.match(/^#\s+(.+)$/m)?.[1] ?? entry.replace(/\.md$/, "")).trim();
      out.push({ subject, subtopic: entry.replace(/\.md$/, ""), title, body });
    }
  }
  return out;
}

const notes = await walk(NOTES_DIR);
await writeFile(join(NOTES_DIR, "index.json"), JSON.stringify(notes, null, 2), "utf-8");
console.log(`build-notes: ${notes.length} notes`);
