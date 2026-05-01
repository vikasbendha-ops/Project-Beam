"use client";

import { motion } from "framer-motion";

interface PinClusterProps {
  x: number; // %
  y: number; // %
  count: number;
  /** Number of unresolved threads in the cluster — drives the badge tone. */
  unresolved: number;
  /** Bubble diameter in px. */
  size?: number;
  onClick?: () => void;
}

/**
 * Aggregated pin shown when many threads land in the same canvas region
 * at low zoom. Click → zoom in + activate the first thread in the bucket.
 *
 * The colour shifts based on whether any threads are still open:
 *   - all resolved → emerald
 *   - any open      → primary (indigo)
 */
export function PinCluster({
  x,
  y,
  count,
  unresolved,
  size = 36,
  onClick,
}: PinClusterProps) {
  const allResolved = unresolved === 0 && count > 0;
  return (
    <div
      className="absolute"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <motion.button
        type="button"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        style={{
          width: size,
          height: size,
          transform: "translate(-50%, -50%)",
          boxShadow:
            "0 0 0 2px white, 0 0 0 5px rgba(79,70,229,0.25), 0 4px 14px rgba(28,25,23,0.25)",
        }}
        className={
          allResolved
            ? "rounded-full bg-emerald-500 text-[12px] font-bold tabular-nums text-white"
            : "rounded-full bg-primary text-[12px] font-bold tabular-nums text-primary-foreground"
        }
        aria-label={`${count} comments — click to expand`}
      >
        {count}
      </motion.button>
    </div>
  );
}
