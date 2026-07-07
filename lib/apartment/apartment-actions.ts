"use server";

import { softDeletePatch } from "@/lib/db/soft-delete";
import { createClient } from "@/lib/supabase/server";
import type { ApartmentStepKind, ApartmentStepStatus } from "@/types/apartment";

type ActionResult = { ok: true } | { ok: false; message: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return { supabase, user: null, message: error?.message ?? "Not signed in." };
  }
  return { supabase, user, message: null };
}

export async function upsertApartmentStepStateAction(input: {
  kind: ApartmentStepKind;
  stepKey: string;
  status: ApartmentStepStatus;
  date?: string | null;
  notes?: string | null;
}): Promise<ActionResult> {
  const { supabase, user, message } = await requireUser();
  if (!user) {
    return { ok: false, message: message ?? "Not signed in." };
  }

  const { error } = await supabase
    .from("apartment_step_states")
    .upsert(
      {
        user_id: user.id,
        kind: input.kind,
        step_key: input.stepKey,
        status: input.status,
        date: input.date ?? null,
        notes: input.notes ?? null,
      },
      { onConflict: "user_id,kind,step_key" },
    );

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

export async function saveApartmentNotesAction(
  content: string,
): Promise<ActionResult> {
  const { supabase, user, message } = await requireUser();
  if (!user) {
    return { ok: false, message: message ?? "Not signed in." };
  }

  const { error } = await supabase
    .from("apartment_notes")
    .upsert({ user_id: user.id, content }, { onConflict: "user_id" });

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

export type UpsertApartmentRoomResult =
  | { ok: true; id: string }
  | { ok: false; message: string };

export async function upsertApartmentRoomAction(input: {
  id?: string;
  name: string;
  areaM2: number | null;
  widthM: number | null;
  lengthM: number | null;
  notes: string | null;
  sortOrder: number;
}): Promise<UpsertApartmentRoomResult> {
  const { supabase, user, message } = await requireUser();
  if (!user) {
    return { ok: false, message: message ?? "Not signed in." };
  }

  const name = input.name.trim();
  if (!name) {
    return { ok: false, message: "Room name is required." };
  }

  const values = {
    user_id: user.id,
    name,
    area_m2: input.areaM2,
    width_m: input.widthM,
    length_m: input.lengthM,
    notes: input.notes,
    sort_order: input.sortOrder,
  };

  if (input.id) {
    const { error } = await supabase
      .from("apartment_rooms")
      .update(values)
      .eq("id", input.id)
      .eq("user_id", user.id)
      .is("deleted_at", null);
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true, id: input.id };
  }

  const { data, error } = await supabase
    .from("apartment_rooms")
    .insert(values)
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Could not save room." };
  }
  return { ok: true, id: data.id };
}

export async function deleteApartmentRoomAction(id: string): Promise<ActionResult> {
  const { supabase, user, message } = await requireUser();
  if (!user) {
    return { ok: false, message: message ?? "Not signed in." };
  }

  const { error } = await supabase
    .from("apartment_rooms")
    .update(softDeletePatch())
    .eq("id", id)
    .eq("user_id", user.id)
    .is("deleted_at", null);

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
