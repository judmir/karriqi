"use server";

import { revalidatePath } from "next/cache";

import { ROUTES } from "@/config/routes";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient, getSessionUser } from "@/lib/supabase/server";
import {
  defaultDisplayNameFromEmail,
  displayNameFromUserMeta,
} from "@/lib/todo/assignable-members";

export type HouseholdActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

/**
 * Link the current user with another user by email so they share the household
 * shopping list, staples, and purchase events.
 *
 * Inserts a `household_members` row with the current user as owner (the canonical
 * household owner). Existing shopping data of the new partner does NOT migrate
 * automatically — re-run the shared-shopping migration or have them re-add items.
 */
export async function pairHouseholdByEmail(
  email: string,
): Promise<HouseholdActionResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return { ok: false, message: "Email is required." };
  }

  const me = await getSessionUser();
  if (!me) {
    return { ok: false, message: "Not signed in." };
  }
  if (me.email && me.email.trim().toLowerCase() === normalized) {
    return { ok: false, message: "That's your own email." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      message:
        "Pairing requires SUPABASE_SERVICE_ROLE_KEY on the server. Ask the admin to set it.",
    };
  }

  let partnerUserId: string | null = null;
  let partnerDisplayName = "";
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      return { ok: false, message: error.message };
    }
    for (const u of data.users) {
      if (u.email && u.email.trim().toLowerCase() === normalized) {
        partnerUserId = u.id;
        const meta = u.user_metadata as Record<string, unknown> | undefined;
        partnerDisplayName =
          displayNameFromUserMeta(meta) ||
          (u.email ? defaultDisplayNameFromEmail(u.email) : "Partner");
        break;
      }
    }
    if (partnerUserId || data.users.length < 200) break;
    page += 1;
  }

  if (!partnerUserId) {
    return { ok: false, message: `No account found for ${normalized}.` };
  }

  // Already paired (either direction)? Treat as success / idempotent.
  const { data: existing } = await admin
    .from("household_members")
    .select("id, owner_user_id, member_user_id")
    .or(
      `and(owner_user_id.eq.${me.id},member_user_id.eq.${partnerUserId}),and(owner_user_id.eq.${partnerUserId},member_user_id.eq.${me.id})`,
    )
    .limit(1)
    .maybeSingle();

  if (existing) {
    revalidatePath(ROUTES.settings);
    revalidatePath(ROUTES.shopping);
    return { ok: true, message: "Already paired." };
  }

  const { error: insertError } = await admin
    .from("household_members")
    .insert({
      owner_user_id: me.id,
      member_user_id: partnerUserId,
      display_name: partnerDisplayName,
    });

  if (insertError) {
    return { ok: false, message: insertError.message };
  }

  // Move partner's existing shopping list, staples, and purchases onto our
  // household bucket so both sides see the merged history immediately.
  const { error: migrateError } = await admin.rpc(
    "migrate_shopping_to_household_owner",
    { p_member_id: partnerUserId, p_owner_id: me.id },
  );
  if (migrateError) {
    // Pairing already succeeded — surface the merge error but don't roll back.
    return {
      ok: true,
      message: `Paired with ${partnerDisplayName} (data merge warning: ${migrateError.message}).`,
    };
  }

  revalidatePath(ROUTES.settings);
  revalidatePath(ROUTES.shopping);
  return { ok: true, message: `Paired with ${partnerDisplayName}.` };
}

/** Remove a household pairing in either direction (owner ↔ member). */
export async function unpairHousehold(
  otherUserId: string,
): Promise<HouseholdActionResult> {
  if (!otherUserId) {
    return { ok: false, message: "Partner id is required." };
  }
  const me = await getSessionUser();
  if (!me) {
    return { ok: false, message: "Not signed in." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      message:
        "Unpairing requires SUPABASE_SERVICE_ROLE_KEY on the server. Ask the admin to set it.",
    };
  }

  const { error } = await admin
    .from("household_members")
    .delete()
    .or(
      `and(owner_user_id.eq.${me.id},member_user_id.eq.${otherUserId}),and(owner_user_id.eq.${otherUserId},member_user_id.eq.${me.id})`,
    );

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath(ROUTES.settings);
  revalidatePath(ROUTES.shopping);
  return { ok: true };
}

export type HouseholdPartner = {
  userId: string;
  email: string | null;
  displayName: string;
  role: "owner" | "member";
};

export type HouseholdOverview = {
  currentUserId: string;
  ownerUserId: string;
  isOwner: boolean;
  partners: HouseholdPartner[];
  serviceRoleAvailable: boolean;
};

/** Loads the user's current household partners (or empty if solo). */
export async function fetchHouseholdOverview(): Promise<HouseholdOverview | null> {
  const me = await getSessionUser();
  if (!me) return null;

  const admin = createAdminClient();
  if (!admin) {
    // Without service role we cannot resolve emails for partners, but we can
    // still show the (owner-side) members via the regular client.
    const supabase = await createClient();
    const { data } = await supabase
      .from("household_members")
      .select("owner_user_id, member_user_id, display_name")
      .eq("owner_user_id", me.id);

    const partners: HouseholdPartner[] = (data ?? []).map((r) => ({
      userId: r.member_user_id,
      email: null,
      displayName: r.display_name ?? "Partner",
      role: "member" as const,
    }));

    return {
      currentUserId: me.id,
      ownerUserId: me.id,
      isOwner: true,
      partners,
      serviceRoleAvailable: false,
    };
  }

  const [{ data: asOwner }, { data: asMember }] = await Promise.all([
    admin
      .from("household_members")
      .select("member_user_id, display_name")
      .eq("owner_user_id", me.id),
    admin
      .from("household_members")
      .select("owner_user_id, display_name")
      .eq("member_user_id", me.id),
  ]);

  const partnerIds = new Set<string>();
  const roleById = new Map<string, "owner" | "member">();
  const fallbackNames = new Map<string, string>();

  for (const r of asOwner ?? []) {
    if (r.member_user_id && r.member_user_id !== me.id) {
      partnerIds.add(r.member_user_id);
      roleById.set(r.member_user_id, "member");
      if (r.display_name) fallbackNames.set(r.member_user_id, r.display_name);
    }
  }
  for (const r of asMember ?? []) {
    if (r.owner_user_id && r.owner_user_id !== me.id) {
      partnerIds.add(r.owner_user_id);
      roleById.set(r.owner_user_id, "owner");
      if (r.display_name) fallbackNames.set(r.owner_user_id, r.display_name);
    }
  }

  const partners: HouseholdPartner[] = [];
  for (const id of partnerIds) {
    const { data, error } = await admin.auth.admin.getUserById(id);
    if (error || !data.user) {
      partners.push({
        userId: id,
        email: null,
        displayName: fallbackNames.get(id) ?? "Partner",
        role: roleById.get(id) ?? "member",
      });
      continue;
    }
    const u = data.user;
    const meta = u.user_metadata as Record<string, unknown> | undefined;
    const displayName =
      displayNameFromUserMeta(meta) ||
      fallbackNames.get(id) ||
      (u.email ? defaultDisplayNameFromEmail(u.email) : "Partner");
    partners.push({
      userId: id,
      email: u.email ?? null,
      displayName,
      role: roleById.get(id) ?? "member",
    });
  }

  partners.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, {
      sensitivity: "base",
    }),
  );

  const ownerEntry = asMember?.[0];
  const ownerUserId = ownerEntry?.owner_user_id ?? me.id;
  const isOwner = ownerUserId === me.id;

  return {
    currentUserId: me.id,
    ownerUserId,
    isOwner,
    partners,
    serviceRoleAvailable: true,
  };
}
