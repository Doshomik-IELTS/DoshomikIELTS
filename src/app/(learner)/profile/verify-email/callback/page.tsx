"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { State } from "@/components/ui/state";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function VerifyEmailCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function handleCallback() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      if (session?.user?.email_confirmed_at) {
        setStatus("success");
        setMessage("Your email has been verified successfully!");
      } else {
        setStatus("error");
        setMessage("Email verification failed. Please try again or contact support.");
      }
    }

    handleCallback();
  }, []);

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <PageHeader title="Verifying email..." />
        <State title="Checking verification status..." variant="loading" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Email Verification" />

      <Card className={status === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <CardHeader>
          <CardTitle className={status === "success" ? "text-green-800" : "text-red-800"}>
            {status === "success" ? "Email Verified" : "Verification Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className={status === "success" ? "text-green-700" : "text-red-700"}>{message}</p>
          <div className="flex gap-3">
            <Link href="/profile">
              <Button variant={status === "success" ? "default" : "outline"}>
                Back to Profile
              </Button>
            </Link>
            {status === "error" && (
              <Link href="/profile/verify-email">
                <Button variant="outline">Try Again</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
