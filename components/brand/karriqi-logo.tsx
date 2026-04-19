import { cn } from "@/lib/utils";

/**
 * Heart-shaped family mark: two adults forming the lobes, child centered with a
 * halo ring and embrace curves (negative space uses page background).
 */
export function KarriqiLogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {/* Heart base */}
      <path
        className="fill-current"
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
      />
      {/* Curved “embrace” gaps (match page background) */}
      <path
        d="M 5.2 12.8 Q 8.2 9.2 10.5 11.8"
        fill="none"
        stroke="var(--background)"
        strokeWidth="3.1"
        strokeLinecap="round"
      />
      <path
        d="M 18.8 12.8 Q 15.8 9.2 13.5 11.8"
        fill="none"
        stroke="var(--background)"
        strokeWidth="3.1"
        strokeLinecap="round"
      />
      {/* Child: halo ring + head */}
      <circle cx="12" cy="14.2" r="4.85" fill="var(--background)" />
      <circle cx="12" cy="14.2" r="2.45" className="fill-current" />
      {/* Child body (small mass at bottom center) */}
      <ellipse cx="12" cy="19.2" rx="2.2" ry="1.35" className="fill-current" />
      {/* Adult heads on upper lobes */}
      <circle cx="7.2" cy="5.9" r="2.45" className="fill-current" />
      <circle cx="16.8" cy="5.9" r="2.45" className="fill-current" />
    </svg>
  );
}
