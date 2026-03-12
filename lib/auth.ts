import type { User as SupabaseUser } from "@supabase/supabase-js";

import type { ProfileRow } from "@/types/database";
import { createClient } from "@/utils/supabase/client";

export type UserRole = "user" | "admin";

export type User = {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  emailVerified: boolean;
  role: UserRole;
  isBanned: boolean;
  banExpiresAt?: string | null;
  banReason?: string | null;
  createdAt: string;
  messageCount: number;
};

export type PendingSignup = {
  email: string;
  name: string;
  password: string;
};

export function validateEmail(email: string): string | null {
  if (!email) return "Email không được để trống";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return "Email không hợp lệ";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Mật khẩu không được để trống";
  if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự";
  if (!/[A-Z]/.test(password)) return "Phải có ít nhất 1 chữ hoa";
  if (!/[0-9]/.test(password)) return "Phải có ít nhất 1 chữ số";
  if (!/[^A-Za-z0-9]/.test(password)) return "Phải có ít nhất 1 ký tự đặc biệt";
  return null;
}

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  score = Math.min(score, 4);

  const labels = ["Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"];
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];
  return { score, label: labels[score], color: colors[score] };
}

export function validateName(name: string): string | null {
  if (!name.trim()) return "Tên không được để trống";
  if (name.trim().length < 2) return "Tên phải có ít nhất 2 ký tự";
  return null;
}

export function createChatTitle(question: string): string {
  return (
    question.trim().replace(/\s+/g, " ").split(" ").slice(0, 6).join(" ") ||
    "Cuộc trò chuyện mới"
  );
}

export function isBanActive(user: Pick<User, "isBanned" | "banExpiresAt">): boolean {
  if (!user.isBanned) return false;
  if (!user.banExpiresAt) return true;
  return new Date(user.banExpiresAt).getTime() > Date.now();
}

export function formatBanMessage(user: Pick<User, "banExpiresAt" | "banReason">): string {
  if (!user.banExpiresAt) {
    return user.banReason
      ? `Tài khoản của bạn đã bị cấm chat vĩnh viễn. Lý do: ${user.banReason}`
      : "Tài khoản của bạn đã bị cấm chat vĩnh viễn.";
  }

  const until = new Date(user.banExpiresAt).toLocaleString("vi-VN");
  return user.banReason
    ? `Tài khoản của bạn đang bị cấm chat đến ${until}. Lý do: ${user.banReason}`
    : `Tài khoản của bạn đang bị cấm chat đến ${until}.`;
}

function toAppUser(authUser: SupabaseUser, profile: ProfileRow): User {
  return {
    id: authUser.id,
    email: authUser.email || "",
    name: profile.name,
    avatar: profile.avatar_url,
    emailVerified: Boolean(authUser.email_confirmed_at),
    role: profile.role,
    isBanned: profile.is_banned,
    banExpiresAt: profile.ban_expires_at,
    banReason: profile.ban_reason,
    createdAt: profile.created_at,
    messageCount: profile.message_count,
  };
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();
  let profile = data as ProfileRow | null;

  if (!profile) {
    // Recover from accidental profile deletion while auth.users still exists.
    await fetch("/api/auth/ensure-profile", { method: "POST" });

    const { data: repairedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    profile = repairedProfile as ProfileRow | null;
  }

  if (!profile) return null;
  return toAppUser(authUser, profile);
}

export async function signIn(email: string, password: string): Promise<User> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(
      error.message === "Invalid login credentials"
        ? "Email hoặc mật khẩu không đúng"
        : error.message,
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Không thể tải hồ sơ người dùng");
  }

  if (isBanActive(user)) {
    await supabase.auth.signOut();
    throw new Error(formatBanMessage(user));
  }

  return user;
}

export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function startSignup(payload: PendingSignup): Promise<void> {
  const response = await fetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(body.error || "Không thể tạo tài khoản");
  }
}

export async function resendSignupOtp(email: string): Promise<void> {
  const response = await fetch("/api/auth/resend-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const body = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(body.error || "Không thể gửi lại OTP");
  }
}

export async function verifySignupOtp(
  pending: PendingSignup,
  otp: string,
): Promise<User | null> {
  const response = await fetch("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: pending.email, otp }),
  });

  const body = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) {
    throw new Error(body.error || "OTP không hợp lệ");
  }

  // No password when session was restored from storage — caller handles sign-in
  if (!pending.password) return null;

  return signIn(pending.email, pending.password);
}

export async function updateProfile(data: { name: string }): Promise<User> {
  const response = await fetch("/api/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const body = (await response.json()) as { error?: string; user?: User };
  if (!response.ok || !body.user) {
    throw new Error(body.error || "Không thể cập nhật hồ sơ");
  }

  return body.user;
}

export async function uploadAvatar(file: File): Promise<User> {
  const formData = new FormData();
  formData.set("file", file);

  const response = await fetch("/api/avatar", {
    method: "POST",
    body: formData,
  });

  const body = (await response.json()) as { error?: string; user?: User };
  if (!response.ok || !body.user) {
    throw new Error(body.error || "Không thể cập nhật ảnh đại diện");
  }

  return body.user;
}

export async function removeAvatar(): Promise<User> {
  const response = await fetch("/api/avatar", {
    method: "DELETE",
  });

  const body = (await response.json()) as { error?: string; user?: User };
  if (!response.ok || !body.user) {
    throw new Error(body.error || "Không thể xóa ảnh đại diện");
  }

  return body.user;
}

export async function changePassword(params: {
  email: string;
  currentPassword: string;
  nextPassword: string;
}): Promise<void> {
  const supabase = createClient();
  const reauth = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.currentPassword,
  });

  if (reauth.error) {
    throw new Error("Mật khẩu hiện tại không đúng");
  }

  const { error } = await supabase.auth.updateUser({
    password: params.nextPassword,
  });

  if (error) {
    throw new Error(error.message || "Không thể đổi mật khẩu");
  }
}