import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BellRing, Workflow } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/patterns/page-header";
import { PlaceholderPage } from "@/components/patterns/placeholder-page";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROUTES } from "@/config/routes";
import { getDevMenuAccess } from "@/lib/auth/dev-menu-actions";
import { isSupabaseConfigured } from "@/lib/env";

const devTools = [
  {
    href: ROUTES.devPush,
    title: "Push notifications",
    description:
      "Send dev-only test pushes to your saved browser subscriptions.",
    icon: BellRing,
    cta: "Open push tools",
  },
  {
    href: ROUTES.devArchitecture,
    title: "Architecture diagram",
    description:
      "Explore the app features, business flows, and supporting services.",
    icon: Workflow,
    cta: "Open diagram",
  },
];

export default async function DevPage() {
  if (!isSupabaseConfigured()) {
    return (
      <PageContainer>
        <PlaceholderPage
          segments={["Dev"]}
          note="Connect Supabase to use dev tools."
        />
      </PageContainer>
    );
  }

  const allowed = await getDevMenuAccess();
  if (!allowed) {
    redirect(ROUTES.dashboard);
  }

  return (
    <PageContainer>
      <div className="space-y-8">
        <PageHeader segments={["Dev"]} />
        <div className="space-y-3">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            Dev tools
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Maintainer-only tools for validating app behavior and keeping the
            product architecture visible as Karriqi grows.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {devTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <Card key={tool.href} className="h-full">
                <CardHeader>
                  <div className="bg-primary/10 text-primary mb-2 inline-flex size-10 items-center justify-center rounded-xl">
                    <Icon className="size-5" aria-hidden />
                  </div>
                  <CardTitle>{tool.title}</CardTitle>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link
                    href={tool.href}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    {tool.cta}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </PageContainer>
  );
}
