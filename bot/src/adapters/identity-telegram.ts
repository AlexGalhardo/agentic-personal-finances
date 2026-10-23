import { failureToAppError, unwrapOrThrow } from "@agentic-personal-finances/backend/src/adapters/http/map-result";
import { telegramPorts } from "@agentic-personal-finances/backend/src/modules/telegram/telegram.deps";
import {
	ChatAlreadyLinkedError,
	InvalidLinkTokenError,
} from "@agentic-personal-finances/backend/src/modules/telegram/telegram.service";
import {
	type AppFailure,
	createTelegramLinkToken,
	linkTelegramChat,
	type Result,
	resolveUserIdByChat,
} from "@agentic-personal-finances/core";

function unwrapTelegram<T>(result: Result<T, AppFailure>): T {
	if (result.ok) return result.value;
	if (result.error.code === "conflict") throw new ChatAlreadyLinkedError();
	if (result.error.code === "invalid_input") throw new InvalidLinkTokenError();
	throw failureToAppError(result.error);
}

export async function botFindUserIdByChatId(chatId: number): Promise<string | null> {
	return unwrapOrThrow(await resolveUserIdByChat(telegramPorts, chatId));
}

export async function botLinkChatToUser(chatId: number, userId: string): Promise<void> {
	unwrapTelegram(await linkTelegramChat(telegramPorts, chatId, userId));
}

export async function botCreateLinkToken(chatId: number): Promise<{ token: string; expiresAt: Date }> {
	return unwrapOrThrow(await createTelegramLinkToken(telegramPorts, chatId));
}
