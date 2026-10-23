import { beforeEach, describe, expect, it, mock } from "bun:test";

const prismaMock = {
	telegramLinkToken: {
		create: mock(),
		delete: mock(),
	},
};

mock.module("../../config/prisma", () => ({ prisma: prismaMock }));

const { createPrismaTelegramLinkTokenStore } = await import("./telegram-link-token-store");

describe("createPrismaTelegramLinkTokenStore", () => {
	const store = createPrismaTelegramLinkTokenStore();

	beforeEach(() => {
		prismaMock.telegramLinkToken.create.mockReset();
		prismaMock.telegramLinkToken.delete.mockReset();
	});

	it("consume uses delete-first and returns null when row missing", async () => {
		prismaMock.telegramLinkToken.delete.mockRejectedValue(new Error("not found"));

		const result = await store.consume("missing");
		expect(result.ok).toBe(true);
		if (result.ok) expect(result.value).toBe(null);
	});

	it("consume returns chatId and expiresAt when delete succeeds", async () => {
		const expiresAt = new Date("2026-10-22T13:00:00.000Z");
		prismaMock.telegramLinkToken.delete.mockResolvedValue({
			token: "tok",
			chatId: "999",
			expiresAt,
		});

		const result = await store.consume("tok");
		expect(result.ok).toBe(true);
		if (result.ok && result.value) {
			expect(result.value.chatId).toBe("999");
			expect(result.value.expiresAt).toEqual(expiresAt);
		}
	});
});
