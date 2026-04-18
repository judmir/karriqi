import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";
import { SupabaseRequired } from "@/components/auth/supabase-required";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/env";

export default function SignInPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseRequired />;
  }

  return (
    <Card className="border-border/80 shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>
          Use your Supabase Auth credentials. This UI is intentionally minimal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
          <SignInForm />
        </Suspense>
      </CardContent>
    </Card>
  );
}
