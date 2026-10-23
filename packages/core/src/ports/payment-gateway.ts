import type { AppFailure } from "../failures";
import type { Result } from "../result";

export type PixChargeRemote = {
	readonly id: string;
	readonly status: string;
	readonly brCode: string;
	readonly brCodeBase64: string;
	readonly expiresAt: string | null;
};

export type CreatePixChargeInput = {
	readonly amount: number;
	readonly description: string;
	readonly expiresInSeconds: number;
	readonly metadata: Readonly<Record<string, unknown>>;
};

export interface PaymentGateway {
	createPixCharge(input: CreatePixChargeInput): Promise<Result<PixChargeRemote, AppFailure>>;
	getPixChargeStatus(externalId: string): Promise<Result<PixChargeRemote, AppFailure>>;
	simulatePixPayment(externalId: string): Promise<Result<PixChargeRemote, AppFailure>>;
}
