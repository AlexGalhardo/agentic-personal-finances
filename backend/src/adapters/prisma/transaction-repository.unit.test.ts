import { beforeEach, describe, expect, it, mock } from "bun:test";
import { encrypt } from "../../lib/encryption";

const prismaMock = {
	transaction: {
		create: mock(),
		findFirst: mock(),
		findMany: mock(),
		updateMany: mock(),
		deleteMany: mock(),
		count: mock(),
	},
};

mock.module("../../config/prisma", () => ({ prisma: prismaMock }));

const { createPrismaTransactionRepository } = await import("./transaction-repository");

describe("createPrismaTransactionRepository", () => {
	const repo = createPrismaTransactionRepository();

	beforeEach(() => {
		for (const fn of Object.values(prismaMock.transaction)) fn.mockReset();
	});

	it("encrypts description/amount on create and returns plaintext domain fields", async () => {
		prismaMock.transaction.create.mockResolvedValue({
			id: "tx-1",
			userId: "user-1",
			description: encrypt("Supermercado"),
			amount: encrypt("15000"),
			category: "food",
			type: "expense",
			date: new Date("2026-01-01T00:00:00.000Z"),
			createdAt: new Date("2026-01-01T00:00:00.000Z"),
			updatedAt: null,
		});

		const result = await repo.create({
			userId: "user-1",
			description: "Supermercado",
			amount: 15000,
			category: "food",
			type: "expense",
			date: new Date("2026-01-01T00:00:00.000Z"),
		});

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.value.description).toBe("Supermercado");
		expect(result.value.amount).toBe(15000);

		const [args] = prismaMock.transaction.create.mock.calls[0] as [
			{ data: { description: string; amount: string } },
		];
		expect(args.data.description).not.toBe("Supermercado");
		expect(args.data.amount).not.toBe("15000");
	});
});
