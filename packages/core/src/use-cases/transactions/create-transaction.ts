import { type AppFailure, failure } from "../../failures";
import { transactionAllowance } from "../../plan";
import type { Clock } from "../../ports/clock";
import type { PlanQuotaReader } from "../../ports/plan-quota";
import type { TransactionRecord, TransactionRepository, TransactionType } from "../../ports/transaction-repository";
import { err, ok, type Result } from "../../result";

export type CreateTransactionInput = {
	readonly description: string;
	readonly amount: number;
	readonly category: string;
	readonly type: TransactionType;
	readonly date?: Date;
};

export type CreateTransactionDeps = {
	readonly transactions: TransactionRepository;
	readonly plans: PlanQuotaReader;
	readonly clock: Clock;
};

export async function createTransaction(
	deps: CreateTransactionDeps,
	userId: string,
	input: CreateTransactionInput,
): Promise<Result<TransactionRecord, AppFailure>> {
	if (!Number.isInteger(input.amount) || input.amount <= 0) {
		return err(failure("invalid_input", "amount must be a positive integer number of cents"));
	}
	if (!input.description.trim()) {
		return err(failure("invalid_input", "description is required"));
	}

	const quotaResult = await deps.plans.getQuota(userId);
	if (!quotaResult.ok) return quotaResult;

	const now = deps.clock.now();
	if (transactionAllowance(quotaResult.value, now) < 1) {
		return err(failure("plan_limit", "Free plan transaction limit reached. Subscribe to continue."));
	}

	const created = await deps.transactions.create({
		userId,
		description: input.description.trim(),
		amount: input.amount,
		category: input.category,
		type: input.type,
		date: input.date ?? now,
	});
	if (!created.ok) return created;

	const recorded = await deps.plans.recordCreated(userId, 1);
	if (!recorded.ok) return recorded;

	return ok(created.value);
}
