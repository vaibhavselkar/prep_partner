import fs from "fs/promises";
import path from "path";
import type { PDFMeta, ProgressStore, PDFProgress } from "@/types";
import {
  initDb,
  dbReadPDFs, dbWritePDF, dbDeletePDF,
  dbReadNotes, dbAppendNote, dbDeleteNote, dbClearNotes,
  dbReadProgress, dbWriteProgress,
} from "./db";

const useDb = () => !!process.env.DATABASE_URL;

// ── Local flat-file setup ─────────────────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "data");
const PDFS_FILE = path.join(DATA_DIR, "pdfs.json");
const NOTES_FILE = path.join(DATA_DIR, "notes.txt");
const PROGRESS_FILE = path.join(DATA_DIR, "progress.json");

async function ensureDataFiles() {
  try { await fs.mkdir(DATA_DIR, { recursive: true }); } catch {}
  await Promise.all([
    fs.access(PDFS_FILE).catch(() => fs.writeFile(PDFS_FILE, "[]", "utf-8")),
    fs.access(NOTES_FILE).catch(() => fs.writeFile(NOTES_FILE, "", "utf-8")),
    fs.access(PROGRESS_FILE).catch(() => fs.writeFile(PROGRESS_FILE, "{}", "utf-8")),
  ]);
}

// ── PDFs ──────────────────────────────────────────────────────────────────────

export async function readPDFs(): Promise<PDFMeta[]> {
  if (useDb()) { await initDb(); return dbReadPDFs(); }
  await ensureDataFiles();
  return JSON.parse(await fs.readFile(PDFS_FILE, "utf-8")) as PDFMeta[];
}

export async function writePDFs(pdfs: PDFMeta[]) {
  if (useDb()) {
    await initDb();
    // Replace all — simple approach: delete then re-insert
    // Used only during ingest-local; normal upload uses writeSinglePDF
    for (const pdf of pdfs) await dbWritePDF(pdf);
    return;
  }
  await ensureDataFiles();
  await fs.writeFile(PDFS_FILE, JSON.stringify(pdfs, null, 2), "utf-8");
}

export async function writeSinglePDF(pdf: PDFMeta) {
  if (useDb()) { await initDb(); return dbWritePDF(pdf); }
  const pdfs = await readPDFs();
  const idx = pdfs.findIndex((p) => p.id === pdf.id);
  if (idx >= 0) pdfs[idx] = pdf; else pdfs.unshift(pdf);
  await ensureDataFiles();
  await fs.writeFile(PDFS_FILE, JSON.stringify(pdfs, null, 2), "utf-8");
}

export async function deletePDF(id: string) {
  if (useDb()) { await initDb(); return dbDeletePDF(id); }
  const pdfs = (await readPDFs()).filter((p) => p.id !== id);
  await ensureDataFiles();
  await fs.writeFile(PDFS_FILE, JSON.stringify(pdfs, null, 2), "utf-8");
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export async function readNotes(): Promise<string[]> {
  if (useDb()) { await initDb(); return dbReadNotes(); }
  await ensureDataFiles();
  const raw = await fs.readFile(NOTES_FILE, "utf-8");
  return raw.split("\n").map((l) => l.trim()).filter(Boolean);
}

export async function appendNote(content: string) {
  if (useDb()) { await initDb(); return dbAppendNote(content); }
  await ensureDataFiles();
  const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  await fs.appendFile(NOTES_FILE, `[${timestamp}] ${content}\n`, "utf-8");
}

export async function deleteNote(index: number) {
  if (useDb()) { await initDb(); return dbDeleteNote(index); }
  const notes = await readNotes();
  notes.splice(index, 1);
  await ensureDataFiles();
  await fs.writeFile(NOTES_FILE, notes.join("\n") + (notes.length ? "\n" : ""), "utf-8");
}

export async function clearNotes() {
  if (useDb()) { await initDb(); return dbClearNotes(); }
  await ensureDataFiles();
  await fs.writeFile(NOTES_FILE, "", "utf-8");
}

// ── Progress ──────────────────────────────────────────────────────────────────

export async function readProgress(): Promise<ProgressStore> {
  if (useDb()) { await initDb(); return dbReadProgress(); }
  await ensureDataFiles();
  return JSON.parse(await fs.readFile(PROGRESS_FILE, "utf-8")) as ProgressStore;
}

export async function writeProgress(progress: ProgressStore) {
  if (useDb()) {
    await initDb();
    for (const [pdfId, p] of Object.entries(progress)) {
      await dbWriteProgress(pdfId, p as PDFProgress);
    }
    return;
  }
  await ensureDataFiles();
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2), "utf-8");
}
