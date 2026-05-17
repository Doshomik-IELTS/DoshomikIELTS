"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { State } from "@/components/ui/state";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";

type VerifyStatus = {
  email: string;
  emailVerified: boolean;
  confirmedAt: string | null;
};

async function fetchStatus(): Promise<VerifyStatus> {
  return apiFetch<VerifyStatus>("/api/profile/verify-email/status");
}

async function resendEmail(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/api/profile/verify-email/resend", { method: "POST" });
}

export default function VerifyEmailPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["email-verify-status"],
    queryFn: fetchStatus,
  });

  const resendMutation = useMutation({
    mutationFn: resendEmail,
    onSuccess: () => {
      toast.success("Verification email sent. Check your inbox.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to send verification email.");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Verify Email" description="Loading..." />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Verify Email" />
        <State
          title="Could not load verification status"
          variant="error"
          action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>}
        />
      </div>
    );
  }

  if (data.emailVerified) {
    return (
      <div className="space-y-6">
        <PageHeader title="Verify Email" />
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Email Verified</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-green-700">
              Your email <strong>{data.email}</strong> has been verified.
            </p>
            {data.confirmedAt && (
              <p className="text-sm text-green-600">
                Verified on {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(data.confirmedAt))}
              </p>
            )}
            <Link href="/profile">
              <Button variant="outline">Back to Profile</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Verify Email" />

      <Card>
        <CardHeader>
          <CardTitle>Email Verification Required</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Badge variant="danger">Unverified</Badge>
            <p className="text-sm text-slate-600">
              Your email <strong>{data.email}</strong> has not been verified yet.
            </p>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium">Why verify?</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Secure your account</li>
              <li>Receive important notifications</li>
              <li>Recover your account if you forget your password</li>
            </ul>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => resendMutation.mutate()}
              disabled={resendMutation.isPending}
            >
              {resendMutation.isPending ? "Sending..." : "Resend Verification Email"}
            </Button>
            <Link href="/profile">
              <Button variant="outline">Back to Profile</Button>
            </Link>
          </div>

          {resendMutation.isSuccess && (
            <p className="text-sm text-green-600">
              Verification email sent! Check your inbox (and spam folder).
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
