import { createAdminClient } from "@/utils/supabase/server";

export const SEEDED_ADMIN_NAME = "enteecaay";
export const SEEDED_ADMIN_EMAIL = `${SEEDED_ADMIN_NAME}@mln.local`;
export const SEEDED_ADMIN_PASSWORD = "$Enteecaay$060204";

type AuthUser = {
  email?: string | null;
  id: string;
};

async function listAllAuthUsers(): Promise<AuthUser[]> {
  const admin = createAdminClient();
  const users: AuthUser[] = [];
  let page = 1;

  while (true) {
    const result = await admin.auth.admin.listUsers({ page, perPage: 500 });
    const pageUsers = result.data.users || [];
    users.push(...pageUsers.map((user) => ({ id: user.id, email: user.email })));

    if (pageUsers.length < 500) break;
    page += 1;
  }

  return users;
}

export async function getSeedAdminUserId(): Promise<string | null> {
  const users = await listAllAuthUsers();
  const seededUser = users.find(
    (user) => user.email?.toLowerCase() === SEEDED_ADMIN_EMAIL.toLowerCase(),
  );
  return seededUser?.id || null;
}

export async function ensureSeedAdminAccount(): Promise<void> {
  const admin = createAdminClient();
  const users = await listAllAuthUsers();
  const seededEmail = SEEDED_ADMIN_EMAIL.toLowerCase();
  let seededUser = users.find((user) => user.email?.toLowerCase() === seededEmail);

  if (!seededUser) {
    const created = await admin.auth.admin.createUser({
      email: seededEmail,
      password: SEEDED_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { name: SEEDED_ADMIN_NAME },
    });

    if (created.error || !created.data.user) {
      throw new Error(created.error?.message || "Khong the tao tai khoan admin seed");
    }

    seededUser = { id: created.data.user.id, email: created.data.user.email };
  } else {
    const updated = await admin.auth.admin.updateUserById(seededUser.id, {
      password: SEEDED_ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { name: SEEDED_ADMIN_NAME },
    });

    if (updated.error) {
      throw new Error(updated.error.message);
    }
  }

  const upsertProfile = await admin.from("profiles").upsert(
    {
      id: seededUser.id,
      name: SEEDED_ADMIN_NAME,
      role: "admin",
      is_banned: false,
      ban_expires_at: null,
      ban_reason: null,
    },
    { onConflict: "id" },
  );

  if (upsertProfile.error) {
    throw new Error(upsertProfile.error.message);
  }

  const demoteOthers = await admin
    .from("profiles")
    .update({ role: "user" })
    .eq("role", "admin")
    .neq("id", seededUser.id);

  if (demoteOthers.error) {
    throw new Error(demoteOthers.error.message);
  }
}

export async function ensureSeedAdminSafely(): Promise<void> {
  try {
    await ensureSeedAdminAccount();
  } catch {
    // Keep app usable even when seed operation fails.
  }
}
