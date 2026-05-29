"use client";

import { useState, useRef, useCallback } from "react";
import type { SpeechLanguage } from "@/types";

interface UseSpeechRecognitionReturn {
  transcript: string;
  isListening: boolean;
  language: SpeechLanguage;
  supported: boolean;
  error: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
  setLanguage: (lang: SpeechLanguage) => void;
}

export function useSpeechRecognition(
  onFinalResult?: (transcript: string) => void,
  onListeningEnd?: () => void
): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const [language, setLanguageState] = useState<SpeechLanguage>("mr-IN");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const onFinalResultRef = useRef(onFinalResult);
  const onListeningEndRef = useRef(onListeningEnd);
  onFinalResultRef.current = onFinalResult;
  onListeningEndRef.current = onListeningEnd;

  const supported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionAPI =
      (window as unknown as Record<string, unknown>).SpeechRecognition as (new () => SpeechRecognition) ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition as (new () => SpeechRecognition);

    if (!SpeechRecognitionAPI) {
      setError("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    // Stop any existing recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    setError("");
    setTranscript("");

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError("");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      const text = final || interim;
      setTranscript(text);
      if (final.trim()) {
        onFinalResultRef.current?.(final.trim());
      }
    };

    recognition.onerror = (event: Event & { error?: string }) => {
      const code = event.error ?? "unknown";
      if (code === "not-allowed" || code === "permission-denied") {
        setError("Microphone access denied. Please allow microphone in browser settings.");
      } else if (code === "no-speech") {
        // Silence timeout — not a real error, just restart quietly
        setError("");
      } else if (code !== "aborted") {
        setError(`Mic error: ${code}`);
      }
      setIsListening(false);
      recognitionRef.current = null;
      onListeningEndRef.current?.();
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      onListeningEndRef.current?.();
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      setError(`Failed to start mic: ${String(err)}`);
      setIsListening(false);
      recognitionRef.current = null;
    }
  }, [language]); // only language matters — callbacks use refs

  const reset = useCallback(() => {
    setTranscript("");
    setError("");
  }, []);

  const setLanguage = useCallback((lang: SpeechLanguage) => {
    setLanguageState(lang);
    stop();
  }, [stop]);

  return { transcript, isListening, language, supported, error, start, stop, reset, setLanguage };
}
