"use client";

import { Suspense } from "react";
import { AdminTestList } from "@/components/admin/admin-test-list";
import { PageHeader } from "@/components/ui/page-header";
import { State } from "@/components/ui/state";

function LoadingSkeleton() {
  return <State title="Loading tests..." variant="loading" />;
}

export default function AdminTestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tests" description="Manage mock tests and sections." />
      <Suspense fallback={<LoadingSkeleton />}>
        <AdminTestList />
      </Suspense>
    </div>
  );
}