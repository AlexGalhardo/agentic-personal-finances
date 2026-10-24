import { buildAccountExport, parseAccountExport } from "@agentic-personal-finances/core";
import { getDb } from "@/adapters/sqlite/db";
import { categoryOptions, type TransactionCategory } from "@/lib/categories";

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

type TransactionRow = {
	id: string;
	description: string;
	amount: number;
	category: TransactionCategory;
	type: "income" | "expense";
	date: string;
	created_at: string;
	updated_at: string | null;
};

function toTransaction(row: TransactionRow) {
	return {
		id: row.id,
		description: row.description,
		amount: row.amount,
		category: row.category,
		type: row.type,
		date: row.date,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

function newId(): string {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function listTransactions(filters: TransactionListFilters) {
	const db = await getDb();
	const where: string[] = [];
	const params: string[] = [];
	if (filters.category) {
		where.push("category = ?");
		params.push(filters.category);
	}
	if (filters.from) {
		where.push("date >= ?");
		params.push(filters.from);
	}
	if (filters.to) {
		where.push("date <= ?");
		params.push(filters.to);
	}
	const clause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
	const rows = await db.getAllAsync<TransactionRow>(
		`SELECT * FROM transactions ${clause} ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?`,
		[...params, filters.perPage, (filters.page - 1) * filters.perPage],
	);
	return rows.map(toTransaction);
}

export async function getTransactionStatistics() {
	const db = await getDb();
	return db.getAllAsync<{ category: string; type: "income" | "expense"; total: number }>(
		"SELECT category, type, SUM(amount) AS total FROM transactions GROUP BY category, type",
	);
}

export async function getTransaction(id: string) {
	const db = await getDb();
	const row = await db.getFirstAsync<TransactionRow>("SELECT * FROM transactions WHERE id = ?", [id]);
	if (!row) throw new Error("Transaction not found");
	return toTransaction(row);
}

export async function createTransaction(input: TransactionWriteInput) {
	const db = await getDb();
	const id = newId();
	await db.runAsync(
		"INSERT INTO transactions (id, description, amount, category, type, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
		[id, input.description, input.amount, input.category, input.type, input.date, new Date().toISOString()],
	);
	return getTransaction(id);
}

export async function updateTransaction(id: string, input: TransactionWriteInput) {
	const db = await getDb();
	const result = await db.runAsync(
		"UPDATE transactions SET description = ?, amount = ?, category = ?, type = ?, date = ?, updated_at = ? WHERE id = ?",
		[input.description, input.amount, input.category, input.type, input.date, new Date().toISOString(), id],
	);
	if (result.changes === 0) throw new Error("Transaction not found");
	return getTransaction(id);
}

export async function deleteTransaction(id: string) {
	const db = await getDb();
	await db.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
}

export async function deleteAllTransactions() {
	const db = await getDb();
	await db.runAsync("DELETE FROM transactions");
}

/** Whole-account backup as JSON text, importable on web, desktop and mobile. */
export async function exportAccountJson(): Promise<string> {
	const db = await getDb();
	const rows = await db.getAllAsync<TransactionRow>("SELECT * FROM transactions ORDER BY date DESC");
	const file = buildAccountExport(
		{},
		rows.map((row) => ({
			description: row.description,
			amount: row.amount,
			category: row.category,
			type: row.type,
			date: row.date,
		})),
	);
	return JSON.stringify(file, null, 2);
}

/** Adds the backup's transactions, skipping ones already stored (same date, amount, type, description). */
export async function importAccountJson(text: string): Promise<{ created: number; skippedDuplicates: number }> {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		throw new Error("The selected file is not valid JSON");
	}
	const parsed = parseAccountExport(raw);
	if (!parsed.ok) throw new Error(parsed.error);

	const db = await getDb();
	let created = 0;
	let skippedDuplicates = 0;
	await db.withExclusiveTransactionAsync(async (tx) => {
		for (const item of parsed.value.transactions) {
			const duplicate = await tx.getFirstAsync(
				"SELECT 1 FROM transactions WHERE date = ? AND amount = ? AND type = ? AND description = ?",
				[item.date, item.amount, item.type, item.description],
			);
			if (duplicate) {
				skippedDuplicates++;
				continue;
			}
			const category = (categoryOptions as string[]).includes(item.category) ? item.category : "other";
			await tx.runAsync(
				"INSERT INTO transactions (id, description, amount, category, type, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
				[newId(), item.description, item.amount, category, item.type, item.date, new Date().toISOString()],
			);
			created++;
		}
	});
	return { created, skippedDuplicates };
}
