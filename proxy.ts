import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/utils/supabase/middleware";

const AUTH_ROUTES = ["/chat", "/admin"];

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);
  const pathname = request.nextUrl.pathname;
  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  if (AUTH_ROUTES.some((route) => pathname.startsWith(route)) && !hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};