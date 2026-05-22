import { NextResponse } from "next/server";
import type { ZodType } from "zod";

import { readIngestToken } from "@/lib/env/ingest";
import { createAdminClient } from "@/lib/supabase/admin";

export type IngestResult = {
  id: string;
  action: "created" | "updated";
};

function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function assertIngestAuthorized(request: Request): NextResponse | null {
  const token = readIngestToken();
  if (!token) {
    return NextResponse.json(
      { error: "INGEST_TOKEN not set" },
      { status: 501 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${token}`) {
    return unauthorized();
  }

  return null;
}

export async function parseIngestJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
): Promise<
  | { ok: true; data: T }
  | { ok: false; response: NextResponse }
> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      ),
    };
  }

  return { ok: true, data: parsed.data };
}

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export function getIngestAdminClient():
  | SupabaseClient<Database>
  | NextResponse {
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
  return admin;
}

export function ingestSuccessResponse(results: IngestResult[]): NextResponse {
  return NextResponse.json({ status: "ok", results });
}

export function ingestErrorResponse(
  message: string,
  status = 500,
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}
