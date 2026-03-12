import type { ProfileRow } from "@/types/database";
import { createAdminClient } from "@/utils/supabase/server";

export type AdminUserRecord = {
  avatar: string | null;
  banExpiresAt: string | null;
  banReason: string | null;
  createdAt: string;
  email: string;
  emailVerified: boolean;
  id: string;
  isBanned: boolean;
  messageCount: number;
  name: string;
  role: "user" | "admin";
};

export type DashboardStats = {
  accessSeries: Array<{ day: string; visits: number }>;
  topUsers: Array<{ email: string; name: string; questions: number }>;
  totalAccess: number;
  totalMessages: number;
  totalUsers: number;
};

export async function listAdminUsers(): Promise<AdminUserRecord[]> {
  const admin = createAdminClient();
  const [profilesResult, authUsersResult] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin.auth.admin.listUsers({ page: 1, perPage: 500 }),
  ]);

  const profiles = (profilesResult.data || []) as ProfileRow[];
  const authUsers = authUsersResult.data.users || [];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

  return authUsers.map((authUser) => {
    const profile = profileMap.get(authUser.id);

    return {
      avatar: profile?.avatar_url || null,
      banExpiresAt: profile?.ban_expires_at || null,
      banReason: profile?.ban_reason || null,
      createdAt: profile?.created_at || authUser.created_at,
      email: authUser.email || "",
      emailVerified: Boolean(authUser.email_confirmed_at),
      id: authUser.id,
      isBanned: profile?.is_banned || false,
      messageCount: profile?.message_count || 0,
      name:
        profile?.name ||
        (authUser.user_metadata?.name as string | undefined) ||
        authUser.email?.split("@")[0] ||
        "Người dùng",
      role: profile?.role || "user",
    };
  });
}

export async function getDashboardStats(users?: AdminUserRecord[]): Promise<DashboardStats> {
  const admin = createAdminClient();
  const [accessLogsResult, messagesResult] = await Promise.all([
    admin.from("access_logs").select("created_at"),
    admin.from("messages").select("id"),
  ]);

  const userRows = users || (await listAdminUsers());
  const accessLogs = (accessLogsResult.data || []) as Array<{ created_at: string }>;
  const messages = (messagesResult.data || []) as Array<{ id: string }>;

  const dailyMap = new Map<string, number>();
  for (const log of accessLogs) {
    const day = new Date(log.created_at).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
    dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
  }

  const accessSeries = Array.from(dailyMap.entries()).map(([day, visits]) => ({
    day,
    visits,
  }));

  const topUsers = [...userRows]
    .sort((left, right) => right.messageCount - left.messageCount)
    .slice(0, 5)
    .map((user) => ({
      email: user.email,
      name: user.name,
      questions: user.messageCount,
    }));

  return {
    accessSeries,
    topUsers,
    totalAccess: accessLogs.length,
    totalMessages: messages.length,
    totalUsers: userRows.length,
  };
}