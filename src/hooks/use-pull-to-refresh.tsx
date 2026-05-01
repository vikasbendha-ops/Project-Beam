"use client";

import { useEffect, useRef, useState } from "react";

interface PullState {
  pulling: boolean;
  /** 0–1 where 1 means threshold reached (release to refresh). */
  progress: number;
}

/**
 * iOS-style pull-to-refresh on a scrollable container. Activates only when
 * scrollTop is 0 and finger pulls down. The caller renders a small spinner
 * pinned at the top of the page based on returned progress.
 */
export function usePullToRefresh(
  onRefresh: () => Promise<void> | void,
  { threshold = 80, enabled = true }: { threshold?: number; enabled?: boolean } = {},
): PullState {
  const startY = useRef<number | null>(null);
  const refreshing = useRef(false);
  const [state, setState] = useState<PullState>({
    pulling: false,
    progress: 0,
  });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (window.matchMedia("(min-width: 768px)").matches) return;

    function onTouchStart(e: TouchEvent) {
      if (refreshing.current) return;
      if (window.scrollY > 0) return;
      startY.current = e.touches[0]!.clientY;
    }

    function onTouchMove(e: TouchEvent) {
      if (startY.current == null || refreshing.current) return;
      const dy = e.touches[0]!.clientY - startY.current;
      if (dy <= 0) return;
      const progress = Math.min(1, dy / threshold);
      setState({ pulling: true, progress });
    }

    async function onTouchEnd() {
      if (startY.current == null || refreshing.current) {
        startY.current = null;
        return;
      }
      const wasPulling = state.pulling;
      const reached = state.progress >= 1;
      startY.current = null;
      setState({ pulling: false, progress: 0 });
      if (wasPulling && reached) {
        refreshing.current = true;
        try {
          await onRefresh();
        } finally {
          refreshing.current = false;
        }
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [enabled, onRefresh, threshold, state.pulling, state.progress]);

  return state;
}
