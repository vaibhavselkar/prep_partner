import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface TestQuestion {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  answer: string; // "A" | "B" | "C" | "D"
  explanation: string;
}

/** Question sent to the client during the test — WITHOUT the answer/explanation. */
export interface PublicQuestion {
  id: string;
  difficulty: string;
  question: string;
  options: string[];
}

export interface TestMeta {
  id: string;
  titleMr: string;
  titleEn: string;
  subject: string;
  durationMin: number;
  marksPerQ: number;
  negativePerWrong: number;
  questionCount: number;
}

export interface PerQuestionResult {
  id: string;
  chosen: string | null;
  correct: string;
  isCorrect: boolean;
}

export interface ScoreResult {
  correct: number;
  wrong: number;
  unanswered: number;
  score: number;
  maxScore: number;
  percentage: number;
  perQuestion: PerQuestionResult[];
}

const TESTS_DIR = join(process.cwd(), "src", "data", "tests");

export function loadRegistry(): TestMeta[] {
  return JSON.parse(readFileSync(join(TESTS_DIR, "registry.json"), "utf8")) as TestMeta[];
}

export function getTestMeta(id: string): TestMeta | undefined {
  return loadRegistry().find((t) => t.id === id);
}

export function loadQuestions(id: string): TestQuestion[] {
  return JSON.parse(readFileSync(join(TESTS_DIR, `${id}.json`), "utf8")) as TestQuestion[];
}

/** Strip answers/explanations before sending questions to the browser. */
export function publicQuestions(qs: TestQuestion[]): PublicQuestion[] {
  return qs.map((q) => ({ id: q.id, difficulty: q.difficulty, question: q.question, options: q.options }));
}

/**
 * MPSC-style scoring: +marksPerQ per correct, -negativePerWrong per wrong,
 * 0 for unanswered. `answers` maps question id -> chosen letter (or null/absent).
 */
export function scoreTest(
  questions: TestQuestion[],
  answers: Record<string, string | null>,
  marksPerQ: number,
  negativePerWrong: number,
): ScoreResult {
  let correct = 0, wrong = 0, unanswered = 0;
  const perQuestion: PerQuestionResult[] = [];
  for (const q of questions) {
    const chosen = answers[q.id] ?? null;
    if (!chosen) {
      unanswered++;
      perQuestion.push({ id: q.id, chosen: null, correct: q.answer, isCorrect: false });
    } else if (chosen === q.answer) {
      correct++;
      perQuestion.push({ id: q.id, chosen, correct: q.answer, isCorrect: true });
    } else {
      wrong++;
      perQuestion.push({ id: q.id, chosen, correct: q.answer, isCorrect: false });
    }
  }
  const raw = correct * marksPerQ - wrong * negativePerWrong;
  const score = Math.round(raw * 100) / 100;
  const maxScore = questions.length * marksPerQ;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 1000) / 10 : 0;
  return { correct, wrong, unanswered, score, maxScore, percentage, perQuestion };
}
