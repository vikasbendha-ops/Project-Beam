"use client";

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
}: PinProps) {
  return (
    <motion.button
      type="button"
      initial={{ scale: 0 }}
      animate={{ scale: active ? 1.15 : 1 }}
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
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
      }}
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 rounded-full text-[11px] font-bold text-primary-foreground ring-2 ring-card transition-shadow",
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
  );
}
