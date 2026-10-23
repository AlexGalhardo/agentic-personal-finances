import { type AppFailure, failure } from "../../failures";
import { isPaidRemoteStatus, planMonths } from "../../plans/catalog";
import { err, ok, type Result } from "../../result";
import { completePaidCharge } from "./complete-charge";
import type { PaymentDeps } from "./payment-deps";

export type PixCheckoutStatusResult = {
	readonly status: string;
	readonly planExpiresAt: Date | null;
	readonly months: number;
};

export async function getPixCheckoutStatus(
	deps: PaymentDeps,
	userId: string,
	chargeId: string,
): Promise<Result<PixCheckoutStatusResult, AppFailure>> {
	const found = await deps.store.findChargeForUser(chargeId, userId);
	if (!found.ok) return found;
	if (!found.value) return err(failure("not_found", "PIX charge not found"));

	const charge = found.value;
	const now = deps.clock.now();

	if (charge.status === "pending" && charge.expiresAt < now) {
		const expired = await deps.store.setChargeStatus(charge.id, "expired");
		if (!expired.ok) return expired;

		const logged = await deps.store.appendLog({
			userId: charge.userId,
			externalId: charge.externalId,
			eventType: "pix.expired",
			status: "expired",
			amount: charge.amount,
			rawPayload: { chargeId: charge.id, expiresAt: charge.expiresAt },
		});
		if (!logged.ok) return logged;
	} else if (charge.status === "pending") {
		const remote = await deps.gateway.getPixChargeStatus(charge.externalId);
		if (!remote.ok) return remote;

		if (isPaidRemoteStatus(remote.value.status)) {
			const completed = await completePaidCharge(deps, charge, "pix.completed", remote.value);
			if (!completed.ok) return completed;
		}
	}

	const updated = await deps.store.findChargeById(charge.id);
	if (!updated.ok) return updated;

	const userPlan = await deps.store.getUserPlan(userId);
	if (!userPlan.ok) return userPlan;

	return ok({
		status: updated.value.status,
		planExpiresAt: updated.value.status === "paid" ? userPlan.value.planExpiresAt : null,
		months: planMonths(updated.value.plan),
	});
}
