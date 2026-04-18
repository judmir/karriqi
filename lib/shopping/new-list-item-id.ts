let fallbackSeq = 0;

/** Client-only id for list rows until Supabase assigns ids. */
export function newShoppingListItemId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  fallbackSeq += 1;
  return `list-fallback-${fallbackSeq}`;
}
