"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  pairHouseholdByEmail,
  unpairHousehold,
  type HouseholdPartner,
} from "@/lib/household/household-actions";

export function HouseholdSettingsForm({
  partners,
  serviceRoleAvailable,
}: {
  partners: HouseholdPartner[];
  serviceRoleAvailable: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, startTransition] = useTransition();

  function onPair(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    startTransition(() => {
      void (async () => {
        const r = await pairHouseholdByEmail(trimmed);
        if (!r.ok) {
          toast.error(r.message);
          return;
        }
        toast.success(r.message ?? "Paired.");
        setEmail("");
        router.refresh();
      })();
    });
  }

  function onUnpair(partner: HouseholdPartner) {
    if (
      !confirm(
        `Unpair ${partner.displayName}? Their account stays, but your shopping list, staples, and purchases stop syncing.`,
      )
    ) {
      return;
    }
    startTransition(() => {
      void (async () => {
        const r = await unpairHousehold(partner.userId);
        if (!r.ok) {
          toast.error(r.message);
          return;
        }
        toast.success(`Unpaired ${partner.displayName}.`);
        router.refresh();
      })();
    });
  }

  if (!serviceRoleAvailable) {
    return (
      <div className="space-y-3 text-sm leading-relaxed">
        <p className="text-muted-foreground">
          Pairing requires{" "}
          <code className="text-foreground/90">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
          on the server. Without it you can still link partners manually via
          Supabase → Table Editor →{" "}
          <code className="text-foreground/90">household_members</code>.
        </p>
        {partners.length > 0 ? (
          <ul className="text-foreground/90 list-disc space-y-1 pl-5">
            {partners.map((p) => (
              <li key={p.userId}>{p.displayName}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm leading-relaxed">
        Link a partner so you both share one shopping list, suggested items, and
        purchase history. Changes show up instantly for both of you.
      </p>

      {partners.length > 0 ? (
        <ul className="space-y-2">
          {partners.map((partner) => (
            <li
              key={partner.userId}
              className="bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-foreground truncate text-sm font-medium">
                  {partner.displayName}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {partner.email ?? "Email hidden"}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pending}
                onClick={() => onUnpair(partner)}
              >
                Unpair
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          No partner linked yet — your shopping list is solo.
        </p>
      )}

      <form onSubmit={onPair} className="space-y-2">
        <Label htmlFor="household-pair-email">Partner email</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="household-pair-email"
            type="email"
            inputMode="email"
            autoComplete="off"
            placeholder="partner@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={pending || !email.trim()}>
            {pending ? "Pairing…" : "Pair"}
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          They must already have an account in this app. Pairing is symmetrical
          — either side can unpair later.
        </p>
      </form>
    </div>
  );
}
