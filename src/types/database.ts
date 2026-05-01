export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      folders: {
        Row: {
          created_at: string
          created_by: string
          id: string
          name: string
          parent_folder_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          name: string
          parent_folder_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          parent_folder_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "folders_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      markup_notification_settings: {
        Row: {
          id: string
          markup_id: string
          setting: Database["public"]["Enums"]["markup_notification_default"]
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          markup_id: string
          setting?: Database["public"]["Enums"]["markup_notification_default"]
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          markup_id?: string
          setting?: Database["public"]["Enums"]["markup_notification_default"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "markup_notification_settings_markup_id_fkey"
            columns: ["markup_id"]
            isOneToOne: false
            referencedRelation: "markup_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markup_notification_settings_markup_id_fkey"
            columns: ["markup_id"]
            isOneToOne: false
            referencedRelation: "markups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markup_notification_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      markup_versions: {
        Row: {
          created_at: string
          file_name: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_current: boolean
          markup_id: string
          mime_type: string | null
          page_count: number | null
          source_url: string | null
          uploaded_by: string
          version_number: number
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_current?: boolean
          markup_id: string
          mime_type?: string | null
          page_count?: number | null
          source_url?: string | null
          uploaded_by: string
          version_number: number
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_current?: boolean
          markup_id?: string
          mime_type?: string | null
          page_count?: number | null
          source_url?: string | null
          uploaded_by?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "markup_versions_markup_id_fkey"
            columns: ["markup_id"]
            isOneToOne: false
            referencedRelation: "markup_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markup_versions_markup_id_fkey"
            columns: ["markup_id"]
            isOneToOne: false
            referencedRelation: "markups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markup_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      markups: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          archived: boolean
          created_at: string
          created_by: string
          deleted_at: string | null
          folder_id: string | null
          id: string
          source_url: string | null
          status: Database["public"]["Enums"]["markup_status"]
          thumbnail_url: string | null
          title: string
          type: Database["public"]["Enums"]["markup_type"]
          updated_at: string
          workspace_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          archived?: boolean
          created_at?: string
          created_by: string
          deleted_at?: string | null
          folder_id?: string | null
          id?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["markup_status"]
          thumbnail_url?: string | null
          title: string
          type: Database["public"]["Enums"]["markup_type"]
          updated_at?: string
          workspace_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          archived?: boolean
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          folder_id?: string | null
          id?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["markup_status"]
          thumbnail_url?: string | null
          title?: string
          type?: Database["public"]["Enums"]["markup_type"]
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "markups_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markups_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markups_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markups_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          created_at: string
          created_by: string | null
          edited_at: string | null
          guest_email: string | null
          guest_name: string | null
          id: string
          mentions: string[] | null
          parent_message_id: string | null
          reactions: Json
          thread_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          created_at?: string
          created_by?: string | null
          edited_at?: string | null
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          mentions?: string[] | null
          parent_message_id?: string | null
          reactions?: Json
          thread_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          created_at?: string
          created_by?: string | null
          edited_at?: string | null
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          mentions?: string[] | null
          parent_message_id?: string | null
          reactions?: Json
          thread_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          browser_push_enabled: boolean
          email_digest_frequency: Database["public"]["Enums"]["email_digest_frequency"]
          markup_notifications_default: Database["public"]["Enums"]["markup_notification_default"]
          updated_at: string
          user_id: string
        }
        Insert: {
          browser_push_enabled?: boolean
          email_digest_frequency?: Database["public"]["Enums"]["email_digest_frequency"]
          markup_notifications_default?: Database["public"]["Enums"]["markup_notification_default"]
          updated_at?: string
          user_id: string
        }
        Update: {
          browser_push_enabled?: boolean
          email_digest_frequency?: Database["public"]["Enums"]["email_digest_frequency"]
          markup_notifications_default?: Database["public"]["Enums"]["markup_notification_default"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content_preview: string | null
          created_at: string
          id: string
          markup_id: string | null
          message_id: string | null
          read: boolean
          read_at: string | null
          thread_id: string | null
          triggered_by: string | null
          triggered_by_guest_name: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          content_preview?: string | null
          created_at?: string
          id?: string
          markup_id?: string | null
          message_id?: string | null
          read?: boolean
          read_at?: string | null
          thread_id?: string | null
          triggered_by?: string | null
          triggered_by_guest_name?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          content_preview?: string | null
          created_at?: string
          id?: string
          markup_id?: string | null
          message_id?: string | null
          read?: boolean
          read_at?: string | null
          thread_id?: string | null
          triggered_by?: string | null
          triggered_by_guest_name?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_markup_id_fkey"
            columns: ["markup_id"]
            isOneToOne: false
            referencedRelation: "markup_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_markup_id_fkey"
            columns: ["markup_id"]
            isOneToOne: false
            referencedRelation: "markups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "threads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          timezone: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          timezone?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          timezone?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      share_links: {
        Row: {
          can_comment: boolean
          created_at: string
          created_by: string
          expires_at: string | null
          folder_id: string | null
          id: string
          is_active: boolean
          markup_id: string | null
          token: string
          workspace_id: string | null
        }
        Insert: {
          can_comment?: boolean
          created_at?: string
          created_by: string
          expires_at?: string | null
          folder_id?: string | null
          id?: string
          is_active?: boolean
          markup_id?: string | null
          token?: string
          workspace_id?: string | null
        }
        Update: {
          can_comment?: boolean
          created_at?: string
          created_by?: string
          expires_at?: string | null
          folder_id?: string | null
          id?: string
          is_active?: boolean
          markup_id?: string | null
          token?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_links_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_links_markup_id_fkey"
            columns: ["markup_id"]
            isOneToOne: false
            referencedRelation: "markup_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_links_markup_id_fkey"
            columns: ["markup_id"]
            isOneToOne: false
            referencedRelation: "markups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_links_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_links_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      threads: {
        Row: {
          created_at: string
          created_by: string | null
          device_type: Database["public"]["Enums"]["device_type"] | null
          guest_email: string | null
          guest_name: string | null
          id: string
          markup_id: string
          markup_version_id: string | null
          page_number: number | null
          priority: Database["public"]["Enums"]["thread_priority"]
          resolved_at: string | null
          resolved_by: string | null
          screenshot_url: string | null
          status: Database["public"]["Enums"]["thread_status"]
          thread_number: number
          updated_at: string
          x_position: number | null
          y_position: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          device_type?: Database["public"]["Enums"]["device_type"] | null
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          markup_id: string
          markup_version_id?: string | null
          page_number?: number | null
          priority?: Database["public"]["Enums"]["thread_priority"]
          resolved_at?: string | null
          resolved_by?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["thread_status"]
          thread_number: number
          updated_at?: string
          x_position?: number | null
          y_position?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          device_type?: Database["public"]["Enums"]["device_type"] | null
          guest_email?: string | null
          guest_name?: string | null
          id?: string
          markup_id?: string
          markup_version_id?: string | null
          page_number?: number | null
          priority?: Database["public"]["Enums"]["thread_priority"]
          resolved_at?: string | null
          resolved_by?: string | null
          screenshot_url?: string | null
          status?: Database["public"]["Enums"]["thread_status"]
          thread_number?: number
          updated_at?: string
          x_position?: number | null
          y_position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "threads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_markup_id_fkey"
            columns: ["markup_id"]
            isOneToOne: false
            referencedRelation: "markup_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_markup_id_fkey"
            columns: ["markup_id"]
            isOneToOne: false
            referencedRelation: "markups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_markup_version_id_fkey"
            columns: ["markup_version_id"]
            isOneToOne: false
            referencedRelation: "markup_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "threads_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["workspace_role"]
          token: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["workspace_role"]
          token?: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invites_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id: string
          workspace_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["workspace_role"]
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          avatar_url: string | null
          billing_customer_id: string | null
          created_at: string
          id: string
          is_personal: boolean
          name: string
          owner_id: string
          plan: string
          plan_renews_at: string | null
          plan_seats: number
          slug: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          billing_customer_id?: string | null
          created_at?: string
          id?: string
          is_personal?: boolean
          name: string
          owner_id: string
          plan?: string
          plan_renews_at?: string | null
          plan_seats?: number
          slug?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          billing_customer_id?: string | null
          created_at?: string
          id?: string
          is_personal?: boolean
          name?: string
          owner_id?: string
          plan?: string
          plan_renews_at?: string | null
          plan_seats?: number
          slug?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      markup_summary: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          archived: boolean | null
          created_at: string | null
          created_by: string | null
          folder_id: string | null
          id: string | null
          latest_version: number | null
          open_thread_count: number | null
          source_url: string | null
          status: Database["public"]["Enums"]["markup_status"] | null
          thread_count: number | null
          thumbnail_url: string | null
          title: string | null
          type: Database["public"]["Enums"]["markup_type"] | null
          updated_at: string | null
          workspace_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          archived?: boolean | null
          created_at?: string | null
          created_by?: string | null
          folder_id?: string | null
          id?: string | null
          latest_version?: never
          open_thread_count?: never
          source_url?: string | null
          status?: Database["public"]["Enums"]["markup_status"] | null
          thread_count?: never
          thumbnail_url?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["markup_type"] | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          archived?: boolean | null
          created_at?: string | null
          created_by?: string | null
          folder_id?: string | null
          id?: string | null
          latest_version?: never
          open_thread_count?: never
          source_url?: string | null
          status?: Database["public"]["Enums"]["markup_status"] | null
          thread_count?: never
          thumbnail_url?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["markup_type"] | null
          updated_at?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "markups_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markups_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markups_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspace_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "markups_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_summary: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string | null
          is_personal: boolean | null
          markup_count: number | null
          member_count: number | null
          name: string | null
          owner_id: string | null
          slug: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          is_personal?: boolean | null
          markup_count?: never
          member_count?: never
          name?: string | null
          owner_id?: string | null
          slug?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          is_personal?: boolean | null
          markup_count?: never
          member_count?: never
          name?: string | null
          owner_id?: string | null
          slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      user_has_workspace_access: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
      user_is_workspace_owner: {
        Args: { p_workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      device_type: "desktop" | "tablet" | "mobile"
      email_digest_frequency: "off" | "realtime" | "daily" | "weekly"
      markup_notification_default: "all" | "mentions" | "off"
      markup_status:
        | "draft"
        | "ready_for_review"
        | "changes_requested"
        | "approved"
      markup_type: "image" | "pdf" | "website"
      notification_type:
        | "comment"
        | "mention"
        | "reply"
        | "resolve"
        | "status_change"
        | "share"
        | "invite"
        | "approve"
      thread_priority: "none" | "low" | "medium" | "high"
      thread_status: "open" | "resolved"
      workspace_role: "owner" | "member" | "guest"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      device_type: ["desktop", "tablet", "mobile"],
      email_digest_frequency: ["off", "realtime", "daily", "weekly"],
      markup_notification_default: ["all", "mentions", "off"],
      markup_status: [
        "draft",
        "ready_for_review",
        "changes_requested",
        "approved",
      ],
      markup_type: ["image", "pdf", "website"],
      notification_type: [
        "comment",
        "mention",
        "reply",
        "resolve",
        "status_change",
        "share",
        "invite",
        "approve",
      ],
      thread_priority: ["none", "low", "medium", "high"],
      thread_status: ["open", "resolved"],
      workspace_role: ["owner", "member", "guest"],
    },
  },
} as const
