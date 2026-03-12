import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { getDashboardStats, listAdminUsers } from "@/lib/admin";
import { requireAdmin } from "@/lib/server-auth";
import { createAdminClient } from "@/utils/supabase/server";

export default async function AdminPage() {
  const currentUser = await requireAdmin();
  const [users, stats] = await Promise.all([
    listAdminUsers(),
    getDashboardStats(),
  ]);

  try {
    const admin = createAdminClient();
    await admin.from("access_logs").insert({
      user_id: currentUser.id,
      path: "/admin",
    });
  } catch { }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff5fa_0%,#eef6ff_42%,#ffffff_100%)] px-4 py-6 md:px-6">
      <div className="mx-auto">
        <AdminWorkspace currentUser={currentUser} stats={stats} users={users} />
      </div>
    </main>
  );
}