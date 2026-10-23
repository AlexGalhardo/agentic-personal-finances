import { randomBytes } from "node:crypto";
import { TELEGRAM_LINK_TOKEN_TTL_MS, type TelegramDeps } from "@agentic-personal-finances/core";
import { systemClock } from "../../adapters/prisma/system-clock";
import { createPrismaTelegramLinkTokenStore } from "../../adapters/prisma/telegram-link-token-store";
import { createPrismaUserProfileStore } from "../../adapters/prisma/user-profile-store";

export const telegramPorts: TelegramDeps = {
	profiles: createPrismaUserProfileStore(),
	tokens: createPrismaTelegramLinkTokenStore(),
	clock: systemClock,
	generateToken: () => randomBytes(32).toString("base64url"),
	linkTokenTtlMs: TELEGRAM_LINK_TOKEN_TTL_MS,
};
