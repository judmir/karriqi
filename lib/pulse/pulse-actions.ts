"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { fetchPulseItemsForUser } from "@/lib/pulse/fetch-pulse-items";
import { createClient } from "@/lib/supabase/server";
import { createTodoItem, updateTodoItem } from "@/lib/todo/todo-actions";
import type { PulseStatus } from "@/types/pulse";
import { PULSE_STATUSES } from "@/types/pulse";

type ActionResult = { ok: true } | { ok: false; message: string };

function ok(): ActionResult {
  revalidatePath(ROUTES.pulse);
  return { ok: true };
}

function isPulseStatus(value: string): value is PulseStatus {
  return (PULSE_STATUSES as readonly string[]).includes(value);
}

export async function updatePulseItemStatusAction(
  itemId: string,
  status: PulseStatus,
): Promise<ActionResult> {
  if (!isPulseStatus(status)) {
    return { ok: false, message: "Invalid status." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { error } = await supabase
    .from("pulse_items")
    .update({ status })
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: error.message };
  }

  return ok();
}

export async function createTaskFromPulseItemAction(
  itemId: string,
): Promise<{ ok: true; taskId: string } | { ok: false; message: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const items = await fetchPulseItemsForUser(user.id);
  const item = items.find((row) => row.id === itemId);
  if (!item) {
    return { ok: false, message: "Pulse item not found." };
  }

  const descriptionParts = [item.summary];
  if (item.whyItMatters) {
    descriptionParts.push("", "Why it matters", item.whyItMatters);
  }
  if (item.suggestedAction) {
    descriptionParts.push("", "Suggested action", item.suggestedAction);
  }
  if (item.sourceUrl) {
    descriptionParts.push("", item.sourceUrl);
  }

  const created = await createTodoItem({
    title: item.title,
    category: "Pulse",
  });

  if (!created.ok) {
    return created;
  }

  const updated = await updateTodoItem({
    id: created.id,
    description: descriptionParts.join("\n"),
  });

  if (!updated.ok) {
    return updated;
  }

  await updatePulseItemStatusAction(itemId, "acted");
  return { ok: true, taskId: created.id };
}
