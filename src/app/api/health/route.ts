import { ok } from "@/lib/api/response";

export async function GET() {
  return ok({ status: "ok", service: "ielts-plus-plus", timestamp: new Date().toISOString() });
}
