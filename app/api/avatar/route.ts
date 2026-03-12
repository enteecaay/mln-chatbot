import { NextResponse } from "next/server";

import { uploadAvatarToCloudinary } from "@/lib/cloudinary";
import { getCurrentUserServer } from "@/lib/server-auth";
import { createAdminClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUserServer();
    if (!currentUser) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Thiếu file upload" }, { status: 400 });
    }

    const avatarUrl = await uploadAvatarToCloudinary(file);
    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ avatar_url: avatarUrl })
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

export async function DELETE() {
  try {
    const currentUser = await getCurrentUserServer();
    if (!currentUser) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("profiles")
      .update({ avatar_url: null })
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