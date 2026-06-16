"use client";

import { usePathname } from "next/navigation";

import { pathnameFromHref } from "@/components/layout/route-fallbacks";
import { useInstantNavigation } from "@/components/providers/instant-navigation-provider";
import { resolvePageTitle } from "@/config/navigation";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

export function MainSectionTitle({ className }: { className?: string }) {
  const pathname = usePathname();
  const { pendingHref } = useInstantNavigation();
  const displayPath = pendingHref ? pathnameFromHref(pendingHref) : pathname;
  const title = resolvePageTitle(displayPath);

  if (
    !title ||
    displayPath === ROUTES.rehabPlan ||
    displayPath.startsWith(`${ROUTES.rehabPlan}/`) ||
    displayPath === ROUTES.rehabClinical ||
    displayPath.startsWith(`${ROUTES.rehabClinical}/`) ||
    displayPath === ROUTES.rehabPlanList ||
    displayPath.startsWith(`${ROUTES.rehabPlanList}/`)
  ) {
    return null;
  }

  return (
    <header className={cn("shrink-0 px-4 pt-4 md:px-6 md:pt-6", className)}>
      <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
        {title}
      </h1>
    </header>
  );
}
