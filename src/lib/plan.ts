export type Plan = "free" | "pro" | "team";

/**
 * Plan limits gate is OFF for the current phase — every plan is treated
 * as unlimited so we don't block users while pricing is finalised. The
 * shape stays intact so the Settings → Plan & billing UI can still show
 * relative comparisons; flip these back to numbers later to re-enable
 * enforcement at /api/markups + /api/invites.
 */
export const PLAN_LIMITS: Record<Plan, { markups: number | null; seats: number }> = {
  free: { markups: null, seats: 1000 },
  pro: { markups: null, seats: 1000 },
  team: { markups: null, seats: 1000 },
};

export function isPlan(value: unknown): value is Plan {
  return value === "free" || value === "pro" || value === "team";
}
