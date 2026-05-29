"use client";

import { useState, useEffect, useCallback } from "react";

interface NotesPanelProps {
  open: boolean;
  onClose: () => void;
}

export function NotesPanel({ open, onClose }: NotesPanelProps) {
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    const res = await fetch("/api/notes");
    const data = await res.json();
    setNotes(data.notes ?? []);
  }, []);

  useEffect(() => {
    if (open) fetchNotes();
  }, [open, fetchNotes]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    setLoading(true);
    await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newNote.trim() }),
    });
    setNewNote("");
    await fetchNotes();
    setLoading(false);
  };

  const deleteNote = async (index: number) => {
    await fetch("/api/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index }),
    });
    await fetchNotes();
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside
        className={`
          fixed top-0 right-0 h-full w-80 bg-bg-card border-l border-gray-700/50
          z-40 flex flex-col transition-transform duration-300
          ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
          <h2 className="font-semibold text-gray-100">
            <span className="font-devanagari">नोट्स</span> / Notes
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {notes.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8 font-devanagari">
              अजून कोणत्याही नोट्स नाहीत<br />
              <span className="font-sans text-xs">No notes yet</span>
            </p>
          ) : (
            notes.map((note, i) => (
              <div
                key={i}
                className="bg-bg-hover rounded-lg p-3 text-sm text-gray-300 group flex gap-2"
              >
                <span className="flex-1 break-words">{note}</span>
                <button
                  onClick={() => deleteNote(i)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-700/50 space-y-2">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="नोट लिहा... / Write a note..."
            className="w-full bg-bg-hover border border-gray-700/50 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-primary-500 font-devanagari"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addNote();
            }}
          />
          <button
            onClick={addNote}
            disabled={loading || !newNote.trim()}
            className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            <span className="font-devanagari">जतन करा</span> / Save Note
          </button>
        </div>
      </aside>
    </>
  );
}
