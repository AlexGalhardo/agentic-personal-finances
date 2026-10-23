import { err, failure, ok, type PaymentGateway, type PixChargeRemote } from "@agentic-personal-finances/core";
import { AbacatePayNotConfiguredError, AbacatePayRequestError, abacatepay } from "../../lib/abacatepay";

function toRemote(charge: {
	id: string;
	status: string;
	brCode: string;
	brCodeBase64: string;
	expiresAt: string;
}): PixChargeRemote {
	return {
		id: charge.id,
		status: charge.status,
		brCode: charge.brCode,
		brCodeBase64: charge.brCodeBase64,
		expiresAt: charge.expiresAt ?? null,
	};
}

export function createAbacatePayGateway(): PaymentGateway {
	return {
		async createPixCharge(input) {
			try {
				const charge = await abacatepay.createPixCharge({
					amount: input.amount,
					description: input.description,
					expiresIn: input.expiresInSeconds,
					metadata: { ...input.metadata },
				});
				return ok(toRemote(charge));
			} catch (error) {
				if (error instanceof AbacatePayNotConfiguredError) throw error;
				if (error instanceof AbacatePayRequestError) {
					return err(failure("failed", error.message));
				}
				throw error;
			}
		},

		async getPixChargeStatus(externalId) {
			try {
				const charge = await abacatepay.checkPixCharge(externalId);
				return ok(toRemote(charge));
			} catch (error) {
				if (error instanceof AbacatePayNotConfiguredError) throw error;
				if (error instanceof AbacatePayRequestError) {
					return err(failure("failed", error.message));
				}
				throw error;
			}
		},

		async simulatePixPayment(externalId) {
			try {
				const charge = await abacatepay.simulatePayment(externalId);
				return ok(toRemote(charge));
			} catch (error) {
				if (error instanceof AbacatePayNotConfiguredError) throw error;
				if (error instanceof AbacatePayRequestError) {
					return err(failure("failed", error.message));
				}
				throw error;
			}
		},
	};
}

export { AbacatePayNotConfiguredError };
