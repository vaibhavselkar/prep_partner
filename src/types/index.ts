export interface PDFMeta {
  id: string;
  filename: string;
  blobUrl: string;
  text: string;
  pageCount: number;
  uploadedAt: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface QuizQuestion {
  question: string;
  options: [string, string, string, string];
  answer: string; // "A" | "B" | "C" | "D"
  explanation: string;
}

export interface QuizResult {
  id: string;
  pdfId: string;
  pdfName: string;
  score: number;
  total: number;
  language: string;
  date: string;
}

export interface PDFProgress {
  pdfId: string;
  filename: string;
  sessionCount: number;
  coveragePercent: number;
  topicsDiscussed: string[];
  quizResults: QuizResult[];
  lastStudied: string;
}

export interface ProgressStore {
  [pdfId: string]: PDFProgress;
}

export type OrbState = "idle" | "listening" | "thinking" | "speaking";
export type SpeechLanguage = "mr-IN" | "en-IN" | "hi-IN";
