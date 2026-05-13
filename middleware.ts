import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Route Protection Matrix:
 * - Learner routes (dashboard, profile, resources, practice, mock-tests, attempts, evaluations): require auth
 * - Admin routes (/admin/*): require auth here; Prisma role checks run in the admin layout and APIs
 * - Auth routes (login, register, reset-password): redirect to dashboard if already authenticated
 */
const protectedPrefixes = ["/dashboard", "/profile", "/resources", "/practice", "/mock-tests", "/attempts", "/evaluations"];
const adminPrefixes = ["/admin"];
const authRoutes = ["/login", "/register", "/reset-password"];
const DEV_COOKIE_NAME = "ieltspp-dev-session";

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function isAdminPath(pathname: string) {
  return adminPrefixes.some((prefix) => pathname.startsWith(prefix));
}

function isAuthRoute(pathname: string) {
  return authRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname) && !isAdminPath(pathname) && !isAuthRoute(pathname)) {
    return NextResponse.next();
  }

  const devToken = request.cookies.get(DEV_COOKIE_NAME)?.value;
  if (devToken) {
    if (isAuthRoute(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    let response = NextResponse.next({ request });
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      if (isAuthRoute(pathname)) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }

      return response;
    }
  }

  if (isProtectedPath(pathname) || isAdminPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
