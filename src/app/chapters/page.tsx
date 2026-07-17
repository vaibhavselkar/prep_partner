"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { VoiceOrb } from "@/components/VoiceOrb";
import { ChatTranscript } from "@/components/ChatTranscript";
import { ShikvaniProgressPanel } from "@/components/ShikvaniProgressPanel";
import { useVoiceConversation } from "@/hooks/useVoiceConversation";
import { useSyllabusProgress } from "@/lib/syllabusProgress";
import { nextTopic } from "@/lib/shikvani/curriculum";
import { parseControlTag } from "@/lib/shikvani/controlTag";
import type { TeachLanguage } from "@/lib/shikvani/teacherPrompt";
import type { SpeechLanguage } from "@/types";

interface Msg { role: "user" | "assistant"; content: string }

const LANG_KEY = "chapters-teach-lang";
const LANG_OPTIONS: { key: TeachLanguage; label: string }[] = [
  { key: "en", label: "English" },
  { key: "mr", label: "मराठी" },
  { key: "hi", label: "हिंदी" },
];
const OPENER: Record<TeachLanguage, string> = {
  en: "Let's begin.",
  mr: "चला, सुरू करूया.",
  hi: "चलिए, शुरू करते हैं.",
  both: "चला, सुरू करूया.",
};
const VOICE_LANG: Record<TeachLanguage, SpeechLanguage> = {
  en: "en-IN", mr: "mr-IN", hi: "hi-IN", both: "mr-IN",
};

export default function ChaptersPage() {
  const { done, toggle } = useSyllabusProgress();
  const [teachLang, setTeachLang] = useState<TeachLanguage>("en");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [started, setStarted] = useState(false);
  const currentTopic = useMemo(() => nextTopic(done), [done]);
  const currentTopicRef = useRef(currentTopic);
  currentTopicRef.current = currentTopic;
  const langRef = useRef(teachLang);
  langRef.current = teachLang;
  const messagesRef = useRef<Msg[]>([]);
  messagesRef.current = messages;

  // Remember the chosen learning language across visits.
  useEffect(() => {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === "en" || saved === "mr" || saved === "hi") setTeachLang(saved);
  }, []);
  const chooseLang = (l: TeachLanguage) => { setTeachLang(l); try { localStorage.setItem(LANG_KEY, l); } catch { /* ignore */ } };

  const sendTurn = async (userText: string) => {
    const topic = currentTopicRef.current;
    if (!topic) return;
    const nextMsgs: Msg[] = [...messagesRef.current, { role: "user", content: userText }];
    setMessages(nextMsgs);
    try {
      const res = await fetch("/api/shikvani-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topicId: topic.id, messages: nextMsgs, language: langRef.current }),
      });
      const full = await res.text();
      const { spoken, control } = parseControlTag(full);
      setMessages((m) => [...m, { role: "assistant", content: spoken }]);
      speak(spoken);
      if (control?.topicDone) toggle(topic.id);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "(Connection problem — please try again.)" }]);
    }
  };

  const { orbState, startConversation, stopConversation, speak, micError, englishVoiceOnly } =
    useVoiceConversation({ onUserUtterance: (t) => sendTurn(t), lang: VOICE_LANG[teachLang] });

  const begin = () => {
    setStarted(true);
    startConversation();
    sendTurn(OPENER[teachLang]);
  };
  const stop = () => { setStarted(false); stopConversation(); };

  const showDevanagari = teachLang === "mr";
  const topicLabel = currentTopic ? (showDevanagari ? currentTopic.mr : currentTopic.en) : "";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-[1fr_320px] gap-6">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold self-start">📚 Chapters</h1>
        <p className="text-sm text-gray-500 self-start -mt-3">
          Your voice teacher — learns the syllabus with you, one chapter at a time.
        </p>

        {/* Learning-language selector — controls how the teacher talks */}
        <div className="self-start flex items-center gap-2 text-sm">
          <span className="text-gray-400">Learn in:</span>
          {LANG_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => chooseLang(o.key)}
              disabled={started}
              className={`px-3 py-1 rounded-lg font-medium transition disabled:opacity-50 ${
                teachLang === o.key ? "bg-primary-600 text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {o.label}
            </button>
          ))}
          {started && <span className="text-xs text-gray-500">(Stop to change)</span>}
        </div>

        {currentTopic ? (
          <p className="text-sm text-gray-400 self-start">
            Current chapter: <b className={`text-gray-200 ${showDevanagari ? "font-devanagari" : ""}`}>{topicLabel}</b>
          </p>
        ) : (
          <p className="text-green-400 self-start">🎉 You&apos;ve completed the whole syllabus!</p>
        )}
        <VoiceOrb
          state={orbState}
          disabled={!currentTopic}
          onPress={() => { if (!started && currentTopic) begin(); }}
        />
        {englishVoiceOnly && teachLang !== "en" && (
          <p className="text-xs text-amber-400/80">
            This device has no Marathi voice, so the accent may be off (it uses a Hindi or English voice). The text is still in {teachLang === "hi" ? "Hindi" : "Marathi"}.
          </p>
        )}
        {micError && <p className="text-xs text-red-400">{micError}</p>}
        {!started ? (
          <button onClick={begin} disabled={!currentTopic}
            className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium disabled:opacity-50">
            ▶ Start lesson
          </button>
        ) : (
          <button onClick={stop} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm">
            Stop
          </button>
        )}
        <div className="w-full">
          <ChatTranscript messages={messages} />
        </div>
      </div>
      <aside className="border-l border-gray-800 pl-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Syllabus progress</h2>
        <ShikvaniProgressPanel currentId={currentTopic?.id ?? null} done={done} marathi={showDevanagari} />
      </aside>
    </div>
  );
}
