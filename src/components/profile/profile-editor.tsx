"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch } from "@/lib/api/client";
import type { MeResponse } from "@/lib/api/me-types";
import {
  meResponseToFormDefaults,
  profileFormSchema,
  profileFormToApiBody,
  type ProfileFormValues,
} from "@/lib/validators/profile-form";

async function fetchMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>("/api/me");
}

export function ProfileEditor({ initialMe }: { initialMe: MeResponse }) {
  const queryClient = useQueryClient();
  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
    initialData: initialMe,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    values: me ? meResponseToFormDefaults(me) : meResponseToFormDefaults(initialMe),
  });

  const mutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      return apiFetch<MeResponse>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(profileFormToApiBody(values)),
      });
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(["me"], updated);
      toast.success("Profile saved.");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Could not save profile.");
    },
  });

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Learning profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            noValidate
          >
            <div className="space-y-1.5">
              <label htmlFor="profile-name" className="text-sm font-medium text-slate-700">
                Name
              </label>
              <Input id="profile-name" autoComplete="name" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-sm text-red-600" role="alert">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="profile-band" className="text-sm font-medium text-slate-700">
                Target band <span className="text-slate-400">(0–9)</span>
              </label>
              <Input
                id="profile-band"
                type="number"
                inputMode="decimal"
                step="0.5"
                min={0}
                max={9}
                {...form.register("targetBand")}
              />
              {form.formState.errors.targetBand ? (
                <p className="text-sm text-red-600" role="alert">
                  {form.formState.errors.targetBand.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="profile-exam" className="text-sm font-medium text-slate-700">
                Exam date
              </label>
              <Input id="profile-exam" type="date" {...form.register("examDate")} />
              {form.formState.errors.examDate ? (
                <p className="text-sm text-red-600" role="alert">
                  {form.formState.errors.examDate.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="profile-native" className="text-sm font-medium text-slate-700">
                Native language
              </label>
              <Input id="profile-native" autoComplete="language" {...form.register("nativeLanguage")} />
              {form.formState.errors.nativeLanguage ? (
                <p className="text-sm text-red-600" role="alert">
                  {form.formState.errors.nativeLanguage.message}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="profile-goal" className="text-sm font-medium text-slate-700">
                Study goal
              </label>
              <Textarea id="profile-goal" rows={4} {...form.register("studyGoal")} />
              {form.formState.errors.studyGoal ? (
                <p className="text-sm text-red-600" role="alert">
                  {form.formState.errors.studyGoal.message}
                </p>
              ) : null}
            </div>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
