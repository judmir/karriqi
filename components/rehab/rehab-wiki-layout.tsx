"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { RehabMarkdown } from "@/components/rehab/rehab-markdown";
import { ROUTES, rehabWikiPath } from "@/config/routes";
import { cn } from "@/lib/utils";
import type { RehabWikiPage } from "@/types/rehab";

export function RehabWikiLayout({
  pages,
  activeSlug,
  children,
}: {
  pages: RehabWikiPage[];
  activeSlug: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const wikiPages = pages.filter((p) => p.slug !== "overview");

  return (
    <div className="flex w-full flex-col gap-6 px-4 pb-8 md:flex-row md:px-6">
      <aside className="md:w-52 md:shrink-0 lg:w-56">
        <nav className="flex flex-row gap-1 overflow-x-auto pb-2 md:flex-col md:gap-0.5 md:overflow-visible md:pb-0">
          <WikiNavLink
            href={ROUTES.rehabWikiOverview}
            active={pathname === ROUTES.rehabWikiOverview || activeSlug === "overview"}
          >
            Overview
          </WikiNavLink>
          {wikiPages.map((page) => (
            <WikiNavLink
              key={page.slug}
              href={rehabWikiPath(page.slug)}
              active={activeSlug === page.slug}
            >
              {page.title}
            </WikiNavLink>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function WikiNavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition md:w-full",
        active
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function RehabWikiPageView({ page }: { page: RehabWikiPage }) {
  return (
    <article className="space-y-4">
      <h2 className="font-heading text-xl font-semibold tracking-tight md:text-2xl">
        {page.title}
      </h2>
      <RehabMarkdown content={page.body} />
    </article>
  );
}
