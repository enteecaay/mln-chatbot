import { NextResponse } from "next/server";

import { listAdminUsers } from "@/lib/admin";
import { getCurrentUserServer } from "@/lib/server-auth";
import { SEEDED_ADMIN_EMAIL, getSeedAdminUserId } from "@/lib/seed-admin";
import { validateEmail, validateName, validatePassword } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/server";

async function ensureAdmin() {
  const user = await getCurrentUserServer();
  if (!user || user.role !== "admin") {
    throw new Error("Bạn không có quyền truy cập chức năng này");
  }

  return user;
}

export async function GET() {
  try {
    await ensureAdmin();
    const users = await listAdminUsers();
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể tải danh sách user" },
      { status: 403 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await ensureAdmin();
    const { email, name, password, role } = (await request.json()) as {
      email?: string;
      name?: string;
      password?: string;
      role?: "user" | "admin";
    };

    const emailError = validateEmail(email || "");
    if (emailError) return NextResponse.json({ error: emailError }, { status: 400 });
    const nameError = validateName(name || "");
    if (nameError) return NextResponse.json({ error: nameError }, { status: 400 });
    const passwordError = validatePassword(password || "");
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 });
    if (role === "admin") {
      return NextResponse.json(
        { error: "He thong chi cho phep 1 admin seed duy nhat" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const created = await admin.auth.admin.createUser({
      email: email!.trim().toLowerCase(),
      password: password!,
      email_confirm: true,
      user_metadata: { name: name!.trim() },
    });

    if (created.error || !created.data.user) {
      return NextResponse.json(
        { error: created.error?.message || "Không thể tạo user" },
        { status: 400 },
      );
    }

    await admin
      .from("profiles")
      .update({
        name: name!.trim(),
        role: role || "user",
      })
      .eq("id", created.data.user.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể tạo user" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureAdmin();
    const { userId, name, role, avatar } = (await request.json()) as {
      userId?: string;
      name?: string;
      role?: "user" | "admin";
      avatar?: string | null;
    };

    if (!userId) {
      return NextResponse.json({ error: "Thiếu userId" }, { status: 400 });
    }

    const nameError = validateName(name || "");
    if (nameError) return NextResponse.json({ error: nameError }, { status: 400 });

    let avatarUrl: string | null = null;
    let shouldUpdateAvatar = false;
    if (typeof avatar === "string") {
      shouldUpdateAvatar = true;
      const trimmed = avatar.trim();
      if (trimmed) {
        try {
          const parsed = new URL(trimmed);
          if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return NextResponse.json(
              { error: "Avatar URL phai bat dau bang http:// hoac https://" },
              { status: 400 },
            );
          }
          avatarUrl = trimmed;
        } catch {
          return NextResponse.json({ error: "Avatar URL khong hop le" }, { status: 400 });
        }
      }
    }

    if (role) {
      const admin = createAdminClient();
      const users = await admin.auth.admin.listUsers({ page: 1, perPage: 500 });
      const authUser = users.data.users.find((item) => item.id === userId);
      if (!authUser) {
        return NextResponse.json({ error: "Khong tim thay user" }, { status: 404 });
      }

      const isSeedAdmin =
        authUser.email?.toLowerCase() === SEEDED_ADMIN_EMAIL.toLowerCase();

      if (role === "admin" && !isSeedAdmin) {
        return NextResponse.json(
          { error: "Chi tai khoan admin seed moi duoc dat role admin" },
          { status: 400 },
        );
      }

      if (isSeedAdmin && role !== "admin") {
        return NextResponse.json(
          { error: "Khong the ha quyen admin seed" },
          { status: 400 },
        );
      }
    }

    const admin = createAdminClient();
    const updatePayload: {
      name: string;
      role: "user" | "admin";
      avatar_url?: string | null;
    } = {
      name: name!.trim(),
      role: role || "user",
    };

    if (shouldUpdateAvatar) {
      updatePayload.avatar_url = avatarUrl;
    }

    const { error } = await admin
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể cập nhật user" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const currentUser = await ensureAdmin();
    const { userId } = (await request.json()) as { userId?: string };
    if (!userId) {
      return NextResponse.json({ error: "Thiếu userId" }, { status: 400 });
    }

    if (userId === currentUser.id) {
      return NextResponse.json({ error: "Không thể xóa admin hiện tại" }, { status: 400 });
    }

    const seedAdminId = await getSeedAdminUserId();
    if (seedAdminId && userId === seedAdminId) {
      return NextResponse.json(
        { error: "Khong the xoa tai khoan admin seed" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const deleted = await admin.auth.admin.deleteUser(userId);
    if (deleted.error) {
      return NextResponse.json({ error: deleted.error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể xóa user" },
      { status: 500 },
    );
  }
}