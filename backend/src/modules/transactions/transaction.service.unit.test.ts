import { beforeEach, describe, expect, it, mock } from "bun:test";
import { encrypt } from "../../lib/encryption";

const repositoryMock = {
	create: mock(),
	findById: mock(),
	findMany: mock(),
	count: mock(),
	update: mock(),
	delete: mock(),
	findAllForStats: mock(),
	findManyForDedupe: mock(),
	createMany: mock(),
};

const prismaMock = {
	user: {
		findUniqueOrThrow: mock(),
		update: mock(),
	},
	transaction: {
		create: mock(),
		findFirst: mock(),
		findMany: mock(),
		updateMany: mock(),
		deleteMany: mock(),
		count: mock(),
	},
};

mock.module("./transaction.repository", () => ({ transactionRepository: repositoryMock }));
mock.module("../../config/prisma", () => ({ prisma: prismaMock }));

const { transactionService, TransactionNotFoundError } = await import("./transaction.service");

function mockFreeUser(freeTransactionCount = 0): void {
	prismaMock.user.findUniqueOrThrow.mockResolvedValue({
		planStatus: "inactive",
		planExpiresAt: null,
		freeTransactionCount,
	});
	prismaMock.user.update.mockResolvedValue({});
}

function buildRow(overrides: Record<string, unknown> = {}) {
	return {
		id: "tx-1",
		userId: "user-1",
		description: encrypt("Supermercado"),
		amount: encrypt("15000"),
		category: "food",
		type: "expense",
		date: new Date("2026-01-01T00:00:00.000Z"),
		createdAt: new Date("2026-01-01T00:00:00.000Z"),
		updatedAt: null,
		...overrides,
	};
}

describe("transactionService (façade over core use cases)", () => {
	beforeEach(() => {
		for (const fn of Object.values(repositoryMock)) fn.mockReset();
		for (const fn of Object.values(prismaMock.user)) fn.mockReset();
		for (const fn of Object.values(prismaMock.transaction)) fn.mockReset();
		mockFreeUser();
	});

	it("create() encrypts at the Prisma adapter and returns a DTO", async () => {
		prismaMock.transaction.create.mockResolvedValue(buildRow());

		const result = await transactionService.create("user-1", {
			description: "Supermercado",
			amount: 15000,
			category: "food",
			type: "expense",
		});

		expect(result).toEqual({
			id: "tx-1",
			description: "Supermercado",
			amount: 15000,
			category: "food",
			type: "expense",
			date: "2026-01-01T00:00:00.000Z",
			createdAt: "2026-01-01T00:00:00.000Z",
			updatedAt: null,
		});
		expect(prismaMock.user.update).toHaveBeenCalled();
	});

	it("create() rejects once a free-plan user reaches the transaction limit", async () => {
		mockFreeUser(10);

		await expect(
			transactionService.create("user-1", {
				description: "Supermercado",
				amount: 15000,
				category: "food",
				type: "expense",
			}),
		).rejects.toThrow("Free plan transaction limit");

		expect(prismaMock.transaction.create).not.toHaveBeenCalled();
	});

	it("create() ignores the free-plan limit for a user with an active plan", async () => {
		prismaMock.transaction.create.mockResolvedValue(buildRow());
		prismaMock.user.findUniqueOrThrow.mockResolvedValue({
			planStatus: "active",
			planExpiresAt: new Date("2099-01-01T00:00:00.000Z"),
			freeTransactionCount: 999,
		});

		await expect(
			transactionService.create("user-1", {
				description: "Supermercado",
				amount: 15000,
				category: "food",
				type: "expense",
			}),
		).resolves.toBeTruthy();
	});

	it("findById() throws when missing", async () => {
		prismaMock.transaction.findFirst.mockResolvedValue(null);
		await expect(transactionService.findById("user-1", "missing")).rejects.toThrow("Transaction not found");
	});

	it("update() throws when nothing was updated", async () => {
		prismaMock.transaction.updateMany.mockResolvedValue({ count: 0 });
		await expect(transactionService.update("user-1", "tx-1", { amount: 100 })).rejects.toThrow(
			"Transaction not found",
		);
	});

	it("remove() throws when nothing was deleted", async () => {
		prismaMock.transaction.deleteMany.mockResolvedValue({ count: 0 });
		await expect(transactionService.remove("user-1", "tx-1")).rejects.toThrow("Transaction not found");
	});

	it("list() filters by search term against decrypted description", async () => {
		prismaMock.transaction.findMany.mockResolvedValue([
			buildRow({ id: "tx-1", description: encrypt("Supermercado") }),
			buildRow({ id: "tx-2", description: encrypt("Uber") }),
		]);

		const result = await transactionService.list("user-1", {
			search: "uber",
			page: 1,
			perPage: 20,
		});

		expect(result.total).toBe(1);
		expect(result.transactions[0]?.description).toBe("Uber");
	});

	it("list() paginates filtered results", async () => {
		prismaMock.transaction.findMany.mockResolvedValue([
			buildRow({ id: "tx-1" }),
			buildRow({ id: "tx-2" }),
			buildRow({ id: "tx-3" }),
		]);

		const result = await transactionService.list("user-1", { page: 2, perPage: 2 });

		expect(result.total).toBe(3);
		expect(result.transactions).toHaveLength(1);
		expect(result.transactions[0]?.id).toBe("tx-3");
	});

	it("statsByCategory() computes percentages relative to each type's total", async () => {
		repositoryMock.findAllForStats.mockResolvedValue([
			{ amount: encrypt("300"), category: "food", type: "expense" },
			{ amount: encrypt("100"), category: "transport", type: "expense" },
			{ amount: encrypt("1000"), category: "salary", type: "income" },
		]);

		const stats = await transactionService.statsByCategory("user-1");
		const food = stats.find((row) => row.category === "food");
		const salary = stats.find((row) => row.category === "salary");

		expect(food).toMatchObject({ total: 300, percentage: 75 });
		expect(salary).toMatchObject({ total: 1000, percentage: 100 });
	});

	it("statsByCategory() returns rows sorted by total descending", async () => {
		repositoryMock.findAllForStats.mockResolvedValue([
			{ amount: encrypt("100"), category: "food", type: "expense" },
			{ amount: encrypt("500"), category: "transport", type: "expense" },
			{ amount: encrypt("300"), category: "housing", type: "expense" },
		]);

		const stats = await transactionService.statsByCategory("user-1");

		expect(stats.map((row) => row.category)).toEqual(["transport", "housing", "food"]);
	});

	it("TransactionNotFoundError remains an AppError subclass for callers", () => {
		expect(new TransactionNotFoundError()).toBeInstanceOf(Error);
		expect(new TransactionNotFoundError().status).toBe(404);
	});
});
