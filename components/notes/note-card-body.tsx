"use client";

import Image from "next/image";

import { Checkbox } from "@/components/ui/checkbox";
import { parseChecklistLines, isChecklistNote } from "@/lib/notes/checklist";
import { notePreview } from "@/lib/notes/filter-notes";
import { cn } from "@/lib/utils";

export function NoteCardBody({
  title,
  content,
  imageUrl,
  onToggleChecklistLine,
}: {
  title: string;
  content: string;
  imageUrl?: string | null;
  onToggleChecklistLine?: (lineIndex: number) => void;
}) {
  const checklist = parseChecklistLines(content);
  const hasChecklist = isChecklistNote(content);

  const introText = hasChecklist
    ? content
        .split("\n")
        .filter((line) => !line.match(/^(\s*)- \[([ xX])\]/))
        .join("\n")
        .trim()
    : content.trim();

  return (
    <>
      {imageUrl ? (
        <div className="relative -mx-4 -mt-4 mb-3 aspect-[16/10] overflow-hidden rounded-t-xl sm:-mx-5 sm:-mt-5">
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 320px"
            unoptimized
          />
        </div>
      ) : null}

      <h3 className="font-heading text-base leading-snug font-semibold">{title}</h3>

      {hasChecklist ? (
        <ul className="space-y-2 pt-1">
          {checklist.map((item) => (
            <li
              key={item.index}
              className="flex items-start gap-2 text-sm"
              onClick={(event) => event.stopPropagation()}
            >
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => onToggleChecklistLine?.(item.index)}
                className="mt-0.5"
              />
              <span
                className={cn(
                  "text-foreground/90",
                  item.checked && "text-muted-foreground line-through",
                )}
              >
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {!hasChecklist && introText ? (
        <p className="text-muted-foreground line-clamp-6 text-sm whitespace-pre-wrap">
          {notePreview(introText, 280)}
        </p>
      ) : null}

      {hasChecklist && introText ? (
        <p className="text-muted-foreground text-sm whitespace-pre-wrap">{introText}</p>
      ) : null}
    </>
  );
}
