"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import type { MbtiQuestion } from "@/lib/mbti/questions";
import { pickQuestions } from "@/lib/mbti/questions";
import type { MbtiScores, MbtiType } from "@/types";
import SeaBackground from "@/components/SeaBackground";
import MbtiQuestionCard from "@/components/MbtiQuestionCard";

interface AnswerRecord {
  questionId: string;
  dimension: "EI" | "SN" | "TF" | "JP";
  score: number;
}

interface ResultState {
  type: MbtiType | null;
  confidence: number;
  scores: MbtiScores | null;
}

const ROUND_SIZE = 3;

export default function MbtiQuizPage() {
  const [questions, setQuestions] = useState<MbtiQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [result, setResult] = useState<ResultState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize questions on mount
  useEffect(() => {
    const picked = pickQuestions(ROUND_SIZE);
    setQuestions(picked);
  }, []);

  // Handle answer submission for the current question
  const handleAnswer = useCallback(
    async (score: number) => {
      if (isSubmitting) return;
      setIsSubmitting(true);
      setError(null);

      const question = questions[currentIndex];
      const record: AnswerRecord = {
        questionId: question.id,
        dimension: question.dimension,
        score,
      };

      try {
        const res = await fetch("/api/mbti/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "提交失败，请重试");
          setIsSubmitting(false);
          return;
        }

        const data = await res.json();
        const newAnswers = [...answers, record];
        setAnswers(newAnswers);

        const isLastQuestion = currentIndex + 1 >= questions.length;

        if (isLastQuestion) {
          // All questions answered — store latest result
          setResult({
            type: data.type,
            confidence: data.confidence,
            scores: data.scores,
          });
          setCurrentIndex(currentIndex + 1);
        } else {
          // Advance to next question
          setCurrentIndex(currentIndex + 1);
          setIsSubmitting(false);
        }
      } catch {
        setError("网络错误，请重试");
        setIsSubmitting(false);
      }
    },
    [currentIndex, questions, answers, isSubmitting],
  );

  // Loading state
  if (questions.length === 0) {
    return (
      <SeaBackground>
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gold-soft/50 text-sm animate-pulse">
            正在准备题目...
          </p>
        </div>
      </SeaBackground>
    );
  }

  // Result state
  if (result) {
    return (
      <SeaBackground>
        <div className="flex items-center justify-center min-h-screen px-4">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring", damping: 25 }}
          >
            <div className="modal-card">
              {/* Success icon */}
              <div className="text-center mb-4">
                <span className="text-5xl block mb-3" aria-hidden="true">
                  🎉
                </span>
                <h2 className="font-display text-gold-primary text-xl">
                  你的 MBTI 类型
                </h2>
              </div>

              {/* Type display */}
              <div className="text-center mb-5">
                <p className="text-4xl font-bold text-gold-light tracking-[0.3em] mb-2">
                  {result.type ?? "---"}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-white/40 text-sm">置信度</span>
                  <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-gold-primary to-gold-soft rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${result.confidence * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-gold-soft text-sm font-medium">
                    {Math.round(result.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Dimension breakdown */}
              {result.scores && (
                <div className="space-y-2 mb-6">
                  <DimensionBar
                    label="外向 (E) vs 内向 (I)"
                    left={result.scores.E}
                    right={result.scores.I}
                    colors={["bg-blue-400", "bg-blue-300"]}
                  />
                  <DimensionBar
                    label="感觉 (S) vs 直觉 (N)"
                    left={result.scores.S}
                    right={result.scores.N}
                    colors={["bg-green-400", "bg-green-300"]}
                  />
                  <DimensionBar
                    label="思考 (T) vs 情感 (F)"
                    left={result.scores.T}
                    right={result.scores.F}
                    colors={["bg-purple-400", "bg-purple-300"]}
                  />
                  <DimensionBar
                    label="判断 (J) vs 知觉 (P)"
                    left={result.scores.J}
                    right={result.scores.P}
                    colors={["bg-amber-400", "bg-amber-300"]}
                  />
                </div>
              )}

              {/* Note */}
              <p className="text-white/40 text-xs text-center mb-5 leading-relaxed">
                再多答几题可以让结果更准确哦。你随时可以回到这里继续测试。
              </p>

              {/* Back to home */}
              <Link
                href="/"
                className="block w-full text-center btn-primary py-3 text-sm"
              >
                🌊 回到首页
              </Link>
            </div>
          </motion.div>
        </div>
      </SeaBackground>
    );
  }

  return (
    <SeaBackground>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-12 pb-20">
        {/* Progress indicator */}
        <div className="w-full max-w-md mb-6">
          <div className="flex items-center gap-2">
            {questions.map((_, i) => (
              <motion.div
                key={i}
                className={`h-1 rounded-full flex-1 ${
                  i < currentIndex
                    ? "bg-gold-primary"
                    : i === currentIndex
                      ? "bg-gold-primary/40"
                      : "bg-white/10"
                }`}
                animate={
                  i === currentIndex
                    ? { opacity: [0.4, 0.8, 0.4] }
                    : {}
                }
                transition={
                  i === currentIndex
                    ? { duration: 2, repeat: Infinity, ease: "easeInOut" }
                    : {}
                }
              />
            ))}
          </div>
        </div>

        {/* Question card with animation */}
        <AnimatePresence mode="wait">
          {currentIndex < questions.length && (
            <MbtiQuestionCard
              key={questions[currentIndex].id}
              question={questions[currentIndex]}
              onAnswer={handleAnswer}
              questionNumber={currentIndex + 1}
            />
          )}
        </AnimatePresence>

        {/* Error message */}
        {error && (
          <motion.p
            className="mt-4 text-red-400/80 text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
            <button
              className="ml-2 underline hover:text-red-300"
              onClick={() => {
                setError(null);
                setIsSubmitting(false);
              }}
            >
              重试
            </button>
          </motion.p>
        )}
      </div>
    </SeaBackground>
  );
}

// Simple dimension bar component for the result view
function DimensionBar({
  label,
  left,
  right,
  colors,
}: {
  label: string;
  left: number;
  right: number;
  colors: [string, string];
}) {
  const total = left + right || 1;
  const leftPct = (left / total) * 100;
  const rightPct = (right / total) * 100;

  const leftLabel = label.split("vs")[0]?.trim().split(" ").pop() ?? "";
  const rightLabel = label.split("vs")[1]?.trim().split(" ").pop() ?? "";

  return (
    <div>
      <div className="flex justify-between text-white/40 text-xs mb-0.5">
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-white/50 w-5 text-right">{leftLabel}</span>
        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden flex">
          <motion.div
            className={`h-full ${colors[0]} rounded-l-full`}
            initial={{ width: 0 }}
            animate={{ width: `${leftPct}%` }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          />
          <motion.div
            className={`h-full ${colors[1]} rounded-r-full`}
            initial={{ width: 0 }}
            animate={{ width: `${rightPct}%` }}
            transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
          />
        </div>
        <span className="text-xs text-white/50 w-5">{rightLabel}</span>
      </div>
    </div>
  );
}
