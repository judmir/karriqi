"use server";

import { z } from "zod";

import { softDeletePatch } from "@/lib/db/soft-delete";
import { createClient, getSessionUser } from "@/lib/supabase/server";

const planDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date.");

const positionSchema = z
  .number()
  .int()
  .min(1)
  .max(3);

type ActionResult = { ok: true } | { ok: false; message: string };

const TITLE_MAX = 200;
const TEXT_MAX = 1000;

async function ensureDayId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  planDate: string,
): Promise<{ ok: true; dayId: string } | { ok: false; message: string }> {
  const { data, error } = await supabase
    .from("rule_of_3_days")
    .upsert(
      { user_id: userId, plan_date: planDate },
      { onConflict: "user_id,plan_date", ignoreDuplicates: false },
    )
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "Could not save the day." };
  }
  return { ok: true, dayId: data.id };
}

export async function saveRuleOf3Item(input: {
  planDate: string;
  position: number;
  title: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      planDate: planDateSchema,
      position: positionSchema,
      title: z.string().max(TITLE_MAX),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid item." };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Sign in to save your plan." };
  }

  const supabase = await createClient();
  const day = await ensureDayId(supabase, user.id, parsed.data.planDate);
  if (!day.ok) {
    return day;
  }

  const title = parsed.data.title.trim();

  if (title.length === 0) {
    const { error } = await supabase
      .from("rule_of_3_items")
      .update(softDeletePatch())
      .eq("day_id", day.dayId)
      .eq("position", parsed.data.position)
      .is("deleted_at", null);
    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true };
  }

  const { error } = await supabase.from("rule_of_3_items").upsert(
    {
      day_id: day.dayId,
      position: parsed.data.position,
      title,
    },
    { onConflict: "day_id,position" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

export async function setRuleOf3ItemCompleted(input: {
  planDate: string;
  position: number;
  completed: boolean;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      planDate: planDateSchema,
      position: positionSchema,
      completed: z.boolean(),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid item." };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Sign in to save your plan." };
  }

  const supabase = await createClient();
  const day = await ensureDayId(supabase, user.id, parsed.data.planDate);
  if (!day.ok) {
    return day;
  }

  const completedAt = parsed.data.completed ? new Date().toISOString() : null;

  // Completing an item clears any "not covered" reason.
  const patch: { completed_at: string | null; blocked_reason?: string } = {
    completed_at: completedAt,
  };
  if (parsed.data.completed) {
    patch.blocked_reason = "";
  }

  const { error } = await supabase
    .from("rule_of_3_items")
    .update(patch)
    .eq("day_id", day.dayId)
    .eq("position", parsed.data.position);

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

export async function setRuleOf3ItemBlockedReason(input: {
  planDate: string;
  position: number;
  blockedReason: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      planDate: planDateSchema,
      position: positionSchema,
      blockedReason: z.string().max(TEXT_MAX),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid reason." };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Sign in to save your plan." };
  }

  const supabase = await createClient();
  const day = await ensureDayId(supabase, user.id, parsed.data.planDate);
  if (!day.ok) {
    return day;
  }

  const reason = parsed.data.blockedReason.trim();

  // Marking an item "not covered" clears completion.
  const patch: { blocked_reason: string; completed_at?: string | null } = {
    blocked_reason: reason,
  };
  if (reason.length > 0) {
    patch.completed_at = null;
  }

  const { error } = await supabase
    .from("rule_of_3_items")
    .update(patch)
    .eq("day_id", day.dayId)
    .eq("position", parsed.data.position);

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}

export async function setRuleOf3Reflection(input: {
  planDate: string;
  reflection: string;
}): Promise<ActionResult> {
  const parsed = z
    .object({
      planDate: planDateSchema,
      reflection: z.string().max(TEXT_MAX),
    })
    .safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Invalid reflection." };
  }

  const user = await getSessionUser();
  if (!user) {
    return { ok: false, message: "Sign in to save your plan." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("rule_of_3_days").upsert(
    {
      user_id: user.id,
      plan_date: parsed.data.planDate,
      reflection: parsed.data.reflection.trim(),
    },
    { onConflict: "user_id,plan_date" },
  );

  if (error) {
    return { ok: false, message: error.message };
  }
  return { ok: true };
}
