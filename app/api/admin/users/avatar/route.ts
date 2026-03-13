import { NextResponse } from "next/server";

import { uploadAvatarToCloudinary } from "@/lib/cloudinary";
import { getCurrentUserServer } from "@/lib/server-auth";

async function ensureAdmin() {
  const user = await getCurrentUserServer();
  if (!user || user.role !== "admin") {
    throw new Error("Bạn không có quyền truy cập chức năng này");
  }

  return user;
}

export async function POST(request: Request) {
  try {
    await ensureAdmin();

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Thiếu file upload" }, { status: 400 });
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "Ảnh phải nhỏ hơn 2MB" }, { status: 400 });
    }

    const avatarUrl = await uploadAvatarToCloudinary(file);
    return NextResponse.json({ avatarUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Không thể upload avatar" },
      { status: 500 },
    );
  }
}
