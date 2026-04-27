import { HouseHeart } from "lucide-react";

import { cn } from "@/lib/utils";

/** Shared Karriqi brand mark used across mobile and desktop surfaces. */
export function KarriqiLogoMark({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[5px] bg-[#020202] text-primary",
        className,
      )}
      aria-hidden
    >
      <HouseHeart
        className={cn("size-[62.5%] shrink-0", iconClassName)}
        aria-hidden
      />
    </span>
  );
}
