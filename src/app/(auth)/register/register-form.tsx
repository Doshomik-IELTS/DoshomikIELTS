"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerSchema, type RegisterValues } from "@/lib/validators/auth";
import { useApiMutation } from "@/lib/hooks/api";

export function RegisterForm() {
  const router = useRouter();
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

  const onSubmit = (data: RegisterValues) => {
    registerMutation.mutate(data);
  };

  return (
    <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }}>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} />
        {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
        {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
      </div>
      <Button className="w-full" type="submit" disabled={registerMutation.isPending}>
        {registerMutation.isPending ? "Creating account..." : "Register"}
      </Button>
      <p className="text-sm text-slate-600">
        Already have an account? <Link href="/login">Login</Link>
      </p>
    </form>
  );
}