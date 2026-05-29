import fs from "fs/promises";
import path from "path";
import type { PDFMeta, ProgressStore } from "@/types";

const DATA_DIR = path.join(process.cwd(), "data");
const PDFS_FILE = path.join(DATA_DIR, "pdfs.json");
const NOTES_FILE = path.join(DATA_DIR, "notes.txt");
const PROGRESS_FILE = path.join(DATA_DIR, "progress.json");

export async function ensureDataFiles() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
  await Promise.all([
    fs.access(PDFS_FILE).catch(() => fs.writeFile(PDFS_FILE, "[]", "utf-8")),
    fs.access(NOTES_FILE).catch(() => fs.writeFile(NOTES_FILE, "", "utf-8")),
    fs.access(PROGRESS_FILE).catch(() => fs.writeFile(PROGRESS_FILE, "{}", "utf-8")),
  ]);
}

export async function readPDFs(): Promise<PDFMeta[]> {
  await ensureDataFiles();
  const raw = await fs.readFile(PDFS_FILE, "utf-8");
  return JSON.parse(raw) as PDFMeta[];
}

export async function writePDFs(pdfs: PDFMeta[]) {
  await ensureDataFiles();
  await fs.writeFile(PDFS_FILE, JSON.stringify(pdfs, null, 2), "utf-8");
}

export async function readProgress(): Promise<ProgressStore> {
  await ensureDataFiles();
  const raw = await fs.readFile(PROGRESS_FILE, "utf-8");
  return JSON.parse(raw) as ProgressStore;
}

export async function writeProgress(progress: ProgressStore) {
  await ensureDataFiles();
  await fs.writeFile(PROGRESS_FILE, JSON.stringify(progress, null, 2), "utf-8");
}

export async function readNotes(): Promise<string[]> {
  await ensureDataFiles();
  const raw = await fs.readFile(NOTES_FILE, "utf-8");
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export async function appendNote(content: string) {
  await ensureDataFiles();
  const timestamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  await fs.appendFile(NOTES_FILE, `[${timestamp}] ${content}\n`, "utf-8");
}

export async function deleteNote(index: number) {
  const notes = await readNotes();
  notes.splice(index, 1);
  await ensureDataFiles();
  await fs.writeFile(NOTES_FILE, notes.join("\n") + (notes.length ? "\n" : ""), "utf-8");
}

export async function clearNotes() {
  await ensureDataFiles();
  await fs.writeFile(NOTES_FILE, "", "utf-8");
}
