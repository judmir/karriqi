import type { NoteLabelColor } from "@/types/notes";

/** Badge surface classes per label color (shadcn notes template palette). */
export const labelColorClass: Record<NoteLabelColor, string> = {
  blue: "border-sky-200/80 bg-sky-100 text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/80 dark:text-sky-200",
  green:
    "border-emerald-200/80 bg-emerald-100 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/80 dark:text-emerald-200",
  teal: "border-teal-200/80 bg-teal-100 text-teal-900 dark:border-teal-900/60 dark:bg-teal-950/80 dark:text-teal-200",
  orange:
    "border-amber-200/80 bg-amber-100 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/80 dark:text-amber-200",
  purple:
    "border-violet-200/80 bg-violet-100 text-violet-900 dark:border-violet-900/60 dark:bg-violet-950/80 dark:text-violet-200",
  pink: "border-pink-200/80 bg-pink-100 text-pink-900 dark:border-pink-900/60 dark:bg-pink-950/80 dark:text-pink-200",
  yellow:
    "border-yellow-200/80 bg-yellow-100 text-yellow-900 dark:border-yellow-900/60 dark:bg-yellow-950/80 dark:text-yellow-200",
  red: "border-red-200/80 bg-red-100 text-red-900 dark:border-red-900/60 dark:bg-red-950/80 dark:text-red-200",
  gray: "border-border bg-muted text-muted-foreground",
  white:
    "border-neutral-200/80 bg-white text-neutral-900 dark:border-neutral-600 dark:bg-neutral-100 dark:text-neutral-900",
};

export const labelDotClass: Record<NoteLabelColor, string> = {
  blue: "bg-sky-500",
  green: "bg-emerald-500",
  teal: "bg-teal-500",
  orange: "bg-amber-500",
  purple: "bg-violet-500",
  pink: "bg-pink-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
  gray: "bg-muted-foreground",
  white: "border border-border/80 bg-white dark:border-neutral-500",
};
