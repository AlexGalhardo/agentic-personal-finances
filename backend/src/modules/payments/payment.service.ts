import type { AppFailure, PlanId, Result } from "@agentic-personal-finances/core";
import {
	createPixCheckout,
	expireOverduePlans,
	getPixCheckoutStatus,
	getPlanStatus,
	handlePaymentWebhook,
	listPaymentHistory,
	simulatePixCheckout,
} from "@agentic-personal-finances/core";
import { AbacatePayNotConfiguredError } from "../../adapters/abacatepay/payment-gateway";
import { failureToAppError } from "../../adapters/http/map-result";
import { AppError } from "../../lib/errors";
import { paymentPorts } from "./payment.deps";
import type { WebhookEvent } from "./payment.schema";

export { AbacatePayNotConfiguredError };

export class PixTestModeDisabledError extends AppError {
	constructor() {
		super("PIX test mode is disabled", 403);
	}
}

export class PixChargeNotFoundError extends AppError {
	constructor() {
		super("PIX charge not found", 404);
	}
}

function unwrapPayment<T>(result: Result<T, AppFailure>): T {
	if (result.ok) return result.value;
	if (result.error.code === "not_found") throw new PixChargeNotFoundError();
	if (result.error.code === "forbidden") throw new PixTestModeDisabledError();
	throw failureToAppError(result.error);
}

export const paymentService = {
	async getPlanStatus(userId: string): Promise<{ planStatus: string; planExpiresAt: string | null }> {
		const plan = unwrapPayment(await getPlanStatus(paymentPorts, userId));
		return {
			planStatus: plan.planStatus,
			planExpiresAt: plan.planExpiresAt?.toISOString() ?? null,
		};
	},

	async listHistory(userId: string) {
		const logs = unwrapPayment(await listPaymentHistory(paymentPorts, userId));
		return logs.map((log) => ({
			id: log.id,
			eventType: log.eventType,
			status: log.status,
			amount: log.amount,
			currency: log.currency,
			createdAt: log.createdAt.toISOString(),
		}));
	},

	async createPixCheckout(
		userId: string,
		plan: PlanId,
	): Promise<{ id: string; brCode: string; brCodeBase64: string; expiresAt: string }> {
		try {
			return unwrapPayment(await createPixCheckout(paymentPorts, userId, plan));
		} catch (error) {
			if (error instanceof AbacatePayNotConfiguredError) throw error;
			throw error;
		}
	},

	async getCheckoutStatus(
		userId: string,
		chargeId: string,
	): Promise<{ status: string; planExpiresAt: string | null; months: number }> {
		const status = unwrapPayment(await getPixCheckoutStatus(paymentPorts, userId, chargeId));
		return {
			status: status.status,
			planExpiresAt: status.planExpiresAt?.toISOString() ?? null,
			months: status.months,
		};
	},

	async simulateCheckout(userId: string, chargeId: string): Promise<void> {
		unwrapPayment(await simulatePixCheckout(paymentPorts, userId, chargeId));
	},

	async handleWebhookEvent(payload: WebhookEvent): Promise<void> {
		unwrapPayment(await handlePaymentWebhook(paymentPorts, payload, payload));
	},

	async checkExpiredPlans(): Promise<number> {
		return unwrapPayment(await expireOverduePlans(paymentPorts));
	},
};
