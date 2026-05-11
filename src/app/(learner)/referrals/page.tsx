"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { State } from "@/components/ui/state";
import { apiFetch } from "@/lib/api/client";

interface ReferralData {
  code: string;
  status: string;
  totalRedemptions: number;
  creditsEarned: number;
  shareUrl: string;
}

interface RedemptionsData {
  redemptions: {
    id: string;
    status: string;
    referrerReward: number;
    refereeReward: number;
    createdAt: string;
    processedAt: string | null;
    referee: { id: string; email: string; name: string | null };
  }[];
  page: number;
  limit: number;
  total: number;
}

interface CreditsData {
  balance: number;
  recentTransactions: {
    id: string;
    amount: number;
    type: string;
    description: string;
    refId: string | null;
    createdAt: string;
  }[];
}

async function fetchReferral(): Promise<ReferralData> {
  return apiFetch<ReferralData>("/api/referrals/me");
}

async function fetchRedemptions(page = 1): Promise<RedemptionsData> {
  return apiFetch<RedemptionsData>(`/api/referrals/me/redemptions?page=${page}`);
}

async function fetchCredits(): Promise<CreditsData> {
  return apiFetch<CreditsData>("/api/referrals/me/credits");
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

function txTypeLabel(type: string): string {
  const map: Record<string, string> = {
    referral_bonus: "Referral bonus",
    redemption: "Mock test used",
    admin_grant: "Admin grant",
    admin_revoke: "Admin revoke",
    refund: "Refund",
    promo: "Promotional",
  };
  return map[type] ?? type;
}

function txTypeColor(type: string): "success" | "danger" | "neutral" | "warning" {
  if (type === "redemption" || type === "admin_revoke") return "danger";
  if (type === "referral_bonus" || type === "admin_grant" || type === "promo" || type === "refund") return "success";
  return "neutral";
}

export default function ReferralsPage() {
  const { data: referral, isLoading: refLoading } = useQuery({
    queryKey: ["referral"],
    queryFn: fetchReferral,
  });

  const { data: redemptions, isLoading: redLoading } = useQuery({
    queryKey: ["referral-redemptions"],
    queryFn: () => fetchRedemptions(),
  });

  const { data: credits, isLoading: credLoading } = useQuery({
    queryKey: ["referral-credits"],
    queryFn: fetchCredits,
  });

  if (refLoading) return <ReferralsSkeleton />;

  if (!referral) {
    return (
      <State
        title="No referral code"
        description="Generate your referral code to start sharing."
        variant="info"
        action={
          <Button onClick={() => window.location.reload()}>
            Refresh
          </Button>
        }
      />
    );
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const fullShareUrl = `${baseUrl}${referral.shareUrl}`;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Referral Program"
        description="Share your code, earn credits. Both you and your friend get rewards."
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-600">Your referral code</p>
            <div className="mt-2 flex items-center gap-2">
              <p className="text-3xl font-bold font-mono tracking-wider text-blue-800">{referral.code}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(referral.code)}
              >
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-600">Share your link</p>
            <div className="mt-2 flex items-center gap-2">
              <p className="flex-1 truncate text-sm font-mono text-slate-500">{fullShareUrl}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(fullShareUrl)}
              >
                Copy
              </Button>
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(fullShareUrl)}
              >
                Share via WhatsApp
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(fullShareUrl)}
              >
                Share via Email
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-600">Credits earned</p>
            <p className="mt-2 text-3xl font-bold text-green-700">{referral.creditsEarned}</p>
            <p className="mt-1 text-sm text-slate-500">
              From {referral.totalRedemptions} successful referral{referral.totalRedemptions !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">1</span>
              <p>Share your unique referral code with friends.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">2</span>
              <p>They sign up and use your code during registration.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">3</span>
              <p>Both of you receive free credits for mock tests!</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-600">Credit balance</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {credits?.balance ?? "—"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {credits?.balance === 0 ? "No credits available" : credits?.balance === 1 ? "1 credit available (1 mock test)" : `${credits?.balance} credits available`}
            </p>
          </CardContent>
        </Card>
      </div>

      {!credLoading && credits && (
        <Card>
          <CardHeader>
            <CardTitle>Recent transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {credits.recentTransactions.length === 0 ? (
              <p className="text-sm text-slate-500">No transactions yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {credits.recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium text-slate-900">{tx.description}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(tx.createdAt))}
                        {" · "}
                        <Badge variant={txTypeColor(tx.type)} className="capitalize">
                          {txTypeLabel(tx.type)}
                        </Badge>
                      </p>
                    </div>
                    <p className={`text-lg font-bold ${tx.amount >= 0 ? "text-green-700" : "text-red-600"}`}>
                      {tx.amount >= 0 ? "+" : ""}{tx.amount}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!redLoading && redemptions && (
        <Card>
          <CardHeader>
            <CardTitle>Your referrals</CardTitle>
          </CardHeader>
          <CardContent>
            {redemptions.redemptions.length === 0 ? (
              <p className="text-sm text-slate-500">No referrals yet. Share your code to get started!</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {redemptions.redemptions.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium text-slate-900">{r.referee.email}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(r.createdAt))}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={r.status === "completed" ? "success" : r.status === "pending" ? "warning" : "neutral"}
                        className="capitalize"
                      >
                        {r.status}
                      </Badge>
                      {r.status === "completed" && (
                        <p className="mt-1 text-sm font-medium text-green-700">+{r.referrerReward} credits</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReferralsSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-2 h-5 w-72" />
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-3 h-10 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
