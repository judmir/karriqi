import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { ROUTES } from "@/config/routes";
import { getSessionUser } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const user = await getSessionUser();

  return (
    <div className="from-background via-background to-muted/30 flex min-h-[100dvh] flex-col bg-gradient-to-b">
      <main className="flex flex-1 flex-col justify-center px-6 py-16">
        <div className="mx-auto w-full max-w-lg space-y-8">
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
              Phase 1 scaffold
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Karriqi
            </h1>
            <p className="text-muted-foreground max-w-prose text-base leading-relaxed">
              A calm, mobile-first shell for your family’s apps — shopping,
              tasks, calendar, and more. Features are placeholders until phase 2.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {user ? (
              <Link
                href={ROUTES.dashboard}
                className={cn(buttonVariants({ size: "lg" }), "min-h-11 w-full sm:w-auto")}
              >
                Open app
              </Link>
            ) : (
              <Link
                href={ROUTES.signIn}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "min-h-11 w-full sm:w-auto",
                )}
              >
                Sign in
              </Link>
            )}
          </div>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Household accounts are added in Supabase; use Sign in with your
            email. · Installable PWA · Next.js, Tailwind, shadcn/ui.
          </p>
        </div>
      </main>
    </div>
  );
}
