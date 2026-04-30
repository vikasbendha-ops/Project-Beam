import { create } from "zustand";

interface UIState {
  newMarkupOpen: boolean;
  newMarkupTab: "url" | "file";
  mobileNavOpen: boolean;
  setNewMarkupOpen: (open: boolean, tab?: "url" | "file") => void;
  setMobileNavOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  newMarkupOpen: false,
  newMarkupTab: "file",
  mobileNavOpen: false,
  setNewMarkupOpen: (open, tab) =>
    set((state) => ({
      newMarkupOpen: open,
      newMarkupTab: tab ?? state.newMarkupTab,
    })),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
}));
