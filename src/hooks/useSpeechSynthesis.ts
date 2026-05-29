"use client";

import { useState, useCallback, useRef } from "react";

const DEVANAGARI_REGEX = /[ऀ-ॿ]/;

function isDevanagari(text: string): boolean {
  return DEVANAGARI_REGEX.test(text);
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  // Try exact match
  let voice = voices.find((v) => v.lang === lang);
  // Try prefix match (e.g. "mr" for "mr-IN")
  if (!voice) {
    const prefix = lang.split("-")[0];
    voice = voices.find((v) => v.lang.startsWith(prefix));
  }
  return voice ?? null;
}

interface UseSpeechSynthesisReturn {
  speak: (text: string, forceLang?: string) => void;
  stop: () => void;
  isSpeaking: boolean;
  supported: boolean;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(
    (text: string, forceLang?: string) => {
      if (!supported) return;
      stop();

      // Strip NOTE_SAVE prefix if AI response contains it
      const cleanText = text.replace(/^NOTE_SAVE:.*\n?/i, "").trim();

      const lang = forceLang ?? (isDevanagari(cleanText) ? "mr-IN" : "en-IN");

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.pitch = 1;

      // Voices may not be loaded yet; wait for them
      const assignVoice = () => {
        const voice = pickVoice(lang);
        if (voice) utterance.voice = voice;
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        assignVoice();
      } else {
        window.speechSynthesis.onvoiceschanged = assignVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [supported, stop]
  );

  return { speak, stop, isSpeaking, supported };
}
