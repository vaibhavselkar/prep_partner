import { sample } from "@/lib/bank";
import type { BankQuestion } from "@/types";

export interface BankQuizInput {
  subject?: string; subtopic?: string; difficulty?: string;
  language?: string; count?: number; excludeIds?: string[]; seed?: number;
}

export function buildBankQuiz(input: BankQuizInput): {
  questions: BankQuestion[]; count: number; requested: number;
} {
  const requested = Math.max(1, Math.min(50, Math.floor(input.count ?? 5)));
  const questions = sample({
    subject: input.subject, subtopic: input.subtopic,
    difficulty: input.difficulty, language: input.language,
    count: requested, excludeIds: input.excludeIds, seed: input.seed,
  });
  return { questions, count: questions.length, requested };
}
