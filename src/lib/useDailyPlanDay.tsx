"use client";

import { useState, useEffect, useCallback } from "react";
import { dayIndexFrom, PLAN_DAYS } from "@/lib/dailyPlan";

const KEY = "mpsc-plan-start";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Tracks when the 30-day plan started (browser-saved) and derives today's plan-day.
export function useDailyPlanDay() {
  const [start, setStart] = useState<string | null>(null);

  useEffect(() => {
    let s: string | null = null;
    try {
      s = localStorage.getItem(KEY);
    } catch {
      /* ignore */
    }
    if (!s) {
      s = todayISO();
      try {
        localStorage.setItem(KEY, s);
      } catch {
        /* ignore */
      }
    }
    setStart(s);
  }, []);

  const resetToToday = useCallback(() => {
    const s = todayISO();
    try {
      localStorage.setItem(KEY, s);
    } catch {
      /* ignore */
    }
    setStart(s);
  }, []);

  const day = start ? dayIndexFrom(start, new Date()) : 1;
  return { day, totalDays: PLAN_DAYS, start, resetToToday };
}
