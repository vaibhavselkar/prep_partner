"use client";

import type { QuizQuestion as QuizQuestionType } from "@/types";

interface QuizQuestionProps {
  question: QuizQuestionType;
  questionNumber: number;
  total: number;
  selectedAnswer: string | null;
  onSelect: (answer: string) => void;
}

const OPTION_LABELS = ["A", "B", "C", "D"];

export function QuizQuestion({
  question,
  questionNumber,
  total,
  selectedAnswer,
  onSelect,
}: QuizQuestionProps) {
  const isAnswered = selectedAnswer !== null;
  const isCorrect = (opt: string) => opt === question.answer;
  const isSelected = (opt: string) => opt === selectedAnswer;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 bg-bg-card px-3 py-1 rounded-full border border-gray-700/50">
          {questionNumber} / {total}
        </span>
        <div className="flex-1 bg-gray-700/30 rounded-full h-1.5">
          <div
            className="bg-primary-500 h-1.5 rounded-full transition-all"
            style={{ width: `${(questionNumber / total) * 100}%` }}
          />
        </div>
      </div>

      <h3 className="text-lg text-gray-100 leading-relaxed font-devanagari">
        {question.question}
      </h3>

      <div className="space-y-3">
        {question.options.map((option, i) => {
          const label = OPTION_LABELS[i];
          const selected = isSelected(label);
          const correct = isCorrect(label);

          let className =
            "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-200 font-devanagari ";

          if (!isAnswered) {
            className += "bg-bg-card border-gray-700/50 text-gray-200 hover:border-primary-500/60 hover:bg-primary-600/10";
          } else if (correct) {
            className += "bg-emerald-600/20 border-emerald-500 text-emerald-300";
          } else if (selected && !correct) {
            className += "bg-red-600/20 border-red-500 text-red-300";
          } else {
            className += "bg-bg-card border-gray-700/30 text-gray-400 opacity-60";
          }

          return (
            <button
              key={i}
              onClick={() => !isAnswered && onSelect(label)}
              disabled={isAnswered}
              className={className}
            >
              <span className="font-mono font-bold mr-3 text-xs opacity-70">{label}.</span>
              {option.replace(/^[A-D]\.\s*/, "")}
              {isAnswered && correct && (
                <span className="ml-2 text-emerald-400">✓</span>
              )}
              {isAnswered && selected && !correct && (
                <span className="ml-2 text-red-400">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <div className="bg-bg-card border border-gray-700/50 rounded-xl p-4 text-sm text-gray-300 font-devanagari">
          <span className="font-semibold text-primary-400 mr-1">💡 स्पष्टीकरण / Explanation:</span>
          {question.explanation}
        </div>
      )}
    </div>
  );
}
