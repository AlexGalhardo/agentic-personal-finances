import { describe, expect, test } from "bun:test";
import { failure } from "../failures";
import { err, isErr, isOk, ok } from "../result";
import type { Clock } from "./clock";
import type { PlanQuotaReader } from "./plan-quota";
import type { ListQuery, NewTransaction, TransactionRecord, TransactionRepository } from "./transaction-repository";

const sampleRecord: TransactionRecord = {
	id: "11111111-1111-4111-8111-111111111111",
	userId: "22222222-2222-4222-8222-222222222222",
	description: "SUPERMERCADO",
	amount: 1990,
	category: "food",
	type: "expense",
	date: new Date("2026-10-22T12:00:00.000Z"),
	createdAt: new Date("2026-10-22T12:00:00.000Z"),
	updatedAt: null,
};

const fakeRepo: TransactionRepository = {
	async create(input: NewTransaction) {
		return ok({
			...sampleRecord,
			...input,
			id: sampleRecord.id,
			createdAt: sampleRecord.createdAt,
			updatedAt: null,
		});
	},
	async findById(userId, id) {
		if (userId !== sampleRecord.userId || id !== sampleRecord.id) {
			return err(failure("not_found", "transaction missing"));
		}
		return ok(sampleRecord);
	},
	async list(_userId, _query: ListQuery) {
		return ok([sampleRecord] as const);
	},
	async update(userId, id, patch) {
		const found = await fakeRepo.findById(userId, id);
		if (!found.ok) return found;
		return ok({ ...found.value, ...patch, updatedAt: new Date("2026-10-22T13:00:00.000Z") });
	},
	async delete(userId, id) {
		const found = await fakeRepo.findById(userId, id);
		if (!found.ok) return found;
		return ok(undefined);
	},
	async countForUser(_userId) {
		return ok(1);
	},
};

const fakeQuota: PlanQuotaReader = {
	async getQuota(_userId) {
		return ok({
			plan: "free",
			planExpiresAt: null,
			transactionCount: 1,
		});
	},
	async recordCreated(_userId, _by = 1) {
		return ok(undefined);
	},
};

const fixedClock: Clock = {
	now: () => new Date("2026-10-22T12:00:00.000Z"),
};

describe("transaction ports (assignability)", () => {
	test("fake TransactionRepository satisfies the port and returns domain amounts", async () => {
		const created = await fakeRepo.create({
			userId: sampleRecord.userId,
			description: "CAFE",
			amount: 500,
			category: "food",
			type: "expense",
			date: sampleRecord.date,
		});
		expect(isOk(created)).toBe(true);
		if (isOk(created)) {
			expect(typeof created.value.amount).toBe("number");
			expect(created.value.amount).toBe(500);
		}

		const missing = await fakeRepo.findById("nope", "nope");
		expect(isErr(missing)).toBe(true);
	});

	test("PlanQuotaReader and Clock ports are injectable fakes", async () => {
		const quota = await fakeQuota.getQuota(sampleRecord.userId);
		expect(isOk(quota)).toBe(true);
		if (isOk(quota)) expect(quota.value.plan).toBe("free");
		expect(fixedClock.now().toISOString()).toBe("2026-10-22T12:00:00.000Z");
	});
});
