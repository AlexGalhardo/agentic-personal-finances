import type { Clock } from "../../ports/clock";
import type { TelegramLinkTokenStore } from "../../ports/telegram-link-token";
import type { UserProfileStore } from "../../ports/user-profile";

export type TelegramDeps = {
	readonly profiles: UserProfileStore;
	readonly tokens: TelegramLinkTokenStore;
	readonly clock: Clock;
	readonly generateToken: () => string;
	readonly linkTokenTtlMs: number;
};
