import { readFileSync } from "node:fs";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import type { Database } from "@/types/database";
import type { ScheduleRow } from "@/lib/rehab/remap-neuro-rehab-weekly-schedule";
import {
  buildSpeechEventSyncPlan,
  speechCoverageGaps,
} from "@/lib/rehab/sync-neuro-rehab-speech-events";
import {
  NEURO_REHAB_PROGRAM_ID,
  SPEECH_PRACTICE_HOUR,
  SPEECH_PRACTICE_MINUTE,
} from "@/modules/rehab/neuro-rehab-2026/constants";

const RUN = process.env.RUN_SPEECH_SCHEDULE === "1";
const DRY = process.env.RUN_SPEECH_SCHEDULE_DRY === "1";

function loadEnvLocal() {
  try {
    const content = readFileSync(".env.local", "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    // optional
  }
}

loadEnvLocal();

async function fetchSpeechRows(admin: SupabaseClient<Database>) {
  const pageSize = 1000;
  const rows: (ScheduleRow & { user_id: string })[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await admin
      .from("rehab_plan_events")
      .select(
        "id, user_id, start_at, end_at, event_kind, program_id, plan_week, completed_at",
      )
      .eq("program_id", NEURO_REHAB_PROGRAM_ID)
      .eq("event_kind", "speech")
      .is("deleted_at", null)
      .range(offset, offset + pageSize - 1);

    expect(error).toBeNull();
    const page = (data ?? []) as (ScheduleRow & { user_id: string })[];
    rows.push(...page);
    if (page.length < pageSize) {
      break;
    }
  }
  return rows;
}

describe.runIf(RUN)("apply neuro rehab speech schedule to Supabase", () => {
  it("reschedules speech to 09:55 daily and fills missing program days", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(url).toBeTruthy();
    expect(serviceKey).toBeTruthy();

    const admin = createClient<Database>(url!, serviceKey!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const before = await fetchSpeechRows(admin);
    const userIds = [...new Set(before.map((row) => row.user_id))];
    expect(userIds.length).toBeGreaterThan(0);

    let totalPatches = 0;
    let totalInserts = 0;
    let totalDeletes = 0;

    for (const userId of userIds) {
      const userRows = before.filter((row) => row.user_id === userId);
      const plan = buildSpeechEventSyncPlan(userId, userRows);
      totalPatches += plan.patches.length;
      totalInserts += plan.inserts.length;
      totalDeletes += plan.deleteIds.length;

      if (DRY) {
        console.log(
          `${userId}: patch ${plan.patches.length}, insert ${plan.inserts.length}, delete ${plan.deleteIds.length}`,
        );
        continue;
      }

      for (const patch of plan.patches) {
        const { error } = await admin
          .from("rehab_plan_events")
          .update({ start_at: patch.start_at, end_at: patch.end_at })
          .eq("id", patch.id);
        expect(error).toBeNull();
      }

      if (plan.deleteIds.length > 0) {
        const { error } = await admin
          .from("rehab_plan_events")
          .update({ deleted_at: new Date().toISOString() })
          .in("id", plan.deleteIds);
        expect(error).toBeNull();
      }

      if (plan.inserts.length > 0) {
        const { error } = await admin.from("rehab_plan_events").insert(plan.inserts);
        expect(error).toBeNull();
      }
    }

    if (DRY) {
      console.log(
        `[dry-run] would patch ${totalPatches}, insert ${totalInserts}, delete ${totalDeletes}`,
      );
      return;
    }

    const after = await fetchSpeechRows(admin);
    for (const userId of userIds) {
      const userRows = after.filter((row) => row.user_id === userId);
      expect(speechCoverageGaps(userId, userRows)).toEqual([]);
      for (const row of userRows) {
        const start = new Date(row.start_at);
        expect(start.getHours()).toBe(SPEECH_PRACTICE_HOUR);
        expect(start.getMinutes()).toBe(SPEECH_PRACTICE_MINUTE);
      }
    }

    console.log(
      `speech sync: patched ${totalPatches}, inserted ${totalInserts}, deleted ${totalDeletes}; rows ${before.length} -> ${after.length}`,
    );
  }, 180_000);
});
