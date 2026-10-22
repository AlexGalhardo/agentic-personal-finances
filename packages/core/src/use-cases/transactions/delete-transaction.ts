import type { AppFailure } from "../../failures";
import type { TransactionRepository } from "../../ports/transaction-repository";
import type { Result } from "../../result";

export type DeleteTransactionDeps = {
	readonly transactions: TransactionRepository;
};

export function deleteTransaction(
	deps: DeleteTransactionDeps,
	userId: string,
	id: string,
): Promise<Result<void, AppFailure>> {
	return deps.transactions.delete(userId, id);
}
