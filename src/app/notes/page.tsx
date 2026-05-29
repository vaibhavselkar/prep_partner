"use client";

import { useState, useEffect, useCallback } from "react";

export default function NotesPage() {
  const [notes, setNotes] = useState<string[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const fetchNotes = useCallback(async () => {
    const res = await fetch("/api/notes");
    const data = await res.json();
    setNotes(data.notes ?? []);
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

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

  const clearAll = async () => {
    await fetch("/api/notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setConfirmClear(false);
    await fetchNotes();
  };

  const downloadTxt = () => {
    const content = notes.join("\n");
    const blob = new Blob([content], { type: "text/plain; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marathi-notes-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          <span className="font-devanagari text-primary-400">नोट्स</span>
          <span className="text-gray-300"> / Notes</span>
        </h1>
        <div className="flex gap-2">
          {notes.length > 0 && (
            <>
              <button
                onClick={downloadTxt}
                className="flex items-center gap-2 bg-bg-card border border-gray-700/50 hover:border-primary-500/50 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                ⬇ <span className="font-devanagari">डाउनलोड</span> .txt
              </button>
              <button
                onClick={() => setConfirmClear(true)}
                className="flex items-center gap-2 bg-bg-card border border-red-700/40 hover:border-red-500 text-red-400 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                🗑 सर्व मिटवा / Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {confirmClear && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-xl p-4 flex items-center gap-4">
          <p className="flex-1 text-sm text-gray-300 font-devanagari">
            सर्व नोट्स कायमचे मिटवायच्या आहेत का?<br />
            <span className="font-sans text-xs text-gray-500">This will permanently delete all notes.</span>
          </p>
          <button onClick={clearAll} className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm">
            हो / Yes
          </button>
          <button onClick={() => setConfirmClear(false)} className="text-gray-400 hover:text-gray-200 px-3 py-2 text-sm">
            नाही / No
          </button>
        </div>
      )}

      {/* Add note */}
      <div className="bg-bg-card border border-gray-700/50 rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-medium text-gray-400">
          <span className="font-devanagari">नवीन नोट जोडा</span> / Add Note
        </h2>
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="नोट लिहा... / Write your note here..."
          className="w-full bg-bg-hover border border-gray-700/50 rounded-xl p-4 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none focus:border-primary-500 font-devanagari min-h-[100px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addNote();
          }}
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600">Ctrl+Enter to save</span>
          <button
            onClick={addNote}
            disabled={loading || !newNote.trim()}
            className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors font-devanagari"
          >
            {loading ? "जतन करत आहे..." : "जतन करा / Save"}
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div className="space-y-3">
        {notes.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-4">📝</p>
            <p className="font-devanagari text-lg">अजून कोणत्याही नोट्स नाहीत</p>
            <p className="text-sm mt-1">No notes yet. Start studying to auto-save notes!</p>
          </div>
        ) : (
          notes.map((note, i) => (
            <div
              key={i}
              className="bg-bg-card border border-gray-700/40 rounded-xl p-4 flex gap-4 group"
            >
              <div className="flex-1">
                <p className="text-sm text-gray-300 leading-relaxed font-devanagari">{note}</p>
              </div>
              <button
                onClick={() => deleteNote(i)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-400 shrink-0 p-1"
                title="Delete note"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
