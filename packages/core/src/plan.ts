export const FREE_TRANSACTION_LIMIT = 10;

export type PlanFields = {
	readonly plan: string;
	readonly planExpiresAt: Date | null;
};

export function hasActivePlan(user: PlanFields, now: Date): boolean {
	return user.plan === "active" && (user.planExpiresAt === null || user.planExpiresAt > now);
}

/** How many more transactions the user may create right now (unbounded on an active plan). */
export function transactionAllowance(user: PlanFields & { readonly transactionCount: number }, now: Date): number {
	if (hasActivePlan(user, now)) return Number.POSITIVE_INFINITY;
	return Math.max(0, FREE_TRANSACTION_LIMIT - user.transactionCount);
}
