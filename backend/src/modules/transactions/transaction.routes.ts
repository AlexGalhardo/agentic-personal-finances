import {
	createTransaction,
	deleteTransaction,
	getTransaction,
	listTransactions,
	type TransactionRecord,
	updateTransaction,
} from "@agentic-personal-finances/core";
import { Elysia } from "elysia";
import { authPlugin } from "../../lib/auth.plugin";
import { transactionPorts, unwrapOrThrow } from "./transaction.deps";
import {
	createTransactionSchema,
	deleteResponseSchema,
	errorResponseSchema,
	listTransactionsQuerySchema,
	statisticsResponseSchema,
	type TransactionCategory,
	type TransactionDTO,
	transactionIdParamSchema,
	transactionListResponseSchema,
	transactionResponseSchema,
	updateTransactionSchema,
} from "./transaction.schema";
import { transactionService } from "./transaction.service";

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

const unauthorized = { 401: errorResponseSchema };
const notFound = { 404: errorResponseSchema };

export const transactionRoutes = new Elysia({ prefix: "/transactions", tags: ["Transactions"] })
	.use(authPlugin)
	.guard({ auth: true })
	.get(
		"/",
		{
			query: listTransactionsQuerySchema,
			response: { 200: transactionListResponseSchema, ...unauthorized },
			detail: {
				summary: "List transactions",
				description:
					"Paginated list, newest first. `search` filters by description (accent/case-insensitive); `from`/`to` are ISO 8601 dates.",
			},
		},
		async ({ user, query }) => {
			const listed = unwrapOrThrow(
				await listTransactions(transactionPorts, user.id, {
					page: query.page,
					perPage: query.perPage,
					...(query.search !== undefined ? { search: query.search } : {}),
					...(query.category !== undefined ? { category: query.category } : {}),
					...(query.from !== undefined ? { from: new Date(query.from) } : {}),
					...(query.to !== undefined ? { to: new Date(query.to) } : {}),
				}),
			);
			return {
				success: true as const,
				transactions: listed.transactions.map(toDTO),
				total: listed.total,
				page: listed.page,
				perPage: listed.perPage,
			};
		},
	)
	.get(
		"/statistics",
		{
			response: { 200: statisticsResponseSchema, ...unauthorized },
			detail: {
				summary: "Totals by category",
				description: "Sum and percentage per category, split by type (income/expense).",
			},
		},
		async ({ user }) => ({ success: true as const, stats: await transactionService.statsByCategory(user.id) }),
	)
	.get(
		"/:id",
		{
			params: transactionIdParamSchema,
			response: { 200: transactionResponseSchema, ...unauthorized, ...notFound },
			detail: { summary: "Get transaction" },
		},
		async ({ user, params }) => ({
			success: true as const,
			transaction: toDTO(unwrapOrThrow(await getTransaction(transactionPorts, user.id, params.id))),
		}),
	)
	.post(
		"/",
		{
			body: createTransactionSchema,
			response: { 201: transactionResponseSchema, ...unauthorized, 403: errorResponseSchema },
			detail: {
				summary: "Create transaction",
				description:
					"`amount` is an integer in cents (R$ 49.90 = 4990). Returns 403 when the free plan transaction limit is reached.",
			},
		},
		async ({ user, body, status }) => {
			const created = unwrapOrThrow(
				await createTransaction(transactionPorts, user.id, {
					description: body.description,
					amount: body.amount,
					category: body.category,
					type: body.type,
					...(body.date ? { date: new Date(body.date) } : {}),
				}),
			);
			return status(201, { success: true as const, transaction: toDTO(created) });
		},
	)
	.put(
		"/:id",
		{
			params: transactionIdParamSchema,
			body: updateTransactionSchema,
			response: { 200: transactionResponseSchema, ...unauthorized, ...notFound },
			detail: { summary: "Update transaction", description: "Send only the fields you want to change." },
		},
		async ({ user, params, body }) => ({
			success: true as const,
			transaction: toDTO(
				unwrapOrThrow(
					await updateTransaction(transactionPorts, user.id, params.id, {
						...(body.description !== undefined ? { description: body.description } : {}),
						...(body.amount !== undefined ? { amount: body.amount } : {}),
						...(body.category !== undefined ? { category: body.category } : {}),
						...(body.type !== undefined ? { type: body.type } : {}),
						...(body.date !== undefined ? { date: new Date(body.date) } : {}),
					}),
				),
			),
		}),
	)
	.delete(
		"/:id",
		{
			params: transactionIdParamSchema,
			response: { 200: deleteResponseSchema, ...unauthorized, ...notFound },
			detail: { summary: "Delete transaction" },
		},
		async ({ user, params }) => {
			unwrapOrThrow(await deleteTransaction(transactionPorts, user.id, params.id));
			return { success: true as const, message: "Transaction deleted" };
		},
	);
