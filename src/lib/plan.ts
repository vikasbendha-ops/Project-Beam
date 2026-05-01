export type Plan = "free" | "pro" | "team";

export const PLAN_LIMITS: Record<Plan, { markups: number | null; seats: number }> = {
  free: { markups: 5, seats: 3 },
  pro: { markups: null, seats: 10 },
  team: { markups: null, seats: 50 },
};

export function isPlan(value: unknown): value is Plan {
  return value === "free" || value === "pro" || value === "team";
}
