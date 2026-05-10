"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginValues } from "@/lib/validators/auth";
import { useApiMutation } from "@/lib/hooks/api";

export function LoginForm({
  nextPath,
  role = "learner",
}: {
  nextPath: string;
  role?: "learner" | "admin";
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useApiMutation<{ success: boolean }, LoginValues & { role?: string }>({
    mutationKey: ["auth", "login"],
    endpoint: "/api/dev-auth/login",
    onSuccess: () => {
      toast.success("Logged in successfully");
      router.push(nextPath);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Login failed");
    },
  });

  const onSubmit = (data: LoginValues) => {
    loginMutation.mutate({ ...data, role });
  };

  return (
    <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }}>
      <div className="space-y-2">
        <Label htmlFor="email" className="text-slate-300">
          Email
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
            {...register("email")}
          />
        </div>
        {errors.email && <p className="text-sm text-red-400">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-slate-300">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500"
            {...register("password")}
          />
        </div>
        {errors.password && <p className="text-sm text-red-400">{errors.password.message}</p>}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-400">Remember me</span>
        </label>
        <Link href="/reset-password" className="text-sm text-blue-400 hover:text-blue-300">
          Forgot password?
        </Link>
      </div>

      <Button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700"
        disabled={loginMutation.isPending}
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