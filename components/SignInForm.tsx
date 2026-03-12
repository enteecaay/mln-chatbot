"use client";

import { useState } from "react";
import { LoaderCircle, LogIn } from "lucide-react";

import { signIn, validateEmail, type User } from "@/lib/auth";

export function SignInForm({
  onSignedIn,
  onGoSignUp,
  onGoVerify,
  preEmail,
  successMessage,
}: {
  onSignedIn: (u: User) => void;
  onGoSignUp: () => void;
  onGoVerify: (email: string) => void;
  preEmail?: string;
  successMessage?: string;
}) {
  const [email, setEmail] = useState(preEmail ?? "");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await signIn(email, password);
      onSignedIn(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  const continueVerify = () => {
    const normalizedEmail = email.trim().toLowerCase();
    const emailError = validateEmail(normalizedEmail);
    if (emailError) {
      setError("Nhập email hợp lệ để tiếp tục xác minh OTP");
      return;
    }

    setError("");
    onGoVerify(normalizedEmail);
  };

  return (
    <div className="auth-card w-full max-w-md">
      {successMessage && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}
      <div className="mb-8">
        <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#b65c80]">
          MLN Chatbot
        </span>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Đăng nhập</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Đăng nhập để tiếp tục học tập, quản lý các cuộc trò chuyện và đồng bộ lịch sử trên mọi thiết bị.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="input"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Mật khẩu</label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-500 transition hover:text-slate-800"
            >
              {showPw ? "Ẩn" : "Hiện"}
            </button>
          </div>
        </div>

        {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <button type="submit" disabled={loading} className="primary-button w-full">
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Đang kiểm tra...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Đăng nhập
            </span>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Chưa có tài khoản?{" "}
        <button
          onClick={onGoSignUp}
          className="font-semibold text-[#b65c80] transition hover:text-[#924869]"
        >
          Đăng ký ngay
        </button>
      </p>

      <p className="mt-2 text-center text-sm text-slate-600">
        Đã đăng ký nhưng chưa xác minh?{" "}
        <button
          type="button"
          onClick={continueVerify}
          className="font-semibold text-[#5d7ed8] transition hover:text-[#3f66c6]"
        >
          Tiếp tục xác minh OTP
        </button>
      </p>
    </div>
  );
}
