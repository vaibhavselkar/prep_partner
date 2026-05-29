"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";

interface PDFItem {
  id: string;
  filename: string;
  pageCount: number;
  uploadedAt: string;
  blobUrl: string;
}

type UploadMode = "single" | "folder";

export default function HomePage() {
  const [pdfs, setPdfs] = useState<PDFItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [uploadMode, setUploadMode] = useState<UploadMode>("single");

  const fetchPDFs = useCallback(async () => {
    const res = await fetch("/api/upload");
    const data = await res.json();
    if (Array.isArray(data)) setPdfs(data);
  }, []);

  useEffect(() => { fetchPDFs(); }, [fetchPDFs]);

  const handleFiles = async (files: FileList | File[], folderName?: string) => {
    const arr = Array.from(files);
    if (arr.length === 0) return;

    const accepted = arr.filter(f =>
      ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"].includes(f.type)
    );

    if (accepted.length === 0) {
      setError("Please select PDF or image files (JPG, PNG).");
      return;
    }

    setError("");
    setUploading(true);
    setUploadStatus(`Processing ${accepted.length} file${accepted.length > 1 ? "s" : ""}...`);

    const formData = new FormData();

    if (accepted.length === 1) {
      formData.append("file", accepted[0]);
    } else {
      // Multiple images → send as collection
      accepted.forEach(f => formData.append("files", f));
      const name = folderName || accepted[0].name.replace(/\.[^.]+$/, "").replace(/_\d+$/, "") + " Notes";
      formData.append("folderName", name);
      setUploadStatus(`Transcribing ${accepted.length} pages using AI vision... (this may take a minute)`);
    }

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed.");
      } else {
        setUploadStatus(`✓ Uploaded "${data.filename}" — ${data.pageCount} pages`);
        await fetchPDFs();
      }
    } catch {
      setError("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  const deletePDF = async (id: string) => {
    await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchPDFs();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      {/* Hero */}
      <div className="text-center space-y-3">
        <div className="text-6xl mb-2">🎓</div>
        <h1 className="text-4xl font-bold">
          <span className="font-devanagari text-primary-400">मराठी नोट्स</span>
          <span className="text-white"> AI</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto font-devanagari">
          आपल्या हस्तलिखित मराठी नोट्ससाठी AI अभ्यास सहाय्यक
        </p>
        <p className="text-gray-500 text-sm">Voice-first AI study assistant for handwritten Marathi notes</p>
        {pdfs.length > 0 && (
          <Link
            href="/study"
            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <span className="font-devanagari">अभ्यास सुरू करा</span>
            <span>/ Start Studying →</span>
          </Link>
        )}
      </div>

      {/* Upload section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-200">
            <span className="font-devanagari">नोट्स अपलोड करा</span>
            <span className="text-gray-500 ml-2 font-normal text-sm">/ Upload Notes</span>
          </h2>
          {/* Mode toggle */}
          <div className="flex bg-bg-card border border-gray-700/50 rounded-lg p-1 text-xs">
            <button
              onClick={() => setUploadMode("single")}
              className={`px-3 py-1.5 rounded-md transition-all ${uploadMode === "single" ? "bg-primary-600 text-white" : "text-gray-400 hover:text-gray-200"}`}
            >
              PDF / Single Image
            </button>
            <button
              onClick={() => setUploadMode("folder")}
              className={`px-3 py-1.5 rounded-md transition-all ${uploadMode === "folder" ? "bg-primary-600 text-white" : "text-gray-400 hover:text-gray-200"}`}
            >
              📁 Image Folder
            </button>
          </div>
        </div>

        <label
          className={`
            relative flex flex-col items-center justify-center
            border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all
            ${dragOver ? "border-primary-400 bg-primary-600/10" : "border-gray-600 hover:border-primary-500/60 hover:bg-bg-card"}
            ${uploading ? "pointer-events-none opacity-70" : ""}
          `}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const files = e.dataTransfer.files;
            if (files.length > 0) handleFiles(files);
          }}
        >
          {uploadMode === "folder" ? (
            <input
              type="file"
              accept="image/*"
              multiple
              // @ts-expect-error webkitdirectory is non-standard
              webkitdirectory=""
              className="sr-only"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  // Get folder name from first file's path
                  const firstFile = e.target.files[0];
                  const relativePath = (firstFile as unknown as { webkitRelativePath: string }).webkitRelativePath;
                  const folderName = relativePath ? relativePath.split("/")[0] : undefined;
                  handleFiles(e.target.files, folderName);
                }
                e.target.value = "";
              }}
            />
          ) : (
            <input
              type="file"
              accept=".pdf,image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          )}

          <div className="text-5xl mb-4">
            {uploading ? "⏳" : uploadMode === "folder" ? "📁" : "📄"}
          </div>

          {uploading ? (
            <div className="w-full max-w-sm space-y-3 text-center">
              <p className="text-sm text-gray-300">{uploadStatus}</p>
              <div className="bg-gray-700/40 rounded-full h-2 overflow-hidden">
                <div className="bg-primary-500 h-2 rounded-full animate-pulse w-full" />
              </div>
              <p className="text-xs text-gray-500">AI is reading your handwritten notes...</p>
            </div>
          ) : uploadMode === "folder" ? (
            <>
              <p className="text-gray-300 font-medium text-center">
                <span className="font-devanagari">इमेज फोल्डर निवडा</span>
              </p>
              <p className="text-gray-500 text-sm mt-1 text-center">
                Select a folder of scanned images (JPG/PNG) — AI will transcribe each page
              </p>
              <p className="text-xs text-gray-600 mt-2">Pages are sorted by filename, so name them 01.jpg, 02.jpg… for correct order</p>
            </>
          ) : (
            <>
              <p className="text-gray-300 font-medium font-devanagari text-center">
                PDF किंवा इमेज फाईल ड्रॅग करा / क्लिक करा
              </p>
              <p className="text-gray-500 text-sm mt-1">PDF, JPG, PNG — drag & drop or click to browse</p>
            </>
          )}
        </label>

        {uploadStatus && !uploading && (
          <p className="text-primary-400 text-sm text-center bg-primary-600/10 border border-primary-500/30 rounded-lg p-3">
            {uploadStatus}
          </p>
        )}
        {error && (
          <p className="text-red-400 text-sm text-center bg-red-900/20 border border-red-700/40 rounded-lg p-3">
            {error}
          </p>
        )}
      </div>

      {/* Uploaded documents */}
      {pdfs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-200">
            <span className="font-devanagari">अपलोड केलेल्या नोट्स</span>
            <span className="text-gray-500 ml-2 font-normal text-sm">/ Uploaded Notes ({pdfs.length})</span>
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {pdfs.map((pdf) => (
              <div key={pdf.id} className="bg-bg-card border border-gray-700/50 rounded-xl p-4 flex items-start gap-3 group">
                <div className="text-3xl">{pdf.filename.includes("collection") || pdf.pageCount > 1 ? "🗂" : "📄"}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-200 truncate">{pdf.filename}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {pdf.pageCount} page{pdf.pageCount !== 1 ? "s" : ""} · {new Date(pdf.uploadedAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <button
                  onClick={() => deletePDF(pdf.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Link href="/study" className="flex-1 text-center bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl font-medium transition-colors font-devanagari">
              🎤 अभ्यास सुरू करा / Start Studying
            </Link>
            <Link href="/quiz" className="flex-1 text-center bg-bg-card border border-gray-700/50 hover:border-primary-500/50 text-gray-300 px-6 py-3 rounded-xl font-medium transition-colors font-devanagari">
              ❓ प्रश्नमंजुषा / Take Quiz
            </Link>
          </div>
        </div>
      )}

      {/* Feature cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: "🎤", title: "आवाज चॅट", sub: "Voice Chat", desc: "Speak in Marathi or English" },
          { icon: "📝", title: "नोट्स", sub: "Smart Notes", desc: "Auto-save important points" },
          { icon: "❓", title: "प्रश्नमंजुषा", sub: "AI Quiz", desc: "Test your understanding" },
          { icon: "📊", title: "प्रगती", sub: "Progress", desc: "Track your study sessions" },
        ].map((f) => (
          <div key={f.sub} className="bg-bg-card border border-gray-700/40 rounded-xl p-4 space-y-2">
            <div className="text-2xl">{f.icon}</div>
            <p className="font-semibold text-gray-200 font-devanagari">{f.title}</p>
            <p className="text-xs text-primary-400">{f.sub}</p>
            <p className="text-xs text-gray-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
