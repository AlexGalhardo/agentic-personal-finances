import type { AppFailure } from "../failures";
import type { Result } from "../result";

export type ChargeRecord = {
	readonly id: string;
	readonly userId: string;
	readonly externalId: string;
	readonly plan: string;
	readonly amount: number;
	readonly status: string;
	readonly expiresAt: Date;
	readonly brCode: string;
	readonly brCodeBase64: string;
};

export type PaymentLogRecord = {
	readonly id: string;
	readonly eventType: string;
	readonly status: string;
	readonly amount: number | null;
	readonly currency: string;
	readonly createdAt: Date;
};

export type PendingChargeInput = {
	readonly userId: string;
	readonly externalId: string;
	readonly plan: string;
	readonly amount: number;
	readonly brCode: string;
	readonly brCodeBase64: string;
	readonly expiresAt: Date;
};

export type PaymentLogInput = {
	readonly userId: string;
	readonly externalId: string;
	readonly eventType: string;
	readonly status: string;
	readonly amount?: number | null;
	readonly rawPayload: unknown;
};

export type UserPlanSnapshot = {
	readonly planStatus: string;
	readonly planExpiresAt: Date | null;
};

export interface PaymentStore {
	createPendingCharge(input: PendingChargeInput): Promise<Result<{ chargeId: string }, AppFailure>>;
	findChargeForUser(chargeId: string, userId: string): Promise<Result<ChargeRecord | null, AppFailure>>;
	findChargeByExternalId(externalId: string): Promise<Result<ChargeRecord | null, AppFailure>>;
	findChargeById(chargeId: string): Promise<Result<ChargeRecord, AppFailure>>;
	setChargeStatus(chargeId: string, status: string): Promise<Result<void, AppFailure>>;
	applyPaidPlan(input: {
		readonly chargeId: string;
		readonly userId: string;
		readonly planExpiresAt: Date;
	}): Promise<Result<void, AppFailure>>;
	appendLog(input: PaymentLogInput): Promise<Result<void, AppFailure>>;
	listLogs(userId: string): Promise<Result<PaymentLogRecord[], AppFailure>>;
	getUserPlan(userId: string): Promise<Result<UserPlanSnapshot, AppFailure>>;
	expireOverduePlans(now: Date): Promise<Result<number, AppFailure>>;
}
