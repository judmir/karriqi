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
      className={cn("divide-border border-border divide-y rounded-xl border", className)}
      aria-hidden
    >
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 px-4 py-4"
        >
          <div className="bg-muted size-10 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="bg-muted h-3 max-w-[55%] rounded-md" />
            <div className="bg-muted/80 h-2.5 max-w-[35%] rounded-md" />
          </div>
        </li>
      ))}
    </ul>
  );
}
