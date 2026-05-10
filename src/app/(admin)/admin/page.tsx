import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const rows = await prisma.resource.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const count = (status: string) =>
    rows.find((r) => r.status === status)?._count.id ?? 0;

  const draft = count("draft");
  const review = count("review");
  const published = count("published");
  const archived = count("archived");

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
