"use client";

import { motion } from "framer-motion";

interface TopBarProps {
  mode: "view" | "write";
  onModeChange: (mode: "view" | "write") => void;
  nickname: string;
  mbtiConfidence: number | null;
  onLoginClick: () => void;
  onMbtiClick: () => void;
}

export default function TopBar({
  mode,
  onModeChange,
  nickname,
  mbtiConfidence,
  onLoginClick,
  onMbtiClick,
}: TopBarProps) {
  const showMbtiReminder = mbtiConfidence === null || mbtiConfidence < 0.6;

  return (
    <header className="relative z-40 flex items-center justify-between px-5 py-4">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden="true">
          🫧
        </span>
        <h1 className="font-display text-gold-primary text-xl tracking-wide">
          树洞漂流瓶
        </h1>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* MBTI reminder */}
        {showMbtiReminder && (
          <motion.button
            className="relative rounded-full px-3 py-1 text-xs text-gold-primary border border-gold-primary/40 bg-gold-primary/5"
            initial={{ boxShadow: "0 0 0px rgba(232, 184, 109, 0)" }}
            animate={{
              boxShadow: [
                "0 0 4px rgba(232, 184, 109, 0.2)",
                "0 0 12px rgba(232, 184, 109, 0.5)",
                "0 0 4px rgba(232, 184, 109, 0.2)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            title="点击完成 MBTI 测试以获得更精准的漂流瓶匹配"
            onClick={onMbtiClick}
          >
            🧠 测MBTI
          </motion.button>
        )}

        {/* Mode toggle pill */}
        <div className="flex rounded-full border border-white/10 bg-white/5 p-0.5">
          <button
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
              mode === "view"
                ? "bg-gold-primary text-sea-deep shadow-md shadow-gold-primary/20"
                : "text-white/40 hover:text-white/60"
            }`}
            onClick={() => onModeChange("view")}
          >
            捡瓶
          </button>
          <button
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
              mode === "write"
                ? "bg-gold-primary text-sea-deep shadow-md shadow-gold-primary/20"
                : "text-white/40 hover:text-white/60"
            }`}
            onClick={() => onModeChange("write")}
          >
            写瓶
          </button>
        </div>

        {/* Nickname */}
        <span className="text-sm text-gold-soft/60 truncate max-w-[120px]">
          {nickname}
        </span>

        {/* Login button */}
        <button
          className="text-xs text-white/30 hover:text-gold-soft transition-colors border border-white/10 hover:border-gold-soft/30 rounded-full px-3 py-1"
          onClick={onLoginClick}
          title="登录 / 注册"
        >
          登录
        </button>
      </div>
    </header>
  );
}
