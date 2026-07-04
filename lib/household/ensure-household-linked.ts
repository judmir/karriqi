import { cache } from "react";

import { getHouseholdUserEmails } from "@/lib/env/household";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  defaultDisplayNameFromEmail,
  displayNameFromUserMeta,
} from "@/lib/todo/assignable-members";

type AuthUserSummary = {
  id: string;
  email: string | null;
  displayName: string;
};

async function listAuthUsers(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
): Promise<AuthUserSummary[]> {
  const users: AuthUserSummary[] = [];
  let page = 1;

  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      throw new Error(error.message);
    }

    for (const u of data.users) {
      const meta = u.user_metadata as Record<string, unknown> | undefined;
      users.push({
        id: u.id,
        email: u.email ?? null,
        displayName:
          displayNameFromUserMeta(meta) ||
          (u.email ? defaultDisplayNameFromEmail(u.email) : "Member"),
      });
    }

    if (data.users.length < 200) break;
    page += 1;
  }

  return users;
}

function resolveHouseholdUsers(
  allUsers: AuthUserSummary[],
  configuredEmails: string[] | null,
): AuthUserSummary[] {
  if (configuredEmails) {
    const emailSet = new Set(configuredEmails);
    return allUsers.filter(
      (u) => u.email && emailSet.has(u.email.trim().toLowerCase()),
    );
  }

  // Personal household apps: auto-share when there are exactly two accounts.
  if (allUsers.length === 2) return allUsers;
  return [];
}

function pickCanonicalOwner(
  householdUsers: AuthUserSummary[],
  configuredEmails: string[] | null,
): AuthUserSummary {
  if (configuredEmails?.[0]) {
    const ownerEmail = configuredEmails[0];
    const match = householdUsers.find(
      (u) => u.email?.trim().toLowerCase() === ownerEmail,
    );
    if (match) return match;
  }

  return householdUsers
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))[0]!;
}

/**
 * Idempotent: links configured (or the only two) Auth users into one household
 * so shopping, staples, and assignees stay shared without manual pairing.
 */
export const ensureHouseholdLinked = cache(async function ensureHouseholdLinked(): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;

  // Fast path: once any household link exists, skip the expensive
  // Auth-users pagination that otherwise runs on every kanban/shopping load.
  const { data: anyLink } = await admin
    .from("household_members")
    .select("id")
    .limit(1)
    .maybeSingle();
  if (anyLink) return;

  const configuredEmails = getHouseholdUserEmails();
  const allUsers = await listAuthUsers(admin);
  const householdUsers = resolveHouseholdUsers(allUsers, configuredEmails);
  if (householdUsers.length < 2) return;

  const owner = pickCanonicalOwner(householdUsers, configuredEmails);
  const members = householdUsers.filter((u) => u.id !== owner.id);

  for (const member of members) {
    const { data: existing } = await admin
      .from("household_members")
      .select("id")
      .or(
        `and(owner_user_id.eq.${owner.id},member_user_id.eq.${member.id}),and(owner_user_id.eq.${member.id},member_user_id.eq.${owner.id})`,
      )
      .limit(1)
      .maybeSingle();

    if (existing) continue;

    const { error: insertError } = await admin.from("household_members").insert({
      owner_user_id: owner.id,
      member_user_id: member.id,
      display_name: member.displayName,
    });

    if (insertError) {
      console.error("ensureHouseholdLinked:", insertError.message);
      continue;
    }

    const { error: migrateError } = await admin.rpc(
      "migrate_shopping_to_household_owner",
      { p_member_id: member.id, p_owner_id: owner.id },
    );
    if (migrateError) {
      console.error("ensureHouseholdLinked migrate:", migrateError.message);
    }
  }
});
