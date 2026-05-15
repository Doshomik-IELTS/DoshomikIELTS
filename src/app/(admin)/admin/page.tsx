import Link from "next/link";
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin"
        description="Content and review management."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/resources/new" className={buttonVariants()}>
              New resource
            </Link>
            <Link href="/admin/tests/new" className={buttonVariants({ variant: "outline" })}>
              New test
            </Link>
            <Link href="/admin/resources" className={buttonVariants({ variant: "outline" })}>
              All resources
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/resources?status=draft">
          <Card className="h-full transition-colors hover:border-slate-300">
            <CardHeader>
              <CardTitle className="text-base">Draft resources</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{draft}</CardContent>
          </Card>
        </Link>
        <Link href="/admin/resources?status=review">
          <Card className="h-full transition-colors hover:border-slate-300">
            <CardHeader>
              <CardTitle className="text-base">In review</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{review}</CardContent>
          </Card>
        </Link>
        <Link href="/admin/resources?status=published">
          <Card className="h-full transition-colors hover:border-slate-300">
            <CardHeader>
              <CardTitle className="text-base">Published</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{published}</CardContent>
          </Card>
        </Link>
        <Link href="/admin/resources?status=archived">
          <Card className="h-full transition-colors hover:border-slate-300">
            <CardHeader>
              <CardTitle className="text-base">Archived</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{archived}</CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/tests?status=draft">
          <Card className="h-full transition-colors hover:border-slate-300">
            <CardHeader>
              <CardTitle className="text-base">Draft tests</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{testCount("draft")}</CardContent>
          </Card>
        </Link>
        <Link href="/admin/tests?status=review">
          <Card className="h-full transition-colors hover:border-slate-300">
            <CardHeader>
              <CardTitle className="text-base">Tests in review</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{testCount("review")}</CardContent>
          </Card>
        </Link>
        <Link href="/admin/tests?status=published">
          <Card className="h-full transition-colors hover:border-slate-300">
            <CardHeader>
              <CardTitle className="text-base">Published tests</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{testCount("published")}</CardContent>
          </Card>
        </Link>
        <Link href="/admin/reviews">
          <Card className="h-full transition-colors hover:border-slate-300">
            <CardHeader>
              <CardTitle className="text-base">Review queue</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{reviewQueueCount}</CardContent>
          </Card>
        </Link>
        <Link href="/admin/tests">
          <Card className="h-full border-amber-200 bg-amber-50 transition-colors hover:border-amber-300">
            <CardHeader>
              <CardTitle className="text-base">Validation blockers</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold text-amber-800">{testsWithBlockers.length}</CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent tests</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {recentTests.map((test) => (
              <Link key={test.id} href={`/admin/tests/${test.id}/builder`} className="block py-3 first:pt-0 last:pb-0">
                <p className="font-medium text-slate-900">{test.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{test.status} · {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(test.updatedAt)}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent resources</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {recentResources.map((resource) => (
              <Link key={resource.id} href={`/admin/resources/${resource.id}`} className="block py-3 first:pt-0 last:pb-0">
                <p className="font-medium text-slate-900">{resource.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{resource.status} · {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(resource.updatedAt)}</p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      {testsWithBlockers.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-base">Tests needing fixes</CardTitle>
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

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/admin/tests" className="font-medium text-blue-700 hover:underline">
          Tests
        </Link>
        <Link href="/admin/reviews" className="font-medium text-blue-700 hover:underline">
          Review queue
        </Link>
        <Link href="/dashboard" className="font-medium text-slate-600 hover:underline">
          Learner dashboard
        </Link>
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
