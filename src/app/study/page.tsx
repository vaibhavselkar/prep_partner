"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useChat } from "ai/react";
import { VoiceOrb } from "@/components/VoiceOrb";
import { ChatTranscript } from "@/components/ChatTranscript";
import { PDFSidebar } from "@/components/PDFSidebar";
import { NotesPanel } from "@/components/NotesPanel";
import type { OrbState, SpeechLanguage } from "@/types";

interface PDFItem {
  id: string;
  filename: string;
  pageCount: number;
  uploadedAt: string;
  blobUrl: string;
}

export default function StudyPage() {
  const [pdfs, setPdfs] = useState<PDFItem[]>([]);
  const [activePdfId, setActivePdfId] = useState<string | null>(null);
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [language, setLanguage] = useState<SpeechLanguage>("mr-IN");
  const [micError, setMicError] = useState("");
  const [conversationOn, setConversationOn] = useState(false);
  // If device has no Marathi voice, use English TTS
  const [englishVoiceOnly, setEnglishVoiceOnly] = useState(false);
  const englishVoiceOnlyRef = useRef(false);

  // Detect Marathi voice availability on mount
  useEffect(() => {
    const check = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      const hasMarathi = voices.some(v => v.lang === "mr-IN" || v.lang.startsWith("mr"));
      if (!hasMarathi) {
        setEnglishVoiceOnly(true);
        englishVoiceOnlyRef.current = true;
      }
    };
    check();
    window.speechSynthesis.onvoiceschanged = check;
  }, []);

  // Refs so callbacks always see latest values without stale closures
  const conversationOnRef = useRef(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedRef = useRef("");
  const activePdfIdRef = useRef<string | null>(null);
  activePdfIdRef.current = activePdfId;

  // ── Speech Recognition ────────────────────────────────────────────────────

  const startListening = useCallback(() => {
    const SR =
      (window as unknown as Record<string, unknown>).SpeechRecognition as (new () => SpeechRecognition) | undefined ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition as (new () => SpeechRecognition) | undefined;

    if (!SR) {
      setMicError("Speech recognition not supported. Use Chrome or Edge.");
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    accumulatedRef.current = "";

    const rec = new SR();
    rec.lang = language;
    rec.continuous = true;       // keep listening until we explicitly stop
    rec.interimResults = true;   // get partial results in real-time
    rec.maxAlternatives = 1;
    recognitionRef.current = rec;

    const commitSpeech = () => {
      const text = accumulatedRef.current.trim();
      accumulatedRef.current = "";
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
      if (text) {
        appendRef.current({ role: "user", content: text });
        setOrbState("thinking");
      } else if (conversationOnRef.current) {
        // Nothing captured — start fresh
        setTimeout(startListening, 300);
      }
    };

    rec.onstart = () => { setOrbState("listening"); setMicError(""); };

    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let finals = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finals += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (finals) accumulatedRef.current += finals;

      // Reset silence timer on every speech event (interim or final)
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if ((accumulatedRef.current + interim).trim()) {
        // 1.8 s of silence after last word → commit
        silenceTimerRef.current = setTimeout(commitSpeech, 1800);
      }
    };

    rec.onerror = (e: Event) => {
      const code = (e as unknown as { error: string }).error;
      if (code === "not-allowed") {
        setMicError("Microphone access denied. Click 🔒 in the address bar → Allow.");
        conversationOnRef.current = false;
        setConversationOn(false);
        setOrbState("idle");
      } else if (code === "no-speech") {
        if (conversationOnRef.current) setTimeout(startListening, 300);
      } else if (code !== "aborted") {
        setMicError(`Mic error: ${code}`);
        if (conversationOnRef.current) setTimeout(startListening, 1000);
      }
    };

    rec.onend = () => {
      recognitionRef.current = null;
      // If we ended without committing (e.g. browser cut us off), commit what we have
      if (accumulatedRef.current.trim()) {
        commitSpeech();
      }
    };

    try { rec.start(); } catch (err) { setMicError(`Could not start mic: ${err}`); }
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
  }, []);

  // ── Speech Synthesis ──────────────────────────────────────────────────────

  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel();

    const clean = text.replace(/^NOTE_SAVE:.*\n?/im, "").trim();
    if (!clean) return;

    const isMarathi = /[ऀ-ॿ]/.test(clean);

    // Split into sentences so Chrome TTS never gets a long chunk to choke on
    const sentences = clean
      .split(/(?<=[।.!?])\s+|(?<=[।.!?])$/)
      .map(s => s.trim())
      .filter(Boolean);
    if (sentences.length === 0) return;

    const pickVoice = (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
      if (isMarathi && !englishVoiceOnlyRef.current) {
        return (
          voices.find(v => v.lang === "mr-IN") ||
          voices.find(v => v.lang === "hi-IN") ||
          voices.find(v => v.lang.startsWith("hi")) ||
          voices.find(v => v.lang.startsWith("en")) ||
          voices[0]
        );
      }
      return (
        voices.find(v => v.lang === "en-IN") ||
        voices.find(v => v.lang.startsWith("en-")) ||
        voices.find(v => v.lang.startsWith("en")) ||
        voices[0]
      );
    };

    const doSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const voice = pickVoice(voices);
      let idx = 0;

      const speakNext = () => {
        if (idx >= sentences.length || !conversationOnRef.current && idx > 0) {
          // All done — restart listening
          synthRef.current = null;
          if (conversationOnRef.current) setTimeout(startListening, 400);
          else setOrbState("idle");
          return;
        }

        const u = new SpeechSynthesisUtterance(sentences[idx]);
        if (voice) { u.voice = voice; u.lang = voice.lang; }
        else { u.lang = (isMarathi && !englishVoiceOnlyRef.current) ? "hi-IN" : "en-IN"; }
        u.rate = 0.92;
        u.pitch = 1;
        u.volume = 1;

        if (idx === 0) u.onstart = () => setOrbState("speaking");
        u.onend = () => { idx++; speakNext(); };
        u.onerror = (e) => {
          if ((e as unknown as { error: string }).error !== "interrupted") {
            console.warn("TTS chunk error:", e);
          }
          idx++;
          speakNext();
        };

        synthRef.current = u;
        window.speechSynthesis.speak(u);
      };

      speakNext();
    };

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) doSpeak();
    else {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        doSpeak();
      };
    }
  }, [startListening]);

  // ── useChat ───────────────────────────────────────────────────────────────

  const { messages, append, isLoading, setMessages } = useChat({
    api: "/api/chat",
    body: { pdfId: activePdfId, englishVoiceOnly: englishVoiceOnlyRef.current },
    onFinish: (message) => {
      // Auto-save note
      const noteMatch = message.content.match(/^NOTE_SAVE:\s*(.+)/im);
      if (noteMatch) {
        fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: noteMatch[1].trim() }),
        }).catch(() => {});
      }
      if (conversationOnRef.current) {
        speak(message.content);
      } else {
        setOrbState("idle");
      }
    },
  });

  // Keep a stable ref to append so startListening closure can use it
  const appendRef = useRef(append);
  appendRef.current = append;

  useEffect(() => {
    if (isLoading) setOrbState("thinking");
  }, [isLoading]);

  // ── Conversation on/off ───────────────────────────────────────────────────

  const handleOrbPress = useCallback(() => {
    if (conversationOnRef.current) {
      // Turn off
      conversationOnRef.current = false;
      setConversationOn(false);
      stopListening();
      window.speechSynthesis.cancel();
      setOrbState("idle");
    } else {
      // Turn on
      conversationOnRef.current = true;
      setConversationOn(true);
      setMicError("");
      startListening();
    }
  }, [startListening, stopListening]);

  // ── PDFs ──────────────────────────────────────────────────────────────────

  const fetchPDFs = useCallback(async () => {
    const res = await fetch("/api/upload");
    const data = await res.json();
    if (Array.isArray(data)) {
      setPdfs(data);
      if (data.length > 0 && !activePdfIdRef.current) setActivePdfId(data[0].id);
    }
  }, []);

  useEffect(() => { fetchPDFs(); }, [fetchPDFs]);

  const handleDeletePDF = async (id: string) => {
    await fetch("/api/upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (activePdfId === id) setActivePdfId(null);
    await fetchPDFs();
  };

  // ── Manual text input ─────────────────────────────────────────────────────

  const handleSendManual = async () => {
    if (!manualInput.trim() || isLoading) return;
    const text = manualInput.trim();
    setManualInput("");
    setOrbState("thinking");
    await append({ role: "user", content: text });
  };

  const clearChat = () => {
    conversationOnRef.current = false;
    setConversationOn(false);
    stopListening();
    window.speechSynthesis.cancel();
    setOrbState("idle");
    setMessages([]);
  };

  return (
    <div className="flex h-[calc(100vh-57px)] overflow-hidden">
      {/* Left sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-700/50 bg-bg-card">
        <div className="p-4 border-b border-gray-700/50">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            <span className="font-devanagari normal-case text-base text-gray-300">नोट्स</span> / PDFs
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <PDFSidebar
            pdfs={pdfs}
            activePdfId={activePdfId}
            onSelect={(id) => { clearChat(); setActivePdfId(id); }}
            onDelete={handleDeletePDF}
          />
        </div>
        <div className="p-3 border-t border-gray-700/50">
          <a href="/" className="block text-center text-xs text-primary-400 hover:text-primary-300 py-2">
            + नोट्स अपलोड करा / Upload Notes
          </a>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700/50 bg-bg-card/80 backdrop-blur">
          <select
            className="md:hidden flex-1 bg-bg-hover border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-gray-200 focus:outline-none focus:border-primary-500"
            value={activePdfId ?? ""}
            onChange={(e) => { clearChat(); setActivePdfId(e.target.value || null); }}
          >
            <option value="">-- PDF निवडा --</option>
            {pdfs.map((p) => <option key={p.id} value={p.id}>{p.filename}</option>)}
          </select>

          <select
            className="bg-bg-hover border border-gray-700/50 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-primary-500"
            value={language}
            onChange={(e) => setLanguage(e.target.value as SpeechLanguage)}
          >
            <option value="mr-IN">🇮🇳 मराठी</option>
            <option value="en-IN">🇬🇧 English</option>
            <option value="hi-IN">🇮🇳 हिंदी</option>
          </select>

          {activePdfId && (
            <span className="hidden md:block text-xs text-gray-500 truncate max-w-[180px]">
              📄 {pdfs.find(p => p.id === activePdfId)?.filename}
            </span>
          )}

          {/* Voice language toggle */}
          <button
            onClick={() => {
              const next = !englishVoiceOnly;
              setEnglishVoiceOnly(next);
              englishVoiceOnlyRef.current = next;
            }}
            title={englishVoiceOnly ? "Voice: English (click for Marathi)" : "Voice: Marathi (click for English)"}
            className="flex items-center gap-1.5 bg-bg-hover border border-gray-700/50 hover:border-primary-500/50 text-gray-300 px-3 py-1.5 rounded-lg text-xs transition-colors"
          >
            🔊 {englishVoiceOnly ? "EN voice" : "MR voice"}
          </button>

          <button
            onClick={() => setNotesPanelOpen(true)}
            className="ml-auto flex items-center gap-2 bg-bg-hover border border-gray-700/50 hover:border-primary-500/50 text-gray-300 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            📝 <span className="font-devanagari">नोट्स</span>
          </button>
          <button onClick={clearChat} className="text-gray-500 hover:text-gray-300 text-xs px-2 py-1.5">
            ✕ Clear
          </button>
        </div>

        {/* Orb area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-col justify-center items-center py-8 px-4 shrink-0 gap-4">
            <VoiceOrb state={orbState} onPress={handleOrbPress} />

            {/* Status text */}
            {!conversationOn && orbState === "idle" && (
              <p className="text-xs text-gray-600 text-center">
                <span className="font-devanagari">एकदा दाबा — संभाषण सुरू होईल</span><br />
                Tap once to start · tap again to stop
              </p>
            )}
            {conversationOn && (
              <p className="text-xs text-primary-500 text-center">
                <span className="animate-pulse">●</span> संभाषण सुरू · Active — tap to stop
              </p>
            )}
            {micError && (
              <p className="text-xs text-red-400 text-center bg-red-900/20 border border-red-700/40 rounded-lg px-4 py-2 max-w-sm">
                🎙 {micError}
              </p>
            )}
          </div>

          {/* Transcript */}
          <div className="flex-1 overflow-y-auto px-4">
            <ChatTranscript
              messages={messages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }))}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Text input fallback */}
        <div className="p-4 border-t border-gray-700/50 bg-bg-card/80 backdrop-blur">
          <div className="flex gap-3 max-w-2xl mx-auto">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendManual()}
              placeholder="किंवा इथे टाइप करा... / Or type here..."
              className="flex-1 bg-bg-hover border border-gray-700/50 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 font-devanagari"
            />
            <button
              onClick={handleSendManual}
              disabled={!manualInput.trim() || isLoading}
              className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              पाठवा
            </button>
          </div>
        </div>
      </div>

      <NotesPanel open={notesPanelOpen} onClose={() => setNotesPanelOpen(false)} />
    </div>
  );
}
