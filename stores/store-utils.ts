/** How long cached store data is treated as fresh before a background refresh. */
export const STORE_STALE_MS = 60_000;

export function isStoreStale(loadedAt: number | null): boolean {
  if (loadedAt === null) return true;
  return Date.now() - loadedAt >= STORE_STALE_MS;
}

export type LoadStatus = "idle" | "loading" | "ready" | "error";
