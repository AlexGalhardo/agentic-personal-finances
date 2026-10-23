import type { AppFailure } from "../../failures";
import { ok, type Result } from "../../result";
import type { TelegramDeps } from "./telegram-deps";

export async function unlinkTelegramChat(deps: TelegramDeps, chatId: number): Promise<Result<void, AppFailure>> {
	const user = await deps.profiles.findByTelegramChatId(String(chatId));
	if (!user.ok) return user;
	if (!user.value) return ok(undefined);
	return deps.profiles.setTelegramChatId(user.value.id, null);
}
