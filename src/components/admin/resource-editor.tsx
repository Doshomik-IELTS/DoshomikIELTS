"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api/client";
import {
  DIFFICULTY_OPTIONS,
  RESOURCE_CATEGORY_HELP,
  RESOURCE_CATEGORY_OPTIONS,
  resourceStatusLabel,
} from "@/lib/resources/constants";
import {
  resourceFormSchema,
  resourceFormValuesToApiBody,
  type ResourceFormValues,
} from "@/lib/validators/resource-form";

type AdminResource = {
  id: string;
  title: string;
  slug: string;
  category: ResourceFormValues["category"];
  difficulty: ResourceFormValues["difficulty"];
  body: string;
  tags: string[];
  examplesJson: unknown;
  status: ResourceFormValues["status"];
  publishedAt: string | null;
  updatedAt: string;
};

type ExampleItem = {
  label?: string | null;
  text: string;
};

const emptyDefaults: ResourceFormValues = {
  title: "",
  slug: "",
  category: "basic_english",
  difficulty: "basic",
  body: "",
  tags: "",
  examplesJsonText: "",
  status: "draft",
};

function parseExamples(text: string): ExampleItem[] {
  if (!text.trim()) return [];
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) return [];
    const examples: ExampleItem[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      examples.push({
        label: typeof record.label === "string" ? record.label : "",
        text: typeof record.text === "string" ? record.text : "",
      });
    }
    return examples;
  } catch {
    return [];
  }
}

function examplesToText(examples: ExampleItem[]) {
  const cleaned = examples
    .map((item) => ({
      label: item.label?.trim() || undefined,
      text: item.text.trim(),
    }))
    .filter((item) => item.label || item.text);
  return cleaned.length ? JSON.stringify(cleaned, null, 2) : "";
}

function resourceToFormValues(r: AdminResource): ResourceFormValues {
  return {
    title: r.title,
    slug: r.slug,
    category: r.category,
    difficulty: r.difficulty,
    body: r.body,
    tags: r.tags.join(", "),
    examplesJsonText: r.examplesJson
      ? JSON.stringify(r.examplesJson, null, 2)
      : "",
    status: r.status,
  };
}

export function ResourceEditor({
  mode,
  resourceId,
  canPublish,
  canArchive,
}: {
  mode: "create" | "edit";
  resourceId?: string;
  canPublish: boolean;
  canArchive: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isPending, isError } = useQuery({
    queryKey: ["admin-resource", resourceId],
    queryFn: () => apiFetch<{ resource: AdminResource }>(`/api/admin/resources/${resourceId}`),
    enabled: mode === "edit" && !!resourceId,
  });

  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: emptyDefaults,
  });
  const [examples, setExamples] = useState<ExampleItem[]>([]);

  useEffect(() => {
    if (mode === "edit" && data?.resource) {
      const values = resourceToFormValues(data.resource);
      form.reset(values);
      setExamples(parseExamples(values.examplesJsonText));
    }
  }, [mode, data?.resource, form]);

  const selectedCategory =
    useWatch({ control: form.control, name: "category" }) ?? "basic_english";
  const currentStatus = useWatch({ control: form.control, name: "status" }) ?? "draft";

  const createMutation = useMutation({
    mutationFn: (values: ResourceFormValues) =>
      apiFetch<{ resource: { id: string } }>("/api/admin/resources", {
        method: "POST",
        body: JSON.stringify(resourceFormValuesToApiBody(values)),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
      toast.success("Resource created.");
      router.push(`/admin/resources/${res.resource.id}`);
    },
    onError: (err: Error) => toast.error(err.message || "Could not create."),
  });

  const saveMutation = useMutation({
    mutationFn: (values: ResourceFormValues) =>
      apiFetch(`/api/admin/resources/${resourceId}`, {
        method: "PATCH",
        body: JSON.stringify(resourceFormValuesToApiBody(values)),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-resource", resourceId] });
      queryClient.invalidateQueries({ queryKey: ["admin-resources"] });
      toast.success("Saved.");
    },
    onError: (err: Error) => toast.error(err.message || "Could not save."),
  });

  function syncExamples(next: ExampleItem[]) {
    setExamples(next);
    form.setValue("examplesJsonText", examplesToText(next), {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  function submitWithStatus(status: ResourceFormValues["status"]) {
    form.setValue("status", status, { shouldDirty: true, shouldValidate: true });
    void form.handleSubmit((values) => {
      const finalValues = { ...values, status };
      if (mode === "create") {
        createMutation.mutate(finalValues);
      } else {
        saveMutation.mutate(finalValues);
      }
    })();
  }

  if (mode === "edit" && isPending) {
    return <p className="text-slate-600">Loading resource…</p>;
  }
  if (mode === "edit" && (isError || !data?.resource)) {
    return <p className="text-red-600">Resource not found or failed to load.</p>;
  }

  const pending = createMutation.isPending || saveMutation.isPending;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {mode === "create" ? "Create resource" : "Edit resource"}
          </h1>
          {mode === "edit" && data?.resource ? (
            <p className="mt-1 font-mono text-sm text-slate-500">{data.resource.slug}</p>
          ) : null}
        </div>
        <Link href="/admin/resources" className={buttonVariants({ variant: "outline" })}>
          Back to list
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) =>
            mode === "create" ? createMutation.mutate(values) : saveMutation.mutate(values),
          )} noValidate>
            <div className="space-y-1">
              <label htmlFor="res-title" className="text-sm font-medium text-slate-700">
                Title
              </label>
              <Input id="res-title" {...form.register("title")} />
              {form.formState.errors.title ? (
                <p className="text-sm text-red-600" role="alert">
                  {form.formState.errors.title.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1">
              <label htmlFor="res-slug" className="text-sm font-medium text-slate-700">
                Slug (optional — auto from title if empty on create)
              </label>
              <Input id="res-slug" {...form.register("slug")} className="font-mono text-sm" />
              {form.formState.errors.slug ? (
                <p className="text-sm text-red-600" role="alert">
                  {form.formState.errors.slug.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="res-category" className="text-sm font-medium text-slate-700">
                  Category
                </label>
                <select
                  id="res-category"
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                  {...form.register("category")}
                >
                  {RESOURCE_CATEGORY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs leading-5 text-slate-500">
                  {RESOURCE_CATEGORY_HELP[selectedCategory]}
                </p>
              </div>
              <div className="space-y-1">
                <label htmlFor="res-difficulty" className="text-sm font-medium text-slate-700">
                  Difficulty
                </label>
                <select
                  id="res-difficulty"
                  className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                  {...form.register("difficulty")}
                >
                  {DIFFICULTY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-slate-700">
                Workflow status: {resourceStatusLabel(currentStatus)}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Use the action buttons below to save as draft, submit for review, publish, or archive.
                Publishing requires admin or reviewer role; archive requires admin role.
              </p>
            </div>

            <div className="space-y-1">
              <label htmlFor="res-tags" className="text-sm font-medium text-slate-700">
                Tags (comma-separated)
              </label>
              <Input id="res-tags" {...form.register("tags")} placeholder="grammar, basics" />
            </div>

            <div className="space-y-1">
              <label htmlFor="res-body" className="text-sm font-medium text-slate-700">
                Body (plain text / markdown)
              </label>
              <Textarea id="res-body" rows={14} {...form.register("body")} className="font-mono text-sm" />
              {form.formState.errors.body ? (
                <p className="text-sm text-red-600" role="alert">
                  {form.formState.errors.body.message}
                </p>
              ) : null}
            </div>

            <input type="hidden" {...form.register("status")} />
            <input type="hidden" {...form.register("examplesJsonText")} />

            <div className="space-y-3 rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Examples</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Structured examples are stored as an array of label/text objects.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => syncExamples([...examples, { label: "", text: "" }])}
                >
                  Add example
                </Button>
              </div>
              {examples.length === 0 ? (
                <p className="rounded border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                  No examples yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {examples.map((example, index) => (
                    <div key={index} className="space-y-2 rounded border border-slate-100 bg-slate-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium text-slate-500">Example {index + 1}</p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => syncExamples(examples.filter((_, i) => i !== index))}
                        >
                          Remove
                        </Button>
                      </div>
                      <Input
                        value={example.label ?? ""}
                        onChange={(e) => {
                          const next = examples.slice();
                          next[index] = { ...example, label: e.target.value };
                          syncExamples(next);
                        }}
                        placeholder="Label, for example: Correct usage"
                      />
                      <Textarea
                        rows={3}
                        value={example.text}
                        onChange={(e) => {
                          const next = examples.slice();
                          next[index] = { ...example, text: e.target.value };
                          syncExamples(next);
                        }}
                        placeholder="Example text"
                      />
                    </div>
                  ))}
                </div>
              )}
              {form.formState.errors.examplesJsonText ? (
                <p className="text-sm text-red-600" role="alert">
                  {form.formState.errors.examplesJsonText.message}
                </p>
              ) : null}
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Original content only. Do not copy Cambridge or commercial IELTS books, passages,
              questions, audio, or answer explanations. See{" "}
              <code className="rounded bg-amber-100 px-1">
                docs/development/content/content-strategy.md
              </code>
              .
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={pending} onClick={() => submitWithStatus("draft")}>
                {pending ? "Saving..." : mode === "create" ? "Create draft" : "Save draft"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => submitWithStatus("review")}
              >
                Submit for review
              </Button>
              {canPublish ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => submitWithStatus("published")}
                >
                  Publish
                </Button>
              ) : null}
              {mode === "edit" && canArchive ? (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={pending}
                  onClick={() => submitWithStatus("archived")}
                >
                  Archive
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
