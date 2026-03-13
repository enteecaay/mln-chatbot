import { Suspense } from "react";

import { AuthLanding } from "@/components/AuthLanding";
import { LoadingSprite } from "@/components/LoadingSprite";
import { ensureSeedAdminSafely } from "@/lib/seed-admin";

export const dynamic = "force-dynamic";

export default async function Page() {
  await ensureSeedAdminSafely();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fff4f8_0%,#f7fbff_38%,#fff_100%)]">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/80 px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
            <LoadingSprite size="md" />
            Đang tải...
          </div>
        </div>
      }
    >
      <AuthLanding />
    </Suspense>
  );
}