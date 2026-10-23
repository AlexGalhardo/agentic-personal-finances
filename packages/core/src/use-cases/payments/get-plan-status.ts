import type { AppFailure } from "../../failures";
import { ok, type Result } from "../../result";
import type { PaymentDeps } from "./payment-deps";

export type PlanStatusResult = {
	readonly planStatus: string;
	readonly planExpiresAt: Date | null;
};

export async function getPlanStatus(deps: PaymentDeps, userId: string): Promise<Result<PlanStatusResult, AppFailure>> {
	const plan = await deps.store.getUserPlan(userId);
	if (!plan.ok) return plan;
	return ok(plan.value);
}
