/**
 * Supabase schema types. Regenerate after migrations, e.g.:
 * `pnpm supabase gen types typescript --project-id <id> > types/database.generated.ts`
 * and merge into this file.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      staples: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string | null;
          unit: string | null;
          typical_interval_days: number | null;
          last_purchased_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category?: string | null;
          unit?: string | null;
          typical_interval_days?: number | null;
          last_purchased_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string | null;
          unit?: string | null;
          typical_interval_days?: number | null;
          last_purchased_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      purchase_events: {
        Row: {
          id: string;
          user_id: string;
          staple_id: string | null;
          item_name: string;
          purchased_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          staple_id?: string | null;
          item_name: string;
          purchased_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          staple_id?: string | null;
          item_name?: string;
          purchased_at?: string;
        };
        Relationships: [];
      };
      shopping_list_items: {
        Row: {
          id: string;
          user_id: string;
          staple_id: string | null;
          name: string;
          quantity: string | null;
          checked: boolean;
          position: number;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          staple_id?: string | null;
          name: string;
          quantity?: string | null;
          checked?: boolean;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          staple_id?: string | null;
          name?: string;
          quantity?: string | null;
          checked?: boolean;
          position?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      household_members: {
        Row: {
          id: string;
          owner_user_id: string;
          member_user_id: string;
          display_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          member_user_id: string;
          display_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string;
          member_user_id?: string;
          display_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      todo_items: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: string | null;
          description: string | null;
          status: string;
          position: number;
          list_order: number;
          due_at: string | null;
          progress_percent: number | null;
          assigned_user_id: string | null;
          created_at: string;
          updated_at: string;
          last_stale_notification_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          category?: string | null;
          description?: string | null;
          status?: string;
          position?: number;
          list_order?: number;
          due_at?: string | null;
          progress_percent?: number | null;
          assigned_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
          last_stale_notification_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: string | null;
          description?: string | null;
          status?: string;
          position?: number;
          list_order?: number;
          due_at?: string | null;
          progress_percent?: number | null;
          assigned_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
          last_stale_notification_at?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          title: string;
          body: string | null;
          href: string | null;
          metadata: Json | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: string;
          title: string;
          body?: string | null;
          href?: string | null;
          metadata?: Json | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: string;
          title?: string;
          body?: string | null;
          href?: string | null;
          metadata?: Json | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      todo_comments: {
        Row: {
          id: string;
          todo_item_id: string;
          user_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          todo_item_id: string;
          user_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          todo_item_id?: string;
          user_id?: string;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      todo_subtasks: {
        Row: {
          id: string;
          todo_item_id: string;
          label: string;
          done: boolean;
          position: number;
        };
        Insert: {
          id?: string;
          todo_item_id: string;
          label: string;
          done?: boolean;
          position?: number;
        };
        Update: {
          id?: string;
          todo_item_id?: string;
          label?: string;
          done?: boolean;
          position?: number;
        };
        Relationships: [];
      };
      operator_entries: {
        Row: {
          id: string;
          user_id: string;
          kind: string;
          title: string;
          summary: string | null;
          dedupe_key: string;
          starts_at: string | null;
          ends_at: string | null;
          payload: Json;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          kind: string;
          title: string;
          summary?: string | null;
          dedupe_key: string;
          starts_at?: string | null;
          ends_at?: string | null;
          payload: Json;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          kind?: string;
          title?: string;
          summary?: string | null;
          dedupe_key?: string;
          starts_at?: string | null;
          ends_at?: string | null;
          payload?: Json;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
