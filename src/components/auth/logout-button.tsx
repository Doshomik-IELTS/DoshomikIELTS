"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const isDevAuthEnabled = process.env.NODE_ENV !== "production";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      if (isDevAuthEnabled) {
        await fetch("/api/dev-auth/logout", { method: "POST" });
      } else {
        const supabase = createSupabaseBrowserClient();
        await supabase.auth.signOut();
      }
      window.location.assign("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button className="logout" variant="outline" onClick={handleLogout} disabled={loading}>
      {loading ? "Logging out..." : "Logout"}
    </Button>
  );
}
