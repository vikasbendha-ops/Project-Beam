"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to threads + messages for a markup. On any insert/update/delete
 * we call `router.refresh()` so the server component reloads — simpler and
 * more correct than mutating a local cache, and the page is already small.
 */
export function useRealtimeCanvas(markupId: string) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`canvas:${markupId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "threads",
          filter: `markup_id=eq.${markupId}`,
        },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        // We don't have markup_id on messages, so refresh on any message
        // change. RLS already scoped reads to threads we can see.
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "markups",
          filter: `id=eq.${markupId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [markupId, router]);
}
