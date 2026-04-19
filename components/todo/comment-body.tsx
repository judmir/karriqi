"use client";

import { cn } from "@/lib/utils";

const MENTION_RE = /(@[^\s@]+)/g;

/** Highlights @mentions for a lightweight “tag someone” feel. */
export function CommentBody({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts = text.split(MENTION_RE);
  return (
    <p className={cn("whitespace-pre-wrap", className)}>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          return (
            <span
              key={i}
              className="text-sky-600 font-medium dark:text-sky-400"
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </p>
  );
}
