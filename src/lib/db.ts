import { neon } from "@neondatabase/serverless";
import type { PDFMeta, ProgressStore, PDFProgress, QuizResult, TopicStat, MockAttempt, ReportedQuestion } from "@/types";

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
  await sql`CREATE TABLE IF NOT EXISTS mpsc_topic_stats (
    subject TEXT NOT NULL, subtopic TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0, correct INTEGER NOT NULL DEFAULT 0,
    last_practiced TEXT NOT NULL DEFAULT '', PRIMARY KEY (subject, subtopic)
  )`;
  await sql`CREATE TABLE IF NOT EXISTS mpsc_mock_attempts (
    id TEXT PRIMARY KEY, date TEXT NOT NULL, total INTEGER NOT NULL,
    score INTEGER NOT NULL, duration_sec INTEGER NOT NULL, by_subject JSONB NOT NULL DEFAULT '{}'
  )`;
  await sql`CREATE TABLE IF NOT EXISTS mpsc_reports (
    id TEXT PRIMARY KEY, question_id TEXT NOT NULL, reason TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
  )`;
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

// ── MPSC Topic Stats ──────────────────────────────────────────────────────────

export async function dbReadTopicStats(): Promise<TopicStat[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM mpsc_topic_stats`;
  return rows.map((r) => ({ subject: r.subject as string, subtopic: r.subtopic as string,
    attempts: r.attempts as number, correct: r.correct as number, lastPracticed: r.last_practiced as string }));
}
export async function dbWriteTopicStats(stats: TopicStat[]) {
  const sql = getDb();
  for (const s of stats) {
    await sql`INSERT INTO mpsc_topic_stats (subject, subtopic, attempts, correct, last_practiced)
      VALUES (${s.subject}, ${s.subtopic}, ${s.attempts}, ${s.correct}, ${s.lastPracticed})
      ON CONFLICT (subject, subtopic) DO UPDATE SET
        attempts = EXCLUDED.attempts, correct = EXCLUDED.correct, last_practiced = EXCLUDED.last_practiced`;
  }
}
export async function dbReadMockAttempts(): Promise<MockAttempt[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM mpsc_mock_attempts ORDER BY date DESC`;
  return rows.map((r) => ({ id: r.id as string, date: r.date as string, total: r.total as number,
    score: r.score as number, durationSec: r.duration_sec as number,
    bySubject: r.by_subject as MockAttempt["bySubject"] }));
}
export async function dbAppendMockAttempt(a: MockAttempt) {
  const sql = getDb();
  await sql`INSERT INTO mpsc_mock_attempts (id, date, total, score, duration_sec, by_subject)
    VALUES (${a.id}, ${a.date}, ${a.total}, ${a.score}, ${a.durationSec}, ${JSON.stringify(a.bySubject)})`;
}
export async function dbAppendReport(r: ReportedQuestion) {
  const sql = getDb();
  await sql`INSERT INTO mpsc_reports (id, question_id, reason, note, created_at)
    VALUES (${r.id}, ${r.questionId}, ${r.reason}, ${r.note}, ${r.createdAt})`;
}
export async function dbReadReports(): Promise<ReportedQuestion[]> {
  const sql = getDb();
  const rows = await sql`SELECT * FROM mpsc_reports ORDER BY created_at DESC`;
  return rows.map((r) => ({ id: r.id as string, questionId: r.question_id as string,
    reason: r.reason as string, note: r.note as string, createdAt: r.created_at as string }));
}
