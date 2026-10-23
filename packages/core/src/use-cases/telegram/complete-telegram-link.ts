import { type AppFailure, failure } from "../../failures";
import { err, ok, type Result } from "../../result";
import { linkTelegramChat } from "./link-telegram-chat";
import type { TelegramDeps } from "./telegram-deps";

export async function completeTelegramLink(
	deps: TelegramDeps,
	userId: string,
	token: string,
): Promise<Result<{ chatId: number }, AppFailure>> {
	const consumed = await deps.tokens.consume(token);
	if (!consumed.ok) return consumed;

	const record = consumed.value;
	if (!record || record.expiresAt < deps.clock.now()) {
		return err(failure("invalid_input", "Invalid or expired link"));
	}

	const linked = await linkTelegramChat(deps, Number(record.chatId), userId);
	if (!linked.ok) return linked;

	return ok({ chatId: Number(record.chatId) });
}
