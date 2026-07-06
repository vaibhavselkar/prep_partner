import { neon } from "@neondatabase/serverless";
import type { PDFMeta, ProgressStore, PDFProgress, QuizResult } from "@/types";

function getDb() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  return neon(process.env.DATABASE_URL);
}

export async function initDb() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS pdfs (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      blob_url TEXT NOT NULL DEFAULT '',
      text TEXT NOT NULL DEFAULT '',
      page_count INTEGER NOT NULL DEFAULT 1,
      uploaded_at TEXT NOT NULL
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS notes (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS progress (
      pdf_id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      session_count INTEGER NOT NULL DEFAULT 0,
      coverage_percent REAL NOT NULL DEFAULT 0,
      topics_discussed JSONB NOT NULL DEFAULT '[]',
      quiz_results JSONB NOT NULL DEFAULT '[]',
      last_studied TEXT NOT NULL DEFAULT ''
    )
  `;
}

// ── PDFs ──────────────────────────────────────────────────────────────────────

export async function dbReadPDFs(): Promise<PDFMeta[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM pdfs ORDER BY uploaded_at DESC`;
  return rows.map((r) => ({
    id: r.id as string,
    filename: r.filename as string,
    blobUrl: r.blob_url as string,
    text: r.text as string,
    pageCount: r.page_count as number,
    uploadedAt: r.uploaded_at as string,
  }));
}

export async function dbWritePDF(pdf: PDFMeta) {
  const sql = getDb();
  await sql`
    INSERT INTO pdfs (id, filename, blob_url, text, page_count, uploaded_at)
    VALUES (${pdf.id}, ${pdf.filename}, ${pdf.blobUrl}, ${pdf.text}, ${pdf.pageCount}, ${pdf.uploadedAt})
    ON CONFLICT (id) DO UPDATE SET
      filename = EXCLUDED.filename,
      blob_url = EXCLUDED.blob_url,
      text = EXCLUDED.text,
      page_count = EXCLUDED.page_count,
      uploaded_at = EXCLUDED.uploaded_at
  `;
}

export async function dbDeletePDF(id: string) {
  const sql = getDb();
  await sql`DELETE FROM pdfs WHERE id = ${id}`;
  await sql`DELETE FROM progress WHERE pdf_id = ${id}`;
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export async function dbReadNotes(): Promise<string[]> {
  const sql = getDb();
  const rows = await sql`SELECT content, created_at FROM notes ORDER BY created_at ASC`;
  return rows.map((r) => {
    const ts = new Date(r.created_at as string).toISOString().slice(0, 16).replace("T", " ");
    return `[${ts}] ${r.content}`;
  });
}

export async function dbAppendNote(content: string) {
  const sql = getDb();
  await sql`INSERT INTO notes (content) VALUES (${content})`;
}

export async function dbDeleteNote(index: number) {
  const sql = getDb();
  const rows = await sql`SELECT id FROM notes ORDER BY created_at ASC`;
  if (index >= 0 && index < rows.length) {
    await sql`DELETE FROM notes WHERE id = ${rows[index].id}`;
  }
}

export async function dbClearNotes() {
  const sql = getDb();
  await sql`DELETE FROM notes`;
}

// ── Progress ──────────────────────────────────────────────────────────────────

export async function dbReadProgress(): Promise<ProgressStore> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM progress`;
  const store: ProgressStore = {};
  for (const r of rows) {
    store[r.pdf_id as string] = {
      pdfId: r.pdf_id as string,
      filename: r.filename as string,
      sessionCount: r.session_count as number,
      coveragePercent: r.coverage_percent as number,
      topicsDiscussed: r.topics_discussed as string[],
      quizResults: r.quiz_results as QuizResult[],
      lastStudied: r.last_studied as string,
    };
  }
  return store;
}

export async function dbWriteProgress(pdfId: string, p: PDFProgress) {
  const sql = getDb();
  await sql`
    INSERT INTO progress (pdf_id, filename, session_count, coverage_percent, topics_discussed, quiz_results, last_studied)
    VALUES (${pdfId}, ${p.filename}, ${p.sessionCount}, ${p.coveragePercent}, ${JSON.stringify(p.topicsDiscussed)}, ${JSON.stringify(p.quizResults)}, ${p.lastStudied})
    ON CONFLICT (pdf_id) DO UPDATE SET
      filename = EXCLUDED.filename,
      session_count = EXCLUDED.session_count,
      coverage_percent = EXCLUDED.coverage_percent,
      topics_discussed = EXCLUDED.topics_discussed,
      quiz_results = EXCLUDED.quiz_results,
      last_studied = EXCLUDED.last_studied
  `;
}
