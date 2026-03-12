import { Suspense } from "react";

import { AuthLanding } from "@/components/AuthLanding";
import { ensureSeedAdminSafely } from "@/lib/seed-admin";

export const dynamic = "force-dynamic";

export default async function Page() {
  await ensureSeedAdminSafely();

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#fff4f8_0%,#f7fbff_38%,#fff_100%)]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#b65c80] border-t-transparent" />
        </div>
      }
    >
      <AuthLanding />
    </Suspense>
  );
}