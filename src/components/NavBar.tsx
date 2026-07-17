"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLangPref, type LangPref } from "@/lib/langPref";

const LANG_OPTIONS: { key: LangPref; label: string }[] = [
  { key: "mr", label: "मराठी" },
  { key: "en", label: "ENG" },
  { key: "both", label: "Both" },
];

function LangToggle() {
  const { pref, setPref } = useLangPref();
  return (
    <div
      className="flex items-center gap-0.5 bg-bg-hover border border-gray-700/50 rounded-lg p-0.5"
      title="भाषा / Content language"
    >
      <span className="text-[11px] text-gray-500 px-1 hidden sm:inline">🌐</span>
      {LANG_OPTIONS.map((o) => (
        <button
          key={o.key}
          onClick={() => setPref(o.key)}
          className={`px-2 py-1 rounded-md text-xs font-medium transition-colors font-devanagari ${
            pref === o.key
              ? "bg-primary-600 text-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
          aria-pressed={pref === o.key}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const NAV_ITEMS = [
  { href: "/", label: "मुख्यपृष्ठ", labelEn: "Home", icon: "🏠" },
  { href: "/technical-sahayak", label: "तांत्रिक सहायक", labelEn: "MPSC Prep", icon: "⚙️" },
  { href: "/study", label: "अभ्यास", labelEn: "Study", icon: "🎤" },
  { href: "/notes", label: "नोट्स", labelEn: "Notes", icon: "📝" },
  { href: "/quiz", label: "प्रश्नमंजुषा", labelEn: "Quiz", icon: "❓" },
  { href: "/shikvani", label: "शिकवणी", labelEn: "Shikvani", icon: "🎓" },
  { href: "/memes", label: "मीम", labelEn: "Memes", icon: "🖼️" },
  { href: "/progress", label: "प्रगती", labelEn: "Progress", icon: "📊" },
];

export function NavBar() {
  const pathname = usePathname();
  const { pref } = useLangPref();
  const L = (mr: string, en: string) => (pref === "mr" ? mr : pref === "en" ? en : `${mr} / ${en}`);

  return (
    <>
      {/* Desktop top nav */}
      <nav className="hidden md:flex items-center justify-between px-6 py-3 bg-bg-card border-b border-gray-700/50 sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-primary-400 text-xl">🎓</span>
          <span className="font-bold text-gray-100">
            <span className="font-devanagari">मराठी नोट्स</span>
            <span className="text-primary-400"> AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
        <ul className="flex gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${active
                      ? "bg-primary-600/20 text-primary-400 border border-primary-500/40"
                      : "text-gray-400 hover:text-gray-200 hover:bg-bg-hover"
                    }
                  `}
                >
                  {pref === "mr" ? (
                    <span className="font-devanagari">{item.label}</span>
                  ) : pref === "en" ? (
                    <span>{item.labelEn}</span>
                  ) : (
                    <>
                      <span className="font-devanagari">{item.label}</span>
                      <span className="text-gray-500 ml-1">/ {item.labelEn}</span>
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        <LangToggle />
        </div>
      </nav>

      {/* Mobile top bar (toggle) */}
      <div className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-2 bg-bg-card border-b border-gray-700/50">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="text-primary-400 text-lg">🎓</span>
          <span className="font-bold text-sm text-gray-100 font-devanagari">मराठी नोट्स <span className="text-primary-400">AI</span></span>
        </Link>
        <LangToggle />
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg-card border-t border-gray-700/50 z-20 flex">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex-1 flex flex-col items-center py-2 gap-0.5 text-xs
                ${active ? "text-primary-400" : "text-gray-500"}
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-devanagari text-[10px]">{L(item.label, item.labelEn)}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
