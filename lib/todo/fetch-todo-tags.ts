import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_TODO_TAG_ICON,
  isValidTodoTagIcon,
} from "@/lib/todo/tag-icons";
import type { TodoTag } from "@/types/todo";

type TagRow = {
  id: string;
  label: string;
  icon: string;
};

function mapTag(row: TagRow): TodoTag {
  return {
    id: row.id,
    label: row.label,
    icon: row.icon,
  };
}

export async function fetchTodoTagsForUser(): Promise<TodoTag[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("todo_tags")
    .select("id, label, icon")
    .order("label", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapTag(row as TagRow));
}

export function todoTagIconByLabel(tags: TodoTag[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const tag of tags) {
    map.set(tag.label.toLowerCase(), tag.icon);
  }
  return map;
}

export function resolveCategoryIcon(
  category: string | null,
  iconByLabel: Map<string, string>,
): string | null {
  if (!category) return null;
  return iconByLabel.get(category.toLowerCase()) ?? null;
}

export async function upsertTodoTagForUser(input: {
  label: string;
  icon: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const label = input.label.trim();
  if (!label) {
    return { ok: false, message: "Tag label cannot be empty." };
  }

  const icon = isValidTodoTagIcon(input.icon)
    ? input.icon
    : DEFAULT_TODO_TAG_ICON;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const { data: existing, error: readError } = await supabase
    .from("todo_tags")
    .select("id, label")
    .eq("user_id", user.id)
    .ilike("label", label)
    .maybeSingle();

  if (readError) {
    return { ok: false, message: readError.message };
  }

  if (existing) {
    const { error } = await supabase
      .from("todo_tags")
      .update({ label, icon })
      .eq("id", existing.id)
      .eq("user_id", user.id);

    if (error) {
      return { ok: false, message: error.message };
    }
    return { ok: true };
  }

  const { error } = await supabase.from("todo_tags").insert({
    user_id: user.id,
    label,
    icon,
  });

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true };
}
