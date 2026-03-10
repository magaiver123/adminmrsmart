import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hora
const ACTIVITY_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutos

export async function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("admin_session");
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/";

  const isPublicRoute =
    pathname.startsWith("/api/admin/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico");

  const isProtectedRoute = !isLoginPage && !isPublicRoute;

  if (!sessionCookie && isProtectedRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (sessionCookie) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: session } = await supabase
      .from("admin_sessions")
      .select("*, users(role, status)")
      .eq("id", sessionCookie.value)
      .single();

    if (!session || !session.users) {
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("admin_session");
      return response;
    }

    if (session.users.role !== "admin") {
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("admin_session");
      return response;
    }

    if (session.users.status !== "ativo") {
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("admin_session");
      return response;
    }

    const now = Date.now();
    const inactiveTime = now - session.last_activity;

    if (inactiveTime > SESSION_TIMEOUT) {
      await supabase.from("admin_sessions").delete().eq("id", session.id);

      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("admin_session");
      return response;
    }

    if (inactiveTime > ACTIVITY_REFRESH_INTERVAL) {
      await supabase
        .from("admin_sessions")
        .update({ last_activity: now })
        .eq("id", session.id);
    }
  }

  if (sessionCookie && isLoginPage) {
    return NextResponse.redirect(new URL("/ambientes", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
