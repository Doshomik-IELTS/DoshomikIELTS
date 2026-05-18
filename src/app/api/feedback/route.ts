import { NextResponse } from "next/server";
import { logRouteError } from "@/lib/api/logging";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const auth = await getCurrentUser();

    let profileId: string | null = null;
    let email: string | null = null;

    if (auth?.profile) {
      profileId = auth.profile.id;
      email = auth.profile.email;
    }

    const body = await request.json();

    if (!body.category || !body.message) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Category and message are required" } },
        { status: 400 }
      );
    }

    const validCategories = ["bug", "feature", "improvement", "general"];
    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Invalid category" } },
        { status: 400 }
      );
    }

    if (body.message.length < 10) {
      return NextResponse.json(
        { data: null, error: { code: "VALIDATION_ERROR", message: "Message must be at least 10 characters" } },
        { status: 400 }
      );
    }

    const feedback = await prisma.betaFeedback.create({
      data: {
        profileId,
        email: body.email || email,
        category: body.category,
        message: body.message,
        pageUrl: body.pageUrl || null,
        metadataJson: {
          userAgent: request.headers.get("user-agent"),
        },
      },
    });

    return NextResponse.json({ data: { id: feedback.id, success: true }, error: null });
  } catch (error) {
    logRouteError("/api/feedback", error, { method: request.method });
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Failed to submit feedback" } },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const auth = await getCurrentUser();

    if (!auth?.profile) {
      return NextResponse.json({ data: null, error: { code: "UNAUTHORIZED", message: "Unauthorized" } }, { status: 401 });
    }

    const hasAdminRole = auth.profile.roles.some((r: { role: string }) => r.role === "admin" || r.role === "reviewer");
    if (!hasAdminRole) {
      return NextResponse.json({ data: null, error: { code: "FORBIDDEN", message: "Forbidden" } }, { status: 403 });
    }

    const feedbacks = await prisma.betaFeedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json({ data: feedbacks, error: null });
  } catch (error) {
    logRouteError("/api/feedback", error, { method: "GET" });
    return NextResponse.json(
      { data: null, error: { code: "SERVER_ERROR", message: "Failed to fetch feedback" } },
      { status: 500 }
    );
  }
}
