import type { Database } from "@/types/database";

export type MarkupType = Database["public"]["Enums"]["markup_type"];
export type MarkupStatus = Database["public"]["Enums"]["markup_status"];
export type ThreadStatus = Database["public"]["Enums"]["thread_status"];
export type ThreadPriority = Database["public"]["Enums"]["thread_priority"];

export interface CanvasMarkup {
  id: string;
  title: string;
  type: MarkupType;
  status: MarkupStatus;
  source_url: string | null;
  archived: boolean;
  canvasUrl: string | null;
}

export interface CanvasVersion {
  id: string;
  version_number: number;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  page_count: number | null;
}

export interface CanvasMessage {
  id: string;
  content: string;
  attachments: unknown;
  mentions: string[] | null;
  created_by: string | null;
  guest_name: string | null;
  guest_email: string | null;
  created_at: string | null;
  edited_at: string | null;
  parent_message_id: string | null;
}

export interface CanvasThread {
  id: string;
  thread_number: number;
  x_position: number | null;
  y_position: number | null;
  page_number: number | null;
  status: ThreadStatus;
  priority: ThreadPriority;
  created_by: string | null;
  guest_name: string | null;
  guest_email: string | null;
  created_at: string | null;
  updated_at: string | null;
  resolved_at: string | null;
  messages: CanvasMessage[] | null;
}

export interface CanvasProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface CanvasCurrentUser {
  id: string;
  email: string;
  role: "owner" | "member" | "guest";
}

export interface CanvasSibling {
  id: string;
  title: string;
  type: MarkupType;
  thumbnail_url: string | null;
  archived: boolean;
  status: MarkupStatus;
}
