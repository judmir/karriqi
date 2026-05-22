import type { Metadata } from "next";

import { DevelopersSwaggerClient } from "@/components/developers/developers-swagger-client";
import {
  DEVELOPERS_DOCS_PATH,
  OPENAPI_JSON_PATH,
  OPENAPI_YAML_PATH,
} from "@/modules/ingest/routes";

export const metadata: Metadata = {
  title: "API — Karriqi Ingest",
  description:
    "Swagger UI for the Karriqi ingest OpenAPI contract (Hermes and other agents).",
};

export default function DevelopersPage() {
  return (
    <main className="flex min-h-dvh flex-col">
      <header className="border-b bg-card px-4 py-4 sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Karriqi ingest API
        </h1>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm leading-relaxed">
          Swagger UI for the ingest contract. Hermes should use{" "}
          <a className="text-foreground underline" href={OPENAPI_JSON_PATH}>
            {OPENAPI_JSON_PATH}
          </a>{" "}
          or{" "}
          <a className="text-foreground underline" href={OPENAPI_YAML_PATH}>
            {OPENAPI_YAML_PATH}
          </a>{" "}
          as the source of truth. Click <strong>Authorize</strong> and enter your{" "}
          <code className="text-foreground">INGEST_TOKEN</code> (Bearer).
        </p>
        <p className="text-muted-foreground mt-2 text-xs">
          Env: <code>KARRIQI_URL</code>, <code>INGEST_TOKEN</code>,{" "}
          <code>USER_ID</code> (JSON <code>userId</code>)
        </p>
      </header>

      <div className="flex-1 px-2 py-4 sm:px-4">
        <DevelopersSwaggerClient />
      </div>

      <footer className="text-muted-foreground border-t px-4 py-2 text-xs">
        Docs path: {DEVELOPERS_DOCS_PATH}
      </footer>
    </main>
  );
}
