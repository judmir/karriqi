import { Suspense } from "react";

import { SignInSwitcher } from "@/components/auth/sign-in-switcher";
import { SupabaseRequired } from "@/components/auth/supabase-required";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isDevQuickSignInEnabled } from "@/lib/auth/local-dev-auth";
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
          {isDevQuickSignInEnabled()
            ? "Pick a test user below, use a PIN, or fall back to email and password."
            : "Type your PIN, or fall back to your email and password. There is no public registration."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
          <SignInSwitcher devQuickSignIn={isDevQuickSignInEnabled()} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
