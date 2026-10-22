import type { AppFailure } from "../failures";
import type { Result } from "../result";

export type PlanQuota = {
	readonly plan: string;
	readonly planExpiresAt: Date | null;
	readonly transactionCount: number;
};

export type PlanQuotaReader = {
	getQuota(userId: string): Promise<Result<PlanQuota, AppFailure>>;
	/** Bump free-plan usage after a successful create (or batch import). */
	recordCreated(userId: string, by?: number): Promise<Result<void, AppFailure>>;
};
