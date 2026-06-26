#!/usr/bin/env node
/**
 * Seeds sample Pulse feed rows for local Supabase preview (Judi dev user).
 * Idempotent — upserts by (user_id, dedupe_key). Local Docker only.
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

/** Keep in sync with supabase/seed.sql / lib/auth/dev-test-users.ts */
const JUDI_USER_ID = "e18a4b29-ed05-4140-99af-9f6a8c906074";

/** @type {Array<Record<string, unknown>>} */
const FIXTURES = [
  {
    dedupe_key: "local-fixture-bvg-u5-2026-06",
    title: "BVG U5 weekend replacement buses",
    summary:
      "Shuttle buses between Alexanderplatz and Hönow on Sat–Sun while track work continues.",
    why_it_matters: "Affects your Saturday Kita drop-off route.",
    suggested_action: "Save 15 extra minutes or switch to U8 + bus 194.",
    category: "berlin_life",
    impact: "medium",
    urgency: "this_week",
    status: "new",
    source_type: "web",
    source_url: "https://www.bvg.de/de/fahrinfo/betriebsinfo",
    source_title: "BVG Betriebsinfo",
    due_at: "2026-06-29T23:59:59.000Z",
    confidence: 0.91,
  },
  {
    dedupe_key: "local-fixture-mietspiegel-2026",
    title: "Berlin Mietspiegel 2026 published",
    summary:
      "New rent reference values apply from July; landlords must use updated tables for increases.",
    why_it_matters: "Relevant if your lease allows indexed increases this year.",
    suggested_action: "Compare your current rent to the new local reference band.",
    category: "berlin_life",
    impact: "high",
    urgency: "this_month",
    status: "new",
    source_type: "document",
    source_url: "https://www.stadtentwicklung.berlin.de/wohnen/mietspiegel/",
    source_title: "Senatsverwaltung Mietspiegel",
    starts_at: "2026-07-01T00:00:00.000Z",
    confidence: 0.88,
  },
  {
    dedupe_key: "local-fixture-buergeramt-slots",
    title: "Bürgeramt online slots refresh weekly",
    summary:
      "Mitte and Pankow offices release new Anmeldung appointments every Tuesday morning.",
    why_it_matters: "Useful if you still need to register a secondary address change.",
    suggested_action: "Set a Tuesday 08:55 reminder to book before slots vanish.",
    category: "berlin_life",
    impact: "medium",
    urgency: "watch",
    status: "saved",
    source_type: "web",
    source_title: "service.berlin.de Terminvergabe",
    confidence: 0.75,
  },
  {
    dedupe_key: "local-fixture-kita-deadline",
    title: "Kita Platzrecht documentation deadline",
    summary:
      "Families with a Platzrecht letter must confirm acceptance by the stated reply date.",
    why_it_matters: "Missing the deadline can forfeit the reserved spot.",
    suggested_action: "Reply to the Kita today and upload the signed form.",
    category: "berlin_life",
    impact: "high",
    urgency: "now",
    status: "new",
    source_type: "manual",
    source_title: "Kita Träger letter",
    due_at: "2026-06-30T12:00:00.000Z",
    confidence: 0.95,
  },
  {
    dedupe_key: "local-fixture-feinstaub-zone",
    title: "Umweltzone signage update in Mitte",
    summary:
      "Additional streets now require a green Feinstaubplakette for weekday entry.",
    why_it_matters: "Only relevant if you drive into the city center.",
    suggested_action: "Check your car sticker class before next Mitte trip.",
    category: "berlin_life",
    impact: "low",
    urgency: "watch",
    status: "new",
    source_type: "web",
    source_title: "Berlin Umweltzone",
    confidence: 0.7,
  },
  {
    dedupe_key: "local-fixture-gez-household",
    title: "GEZ secondary residence rule clarified",
    summary:
      "Shared households with one primary Beitragsservice account no longer need duplicate declarations.",
    why_it_matters: "Avoids double billing if both adults registered separately.",
    suggested_action: "Confirm only one Rundfunkbeitrag account is active.",
    category: "berlin_life",
    impact: "low",
    urgency: "this_month",
    status: "new",
    source_type: "web",
    source_title: "Beitragsservice FAQ",
    confidence: 0.8,
  },
  {
    dedupe_key: "local-fixture-school-holidays",
    title: "Berlin summer holiday care registration opens",
    summary:
      "Ferienspaß programs publish spots citywide; popular Bezirk camps fill within days.",
    why_it_matters: "Overlaps with your last week of June travel planning.",
    suggested_action: "Shortlist two camps and register before Friday.",
    category: "berlin_life",
    impact: "medium",
    urgency: "this_week",
    status: "new",
    source_type: "web",
    source_url: "https://www.berlin.de/special/ferien/",
    source_title: "Berlin Ferienangebote",
    confidence: 0.85,
  },
  {
    dedupe_key: "local-fixture-wohnungsgenossenschaft",
    title: "Housing cooperative membership vote scheduled",
    summary:
      "Your building's Genossenschaft set an extraordinary members' meeting on modernization costs.",
    why_it_matters: "Decisions may affect monthly Nebenkosten and renovation timeline.",
    suggested_action: "Read the Wirtschaftsplan appendix before the vote.",
    category: "berlin_life",
    impact: "medium",
    urgency: "this_month",
    status: "new",
    source_type: "contract",
    source_title: "Genossenschaft member letter",
    starts_at: "2026-07-15T17:00:00.000Z",
    confidence: 0.9,
  },
  {
    dedupe_key: "local-fixture-district-heating",
    title: "District heating price adjustment notice",
    summary:
      "Your Fernwärme provider announced a mid-year tariff adjustment effective August.",
    why_it_matters: "Directly affects monthly utility costs in your Altbau.",
    suggested_action: "Compare the new rate to your last Jahresabrechnung.",
    category: "berlin_life",
    impact: "high",
    urgency: "this_week",
    status: "new",
    source_type: "document",
    source_title: "Fernwärme provider notice",
    starts_at: "2026-08-01T00:00:00.000Z",
    confidence: 0.87,
  },
  {
    dedupe_key: "local-fixture-mieterschutz-law",
    title: "Berlin rental law briefing: renovation pass-through",
    summary:
      "Updated guidance on how much modernization costs landlords may pass to tenants.",
    why_it_matters: "Helpful context if your Hausverwaltung sends a Modernisierungsankündigung.",
    suggested_action: "Skim the Mieterverein summary before signing anything.",
    category: "berlin_life",
    impact: "high",
    urgency: "watch",
    status: "acted",
    source_type: "web",
    source_url: "https://www.berlin.de/sen/wohnen/",
    source_title: "Senatsverwaltung Wohnen",
    confidence: 0.82,
  },
];

function loadEnvLocal(root) {
  const path = `${root}/.env.local`;
  let content;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    throw new Error(`Missing ${path} — run pnpm worktree:dev first.`);
  }
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

async function main() {
  const root = new URL("..", import.meta.url).pathname;
  loadEnvLocal(root);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.includes("127.0.0.1") && !url?.includes("localhost")) {
    console.log("Skipping Pulse seed — NEXT_PUBLIC_SUPABASE_URL is not local.");
    return;
  }
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const rows = FIXTURES.map((item) => ({
    user_id: JUDI_USER_ID,
    title: item.title,
    summary: item.summary,
    why_it_matters: item.why_it_matters ?? null,
    suggested_action: item.suggested_action ?? null,
    category: item.category,
    impact: item.impact,
    urgency: item.urgency,
    status: item.status ?? "new",
    source_type: item.source_type ?? "cron",
    source_url: item.source_url ?? null,
    source_title: item.source_title ?? null,
    starts_at: item.starts_at ?? null,
    due_at: item.due_at ?? null,
    expires_at: item.expires_at ?? null,
    dedupe_key: item.dedupe_key,
    confidence: item.confidence ?? null,
    payload: { fixture: true, seededBy: "seed-local-pulse-items.mjs" },
  }));

  const { error } = await admin.from("pulse_items").upsert(rows, {
    onConflict: "user_id,dedupe_key",
  });

  if (error) {
    throw new Error(error.message);
  }

  console.log(`Seeded ${rows.length} Pulse fixtures for Judi (${JUDI_USER_ID}).`);
  console.log("Open http://localhost:3012/pulse (dev PIN 123456) to preview.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
