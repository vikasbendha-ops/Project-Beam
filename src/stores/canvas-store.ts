import { create } from "zustand";

export type CanvasMode = "comment" | "browse";
export type CommentFilter = "all" | "mine" | "resolved";

interface CanvasState {
  mode: CanvasMode;
  zoom: number; // 1 = 100%
  panX: number;
  panY: number;
  activeThreadId: string | null;
  /** A pending pin position (x, y in %) before the user submits the first message. */
  pendingPin: { x: number; y: number; pageNumber?: number | null } | null;
  filter: CommentFilter;
  composerOpen: boolean;

  setMode: (mode: CanvasMode) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  setPan: (x: number, y: number) => void;
  setActiveThread: (id: string | null) => void;
  startPin: (
    pin: { x: number; y: number; pageNumber?: number | null } | null,
  ) => void;
  setFilter: (f: CommentFilter) => void;
  setComposerOpen: (v: boolean) => void;
}

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  mode: "comment",
  zoom: 1,
  panX: 0,
  panY: 0,
  activeThreadId: null,
  pendingPin: null,
  filter: "all",
  composerOpen: false,

  setMode: (mode) => set({ mode }),
  setZoom: (zoom) =>
    set({ zoom: clamp(zoom, ZOOM_MIN, ZOOM_MAX) }),
  zoomIn: () => {
    const z = clamp(get().zoom * 1.25, ZOOM_MIN, ZOOM_MAX);
    set({ zoom: z });
  },
  zoomOut: () => {
    const z = clamp(get().zoom / 1.25, ZOOM_MIN, ZOOM_MAX);
    set({ zoom: z });
  },
  resetView: () => set({ zoom: 1, panX: 0, panY: 0 }),
  setPan: (panX, panY) => set({ panX, panY }),
  setActiveThread: (activeThreadId) => set({ activeThreadId }),
  startPin: (pendingPin) => set({ pendingPin, composerOpen: !!pendingPin }),
  setFilter: (filter) => set({ filter }),
  setComposerOpen: (composerOpen) => set({ composerOpen }),
}));

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
