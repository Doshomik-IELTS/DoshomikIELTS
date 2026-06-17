import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { getCurrentUser } from "@/lib/auth/session";
import { canAccessAdminRoutes } from "@/lib/auth/roles";
import { Logo } from "@/components/layout/logo";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string | string[] }>;
}) {
  return <LoginScreen searchParams={searchParams} />;
}

async function LoginScreen({
  searchParams,
}: {
  searchParams?: Promise<{ next?: string | string[] }>;
}) {
  const current = await getCurrentUser();
  if (current) {
    redirect(canAccessAdminRoutes(current.profile.roles) ? "/admin" : "/dashboard");
  }

  // Dev mode: redirect to auto-login route handler (sets cookie via Response)
  if (process.env.NODE_ENV !== "production") {
    const params = searchParams ? await searchParams : undefined;
    const nextPath = Array.isArray(params?.next) ? params?.next[0] : params?.next ?? "/dashboard";
    redirect(`/api/dev-auth/auto-login?next=${encodeURIComponent(nextPath)}`);
  }

  const params = searchParams ? await searchParams : undefined;
  const nextPath = Array.isArray(params?.next) ? params?.next[0] : params?.next ?? "/dashboard";

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/40 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMtOS45NCAwLTE4IDguMDYtMTggMThzOC4wNiAxOCAxOCAxOCAxOC04LjA2IDE4LTE4LTguMDYtMTgtMTgtMTh6bS0yOCAxMmM0LjMxIDAgOCAzLjY5IDggOHMtMy42OSA4LTggOC04LTMuNjktOC04IDMuNjktOCA4LTh6IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmZmLjA1IiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvZz48L3N2Zz4=')] opacity-20" />
        <div className="absolute -left-32 -top-32 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <main className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex">
              <Logo variant="full" size="lg" inverse />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-sm">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
              <p className="mt-2 text-sm text-slate-400">Sign in to continue your IELTS journey</p>
            </div>

            <LoginForm nextPath={nextPath} />

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="font-medium text-primary-soft hover:text-primary">
                  Create one
                </Link>
              </p>
            </div>

            {process.env.NODE_ENV !== "production" && (
            <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="mb-1 text-xs font-medium text-blue-300">Demo account</p>
              <p className="text-xs text-slate-400">Email: demo@doshomikielts.local</p>
              <p className="text-xs text-slate-400">Password: Test@1234!</p>
              <p className="mt-2 mb-1 text-xs font-medium text-blue-300">Admin demo</p>
              <p className="text-xs text-slate-400">Email: admin@doshomikielts.local</p>
              <p className="text-xs text-slate-400">Password: Test@1234!</p>
            </div>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-400">
              ← Back to home
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
