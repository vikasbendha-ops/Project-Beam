import { create } from "zustand";

export type CanvasMode = "comment" | "browse";
export type CommentFilter = "active" | "mine" | "resolved";
export type FitMode = "fit-width" | "fit-height" | "actual";

interface CanvasState {
  mode: CanvasMode;
  fit: FitMode;
  zoom: number; // 1 = 100% (only applies when fit === "actual")
  panX: number;
  panY: number;
  spaceHeld: boolean;
  activeThreadId: string | null;
  pendingPin: { x: number; y: number; pageNumber?: number | null } | null;
  filter: CommentFilter;
  hidePins: boolean;
  sidebarCollapsed: boolean;
  railCollapsed: boolean;

  setMode: (mode: CanvasMode) => void;
  setFit: (fit: FitMode) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  setPan: (x: number, y: number) => void;
  setSpaceHeld: (v: boolean) => void;
  setActiveThread: (id: string | null) => void;
  startPin: (
    pin: { x: number; y: number; pageNumber?: number | null } | null,
  ) => void;
  setFilter: (f: CommentFilter) => void;
  setHidePins: (v: boolean) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setRailCollapsed: (v: boolean) => void;
}

const ZOOM_MIN = 0.25;
const ZOOM_MAX = 4;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  mode: "comment",
  fit: "fit-width",
  zoom: 1,
  panX: 0,
  panY: 0,
  spaceHeld: false,
  activeThreadId: null,
  pendingPin: null,
  filter: "active",
  hidePins: false,
  sidebarCollapsed: false,
  railCollapsed: false,

  setMode: (mode) => set({ mode }),
  setFit: (fit) => set({ fit, panX: 0, panY: 0 }),
  setZoom: (zoom) =>
    set({ zoom: clamp(zoom, ZOOM_MIN, ZOOM_MAX), fit: "actual" }),
  zoomIn: () => {
    const z = clamp(get().zoom * 1.25, ZOOM_MIN, ZOOM_MAX);
    set({ zoom: z, fit: "actual" });
  },
  zoomOut: () => {
    const z = clamp(get().zoom / 1.25, ZOOM_MIN, ZOOM_MAX);
    set({ zoom: z, fit: "actual" });
  },
  resetView: () => set({ zoom: 1, panX: 0, panY: 0, fit: "fit-width" }),
  setPan: (panX, panY) => set({ panX, panY }),
  setSpaceHeld: (spaceHeld) => set({ spaceHeld }),
  setActiveThread: (activeThreadId) => set({ activeThreadId }),
  startPin: (pendingPin) => set({ pendingPin }),
  setFilter: (filter) => set({ filter }),
  setHidePins: (hidePins) => set({ hidePins }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setRailCollapsed: (railCollapsed) => set({ railCollapsed }),
}));
