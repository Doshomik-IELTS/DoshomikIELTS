"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { State } from "@/components/ui/state";
import { apiFetch } from "@/lib/api/client";
import { TEST_TYPE_OPTIONS, TEST_STATUS_OPTIONS } from "@/lib/tests/constants";

type TestRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  estimatedDurationMinutes: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sectionCount: number;
  attemptCount: number;
};

type ListPayload = {
  items: TestRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

function AdminTestListInner({
  initialStatus,
  initialType,
  initialSearch,
}: {
  initialStatus: string;
  initialType: string;
  initialSearch: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  const [status, setStatus] = useState(initialStatus);
  const [type, setType] = useState(initialType);
  const [search, setSearch] = useState(initialSearch);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-tests", qs],
    queryFn: () => apiFetch<ListPayload>(`/api/admin/tests${qs ? `?${qs}` : ""}`),
  });

  function applyFilters() {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (type) p.set("type", type);
    if (search.trim()) p.set("search", search.trim());
    p.set("page", "1");
    router.push(`/admin/tests${p.toString() ? `?${p.toString()}` : ""}`);
  }

  const page = Number(searchParams.get("page") ?? "1");
  const limit = Number(searchParams.get("limit") ?? "20");

  function goPage(next: number) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("page", String(next));
    router.push(`/admin/tests?${p.toString()}`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Tests</h2>
          {data && (
            <p className="mt-0.5 text-sm text-slate-500">
              {data.pagination.total} total — page {data.pagination.page} of{" "}
              {Math.max(1, data.pagination.totalPages)}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              {TEST_STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-500" htmlFor="flt-type">
              Type
            </label>
            <select
              id="flt-type"
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">Any</option>
              {TEST_TYPE_OPTIONS.map((o) => (
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
              placeholder="Title"
            />
          </div>
        </div>
        <Button type="button" variant="secondary" onClick={applyFilters} className="w-fit">
          Apply filters
        </Button>
      </div>

      {isLoading && <State title="Loading tests..." variant="loading" />}
      {isError && (
        <State title="Could not load tests" variant="error" />
      )}

      {data ? (
        <>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-3 py-2.5 text-xs font-medium text-slate-600 uppercase tracking-wide">Title</th>
                    <th className="px-3 py-2.5 text-xs font-medium text-slate-600 uppercase tracking-wide">Type</th>
                    <th className="px-3 py-2.5 text-xs font-medium text-slate-600 uppercase tracking-wide">Status</th>
                    <th className="px-3 py-2.5 text-xs font-medium text-slate-600 uppercase tracking-wide">Sections</th>
                    <th className="px-3 py-2.5 text-xs font-medium text-slate-600 uppercase tracking-wide">Attempts</th>
                    <th className="px-3 py-2.5 text-xs font-medium text-slate-600 uppercase tracking-wide">Duration</th>
                    <th className="px-3 py-2.5 text-xs font-medium text-slate-600 uppercase tracking-wide">Updated</th>
                    <th className="px-3 py-2.5 text-slate-600" />
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                        No tests match.
                      </td>
                    </tr>
                  ) : (
                    data.items.map((t) => (
                      <tr key={t.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2.5 font-medium text-slate-900">{t.title}</td>
                        <td className="px-3 py-2.5 text-slate-600">{t.type}</td>
                        <td className="px-3 py-2.5">
                          <Badge variant="neutral">{t.status}</Badge>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{t.sectionCount}</td>
                        <td className="px-3 py-2.5 text-slate-600">{t.attemptCount}</td>
                        <td className="px-3 py-2.5 text-slate-600">
                          {t.estimatedDurationMinutes
                            ? `${t.estimatedDurationMinutes}m`
                            : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">
                          {new Intl.DateTimeFormat("en", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(t.updatedAt))}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Link
                            href={`/admin/tests/${t.id}`}
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
              disabled={page * limit >= data.pagination.total}
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

export function AdminTestList() {
  const searchParams = useSearchParams();
  const key = searchParams.toString();
  return (
    <AdminTestListInner
      key={key}
      initialStatus={searchParams.get("status") ?? ""}
      initialType={searchParams.get("type") ?? ""}
      initialSearch={searchParams.get("search") ?? ""}
    />
  );
}
