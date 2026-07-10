"use client";

import { useState, useEffect, useCallback } from "react";

const KEY = "mpsc-syllabus-progress";

// Browser-saved set of completed syllabus-topic ids, with toggle + counting helpers.
export function useSyllabusProgress() {
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setDone(new Set(JSON.parse(raw) as string[]));
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback((id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(KEY, JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const isDone = useCallback((id: string) => done.has(id), [done]);
  const countDone = useCallback((ids: string[]) => ids.reduce((n, id) => (done.has(id) ? n + 1 : n), 0), [done]);

  return { done, toggle, isDone, countDone };
}
