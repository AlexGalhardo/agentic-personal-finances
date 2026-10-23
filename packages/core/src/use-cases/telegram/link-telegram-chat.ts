import { type AppFailure, failure } from "../../failures";
import { err, type Result } from "../../result";
import type { TelegramDeps } from "./telegram-deps";

export async function linkTelegramChat(
	deps: TelegramDeps,
	chatId: number,
	userId: string,
): Promise<Result<void, AppFailure>> {
	const existing = await deps.profiles.findByTelegramChatId(String(chatId));
	if (!existing.ok) return existing;
	if (existing.value && existing.value.id !== userId) {
		return err(failure("conflict", "This chat is already linked to another account"));
	}
	return deps.profiles.setTelegramChatId(userId, String(chatId));
}
