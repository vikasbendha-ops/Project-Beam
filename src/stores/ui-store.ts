import { create } from "zustand";

interface UIState {
  newMarkupOpen: boolean;
  newMarkupTab: "url" | "file";
  mobileNavOpen: boolean;
  /** True while the user is on a "focus" route (canvas viewer). The
   *  AppShell sets this from `usePathname` and uses it to decide whether
   *  to inline-render the sidebar/topnav or stash them behind a toggle. */
  focusMode: boolean;
  /** Whether the workspace nav (sidebar + topnav) is revealed in focus
   *  mode. Ignored when not in focus mode. */
  focusMenuOpen: boolean;
  setNewMarkupOpen: (open: boolean, tab?: "url" | "file") => void;
  setMobileNavOpen: (open: boolean) => void;
  setFocusMode: (v: boolean) => void;
  setFocusMenuOpen: (v: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  newMarkupOpen: false,
  newMarkupTab: "file",
  mobileNavOpen: false,
  focusMode: false,
  focusMenuOpen: false,
  setNewMarkupOpen: (open, tab) =>
    set((state) => ({
      newMarkupOpen: open,
      newMarkupTab: tab ?? state.newMarkupTab,
    })),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  setFocusMode: (v) => set({ focusMode: v, focusMenuOpen: false }),
  setFocusMenuOpen: (v) => set({ focusMenuOpen: v }),
}));
