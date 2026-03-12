import { NextResponse } from "next/server";

import { listAdminUsers } from "@/lib/admin";
import { sendBanEmail } from "@/lib/email";
import { getCurrentUserServer } from "@/lib/server-auth";
import { createAdminClient } from "@/utils/supabase/server";

type Duration = "1h" | "6h" | "12h" | "24h" | "permanent" | "clear";

function getBanConfig(duration: Duration): { expiresAt: string | null; label: string } {
  const now = Date.now();
  if (duration === "clear") return { expiresAt: null, label: "Đã gỡ cấm" };
  if (duration === "permanent") return { expiresAt: null, label: "vĩnh viễn" };

  const hours = Number.parseInt(duration.replace("h", ""), 10);
  return {
    expiresAt: new Date(now + hours * 60 * 60 * 1000).toISOString(),
    label: `${hours} giờ`,
  };
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserServer();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Bạn không có quyền thực hiện thao tác này" }, { status: 403 });
    }

    const { userId, duration, reason } = (await request.json()) as {
      userId?: string;
      duration?: Duration;
      reason?: string;
    };

    if (!userId || !duration) {
      return NextResponse.json({ error: "Thiếu thông tin cấm chat" }, { status: 400 });
    }

    const admin = createAdminClient();
    const config = getBanConfig(duration);

    const { error } = await admin
      .from("profiles")
      .update(
        duration === "clear"
          ? {
            is_banned: false,
            ban_expires_at: null,
            ban_reason: null,
          }
          : {
            is_banned: true,
            ban_expires_at: config.expiresAt,
            ban_reason: reason || "Vi phạm quy định sử dụng hệ thống.",
          },
      )
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (duration !== "clear") {
      const users = await listAdminUsers();
      const targetUser = users.find((user) => user.id === userId);
      if (targetUser?.email) {
        await sendBanEmail({
          email: targetUser.email,
          name: targetUser.name,
          durationLabel: config.label,
          reason,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể cập nhật trạng thái cấm chat" },
      { status: 500 },
    );
  }
}