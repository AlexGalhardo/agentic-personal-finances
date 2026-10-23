import { type AppFailure, failure } from "../../failures";
import { isPlanId, PIX_CHECKOUT_EXPIRES_SECONDS, PLAN_DEFINITIONS, type PlanId } from "../../plans/catalog";
import { err, ok, type Result } from "../../result";
import type { PaymentDeps } from "./payment-deps";

export type CreatePixCheckoutResult = {
	readonly id: string;
	readonly brCode: string;
	readonly brCodeBase64: string;
	readonly expiresAt: string;
};

export async function createPixCheckout(
	deps: PaymentDeps,
	userId: string,
	plan: PlanId,
): Promise<Result<CreatePixCheckoutResult, AppFailure>> {
	if (!isPlanId(plan)) {
		return err(failure("invalid_input", "Invalid plan"));
	}

	const definition = PLAN_DEFINITIONS[plan];
	const remote = await deps.gateway.createPixCharge({
		amount: definition.amount,
		description: `Agentic Personal Finances - plan ${definition.label}`,
		expiresInSeconds: PIX_CHECKOUT_EXPIRES_SECONDS,
		metadata: { userId, plan },
	});
	if (!remote.ok) return remote;

	const expiresAt =
		remote.value.expiresAt ??
		new Date(deps.clock.now().getTime() + PIX_CHECKOUT_EXPIRES_SECONDS * 1000).toISOString();

	const stored = await deps.store.createPendingCharge({
		userId,
		externalId: remote.value.id,
		plan,
		amount: definition.amount,
		brCode: remote.value.brCode,
		brCodeBase64: remote.value.brCodeBase64,
		expiresAt: new Date(expiresAt),
	});
	if (!stored.ok) return stored;

	const logged = await deps.store.appendLog({
		userId,
		externalId: remote.value.id,
		eventType: "pix.created",
		status: "pending",
		amount: definition.amount,
		rawPayload: remote.value,
	});
	if (!logged.ok) return logged;

	return ok({
		id: stored.value.chargeId,
		brCode: remote.value.brCode,
		brCodeBase64: remote.value.brCodeBase64,
		expiresAt,
	});
}
