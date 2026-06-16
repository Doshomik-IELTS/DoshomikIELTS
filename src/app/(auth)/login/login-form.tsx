"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginValues } from "@/lib/validators/auth";
import { useApiMutation } from "@/lib/hooks/api";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const isDevAuthEnabled = process.env.NODE_ENV !== "production";

export function LoginForm({
  nextPath,
  role = "learner",
  variant = "dark",
}: {
  nextPath: string;
  role?: "learner" | "admin";
  variant?: "dark" | "light";
}) {
  const [isMounted, setIsMounted] = useState(false);
  const redirectTarget = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useApiMutation<{ role?: "learner" | "admin" }, LoginValues & { role?: string }>({
    mutationKey: ["auth", "login"],
    endpoint: "/api/dev-auth/login",
    onSuccess: (data) => {
      toast.success("Logged in successfully");
      // Always redirect based on role - admin goes to /admin, learner goes to dashboard or nextPath
      const redirectTo = data.role === "admin" ? "/admin" : (redirectTarget === "/admin" ? "/dashboard" : redirectTarget);
      window.location.assign(redirectTo);
    },
    onError: (error) => {
      toast.error(error.message || "Login failed");
    },
  });

  const onSubmit = async (data: LoginValues) => {
    if (isDevAuthEnabled) {
      loginMutation.mutate({ ...data, role });
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      toast.error(error.message || "Login failed");
      return;
    }

    toast.success("Logged in successfully");
    window.location.assign(redirectTarget);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-2">
        <Label htmlFor="email" className={variant === "dark" ? "text-slate-300" : "text-midnight-text"}>
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className={
              variant === "dark"
                ? "border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                : "border-slate-300 bg-white pl-10 text-midnight-text placeholder:text-grey focus:border-primary focus:ring-primary"
            }
            {...register("email")}
          />
        </div>
        {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className={variant === "dark" ? "text-slate-300" : "text-midnight-text"}>
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className={
              variant === "dark"
                ? "border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                : "border-slate-300 bg-white pl-10 text-midnight-text placeholder:text-grey focus:border-primary focus:ring-primary"
            }
            {...register("password")}
          />
        </div>
        {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
      </div>

      <div className="flex items-center justify-end">
        <Link href="/reset-password" className={`text-sm ${variant === "dark" ? "text-blue-400 hover:text-blue-300" : "text-primary hover:text-primary-hover"}`}>
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!isMounted || loginMutation.isPending}
      >
        {loginMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
