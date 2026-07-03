"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface SeaBackgroundProps {
  children?: ReactNode;
}

const STAR_POSITIONS = [
  { top: "8%", left: "12%", delay: 0 },
  { top: "15%", left: "35%", delay: 0.6 },
  { top: "5%", left: "58%", delay: 1.2 },
  { top: "18%", left: "78%", delay: 1.8 },
  { top: "10%", left: "88%", delay: 2.4 },
  { top: "22%", left: "25%", delay: 0.9 },
];

export default function SeaBackground({ children }: SeaBackgroundProps) {
  return (
    <div className="relative min-h-screen bg-sea-deep overflow-hidden">
      {/* Stars */}
      {STAR_POSITIONS.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: "2px",
            height: "2px",
            top: star.top,
            left: star.left,
          }}
          animate={{ opacity: [0.25, 0.7, 0.25] }}
          transition={{
            duration: 3,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Moon */}
      <div className="absolute top-[18%] right-[10%]" aria-hidden="true">
        <div
          className="w-14 h-14 rounded-full animate-moonGlow"
          style={{
            background:
              "radial-gradient(circle at 40% 35%, #fffaee 0%, #ffe0c0 40%, #e8b86d 70%, transparent 100%)",
          }}
        />
      </div>

      {/* Moonbeams */}
      <div
        className="absolute opacity-[0.06]"
        style={{
          top: "20%",
          right: "14%",
          width: "120px",
          height: "2px",
          background:
            "linear-gradient(to left, #fffaee, transparent)",
          transform: "rotate(-25deg)",
          transformOrigin: "top right",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute opacity-[0.04]"
        style={{
          top: "22%",
          right: "14%",
          width: "100px",
          height: "2px",
          background:
            "linear-gradient(to left, #fffaee, transparent)",
          transform: "rotate(-35deg)",
          transformOrigin: "top right",
        }}
        aria-hidden="true"
      />

      {/* Ocean gradient overlay at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: "30vh",
          background:
            "linear-gradient(to bottom, transparent 0%, #060d1a 100%)",
        }}
        aria-hidden="true"
      />

      {/* Children */}
      <div className="relative z-10">{children}</div>

      {/* Bottom text */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none z-0">
        <p className="text-gold-soft/20 text-sm font-sans tracking-wider">
          🌊 把你的不开心送走
        </p>
      </div>
    </div>
  );
}
