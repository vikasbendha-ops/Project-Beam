"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ThreadPriority } from "@/components/canvas/types";

interface PinProps {
  number: number;
  x: number; // %
  y: number; // %
  active?: boolean;
  resolved?: boolean;
  /** Thread priority. Drives the outer halo color. */
  priority?: ThreadPriority;
  onClick?: () => void;
  /** When provided, the pin becomes draggable. Receives the new % coords
   *  on release. Click is suppressed if a drag occurred. */
  onMove?: (x: number, y: number) => void;
  size?: number; // px (28 desktop / 32 mobile)
  className?: string;
  /** Optional preview text shown in hover tooltip (first message). */
  previewText?: string;
  /** Optional reply count shown in hover tooltip. */
  replyCount?: number;
}

/**
 * Outer halo by priority. Layered as `box-shadow` so it composes with the
 * white inner ring (`outline: 2px solid white; outline-offset: -2px`).
 *
 *   layer 0  ← outline (white, drawn on the button itself)
 *   layer 1  ← box-shadow priority halo (drawn outside the outline)
 *   layer 2  ← drop shadow underneath
 */
const PRIORITY_GLOW: Record<ThreadPriority, string> = {
  none: "0 2px 6px rgba(28,25,23,0.18)",
  low: "0 0 0 3px rgba(56,189,248,0.55), 0 2px 6px rgba(28,25,23,0.18)",
  medium: "0 0 0 3px rgba(245,158,11,0.6), 0 2px 6px rgba(28,25,23,0.18)",
  high: "0 0 0 3px rgba(239,68,68,0.7), 0 4px 10px rgba(239,68,68,0.3)",
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function Pin({
  number,
  x,
  y,
  active = false,
  resolved = false,
  priority = "none",
  onClick,
  onMove,
  size = 28,
  className,
  previewText,
  replyCount,
}: PinProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const [hover, setHover] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Resolved pins recede until hover/active.
  const scale = active ? 1.15 : resolved && !hover ? 0.75 : 1;
  const opacity = resolved && !active && !hover ? 0.7 : 1;

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (!onMove) return;
    if (e.button !== 0) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const parent = wrapper.parentElement;
    if (!parent) return;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    let dragged = false;

    function onMoveEvt(ev: PointerEvent) {
      const dx = ev.clientX - startClientX;
      const dy = ev.clientY - startClientY;
      if (!dragged && Math.abs(dx) + Math.abs(dy) < 4) return;
      if (!dragged) {
        dragged = true;
        draggedRef.current = true;
        setDragging(true);
      }
      const rect = parent!.getBoundingClientRect();
      const newX = clamp(((ev.clientX - rect.left) / rect.width) * 100, 0, 100);
      const newY = clamp(((ev.clientY - rect.top) / rect.height) * 100, 0, 100);
      // Imperatively update wrapper position so framer's `animate` doesn't
      // fight the drag — once released, parent state updates and the
      // wrapper's left/top % flow back through React.
      if (wrapperRef.current) {
        wrapperRef.current.style.left = `${newX}%`;
        wrapperRef.current.style.top = `${newY}%`;
      }
    }

    function onUp(ev: PointerEvent) {
      window.removeEventListener("pointermove", onMoveEvt);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      setDragging(false);
      if (dragged) {
        const rect = parent!.getBoundingClientRect();
        const newX = clamp(
          ((ev.clientX - rect.left) / rect.width) * 100,
          0,
          100,
        );
        const newY = clamp(
          ((ev.clientY - rect.top) / rect.height) * 100,
          0,
          100,
        );
        onMove?.(newX, newY);
        // Suppress the next click; reset on next tick.
        setTimeout(() => {
          draggedRef.current = false;
        }, 0);
      }
    }

    window.addEventListener("pointermove", onMoveEvt);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  function handleClick(e: React.MouseEvent) {
    if (draggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    e.stopPropagation();
    onClick?.();
  }

  return (
    <div
      ref={wrapperRef}
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <motion.button
        type="button"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: dragging ? scale * 1.08 : scale,
          opacity,
          rotate: dragging ? -3 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 420,
          damping: 22,
          mass: 0.7,
        }}
        whileTap={onMove ? { scale: scale * 0.95 } : undefined}
        onPointerDown={onPointerDown}
        onClick={handleClick}
        style={{
          width: size,
          height: size,
          transform: "translate(-50%, -50%)",
          boxShadow: dragging
            ? "0 12px 24px rgba(28,25,23,0.32)"
            : active
              ? "0 0 0 3px var(--primary), 0 4px 10px rgba(79,70,229,0.3)"
              : PRIORITY_GLOW[priority],
          // White inner ring drawn as outline so it composes with the
          // priority halo box-shadow above.
          outline: "2px solid white",
          outlineOffset: -2,
          cursor: onMove ? (dragging ? "grabbing" : "grab") : "pointer",
        }}
        className={cn(
          "rounded-full text-[11px] font-bold text-primary-foreground",
          resolved
            ? "bg-emerald-500 hover:bg-emerald-600"
            : "bg-primary hover:bg-primary-hover",
          className,
        )}
        aria-label={`Pin ${number}${
          priority !== "none" ? ` · ${priority} priority` : ""
        }`}
      >
        {number}
      </motion.button>

      {/* Hover preview tooltip */}
      {hover && previewText && !active && !dragging ? (
        <div
          className="pointer-events-none absolute z-40 -translate-x-1/2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] shadow-modal"
          style={{
            left: 0,
            top: -size / 2 - 8,
            transform: "translate(-50%, -100%)",
            maxWidth: 220,
          }}
        >
          <p className="line-clamp-3 text-foreground">{previewText}</p>
          {replyCount && replyCount > 0 ? (
            <p className="mt-0.5 text-[10px] font-semibold text-muted-foreground">
              {replyCount} {replyCount === 1 ? "reply" : "replies"}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
