"use client";

import { motion } from "framer-motion";

interface DriftingBottleProps {
  style: number;
  driftPath: number;
  onClick: () => void;
  index: number;
}

const DRIFT_DURATIONS = [4.5, 5.5, 5.0];
const SWAY_AMOUNTS = [8, 12, 6];

export default function DriftingBottle({
  onClick,
  driftPath,
  index,
}: DriftingBottleProps) {
  const duration = DRIFT_DURATIONS[driftPath % 3];
  const sway = SWAY_AMOUNTS[driftPath % 3];

  return (
    <motion.button
      className="relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-gold-primary/50 rounded-full"
      onClick={onClick}
      aria-label="打开漂流瓶"
      animate={{
        y: [0, -12, 0],
        rotate: [-sway / 2, sway / 2, -sway / 2],
      }}
      transition={{
        y: {
          duration,
          repeat: Infinity,
          ease: "easeInOut",
        },
        rotate: {
          duration: duration * 1.2,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      style={{
        width: "84px",
        height: "130px",
      }}
    >
      {/* Cork */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "18px",
          height: "14px",
          background:
            "linear-gradient(180deg, #5c3a1e 0%, #3e2210 100%)",
          borderRadius: "4px 4px 0 0",
          boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.4)",
          zIndex: 2,
        }}
        aria-hidden="true"
      />

      {/* Bottle mouth */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "14px",
          height: "10px",
          background: "linear-gradient(180deg, #d0d8e0 0%, #b0c0d0 100%)",
          borderRadius: "4px 4px 0 0",
          zIndex: 2,
        }}
        aria-hidden="true"
      />

      {/* Bottle neck */}
      <div
        style={{
          position: "absolute",
          top: "18px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "10px",
          height: "18px",
          background: "linear-gradient(180deg, #c0d0e0 0%, #a0b8d0 100%)",
          zIndex: 2,
        }}
        aria-hidden="true"
      />

      {/* Shoulder */}
      <div
        style={{
          position: "absolute",
          top: "34px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "50px",
          height: "16px",
          background: "linear-gradient(180deg, #a0b8d0 0%, #90a8c0 100%)",
          borderRadius: "14px 14px 0 0",
          zIndex: 2,
        }}
        aria-hidden="true"
      />

      {/* Round body */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "70px",
          height: "80px",
          background:
            "linear-gradient(135deg, rgba(232, 184, 109, 0.25), rgba(255, 224, 192, 0.15), rgba(232, 184, 109, 0.2))",
          borderRadius: "50% / 50%",
          border: "1px solid rgba(232, 184, 109, 0.35)",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
          zIndex: 1,
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        {/* Highlight reflection */}
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "10px",
            width: "12px",
            height: "28px",
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.25), transparent)",
            borderRadius: "50%",
            transform: "rotate(-20deg)",
          }}
          aria-hidden="true"
        />

        {/* Paper scroll */}
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "28px",
            height: "18px",
            background: "#f5e6d0",
            borderRadius: "2px",
            opacity: 0.7,
          }}
          aria-hidden="true"
        />
      </div>
    </motion.button>
  );
}
