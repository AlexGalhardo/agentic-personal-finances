export const planIds = ["monthly", "annual"] as const;
export type PlanId = (typeof planIds)[number];

export const PLAN_DEFINITIONS: Record<
	PlanId,
	{ readonly amount: number; readonly months: number; readonly label: string }
> = {
	monthly: { amount: 990, months: 1, label: "Monthly" },
	annual: { amount: 9990, months: 12, label: "Annual" },
};

export const PIX_CHECKOUT_EXPIRES_SECONDS = 10 * 60;

export function planMonths(plan: string): number {
	return PLAN_DEFINITIONS[plan as PlanId]?.months ?? 1;
}

export function computePlanExpiry(base: Date, months: number): Date {
	const result = new Date(base);
	result.setMonth(result.getMonth() + months);
	return result;
}

export function isPaidRemoteStatus(status: string): boolean {
	return status === "PAID" || status === "COMPLETED";
}

export function isPlanId(value: string): value is PlanId {
	return (planIds as readonly string[]).includes(value);
}
