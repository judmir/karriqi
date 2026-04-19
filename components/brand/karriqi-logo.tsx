import { cn } from "@/lib/utils";

/**
 * App mark: two adults with a child between — readable at favicon and header sizes.
 */
export function KarriqiLogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <g className="fill-current">
        <rect x="5" y="13" width="8" height="15" rx="3.5" />
        <rect x="19" y="13" width="8" height="15" rx="3.5" />
        <rect x="12.5" y="15.5" width="7" height="12.5" rx="3.5" />
        <circle cx="9" cy="9.5" r="3.25" />
        <circle cx="23" cy="9.5" r="3.25" />
        <circle cx="16" cy="12" r="2.75" />
      </g>
    </svg>
  );
}
