import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	createTransaction,
	deleteTransaction,
	getTransaction,
	getTransactionStatistics,
	listTransactions,
	type TransactionWriteInput,
	updateTransaction,
} from "@/application/transactions";
import type { TransactionCategory } from "@/lib/categories";
import { normalizeTransaction, type Transaction } from "./normalize";

export type { Transaction };
export type TransactionInput = TransactionWriteInput;

// Same strategy as the web dashboard (frontend/src/lib/queries.ts): fetch up
// to 1000 transactions already filtered by category/date on the server, then
// search + paginate on the client (descriptions are encrypted at rest).
const FETCH_ALL_PER_PAGE = 1000;

export function useTransactionsQuery(filters: { category?: TransactionCategory; from?: string; to?: string }) {
	return useQuery({
		queryKey: ["transactions", filters],
		queryFn: async () => {
			const rows = await listTransactions({ ...filters, page: 1, perPage: FETCH_ALL_PER_PAGE });
			return rows.map(normalizeTransaction);
		},
	});
}

export function useTransactionStatistics() {
	return useQuery({
		queryKey: ["transactions-statistics"],
		queryFn: getTransactionStatistics,
	});
}

export function useTransactionQuery(id: string, enabled: boolean) {
	return useQuery({
		queryKey: ["transaction", id],
		enabled,
		queryFn: async () => normalizeTransaction(await getTransaction(id)),
	});
}

function useInvalidateTransactions() {
	const queryClient = useQueryClient();
	return () => {
		queryClient.invalidateQueries({ queryKey: ["transactions"] });
		queryClient.invalidateQueries({ queryKey: ["transactions-statistics"] });
	};
}

export function useCreateTransaction() {
	const invalidate = useInvalidateTransactions();
	return useMutation({
		mutationFn: (input: TransactionInput) => createTransaction(input),
		onSuccess: invalidate,
	});
}

export function useUpdateTransaction() {
	const invalidate = useInvalidateTransactions();
	return useMutation({
		mutationFn: ({ id, input }: { id: string; input: TransactionInput }) => updateTransaction(id, input),
		onSuccess: invalidate,
	});
}

export function useDeleteTransaction() {
	const invalidate = useInvalidateTransactions();
	return useMutation({
		mutationFn: deleteTransaction,
		onSuccess: invalidate,
	});
}
