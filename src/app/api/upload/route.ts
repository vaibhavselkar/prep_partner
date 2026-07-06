import { NextRequest, NextResponse } from "next/server";
import { extractPDFText } from "@/lib/pdfUtils";
import { extractTextFromImage } from "@/lib/imageOcr";
import { readPDFs, writeSinglePDF, deletePDF, readProgress, writeProgress } from "@/lib/dataStore";
import type { PDFMeta, PDFProgress } from "@/types";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ACCEPTED_TYPES = ["application/pdf", ...ACCEPTED_IMAGE_TYPES];

async function storeFile(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(filename, buffer, { access: "public", contentType: mimeType });
    return blob.url;
  }
  // Local dev: save to data/pdfs/
  const dir = path.join(process.cwd(), "data", "pdfs");
  await fs.mkdir(dir, { recursive: true });
  const safeName = `${Date.now()}_${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await fs.writeFile(path.join(dir, safeName), buffer);
  return `/api/pdf-file/${safeName}`;
}

// Handle a single file and return extracted text + page count
async function processFile(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  pageIndex?: number
): Promise<{ text: string; pageCount: number }> {
  if (mimeType === "application/pdf") {
    return extractPDFText(buffer);
  }
  // Image: use Groq vision OCR
  const text = await extractTextFromImage(buffer, mimeType, pageIndex);
  return { text, pageCount: 1 };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    // Support both single "file" and multiple "files[]" fields
    const singleFile = formData.get("file") as File | null;
    const multipleFiles = formData.getAll("files") as File[];

    const files: File[] = singleFile ? [singleFile] : multipleFiles;

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided." }, { status: 400 });
    }

    // Validate all files
    for (const f of files) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${f.name}. Please upload PDF or image files (JPG, PNG).` },
          { status: 400 }
        );
      }
    }

    // If multiple images → group them as one "document"
    if (files.length > 1) {
      // Sort by filename to maintain page order
      const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));

      const textParts: string[] = [];
      for (let i = 0; i < sorted.length; i++) {
        const f = sorted[i];
        const buffer = Buffer.from(await f.arrayBuffer());
        const { text } = await processFile(buffer, f.name, f.type, i + 1);
        if (text.trim()) textParts.push(`--- Page ${i + 1} (${f.name}) ---\n${text}`);
      }

      // Use folder name or first filename as document title
      const docName = formData.get("folderName") as string || sorted[0].name.replace(/\.[^.]+$/, "") + " (collection)";
      const combinedText = textParts.join("\n\n");

      // Store first image as thumbnail reference
      const firstBuffer = Buffer.from(await sorted[0].arrayBuffer());
      const blobUrl = await storeFile(firstBuffer, sorted[0].name, sorted[0].type);

      const id = randomUUID();
      const entry: PDFMeta = {
        id,
        filename: docName,
        blobUrl,
        text: combinedText,
        pageCount: sorted.length,
        uploadedAt: new Date().toISOString(),
      };

      await writeSinglePDF(entry);

      const progress = await readProgress();
      progress[id] = {
        pdfId: id,
        filename: docName,
        sessionCount: 0,
        coveragePercent: 0,
        topicsDiscussed: [],
        quizResults: [],
        lastStudied: new Date().toISOString(),
      } as PDFProgress;
      await writeProgress(progress);

      return NextResponse.json({ id, filename: docName, pageCount: sorted.length });
    }

    // Single file
    const file = files[0];
    const buffer = Buffer.from(await file.arrayBuffer());
    const blobUrl = await storeFile(buffer, file.name, file.type);
    const { text, pageCount } = await processFile(buffer, file.name, file.type, 1);

    const id = randomUUID();
    const entry: PDFMeta = {
      id,
      filename: file.name,
      blobUrl,
      text,
      pageCount,
      uploadedAt: new Date().toISOString(),
    };

    await writeSinglePDF(entry);

    const progress = await readProgress();
    progress[id] = {
      pdfId: id,
      filename: file.name,
      sessionCount: 0,
      coveragePercent: 0,
      topicsDiscussed: [],
      quizResults: [],
      lastStudied: new Date().toISOString(),
    } as PDFProgress;
    await writeProgress(progress);

    return NextResponse.json({ id, filename: file.name, pageCount });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const pdfs = await readPDFs();
    return NextResponse.json(
      pdfs.map(({ id, filename, pageCount, uploadedAt, blobUrl }) => ({
        id, filename, pageCount, uploadedAt, blobUrl,
      }))
    );
  } catch {
    return NextResponse.json({ error: "Failed to read PDFs." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    const pdfs = await readPDFs();
    const toDelete = pdfs.find((p) => p.id === id);

    await deletePDF(id);

    if (toDelete?.blobUrl.startsWith("/api/pdf-file/")) {
      const safeName = toDelete.blobUrl.replace("/api/pdf-file/", "");
      await fs.unlink(path.join(process.cwd(), "data", "pdfs", safeName)).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete." }, { status: 500 });
  }
}

