#!/usr/bin/env node
/**
 * Wipe neuro-rehab program events for a user so the next Plan/Today visit re-seeds cleanly.
 * Usage: node scripts/reset-rehab-program.mjs [userId]
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const PROGRAM_ID = "neuro-rehab-2026-v1";
const USER_ID = process.argv[2] ?? "e18a4b29-ed05-4140-99af-9f6a8c906074";

function loadEnvLocal(root) {
  const content = readFileSync(`${root}/.env.local`, "utf8");
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

const { count: before } = await admin
  .from("rehab_plan_events")
  .select("id", { count: "exact", head: true })
  .eq("user_id", USER_ID)
  .eq("program_id", PROGRAM_ID);

const { error: eventsError } = await admin
  .from("rehab_plan_events")
  .delete()
  .eq("user_id", USER_ID)
  .eq("program_id", PROGRAM_ID);

if (eventsError) {
  console.error("delete events:", eventsError.message);
  process.exit(1);
}

const { error: lockError } = await admin
  .from("rehab_user_programs")
  .delete()
  .eq("user_id", USER_ID)
  .eq("program_id", PROGRAM_ID);

if (lockError && lockError.code !== "42P01" && !lockError.message.includes("rehab_user_programs")) {
  console.error("delete lock:", lockError.message);
  process.exit(1);
}

const { count: after } = await admin
  .from("rehab_plan_events")
  .select("id", { count: "exact", head: true })
  .eq("user_id", USER_ID)
  .eq("program_id", PROGRAM_ID);

console.log(`Reset neuro-rehab program for ${USER_ID}`);
console.log(`  deleted ${before ?? 0} events`);
console.log(`  remaining ${after ?? 0}`);
console.log("Reload /rehab/plan or /rehab/today to re-seed.");
