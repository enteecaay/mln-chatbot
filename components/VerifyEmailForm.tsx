"use client";

import { useEffect, useRef, useState } from "react";
import { MailCheck } from "lucide-react";

import {
  resendSignupOtp,
  verifySignupOtp,
  type PendingSignup,
  type User,
} from "@/lib/auth";
import { LoadingSprite } from "@/components/LoadingSprite";

export function VerifyEmailForm({
  pending,
  onVerified,
  onBack,
}: {
  pending: PendingSignup;
  onVerified: (u: User | null) => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(
      () => setResendCooldown((current) => current - 1),
      1000,
    );
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);
    setError("");
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent) => {
    if (event.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    const next = [...code];

    pasted.split("").forEach((digit, index) => {
      next[index] = digit;
    });

    setCode(next);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const submit = async () => {
    const otp = code.join("");
    if (otp.length < 6) {
      setError("Vui lòng nhập đủ 6 chữ số");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const verified = await verifySignupOtp(pending, otp);
      onVerified(verified);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OTP không hợp lệ");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    setResendMessage("");

    try {
      await resendSignupOtp(pending.email);
      setResendCooldown(60);
      setCode(["", "", "", "", "", ""]);
      setResendMessage("OTP mới đã được gửi tới email của bạn.");
      inputs.current[0]?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể gửi lại OTP");
    }
  };

  return (
    <div className="auth-card w-full max-w-md text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#fde7f1] text-[#b65c80]">
        <MailCheck className="h-8 w-8" />
      </div>

      <h1 className="text-3xl font-semibold text-slate-900">Xác nhận email</h1>
      <p className="mt-2 text-sm text-slate-600">
        Nhập mã OTP gồm 6 chữ số vừa được gửi đến
      </p>
      <p className="mt-1 text-sm font-semibold text-[#5d7ed8]">
        {pending.email}
      </p>

      <div className="my-8 flex justify-center gap-2" onPaste={handlePaste}>
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(event) => handleInput(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            className="h-14 w-12 rounded-2xl border border-slate-300 bg-white text-center text-xl font-bold text-slate-900 outline-none transition focus:border-[#5d7ed8]"
          />
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      )}
      {resendMessage && (
        <p className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {resendMessage}
        </p>
      )}

      <button
        onClick={() => void submit()}
        disabled={loading || code.join("").length < 6}
        className="primary-button mb-4 w-full"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <LoadingSprite size="sm" />
            Đang xác nhận...
          </span>
        ) : (
          "Xác nhận OTP"
        )}
      </button>

      <div className="flex items-center justify-center gap-4 text-sm">
        <button
          onClick={onBack}
          className="font-medium text-slate-500 transition hover:text-slate-900"
        >
          Quay lại
        </button>
        <button
          onClick={() => void handleResend()}
          disabled={resendCooldown > 0}
          className="font-medium text-[#b65c80] transition hover:text-[#924869] disabled:text-slate-400"
        >
          {resendCooldown > 0
            ? `Gửi lại sau ${resendCooldown}s`
            : "Gửi lại mã xác nhận"}
        </button>
      </div>
    </div>
  );
}
