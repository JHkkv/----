"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { BottleFeedItem, BottleDetail, BottlePayload } from "@/types";
import SeaBackground from "@/components/SeaBackground";
import TopBar from "@/components/TopBar";
import DriftingBottle from "@/components/DriftingBottle";
import BottleModal from "@/components/BottleModal";
import WritingPanel from "@/components/WritingPanel";
import ConfirmModal from "@/components/ConfirmModal";
import WelcomeModal from "@/components/WelcomeModal";

interface UserState {
  nickname: string;
  mbtiConfidence: number | null;
  mbtiType: string | null;
}

export default function Home() {
  const [mode, setMode] = useState<"view" | "write">("view");
  const [user, setUser] = useState<UserState>({
    nickname: "游客",
    mbtiConfidence: null,
    mbtiType: null,
  });
  const [feed, setFeed] = useState<BottleFeedItem[]>([]);
  const [selectedBottle, setSelectedBottle] = useState<BottleDetail | null>(
    null,
  );
  const [showConfirm, setShowConfirm] = useState<BottlePayload | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [isLoadingBottle, setIsLoadingBottle] = useState(false);

  // Initialize user on mount
  useEffect(() => {
    const initUser = async () => {
      try {
        const res = await fetch("/api/auth/guest", { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          const u = data.user;
          setUser({
            nickname: u.nickname,
            mbtiConfidence: u.mbtiConfidence ?? null,
            mbtiType: u.mbtiType ?? null,
          });

          // Show welcome modal if no mbtiType
          if (!u.mbtiType) {
            setShowWelcome(true);
          }
        }
      } catch {
        // Silently retry on next mount
      }
    };
    initUser();
  }, []);

  // Load feed
  const loadFeed = useCallback(async () => {
    try {
      const res = await fetch("/api/bottles/feed?limit=3");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.feed)) {
          setFeed(data.feed);
        }
      }
    } catch {
      // Feed unavailable
    }
  }, []);

  useEffect(() => {
    if (user.mbtiConfidence !== null || user.mbtiType !== null) {
      loadFeed();
    } else {
      // Wait a moment for user initialization then retry
      const t = setTimeout(loadFeed, 500);
      return () => clearTimeout(t);
    }
  }, [user.mbtiConfidence, user.mbtiType, loadFeed]);

  // Open bottle detail
  const handleOpenBottle = async (item: BottleFeedItem) => {
    setIsLoadingBottle(true);
    try {
      const res = await fetch(`/api/bottles/${item.id}`);
      if (res.ok) {
        const detail: BottleDetail = await res.json();
        setSelectedBottle(detail);
      }
    } catch {
      // Failed to load bottle
    } finally {
      setIsLoadingBottle(false);
    }
  };

  // Handle throw request from WritingPanel
  const handleThrowRequest = (payload: BottlePayload) => {
    setShowConfirm(payload);
  };

  // Confirm and send bottle
  const handleConfirmThrow = async () => {
    if (!showConfirm) return;
    try {
      const res = await fetch("/api/bottles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(showConfirm),
      });
      if (res.ok) {
        setShowConfirm(null);
        setMode("view");
        loadFeed();
      }
    } catch {
      // Failed to throw bottle
    }
  };

  // Welcome modal handlers
  const handleStartMbti = () => {
    setShowWelcome(false);
    // TODO: navigate to MBTI flow
  };

  const handleDirectMbti = () => {
    setShowWelcome(false);
    // TODO: navigate to direct MBTI input
  };

  const handleSkipWelcome = () => {
    setShowWelcome(false);
  };

  return (
    <SeaBackground>
      {/* Top bar */}
      <TopBar
        mode={mode}
        onModeChange={setMode}
        nickname={user.nickname}
        mbtiConfidence={user.mbtiConfidence}
      />

      {/* Main content area */}
      <AnimatePresence mode="wait">
        {mode === "view" ? (
          <motion.main
            key="view"
            className="flex justify-center items-end gap-12 px-4"
            style={{ marginTop: "8vh", height: "55vh" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* Loading state */}
            {isLoadingBottle && (
              <div className="absolute inset-0 flex items-center justify-center z-30">
                <p className="text-gold-soft/50 text-sm animate-pulse">
                  正在捞起漂流瓶...
                </p>
              </div>
            )}

            {/* Bottles */}
            {feed.length > 0 ? (
              feed.slice(0, 3).map((item, i) => (
                <DriftingBottle
                  key={item.id}
                  style={item.bottleStyle}
                  driftPath={i % 3}
                  index={i}
                  onClick={() => handleOpenBottle(item)}
                />
              ))
            ) : (
              <div className="flex flex-col items-center gap-3 text-white/25 mt-16">
                <p className="text-4xl" aria-hidden="true">
                  🫧
                </p>
                <p className="text-sm">海面上还没有漂流瓶...</p>
                <p className="text-xs">去写一个吧</p>
              </div>
            )}
          </motion.main>
        ) : (
          <motion.main
            key="write"
            className="flex justify-center"
            style={{ marginTop: "6vh" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <WritingPanel onThrow={handleThrowRequest} />
          </motion.main>
        )}
      </AnimatePresence>

      {/* Bottle detail modal */}
      <AnimatePresence>
        {selectedBottle && (
          <BottleModal
            bottle={selectedBottle}
            onClose={() => setSelectedBottle(null)}
          />
        )}
      </AnimatePresence>

      {/* Confirm throw modal */}
      <AnimatePresence>
        {showConfirm && (
          <ConfirmModal
            payload={showConfirm}
            onConfirm={handleConfirmThrow}
            onCancel={() => setShowConfirm(null)}
          />
        )}
      </AnimatePresence>

      {/* Welcome modal */}
      <AnimatePresence>
        {showWelcome && (
          <WelcomeModal
            onClose={handleSkipWelcome}
            onStartMbti={handleStartMbti}
            onSkip={handleSkipWelcome}
            onDirectMbti={handleDirectMbti}
          />
        )}
      </AnimatePresence>
    </SeaBackground>
  );
}
