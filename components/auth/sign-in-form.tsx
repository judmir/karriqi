"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const signInSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Required"),
});

type SignInValues = z.infer<typeof signInSchema>;

export function SignInForm({ className }: { className?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInValues) {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      router.refresh();
      router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : ROUTES.dashboard);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign-in failed.");
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("space-y-4", className)}
    >
      <div className="space-y-2">
        <Label htmlFor="sign-in-email">Email</Label>
        <Input
          id="sign-in-email"
          type="email"
          autoComplete="email"
          className="min-h-11 md:min-h-9"
          disabled={form.formState.isSubmitting}
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-destructive text-xs">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="sign-in-password">Password</Label>
        <Input
          id="sign-in-password"
          type="password"
          autoComplete="current-password"
          className="min-h-11 md:min-h-9"
          disabled={form.formState.isSubmitting}
          {...form.register("password")}
        />
        {form.formState.errors.password ? (
          <p className="text-destructive text-xs">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        No account?{" "}
        <Link
          href={ROUTES.signUp}
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}
