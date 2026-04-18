"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/config/routes";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const signUpSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8, "Use at least 8 characters"),
    confirm: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

type SignUpValues = z.infer<typeof signUpSchema>;

export function SignUpForm({ className }: { className?: string }) {
  const router = useRouter();

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "", confirm: "" },
  });

  async function onSubmit(values: SignUpValues) {
    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${origin}${ROUTES.authCallback}`,
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Check your email to confirm, or sign in if already verified.");
      router.push(ROUTES.signIn);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign-up failed.");
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className={cn("space-y-4", className)}
    >
      <div className="space-y-2">
        <Label htmlFor="sign-up-email">Email</Label>
        <Input
          id="sign-up-email"
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
        <Label htmlFor="sign-up-password">Password</Label>
        <Input
          id="sign-up-password"
          type="password"
          autoComplete="new-password"
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
      <div className="space-y-2">
        <Label htmlFor="sign-up-confirm">Confirm password</Label>
        <Input
          id="sign-up-confirm"
          type="password"
          autoComplete="new-password"
          className="min-h-11 md:min-h-9"
          disabled={form.formState.isSubmitting}
          {...form.register("confirm")}
        />
        {form.formState.errors.confirm ? (
          <p className="text-destructive text-xs">
            {form.formState.errors.confirm.message}
          </p>
        ) : null}
      </div>
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-muted-foreground text-center text-sm">
        Already have an account?{" "}
        <Link
          href={ROUTES.signIn}
          className="text-primary font-medium underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
