"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PinProps {
  number: number;
  x: number; // %
  y: number; // %
  active?: boolean;
  resolved?: boolean;
  onClick?: () => void;
  size?: number; // px (28 desktop / 32 mobile)
  className?: string;
  /** Optional preview text shown in hover tooltip (first message). */
  previewText?: string;
  /** Optional reply count shown in hover tooltip. */
  replyCount?: number;
}

export function Pin({
  number,
  x,
  y,
  active = false,
  resolved = false,
  onClick,
  size = 28,
  className,
  previewText,
  replyCount,
}: PinProps) {
  const [hover, setHover] = useState(false);
  // Resolved pins: 75% scale, 70% opacity until hover/active so they recede.
  const scale = active ? 1.15 : resolved && !hover ? 0.75 : 1;
  const opacity = resolved && !active && !hover ? 0.7 : 1;

  return (
    <div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <motion.button
        type="button"
        initial={{ scale: 0 }}
        animate={{ scale, opacity }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 18,
          duration: 0.25,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        style={{
          width: size,
          height: size,
          transform: "translate(-50%, -50%)",
        }}
        className={cn(
          "rounded-full text-[11px] font-bold text-primary-foreground ring-2 ring-card transition-shadow",
          resolved
            ? "bg-emerald-500 hover:bg-emerald-600"
            : "bg-primary hover:bg-primary-hover",
          active && "ring-[3px] ring-primary",
          "shadow-[0_2px_6px_rgba(28,25,23,0.18)] hover:shadow-lg",
          className,
        )}
        aria-label={`Pin ${number}`}
      >
        {number}
      </motion.button>

      {/* Hover preview tooltip */}
      {hover && previewText && !active ? (
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
