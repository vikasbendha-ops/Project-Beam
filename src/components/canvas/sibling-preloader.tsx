"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { CanvasSibling } from "@/components/canvas/types";

interface SiblingPreloaderProps {
  workspaceId: string;
  currentId: string;
  siblings: CanvasSibling[];
}

/**
 * Warms the HTTP image cache + Next.js router cache for the previous and
 * next sibling MarkUps so left/right navigation feels instant.
 *
 * - For the image cache: creates throwaway `Image()` objects whose `src`
 *   triggers a fetch in the background. Browser dedupes against the
 *   eventual <img src> when the user navigates.
 * - For the router cache: calls `router.prefetch(...)` so Next has the
 *   server-rendered HTML ready to swap in.
 */
export function SiblingPreloader({
  workspaceId,
  currentId,
  siblings,
}: SiblingPreloaderProps) {
  const router = useRouter();

  useEffect(() => {
    const idx = siblings.findIndex((s) => s.id === currentId);
    if (idx < 0) return;
    const targets = [siblings[idx - 1], siblings[idx + 1]].filter(
      (s): s is CanvasSibling => Boolean(s),
    );
    if (targets.length === 0) return;

    const handles: HTMLImageElement[] = [];
    targets.forEach((s) => {
      router.prefetch(`/w/${workspaceId}/markup/${s.id}`);
      if (s.thumbnail_url) {
        const img = new Image();
        img.fetchPriority = "low";
        img.decoding = "async";
        img.src = s.thumbnail_url;
        handles.push(img);
      }
    });
    return () => {
      handles.forEach((img) => {
        // Cancel any in-flight fetch.
        img.src = "";
      });
    };
  }, [router, workspaceId, currentId, siblings]);

  return null;
}
