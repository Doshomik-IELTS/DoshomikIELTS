"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

interface ReferralConfig {
  referrerReward: number;
  refereeReward: number;
  minPurchaseForReward: number | null;
  maxRedemptionsPerCode: number | null;
  rewardTrigger: string;
  enabled: boolean;
}

async function fetchConfig(): Promise<ReferralConfig> {
  return apiFetch<ReferralConfig>("/api/admin/referrals/config");
}

async function updateConfig(data: Partial<ReferralConfig>): Promise<ReferralConfig> {
  return apiFetch<ReferralConfig>("/api/admin/referrals/config", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export default function AdminReferralConfigPage() {
  const queryClient = useQueryClient();
  const [local, setLocal] = useState<Partial<ReferralConfig>>({});
  const [saved, setSaved] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ["admin-referral-config"],
    queryFn: fetchConfig,
  });

  if (config && !initialized) {
    setLocal(config);
    setInitialized(true);
  }

  const mutation = useMutation({
    mutationFn: (data: Partial<ReferralConfig>) => updateConfig(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin-referral-config"], updated);
      setLocal(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  if (isLoading || !config) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
          <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
        </div>
        <Card>
          <CardContent className="space-y-4 p-6">
            {[1,2,3,4].map(i => <div key={i} className="h-10 animate-pulse rounded bg-slate-100" />)}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Referral Program Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure rewards, triggers, and limits for the referral program.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reward Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Referrer Reward (credits)</label>
              <p className="text-xs text-slate-500">Credits awarded to the referrer per successful referral.</p>
              <input
                type="number"
                min={0}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={local.referrerReward ?? config.referrerReward}
                onChange={(e) => setLocal((l) => ({ ...l, referrerReward: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Referee Reward (credits)</label>
              <p className="text-xs text-slate-500">Credits awarded to the new user on signup or first purchase.</p>
              <input
                type="number"
                min={0}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={local.refereeReward ?? config.refereeReward}
                onChange={(e) => setLocal((l) => ({ ...l, refereeReward: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Reward Trigger</label>
              <p className="text-xs text-slate-500">When should the referral bonus be credited?</p>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={local.rewardTrigger ?? config.rewardTrigger}
                onChange={(e) => setLocal((l) => ({ ...l, rewardTrigger: e.target.value }))}
              >
                <option value="on_signup">On signup — credits added immediately</option>
                <option value="on_first_purchase">On first purchase — credits added after first spend</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Max Redemptions per Code</label>
              <p className="text-xs text-slate-500">Leave empty for unlimited uses.</p>
              <input
                type="number"
                min={1}
                placeholder="Unlimited"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={local.maxRedemptionsPerCode ?? config.maxRedemptionsPerCode ?? ""}
                onChange={(e) => setLocal((l) => ({
                  ...l,
                  maxRedemptionsPerCode: e.target.value ? parseInt(e.target.value, 10) : null,
                }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border border-slate-200 p-4">
            <div>
              <p className="font-medium text-slate-700">Enable Referral Program</p>
              <p className="text-sm text-slate-500">Turn the referral program on or off globally.</p>
            </div>
            <button
              type="button"
              onClick={() => setLocal((l) => ({ ...l, enabled: !(l.enabled ?? config.enabled) }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                local.enabled ?? config.enabled ? "bg-blue-600" : "bg-slate-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  (local.enabled ?? config.enabled) ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => mutation.mutate(local)}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : "Save Settings"}
            </Button>
            {saved && <span className="text-sm text-green-600">Settings saved successfully.</span>}
            {mutation.isError && <span className="text-sm text-red-600">Failed to save. Please try again.</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
