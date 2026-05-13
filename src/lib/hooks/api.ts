"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ApiEnvelope } from "@/lib/api/response";

interface ApiError {
  error?: { message?: string };
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "error" in error) {
    const apiError = error as ApiError;
    return apiError.error?.message ?? "An error occurred";
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred";
}

function isApiEnvelope<TData>(payload: unknown): payload is ApiEnvelope<TData> {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "data" in payload &&
    "error" in payload
  );
}

async function parseApiResponse<TData>(response: Response): Promise<TData> {
  const payload = (await response.json()) as unknown;

  if (isApiEnvelope<TData>(payload)) {
    if (!response.ok || payload.error) {
      throw new Error(payload.error?.message ?? "Request failed");
    }
    return payload.data;
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(payload));
  }

  return payload as TData;
}

export function useApiMutation<TData, TVariables>({
  mutationKey,
  endpoint,
  onSuccess,
  onError,
  method = "POST",
}: {
  mutationKey: string[];
  endpoint: string;
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
  method?: "POST" | "DELETE";
}) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationKey,
    mutationFn: async (variables) => {
      const response = await fetch(endpoint, {
        method,
        headers: method === "POST" ? { "Content-Type": "application/json" } : {},
        body: method === "POST" ? JSON.stringify(variables) : undefined,
      });
      return parseApiResponse<TData>(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: mutationKey.slice(0, 1) });
      onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message);
      onError?.(error);
    },
  });
}

export function useApiQuery<TData>({
  queryKey,
  endpoint,
  enabled = true,
  refetchInterval,
}: {
  queryKey: string[];
  endpoint: string;
  enabled?: boolean;
  refetchInterval?: number | false;
}) {
  return useQuery<TData, Error>({
    queryKey,
    queryFn: async () => {
      const response = await fetch(endpoint);
      return parseApiResponse<TData>(response);
    },
    enabled,
    refetchInterval,
  });
}
