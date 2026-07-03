"use client";

import { useState } from "react";
import type { BottlePayload } from "@/types";

interface WritingPanelProps {
  onThrow: (payload: BottlePayload) => void;
}

const MAX_CHARS = 2000;

export default function WritingPanel({ onThrow }: WritingPanelProps) {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [allowComments, setAllowComments] = useState(true);

  const charCount = content.length;
  const canSubmit = charCount > 0 && charCount <= MAX_CHARS;

  const handleThrow = () => {
    if (!canSubmit) return;
    onThrow({
      content: content.trim(),
      visibility,
      allowComments,
    });
  };

  return (
    <div className="flex flex-col items-center px-4 pt-2 pb-8 max-w-lg mx-auto w-full">
      {/* Textarea */}
      <textarea
        className="w-full h-56 glass-input resize-none text-base leading-relaxed"
        placeholder="今天发生了什么让你心情波动的事？"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={MAX_CHARS}
      />

      {/* Character count */}
      <div className="w-full text-right mt-1.5">
        <span
          className={`text-xs ${
            charCount > MAX_CHARS * 0.9
              ? "text-red-400"
              : "text-white/30"
          }`}
        >
          {charCount}/{MAX_CHARS}
        </span>
      </div>

      {/* Visibility / Comments toggle */}
      <div className="flex items-center gap-3 mt-5">
        {/* Visibility pill */}
        <div className="flex rounded-full border border-white/10 bg-white/5 p-0.5">
          <button
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
              visibility === "private"
                ? "bg-gold-primary text-sea-deep"
                : "text-white/40 hover:text-white/60"
            }`}
            onClick={() => setVisibility("private")}
          >
            🔒 仅自己
          </button>
          <button
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
              visibility === "public"
                ? "bg-gold-primary text-sea-deep"
                : "text-white/40 hover:text-white/60"
            }`}
            onClick={() => setVisibility("public")}
          >
            🌊 大家可见
          </button>
        </div>

        {/* Allow comments toggle */}
        <button
          className={`rounded-full px-4 py-1.5 text-xs font-medium border transition-all duration-200 ${
            allowComments
              ? "bg-gold-soft/10 border-gold-soft/30 text-gold-soft"
              : "border-white/10 text-white/40 hover:text-white/60"
          }`}
          onClick={() => setAllowComments(!allowComments)}
        >
          {allowComments ? "💬 允许评论" : "🔇 关闭评论"}
        </button>
      </div>

      {/* Submit button */}
      <button
        className="btn-primary mt-8 text-base px-10 py-2.5"
        disabled={!canSubmit}
        onClick={handleThrow}
      >
        🍾 投出漂流瓶
      </button>
    </div>
  );
}
