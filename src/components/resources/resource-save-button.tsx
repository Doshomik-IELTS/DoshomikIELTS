"use client";

import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { captureLearnerEvent } from "@/lib/analytics/posthog";
import { useApiMutation } from "@/lib/hooks/api";

type ResourceSaveButtonProps = {
  resourceId: string;
  initialSaved: boolean;
  variant?: "icon" | "button";
};

export function ResourceSaveButton({
  resourceId,
  initialSaved,
  variant = "button",
}: ResourceSaveButtonProps) {
  const [saved, setSaved] = useState(initialSaved);
  const qc = useQueryClient();

  const saveMutation = useApiMutation<unknown, Record<string, never>>({
    mutationKey: ["save-resource", resourceId],
    endpoint: `/api/resources/${resourceId}/save`,
    onSuccess: () => {
      setSaved(true);
      captureLearnerEvent("ielts_resource_saved", { resource_id: resourceId });
      qc.invalidateQueries({ queryKey: ["resources"] });
    },
  });

  const unsaveMutation = useApiMutation<unknown, Record<string, never>>({
    mutationKey: ["unsave-resource", resourceId],
    endpoint: `/api/resources/${resourceId}/save`,
    method: "DELETE",
    onSuccess: () => {
      setSaved(false);
      captureLearnerEvent("ielts_resource_unsaved", { resource_id: resourceId });
      qc.invalidateQueries({ queryKey: ["resources"] });
    },
  });

  const isPending = saveMutation.isPending || unsaveMutation.isPending;

  async function handleToggle() {
    if (isPending) return;
    if (saved) {
      unsaveMutation.mutate({});
    } else {
      saveMutation.mutate({});
    }
  }

  if (variant === "icon") {
    return (
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="p-1.5 rounded-md hover:bg-slate-100 transition-colors disabled:opacity-50"
        title={saved ? "Remove from saved" : "Save resource"}
        aria-label={saved ? "Remove from saved" : "Save resource"}
      >
        {saved ? (
          <BookmarkCheck className="h-5 w-5 text-blue-600" />
        ) : (
          <Bookmark className="h-5 w-5 text-slate-400" />
        )}
      </button>
    );
  }

  return (
    <Button
      onClick={handleToggle}
      disabled={isPending}
      variant={saved ? "secondary" : "outline"}
      size="sm"
    >
      {isPending ? (
        "..."
      ) : saved ? (
        <>
          <BookmarkCheck className="h-4 w-4" />
          Saved
        </>
      ) : (
        <>
          <Bookmark className="h-4 w-4" />
          Save Resource
        </>
      )}
    </Button>
  );
}
