"use client";

import { motion } from "framer-motion";
import type { BottlePayload } from "@/types";

interface ConfirmModalProps {
  payload: BottlePayload;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  payload,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const preview =
    payload.content.length > 100
      ? payload.content.slice(0, 100) + "..."
      : payload.content;

  return (
    <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onCancel}
      >
        <motion.div
          className="modal-card w-[90vw] max-w-md"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl" aria-hidden="true">
              🍾
            </span>
            <h3 className="text-gold-primary font-medium text-base">
              确认投出你的漂流瓶
            </h3>
          </div>

          {/* Content preview */}
          <div className="bg-white/[0.03] rounded-lg p-4 mb-4 max-h-32 overflow-y-auto">
            <p className="text-gold-light/70 text-sm leading-relaxed whitespace-pre-wrap italic">
              {preview}
            </p>
          </div>

          {/* Visibility badge */}
          <div className="flex justify-center mb-5">
            <span
              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full ${
                payload.allowComments
                  ? "bg-gold-soft/10 text-gold-soft border border-gold-soft/20"
                  : "bg-white/5 text-white/40 border border-white/10"
              }`}
            >
              {payload.allowComments ? "🌊 允许评论" : "🔒 仅自己可见"}
            </span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button className="btn-ghost flex-1" onClick={onCancel}>
              修改
            </button>
            <button className="btn-primary flex-1" onClick={onConfirm}>
              ✅ 确认投出
            </button>
          </div>

          {/* Footer note */}
          <p className="text-white/20 text-[10px] text-center mt-4">
            投出后瓶子将飘向大海，无法撤回
          </p>
        </motion.div>
      </motion.div>
  );
}
