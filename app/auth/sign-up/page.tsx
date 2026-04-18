import { SignUpForm } from "@/components/auth/sign-up-form";
import { SupabaseRequired } from "@/components/auth/supabase-required";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/env";

export default function SignUpPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseRequired />;
  }

  return (
    <Card className="border-border/80 shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Create account</CardTitle>
        <CardDescription>
          Sign up is wired to Supabase Auth. Confirm email if your project
          requires it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm />
      </CardContent>
    </Card>
  );
}
