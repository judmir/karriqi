"use client";

import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

/** GFM ignores single newlines; treat each line as its own row in note cards. */
function normalizeNoteMarkdown(content: string): string {
  return content
    .split("\n")
    .map((line) => line.trimEnd())
    .join("  \n");
}

function NoteMarkdownLink({
  href,
  children,
  ...props
}: ComponentProps<"a">) {
  const external = href?.startsWith("http");

  return (
    <a
      href={href}
      {...props}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={(event) => event.stopPropagation()}
      className="text-primary underline-offset-2 hover:underline"
    >
      {children}
    </a>
  );
}

export function NoteMarkdown({
  content,
  className,
  clamp,
}: {
  content: string;
  className?: string;
  clamp?: boolean;
}) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-p:my-0.5 prose-p:leading-relaxed prose-strong:font-semibold prose-strong:text-foreground",
        "prose-a:font-normal",
        clamp && "line-clamp-6",
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: NoteMarkdownLink,
        }}
      >
        {normalizeNoteMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
