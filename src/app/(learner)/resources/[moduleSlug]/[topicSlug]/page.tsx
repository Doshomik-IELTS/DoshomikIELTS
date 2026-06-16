import { notFound } from "next/navigation";
import Link from "next/link";
import { MODULE_BY_SLUG } from "@/lib/resources/modules";
import { getModuleTopics } from "@/lib/resources/topics";
import { prisma } from "@/lib/prisma";
import { ContentPanel } from "@/components/ui/content-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { difficultyLabel } from "@/lib/resources/constants";

export default async function TopicPage({
  params,
}: {
  params: Promise<{ moduleSlug: string; topicSlug: string }>;
}) {
  const { moduleSlug, topicSlug } = await params;

  // Validate module
  const mod = MODULE_BY_SLUG[moduleSlug];
  if (!mod) notFound();

  // Validate topic
  const topics = getModuleTopics(moduleSlug);
  const topic = topics.find((t) => t.slug === topicSlug);
  if (!topic) notFound();

  // Fetch all resources for this topic
  const resources = await prisma.resource.findMany({
    where: { slug: { in: topic.resourceSlugs }, status: "published" },
    orderBy: { orderIndex: "asc" },
  });
  if (resources.length === 0) notFound();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link href="/resources" className="hover:text-blue-600 transition-colors">
          Resources
        </Link>
        <ChevronIcon />
        <Link
          href={`/resources/${moduleSlug}`}
          className="hover:text-blue-600 transition-colors"
        >
          {mod.label}
        </Link>
        <ChevronIcon />
        <span className="text-slate-900 font-medium">{topic.label}</span>
      </nav>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">{topic.label}</h1>
        <p className="mt-1 text-sm text-slate-500">{topic.description}</p>
      </div>

      {resources.length === 1 ? (
        /* Single resource — render inline */
        <SingleResourceView resource={resources[0]} />
      ) : (
        /* Multiple resources — show list */
        <div className="grid gap-4 sm:grid-cols-2">
          {resources.map((r) => (
            <Link key={r.id} href={`/resources/${r.slug}`} className="block group">
              <Card variant="interactive" className="h-full">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {r.title}
                  </h3>
                  <div className="mt-2 flex gap-2">
                    <Badge variant="neutral">{difficultyLabel(r.difficulty)}</Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div />
        <Link
          href={`/resources/${moduleSlug}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          Back to {mod.label}
        </Link>
      </div>
    </div>
  );
}

async function SingleResourceView({
  resource,
}: {
  resource: { slug: string; title: string; body: string };
}) {
  return (
    <>
      <div>
        <p className="text-sm text-slate-400">{resource.title}</p>
      </div>

      <ContentPanel>
        <div className="max-w-none">
          {resource.body.split("\n").map((line, i) => {
            if (line.startsWith("# ")) {
              return (
                <h1 key={i} className="text-2xl font-bold text-slate-900 mb-4">
                  {line.replace(/^# /, "")}
                </h1>
              );
            }
            if (line.startsWith("## ")) {
              return (
                <h2 key={i} className="text-xl font-semibold text-slate-800 mt-6 mb-3">
                  {line.replace(/^## /, "")}
                </h2>
              );
            }
            if (line.startsWith("### ")) {
              return (
                <h3 key={i} className="text-lg font-semibold text-slate-800 mt-5 mb-2">
                  {line.replace(/^### /, "")}
                </h3>
              );
            }
            if (line.startsWith("---")) {
              return <hr key={i} className="my-6 border-slate-200" />;
            }
            if (line.startsWith("|")) {
              return <TableRow key={i} line={line} />;
            }
            if (line.startsWith("> ")) {
              return (
                <blockquote
                  key={i}
                  className="border-l-4 border-blue-200 bg-blue-50/50 pl-4 py-1 my-3 text-slate-600 text-sm italic"
                >
                  {line.replace(/^>\s?/, "").replace(/^\[!TIP\]/i, "💡")}
                </blockquote>
              );
            }
            if (line.startsWith("* ")) {
              return (
                <p key={i} className="text-slate-700 leading-relaxed pl-5 -indent-4">
                  <span className="mr-2 text-slate-400">•</span>
                  {renderInline(line.replace(/^\*\s*/, ""))}
                </p>
              );
            }
            if (/^\d+\.\s/.test(line)) {
              return (
                <p key={i} className="text-slate-700 leading-relaxed pl-5 -indent-4">
                  <span className="mr-2 text-slate-400 font-medium">{line.match(/^\d+/)?.[0]}.</span>
                  {renderInline(line.replace(/^\d+\.\s*/, ""))}
                </p>
              );
            }
            if (line.trim() === "") {
              return <div key={i} className="h-2" />;
            }
            return (
              <p key={i} className="text-slate-700 leading-relaxed">
                {renderInline(line)}
              </p>
            );
          })}
        </div>
      </ContentPanel>

      <div className="flex items-center justify-between">
        <div />
        <Link
          href="/resources"
          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          View resource page &rarr;
        </Link>
      </div>
    </>
  );
}

function renderInline(text: string) {
  return text.replace(/icon:check/g, "✅").replace(/\$\\(?:rightarrow|to)\$/g, "→");
}

function ChevronIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TableRow({ line }: { line: string }) {
  const cells = line
    .split("|")
    .map((c) => c.trim())
    .filter(Boolean);

  if (cells.length === 0) return null;

  if (cells.every((c) => c.replace(/^:+/, "").startsWith("---"))) return null;

  const isHead = line.includes("Vocabulary | Parts of Speech | Meaning");

  if (isHead) {
    return (
      <div className="grid grid-cols-[1.2fr_0.8fr_2fr_2.5fr_1.2fr_2.5fr] gap-3 border-b border-slate-200 pb-2 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {cells.map((cell, i) => (
          <div key={i}>{cell}</div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[1.2fr_0.8fr_2fr_2.5fr_1.2fr_2.5fr] gap-3 border-b border-slate-100 py-2 text-sm last:border-0 break-words">
      {cells.map((cell, i) => {
        const isVocab = i === 0;
        const isMeaning = i === 2;
        return (
          <div
            key={i}
            className={
              isVocab
                ? "font-semibold text-slate-900"
                : isMeaning
                  ? "text-slate-600"
                  : "text-slate-500 text-xs"
            }
          >
            {cell}
          </div>
        );
      })}
    </div>
  );
}
