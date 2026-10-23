import type { AppFailure } from "../../failures";
import { computePlanExpiry, planMonths } from "../../plans/catalog";
import type { ChargeRecord } from "../../ports/payment-store";
import { ok, type Result } from "../../result";
import type { PaymentDeps } from "./payment-deps";

export async function activatePlanForCharge(
	deps: PaymentDeps,
	charge: Pick<ChargeRecord, "id" | "userId" | "plan">,
): Promise<Result<Date, AppFailure>> {
	const userPlan = await deps.store.getUserPlan(charge.userId);
	if (!userPlan.ok) return userPlan;

	const now = deps.clock.now();
	const base =
		userPlan.value.planStatus === "active" && userPlan.value.planExpiresAt && userPlan.value.planExpiresAt > now
			? userPlan.value.planExpiresAt
			: now;
	const planExpiresAt = computePlanExpiry(base, planMonths(charge.plan));

	const applied = await deps.store.applyPaidPlan({
		chargeId: charge.id,
		userId: charge.userId,
		planExpiresAt,
	});
	if (!applied.ok) return applied;

	return ok(planExpiresAt);
}

export async function completePaidCharge(
	deps: PaymentDeps,
	charge: ChargeRecord,
	eventType: string,
	rawPayload: unknown,
): Promise<Result<void, AppFailure>> {
	if (charge.status !== "paid") {
		const activated = await activatePlanForCharge(deps, charge);
		if (!activated.ok) return activated;
	}

	const logged = await deps.store.appendLog({
		userId: charge.userId,
		externalId: charge.externalId,
		eventType,
		status: "succeeded",
		amount: charge.amount,
		rawPayload,
	});
	if (!logged.ok) return logged;

	return ok(undefined);
}
