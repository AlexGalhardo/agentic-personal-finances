import type { AppFailure } from "../../failures";
import { isPaidRemoteStatus } from "../../plans/catalog";
import { ok, type Result } from "../../result";
import { completePaidCharge } from "./complete-charge";
import type { PaymentDeps } from "./payment-deps";

export type PaymentWebhookPayload = {
	readonly event: string;
	readonly data: { readonly id: string };
};

export async function handlePaymentWebhook(
	deps: PaymentDeps,
	payload: PaymentWebhookPayload,
	rawPayload: unknown = payload,
): Promise<Result<void, AppFailure>> {
	const found = await deps.store.findChargeByExternalId(payload.data.id);
	if (!found.ok) return found;
	if (!found.value) return ok(undefined);

	const charge = found.value;

	switch (payload.event) {
		case "transparent.completed": {
			const remote = await deps.gateway.getPixChargeStatus(charge.externalId);
			if (!remote.ok) return remote;

			if (!isPaidRemoteStatus(remote.value.status)) {
				return ok(undefined);
			}

			const completed = await completePaidCharge(deps, charge, payload.event, rawPayload);
			if (!completed.ok) return completed;
			break;
		}

		case "transparent.refunded":
		case "transparent.disputed":
		case "transparent.lost": {
			const failed = await deps.store.setChargeStatus(charge.id, "failed");
			if (!failed.ok) return failed;

			const logged = await deps.store.appendLog({
				userId: charge.userId,
				externalId: charge.externalId,
				eventType: payload.event,
				status: "failed",
				amount: charge.amount,
				rawPayload,
			});
			if (!logged.ok) return logged;
			break;
		}

		default:
			break;
	}

	return ok(undefined);
}
