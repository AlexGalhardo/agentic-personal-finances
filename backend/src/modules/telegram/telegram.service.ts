import type { AppFailure, Result } from "@agentic-personal-finances/core";
import {
	completeTelegramLink,
	createTelegramLinkToken,
	linkTelegramChat,
	resolveUserIdByChat,
	unlinkTelegramChat,
	unlinkTelegramForUser,
} from "@agentic-personal-finances/core";
import { failureToAppError, unwrapOrThrow } from "../../adapters/http/map-result";
import { AppError } from "../../lib/errors";
import { telegramPorts } from "./telegram.deps";

export class ChatAlreadyLinkedError extends AppError {
	constructor() {
		super("This chat is already linked to another account", 409);
	}
}

export class InvalidLinkTokenError extends AppError {
	constructor() {
		super("Invalid or expired link", 400);
	}
}

function unwrapTelegram<T>(result: Result<T, AppFailure>): T {
	if (result.ok) return result.value;
	if (result.error.code === "conflict") throw new ChatAlreadyLinkedError();
	if (result.error.code === "invalid_input") throw new InvalidLinkTokenError();
	throw failureToAppError(result.error);
}

/**
 * The bot is multi-tenant: each Telegram chat is linked to one app account
 * through `User.telegramChatId`. Linking must always prove control of the
 * account — either the bot's e-mail/password login, or the single-use token
 * redeemed by an authenticated web session (`completeLinkToken`). Never link
 * from an identifier the requester merely claims to own.
 */
export async function findUserIdByChatId(chatId: number): Promise<string | null> {
	return unwrapOrThrow(await resolveUserIdByChat(telegramPorts, chatId));
}

/** Links the chat to an account the caller has already authenticated as. */
export async function linkChatToUser(chatId: number, userId: string): Promise<void> {
	unwrapTelegram(await linkTelegramChat(telegramPorts, chatId, userId));
}

export async function unlinkChatFromUser(chatId: number): Promise<void> {
	unwrapOrThrow(await unlinkTelegramChat(telegramPorts, chatId));
}

export async function unlinkUser(userId: string): Promise<void> {
	unwrapOrThrow(await unlinkTelegramForUser(telegramPorts, userId));
}

/**
 * Single-use token for linking a chat from the browser: the bot can't run
 * OAuth inside the chat, so it sends a link to a frontend page carrying this
 * token; once the user is logged in there (Google or e-mail/password),
 * `completeLinkToken` redeems it for the authenticated account.
 */
export async function createLinkToken(chatId: number): Promise<{ token: string; expiresAt: Date }> {
	return unwrapOrThrow(await createTelegramLinkToken(telegramPorts, chatId));
}

/**
 * Deleting first (instead of find-then-delete) makes redemption atomic: two
 * concurrent requests with the same token can't both succeed, because only
 * one `delete` finds the row. Expired tokens are deleted too, so they don't
 * pile up.
 */
export async function completeLinkToken(userId: string, token: string): Promise<{ chatId: number }> {
	return unwrapTelegram(await completeTelegramLink(telegramPorts, userId, token));
}
