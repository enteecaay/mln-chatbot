"use client";

import { useState } from "react";
import {
  validateEmail,
  validatePassword,
  validateName,
  getPasswordStrength,
  getUserByEmail,
  createUser,
  type User,
} from "@/lib/auth";

export function SignUpForm({
  onRegistered,
  onGoSignIn,
}: {
  onRegistered: (u: User) => void;
  onGoSignIn: () => void;
}) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    else if (getUserByEmail(form.email))
      errs.email = "Email này đã được đăng ký";

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
    if (!validate()) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));

    const user = createUser({
      name: form.name,
      email: form.email,
      password: form.password,
    });
    setLoading(false);
    onRegistered(user);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0b0f] py-8">
      <div className="w-full max-w-md px-4">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Tạo tài khoản</h1>
            <p className="text-zinc-400 text-sm mt-1">
              Tham gia để bắt đầu trò chuyện
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm text-zinc-300 mb-1.5">
                Họ và tên
              </label>
              <input
                value={form.name}
                onChange={set("name")}
                placeholder="Nguyễn Văn A"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
              />
              {errors.name && (
                <p className="text-red-400 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-zinc-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-zinc-300 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Ít nhất 8 ký tự, chữ hoa, số, ký tự đặc biệt"
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
                <p className="text-red-400 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm text-zinc-300 mb-1.5">
                Xác nhận mật khẩu
              </label>
              <input
                type={showPw ? "text" : "password"}
                value={form.confirm}
                onChange={set("confirm")}
                placeholder="Nhập lại mật khẩu"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
              />
              {errors.confirm && (
                <p className="text-red-400 text-xs mt-1">{errors.confirm}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium transition mt-2"
            >
              {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-sm mt-6">
            Đã có tài khoản?{" "}
            <button
              onClick={onGoSignIn}
              className="text-blue-400 hover:text-blue-300 font-medium"
            >
              Đăng nhập
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
