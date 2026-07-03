"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import type { BottleDetail } from "@/types";

interface BottleModalProps {
  bottle: BottleDetail;
  onClose: () => void;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "刚刚";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const months = Math.floor(days / 30);
  return `${months} 个月前`;
}

export default function BottleModal({ bottle, onClose }: BottleModalProps) {
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [commentSent, setCommentSent] = useState(false);

  const handleSendComment = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bottleId: bottle.id, content: trimmed }),
      });

      if (res.ok) {
        setCommentSent(true);
        setCommentText("");
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="modal-card w-[90vw] max-w-md max-h-[85vh] overflow-y-auto"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl" aria-hidden="true">
                🍾
              </span>
              <span className="text-gold-primary font-medium text-sm">
                {bottle.user.nickname}
              </span>
              {bottle.user.mbtiType && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gold-primary/15 text-gold-soft">
                  {bottle.user.mbtiType}
                </span>
              )}
              <span className="text-white/25 text-xs">
                {timeAgo(bottle.thrownAt)}
              </span>
            </div>
            <button
              className="text-white/30 hover:text-white/60 transition-colors text-xl leading-none"
              onClick={onClose}
              aria-label="关闭"
            >
              &times;
            </button>
          </div>

          {/* Content */}
          <div className="mb-5 px-1">
            <p className="text-gold-light/80 text-sm leading-relaxed italic whitespace-pre-wrap">
              {bottle.content}
            </p>
          </div>

          {/* Comment section */}
          {bottle.allowComments && !bottle.isOwner && (
            <div className="border-t border-white/5 pt-4">
              {commentSent ? (
                <p className="text-gold-soft/60 text-xs text-center">
                  ✅ 评论已发送，只有瓶主能看到哦
                </p>
              ) : (
                <form onSubmit={handleSendComment}>
                  <p className="text-white/50 text-xs mb-2">
                    💬 留下你的回应（仅瓶主可见）
                  </p>
                  <div className="flex gap-2">
                    <input
                      className="glass-input flex-1 text-sm"
                      placeholder="说点什么..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      maxLength={500}
                    />
                    <button
                      type="submit"
                      className="btn-primary text-sm px-4"
                      disabled={!commentText.trim() || isSending}
                    >
                      发送
                    </button>
                  </div>
                  <p className="text-white/20 text-[10px] mt-1.5">
                    🛡️ 你的评论只有瓶主能看到
                  </p>
                </form>
              )}
            </div>
          )}

          {/* Owner's comments list */}
          {bottle.isOwner && bottle.comments.length > 0 && (
            <div className="border-t border-white/5 pt-4 mt-4">
              <h4 className="text-gold-soft/60 text-xs mb-3">
                💬 收到的回应（{bottle.comments.length}）
              </h4>
              <div className="space-y-2.5">
                {bottle.comments.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white/[0.03] rounded-lg px-3 py-2.5"
                  >
                    <p className="text-gold-light/60 text-xs mb-1">
                      {c.commenter.nickname}
                    </p>
                    <p className="text-white/60 text-sm leading-relaxed">
                      {c.content}
                    </p>
                    <p className="text-white/20 text-[10px] mt-1">
                      {timeAgo(c.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
  );
}
