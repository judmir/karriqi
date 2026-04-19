import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TodoAssignableMember } from "@/types/todo";
import {
  defaultDisplayNameFromEmail,
  displayNameFromUserMeta,
} from "@/lib/todo/assignable-members";

const AUTH_PAGE_SIZE = 200;

async function fetchAssignableMembersFromAuthAdmin(): Promise<
  TodoAssignableMember[] | null
> {
  const admin = createAdminClient();
  if (!admin) return null;

  const members: TodoAssignableMember[] = [];
  let page = 1;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: AUTH_PAGE_SIZE,
    });

    if (error) {
      throw new Error(error.message);
    }

    for (const u of data.users) {
      const meta = u.user_metadata as Record<string, unknown> | undefined;
      const displayName =
        displayNameFromUserMeta(meta) ||
        (u.email ? defaultDisplayNameFromEmail(u.email) : u.id.slice(0, 8));

      members.push({ userId: u.id, displayName });
    }

    if (data.users.length < AUTH_PAGE_SIZE) break;
    page += 1;
  }

  return members.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, {
      sensitivity: "base",
    }),
  );
}

/** People you can assign tasks to: all Auth users (with service role), else `household_members` + self. */
export async function fetchAssignableMembers(): Promise<TodoAssignableMember[]> {
  const fromAuth = await fetchAssignableMembersFromAuthAdmin();
  if (fromAuth !== null) {
    return fromAuth;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: rows, error } = await supabase
    .from("household_members")
    .select("member_user_id, display_name")
    .eq("owner_user_id", user.id)
    .order("display_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const byId = new Map<string, TodoAssignableMember>();

  for (const r of rows ?? []) {
    const name = r.display_name?.trim();
    byId.set(r.member_user_id, {
      userId: r.member_user_id,
      displayName: name || "Member",
    });
  }

  const selfName =
    displayNameFromUserMeta(user.user_metadata as Record<string, unknown>) ||
    (user.email ? defaultDisplayNameFromEmail(user.email) : "Me");

  if (!byId.has(user.id)) {
    byId.set(user.id, { userId: user.id, displayName: selfName });
  }

  return [...byId.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, {
      sensitivity: "base",
    }),
  );
}

/** Whether `assigneeUserId` may be set on the owner’s tasks (null always allowed). */
export async function userMayAssignTask(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerUserId: string,
  assigneeUserId: string | null,
): Promise<boolean> {
  if (assigneeUserId === null) return true;
  if (assigneeUserId === ownerUserId) return true;

  const admin = createAdminClient();
  if (admin) {
    const { data, error } = await admin.auth.admin.getUserById(assigneeUserId);
    return !error && Boolean(data.user);
  }

  const { data } = await supabase
    .from("household_members")
    .select("id")
    .eq("owner_user_id", ownerUserId)
    .eq("member_user_id", assigneeUserId)
    .maybeSingle();

  return Boolean(data);
}
