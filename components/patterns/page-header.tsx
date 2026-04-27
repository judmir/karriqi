export function PageHeader({ segments }: { segments: string[] }) {
  if (segments.length === 0) return null;
  return (
    <header>
      <nav aria-label="Breadcrumb" className="text-sm">
        <ol className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {segments.map((label, i) => {
            const isLast = i === segments.length - 1;
            return (
              <li
                key={`${i}-${label}`}
                className="flex min-w-0 items-center gap-1.5"
              >
                {i > 0 ? (
                  <span aria-hidden className="text-muted-foreground/50">
                    /
                  </span>
                ) : null}
                <span
                  className={
                    isLast
                      ? "text-foreground font-medium"
                      : "min-w-0 truncate"
                  }
                  aria-current={isLast ? "page" : undefined}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
    </header>
  );
}
