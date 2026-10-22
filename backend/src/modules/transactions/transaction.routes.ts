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

// `detail` feeds the OpenAPI document rendered by Scalar on the frontend's
// /api page — it is user-facing documentation, hence Portuguese.
const unauthorized = { 401: errorResponseSchema };
const notFound = { 404: errorResponseSchema };

export const transactionRoutes = new Elysia({ prefix: "/transactions", tags: ["Transações"] })
	.use(authPlugin)
	.guard({ auth: true })
	.get(
		"/",
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
		{
			query: listTransactionsQuerySchema,
			response: { 200: transactionListResponseSchema, ...unauthorized },
			detail: {
				summary: "Listar transações",
				description:
					"Lista paginada, da mais recente para a mais antiga. `search` filtra pela descrição (sem diferenciar acentos/maiúsculas); `from`/`to` são datas ISO 8601.",
			},
		},
	)
	.get(
		"/statistics",
		async ({ user }) => ({ success: true as const, stats: await transactionService.statsByCategory(user.id) }),
		{
			response: { 200: statisticsResponseSchema, ...unauthorized },
			detail: {
				summary: "Totais por categoria",
				description: "Soma e percentual de cada categoria, separados por tipo (receita/despesa).",
			},
		},
	)
	.get(
		"/:id",
		async ({ user, params }) => ({
			success: true as const,
			transaction: toDTO(unwrapOrThrow(await getTransaction(transactionPorts, user.id, params.id))),
		}),
		{
			params: transactionIdParamSchema,
			response: { 200: transactionResponseSchema, ...unauthorized, ...notFound },
			detail: { summary: "Buscar transação" },
		},
	)
	.post(
		"/",
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
		{
			body: createTransactionSchema,
			response: { 201: transactionResponseSchema, ...unauthorized, 403: errorResponseSchema },
			detail: {
				summary: "Criar transação",
				description:
					"`amount` é um inteiro em centavos (R$ 49,90 = 4990). Responde 403 quando o plano gratuito atingiu o limite de transações.",
			},
		},
	)
	.put(
		"/:id",
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
		{
			params: transactionIdParamSchema,
			body: updateTransactionSchema,
			response: { 200: transactionResponseSchema, ...unauthorized, ...notFound },
			detail: { summary: "Atualizar transação", description: "Envie apenas os campos que quer alterar." },
		},
	)
	.delete(
		"/:id",
		async ({ user, params }) => {
			unwrapOrThrow(await deleteTransaction(transactionPorts, user.id, params.id));
			return { success: true as const, message: "Transação apagada" };
		},
		{
			params: transactionIdParamSchema,
			response: { 200: deleteResponseSchema, ...unauthorized, ...notFound },
			detail: { summary: "Apagar transação" },
		},
	);
