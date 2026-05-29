"use client";

import type { OrbState } from "@/types";

interface VoiceOrbProps {
  state: OrbState;
  onPress: () => void;
  disabled?: boolean;
}

const STATE_LABELS: Record<OrbState, { mr: string; en: string }> = {
  idle: { mr: "बोलण्यास दाबा", en: "Tap to speak" },
  listening: { mr: "ऐकत आहे...", en: "Listening..." },
  thinking: { mr: "विचार करत आहे...", en: "Thinking..." },
  speaking: { mr: "बोलत आहे...", en: "Speaking..." },
};

const ORB_COLORS: Record<OrbState, string> = {
  idle: "from-primary-600 to-primary-400",
  listening: "from-primary-400 to-teal-300",
  thinking: "from-primary-700 to-primary-300",
  speaking: "from-primary-500 to-emerald-400",
};

const ORB_ANIMATIONS: Record<OrbState, string> = {
  idle: "animate-orb-idle",
  listening: "animate-orb-listen",
  thinking: "animate-orb-think",
  speaking: "animate-orb-speak",
};

export function VoiceOrb({ state, onPress, disabled }: VoiceOrbProps) {
  const label = STATE_LABELS[state];
  const isActive = state === "listening" || state === "speaking";

  return (
    <div className="flex flex-col items-center gap-6 select-none">
      {/* Rings container */}
      <div className="relative flex items-center justify-center">
        {/* Animated rings */}
        {isActive && (
          <>
            <span className="absolute rounded-full border-2 border-primary-400/40 w-[260px] h-[260px] animate-ring-expand" />
            <span className="absolute rounded-full border-2 border-primary-400/30 w-[260px] h-[260px] animate-ring-expand-delay" />
            <span className="absolute rounded-full border border-primary-400/20 w-[260px] h-[260px] animate-ring-expand-slow" />
          </>
        )}

        {/* Orb button */}
        <button
          onClick={onPress}
          disabled={disabled || state === "thinking" || state === "speaking"}
          aria-label={label.en}
          className={`
            relative w-[200px] h-[200px] rounded-full
            bg-gradient-to-br ${ORB_COLORS[state]}
            ${ORB_ANIMATIONS[state]}
            shadow-[0_0_60px_rgba(29,158,117,0.4)]
            flex items-center justify-center
            cursor-pointer
            disabled:cursor-not-allowed disabled:opacity-70
            transition-all duration-300
            focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-400/60
          `}
        >
          {/* Inner icon */}
          <div className="text-white/90">
            {state === "idle" && (
              <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 0014 0h-2zm-5 9a1 1 0 001-1v-1.07A8 8 0 0019.07 12H17a5 5 0 01-10 0H5a8 8 0 005 7.93V19a1 1 0 001 1z" />
              </svg>
            )}
            {state === "listening" && (
              <div className="flex gap-1 items-end h-12">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span
                    key={i}
                    className="w-2 bg-white/90 rounded-full"
                    style={{
                      height: `${20 + i * 8}px`,
                      animation: `orbSpeak ${0.5 + i * 0.1}s ease-in-out ${i * 0.07}s infinite alternate`,
                    }}
                  />
                ))}
              </div>
            )}
            {state === "thinking" && (
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
              </svg>
            )}
            {state === "speaking" && (
              <svg width="56" height="56" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                <path d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </div>
        </button>
      </div>

      {/* State label */}
      <div className="text-center">
        <p className="text-primary-400 font-devanagari text-lg font-medium">{label.mr}</p>
        <p className="text-gray-400 text-sm mt-0.5">{label.en}</p>
      </div>
    </div>
  );
}
