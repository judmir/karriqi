"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  removeOwnOpenAiKey,
  setOwnOpenAiKey,
} from "@/lib/home/openai-key-actions";

export function OpenAiApiKeySettings({
  initialHasKey,
  configured,
  hint,
}: {
  initialHasKey: boolean;
  configured: boolean;
  hint: string | null;
}) {
  const router = useRouter();
  const [hasKey, setHasKey] = useState(initialHasKey);
  const [currentHint, setCurrentHint] = useState(hint);
  const [key, setKey] = useState("");
  const [pending, startTransition] = useTransition();

  if (!configured) {
    return (
      <p className="text-muted-foreground text-sm leading-relaxed">
        AI features are not enabled on this server. Ask the admin to set
        <code className="text-foreground/90 mx-1">
          HOME_SECRETS_ENCRYPTION_KEY
        </code>
        (generate with <code className="text-foreground/90">openssl rand -hex 32</code>).
      </p>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed.startsWith("sk-")) {
      toast.error("Enter a valid OpenAI API key (starts with sk-).");
      return;
    }
    startTransition(() => {
      void (async () => {
        const r = await setOwnOpenAiKey(trimmed);
        if (!r.ok) {
          toast.error(r.message);
          return;
        }
        toast.success(hasKey ? "OpenAI key updated." : "OpenAI key saved.");
        setHasKey(true);
        setCurrentHint(trimmed.slice(-4));
        setKey("");
        router.refresh();
      })();
    });
  }

  function onRemove() {
    if (!confirm("Remove your OpenAI key? AI design features will stop working.")) {
      return;
    }
    startTransition(() => {
      void (async () => {
        const r = await removeOwnOpenAiKey();
        if (!r.ok) {
          toast.error(r.message);
          return;
        }
        toast.success("OpenAI key removed.");
        setHasKey(false);
        setCurrentHint(null);
        router.refresh();
      })();
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <p className="text-muted-foreground text-sm leading-relaxed">
        {hasKey
          ? `A key is saved${currentHint ? ` (ends in …${currentHint})` : ""}. Replace or remove it below.`
          : "Add your own OpenAI API key to power the Home apartment planner's AI furnishing and render features. Your key is encrypted at rest and never shown again."}
      </p>
      <div className="space-y-2">
        <Label htmlFor="settings-openai-key">
          {hasKey ? "New API key" : "API key"}
        </Label>
        <Input
          id="settings-openai-key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          className="font-mono"
          placeholder="sk-..."
        />
        <p className="text-muted-foreground text-xs">
          Get one at platform.openai.com. Stored encrypted (AES-256-GCM); used
          server-side only.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : hasKey ? "Update key" : "Test & save key"}
        </Button>
        {hasKey ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onRemove}
          >
            Remove key
          </Button>
        ) : null}
      </div>
    </form>
  );
}
