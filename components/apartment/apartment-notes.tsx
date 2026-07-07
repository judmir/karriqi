"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useApartmentStore } from "@/stores/apartment-store";

export function ApartmentNotes() {
  const notes = useApartmentStore((state) => state.notes);
  const saveNotes = useApartmentStore((state) => state.saveNotes);

  const [draft, setDraft] = useState(notes);
  const [lastStoreNotes, setLastStoreNotes] = useState(notes);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // Adopt external store updates (e.g. refresh) without clobbering edits mid-typing.
  if (notes !== lastStoreNotes) {
    setLastStoreNotes(notes);
    if (draft === lastStoreNotes) {
      setDraft(notes);
    }
  }

  const dirty = draft !== notes;

  async function save() {
    setSaving(true);
    const result = await saveNotes(draft);
    setSaving(false);
    if (!result.ok) {
      toast.error(result.message);
    } else {
      setSavedAt(Date.now());
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Important case notes</CardTitle>
        <CardDescription>
          Free-form notes for the purchase — deadlines, contacts, reminders. Do
          not paste IBANs or tax IDs here.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Textarea
          value={draft}
          rows={5}
          placeholder="e.g. Notary contact, Hausverwaltung phone number, questions for Interhyp…"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => {
            if (dirty) {
              void save();
            }
          }}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {saving
              ? "Saving…"
              : dirty
                ? "Unsaved changes"
                : savedAt
                  ? "Saved"
                  : ""}
          </p>
          <Button size="sm" disabled={!dirty || saving} onClick={() => void save()}>
            {saving ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Check data-icon="inline-start" />
            )}
            Save notes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
