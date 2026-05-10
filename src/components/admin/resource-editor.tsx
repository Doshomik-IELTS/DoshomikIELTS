"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api/client";
import {
  DIFFICULTY_OPTIONS,
  RESOURCE_CATEGORY_OPTIONS,
  RESOURCE_STATUS_OPTIONS,
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

  useEffect(() => {
    if (mode === "edit" && data?.resource) {
      form.reset(resourceToFormValues(data.resource));
    }
  }, [mode, data?.resource, form]);

  const statusChoices = RESOURCE_STATUS_OPTIONS.filter((o) => {
    if (o.value === "published" && !canPublish) return false;
    if (o.value === "archived" && !canArchive) return false;
    return true;
  });

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
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) =>
              mode === "create" ? createMutation.mutate(values) : saveMutation.mutate(values),
            )}
            noValidate
          >
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

            <div className="space-y-1">
              <label htmlFor="res-status" className="text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="res-status"
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                {...form.register("status")}
              >
                {statusChoices.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {!canPublish ? (
                <p className="text-xs text-slate-500">
                  Publishing requires admin or reviewer role.
                </p>
              ) : null}
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

            <div className="space-y-1">
              <label htmlFor="res-examples" className="text-sm font-medium text-slate-700">
                Examples JSON (optional array of {"{"} label?, text {"}"})
              </label>
              <Textarea
                id="res-examples"
                rows={6}
                {...form.register("examplesJsonText")}
                className="font-mono text-sm"
                placeholder='[{"label":"Example","text":"..."}]'
              />
              {form.formState.errors.examplesJsonText ? (
                <p className="text-sm text-red-600" role="alert">
                  {form.formState.errors.examplesJsonText.message}
                </p>
              ) : null}
            </div>

            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Original content only — no Cambridge or commercial book material. See repository{" "}
              <code className="rounded bg-amber-100 px-1">docs/content-strategy.md</code>.
            </div>

            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : mode === "create" ? "Create resource" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
