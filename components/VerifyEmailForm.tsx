"use client";

import { useState, useRef, useEffect } from "react";
import { updateUser, saveSession, type User } from "@/lib/auth";

export function VerifyEmailForm({
  user,
  onVerified,
  onResend,
}: {
  user: User;
  onVerified: (u: User) => void;
  onResend: () => void;
}) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleInput = (i: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...code];
    updated[i] = value.slice(-1);
    setCode(updated);
    setError("");
    if (value && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const updated = [...code];
    pasted.split("").forEach((char, i) => {
      updated[i] = char;
    });
    setCode(updated);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const submit = async () => {
    const entered = code.join("");
    if (entered.length < 6) {
      setError("Vui lòng nhập đủ 6 chữ số");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    if (entered !== user.verificationCode) {
      setError("Mã xác nhận không đúng. Kiểm tra console để xem mã thật.");
      setLoading(false);
      return;
    }

    const updated = updateUser(user.id, {
      emailVerified: true,
      verificationCode: undefined,
    });
    if (updated) {
      saveSession(updated);
      onVerified(updated);
    }
    setLoading(false);
  };

  const handleResend = () => {
    onResend();
    setResendCooldown(60);
    setCode(["", "", "", "", "", ""]);
    setError("");
    inputs.current[0]?.focus();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0b0f]">
      <div className="w-full max-w-md px-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📧</span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Xác nhận email</h1>
          <p className="text-zinc-400 text-sm mb-1">
            Mã xác nhận đã được gửi đến
          </p>
          <p className="text-blue-400 text-sm font-medium mb-2">{user.email}</p>
          <p className="text-zinc-500 text-xs mb-8">
            (Demo: mã xác nhận hiển thị trong console trình duyệt)
          </p>

          {/* OTP Inputs */}
          <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-11 h-12 text-center text-xl font-bold bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
              />
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          <button
            onClick={submit}
            disabled={loading || code.join("").length < 6}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium transition mb-4"
          >
            {loading ? "Đang xác nhận..." : "Xác nhận"}
          </button>

          <button
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="text-sm text-zinc-400 hover:text-zinc-200 disabled:text-zinc-600 transition"
          >
            {resendCooldown > 0
              ? `Gửi lại sau ${resendCooldown}s`
              : "Gửi lại mã xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}
