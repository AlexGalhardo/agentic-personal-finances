import { type AppFailure, failure } from "../../failures";
import type {
	NewTransaction,
	TransactionRecord,
	TransactionRepository,
	TransactionType,
} from "../../ports/transaction-repository";
import { err, type Result } from "../../result";

export type UpdateTransactionInput = {
	readonly description?: string;
	readonly amount?: number;
	readonly category?: string;
	readonly type?: TransactionType;
	readonly date?: Date;
};

export type UpdateTransactionDeps = {
	readonly transactions: TransactionRepository;
};

export async function updateTransaction(
	deps: UpdateTransactionDeps,
	userId: string,
	id: string,
	input: UpdateTransactionInput,
): Promise<Result<TransactionRecord, AppFailure>> {
	if (input.amount !== undefined && (!Number.isInteger(input.amount) || input.amount <= 0)) {
		return err(failure("invalid_input", "amount must be a positive integer number of cents"));
	}
	if (input.description !== undefined && !input.description.trim()) {
		return err(failure("invalid_input", "description is required"));
	}

	const patch: Partial<NewTransaction> = {
		...(input.description !== undefined ? { description: input.description.trim() } : {}),
		...(input.amount !== undefined ? { amount: input.amount } : {}),
		...(input.category !== undefined ? { category: input.category } : {}),
		...(input.type !== undefined ? { type: input.type } : {}),
		...(input.date !== undefined ? { date: input.date } : {}),
	};

	return deps.transactions.update(userId, id, patch);
}
