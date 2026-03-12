"use client";

import { useState, useRef } from "react";
import {
  updateUser,
  validateName,
  validateEmail,
  validatePassword,
  getPasswordStrength,
  verifyPassword,
  hashPassword,
  getUserByEmail,
  type User,
} from "@/lib/auth";

type Tab = "info" | "password" | "avatar";

export function ProfileModal({
  user,
  onUpdate,
  onClose,
  onSignOut,
}: {
  user: User;
  onUpdate: (u: User) => void;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const [tab, setTab] = useState<Tab>("info");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Hồ sơ cá nhân</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-800">
          {(["info", "password", "avatar"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium transition ${
                tab === t
                  ? "text-blue-400 border-b-2 border-blue-500"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {
                {
                  info: "Thông tin",
                  password: "Mật khẩu",
                  avatar: "Ảnh đại diện",
                }[t]
              }
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "info" && <InfoTab user={user} onUpdate={onUpdate} />}
          {tab === "password" && (
            <PasswordTab user={user} onUpdate={onUpdate} />
          )}
          {tab === "avatar" && <AvatarTab user={user} onUpdate={onUpdate} />}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onSignOut}
            className="w-full border border-red-800 text-red-400 hover:bg-red-950/30 py-2 rounded-lg text-sm transition"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Thông tin ──────────────────────────────────────────────────────────
function InfoTab({
  user,
  onUpdate,
}: {
  user: User;
  onUpdate: (u: User) => void;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    const nameErr = validateName(name);
    if (nameErr) errs.name = nameErr;

    const emailErr = validateEmail(email);
    if (emailErr) errs.email = emailErr;
    else if (
      email.toLowerCase() !== user.email.toLowerCase() &&
      getUserByEmail(email)
    ) {
      errs.email = "Email này đã được sử dụng";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const emailChanged = email.toLowerCase() !== user.email.toLowerCase();
    const updated = updateUser(user.id, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      ...(emailChanged ? { emailVerified: false } : {}),
    });

    if (updated) onUpdate(updated);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm text-zinc-300 mb-1.5">Họ và tên</label>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors((p) => ({ ...p, name: "" }));
          }}
          className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
        />
        {errors.name && (
          <p className="text-red-400 text-xs mt-1">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm text-zinc-300 mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((p) => ({ ...p, email: "" }));
          }}
          className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
        />
        {errors.email && (
          <p className="text-red-400 text-xs mt-1">{errors.email}</p>
        )}
        {email.toLowerCase() !== user.email.toLowerCase() && (
          <p className="text-yellow-500 text-xs mt-1">
            ⚠ Đổi email sẽ yêu cầu xác nhận lại
          </p>
        )}
      </div>

      {success && (
        <p className="text-green-400 text-sm bg-green-950/30 border border-green-900/50 rounded-lg px-3 py-2">
          ✓ Đã lưu thay đổi
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium transition"
      >
        {loading ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </form>
  );
}

// ─── Tab: Đổi mật khẩu ──────────────────────────────────────────────────────
function PasswordTab({
  user,
  onUpdate,
}: {
  user: User;
  onUpdate: (u: User) => void;
}) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const strength = getPasswordStrength(form.next);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!form.current) errs.current = "Vui lòng nhập mật khẩu hiện tại";
    else if (!verifyPassword(form.current, user.passwordHash))
      errs.current = "Mật khẩu hiện tại không đúng";

    const pwErr = validatePassword(form.next);
    if (pwErr) errs.next = pwErr;
    else if (form.next === form.current)
      errs.next = "Mật khẩu mới phải khác mật khẩu cũ";

    if (!form.confirm) errs.confirm = "Vui lòng xác nhận mật khẩu mới";
    else if (form.confirm !== form.next) errs.confirm = "Mật khẩu không khớp";

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    const updated = updateUser(user.id, {
      passwordHash: hashPassword(form.next),
    });
    if (updated) onUpdate(updated);
    setSuccess(true);
    setForm({ current: "", next: "", confirm: "" });
    setTimeout(() => setSuccess(false), 3000);
    setLoading(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm text-zinc-300 mb-1.5">
          Mật khẩu hiện tại
        </label>
        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={form.current}
            onChange={set("current")}
            className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs"
          >
            {showPw ? "Ẩn" : "Hiện"}
          </button>
        </div>
        {errors.current && (
          <p className="text-red-400 text-xs mt-1">{errors.current}</p>
        )}
      </div>

      <div>
        <label className="block text-sm text-zinc-300 mb-1.5">
          Mật khẩu mới
        </label>
        <input
          type={showPw ? "text" : "password"}
          value={form.next}
          onChange={set("next")}
          className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
        />
        {form.next && (
          <div className="mt-2">
            <div className="flex gap-1 mb-1">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex-1 h-1 rounded-full transition-all"
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
        {errors.next && (
          <p className="text-red-400 text-xs mt-1">{errors.next}</p>
        )}
      </div>

      <div>
        <label className="block text-sm text-zinc-300 mb-1.5">
          Xác nhận mật khẩu mới
        </label>
        <input
          type={showPw ? "text" : "password"}
          value={form.confirm}
          onChange={set("confirm")}
          className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition"
        />
        {errors.confirm && (
          <p className="text-red-400 text-xs mt-1">{errors.confirm}</p>
        )}
      </div>

      {success && (
        <p className="text-green-400 text-sm bg-green-950/30 border border-green-900/50 rounded-lg px-3 py-2">
          ✓ Đã đổi mật khẩu thành công
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium transition"
      >
        {loading ? "Đang lưu..." : "Đổi mật khẩu"}
      </button>
    </form>
  );
}

// ─── Tab: Avatar ─────────────────────────────────────────────────────────────
function AvatarTab({
  user,
  onUpdate,
}: {
  user: User;
  onUpdate: (u: User) => void;
}) {
  const [preview, setPreview] = useState<string | null>(user.avatar || null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ảnh phải nhỏ hơn 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!preview) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    const updated = updateUser(user.id, { avatar: preview });
    if (updated) onUpdate(updated);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setLoading(false);
  };

  const remove = async () => {
    setLoading(true);
    const updated = updateUser(user.id, { avatar: undefined });
    if (updated) onUpdate(updated);
    setPreview(null);
    setLoading(false);
  };

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 text-center">
      {/* Avatar preview */}
      <div className="flex justify-center">
        {preview ? (
          <img
            src={preview}
            alt="avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-zinc-700"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-zinc-700">
            {initials}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white py-2.5 rounded-lg text-sm transition"
        >
          Chọn ảnh từ máy tính
        </button>
        <p className="text-zinc-500 text-xs">PNG, JPG, GIF tối đa 2MB</p>
      </div>

      {success && (
        <p className="text-green-400 text-sm bg-green-950/30 border border-green-900/50 rounded-lg px-3 py-2">
          ✓ Đã cập nhật ảnh đại diện
        </p>
      )}

      <div className="flex gap-3">
        {preview && preview !== user.avatar && (
          <button
            onClick={save}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium transition"
          >
            {loading ? "Đang lưu..." : "Lưu ảnh"}
          </button>
        )}
        {(user.avatar || preview) && (
          <button
            onClick={remove}
            disabled={loading}
            className="flex-1 border border-red-800 text-red-400 hover:bg-red-950/30 py-2.5 rounded-lg text-sm transition"
          >
            Xóa ảnh
          </button>
        )}
      </div>
    </div>
  );
}
