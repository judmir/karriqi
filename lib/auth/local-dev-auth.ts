/** True when the app talks to local Supabase (worktree Docker stack). */
export function isLocalSupabaseUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  try {
    const hostname = new URL(url).hostname;
    return hostname === "127.0.0.1" || hostname === "localhost";
  } catch {
    return false;
  }
}

/** One-click dev sign-in in `next dev` only (never production deploys). */
export function isDevQuickSignInEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  if (process.env.ENABLE_DEV_QUICK_SIGNIN === "0") {
    return false;
  }
  return true;
}

/** Dev login API allows cloud or local Supabase; still blocked in production. */
export function isDevLoginApiEnabled(): boolean {
  return isDevQuickSignInEnabled();
}
