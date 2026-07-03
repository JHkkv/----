"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface LoginModalProps {
  onClose: () => void;
  onLoginSuccess: (nickname: string) => void;
}

export default function LoginModal({ onClose, onLoginSuccess }: LoginModalProps) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) {
      setError("请填写邮箱和密码");
      return;
    }

    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/api/auth/login" : "/api/auth/bind";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.user?.nickname || email);
      } else {
        const data = await res.json();
        setError(data.error || "操作失败");
      }
    } catch {
      setError("网络错误，请重试");
    } finally {
      setLoading(false);
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
        className="modal-card w-[90vw] max-w-sm"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tab switcher */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-5">
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "login"
                ? "bg-gold-soft/15 text-gold-soft"
                : "text-white/30"
            }`}
            onClick={() => { setTab("login"); setError(""); }}
          >
            登录
          </button>
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === "register"
                ? "bg-gold-soft/15 text-gold-soft"
                : "text-white/30"
            }`}
            onClick={() => { setTab("register"); setError(""); }}
          >
            注册
          </button>
        </div>

        <h2 className="text-center text-gold-primary font-display text-lg mb-4">
          {tab === "login" ? "🌊 欢迎回来" : "✨ 绑定账号"}
        </h2>

        <p className="text-white/30 text-xs text-center mb-5">
          {tab === "login"
            ? "登录后可以查看你的漂流瓶记录"
            : "绑定邮箱后可以保留你的历史记录"}
        </p>

        {/* Form */}
        <div className="flex flex-col gap-3">
          <input
            type="email"
            className="glass-input text-sm"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="glass-input text-sm"
            placeholder="密码（至少6位）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />

          {error && (
            <p className="text-red-400/70 text-xs text-center">{error}</p>
          )}

          <button
            className="btn-primary w-full py-2.5 text-sm mt-1"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "处理中..." : tab === "login" ? "登录" : "注册"}
          </button>

          <button
            className="text-white/20 text-xs hover:text-white/40 transition-colors py-1"
            onClick={onClose}
          >
            先跳过
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
