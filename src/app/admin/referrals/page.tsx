"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";

interface Analytics {
  totalReferrals: number;
  totalRedemptions: number;
  conversionRate: number;
  totalCreditsIssued: number;
  topReferrers: { profileId: string; email: string; name: string | null; totalRedemptions: number }[];
  recentRedemptionsCount: number;
  dailyData: { date: string; count: number }[];
}

interface ReferralList {
  referrals: {
    id: string;
    code: string;
    status: string;
    createdAt: string;
    referrer: { id: string; email: string; name: string | null };
    totalRedemptions: number;
    referrerEarnings: number;
    refereeEarnings: number;
  }[];
  page: number;
  limit: number;
  total: number;
}

async function fetchAnalytics(): Promise<Analytics> {
  return apiFetch<Analytics>("/api/admin/referrals/analytics");
}

async function fetchReferrals(page = 1, status?: string, search?: string): Promise<ReferralList> {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  return apiFetch<ReferralList>(`/api/admin/referrals?${params}`);
}

export default function AdminReferralsPage() {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin-referrals-analytics"],
    queryFn: fetchAnalytics,
  });

  const { data: list, isLoading: listLoading } = useQuery({
    queryKey: ["admin-referrals-list"],
    queryFn: () => fetchReferrals(),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Referral Program</h1>
        <p className="mt-1 text-sm text-slate-500">Manage referral codes, rewards, and program settings.</p>
        <div className="mt-3 flex gap-3">
          <Link href="/admin/referrals/config">
            <Button variant="outline" size="sm">Program Settings</Button>
          </Link>
        </div>
      </div>

      {analyticsLoading ? (
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : analytics ? (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-slate-600">Total referral codes</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{analytics.totalReferrals}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-slate-600">Total redemptions</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{analytics.totalRedemptions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-slate-600">Conversion rate</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{analytics.conversionRate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm font-medium text-slate-600">Credits issued</p>
              <p className="mt-2 text-3xl font-bold text-green-700">{analytics.totalCreditsIssued}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {analytics && analytics.topReferrers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top referrers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {analytics.topReferrers.slice(0, 5).map((r, i) => (
                <div key={r.profileId} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-400">#{i + 1}</span>
                    <div>
                      <p className="font-medium text-slate-900">{r.name ?? r.email}</p>
                      <p className="text-sm text-slate-500">{r.email}</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-slate-900">{r.totalRedemptions}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All referral codes</CardTitle>
        </CardHeader>
        <CardContent>
          {listLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : !list || list.referrals.length === 0 ? (
            <p className="text-sm text-slate-500">No referral codes found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="pb-3 font-medium text-slate-600">Code</th>
                    <th className="pb-3 font-medium text-slate-600">Referrer</th>
                    <th className="pb-3 font-medium text-slate-600">Redemptions</th>
                    <th className="pb-3 font-medium text-slate-600">Referrer earnings</th>
                    <th className="pb-3 font-medium text-slate-600">Status</th>
                    <th className="pb-3 font-medium text-slate-600">Created</th>
                    <th className="pb-3 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {list.referrals.map((r) => (
                    <tr key={r.id} className="text-slate-700">
                      <td className="py-3 font-mono font-medium text-blue-800">{r.code}</td>
                      <td className="py-3">
                        <p className="font-medium">{r.referrer.name ?? r.referrer.email}</p>
                        <p className="text-xs text-slate-500">{r.referrer.email}</p>
                      </td>
                      <td className="py-3 font-medium">{r.totalRedemptions}</td>
                      <td className="py-3 text-green-700">{r.referrerEarnings}</td>
                      <td className="py-3">
                        <Badge
                          variant={
                            r.status === "active" ? "success" :
                            r.status === "suspended" ? "warning" : "neutral"
                          }
                          className="capitalize"
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-slate-500">
                        {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(r.createdAt))}
                      </td>
                      <td className="py-3">
                        <Link href={`/admin/referrals/${r.code}`}>
                          <Button variant="outline" size="sm">View</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {list && list.total > list.limit && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing {(list.page - 1) * list.limit + 1}–{Math.min(list.page * list.limit, list.total)} of {list.total}
              </p>
              <div className="flex gap-2">
                {list.page > 1 && (
                  <Link href={`/admin/referrals?page=${list.page - 1}`}>
                    <Button variant="outline" size="sm">Previous</Button>
                  </Link>
                )}
                {list.page * list.limit < list.total && (
                  <Link href={`/admin/referrals?page=${list.page + 1}`}>
                    <Button variant="outline" size="sm">Next</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
