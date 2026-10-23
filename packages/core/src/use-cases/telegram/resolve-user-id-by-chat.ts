import type { AppFailure } from "../../failures";
import { ok, type Result } from "../../result";
import type { TelegramDeps } from "./telegram-deps";

export async function resolveUserIdByChat(
	deps: TelegramDeps,
	chatId: number,
): Promise<Result<string | null, AppFailure>> {
	const found = await deps.profiles.findByTelegramChatId(String(chatId));
	if (!found.ok) return found;
	return ok(found.value?.id ?? null);
}
