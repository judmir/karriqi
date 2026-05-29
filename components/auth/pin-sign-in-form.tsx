"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

// Mirrors PIN_MIN_LENGTH / PIN_MAX_LENGTH on the server.
const PIN_MIN = 4;
const PIN_MAX = 8;
// Auto-submit when the user reaches one of these lengths; they can still hit
// Enter earlier to submit a shorter (still ≥ PIN_MIN) PIN.
const AUTO_SUBMIT_LENGTHS = new Set([PIN_MIN, 6]);

function autoSubmitHint(): string {
  const lengths = [...AUTO_SUBMIT_LENGTHS].sort((a, b) => a - b);
  if (lengths.length === 1) return `${lengths[0]} digits`;
  const last = lengths.pop();
  return `${lengths.join(", ")} or ${last} digits`;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const localDevPinHint =
  supabaseUrl.includes("127.0.0.1") || supabaseUrl.includes("localhost")
    ? "Local dev PIN: 123456 (dev) or 654321 (partner)."
    : null;

function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//")
    ? next
    : ROUTES.dashboard;
}

export function PinSignInForm({
  className,
  onUseEmail,
}: {
  className?: string;
  onUseEmail?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (retryAfter == null || retryAfter <= 0) return;
    const id = setInterval(() => {
      setRetryAfter((s) => (s == null ? null : s - 1 <= 0 ? null : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [retryAfter]);

  async function submit(value: string) {
    if (submitting) return;
    if (value.length < PIN_MIN) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/pin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pin: value }),
      });
      if (res.ok) {
        const target = safeNext(searchParams.get("next"));
        router.refresh();
        router.push(target);
        return;
      }
      const retryHeader = res.headers.get("retry-after");
      if (retryHeader) {
        const seconds = Number.parseInt(retryHeader, 10);
        if (Number.isFinite(seconds) && seconds > 0) {
          setRetryAfter(seconds);
        }
      }
      let message = "Incorrect PIN.";
      try {
        const json = (await res.json()) as { message?: string };
        if (json.message) message = json.message;
      } catch {
        // ignore
      }
      toast.error(message);
      setPin("");
      inputRef.current?.focus();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign-in failed.");
      setPin("");
    } finally {
      setSubmitting(false);
    }
  }

  function handleChange(raw: string) {
    const digits = raw.replace(/\D+/g, "").slice(0, PIN_MAX);
    setPin(digits);
    if (AUTO_SUBMIT_LENGTHS.has(digits.length) && !submitting) {
      void submit(digits);
    }
  }

  return (
    <form
      className={cn("space-y-4", className)}
      onSubmit={(e) => {
        e.preventDefault();
        void submit(pin);
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="sign-in-pin">PIN</Label>
        <Input
          ref={inputRef}
          id="sign-in-pin"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          autoFocus
          maxLength={PIN_MAX}
          value={pin}
          onChange={(e) => handleChange(e.target.value)}
          disabled={submitting || retryAfter != null}
          aria-describedby="sign-in-pin-hint"
          className="min-h-11 text-center font-mono text-2xl tracking-[0.4em] md:min-h-12"
        />
        <p id="sign-in-pin-hint" className="text-muted-foreground text-xs">
          {retryAfter
            ? `Too many tries — wait ${retryAfter}s before trying again.`
            : localDevPinHint
              ? `${localDevPinHint} Auto-submits at ${autoSubmitHint()}.`
              : `Enter your ${PIN_MIN}-${PIN_MAX} digit PIN. Auto-submits at ${autoSubmitHint()}.`}
        </p>
      </div>
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={submitting || retryAfter != null || pin.length < PIN_MIN}
      >
        {submitting ? "Signing in…" : "Sign in with PIN"}
      </Button>
      {onUseEmail ? (
        <button
          type="button"
          onClick={onUseEmail}
          className="text-muted-foreground hover:text-foreground w-full text-center text-xs underline-offset-4 hover:underline"
        >
          Use email & password instead
        </button>
      ) : null}
    </form>
  );
}
