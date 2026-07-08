"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type LangPref = "mr" | "en" | "both";

const STORAGE_KEY = "mpsc-lang-pref";

interface LangPrefCtx {
  pref: LangPref;
  setPref: (p: LangPref) => void;
}

const Ctx = createContext<LangPrefCtx>({ pref: "both", setPref: () => {} });

export function LangPrefProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<LangPref>("both");

  // Load persisted preference on mount (client only).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "mr" || saved === "en" || saved === "both") setPrefState(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const setPref = (p: LangPref) => {
    setPrefState(p);
    try {
      localStorage.setItem(STORAGE_KEY, p);
    } catch {
      /* ignore */
    }
  };

  return <Ctx.Provider value={{ pref, setPref }}>{children}</Ctx.Provider>;
}

export function useLangPref(): LangPrefCtx {
  return useContext(Ctx);
}

// Map the preference to the bank's `language` filter value.
export function prefToLanguage(pref: LangPref): "marathi" | "english" | "bilingual" {
  return pref === "mr" ? "marathi" : pref === "en" ? "english" : "bilingual";
}

// Content is stored bilingually as "मराठी / English". Show only the chosen side.
// If a line can't be split on " / ", it is returned in full so nothing is hidden.
export function pickLang(text: string, pref: LangPref): string {
  if (pref === "both" || !text) return text;
  const parts = text.split(" / ");
  if (parts.length < 2) return text;
  if (pref === "mr") return parts[0].trim();
  return parts.slice(1).join(" / ").trim();
}

// Options look like "A. मराठी / English" — keep the "A. " letter prefix intact.
export function pickOption(opt: string, pref: LangPref): string {
  if (pref === "both") return opt;
  const m = opt.match(/^([A-D])\.\s*([\s\S]*)$/);
  if (!m) return pickLang(opt, pref);
  return `${m[1]}. ${pickLang(m[2], pref)}`;
}

// For multi-line notes markdown: apply per line so bilingual bullets/headings split too.
export function pickLangMultiline(md: string, pref: LangPref): string {
  if (pref === "both" || !md) return md;
  return md
    .split("\n")
    .map((line) => {
      // Preserve a leading markdown marker (#, -, *, +, "1.") so structure survives.
      const m = line.match(/^(\s*(?:#{1,6}|[-*+]|\d+[.)])\s+)([\s\S]*)$/);
      return m ? m[1] + pickLang(m[2], pref) : pickLang(line, pref);
    })
    .join("\n");
}
