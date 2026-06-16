import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function projectRoot(): string {
  return process.cwd();
}

/** Load `.env.local` from the repo root (does not override existing env vars). */
export function loadIntegrationEnv(): void {
  const envPath = path.join(projectRoot(), ".env.local");
  if (!existsSync(envPath)) {
    throw new Error(
      `Missing ${envPath}. Run \`pnpm worktree:dev\` or \`bash scripts/worktree-env-bootstrap.sh\` first.`,
    );
  }

  const content = readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

export function requireSupabaseAdminEnv(): {
  url: string;
  serviceKey: string;
} {
  loadIntegrationEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local",
    );
  }
  return { url, serviceKey };
}
