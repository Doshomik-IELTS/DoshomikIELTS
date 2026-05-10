"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function ScorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <div className="space-y-6">
      <PageHeader title="Your Score" />
      <p className="text-slate-600">View your results and predicted band score.</p>
      <Link href={`/attempts/${id}/report`}>
        <Button>View Report</Button>
      </Link>
    </div>
  );
}