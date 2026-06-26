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
          hidden_from_suggestions: boolean;
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
          hidden_from_suggestions?: boolean;
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
          hidden_from_suggestions?: boolean;
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
      todo_tags: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          icon: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label: string;
          icon?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          icon?: string;
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
          priority: string;
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
          priority?: string;
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
          priority?: string;
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
      todo_attachments: {
        Row: {
          id: string;
          todo_item_id: string;
          user_id: string;
          file_name: string;
          mime_type: string | null;
          size_bytes: number | null;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          todo_item_id: string;
          user_id: string;
          file_name: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          storage_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          todo_item_id?: string;
          user_id?: string;
          file_name?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          storage_path?: string;
          created_at?: string;
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
      pulse_items: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          summary: string;
          why_it_matters: string | null;
          suggested_action: string | null;
          category: string;
          impact: string;
          urgency: string;
          status: string;
          source_type: string;
          source_url: string | null;
          source_title: string | null;
          starts_at: string | null;
          due_at: string | null;
          expires_at: string | null;
          dedupe_key: string;
          confidence: number | null;
          payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          summary: string;
          why_it_matters?: string | null;
          suggested_action?: string | null;
          category: string;
          impact: string;
          urgency: string;
          status?: string;
          source_type?: string;
          source_url?: string | null;
          source_title?: string | null;
          starts_at?: string | null;
          due_at?: string | null;
          expires_at?: string | null;
          dedupe_key: string;
          confidence?: number | null;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          summary?: string;
          why_it_matters?: string | null;
          suggested_action?: string | null;
          category?: string;
          impact?: string;
          urgency?: string;
          status?: string;
          source_type?: string;
          source_url?: string | null;
          source_title?: string | null;
          starts_at?: string | null;
          due_at?: string | null;
          expires_at?: string | null;
          dedupe_key?: string;
          confidence?: number | null;
          payload?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_pins: {
        Row: {
          user_id: string;
          pin_lookup_hash: string;
          pin_hash: string;
          failed_count: number;
          lockout_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          pin_lookup_hash: string;
          pin_hash: string;
          failed_count?: number;
          lockout_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          pin_lookup_hash?: string;
          pin_hash?: string;
          failed_count?: number;
          lockout_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      pin_ip_attempts: {
        Row: {
          ip: string;
          failed_count: number;
          lockout_until: string | null;
          last_attempt_at: string;
        };
        Insert: {
          ip: string;
          failed_count?: number;
          lockout_until?: string | null;
          last_attempt_at?: string;
        };
        Update: {
          ip?: string;
          failed_count?: number;
          lockout_until?: string | null;
          last_attempt_at?: string;
        };
        Relationships: [];
      };
      calendar_events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          start_at: string;
          end_at: string;
          all_day: boolean;
          color: string;
          google_event_id: string | null;
          google_calendar_id: string | null;
          google_etag: string | null;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          start_at: string;
          end_at: string;
          all_day?: boolean;
          color?: string;
          google_event_id?: string | null;
          google_calendar_id?: string | null;
          google_etag?: string | null;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          start_at?: string;
          end_at?: string;
          all_day?: boolean;
          color?: string;
          google_event_id?: string | null;
          google_calendar_id?: string | null;
          google_etag?: string | null;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rehab_plan_events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          start_at: string;
          end_at: string;
          all_day: boolean;
          color: string;
          completed_at: string | null;
          event_kind: string;
          program_id: string | null;
          plan_week: number | null;
          series_id: string | null;
          recurrence_rule: string | null;
          recurrence_at: string | null;
          recurrence_cancelled: boolean;
          reminder_sent_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          start_at: string;
          end_at: string;
          all_day?: boolean;
          color?: string;
          completed_at?: string | null;
          event_kind?: string;
          program_id?: string | null;
          plan_week?: number | null;
          series_id?: string | null;
          recurrence_rule?: string | null;
          recurrence_at?: string | null;
          recurrence_cancelled?: boolean;
          reminder_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          start_at?: string;
          end_at?: string;
          all_day?: boolean;
          color?: string;
          completed_at?: string | null;
          event_kind?: string;
          program_id?: string | null;
          plan_week?: number | null;
          series_id?: string | null;
          recurrence_rule?: string | null;
          recurrence_at?: string | null;
          recurrence_cancelled?: boolean;
          reminder_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      rehab_speech_recordings: {
        Row: {
          id: string;
          rehab_plan_event_id: string;
          user_id: string;
          file_name: string;
          mime_type: string | null;
          size_bytes: number | null;
          duration_seconds: number | null;
          storage_path: string;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          rehab_plan_event_id: string;
          user_id: string;
          file_name: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          duration_seconds?: number | null;
          storage_path: string;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          rehab_plan_event_id?: string;
          user_id?: string;
          file_name?: string;
          mime_type?: string | null;
          size_bytes?: number | null;
          duration_seconds?: number | null;
          storage_path?: string;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rehab_wiki_pages: {
        Row: {
          slug: string;
          title: string;
          body: string;
          parent_slug: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          slug: string;
          title: string;
          body: string;
          parent_slug?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          body?: string;
          parent_slug?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rehab_plan_catalog: {
        Row: {
          id: string;
          parent_id: string | null;
          kind: string;
          title: string;
          body: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id: string;
          parent_id?: string | null;
          kind: string;
          title: string;
          body?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string | null;
          kind?: string;
          title?: string;
          body?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      rehab_plan_item_state: {
        Row: {
          user_id: string;
          item_id: string;
          completed_at: string | null;
          notes: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          item_id: string;
          completed_at?: string | null;
          notes?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          item_id?: string;
          completed_at?: string | null;
          notes?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rehab_clinical_catalog: {
        Row: {
          id: string;
          phase: string;
          title: string;
          body: string;
          sort_order: number;
          calendar_event_kind: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          phase: string;
          title: string;
          body?: string;
          sort_order?: number;
          calendar_event_kind?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          phase?: string;
          title?: string;
          body?: string;
          sort_order?: number;
          calendar_event_kind?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      rehab_clinical_item_state: {
        Row: {
          user_id: string;
          item_id: string;
          completed_at: string | null;
          notes: string;
          subtasks_done: number[];
          updated_at: string;
        };
        Insert: {
          user_id: string;
          item_id: string;
          completed_at?: string | null;
          notes?: string;
          subtasks_done?: number[];
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          item_id?: string;
          completed_at?: string | null;
          notes?: string;
          subtasks_done?: number[];
          updated_at?: string;
        };
        Relationships: [];
      };
      rehab_stoic_completions: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          completed_at: string;
          journal_text: string | null;
          process_score: number | null;
          adapted: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_id: string;
          completed_at?: string;
          journal_text?: string | null;
          process_score?: number | null;
          adapted?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          exercise_id?: string;
          completed_at?: string;
          journal_text?: string | null;
          process_score?: number | null;
          adapted?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      rehab_journal_entries: {
        Row: {
          id: string;
          user_id: string;
          entry_date: string;
          body: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entry_date: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entry_date?: string;
          body?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rehab_user_programs: {
        Row: {
          user_id: string;
          program_id: string;
          materialized_at: string;
        };
        Insert: {
          user_id: string;
          program_id: string;
          materialized_at?: string;
        };
        Update: {
          user_id?: string;
          program_id?: string;
          materialized_at?: string;
        };
        Relationships: [];
      };
      rehab_event_reminders: {
        Row: {
          master_id: string;
          occurrence_at: string;
          sent_at: string;
        };
        Insert: {
          master_id: string;
          occurrence_at: string;
          sent_at?: string;
        };
        Update: {
          master_id?: string;
          occurrence_at?: string;
          sent_at?: string;
        };
        Relationships: [];
      };
      google_calendar_connections: {
        Row: {
          user_id: string;
          google_email: string | null;
          calendar_id: string;
          refresh_token: string;
          access_token: string | null;
          access_token_expires_at: string | null;
          sync_token: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          user_id: string;
          google_email?: string | null;
          calendar_id?: string;
          refresh_token: string;
          access_token?: string | null;
          access_token_expires_at?: string | null;
          sync_token?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          user_id?: string;
          google_email?: string | null;
          calendar_id?: string;
          refresh_token?: string;
          access_token?: string | null;
          access_token_expires_at?: string | null;
          sync_token?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      rule_of_3_evening_reminder_sends: {
        Row: {
          user_id: string;
          sent_on: string;
          sent_at: string;
        };
        Insert: {
          user_id: string;
          sent_on: string;
          sent_at?: string;
        };
        Update: {
          user_id?: string;
          sent_on?: string;
          sent_at?: string;
        };
        Relationships: [];
      };
      rule_of_3_morning_reminder_sends: {
        Row: {
          user_id: string;
          sent_on: string;
          sent_at: string;
        };
        Insert: {
          user_id: string;
          sent_on: string;
          sent_at?: string;
        };
        Update: {
          user_id?: string;
          sent_on?: string;
          sent_at?: string;
        };
        Relationships: [];
      };
      rule_of_3_days: {
        Row: {
          id: string;
          user_id: string;
          plan_date: string;
          reflection: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_date: string;
          reflection?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_date?: string;
          reflection?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rule_of_3_items: {
        Row: {
          id: string;
          day_id: string;
          position: number;
          title: string;
          notes: string;
          completed_at: string | null;
          blocked_reason: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          day_id: string;
          position: number;
          title?: string;
          notes?: string;
          completed_at?: string | null;
          blocked_reason?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          day_id?: string;
          position?: number;
          title?: string;
          notes?: string;
          completed_at?: string | null;
          blocked_reason?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      google_calendar_sources: {
        Row: {
          user_id: string;
          google_calendar_id: string;
          summary: string;
          background_color: string;
          foreground_color: string | null;
          selected: boolean;
          primary_calendar: boolean;
          access_role: string | null;
          sync_token: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          google_calendar_id: string;
          summary: string;
          background_color?: string;
          foreground_color?: string | null;
          selected?: boolean;
          primary_calendar?: boolean;
          access_role?: string | null;
          sync_token?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          google_calendar_id?: string;
          summary?: string;
          background_color?: string;
          foreground_color?: string | null;
          selected?: boolean;
          primary_calendar?: boolean;
          access_role?: string | null;
          sync_token?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      household_owner_for: {
        Args: { uid: string };
        Returns: string;
      };
      migrate_shopping_to_household_owner: {
        Args: { p_member_id: string; p_owner_id: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
