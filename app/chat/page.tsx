import { redirect } from "next/navigation";

import { ChatWorkspace } from "@/components/chat/ChatWorkspace";
import { isBanActive } from "@/lib/auth";
import { requireUser } from "@/lib/server-auth";
import { createAdminClient } from "@/utils/supabase/server";

export default async function ChatPage() {
  const user = await requireUser();

  if (user.role === "admin") {
    redirect("/admin");
  }

  if (isBanActive(user)) {
    redirect(`/?next=/chat&ban=1`);
  }

  try {
    const admin = createAdminClient();
    await admin.from("access_logs").insert({
      user_id: user.id,
      path: "/chat",
    });
  } catch { }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#fff5fa_0%,#eef6ff_42%,#ffffff_100%)] px-4 py-6 md:px-6">
      <div className="mx-auto">
        <ChatWorkspace user={user} />
      </div>
    </main>
  );
}