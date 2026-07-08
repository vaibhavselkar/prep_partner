"use client";

import { useState, useEffect, useCallback } from "react";

export interface MyNote {
  id: string;
  text: string;
  createdAt: string;
}

const STORAGE_KEY = "mpsc-my-notes";

function loadNotes(): MyNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveNotes(notes: MyNote[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    /* ignore */
  }
}

export function useMyNotes() {
  const [notes, setNotes] = useState<MyNote[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load persisted notes on mount (client only).
  useEffect(() => {
    setNotes(loadNotes());
    setLoaded(true);
  }, []);

  // Persist whenever notes change, but only after the initial load has
  // completed — otherwise the empty initial state would overwrite storage.
  useEffect(() => {
    if (!loaded) return;
    saveNotes(notes);
  }, [notes, loaded]);

  const add = useCallback((text: string) => {
    const note: MyNote = {
      id: crypto.randomUUID?.() ?? String(Date.now() + Math.random()),
      text,
      createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [note, ...prev]);
  }, []);

  const remove = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clear = useCallback(() => {
    setNotes([]);
  }, []);

  return { notes, add, remove, clear };
}
