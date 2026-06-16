/**
 * Soft-delete helpers — use instead of Supabase `.delete()` on user data tables.
 * See `.cursor/rules/soft-delete.mdc`.
 */

/** Column name for soft-delete timestamps on user data tables. */
export const DELETED_AT_COLUMN = "deleted_at" as const;

/** ISO timestamp marking a row as soft-deleted. */
export function softDeletedAt(): string {
  return new Date().toISOString();
}

/** Update payload: set `deleted_at` to now. Use instead of `.delete()`. */
export function softDeletePatch(): { deleted_at: string } {
  return { deleted_at: softDeletedAt() };
}

/** Clear soft-delete (restore a tombstoned row). */
export function restorePatch(): { deleted_at: null } {
  return { deleted_at: null };
}

type IsFilterable = {
  is: (column: string, value: null) => IsFilterable;
};

/** Filter query to active (non-deleted) rows. Chain after `.from()`. */
export function withoutSoftDeleted<Q extends IsFilterable>(query: Q): Q {
  return query.is(DELETED_AT_COLUMN, null) as Q;
}

/** Soft-delete rows by id in chunks (service-role / admin paths). */
export async function softDeleteByIds(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  table: string,
  ids: string[],
  chunkSize = 100,
): Promise<void> {
  if (ids.length === 0) {
    return;
  }
  const at = softDeletedAt();
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const { error } = await admin
      .from(table)
      .update({ deleted_at: at })
      .in("id", chunk);
    if (error) {
      throw new Error(error.message);
    }
  }
}
