import { beforeEach, describe, expect, test } from "bun:test";
import { failure } from "../../failures";
import type { Clock } from "../../ports/clock";
import type { PlanQuota, PlanQuotaReader } from "../../ports/plan-quota";
import type {
	ListQuery,
	NewTransaction,
	TransactionRecord,
	TransactionRepository,
} from "../../ports/transaction-repository";
import { err, isErr, isOk, ok } from "../../result";
import { createTransaction } from "./create-transaction";
import { deleteTransaction } from "./delete-transaction";
import { getTransaction } from "./get-transaction";
import { listTransactions } from "./list-transactions";
import { updateTransaction } from "./update-transaction";

const USER = "22222222-2222-4222-8222-222222222222";
const NOW = new Date("2026-10-22T12:00:00.000Z");

function record(overrides: Partial<TransactionRecord> = {}): TransactionRecord {
	return {
		id: "11111111-1111-4111-8111-111111111111",
		userId: USER,
		description: "SUPERMERCADO",
		amount: 15000,
		category: "food",
		type: "expense",
		date: NOW,
		createdAt: NOW,
		updatedAt: null,
		...overrides,
	};
}

function buildFakes(initialQuota: PlanQuota) {
	const store = new Map<string, TransactionRecord>();
	let quota = { ...initialQuota };
	let nextId = 1;

	const transactions: TransactionRepository = {
		async create(input: NewTransaction) {
			const row = record({
				...input,
				id: `00000000-0000-4000-8000-${String(nextId++).padStart(12, "0")}`,
				createdAt: NOW,
				updatedAt: null,
			});
			store.set(row.id, row);
			return ok(row);
		},
		async findById(userId, id) {
			const row = store.get(id);
			if (!row || row.userId !== userId) return err(failure("not_found", "Transaction not found"));
			return ok(row);
		},
		async list(userId, query: ListQuery) {
			let rows = [...store.values()].filter((row) => row.userId === userId);
			if (query.category) rows = rows.filter((row) => row.category === query.category);
			if (query.type) rows = rows.filter((row) => row.type === query.type);
			const from = query.from;
			const to = query.to;
			if (from) rows = rows.filter((row) => row.date >= from);
			if (to) rows = rows.filter((row) => row.date <= to);
			return ok(rows);
		},
		async update(userId, id, patch) {
			const found = await transactions.findById(userId, id);
			if (!found.ok) return found;
			const updated = { ...found.value, ...patch, updatedAt: NOW };
			store.set(id, updated);
			return ok(updated);
		},
		async delete(userId, id) {
			const found = await transactions.findById(userId, id);
			if (!found.ok) return found;
			store.delete(id);
			return ok(undefined);
		},
		async countForUser(userId) {
			return ok([...store.values()].filter((row) => row.userId === userId).length);
		},
	};

	const plans: PlanQuotaReader = {
		async getQuota() {
			return ok(quota);
		},
		async recordCreated(_userId, by = 1) {
			quota = { ...quota, transactionCount: quota.transactionCount + by };
			return ok(undefined);
		},
	};

	const clock: Clock = { now: () => NOW };

	return { transactions, plans, clock, store, getQuota: () => quota };
}

describe("transaction use cases", () => {
	let free: ReturnType<typeof buildFakes>;

	beforeEach(() => {
		free = buildFakes({ plan: "inactive", planExpiresAt: null, transactionCount: 0 });
	});

	test("create returns plan_limit when free allowance is exhausted", async () => {
		const capped = buildFakes({ plan: "inactive", planExpiresAt: null, transactionCount: 10 });
		const result = await createTransaction(capped, USER, {
			description: "X",
			amount: 100,
			category: "food",
			type: "expense",
		});
		expect(isErr(result)).toBe(true);
		if (isErr(result)) expect(result.error.code).toBe("plan_limit");
		expect(capped.store.size).toBe(0);
	});

	test("create ignores free limit for an active plan", async () => {
		const paid = buildFakes({
			plan: "active",
			planExpiresAt: new Date("2099-01-01T00:00:00.000Z"),
			transactionCount: 999,
		});
		const result = await createTransaction(paid, USER, {
			description: "X",
			amount: 100,
			category: "food",
			type: "expense",
		});
		expect(isOk(result)).toBe(true);
		expect(paid.store.size).toBe(1);
	});

	test("create returns ok with persisted plaintext amount and records usage", async () => {
		const result = await createTransaction(free, USER, {
			description: " Cafe ",
			amount: 500,
			category: "food",
			type: "expense",
		});
		expect(isOk(result)).toBe(true);
		if (isOk(result)) {
			expect(result.value.amount).toBe(500);
			expect(result.value.description).toBe("Cafe");
		}
		expect(free.getQuota().transactionCount).toBe(1);
	});

	test("get/update/delete missing id return not_found", async () => {
		const missing = "99999999-9999-4999-8999-999999999999";
		const got = await getTransaction(free, USER, missing);
		const updated = await updateTransaction(free, USER, missing, { amount: 1 });
		const removed = await deleteTransaction(free, USER, missing);
		expect(isErr(got) && got.error.code).toBe("not_found");
		expect(isErr(updated) && updated.error.code).toBe("not_found");
		expect(isErr(removed) && removed.error.code).toBe("not_found");
	});

	test("list filters by search and paginates in memory", async () => {
		await createTransaction(free, USER, {
			description: "Supermercado",
			amount: 1,
			category: "food",
			type: "expense",
		});
		await createTransaction(free, USER, {
			description: "Uber",
			amount: 2,
			category: "transport",
			type: "expense",
		});
		await createTransaction(free, USER, {
			description: "Uber Eats",
			amount: 3,
			category: "food",
			type: "expense",
		});

		const search = await listTransactions(free, USER, { search: "uber", page: 1, perPage: 20 });
		expect(isOk(search)).toBe(true);
		if (isOk(search)) {
			expect(search.value.total).toBe(2);
			expect(search.value.transactions.map((row) => row.description)).toEqual(["Uber", "Uber Eats"]);
		}

		const page = await listTransactions(free, USER, { page: 2, perPage: 2 });
		expect(isOk(page)).toBe(true);
		if (isOk(page)) {
			expect(page.value.total).toBe(3);
			expect(page.value.transactions).toHaveLength(1);
		}
	});
});
