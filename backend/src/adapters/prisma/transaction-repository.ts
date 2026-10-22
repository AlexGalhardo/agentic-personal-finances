import {
	err,
	failure,
	type ListQuery,
	type NewTransaction,
	ok,
	type TransactionRecord,
	type TransactionRepository,
	type TransactionType,
} from "@agentic-personal-finances/core";
import { prisma } from "../../config/prisma";
import { decrypt, encrypt } from "../../lib/encryption";

function toRecord(row: {
	id: string;
	userId: string;
	description: string;
	amount: string;
	category: string;
	type: string;
	date: Date;
	createdAt: Date;
	updatedAt: Date | null;
}): TransactionRecord {
	return {
		id: row.id,
		userId: row.userId,
		description: decrypt(row.description),
		amount: Number(decrypt(row.amount)),
		category: row.category,
		type: row.type as TransactionType,
		date: row.date,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

export function createPrismaTransactionRepository(): TransactionRepository {
	return {
		async create(input: NewTransaction) {
			const created = await prisma.transaction.create({
				data: {
					userId: input.userId,
					description: encrypt(input.description),
					amount: encrypt(String(input.amount)),
					category: input.category,
					type: input.type,
					date: input.date,
				},
			});
			return ok(toRecord(created));
		},

		async findById(userId, id) {
			const row = await prisma.transaction.findFirst({ where: { id, userId } });
			if (!row) return err(failure("not_found", "Transaction not found"));
			return ok(toRecord(row));
		},

		async list(userId, query: ListQuery) {
			const rows = await prisma.transaction.findMany({
				where: {
					userId,
					...(query.category ? { category: query.category } : {}),
					...(query.type ? { type: query.type } : {}),
					...(query.from || query.to
						? {
								date: {
									...(query.from ? { gte: query.from } : {}),
									...(query.to ? { lte: query.to } : {}),
								},
							}
						: {}),
				},
				orderBy: { date: "desc" },
			});
			return ok(rows.map(toRecord));
		},

		async update(userId, id, patch) {
			const data = {
				...(patch.description !== undefined ? { description: encrypt(patch.description) } : {}),
				...(patch.amount !== undefined ? { amount: encrypt(String(patch.amount)) } : {}),
				...(patch.category !== undefined ? { category: patch.category } : {}),
				...(patch.type !== undefined ? { type: patch.type } : {}),
				...(patch.date !== undefined ? { date: patch.date } : {}),
				updatedAt: new Date(),
			};
			const result = await prisma.transaction.updateMany({ where: { id, userId }, data });
			if (result.count === 0) return err(failure("not_found", "Transaction not found"));
			const row = await prisma.transaction.findFirst({ where: { id, userId } });
			if (!row) return err(failure("not_found", "Transaction not found"));
			return ok(toRecord(row));
		},

		async delete(userId, id) {
			const result = await prisma.transaction.deleteMany({ where: { id, userId } });
			if (result.count === 0) return err(failure("not_found", "Transaction not found"));
			return ok(undefined);
		},

		async countForUser(userId) {
			return ok(await prisma.transaction.count({ where: { userId } }));
		},
	};
}
