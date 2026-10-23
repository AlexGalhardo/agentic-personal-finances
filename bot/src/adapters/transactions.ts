import { failureToAppError, unwrapOrThrow } from "@agentic-personal-finances/backend/src/adapters/http/map-result";
import type {
	TransactionCategory,
	TransactionType,
} from "@agentic-personal-finances/backend/src/modules/transactions/transaction.schema";
import {
	type AppFailure,
	createTransaction,
	deleteTransaction,
	listTransactions,
	type TransactionRecord,
} from "@agentic-personal-finances/core";
import type { FormattableTransaction } from "../formatting/format";
import { transactionPorts } from "./core-deps";

export type BotListQuery = {
	search?: string;
	category?: TransactionCategory;
	from?: string;
	to?: string;
	page: number;
	perPage: number;
};

export type BotListResult = {
	transactions: FormattableTransaction[];
	total: number;
	page: number;
	perPage: number;
};

function toFormattable(row: TransactionRecord): FormattableTransaction {
	return {
		id: row.id,
		description: row.description,
		amount: row.amount,
		category: row.category as TransactionCategory,
		type: row.type,
		createdAt: row.createdAt.toISOString(),
	};
}

export async function botListTransactions(userId: string, query: BotListQuery): Promise<BotListResult> {
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
		transactions: listed.transactions.map(toFormattable),
		total: listed.total,
		page: listed.page,
		perPage: listed.perPage,
	};
}

export type BotCreateInput = {
	description: string;
	amount: number;
	category: TransactionCategory;
	type: TransactionType;
};

export type BotCreateOutcome = { ok: true } | { ok: false; reply: string };

const PLAN_LIMIT_REPLY = "Free plan transaction limit reached. Subscribe to continue.";

/** Maps core create failures to in-chat replies; other codes stay thrown as AppError. */
export function replyForCreateFailure(error: AppFailure): BotCreateOutcome | "throw" {
	if (error.code === "plan_limit") {
		return { ok: false, reply: PLAN_LIMIT_REPLY };
	}
	return "throw";
}

export async function botCreateTransaction(userId: string, input: BotCreateInput): Promise<BotCreateOutcome> {
	const result = await createTransaction(transactionPorts, userId, {
		description: input.description,
		amount: input.amount,
		category: input.category,
		type: input.type,
	});
	if (result.ok) return { ok: true };
	const mapped = replyForCreateFailure(result.error);
	if (mapped !== "throw") return mapped;
	throw failureToAppError(result.error);
}

export async function botDeleteTransaction(userId: string, id: string): Promise<void> {
	unwrapOrThrow(await deleteTransaction(transactionPorts, userId, id));
}

export { PLAN_LIMIT_REPLY };
