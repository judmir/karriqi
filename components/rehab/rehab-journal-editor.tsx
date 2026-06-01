"use client";

import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import { RehabMarkdown } from "@/components/rehab/rehab-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ROUTES } from "@/config/routes";
import { saveJournalEntry } from "@/lib/rehab/journal-actions";
import { cn } from "@/lib/utils";

export function RehabJournalEditor({
  entryDate,
  initialBody,
  persistence,
}: {
  entryDate: string;
  initialBody: string;
  persistence: boolean;
}) {
  const router = useRouter();
  const [body, setBody] = useState(initialBody);
  const [preview, setPreview] = useState(false);
  const [pending, setPending] = useState(false);

  const dateLabel = format(parseISO(`${entryDate}T12:00:00`), "PPPP");

  const shiftDay = useCallback(
    (delta: number) => {
      const d = parseISO(`${entryDate}T12:00:00`);
      d.setDate(d.getDate() + delta);
      const next = format(d, "yyyy-MM-dd");
      router.push(`${ROUTES.rehabJournal}?date=${next}`);
    },
    [entryDate, router],
  );

  async function handleSave() {
    if (!persistence) {
      toast.success("Journal saved locally (demo mode).");
      return;
    }

    setPending(true);
    try {
      const result = await saveJournalEntry({ entryDate, body });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Journal saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-4 px-4 pb-8 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => shiftDay(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-medium">{dateLabel}</span>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => shiftDay(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPreview((p) => !p)}
          >
            {preview ? "Edit" : "Preview"}
          </Button>
          <Button type="button" size="sm" onClick={() => void handleSave()} disabled={pending}>
            <Save className="size-4" />
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {preview ? (
        <div className="rounded-lg border border-border bg-card p-4 md:p-6">
          <RehabMarkdown content={body} />
        </div>
      ) : (
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className={cn("min-h-[420px] font-mono text-sm leading-relaxed")}
          placeholder="Write today's journal in markdown…"
        />
      )}

      <p className="text-muted-foreground text-xs">
        Markdown supported. Use Rehab → Today for daily tasks; this journal is for ratings and notes.
      </p>
    </div>
  );
}

export function RehabJournalTodayLink({ date }: { date: string }) {
  return (
    <Link
      href={`${ROUTES.rehabJournal}?date=${date}`}
      className="text-primary text-sm font-medium hover:underline"
    >
      Open journal
    </Link>
  );
}
