import { PageContainer } from "@/components/layout/page-container";
import { ListPlaceholder } from "@/components/patterns/list-placeholder";

export function MainRouteFallback() {
  return (
    <PageContainer width="wide">
      <div
        className="animate-pulse space-y-8"
        role="status"
        aria-label="Loading page"
      >
        <div className="space-y-3">
          <div className="bg-muted h-3 w-24 rounded-md" />
          <div className="bg-muted h-7 w-40 rounded-lg" />
        </div>
        <ListPlaceholder rows={5} />
      </div>
    </PageContainer>
  );
}

export function TodoTaskRouteFallback() {
  return (
    <PageContainer>
      <div
        className="animate-pulse space-y-8"
        role="status"
        aria-label="Loading task"
      >
        <div className="space-y-3">
          <div className="bg-muted h-4 w-28 rounded-md" />
          <div className="bg-muted h-3 w-16 rounded-md" />
        </div>
        <div className="bg-muted h-9 w-2/3 max-w-md rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-muted h-8 rounded-lg" />
          ))}
        </div>
        <div className="bg-muted h-40 rounded-xl" />
      </div>
    </PageContainer>
  );
}

export function RehabEventRouteFallback() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-x-hidden px-4 py-6 md:px-6"
      role="status"
      aria-label="Loading task"
    >
      <div className="bg-muted mb-4 h-8 w-20 animate-pulse rounded-md" />
      <div className="bg-muted h-40 animate-pulse rounded-lg" />
    </div>
  );
}

export function pathnameFromHref(href: string): string {
  const trimmed = href.trim();
  if (!trimmed) return "/";
  const withoutHash = trimmed.split("#")[0] ?? trimmed;
  const withoutQuery = withoutHash.split("?")[0] ?? withoutHash;
  return withoutQuery || "/";
}

export function RouteInstantFallback({ href }: { href: string }) {
  const pathname = pathnameFromHref(href);

  if (/^\/kanban\/[^/]+$/.test(pathname)) {
    return <TodoTaskRouteFallback />;
  }

  if (/^\/rehab\/events\/[^/]+$/.test(pathname)) {
    return <RehabEventRouteFallback />;
  }

  return <MainRouteFallback />;
}
