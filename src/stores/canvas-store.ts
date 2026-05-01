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
  /** Animated zoom — eases from current to target over ~130ms. Used by
   *  wheel zoom + zoom controls so the change reads as motion, not snap. */
  setZoomSmooth: (zoom: number) => void;
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
const ZOOM_DUR_MS = 130;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// rAF state for smooth zoom — held outside store to avoid re-renders.
let _zoomRaf: number | null = null;

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
  setZoomSmooth: (zoom) => {
    if (typeof window === "undefined") {
      set({ zoom: clamp(zoom, ZOOM_MIN, ZOOM_MAX), fit: "actual" });
      return;
    }
    const target = clamp(zoom, ZOOM_MIN, ZOOM_MAX);
    const from = get().zoom;
    if (Math.abs(target - from) < 0.001) {
      set({ fit: "actual" });
      return;
    }
    const start = performance.now();
    if (_zoomRaf != null) cancelAnimationFrame(_zoomRaf);
    set({ fit: "actual" });
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ZOOM_DUR_MS);
      // ease-out cubic — fast start, gentle settle.
      const eased = 1 - Math.pow(1 - p, 3);
      set({ zoom: from + (target - from) * eased });
      if (p < 1) _zoomRaf = requestAnimationFrame(tick);
      else _zoomRaf = null;
    };
    _zoomRaf = requestAnimationFrame(tick);
  },
  zoomIn: () => {
    const z = clamp(get().zoom * 1.25, ZOOM_MIN, ZOOM_MAX);
    if (typeof window === "undefined") {
      set({ zoom: z, fit: "actual" });
    } else {
      get().setZoomSmooth(z);
    }
  },
  zoomOut: () => {
    const z = clamp(get().zoom / 1.25, ZOOM_MIN, ZOOM_MAX);
    if (typeof window === "undefined") {
      set({ zoom: z, fit: "actual" });
    } else {
      get().setZoomSmooth(z);
    }
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
