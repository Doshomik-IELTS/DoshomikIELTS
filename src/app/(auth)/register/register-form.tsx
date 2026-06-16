"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterValues } from "@/lib/validators/auth";
import { useApiMutation } from "@/lib/hooks/api";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const isDevAuthEnabled = process.env.NODE_ENV !== "production";

export function RegisterForm({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const router = useRouter();
  const [supabaseLoading, setSupabaseLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const registerMutation = useApiMutation<{ success: boolean }, RegisterValues>({
    mutationKey: ["auth", "register"],
    endpoint: "/api/dev-auth/register",
    onSuccess: () => {
      router.push("/dashboard");
      router.refresh();
    },
  });

  const onSubmit = async (data: RegisterValues) => {
    if (isDevAuthEnabled) {
      registerMutation.mutate(data);
      return;
    }

    setSupabaseLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
        },
      },
    });
    setSupabaseLoading(false);

    if (error) {
      toast.error(error.message || "Registration failed");
      return;
    }

    if (authData.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    toast.success("Account created. Check your email to confirm your account.");
    router.push("/login");
  };

  const isLoading = registerMutation.isPending || supabaseLoading;

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div>
        <Label htmlFor="name" className={variant === "dark" ? "text-slate-300" : "text-midnight-text"}>Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="name"
            placeholder="Your name"
            className={
              variant === "dark"
                ? "border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                : "border-slate-300 bg-white pl-10 text-midnight-text placeholder:text-grey focus:border-primary focus:ring-primary"
            }
            {...register("name")}
          />
        </div>
        {errors.name && <p className="text-sm text-red-400">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="email" className={variant === "dark" ? "text-slate-300" : "text-midnight-text"}>Email</Label>
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
      <div>
        <Label htmlFor="password" className={variant === "dark" ? "text-slate-300" : "text-midnight-text"}>Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="password"
            type="password"
            placeholder="At least 8 characters"
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
      <div>
        <Label htmlFor="confirmPassword" className={variant === "dark" ? "text-slate-300" : "text-midnight-text"}>Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Repeat your password"
            className={
              variant === "dark"
                ? "border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500 focus:border-primary focus:ring-primary"
                : "border-slate-300 bg-white pl-10 text-midnight-text placeholder:text-grey focus:border-primary focus:ring-primary"
            }
            {...register("confirmPassword")}
          />
        </div>
        {errors.confirmPassword && <p className="text-sm text-red-400">{errors.confirmPassword.message}</p>}
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
}
