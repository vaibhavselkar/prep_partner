// src/hooks/useVoiceConversation.ts
"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { OrbState, SpeechLanguage } from "@/types";

export function useVoiceConversation(opts: {
  onUserUtterance: (text: string) => void;
  lang?: SpeechLanguage;
}) {
  const lang = opts.lang ?? "mr-IN";
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [conversationOn, setConversationOn] = useState(false);
  const [micError, setMicError] = useState("");
  const [englishVoiceOnly, setEnglishVoiceOnly] = useState(false);

  const conversationOnRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const intentionalStopRef = useRef(false); // true right before we deliberately stop/abort recognition
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedRef = useRef("");
  const englishVoiceOnlyRef = useRef(false);
  const onUserRef = useRef(opts.onUserUtterance);
  onUserRef.current = opts.onUserUtterance;

  // Detect Marathi voice availability (English fallback if absent).
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const check = () => {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;
      const hasMarathi = voices.some((v) => v.lang === "mr-IN" || v.lang.startsWith("mr"));
      if (!hasMarathi) { setEnglishVoiceOnly(true); englishVoiceOnlyRef.current = true; }
    };
    check();
    window.speechSynthesis.onvoiceschanged = check;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const startListening = useCallback(() => {
    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition as (new () => SpeechRecognition) | undefined
      || (window as unknown as Record<string, unknown>).webkitSpeechRecognition as (new () => SpeechRecognition) | undefined;
    if (!SR) { setMicError("Speech recognition not supported in this browser."); return; }
    intentionalStopRef.current = true;
    try { recognitionRef.current?.abort(); } catch { /* nothing live */ }
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;
    accumulatedRef.current = "";
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tr = e.results[i][0].transcript;
        if (e.results[i].isFinal) accumulatedRef.current += tr + " ";
        else interim += tr;
      }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const text = (accumulatedRef.current + interim).trim();
        intentionalStopRef.current = true;
        rec.stop();
        if (text) { setOrbState("thinking"); onUserRef.current(text); }
        else if (conversationOnRef.current) startListening();
      }, 1400);
    };
    rec.onerror = (ev: Event) => {
      const err = (ev as unknown as { error?: string }).error;
      if (err === "not-allowed" || err === "service-not-allowed") {
        setMicError("Mic access blocked — कृपया परवानगी द्या.");
        conversationOnRef.current = false;
        setConversationOn(false);
        setOrbState("idle");
      } else if (err === "no-speech" && conversationOnRef.current) {
        startListening();
      }
      /* other errors: ignore; the conversation loop recovers on the next speak */
    };
    rec.onend = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      // If the browser ended recognition on its own (not our deliberate stop/abort)
      // while a conversation is active, restart so the orb never deadlocks on "listening".
      if (intentionalStopRef.current) { intentionalStopRef.current = false; return; }
      if (conversationOnRef.current) startListening();
    };
    recognitionRef.current = rec;
    setOrbState("listening");
    try { rec.start(); } catch { /* already started */ }
  }, [lang]);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      if (conversationOnRef.current) startListening();
      return;
    }
    window.speechSynthesis.cancel();
    if (!text.trim()) { if (conversationOnRef.current) startListening(); return; }
    const chunks = text.match(/[^.!?।]+[.!?।]?/g) ?? [text];
    let idx = 0;
    const pickVoice = (u: SpeechSynthesisUtterance) => {
      const voices = window.speechSynthesis.getVoices();
      const mr = voices.find((v) => v.lang === "mr-IN" || v.lang.startsWith("mr"));
      const hi = voices.find((v) => v.lang.startsWith("hi"));
      const en = voices.find((v) => v.lang.startsWith("en"));
      let chosen: SpeechSynthesisVoice | undefined;
      if (lang.startsWith("en")) chosen = en;
      else if (lang.startsWith("hi")) chosen = hi ?? en;           // Hindi text → Hindi voice
      else chosen = mr ?? hi ?? en;                                // Marathi text → Marathi, else a Hindi voice reads Devanagari far better than English
      u.voice = chosen ?? voices[0] ?? null;
      u.lang = u.voice?.lang ?? (lang.startsWith("en") ? "en-US" : lang);
    };
    const speakNext = () => {
      if (idx >= chunks.length) { if (conversationOnRef.current) startListening(); return; }
      const u = new SpeechSynthesisUtterance(chunks[idx].trim());
      pickVoice(u);
      if (idx === 0) u.onstart = () => setOrbState("speaking");
      u.onend = () => { idx++; speakNext(); };
      u.onerror = () => { idx++; speakNext(); };
      window.speechSynthesis.speak(u);
    };
    // Voices may load async on first call.
    if (window.speechSynthesis.getVoices().length) speakNext();
    else window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; speakNext(); };
  }, [startListening]);

  const startConversation = useCallback(() => {
    conversationOnRef.current = true; setConversationOn(true); setMicError("");
  }, []);
  const stopConversation = useCallback(() => {
    conversationOnRef.current = false; setConversationOn(false);
    intentionalStopRef.current = true;
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setOrbState("idle");
  }, []);

  useEffect(() => () => {
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
    try { recognitionRef.current?.abort(); } catch { /* ignore */ }
  }, []);

  return { orbState, conversationOn, startConversation, stopConversation, speak, micError, englishVoiceOnly };
}
