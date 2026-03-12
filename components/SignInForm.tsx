"use client";

import { useState } from "react";
import {
  getUserByEmail,
  verifyPassword,
  saveSession,
  type User,
} from "@/lib/auth";

export function SignInForm({
  onSignedIn,
  onGoSignUp,
}: {
  onSignedIn: (u: User) => void;
  onGoSignUp: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 400)); // UX delay

    const user = getUserByEmail(email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      setError("Email hoặc mật khẩu không đúng");
      setLoading(false);
      return;
    }

    saveSession(user);
    onSignedIn(user);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0b0f]">
      <div className="w-full max-w-md px-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Đăng nhập</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm text-zinc-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm text-zinc-300 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs"
                >
                  {showPw ? "Ẩn" : "Hiện"}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium transition mt-2"
            >
              {loading ? "Đang kiểm tra..." : "Đăng nhập"}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-sm mt-6">
            Chưa có tài khoản?{" "}
            <button
              onClick={onGoSignUp}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Đăng ký ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
