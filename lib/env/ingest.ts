/**
 * Server-only env for third-party ingest (Hermes, cron jobs). Never reference from client code.
 */
export function readIngestToken(): string | null {
  const token = process.env.INGEST_TOKEN?.trim();
  return token && token.length > 0 ? token : null;
}
