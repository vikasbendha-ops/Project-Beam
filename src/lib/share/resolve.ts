import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

interface ResolvedShare {
  id: string;
  token: string;
  markup_id: string;
  can_comment: boolean;
  /** When false, hide every existing comment from the guest (no list,
   *  no pin overlay, no count badge). */
  can_view_comments: boolean;
  expired: boolean;
  is_active: boolean;
}

/**
 * Look up a share token and return the linked markup id + permissions.
 * Returns `null` for unknown / inactive / expired tokens.
 *
 * Caller must use the service-role client because share links are read by
 * unauthenticated guests (RLS would block them otherwise).
 */
export async function resolveShareToken(
  supabase: SupabaseClient<Database>,
  token: string,
): Promise<ResolvedShare | null> {
  const { data } = await supabase
    .from("share_links")
    .select(
      "id, token, markup_id, can_comment, can_view_comments, expires_at, is_active",
    )
    .eq("token", token)
    .maybeSingle();

  if (!data || !data.markup_id) return null;
  if (!data.is_active) return null;
  const expired = data.expires_at
    ? new Date(data.expires_at) < new Date()
    : false;
  if (expired) return null;

  return {
    id: data.id,
    token: data.token,
    markup_id: data.markup_id,
    can_comment: data.can_comment,
    can_view_comments: data.can_view_comments ?? true,
    expired,
    is_active: data.is_active,
  };
}
