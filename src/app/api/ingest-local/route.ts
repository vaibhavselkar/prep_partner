import { NextRequest, NextResponse } from "next/server";
import { extractTextFromImage } from "@/lib/imageOcr";
import { readPDFs, writePDFs, readProgress, writeProgress } from "@/lib/dataStore";
import type { PDFMeta, PDFProgress } from "@/types";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

export const maxDuration = 300; // 5 min for 35 images

export async function POST(req: NextRequest) {
  try {
    const { folderPath, folderName } = await req.json();

    const absPath = path.join(process.cwd(), folderPath);

    // Read all image files, sorted by name
    const allFiles = await fs.readdir(absPath);
    const imageFiles = allFiles
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort();

    if (imageFiles.length === 0) {
      return NextResponse.json({ error: "No image files found in folder." }, { status: 400 });
    }

    const textParts: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const filename = imageFiles[i];
      const filePath = path.join(absPath, filename);

      try {
        const buffer = await fs.readFile(filePath);
        const mimeType = filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
        const text = await extractTextFromImage(buffer, mimeType, i + 1);
        if (text.trim()) {
          textParts.push(`--- Page ${i + 1} (${filename}) ---\n${text}`);
        }
        console.log(`✓ OCR page ${i + 1}/${imageFiles.length}: ${filename}`);
      } catch (err) {
        console.error(`✗ Failed page ${i + 1}: ${filename}`, err);
        errors.push(filename);
      }
    }

    const combinedText = textParts.join("\n\n");
    const docName = folderName || path.basename(absPath);

    const id = randomUUID();
    const entry: PDFMeta = {
      id,
      filename: docName,
      blobUrl: "", // local folder, no blob URL needed
      text: combinedText,
      pageCount: imageFiles.length,
      uploadedAt: new Date().toISOString(),
    };

    const pdfs = await readPDFs();
    // Replace if same folder name already exists
    const existingIdx = pdfs.findIndex((p) => p.filename === docName);
    if (existingIdx >= 0) pdfs.splice(existingIdx, 1);
    pdfs.push(entry);
    await writePDFs(pdfs);

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

    return NextResponse.json({
      id,
      filename: docName,
      pageCount: imageFiles.length,
      pagesOcrd: textParts.length,
      errors,
      previewText: combinedText.slice(0, 500),
    });
  } catch (err) {
    console.error("Ingest error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
