import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  FileText,
  Layers3,
  MessageSquare,
  Plus,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { validateTestForPublish } from "@/lib/tests/validation";

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium" });

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
  const totalResources = draft + review + published + archived;
  const totalTests = draftTests + testsInReview + publishedTests;

  return (
    <div className="space-y-6">
      <PageHeader
        meta="Operations"
        title="Admin dashboard"
        description="Prioritized publishing work, review queues, and content health for DOshomik IELTS."
        actions={
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link href="/admin/resources/new" className={buttonVariants()}>
              <Plus className="h-4 w-4" />
              Resource
            </Link>
            <Link href="/admin/tests/new" className={buttonVariants({ variant: "outline" })}>
              <Plus className="h-4 w-4" />
              Mock test
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Needs attention</h2>
              <p className="mt-1 text-sm text-slate-500">Start with blockers and review work before creating more content.</p>
            </div>
            <Badge variant={testsWithBlockers.length > 0 ? "warning" : "success"}>
              {testsWithBlockers.length > 0 ? `${testsWithBlockers.length} blocker sets` : "No blockers"}
            </Badge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <PriorityAction
              href="/admin/tests"
              icon={<ShieldAlert className="h-5 w-5" />}
              label="Validation blockers"
              value={testsWithBlockers.length}
              detail="Fix publish requirements"
              tone={testsWithBlockers.length > 0 ? "warning" : "default"}
            />
            <PriorityAction
              href="/admin/reviews"
              icon={<MessageSquare className="h-5 w-5" />}
              label="Review queue"
              value={reviewQueueCount}
              detail="Approve or reject items"
            />
            <PriorityAction
              href="/admin/tests?status=draft"
              icon={<Wrench className="h-5 w-5" />}
              label="Test drafts"
              value={draftTests}
              detail="Continue builder work"
            />
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-white shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Content inventory</h2>
              <p className="mt-1 text-sm text-slate-300">Local fallback rows and managed decks.</p>
            </div>
            <BookOpen className="h-6 w-6 text-blue-300" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <InventoryMetric label="Resources" value={totalResources} />
            <InventoryMetric label="Tests" value={totalTests} />
            <InventoryMetric label="Published" value={published + publishedTests} />
            <InventoryMetric label="Archived" value={archived} />
          </div>
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatusLink href="/admin/resources?status=draft" label="Resource drafts" value={draft} />
        <StatusLink href="/admin/resources?status=review" label="Resource review" value={review} />
        <StatusLink href="/admin/tests?status=review" label="Tests in review" value={testsInReview} />
        <StatusLink href="/admin/tests?status=published" label="Published tests" value={publishedTests} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <SectionHeader title="Publishing blockers" href="/admin/tests" action="Open tests" />
          <div className="divide-y divide-slate-100">
            {testsWithBlockers.slice(0, 5).map((test) => (
              <Link
                key={test.id}
                href={`/admin/tests/${test.id}/builder`}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-amber-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-950">{test.title}</p>
                  <p className="mt-1 text-sm text-amber-700">
                    {test.issues} publish blocker{test.issues !== 1 ? "s" : ""}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
              </Link>
            ))}
            {testsWithBlockers.length === 0 && (
              <EmptyState icon={<ClipboardCheck className="h-5 w-5" />} text="No validation blockers in editable fallback tests." />
            )}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-2">
          <ActivityPanel
            title="Recent tests"
            href="/admin/tests"
            emptyText="No fallback tests yet."
            items={recentTests.map((test) => ({
              href: `/admin/tests/${test.id}/builder`,
              title: test.title,
              status: test.status,
              date: test.updatedAt,
            }))}
          />
          <ActivityPanel
            title="Recent resources"
            href="/admin/resources"
            emptyText="No fallback resources yet."
            items={recentResources.map((resource) => ({
              href: `/admin/resources/${resource.id}`,
              title: resource.title,
              status: resource.status,
              date: resource.updatedAt,
            }))}
          />
        </section>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <QuickLink href="/admin/tests" icon={<ClipboardCheck className="h-4 w-4" />} label="Strapi mock tests" />
        <QuickLink href="/admin/resources" icon={<FileText className="h-4 w-4" />} label="Strapi resources" />
        <QuickLink href="/admin/flashcards" icon={<Layers3 className="h-4 w-4" />} label="Flashcards" />
        <QuickLink href="/dashboard" icon={<BookOpen className="h-4 w-4" />} label="Learner dashboard" />
      </div>

      <section className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          Do not upload or copy Cambridge IELTS books, commercial IELTS books, scans, passages,
          questions, audio, or answer explanations.
        </p>
      </section>
    </div>
  );
}

function PriorityAction({
  href,
  icon,
  label,
  value,
  detail,
  tone = "default",
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: number;
  detail: string;
  tone?: "default" | "warning";
}) {
  return (
    <Link
      href={href}
      className={
        tone === "warning"
          ? "rounded-lg border border-amber-200 bg-amber-50 p-4 transition-colors hover:border-amber-300"
          : "rounded-lg border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-blue-300 hover:bg-white"
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className={tone === "warning" ? "text-amber-700" : "text-blue-700"}>{icon}</div>
        <span className="text-3xl font-bold text-slate-950">{value}</span>
      </div>
      <p className="mt-3 font-medium text-slate-950">{label}</p>
      <p className="mt-1 text-sm text-slate-600">{detail}</p>
    </Link>
  );
}

function InventoryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusLink({ href, label, value }: { href: string; label: string; value: number | string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40"
    >
      <span className="font-medium text-slate-700">{label}</span>
      <span className="font-semibold text-slate-950">{value}</span>
    </Link>
  );
}

function SectionHeader({ title, href, action }: { title: string; href: string; action: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <h2 className="font-semibold text-slate-950">{title}</h2>
      <Link href={href} className="text-sm font-medium text-blue-700 hover:underline">
        {action}
      </Link>
    </div>
  );
}

function ActivityPanel({
  title,
  href,
  items,
  emptyText,
}: {
  title: string;
  href: string;
  items: { href: string; title: string; status: string; date: Date }[];
  emptyText: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <SectionHeader title={title} href={href} action="View all" />
      <div className="divide-y divide-slate-100">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="block px-5 py-4 transition-colors hover:bg-slate-50">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate font-medium text-slate-950">{item.title}</p>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-1 text-sm text-slate-500">{dateFormatter.format(item.date)}</p>
          </Link>
        ))}
        {items.length === 0 && <EmptyState icon={<FileText className="h-5 w-5" />} text={emptyText} />}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === "published" ? "success" : status === "review" ? "review" : status === "archived" ? "neutral" : "default";

  return (
    <Badge variant={variant} className="shrink-0 capitalize">
      {status}
    </Badge>
  );
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-6 text-sm text-slate-500">
      <span className="rounded-md bg-slate-100 p-2 text-slate-500">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function QuickLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition-colors hover:border-blue-300 hover:bg-slate-50"
    >
      {icon}
      {label}
    </Link>
  );
}
