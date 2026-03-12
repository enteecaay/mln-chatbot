import { redirect } from "next/navigation";

import type { User } from "@/lib/auth";
import { ensureSeedAdminSafely } from "@/lib/seed-admin";
import { createAdminClient, createClient } from "@/utils/supabase/server";

function getFallbackName(email?: string | null): string {
  if (!email) return "Nguoi dung moi";
  const prefix = email.split("@")[0]?.trim();
  return prefix || "Nguoi dung moi";
}

function toUser(profile: {
  avatar_url: string | null;
  ban_expires_at: string | null;
  ban_reason: string | null;
  created_at: string;
  is_banned: boolean;
  message_count: number;
  name: string;
  role: "user" | "admin";
}, authUser: { email?: string | null; email_confirmed_at?: string | null; id: string }): User {
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

export async function getCurrentUserServer(): Promise<User | null> {
  await ensureSeedAdminSafely();

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!profile) {
    const admin = createAdminClient();
    const nameFromMetadata =
      typeof authUser.user_metadata?.name === "string"
        ? authUser.user_metadata.name.trim()
        : "";

    await admin.from("profiles").insert({
      id: authUser.id,
      name: nameFromMetadata || getFallbackName(authUser.email),
    });

    const { data: repairedProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (!repairedProfile) return null;
    return toUser(repairedProfile, authUser);
  }

  return toUser(profile, authUser);
}

export async function requireUser(redirectTo = "/"): Promise<User> {
  const user = await getCurrentUserServer();
  if (!user) redirect(redirectTo);
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/chat");
  }

  return user;
}