"use client";

import { PageHeader } from "@/components/ui/page-header";
import { StrapiAuthoringPanel } from "@/components/admin/strapi-authoring-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { State } from "@/components/ui/state";
import { apiFetch } from "@/lib/api/client";
import { useState } from "react";
import { toast } from "sonner";

type SyncResult = {
  imported: number;
  total: number;
  tests: { id: string; title: string; alreadyExists: boolean }[];
};

export default function AdminTestsPage() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setSyncing(true);
    setError(null);
    setResult(null);

    try {
      const res = await apiFetch<SyncResult>("/api/admin/tests/strapi-sync", { method: "POST" });
      setResult(res);
      if (res.imported > 0) {
        toast.success(`Imported ${res.imported} test${res.imported === 1 ? "" : "s"} from Strapi`);
      } else {
        toast.info("All tests already imported");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Sync failed";
      setError(message);
      toast.error(message);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tests"
        description="Author and manage mock tests."
      />

      <Card>
        <CardHeader>
          <CardTitle>Sync from Strapi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Import all published mock tests from Strapi into the local database.
            Tests already imported will be skipped.
          </p>
          <Button onClick={handleSync} disabled={syncing}>
            {syncing ? "Syncing..." : "Sync from Strapi"}
          </Button>

          {error && (
            <State
              title="Sync failed"
              description={error}
              variant="error"
            />
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="success">{result.imported} imported</Badge>
                <Badge variant="neutral">{result.total} total in Strapi</Badge>
              </div>
              {result.tests.length > 0 && (
                <div className="rounded-md border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left p-3 font-medium text-slate-600">Title</th>
                        <th className="text-left p-3 font-medium text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.tests.map((test) => (
                        <tr key={test.id} className="border-b border-slate-100 last:border-0">
                          <td className="p-3 text-slate-900">{test.title}</td>
                          <td className="p-3">
                            <Badge variant={test.alreadyExists ? "neutral" : "success"}>
                              {test.alreadyExists ? "Already imported" : "Imported"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <StrapiAuthoringPanel
        collection="mock-tests"
        title="Mock-test authoring in Strapi"
        description="Create test definitions, sections, question groups, questions, answer keys, explanations, and media in Strapi. The learner app can list Strapi-published tests and materializes them into Prisma when a learner starts an attempt."
      />
    </div>
  );
}
