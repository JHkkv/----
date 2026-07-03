"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import SeaBackground from "@/components/SeaBackground";

interface BottleComment {
  id: string;
  content: string;
  createdAt: string;
  commenter: { nickname: string };
}

interface MyBottle {
  id: string;
  content: string;
  visibility: "public" | "private";
  allowComments: boolean;
  openCount: number;
  thrownAt: string;
  comments: BottleComment[];
}

const VISIBILITY_LABELS: Record<string, { text: string; className: string }> = {
  public: { text: "公开", className: "bg-gold-primary/20 text-gold-soft" },
  private: { text: "私密", className: "bg-white/10 text-white/50" },
};

export default function MyBottlesPage() {
  const [bottles, setBottles] = useState<MyBottle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBottles = async () => {
      try {
        const res = await fetch("/api/my/bottles");
        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "加载失败");
          return;
        }
        const data = await res.json();
        setBottles(data.bottles ?? []);
      } catch {
        setError("网络错误，请重试");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBottles();
  }, []);

  return (
    <SeaBackground>
      <div className="flex flex-col min-h-screen px-4 pt-10 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 w-full max-w-2xl mx-auto">
          <Link
            href="/"
            className="text-gold-soft/60 hover:text-gold-soft text-sm transition-colors"
          >
            &larr; 回到首页
          </Link>
          <h1 className="font-display text-gold-primary text-lg">我的漂流瓶</h1>
          <div className="w-16" />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center flex-1">
            <p className="text-gold-soft/50 text-sm animate-pulse">
              正在打捞你的瓶子...
            </p>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3">
            <p className="text-white/50 text-sm">{error}</p>
            <button
              className="text-gold-soft/60 hover:text-gold-soft text-xs underline transition-colors"
              onClick={() => window.location.reload()}
            >
              刷新
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && bottles.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4">
            <p className="text-5xl" aria-hidden="true">
              🫧
            </p>
            <p className="text-white/40 text-sm">你还没有投出过漂流瓶</p>
            <Link
              href="/"
              className="btn-primary px-6 py-2 text-sm"
            >
              去写一个吧
            </Link>
          </div>
        )}

        {/* Bottle list */}
        {!isLoading && !error && bottles.length > 0 && (
          <div className="w-full max-w-2xl mx-auto space-y-4">
            {bottles.map((bottle, index) => (
              <motion.div
                key={bottle.id}
                className="modal-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.08 }}
              >
                <div className="p-5">
                  {/* Top row: visibility badge + time */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${VISIBILITY_LABELS[bottle.visibility]?.className ?? "bg-white/10 text-white/40"}`}
                    >
                      {VISIBILITY_LABELS[bottle.visibility]?.text ?? bottle.visibility}
                    </span>
                    <div className="flex items-center gap-3 text-white/30 text-xs">
                      <span>
                        被打开 {bottle.openCount} 次
                      </span>
                      <span>
                        {formatRelativeTime(bottle.thrownAt)}
                      </span>
                    </div>
                  </div>

                  {/* Content preview */}
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-wrap break-words mb-4">
                    {bottle.content.length > 200
                      ? `${bottle.content.slice(0, 200)}...`
                      : bottle.content}
                  </p>

                  {/* Comments */}
                  {bottle.allowComments && bottle.comments.length > 0 && (
                    <div className="border-t border-white/10 pt-3 mt-2">
                      <p className="text-white/30 text-xs mb-2">
                        收到 {bottle.comments.length} 条评论
                      </p>
                      <div className="space-y-2">
                        {bottle.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="bg-white/[0.03] rounded-lg p-3"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-gold-soft/70 text-xs font-medium">
                                {comment.commenter.nickname}
                              </span>
                              <span className="text-white/20 text-xs">
                                {formatRelativeTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-white/50 text-xs leading-relaxed">
                              {comment.content}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {bottle.allowComments && bottle.comments.length === 0 && (
                    <div className="border-t border-white/10 pt-3 mt-2">
                      <p className="text-white/20 text-xs">暂无评论</p>
                    </div>
                  )}

                  {!bottle.allowComments && (
                    <div className="border-t border-white/10 pt-3 mt-2">
                      <p className="text-white/20 text-xs">评论已关闭</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </SeaBackground>
  );
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "刚刚";
  if (diffMinutes < 60) return `${diffMinutes} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays < 7) return `${diffDays} 天前`;

  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
}
