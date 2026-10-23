import type { AppFailure } from "../../failures";
import { ok, type Result } from "../../result";
import type { TelegramDeps } from "./telegram-deps";

export type CreateTelegramLinkTokenResult = {
	readonly token: string;
	readonly expiresAt: Date;
};

export async function createTelegramLinkToken(
	deps: TelegramDeps,
	chatId: number,
): Promise<Result<CreateTelegramLinkTokenResult, AppFailure>> {
	const token = deps.generateToken();
	const expiresAt = new Date(deps.clock.now().getTime() + deps.linkTokenTtlMs);
	const created = await deps.tokens.create(String(chatId), token, expiresAt);
	if (!created.ok) return created;
	return ok({ token, expiresAt });
}
