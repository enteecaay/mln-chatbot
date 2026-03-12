import { NextResponse } from "next/server";

import { validateEmail } from "@/lib/auth";
import { createAdminClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const { email, otp } = (await request.json()) as { email?: string; otp?: string };

    const emailError = validateEmail(email || "");
    if (emailError) return NextResponse.json({ error: emailError }, { status: 400 });
    if (!otp || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "OTP phải gồm 6 chữ số" }, { status: 400 });
    }

    const admin = createAdminClient();
    const users = await admin.auth.admin.listUsers({ page: 1, perPage: 500 });
    const authUser = users.data.users.find(
      (user) => user.email?.toLowerCase() === email!.trim().toLowerCase(),
    );

    if (!authUser) {
      return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
    }

    const { data: otpRows, error } = await admin
      .from("email_otps")
      .select("*")
      .eq("user_id", authUser.id)
      .eq("purpose", "signup")
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !otpRows?.length) {
      return NextResponse.json({ error: "Không tìm thấy OTP hợp lệ" }, { status: 404 });
    }

    const otpRow = otpRows[0] as {
      expires_at: string;
      id: string;
      otp_code: string;
    };
    if (new Date(otpRow.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: "OTP đã hết hạn" }, { status: 400 });
    }

    if (otpRow.otp_code !== otp) {
      return NextResponse.json({ error: "OTP không đúng" }, { status: 400 });
    }

    const update = await admin.auth.admin.updateUserById(authUser.id, {
      email_confirm: true,
    });

    if (update.error) {
      return NextResponse.json({ error: update.error.message }, { status: 500 });
    }

    await admin
      .from("email_otps")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", otpRow.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Đã có lỗi xảy ra" },
      { status: 500 },
    );
  }
}