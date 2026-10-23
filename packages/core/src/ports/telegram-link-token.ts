import type { AppFailure } from "../failures";
import type { Result } from "../result";

export type ConsumedLinkToken = {
	readonly chatId: string;
	readonly expiresAt: Date;
};

export interface TelegramLinkTokenStore {
	create(chatId: string, token: string, expiresAt: Date): Promise<Result<void, AppFailure>>;
	/** Atomic consume: delete row; return null if missing. Caller checks expiry. */
	consume(token: string): Promise<Result<ConsumedLinkToken | null, AppFailure>>;
}
