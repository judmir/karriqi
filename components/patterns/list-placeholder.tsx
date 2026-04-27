import { cn } from "@/lib/utils";

export function ListPlaceholder({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "divide-border border-border bg-card divide-y rounded-2xl border",
        className,
      )}
      aria-hidden
    >
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-center gap-3 px-5 py-4">
          <div className="bg-muted/60 size-10 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="bg-muted/60 h-3 max-w-[55%] rounded-md" />
            <div className="bg-muted/40 h-2.5 max-w-[35%] rounded-md" />
          </div>
        </li>
      ))}
    </ul>
  );
}
