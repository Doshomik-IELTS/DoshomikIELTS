import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IeltsSectionRenderer } from "@/components/ielts/ielts-section-renderer";
import { prisma } from "@/lib/prisma";

export default async function AdminTestPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          groups: { orderBy: { orderIndex: "asc" } },
          questions: { orderBy: { orderIndex: "asc" } },
        },
      },
    },
  });

  if (!test) notFound();

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="neutral">Admin preview</Badge>
            <Badge variant="neutral">{test.status}</Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{test.title}</h1>
          {test.description ? <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{test.description}</p> : null}
        </div>
        <Link href={`/admin/tests/${test.id}/builder`}>
          <Button variant="outline">Back to builder</Button>
        </Link>
      </div>

      {test.sections.map((section) => (
        <Card key={section.id}>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
              <span>{section.title}</span>
              <Badge variant="neutral" className="capitalize">{section.module}</Badge>
              {section.durationMinutes ? <Badge variant="neutral">{section.durationMinutes} min</Badge> : null}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {section.module === "writing" || section.module === "speaking" ? (
              <div className="space-y-3 text-sm text-slate-700">
                {section.instructions ? <p>{section.instructions}</p> : null}
                <p className="whitespace-pre-wrap">{section.questions.map((question) => question.prompt).join("\n\n")}</p>
              </div>
            ) : (
              <IeltsSectionRenderer
                section={{
                  id: section.id,
                  module: section.module,
                  title: section.title,
                  instructions: section.instructions,
                  durationMinutes: section.durationMinutes,
                  contentJson: section.contentJson as Record<string, unknown> | null,
                  mediaAssetId: section.mediaAssetId,
                  groups: section.groups,
                  questions: section.questions.map((question) => ({
                    id: question.id,
                    groupId: question.groupId,
                    prompt: question.prompt,
                    questionType: question.questionType,
                    optionsJson: question.optionsJson as Record<string, unknown> | null,
                  })),
                }}
                answers={{}}
                disabled
                onAnswerChange={() => undefined}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
