"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PracticeResultPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Practice Result</h1>
      <p className="text-slate-600">Your practice attempt results.</p>
      <Link href="/practice">
        <Button>Back to Practice</Button>
      </Link>
    </div>
  );
}