"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { MbtiType } from "@/types";

interface MbtiTypeGridProps {
  onSelect: (type: MbtiType) => void;
}

const ALL_TYPES: MbtiType[] = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const TYPE_DESCRIPTIONS: Record<MbtiType, string> = {
  INTJ: "建筑师 — 独立、战略、果断",
  INTP: "逻辑学家 — 创新、好奇、分析",
  ENTJ: "指挥官 — 大胆、领导力、强目标",
  ENTP: "辩论家 — 机智、善辩、探索",
  INFJ: "提倡者 — 理想主义、洞察、利他",
  INFP: "调停者 — 诗意、善良、追求意义",
  ENFJ: "主人公 — 魅力、关怀、激励他人",
  ENFP: "竞选者 — 热情、创意、自由精神",
  ISTJ: "物流师 — 务实、可靠、守序",
  ISFJ: "守卫者 — 奉献、温暖、保护者",
  ESTJ: "总经理 — 高效、管理、执行",
  ESFJ: "执政官 — 热心、社交、服务",
  ISTP: "鉴赏家 — 大胆、实践、灵活",
  ISFP: "探险家 — 艺术、敏锐、随性",
  ESTP: "企业家 — 活力、机敏、行动派",
  ESFP: "表演者 — 自发、热情、享受生活",
};

// Group types into rows by their first two letters for intuitive navigation
const ROWS: MbtiType[][] = [
  ["INTJ", "INTP", "ENTJ", "ENTP"],
  ["INFJ", "INFP", "ENFJ", "ENFP"],
  ["ISTJ", "ISFJ", "ESTJ", "ESFJ"],
  ["ISTP", "ISFP", "ESTP", "ESFP"],
];

export default function MbtiTypeGrid({ onSelect }: MbtiTypeGridProps) {
  const [selectedType, setSelectedType] = useState<MbtiType | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const handleSelect = (type: MbtiType) => {
    setSelectedType(type);
  };

  const handleConfirm = () => {
    if (!selectedType || isConfirming) return;
    setIsConfirming(true);
    onSelect(selectedType);
  };

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Title */}
      <div className="text-center mb-6">
        <h2 className="font-display text-gold-primary text-xl mb-1">
          选择你的 MBTI 类型
        </h2>
        <p className="text-white/40 text-xs">
          点击一个类型，然后确认
        </p>
      </div>

      {/* 4x4 Grid */}
      <div className="flex flex-col gap-2 mb-5">
        {ROWS.map((row, rowIndex) => (
          <div key={rowIndex} className="flex gap-2">
            {row.map((type) => {
              const isSelected = selectedType === type;
              return (
                <motion.button
                  key={type}
                  className={`
                    flex-1 py-3 rounded-lg border text-sm font-medium
                    transition-all duration-200
                    ${
                      isSelected
                        ? "border-gold-primary bg-gold-primary/15 text-gold-primary shadow-md shadow-gold-primary/10"
                        : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/25 hover:text-white/70"
                    }
                  `}
                  onClick={() => handleSelect(type)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {type}
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Description of selected type */}
      {selectedType && (
        <motion.div
          className="bg-white/[0.03] rounded-lg p-4 mb-5 border border-gold-primary/20"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.25 }}
        >
          <p className="text-gold-soft text-sm font-medium mb-1">
            {selectedType}
          </p>
          <p className="text-white/50 text-xs">
            {TYPE_DESCRIPTIONS[selectedType]}
          </p>
        </motion.div>
      )}

      {/* Confirm button */}
      <button
        className={`
          w-full py-3 rounded-lg text-sm font-medium
          transition-all duration-200
          ${
            selectedType
              ? "btn-primary"
              : "border border-white/10 text-white/25 bg-white/[0.02] cursor-not-allowed"
          }
        `}
        onClick={handleConfirm}
        disabled={!selectedType || isConfirming}
      >
        {isConfirming ? "确认中..." : "确认选择"}
      </button>
    </motion.div>
  );
}
