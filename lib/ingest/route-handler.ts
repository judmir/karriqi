import { NextResponse } from "next/server";
import type { ZodType } from "zod";

import {
  assertIngestAuthorized,
  getIngestAdminClient,
  ingestErrorResponse,
  ingestSuccessResponse,
  parseIngestJsonBody,
  type IngestResult,
} from "@/lib/ingest/http";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function handleIngestPost<T>(
  request: Request,
  schema: ZodType<T>,
  run: (
    admin: SupabaseClient<Database>,
    body: T,
  ) => Promise<IngestResult[]>,
): Promise<Response> {
  const authFailure = assertIngestAuthorized(request);
  if (authFailure) {
    return authFailure;
  }

  const parsed = await parseIngestJsonBody(request, schema);
  if (!parsed.ok) {
    return parsed.response;
  }

  const adminOrResponse = getIngestAdminClient();
  if (adminOrResponse instanceof NextResponse) {
    return adminOrResponse;
  }

  try {
    const results = await run(adminOrResponse, parsed.data);
    return ingestSuccessResponse(results);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Ingest failed";
    return ingestErrorResponse(message);
  }
}
