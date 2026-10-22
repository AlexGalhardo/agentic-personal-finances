import type { AppFailure } from "../../failures";
import type { TransactionRecord, TransactionRepository } from "../../ports/transaction-repository";
import type { Result } from "../../result";

export type GetTransactionDeps = {
	readonly transactions: TransactionRepository;
};

export function getTransaction(
	deps: GetTransactionDeps,
	userId: string,
	id: string,
): Promise<Result<TransactionRecord, AppFailure>> {
	return deps.transactions.findById(userId, id);
}
