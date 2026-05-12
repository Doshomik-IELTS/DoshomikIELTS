"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
      qc.invalidateQueries({ queryKey: ["resources"] });
    },
  });

  const unsaveMutation = useApiMutation<unknown, Record<string, never>>({
    mutationKey: ["unsave-resource", resourceId],
    endpoint: `/api/resources/${resourceId}/save`,
    method: "DELETE",
    onSuccess: () => {
      setSaved(false);
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
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 3h14a1 1 0 0 1 1 1v17.268a2 2 0 0 1-.646 1.425l-5.762 5.243A2 2 0 0 1 12.51 29H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14a1 1 0 0 1 1 1v17.268a2 2 0 0 1-.646 1.425l-5.762 5.243A2 2 0 0 1 12.51 29H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          </svg>
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
          <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 3h14a1 1 0 0 1 1 1v17.268a2 2 0 0 1-.646 1.425l-5.762 5.243A2 2 0 0 1 12.51 29H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          </svg>
          Saved
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h14a1 1 0 0 1 1 1v17.268a2 2 0 0 1-.646 1.425l-5.762 5.243A2 2 0 0 1 12.51 29H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          </svg>
          Save Resource
        </>
      )}
    </Button>
  );
}
