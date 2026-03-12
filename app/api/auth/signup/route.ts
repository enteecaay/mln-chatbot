import { NextResponse } from "next/server";

import { sendOtpEmail } from "@/lib/email";
import { validateEmail, validateName, validatePassword } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/server";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { name, email, password } = (await request.json()) as {
      email?: string;
      name?: string;
      password?: string;
    };

    const nameError = validateName(name || "");
    if (nameError) return NextResponse.json({ error: nameError }, { status: 400 });

    const emailError = validateEmail(email || "");
    if (emailError) return NextResponse.json({ error: emailError }, { status: 400 });

    const passwordError = validatePassword(password || "");
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }

    const admin = createAdminClient();
    const normalizedEmail = email!.trim().toLowerCase();
    const users = await admin.auth.admin.listUsers({ page: 1, perPage: 500 });
    const existing = users.data.users.find(
      (user) => user.email?.toLowerCase() === normalizedEmail,
    );

    if (existing) {
      return NextResponse.json({ error: "Email này đã được đăng ký" }, { status: 409 });
    }

    const created = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: password!,
      email_confirm: false,
      user_metadata: { name: name!.trim() },
    });

    if (created.error || !created.data.user) {
      return NextResponse.json(
        { error: created.error?.message || "Không thể tạo người dùng" },
        { status: 400 },
      );
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await admin
      .from("email_otps")
      .delete()
      .eq("user_id", created.data.user.id)
      .eq("purpose", "signup");

    const insert = await admin.from("email_otps").insert({
      user_id: created.data.user.id,
      email: normalizedEmail,
      otp_code: otp,
      purpose: "signup",
      expires_at: expiresAt,
    });

    if (insert.error) {
      await admin.auth.admin.deleteUser(created.data.user.id);
      return NextResponse.json({ error: insert.error.message }, { status: 500 });
    }

    await sendOtpEmail(normalizedEmail, otp, name!.trim());
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Đã có lỗi xảy ra" },
      { status: 500 },
    );
  }
}