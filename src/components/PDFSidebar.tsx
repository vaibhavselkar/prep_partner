"use client";

import { useState } from "react";

interface PDFItem {
  id: string;
  filename: string;
  pageCount: number;
  uploadedAt: string;
}

interface PDFSidebarProps {
  pdfs: PDFItem[];
  activePdfId: string | null;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function PDFSidebar({ pdfs, activePdfId, onSelect, onDelete }: PDFSidebarProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (pdfs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        <p className="font-devanagari text-base mb-1">कोणतेही PDF नाहीत</p>
        <p>No PDFs uploaded yet</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {pdfs.map((pdf) => (
        <li key={pdf.id}>
          <div
            className={`
              group relative rounded-xl p-3 cursor-pointer transition-all
              ${activePdfId === pdf.id
                ? "bg-primary-600/20 border border-primary-500/50"
                : "bg-bg-card border border-gray-700/40 hover:border-gray-600"
              }
            `}
            onClick={() => onSelect(pdf.id)}
          >
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-primary-400 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-200 truncate font-medium">{pdf.filename}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {pdf.pageCount} pages · {new Date(pdf.uploadedAt).toLocaleDateString("mr-IN")}
                </p>
              </div>
              {activePdfId === pdf.id && (
                <span className="w-2 h-2 rounded-full bg-primary-400 mt-1.5 shrink-0" />
              )}
            </div>

            {onDelete && (
              <div
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(pdf.id);
                }}
              >
                <button className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {confirmDelete === pdf.id && (
            <div className="mt-1 p-2 bg-red-900/30 border border-red-700/50 rounded-lg text-xs text-gray-300 flex gap-2 items-center">
              <span className="flex-1">Delete this PDF?</span>
              <button
                className="text-red-400 hover:text-red-300 font-medium"
                onClick={() => { onDelete?.(pdf.id); setConfirmDelete(null); }}
              >Yes</button>
              <button
                className="text-gray-400 hover:text-gray-300"
                onClick={() => setConfirmDelete(null)}
              >No</button>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
