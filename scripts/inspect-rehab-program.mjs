#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const PROGRAM_ID = "neuro-rehab-2026-v1";
const USER_ID = process.argv[2] ?? "e18a4b29-ed05-4140-99af-9f6a8c906074";

function loadEnvLocal(root) {
  const path = `${root}/.env.local`;
  const content = readFileSync(path, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i)] = t.slice(i + 1).replace(/^["']|["']$/g, "");
  }
  return env;
}

const root = new URL("..", import.meta.url).pathname;
const env = loadEnvLocal(root);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing Supabase env in .env.local");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { count, error } = await admin
  .from("rehab_plan_events")
  .select("id", { count: "exact", head: true })
  .eq("user_id", USER_ID)
  .eq("program_id", PROGRAM_ID);

if (error) {
  console.error("count error:", error.message);
  process.exit(1);
}

console.log("user", USER_ID);
console.log("program event count", count);

const { data: jun8, error: jun8Err } = await admin
  .from("rehab_plan_events")
  .select("id, title, start_at, event_kind")
  .eq("user_id", USER_ID)
  .eq("program_id", PROGRAM_ID)
  .gte("start_at", "2026-06-08T00:00:00.000Z")
  .lt("start_at", "2026-06-09T00:00:00.000Z")
  .order("start_at");

if (jun8Err) {
  console.error("jun8 error:", jun8Err.message);
  process.exit(1);
}

const byKey = new Map();
for (const row of jun8 ?? []) {
  const key = `${row.start_at}|${row.event_kind}|${row.title}`;
  byKey.set(key, (byKey.get(key) ?? 0) + 1);
}

console.log("jun 8 rows", jun8?.length ?? 0);
console.log("jun 8 unique slots", byKey.size);
const dupes = [...byKey.entries()].filter(([, n]) => n > 1);
console.log("duplicated slots", dupes.length);
for (const [k, n] of dupes.slice(0, 10)) {
  console.log(`  x${n}`, k);
}
