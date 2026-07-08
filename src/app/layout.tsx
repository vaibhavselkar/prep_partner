import type { Metadata } from "next";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { LangPrefProvider } from "@/lib/langPref";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-devanagari",
});

export const metadata: Metadata = {
  title: "मराठी नोट्स AI | Marathi Notes AI",
  description: "Voice-first AI study assistant for Marathi handwritten notes",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mr" className={`dark ${inter.variable} ${notoDevanagari.variable}`}>
      <body className="min-h-screen bg-bg text-gray-100 flex flex-col">
        <LangPrefProvider>
          <NavBar />
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
        </LangPrefProvider>
      </body>
    </html>
  );
}
