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

export interface BankQuestion {
  id: string;
  subject: string;
  subtopic: string;
  difficulty: "easy" | "medium" | "hard";
  language: "marathi" | "english" | "bilingual";
  question: string;
  options: [string, string, string, string];
  answer: "A" | "B" | "C" | "D";
  explanation: string;
  tags: string[];
  verifiedAt: string;
  isCurrentAffairs?: boolean;
  asOfDate?: string;
}

export interface BankManifest {
  generatedAt: string;
  total: number;
  bySubject: Record<string, number>;
  bySubtopic: Record<string, number>;
}

export interface MockAttempt {
  id: string;
  date: string;
  total: number;
  score: number;
  durationSec: number;
  bySubject: Record<string, { correct: number; total: number }>;
}

export interface TopicStat {
  subject: string; subtopic: string; attempts: number; correct: number; lastPracticed: string;
}
export interface ReportedQuestion {
  id: string; questionId: string; reason: string; note: string; createdAt: string;
}
export interface MpscProgress {
  topicStats: TopicStat[];
  mockAttempts: MockAttempt[];
}
