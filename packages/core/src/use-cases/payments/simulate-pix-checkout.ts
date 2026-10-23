import { type AppFailure, failure } from "../../failures";
import { err, type Result } from "../../result";
import { completePaidCharge } from "./complete-charge";
import type { PaymentDeps } from "./payment-deps";

export async function simulatePixCheckout(
	deps: PaymentDeps,
	userId: string,
	chargeId: string,
): Promise<Result<void, AppFailure>> {
	if (!deps.pixTestMode) {
		return err(failure("forbidden", "PIX test mode is disabled"));
	}

	const found = await deps.store.findChargeForUser(chargeId, userId);
	if (!found.ok) return found;
	if (!found.value) return err(failure("not_found", "PIX charge not found"));

	const remote = await deps.gateway.simulatePixPayment(found.value.externalId);
	if (!remote.ok) return remote;

	return completePaidCharge(deps, found.value, "pix.completed", remote.value);
}
