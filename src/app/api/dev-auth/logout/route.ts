import { fail, ok } from "@/lib/api/response";
import { getDevAuthCookieName } from "@/lib/auth/dev-session";

const isDevMode = process.env.NODE_ENV !== "production";

export async function POST() {
  if (!isDevMode) {
    return fail({ code: "FORBIDDEN", message: "Dev auth is only available in development." }, 403);
  }

  const response = ok({ success: true });
  response.cookies.set({
    name: getDevAuthCookieName(),
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}
