/**
 * Replace with generated types from Supabase CLI, for example:
 * `pnpm supabase gen types typescript --project-id <id> > types/database.generated.ts`
 * then re-export Database from here.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = Record<string, never>;
