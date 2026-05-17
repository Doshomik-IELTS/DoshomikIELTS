import Link from "next/link";
import type { ReactNode } from "react";
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  Layers3,
  MessageSquare,
  Plus,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { validateTestForPublish } from "@/lib/tests/validation";

export default async function AdminPage() {
  const [resourceRows, testRows, reviewQueueCount, recentTests, recentResources, editableTests] = await Promise.all([
    prisma.resource.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.test.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    prisma.contentReview.count({ where: { status: "review" } }),
    prisma.test.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, updatedAt: true },
    }),
    prisma.resource.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, updatedAt: true },
    }),
    prisma.test.findMany({
      where: { status: { in: ["draft", "review"] } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        type: true,
        estimatedDurationMinutes: true,
        sections: {
          select: {
            id: true,
            module: true,
            partNumber: true,
            title: true,
            instructions: true,
            durationMinutes: true,
            contentJson: true,
            mediaAssetId: true,
            questions: {
              select: {
                questionType: true,
                prompt: true,
                sourceSpanJson: true,
                answerKey: { select: { canonicalAnswer: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const resourceCount = (status: string) =>
    resourceRows.find((r) => r.status === status)?._count.id ?? 0;
  const testCount = (status: string) =>
    testRows.find((r) => r.status === status)?._count.id ?? 0;

  const draft = resourceCount("draft");
  const review = resourceCount("review");
  const published = resourceCount("published");
  const archived = resourceCount("archived");
  const testsWithBlockers = editableTests
    .map((test) => ({ id: test.id, title: test.title, issues: validateTestForPublish(test).issues.length }))
    .filter((test) => test.issues > 0);
  const draftTests = testCount("draft");
  const testsInReview = testCount("review");
  const publishedTests = testCount("published");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin overview"
        description="Open Strapi authoring, monitor fallback content, and manage app review workflows."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/resources/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              Open Strapi Resources
            </Link>
            <Link href="/admin/tests/new" className={buttonVariants({ variant: "outline" })}>
              <Plus className="h-4 w-4" />
              Open Strapi Mock Tests
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <WorkflowCard
          href="/admin/tests?status=draft"
          icon={<Wrench className="h-5 w-5" />}
          title="Continue test drafts"
          value={draftTests}
          description="Open drafts in the builder and complete publish requirements."
        />
        <WorkflowCard
          href="/admin/tests"
          icon={<ShieldAlert className="h-5 w-5" />}
          title="Fix validation blockers"
          value={testsWithBlockers.length}
          description="Resolve missing material, answers, timing, or source checks."
          tone={testsWithBlockers.length > 0 ? "warning" : "default"}
        />
        <WorkflowCard
          href="/admin/reviews"
          icon={<MessageSquare className="h-5 w-5" />}
          title="Review queue"
          value={reviewQueueCount}
          description="Approve, reject, or adjust submitted content and evaluations."
        />
        <WorkflowCard
          href="/admin/resources"
          icon={<BookOpen className="h-5 w-5" />}
          title="Strapi resources"
          value={draft + review + published}
          description="Open Strapi authoring; Prisma counts show fallback/local resource rows."
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatLink href="/admin/resources?status=draft" label="Draft resources" value={draft} />
        <StatLink href="/admin/resources?status=review" label="Resources in review" value={review} />
        <StatLink href="/admin/resources?status=published" label="Published resources" value={published} />
        <StatLink href="/admin/resources?status=archived" label="Archived resources" value={archived} />
        <StatLink href="/admin/tests?status=review" label="Tests in review" value={testsInReview} />
        <StatLink href="/admin/tests?status=published" label="Published tests" value={publishedTests} />
        <StatLink href="/admin/flashcards" label="Flashcard decks" value="Open" />
        <StatLink href="/admin/tests/new" label="Open Strapi tests" value="Open" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Recent fallback tests</CardTitle>
              <Link href="/admin/tests" className="text-sm font-medium text-blue-700 hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {recentTests.map((test) => (
              <Link key={test.id} href={`/admin/tests/${test.id}/builder`} className="block py-3 first:pt-0 last:pb-0">
                <p className="font-medium text-slate-900">{test.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{test.status} - {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(test.updatedAt)}</p>
              </Link>
            ))}
            {recentTests.length === 0 && <p className="py-3 text-sm text-slate-500">No fallback tests yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="text-base">Recent fallback resources</CardTitle>
              <Link href="/admin/resources" className="text-sm font-medium text-blue-700 hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {recentResources.map((resource) => (
              <Link key={resource.id} href={`/admin/resources/${resource.id}`} className="block py-3 first:pt-0 last:pb-0">
                <p className="font-medium text-slate-900">{resource.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{resource.status} - {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(resource.updatedAt)}</p>
              </Link>
            ))}
            {recentResources.length === 0 && <p className="py-3 text-sm text-slate-500">No fallback resources yet.</p>}
          </CardContent>
        </Card>
      </div>

      {testsWithBlockers.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-base">Fallback tests needing fixes</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-amber-100">
            {testsWithBlockers.slice(0, 5).map((test) => (
              <Link key={test.id} href={`/admin/tests/${test.id}/builder`} className="block py-3 first:pt-0 last:pb-0">
                <p className="font-medium text-slate-900">{test.title}</p>
                <p className="mt-0.5 text-sm text-amber-700">{test.issues} publish blocker{test.issues !== 1 ? "s" : ""}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink href="/admin/tests" icon={<ClipboardCheck className="h-4 w-4" />} label="Strapi mock tests" />
        <QuickLink href="/admin/resources" icon={<FileText className="h-4 w-4" />} label="Strapi resources" />
        <QuickLink href="/admin/flashcards" icon={<Layers3 className="h-4 w-4" />} label="Flashcards" />
        <QuickLink href="/dashboard" icon={<BookOpen className="h-4 w-4" />} label="Learner dashboard" />
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6 text-sm text-amber-800">
          Do not upload or copy Cambridge IELTS books, commercial IELTS books, scans, passages,
          questions, audio, or answer explanations.
        </CardContent>
      </Card>
    </div>
  );
}

function WorkflowCard({
  href,
  icon,
  title,
  value,
  description,
  tone = "default",
}: {
  href: string;
  icon: ReactNode;
  title: string;
  value: number;
  description: string;
  tone?: "default" | "warning";
}) {
  return (
    <Link href={href} className="block h-full">
      <Card
        className={
          tone === "warning"
            ? "h-full border-amber-200 bg-amber-50 transition-colors hover:border-amber-300"
            : "h-full transition-colors hover:border-blue-300"
        }
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div
              className={
                tone === "warning"
                  ? "rounded-md bg-amber-100 p-2 text-amber-800"
                  : "rounded-md bg-blue-50 p-2 text-blue-700"
              }
            >
              {icon}
            </div>
            <span className="text-3xl font-bold text-slate-900">{value}</span>
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatLink({ href, label, value }: { href: string; label: string; value: number | string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition-colors hover:border-blue-300"
    >
      <span className="font-medium text-slate-700">{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </Link>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
    >
      {icon}
      {label}
    </Link>
  );
}
