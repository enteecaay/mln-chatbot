"use client";

import { useRef, useState } from "react";
import { Camera, LockKeyhole, UserRound, X } from "lucide-react";

import {
  changePassword,
  getPasswordStrength,
  removeAvatar,
  updateProfile,
  uploadAvatar,
  validateName,
  validatePassword,
  type User,
} from "@/lib/auth";
import { LoadingSprite } from "@/components/LoadingSprite";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-white/65 bg-white/88 shadow-[0_30px_70px_rgba(180,92,128,0.22)] backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-rose-100 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">Hồ sơ cá nhân</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex border-b border-rose-100 bg-rose-50/60">
          {(["info", "password", "avatar"] as Tab[]).map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`flex-1 py-3 text-sm font-medium transition ${tab === item
                  ? "border-b-2 border-[#b65c80] text-[#b65c80]"
                  : "text-slate-500 hover:text-slate-800"
                }`}
            >
              <span className="inline-flex items-center gap-2">
                {item === "info" && <UserRound className="h-4 w-4" />}
                {item === "password" && <LockKeyhole className="h-4 w-4" />}
                {item === "avatar" && <Camera className="h-4 w-4" />}
                {{ info: "Thông tin", password: "Mật khẩu", avatar: "Ảnh đại diện" }[item]}
              </span>
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "info" && <InfoTab user={user} onUpdate={onUpdate} />}
          {tab === "password" && <PasswordTab user={user} onUpdate={onUpdate} />}
          {tab === "avatar" && <AvatarTab user={user} onUpdate={onUpdate} />}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onSignOut}
            className="w-full rounded-2xl border border-rose-200 bg-rose-50 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoTab({
  user,
  onUpdate,
}: {
  user: User;
  onUpdate: (u: User) => void;
}) {
  const [name, setName] = useState(user.name);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateName(name);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const updated = await updateProfile({ name: name.trim() });
      onUpdate(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Họ và tên</label>
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
          className="input"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
        <input value={user.email} readOnly className="input cursor-not-allowed bg-slate-50 text-slate-500" />
        <p className="mt-1 text-xs text-slate-500">Email được xác thực bằng OTP khi tạo tài khoản.</p>
      </div>

      {error && <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {success && <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Đã lưu thay đổi</p>}

      <button type="submit" disabled={loading} className="primary-button w-full">
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <LoadingSprite size="sm" />
            Đang lưu...
          </span>
        ) : (
          "Lưu thay đổi"
        )}
      </button>
    </form>
  );
}

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
  const [showPassword, setShowPassword] = useState(false);
  const strength = getPasswordStrength(form.next);

  const setField = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!form.current) nextErrors.current = "Vui lòng nhập mật khẩu hiện tại";

    const passwordError = validatePassword(form.next);
    if (passwordError) nextErrors.next = passwordError;
    else if (form.current === form.next) nextErrors.next = "Mật khẩu mới phải khác mật khẩu cũ";

    if (!form.confirm) nextErrors.confirm = "Vui lòng xác nhận mật khẩu mới";
    else if (form.confirm !== form.next) nextErrors.confirm = "Mật khẩu không khớp";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);

    try {
      await changePassword({
        email: user.email,
        currentPassword: form.current,
        nextPassword: form.next,
      });
      onUpdate({ ...user });
      setSuccess(true);
      setForm({ current: "", next: "", confirm: "" });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setErrors({ current: err instanceof Error ? err.message : "Không thể đổi mật khẩu" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Mật khẩu hiện tại</label>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} value={form.current} onChange={setField("current")} className="input pr-12" />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500"
          >
            {showPassword ? "Ẩn" : "Hiện"}
          </button>
        </div>
        {errors.current && <p className="mt-1 text-xs text-rose-600">{errors.current}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Mật khẩu mới</label>
        <input type={showPassword ? "text" : "password"} value={form.next} onChange={setField("next")} className="input" />
        {form.next && (
          <div className="mt-2">
            <div className="mb-1 flex gap-1">
              {[0, 1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-1 flex-1 rounded-full transition-all"
                  style={{ backgroundColor: item < strength.score ? strength.color : "#d4d4d8" }}
                />
              ))}
            </div>
            <p className="text-xs" style={{ color: strength.color }}>{strength.label}</p>
          </div>
        )}
        {errors.next && <p className="mt-1 text-xs text-rose-600">{errors.next}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Xác nhận mật khẩu mới</label>
        <input type={showPassword ? "text" : "password"} value={form.confirm} onChange={setField("confirm")} className="input" />
        {errors.confirm && <p className="mt-1 text-xs text-rose-600">{errors.confirm}</p>}
      </div>

      {success && <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Đã đổi mật khẩu thành công</p>}

      <button type="submit" disabled={loading} className="primary-button w-full">
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <LoadingSprite size="sm" />
            Đang lưu...
          </span>
        ) : (
          "Đổi mật khẩu"
        )}
      </button>
    </form>
  );
}

function AvatarTab({
  user,
  onUpdate,
}: {
  user: User;
  onUpdate: (u: User) => void;
}) {
  const [preview, setPreview] = useState<string | null>(user.avatar || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Ảnh phải nhỏ hơn 2MB");
      return;
    }

    setSelectedFile(file);
    setError("");
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setError("");

    try {
      const updated = await uploadAvatar(selectedFile);
      onUpdate(updated);
      setSelectedFile(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể cập nhật avatar");
    } finally {
      setLoading(false);
    }
  };

  const remove = async () => {
    setLoading(true);
    setError("");

    try {
      const updated = await removeAvatar();
      onUpdate(updated);
      setPreview(null);
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa avatar");
    } finally {
      setLoading(false);
    }
  };

  const initials = user.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="avatar" className="h-24 w-24 rounded-full object-cover ring-4 ring-rose-100" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-rose-100 bg-linear-to-br from-[#efb0c9] to-[#a1c9f1] text-3xl font-bold text-white">
            {initials}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Chọn ảnh từ máy tính
        </button>
        <p className="text-xs text-slate-500">PNG, JPG, GIF tối đa 2MB</p>
      </div>

      {error && <p className="rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {success && <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Đã cập nhật ảnh đại diện</p>}

      <div className="flex gap-3">
        {selectedFile && (
          <button onClick={() => void save()} disabled={loading} className="primary-button flex-1">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <LoadingSprite size="sm" />
                Đang lưu...
              </span>
            ) : (
              "Lưu ảnh"
            )}
          </button>
        )}
        {(user.avatar || preview) && (
          <button
            onClick={() => void remove()}
            disabled={loading}
            className="flex-1 rounded-2xl border border-rose-200 bg-rose-50 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
          >
            Xóa ảnh
          </button>
        )}
      </div>
    </div>
  );
}