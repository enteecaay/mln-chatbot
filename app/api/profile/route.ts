import { NextResponse } from "next/server";

import { validateName } from "@/lib/auth";
import { getCurrentUserServer } from "@/lib/server-auth";
import { createAdminClient } from "@/utils/supabase/server";

export async function PATCH(request: Request) {
  try {
    const currentUser = await getCurrentUserServer();
    if (!currentUser) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { name } = (await request.json()) as { name?: string };
    const nameError = validateName(name || "");
    if (nameError) return NextResponse.json({ error: nameError }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ name: name!.trim() })
      .eq("id", currentUser.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const updatedUser = await getCurrentUserServer();
    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Đã có lỗi xảy ra" },
      { status: 500 },
    );
  }
}