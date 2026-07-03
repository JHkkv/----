"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MbtiQuestion } from "@/lib/mbti/questions";
import type { MbtiDimension } from "@/types";

interface MbtiQuestionCardProps {
  question: MbtiQuestion;
  onAnswer: (score: number) => void;
  questionNumber: number;
}

const DIMENSION_LABELS: Record<MbtiDimension, string> = {
  EI: "E/I 外向/内向",
  SN: "S/N 感觉/直觉",
  TF: "T/F 思考/情感",
  JP: "J/P 判断/知觉",
};

const DIMENSION_COLORS: Record<MbtiDimension, { bg: string; text: string; border: string }> = {
  EI: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-400/30",
  },
  SN: {
    bg: "bg-green-500/10",
    text: "text-green-400",
    border: "border-green-400/30",
  },
  TF: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-400/30",
  },
  JP: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-400/30",
  },
};

export default function MbtiQuestionCard({
  question,
  onAnswer,
  questionNumber,
}: MbtiQuestionCardProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const colors = DIMENSION_COLORS[question.dimension];

  const handleSelect = (index: number, score: number) => {
    if (selectedIndex !== null || isTransitioning) return;
    setSelectedIndex(index);
    setIsTransitioning(true);
    setTimeout(() => {
      onAnswer(score);
    }, 400);
  };

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -24 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Dimension badge */}
      <div className="flex items-center justify-between mb-4">
        <span
          className={`text-xs px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}
        >
          {DIMENSION_LABELS[question.dimension]}
        </span>
        <span className="text-white/30 text-xs">
          {questionNumber} / 3
        </span>
      </div>

      {/* Question card */}
      <div className="modal-card !p-5">
        {/* Question text */}
        <p className="text-gold-light text-base leading-relaxed mb-6">
          {question.text}
        </p>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {question.options.map((option, index) => {
            const isSelected = selectedIndex === index;

            return (
              <motion.button
                key={option.label}
                className={`
                  w-full text-left px-4 py-3 rounded-lg border transition-all duration-200
                  ${
                    isSelected
                      ? "border-gold-primary/60 bg-gold-primary/10 text-gold-light"
                      : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:bg-white/[0.06] hover:text-white/80"
                  }
                  ${selectedIndex !== null && !isSelected ? "opacity-40" : ""}
                `}
                onClick={() => handleSelect(index, option.score)}
                disabled={selectedIndex !== null}
                whileTap={selectedIndex === null ? { scale: 0.98 } : {}}
                animate={
                  isSelected
                    ? {
                        borderColor: [
                          "rgba(232, 184, 109, 0.6)",
                          "rgba(232, 184, 109, 0.9)",
                          "rgba(232, 184, 109, 0.6)",
                        ],
                        transition: {
                          duration: 1.5,
                          repeat: 1,
                          ease: "easeInOut",
                        },
                      }
                    : {}
                }
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`
                      flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border
                      ${
                        isSelected
                          ? "border-gold-primary text-gold-primary bg-gold-primary/20"
                          : "border-white/20 text-white/40"
                      }
                    `}
                  >
                    {option.label}
                  </span>
                  <span className="text-sm pt-0.5">{option.text}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
