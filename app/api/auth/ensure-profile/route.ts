import { NextResponse } from "next/server";

import { createAdminClient, createClient } from "@/utils/supabase/server";

function getFallbackName(email?: string | null): string {
  if (!email) return "Nguoi dung moi";
  const prefix = email.split("@")[0]?.trim();
  return prefix || "Nguoi dung moi";
}

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", authUser.id)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({ ok: true, repaired: false });
    }

    const nameFromMetadata =
      typeof authUser.user_metadata?.name === "string"
        ? authUser.user_metadata.name.trim()
        : "";

    const insert = await admin.from("profiles").insert({
      id: authUser.id,
      name: nameFromMetadata || getFallbackName(authUser.email),
    });

    if (insert.error) {
      return NextResponse.json({ error: insert.error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, repaired: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Da co loi xay ra" },
      { status: 500 },
    );
  }
}
