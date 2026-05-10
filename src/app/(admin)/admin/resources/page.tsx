"use client";

import { Suspense } from "react";
import { AdminResourceList } from "@/components/admin/admin-resource-list";
import { PageHeader } from "@/components/ui/page-header";
import { State } from "@/components/ui/state";

function LoadingSkeleton() {
  return <State title="Loading resources..." variant="loading" />;
}

export default function AdminResourcesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Resources" description="Manage learning content." />
      <Suspense fallback={<LoadingSkeleton />}>
        <AdminResourceList />
      </Suspense>
    </div>
  );
}
