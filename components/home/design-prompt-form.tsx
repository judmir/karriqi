"use client";

import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useHomeStore } from "@/stores/home-store";

const EXAMPLES = [
  "Warm minimalist with oak furniture and a reading corner",
  "Cozy Scandinavian bedroom with a queen bed and wardrobe",
  "Functional kitchen with an island and breakfast seating",
];

export function DesignPromptForm({
  roomId,
  onCreated,
  variant = "full",
}: {
  roomId: string;
  onCreated?: (designId: string) => void;
  /** `overlay` renders the compact interaior-style bar for the 3D view. */
  variant?: "full" | "overlay";
}) {
  const generateDesign = useHomeStore((s) => s.generateDesign);
  const [prompt, setPrompt] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = prompt.trim();
    if (text.length < 3) {
      toast.error("Describe how you want the room furnished.");
      return;
    }
    startTransition(() => {
      void (async () => {
        const result = await generateDesign(roomId, text);
        if (!result.ok) return;
        toast.success(
          result.design.warnings.length > 0
            ? "Design created with layout warnings."
            : "Design created.",
        );
        setPrompt("");
        onCreated?.(result.design.id);
      })();
    });
  }

  if (variant === "overlay") {
    return (
      <form onSubmit={submit} className="flex items-end gap-2">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
          }}
          placeholder="Describe a room style…"
          rows={1}
          disabled={pending}
          className={cn(
            "min-h-9 flex-1 resize-none bg-transparent",
            "border-none shadow-none focus-visible:ring-0",
          )}
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Creating…" : "Create ✦"}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the style, mood, and key furniture you want…"
        rows={3}
        disabled={pending}
      />
      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            disabled={pending}
            onClick={() => setPrompt(ex)}
            className="text-muted-foreground hover:text-foreground border-border rounded-full border px-2.5 py-1 text-xs transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Designing…" : "Generate design"}
      </Button>
      <p className="text-muted-foreground text-xs leading-relaxed">
        The AI proposes furniture inside the room&apos;s exact dimensions. It
        cannot change walls, doors, windows, or room size — layouts are
        validated against the floor plan before they are shown.
      </p>
    </form>
  );
}
