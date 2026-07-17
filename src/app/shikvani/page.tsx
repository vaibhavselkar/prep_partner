"use client";
import { useMemo, useRef, useState } from "react";
import { VoiceOrb } from "@/components/VoiceOrb";
import { ChatTranscript } from "@/components/ChatTranscript";
import { ShikvaniProgressPanel } from "@/components/ShikvaniProgressPanel";
import { useVoiceConversation } from "@/hooks/useVoiceConversation";
import { useSyllabusProgress } from "@/lib/syllabusProgress";
import { nextTopic } from "@/lib/shikvani/curriculum";
import { parseControlTag } from "@/lib/shikvani/controlTag";

interface Msg { role: "user" | "assistant"; content: string }

export default function ShikvaniPage() {
  const { done, toggle } = useSyllabusProgress();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [started, setStarted] = useState(false);
  const currentTopic = useMemo(() => nextTopic(done), [done]);
  const currentTopicRef = useRef(currentTopic);
  currentTopicRef.current = currentTopic;
  const messagesRef = useRef<Msg[]>([]);
  messagesRef.current = messages;

  // Send a user turn (or the initial "start") to the teacher and speak the reply.
  const sendTurn = async (userText: string) => {
    const topic = currentTopicRef.current;
    if (!topic) return;
    const nextMsgs: Msg[] = [...messagesRef.current, { role: "user", content: userText }];
    setMessages(nextMsgs);
    try {
      const res = await fetch("/api/shikvani-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topicId: topic.id, messages: nextMsgs }),
      });
      const full = await res.text();
      const { spoken, control } = parseControlTag(full);
      setMessages((m) => [...m, { role: "assistant", content: spoken }]);
      speak(spoken);
      if (control?.topicDone) toggle(topic.id); // advance: marks done -> nextTopic recomputes
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "(कनेक्शन अडचण — पुन्हा प्रयत्न करा)" }]);
    }
  };

  const { orbState, startConversation, stopConversation, speak, micError, englishVoiceOnly } =
    useVoiceConversation({ onUserUtterance: (t) => sendTurn(t) });

  const begin = () => {
    setStarted(true);
    startConversation();
    sendTurn("सुरू करा"); // "let's begin"
  };
  const stop = () => { setStarted(false); stopConversation(); };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-[1fr_320px] gap-6">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-2xl font-bold self-start">
          <span className="font-devanagari text-primary-400">शिकवणी</span>
          <span className="text-gray-300"> / Shikvani</span>
        </h1>
        {currentTopic ? (
          <p className="text-sm text-gray-400 self-start font-devanagari">
            आजचा विषय: <b className="text-gray-200">{currentTopic.mr}</b>
          </p>
        ) : (
          <p className="text-green-400 self-start">तुम्ही संपूर्ण अभ्यासक्रम पूर्ण केला! 🎉</p>
        )}
        <VoiceOrb
          state={orbState}
          disabled={!currentTopic}
          onPress={() => { if (!started && currentTopic) begin(); }}
        />
        {englishVoiceOnly && (
          <p className="text-xs text-amber-400/80 font-devanagari">
            या device वर मराठी आवाज नाही — English आवाजात बोलेल.
          </p>
        )}
        {micError && <p className="text-xs text-red-400">{micError}</p>}
        {!started ? (
          <button onClick={begin} disabled={!currentTopic}
            className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-medium disabled:opacity-50">
            ▶ सुरू करा / Start lesson
          </button>
        ) : (
          <button onClick={stop} className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white text-sm">
            थांबा / Stop
          </button>
        )}
        <div className="w-full">
          <ChatTranscript messages={messages} />
        </div>
      </div>
      <aside className="border-l border-gray-800 pl-4">
        <h2 className="text-sm font-semibold text-gray-300 mb-3 font-devanagari">अभ्यासक्रम प्रगती</h2>
        <ShikvaniProgressPanel currentId={currentTopic?.id ?? null} done={done} />
      </aside>
    </div>
  );
}
