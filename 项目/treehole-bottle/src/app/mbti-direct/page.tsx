"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { MbtiType, MbtiScores } from "@/types";
import SeaBackground from "@/components/SeaBackground";
import MbtiTypeGrid from "@/components/MbtiTypeGrid";

interface ConfirmationState {
  type: MbtiType;
  confidence: number;
  scores: MbtiScores | null;
}

export default function MbtiDirectPage() {
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (type: MbtiType) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/mbti/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "保存失败，请重试");
        setIsSubmitting(false);
        return;
      }

      const data = await res.json();
      setConfirmation({
        type: data.type,
        confidence: data.confidence,
        scores: data.scores,
      });
    } catch {
      setError("网络错误，请重试");
      setIsSubmitting(false);
    }
  };

  return (
    <SeaBackground>
      <div className="flex flex-col items-center justify-center min-h-screen px-4 pt-12 pb-20">
        {/* Confirmation state */}
        {confirmation ? (
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
                  ⚡
                </span>
                <h2 className="font-display text-gold-primary text-xl">
                  已确认你的 MBTI 类型
                </h2>
              </div>

              {/* Type display */}
              <div className="text-center mb-5">
                <p className="text-4xl font-bold text-gold-light tracking-[0.3em] mb-2">
                  {confirmation.type}
                </p>
                <p className="text-white/40 text-sm">
                  置信度：{Math.round(confirmation.confidence * 100)}%
                </p>
              </div>

              {/* Success message */}
              <div className="bg-white/[0.03] rounded-lg p-4 mb-5 border border-gold-primary/20">
                <p className="text-gold-soft text-sm leading-relaxed text-center">
                  系统会根据你的性格类型，优先匹配与你产生共鸣的漂流瓶。
                </p>
              </div>

              {/* Back to home */}
              <Link
                href="/"
                className="block w-full text-center btn-primary py-3 text-sm"
              >
                🌊 回到首页
              </Link>
            </div>
          </motion.div>
        ) : (
          <>
            <MbtiTypeGrid onSelect={handleSelect} />

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

            {/* Back link at bottom */}
            <Link
              href="/"
              className="mt-8 text-white/25 text-xs hover:text-white/50 transition-colors"
            >
              🌊 回到首页
            </Link>
          </>
        )}
      </div>
    </SeaBackground>
  );
}
