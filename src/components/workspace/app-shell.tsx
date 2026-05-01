"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

interface AppShellProps {
  sidebar: ReactNode;
  topNav: ReactNode;
  mobileDrawer: ReactNode;
  modals: ReactNode;
  children: ReactNode;
}

const FOCUS_ROUTES = [/\/markup\/[^/]+(\/versions)?$/];

/**
 * Two-layout client wrapper.
 *
 * Normal routes — sidebar + topnav are pinned, content takes the rest of
 * the screen. Same as before.
 *
 * Focus routes (canvas viewer + version-history) — sidebar and topnav are
 * hidden by default and the page goes edge-to-edge. A toggle lifts them
 * back in as overlays (not push-content) so the canvas keeps its full
 * width. Esc closes the overlay.
 *
 * Detection runs from `usePathname` and lives in the UI store so any
 * component (e.g. CanvasTopBar) can drive the toggle without prop-drilling.
 */
export function AppShell({
  sidebar,
  topNav,
  mobileDrawer,
  modals,
  children,
}: AppShellProps) {
  const pathname = usePathname() ?? "";
  const focusMode = useUIStore((s) => s.focusMode);
  const focusMenuOpen = useUIStore((s) => s.focusMenuOpen);
  const setFocusMode = useUIStore((s) => s.setFocusMode);
  const setFocusMenuOpen = useUIStore((s) => s.setFocusMenuOpen);

  // Track focus route in the store. Reset menu state on route change.
  useEffect(() => {
    const isFocus = FOCUS_ROUTES.some((r) => r.test(pathname));
    setFocusMode(isFocus);
  }, [pathname, setFocusMode]);

  // Esc to close the focus-mode overlay.
  useEffect(() => {
    if (!focusMode || !focusMenuOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setFocusMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusMode, focusMenuOpen, setFocusMenuOpen]);

  if (!focusMode) {
    return (
      <div className="flex min-h-screen bg-background">
        {sidebar}
        {mobileDrawer}
        <div className="flex min-w-0 flex-1 flex-col">
          {topNav}
          <main className="flex-1">{children}</main>
        </div>
        {modals}
      </div>
    );
  }

  // Focus mode — content edge-to-edge, sidebar + topnav as overlays.
  return (
    <div className="relative min-h-screen bg-background">
      <main className="min-h-screen">{children}</main>

      {/* Backdrop scrim, only when overlay is open. */}
      <div
        onClick={() => setFocusMenuOpen(false)}
        aria-hidden
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm transition-opacity duration-200",
          focusMenuOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0",
        )}
      />

      {/* Sidebar overlay — slides in from the left. The sidebar self-sizes
          to 280px; the wrapper just animates the slide so we don't override
          its intrinsic width. */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden transition-transform duration-200 md:block",
          focusMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebar}
      </div>

      {/* TopNav overlay — pinned to the right of the sidebar slot, slides
          down. Stays at left:280 even when the sidebar is tucked away so
          the translate-Y animation runs cleanly. */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 hidden transition-transform duration-200 md:block",
          focusMenuOpen
            ? "translate-y-0"
            : "pointer-events-none -translate-y-full",
        )}
        style={{ left: 280 }}
      >
        {topNav}
      </div>

      {/* Mobile drawer + modals stay mounted regardless of focus. */}
      {mobileDrawer}
      {modals}
    </div>
  );
}
