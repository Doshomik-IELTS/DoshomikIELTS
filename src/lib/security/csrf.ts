import { fail } from "@/lib/api/response";

const ALLOWED_ORIGINS = new Set([
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.NEXT_PUBLIC_SUPABASE_URL,
].filter(Boolean));

export function verifyCsrf(request: Request) {
  if (process.env.NODE_ENV === "development") return null;

  const method = request.method;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return null;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (origin && ALLOWED_ORIGINS.has(origin)) return null;

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL
        ? new URL(process.env.NEXT_PUBLIC_APP_URL)
        : null;
      if (appUrl && refererUrl.hostname === appUrl.hostname) return null;
    } catch {
      // Invalid referer URL — fall through to rejection
    }
  }

  return fail(
    { code: "CSRF_REJECTED", message: "Cross-origin request rejected" },
    403,
    { "X-Content-Type-Options": "nosniff" },
  );
}
