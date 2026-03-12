import { NextResponse } from "next/server";

import { sendOtpEmail } from "@/lib/email";
import { validateEmail } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/server";

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };
    const emailError = validateEmail(email || "");
    if (emailError) return NextResponse.json({ error: emailError }, { status: 400 });

    const admin = createAdminClient();
    const users = await admin.auth.admin.listUsers({ page: 1, perPage: 500 });
    const authUser = users.data.users.find(
      (user) => user.email?.toLowerCase() === email!.trim().toLowerCase(),
    );

    if (!authUser) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await admin
      .from("email_otps")
      .delete()
      .eq("user_id", authUser.id)
      .eq("purpose", "signup");

    const insert = await admin.from("email_otps").insert({
      user_id: authUser.id,
      email: email!.trim().toLowerCase(),
      otp_code: otp,
      purpose: "signup",
      expires_at: expiresAt,
    });

    if (insert.error) {
      return NextResponse.json({ error: insert.error.message }, { status: 500 });
    }

    await sendOtpEmail(
      email!.trim().toLowerCase(),
      otp,
      (authUser.user_metadata?.name as string | undefined) || "bạn",
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Đã có lỗi xảy ra" },
      { status: 500 },
    );
  }
}