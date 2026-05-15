"use client";

import { Suspense } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { AdminTestList } from "@/components/admin/admin-test-list";
import { AdminTestAdvancedTools } from "@/components/admin/admin-test-advanced-tools";
import { PageHeader } from "@/components/ui/page-header";
import { State } from "@/components/ui/state";

function LoadingSkeleton() {
  return <State title="Loading tests..." variant="loading" />;
}

export default function AdminTestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tests"
        description="Manage mock tests and sections."
        actions={<Link href="/admin/tests/new" className={buttonVariants()}>New test</Link>}
      />
      <AdminTestAdvancedTools />
      <Suspense fallback={<LoadingSkeleton />}>
        <AdminTestList />
      </Suspense>
    </div>
  );
}
