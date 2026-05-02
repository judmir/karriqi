/**
 * Server-only env for Hermes → Karriqi operator ingest. Never reference from client code.
 */
export function readOperatorIngestToken(): string | null {
  const token = process.env.OPERATOR_INGEST_TOKEN?.trim();
  return token && token.length > 0 ? token : null;
}
