"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { removeOwnPin, setOwnPin } from "@/lib/auth/pin-actions";

const PIN_MIN = 4;
const PIN_MAX = 8;

export function PinSettingsForm({
  initialHasPin,
  configured,
}: {
  initialHasPin: boolean;
  configured: boolean;
}) {
  const router = useRouter();
  const [hasPin, setHasPin] = useState(initialHasPin);
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pending, startTransition] = useTransition();

  if (!configured) {
    return (
      <p className="text-muted-foreground text-sm leading-relaxed">
        PIN sign-in is not enabled on this server. Ask the admin to set
        <code className="text-foreground/90 mx-1">AUTH_PIN_PEPPER</code>
        and
        <code className="text-foreground/90 mx-1">
          SUPABASE_SERVICE_ROLE_KEY
        </code>
        in the environment.
      </p>
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!/^[0-9]+$/.test(pin) || pin.length < PIN_MIN || pin.length > PIN_MAX) {
      toast.error(`Use ${PIN_MIN}-${PIN_MAX} digits.`);
      return;
    }
    if (pin !== confirmPin) {
      toast.error("PINs don't match.");
      return;
    }
    startTransition(() => {
      void (async () => {
        const r = await setOwnPin(pin);
        if (!r.ok) {
          toast.error(r.message);
          return;
        }
        toast.success(hasPin ? "PIN updated." : "PIN set.");
        setHasPin(true);
        setPin("");
        setConfirmPin("");
        router.refresh();
      })();
    });
  }

  function onRemove() {
    if (!confirm("Remove your PIN? You'll need email + password to sign in next time.")) {
      return;
    }
    startTransition(() => {
      void (async () => {
        const r = await removeOwnPin();
        if (!r.ok) {
          toast.error(r.message);
          return;
        }
        toast.success("PIN removed.");
        setHasPin(false);
        router.refresh();
      })();
    });
  }

  function handleDigit(setter: (v: string) => void, raw: string) {
    setter(raw.replace(/\D+/g, "").slice(0, PIN_MAX));
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <p className="text-muted-foreground text-sm leading-relaxed">
        {hasPin
          ? "A PIN is set. Replace it below or remove it."
          : "Set a personal PIN to sign in quickly. Pick something unique within the household — if another member already uses the same digits, you'll be asked to choose another."}
      </p>
      <div className="space-y-2">
        <Label htmlFor="settings-pin-new">
          {hasPin ? "New PIN" : "PIN"}
        </Label>
        <Input
          id="settings-pin-new"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="new-password"
          maxLength={PIN_MAX}
          value={pin}
          onChange={(e) => handleDigit(setPin, e.target.value)}
          className="font-mono tracking-[0.4em]"
          placeholder={"•".repeat(PIN_MIN)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="settings-pin-confirm">Confirm</Label>
        <Input
          id="settings-pin-confirm"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="new-password"
          maxLength={PIN_MAX}
          value={confirmPin}
          onChange={(e) => handleDigit(setConfirmPin, e.target.value)}
          className="font-mono tracking-[0.4em]"
          placeholder={"•".repeat(PIN_MIN)}
        />
        <p className="text-muted-foreground text-xs">
          {PIN_MIN}-{PIN_MAX} digits. Stored hashed with a server pepper plus
          slow-hash verification.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : hasPin ? "Update PIN" : "Set PIN"}
        </Button>
        {hasPin ? (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onRemove}
          >
            Remove PIN
          </Button>
        ) : null}
      </div>
    </form>
  );
}
