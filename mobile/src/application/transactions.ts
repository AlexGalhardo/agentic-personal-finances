import { api } from "@/adapters/http/api";
import type { TransactionCategory } from "@/lib/categories";

export type TransactionListFilters = {
	category?: TransactionCategory;
	from?: string;
	to?: string;
	page: number;
	perPage: number;
};

export type TransactionWriteInput = {
	description: string;
	amount: number;
	category: TransactionCategory;
	type: "income" | "expense";
	date: string;
};

export type ImportConfirmInput = {
	description: string;
	amount: number;
	category: TransactionCategory;
	type: "income" | "expense";
	createdAt: string;
};

export async function listTransactions(filters: TransactionListFilters) {
	const { data, error } = await api.transactions.get({ query: filters });
	if (error || !data || !("transactions" in data)) {
		throw new Error("Failed to load transactions");
	}
	return data.transactions;
}

export async function getTransactionStatistics() {
	const { data, error } = await api.transactions.statistics.get();
	if (error || !data || !("stats" in data)) {
		throw new Error("Failed to load statistics");
	}
	return data.stats;
}

export async function getTransaction(id: string) {
	const { data, error } = await api.transactions({ id }).get();
	if (error || !data || !("transaction" in data)) {
		throw new Error("Transaction not found");
	}
	return data.transaction;
}

export async function createTransaction(input: TransactionWriteInput) {
	const { data, error } = await api.transactions.post(input);
	if (error) throw error;
	return data;
}

export async function updateTransaction(id: string, input: TransactionWriteInput) {
	const { data, error } = await api.transactions({ id }).put(input);
	if (error) throw error;
	return data;
}

export async function deleteTransaction(id: string) {
	const { error } = await api.transactions({ id }).delete();
	if (error) throw error;
}

export async function previewTransactionImport(csv: string) {
	const { data, error } = await api.transactions.import.preview.post({ csv });
	if (error || !data || !("rows" in data)) {
		throw error ?? new Error("Could not read the CSV file");
	}
	return data;
}

export async function confirmTransactionImport(transactions: ImportConfirmInput[]) {
	const { data, error } = await api.transactions.import.confirm.post({ transactions });
	if (error || !data || !("created" in data)) {
		throw error ?? new Error("Could not import transactions");
	}
	return data;
}
