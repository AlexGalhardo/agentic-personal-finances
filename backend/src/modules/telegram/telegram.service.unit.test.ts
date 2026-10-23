import { beforeEach, describe, expect, it, mock } from "bun:test";

const telegramMock = {
	resolveUserIdByChat: mock(),
	linkTelegramChat: mock(),
	completeTelegramLink: mock(),
};

mock.module("@agentic-personal-finances/core", () => ({
	completeTelegramLink: telegramMock.completeTelegramLink,
	linkTelegramChat: telegramMock.linkTelegramChat,
	resolveUserIdByChat: telegramMock.resolveUserIdByChat,
	createTelegramLinkToken: mock(),
	unlinkTelegramChat: mock(),
	unlinkTelegramForUser: mock(),
}));

const { ChatAlreadyLinkedError, InvalidLinkTokenError, linkChatToUser, completeLinkToken } = await import(
	"./telegram.service"
);

describe("telegram.service", () => {
	beforeEach(() => {
		for (const fn of Object.values(telegramMock)) fn.mockReset();
	});

	it("linkChatToUser throws ChatAlreadyLinkedError on conflict", async () => {
		telegramMock.linkTelegramChat.mockResolvedValue({
			ok: false,
			error: { code: "conflict", message: "This chat is already linked to another account" },
		});

		await expect(linkChatToUser(1, "user-a")).rejects.toThrow(ChatAlreadyLinkedError);
	});

	it("completeLinkToken throws InvalidLinkTokenError on invalid_input", async () => {
		telegramMock.completeTelegramLink.mockResolvedValue({
			ok: false,
			error: { code: "invalid_input", message: "Invalid or expired link" },
		});

		await expect(completeLinkToken("user-a", "bad")).rejects.toThrow(InvalidLinkTokenError);
	});
});
