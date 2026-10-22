import {
	createTransaction,
	deleteTransaction,
	getTransaction,
	listTransactions,
	type TransactionRecord,
	updateTransaction,
} from "@agentic-personal-finances/core";
import { decrypt } from "../../lib/encryption";
import { AppError } from "../../lib/errors";
import { transactionPorts, unwrapOrThrow } from "./transaction.deps";
import { transactionRepository } from "./transaction.repository";
import type {
	CreateTransactionInput,
	ListTransactionsQuery,
	TransactionCategory,
	TransactionDTO,
	TransactionType,
	UpdateTransactionInput,
} from "./transaction.schema";

function toDTO(row: TransactionRecord): TransactionDTO {
	return {
		id: row.id,
		description: row.description,
		amount: row.amount,
		category: row.category as TransactionCategory,
		type: row.type,
		date: row.date.toISOString(),
		createdAt: row.createdAt.toISOString(),
		updatedAt: row.updatedAt?.toISOString() ?? null,
	};
}

/** @deprecated Prefer core use cases + ports; kept as a thin façade for bot until H06. */
export class TransactionNotFoundError extends AppError {
	constructor() {
		super("Transaction not found", 404);
	}
}

export const transactionService = {
	async create(userId: string, input: CreateTransactionInput): Promise<TransactionDTO> {
		const result = await createTransaction(transactionPorts, userId, {
			description: input.description,
			amount: input.amount,
			category: input.category,
			type: input.type,
			...(input.date ? { date: new Date(input.date) } : {}),
		});
		return toDTO(unwrapOrThrow(result));
	},

	async list(
		userId: string,
		query: ListTransactionsQuery,
	): Promise<{ transactions: TransactionDTO[]; total: number; page: number; perPage: number }> {
		const result = await listTransactions(transactionPorts, userId, {
			page: query.page,
			perPage: query.perPage,
			...(query.search !== undefined ? { search: query.search } : {}),
			...(query.category !== undefined ? { category: query.category } : {}),
			...(query.from !== undefined ? { from: new Date(query.from) } : {}),
			...(query.to !== undefined ? { to: new Date(query.to) } : {}),
		});
		const listed = unwrapOrThrow(result);
		return {
			transactions: listed.transactions.map(toDTO),
			total: listed.total,
			page: listed.page,
			perPage: listed.perPage,
		};
	},

	async findById(userId: string, id: string): Promise<TransactionDTO> {
		return toDTO(unwrapOrThrow(await getTransaction(transactionPorts, userId, id)));
	},

	async update(userId: string, id: string, input: UpdateTransactionInput): Promise<TransactionDTO> {
		const result = await updateTransaction(transactionPorts, userId, id, {
			...(input.description !== undefined ? { description: input.description } : {}),
			...(input.amount !== undefined ? { amount: input.amount } : {}),
			...(input.category !== undefined ? { category: input.category } : {}),
			...(input.type !== undefined ? { type: input.type } : {}),
			...(input.date !== undefined ? { date: new Date(input.date) } : {}),
		});
		return toDTO(unwrapOrThrow(result));
	},

	async remove(userId: string, id: string): Promise<void> {
		unwrapOrThrow(await deleteTransaction(transactionPorts, userId, id));
	},

	async statsByCategory(
		userId: string,
	): Promise<{ category: string; type: TransactionType; total: number; percentage: number }[]> {
		const rows = await transactionRepository.findAllForStats(userId);

		const totals = new Map<string, { type: TransactionType; total: number }>();
		let incomeTotal = 0;
		let expenseTotal = 0;

		for (const row of rows) {
			const amount = Number(decrypt(row.amount));
			const type = row.type as TransactionType;
			const key = `${type}:${row.category}`;
			const current = totals.get(key)?.total ?? 0;
			totals.set(key, { type, total: current + amount });

			if (type === "income") {
				incomeTotal += amount;
			} else {
				expenseTotal += amount;
			}
		}

		return Array.from(totals.entries())
			.map(([key, value]) => {
				const category = key.split(":")[1] ?? "other";
				const base = value.type === "income" ? incomeTotal : expenseTotal;
				const percentage = base > 0 ? Number(((value.total / base) * 100).toFixed(2)) : 0;

				return { category, type: value.type, total: value.total, percentage };
			})
			.sort((a, b) => b.total - a.total);
	},
};
