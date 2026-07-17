"use client";
import { useMemo, useRef, useState } from "react";
import { VoiceOrb } from "@/components/VoiceOrb";
import { ChatTranscript } from "@/components/ChatTranscript";
import { ShikvaniProgressPanel } from "@/components/ShikvaniProgressPanel";
import { useVoiceConversation } from "@/hooks/useVoiceConversation";
import { useSyllabusProgress } from "@/lib/syllabusProgress";
import { useLangPref } from "@/lib/langPref";
import { nextTopic } from "@/lib/shikvani/curriculum";
import { parseControlTag } from "@/lib/shikvani/controlTag";
import type { SpeechLanguage } from "@/types";

interface Msg { role: "user" | "assistant"; content: string }

export default function ChaptersPage() {
  const { done, toggle } = useSyllabusProgress();
  const { pref } = useLangPref(); // "mr" | "en" | "both" — controls the teacher's language + voice
  const [messages, setMessages] = useState<Msg[]>([]);
  const [started, setStarted] = useState(false);
  const currentTopic = useMemo(() => nextTopic(done), [done]);
  const currentTopicRef = useRef(currentTopic);
  currentTopicRef.current = currentTopic;
  const prefRef = useRef(pref);
  prefRef.current = pref;
  const messagesRef = useRef<Msg[]>([]);
  messagesRef.current = messages;

  const voiceLang: SpeechLanguage = pref === "en" ? "en-IN" : "mr-IN";

  const sendTurn = async (userText: string) => {
    const topic = currentTopicRef.current;
    if (!topic) return;
    const nextMsgs: Msg[] = [...messagesRef.current, { role: "user", content: userText }];
    setMessages(nextMsgs);
    try {
      const res = await fetch("/api/shikvani-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topicId: topic.id, messages: nextMsgs, language: prefRef.current }),
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
    useVoiceConversation({ onUserUtterance: (t) => sendTurn(t), lang: voiceLang });

  const begin = () => {
    setStarted(true);
    startConversation();
    sendTurn("Let's begin.");
  };
  const stop = () => { setStarted(false); stopConversation(); };

  const topicLabel = currentTopic ? (pref === "mr" ? currentTopic.mr : currentTopic.en) : "";

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-[1fr_320px] gap-6">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold self-start">📚 Chapters</h1>
        <p className="text-sm text-gray-500 self-start -mt-3">
          Your voice teacher — learns the syllabus with you, one chapter at a time.
        </p>
        {currentTopic ? (
          <p className="text-sm text-gray-400 self-start">
            Current chapter: <b className={`text-gray-200 ${pref === "mr" ? "font-devanagari" : ""}`}>{topicLabel}</b>
          </p>
        ) : (
          <p className="text-green-400 self-start">🎉 You&apos;ve completed the whole syllabus!</p>
        )}
        <VoiceOrb
          state={orbState}
          disabled={!currentTopic}
          onPress={() => { if (!started && currentTopic) begin(); }}
        />
        {englishVoiceOnly && pref !== "en" && (
          <p className="text-xs text-amber-400/80">
            No Marathi voice on this device — it will speak in English. (Tip: switch the language to ENG in the top bar.)
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
        <p className="text-xs text-gray-500">
          Teaching language follows the <b>मराठी / ENG / Both</b> toggle in the top bar.
        </p>
        <div className="w-full">
          <ChatTranscript messages={messages} />
        </div>
      </div>
      <aside className="border-l border-gray-800 pl-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">Syllabus progress</h2>
        <ShikvaniProgressPanel currentId={currentTopic?.id ?? null} done={done} lang={pref} />
      </aside>
    </div>
  );
}
