import type { AppFailure } from "../../failures";
import type { Result } from "../../result";
import type { TelegramDeps } from "./telegram-deps";

export async function unlinkTelegramForUser(deps: TelegramDeps, userId: string): Promise<Result<void, AppFailure>> {
	return deps.profiles.setTelegramChatId(userId, null);
}
