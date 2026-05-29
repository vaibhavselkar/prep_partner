"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/types";

interface ChatTranscriptProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export function ChatTranscript({ messages, isLoading }: ChatTranscriptProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 text-sm py-8">
        <p className="text-center font-devanagari">
          बोलणे सुरू करा किंवा खाली टाइप करा<br />
          <span className="text-xs text-gray-600 font-sans">Start speaking or type below</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto space-y-3 py-4 px-2 min-h-0">
      {messages
        .filter((m) => m.role !== "system")
        .map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`
                max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                ${msg.role === "user"
                  ? "bg-primary-600 text-white rounded-br-sm"
                  : "bg-bg-card text-gray-100 border border-gray-700/50 rounded-bl-sm"
                }
              `}
            >
              {/* Strip NOTE_SAVE prefix from display */}
              {msg.content.replace(/^NOTE_SAVE:.*\n?/i, "").trim()}
            </div>
          </div>
        ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="bg-bg-card border border-gray-700/50 rounded-2xl rounded-bl-sm px-4 py-3">
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
