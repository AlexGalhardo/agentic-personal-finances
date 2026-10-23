import { ok, type TelegramLinkTokenStore } from "@agentic-personal-finances/core";
import { prisma } from "../../config/prisma";

export function createPrismaTelegramLinkTokenStore(): TelegramLinkTokenStore {
	return {
		async create(chatId, token, expiresAt) {
			await prisma.telegramLinkToken.create({ data: { token, chatId, expiresAt } });
			return ok(undefined);
		},

		async consume(token) {
			const record = await prisma.telegramLinkToken.delete({ where: { token } }).catch(() => null);
			if (!record) return ok(null);
			return ok({ chatId: record.chatId, expiresAt: record.expiresAt });
		},
	};
}
