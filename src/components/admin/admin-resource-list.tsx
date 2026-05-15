"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { State } from "@/components/ui/state";
import { apiFetch } from "@/lib/api/client";
import {
  DIFFICULTY_OPTIONS,
  RESOURCE_CATEGORY_OPTIONS,
  RESOURCE_STATUS_OPTIONS,
  difficultyLabel,
  resourceCategoryLabel,
  resourceStatusLabel,
} from "@/lib/resources/constants";

type Row = {
  id: string;
  title: string;
  slug: string;
  category: string;
  difficulty: string;
  status: string;
  updatedAt: string;
};

type ListPayload = {
  resources: Row[];
  page: number;
  limit: number;
  total: number;
};

function AdminResourceListInner({
  initialStatus,
  initialCategory,
  initialDifficulty,
  initialSearch,
}: {
  initialStatus: string;
  initialCategory: string;
  initialDifficulty: string;
  initialSearch: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  const [status, setStatus] = useState(initialStatus);
  const [category, setCategory] = useState(initialCategory);
  const [difficulty, setDifficulty] = useState(initialDifficulty);
  const [search, setSearch] = useState(initialSearch);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-resources", qs],
    queryFn: () => apiFetch<ListPayload>(`/api/admin/resources${qs ? `?${qs}` : ""}`),
  });

  function applyFilters() {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (category) p.set("category", category);
    if (difficulty) p.set("difficulty", difficulty);
    if (search.trim()) p.set("search", search.trim());
    p.set("page", "1");
    router.push(`/admin/resources${p.toString() ? `?${p.toString()}` : ""}`);
  }

  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");

  function goPage(next: number) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("page", String(next));
    router.push(`/admin/resources?${p.toString()}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Resources</h2>
          {data && (
            <p className="mt-0.5 text-sm text-slate-500">
              {data.total} total — page {data.page} of {Math.max(1, Math.ceil(data.total / data.limit))}
            </p>
          )}
        </div>
        <Link href="/admin/resources/new" className={buttonVariants()}>
          New resource
        </Link>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="flt-status">
              Status
            </label>
            <select
              id="flt-status"
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Any</option>
              {RESOURCE_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="flt-category">
              Category
            </label>
            <select
              id="flt-category"
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Any</option>
              {RESOURCE_CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="flt-difficulty">
              Difficulty
            </label>
            <select
              id="flt-difficulty"
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="">Any</option>
              {DIFFICULTY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="flt-search">
              Search
            </label>
            <Input
              id="flt-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title or slug"
            />
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={applyFilters} className="w-fit">
          Apply filters
        </Button>
      </div>

      {isLoading && <State title="Loading resources..." variant="loading" />}
      {isError && (
        <State title="Could not load resources" variant="error" />
      )}

      {data ? (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-3 py-2.5 text-xs font-medium text-slate-600 uppercase tracking-wide">Title</th>
                    <th className="px-3 py-2.5 text-xs font-medium text-slate-600 uppercase tracking-wide">Category</th>
                    <th className="px-3 py-2.5 text-xs font-medium text-slate-600 uppercase tracking-wide">Difficulty</th>
                    <th className="px-3 py-2.5 text-xs font-medium text-slate-600 uppercase tracking-wide">Status</th>
                    <th className="px-3 py-2.5 text-xs font-medium text-slate-600 uppercase tracking-wide">Updated</th>
                    <th className="px-3 py-2.5 text-slate-600" />
                  </tr>
                </thead>
                <tbody>
                  {data.resources.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-slate-500">
                        No resources match.
                      </td>
                    </tr>
                  ) : (
                    data.resources.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2.5 font-medium text-slate-900">{r.title}</td>
                        <td className="px-3 py-2.5 text-slate-600">{resourceCategoryLabel(r.category)}</td>
                        <td className="px-3 py-2.5 text-slate-600">{difficultyLabel(r.difficulty)}</td>
                        <td className="px-3 py-2.5">
                          <Badge variant="neutral">{resourceStatusLabel(r.status)}</Badge>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">
                          {new Intl.DateTimeFormat("en", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(r.updatedAt))}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Link
                            href={`/admin/resources/${r.id}`}
                            className="font-medium text-blue-700 hover:underline"
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1}
              onClick={() => goPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={page * limit >= data.total}
              onClick={() => goPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function AdminResourceList() {
  const searchParams = useSearchParams();
  const key = searchParams.toString();
  return (
    <AdminResourceListInner
      key={key}
      initialStatus={searchParams.get("status") ?? ""}
      initialCategory={searchParams.get("category") ?? ""}
      initialDifficulty={searchParams.get("difficulty") ?? ""}
      initialSearch={searchParams.get("search") ?? ""}
    />
  );
}
