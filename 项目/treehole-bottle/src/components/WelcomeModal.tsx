"use client";

import { motion } from "framer-motion";

interface WelcomeModalProps {
  onClose: () => void;
  onStartMbti: () => void;
  onSkip: () => void;
  onDirectMbti: () => void;
}

export default function WelcomeModal({
  onClose,
  onStartMbti,
  onSkip,
  onDirectMbti,
}: WelcomeModalProps) {
  return (
    <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-card w-[90vw] max-w-sm"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <div className="text-center mb-4">
            <span className="text-3xl block mb-2" aria-hidden="true">
              🫧
            </span>
            <h2 className="font-display text-gold-primary text-xl">
              欢迎来到树洞漂流瓶
            </h2>
          </div>

          {/* Description */}
          <p className="text-gold-light/60 text-sm leading-relaxed text-center mb-5">
            在这里，你可以匿名写下心事投入大海，
            <br />
            也可以捡起别人的漂流瓶，给予温暖的回应。
          </p>

          {/* MBTI info card */}
          <div className="bg-white/[0.03] rounded-lg p-4 mb-5">
            <div className="flex items-start gap-2.5">
              <span className="text-lg flex-shrink-0" aria-hidden="true">
                🧠
              </span>
              <div>
                <h4 className="text-gold-soft text-sm font-medium mb-1">
                  完成 MBTI 性格测试
                </h4>
                <p className="text-white/40 text-xs leading-relaxed">
                  只需 3 道题，我们会根据你的性格，优先匹配与你共鸣的漂流瓶。
                </p>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <button className="btn-primary w-full py-3 text-sm" onClick={onStartMbti}>
              🧠 做 3 道题
            </button>
            <button className="btn-ghost w-full py-3 text-sm" onClick={onDirectMbti}>
              ⚡ 我已经知道自己的 MBTI
            </button>
            <button
              className="text-white/25 text-xs hover:text-white/50 transition-colors py-1"
              onClick={onSkip}
            >
              先跳过，直接看看
            </button>
          </div>
        </motion.div>
      </motion.div>
  );
}
