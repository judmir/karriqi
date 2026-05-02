import { NextResponse } from "next/server";

import { readOperatorIngestToken } from "@/lib/env/operator-ingest";
import { upsertOperatorEntry } from "@/lib/repositories/operator-entries";
import { createAdminClient } from "@/lib/supabase/admin";
import { weekendPlannerIngestSchema } from "@/modules/operator/weekend-planner-schema";

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST(request: Request) {
  const token = readOperatorIngestToken();
  if (!token) {
    return NextResponse.json(
      { error: "OPERATOR_INGEST_TOKEN not set" },
      { status: 501 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${token}`) {
    return unauthorized();
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = weekendPlannerIngestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Supabase admin client unavailable (check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)",
      },
      { status: 500 },
    );
  }

  try {
    const result = await upsertOperatorEntry(admin, parsed.data);
    return NextResponse.json({
      status: "upserted",
      id: result.id,
      updatedAt: result.updatedAt,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Upsert failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
