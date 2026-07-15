import { copyFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
  toReviewRecord,
  mergeReviewRecords,
  type GeneratedMeme,
} from "../../src/lib/memes/reviewStore.ts";

/**
 * Publish a rendered batch into the in-app review section:
 *  - copy each meme PNG into public/memes/ (so Next serves it at /memes/<file>)
 *  - merge the records into data/memes-manifest.json as "pending" (existing
 *    review decisions are preserved by id).
 */
export async function publishBatch(records: GeneratedMeme[], outDir: string): Promise<number> {
  const pubDir = join(process.cwd(), "public", "memes");
  await mkdir(pubDir, { recursive: true });
  let copied = 0;
  for (const r of records) {
    try {
      await copyFile(join(outDir, r.file), join(pubDir, r.file));
      copied++;
    } catch (e) {
      console.warn(`[publish] could not copy ${r.file}:`, e);
    }
  }
  await mergeReviewRecords(records.map(toReviewRecord));
  return copied;
}
