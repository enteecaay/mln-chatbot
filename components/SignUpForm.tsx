"use client";

import { useState } from "react";
import { ArrowLeft, UserPlus } from "lucide-react";

import {
  getPasswordStrength,
  startSignup,
  validateEmail,
  validateName,
  validatePassword,
  type PendingSignup,
} from "@/lib/auth";
import { LoadingSprite } from "@/components/LoadingSprite";

export function SignUpForm({
  onRegistered,
  onGoSignIn,
}: {
  onRegistered: (pending: PendingSignup) => void;
  onGoSignIn: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const strength = getPasswordStrength(form.password);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    const nameErr = validateName(form.name);
    if (nameErr) errs.name = nameErr;

    const emailErr = validateEmail(form.email);
    if (emailErr) errs.email = emailErr;
    const pwErr = validatePassword(form.password);
    if (pwErr) errs.password = pwErr;

    if (!form.confirm) errs.confirm = "Vui lòng xác nhận mật khẩu";
    else if (form.confirm !== form.password)
      errs.confirm = "Mật khẩu không khớp";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validate()) return;

    setLoading(true);

    try {
      const pending = {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      };
      await startSignup(pending);
      onRegistered(pending);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Không thể tạo tài khoản");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card w-full max-w-md">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#5d7ed8]">
            Verify Email OTP
          </span>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">Tạo tài khoản</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">Tạo tài khoản bằng email thật. Hệ thống sẽ gửi OTP đến Gmail để xác minh.</p>
        </div>
        <button
          type="button"
          onClick={onGoSignIn}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/70 text-slate-600 transition hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Họ và tên
          </label>
          <input
            value={form.name}
            onChange={set("name")}
            placeholder="Nguyễn Văn A"
            className="input"
          />
          {errors.name && (
            <p className="mt-1 text-xs text-rose-600">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="you@example.com"
            className="input"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-rose-600">{errors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Mật khẩu
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={set("password")}
              placeholder="Ít nhất 8 ký tự, chữ hoa, số, ký tự đặc biệt"
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

          {/* Password strength bar */}
          {form.password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex-1 h-1 rounded-full transition-all duration-300"
                    style={{
                      backgroundColor:
                        i < strength.score ? strength.color : "#3f3f46",
                    }}
                  />
                ))}
              </div>
              <p className="text-xs" style={{ color: strength.color }}>
                {strength.label}
              </p>
            </div>
          )}
          {errors.password && (
            <p className="mt-1 text-xs text-rose-600">{errors.password}</p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Xác nhận mật khẩu
          </label>
          <input
            type={showPw ? "text" : "password"}
            value={form.confirm}
            onChange={set("confirm")}
            placeholder="Nhập lại mật khẩu"
            className="input"
          />
          {errors.confirm && (
            <p className="mt-1 text-xs text-rose-600">{errors.confirm}</p>
          )}
        </div>

        {submitError && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="primary-button mt-2 w-full"
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <LoadingSprite size="sm" />
              Đang tạo tài khoản...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Đăng ký và nhận OTP
            </span>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Đã có tài khoản?{" "}
        <button onClick={onGoSignIn} className="font-semibold text-[#5d7ed8] hover:text-[#4766bd]">
          Đăng nhập
        </button>
      </p>
    </div>
  );
}
