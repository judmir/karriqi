"use client";

import { usePathname } from "next/navigation";

import { resolvePageTitle } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function MainSectionTitle({ className }: { className?: string }) {
  const pathname = usePathname();
  const title = resolvePageTitle(pathname);

  if (!title) return null;

  return (
    <header className={cn("shrink-0 px-4 pt-4 md:px-6 md:pt-6", className)}>
      <h1 className="font-heading text-2xl font-semibold tracking-tight md:text-3xl">
        {title}
      </h1>
    </header>
  );
}
