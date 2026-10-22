import type { AppFailure } from "../../failures";
import type {
	ListQuery,
	TransactionRecord,
	TransactionRepository,
	TransactionType,
} from "../../ports/transaction-repository";
import { ok, type Result } from "../../result";

export type ListTransactionsInput = {
	readonly search?: string;
	readonly category?: string;
	readonly type?: TransactionType;
	readonly from?: Date;
	readonly to?: Date;
	readonly page: number;
	readonly perPage: number;
};

export type ListTransactionsResult = {
	readonly transactions: readonly TransactionRecord[];
	readonly total: number;
	readonly page: number;
	readonly perPage: number;
};

export type ListTransactionsDeps = {
	readonly transactions: TransactionRepository;
};

export async function listTransactions(
	deps: ListTransactionsDeps,
	userId: string,
	input: ListTransactionsInput,
): Promise<Result<ListTransactionsResult, AppFailure>> {
	const query: ListQuery = {
		...(input.category !== undefined ? { category: input.category } : {}),
		...(input.type !== undefined ? { type: input.type } : {}),
		...(input.from !== undefined ? { from: input.from } : {}),
		...(input.to !== undefined ? { to: input.to } : {}),
	};

	const listed = await deps.transactions.list(userId, query);
	if (!listed.ok) return listed;

	// Search + pagination stay in-memory (encrypted columns cannot be filtered
	// in SQL today; H05 adapter keeps that seam).
	const search = input.search?.toLowerCase();
	const filtered = search
		? listed.value.filter((row) => row.description.toLowerCase().includes(search))
		: listed.value;

	const start = (input.page - 1) * input.perPage;
	const pageRows = filtered.slice(start, start + input.perPage);

	return ok({
		transactions: pageRows,
		total: filtered.length,
		page: input.page,
		perPage: input.perPage,
	});
}
