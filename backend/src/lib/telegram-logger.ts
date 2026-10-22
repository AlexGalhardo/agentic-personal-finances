import { createTelegramLogger } from "@galhardoalex/telegram-logger";
import { env } from "../config/env";

const botToken = Bun.env.TELEGRAM_LOGGER_BOT_TOKEN ?? Bun.env.TELEGRAM_BOT_TOKEN;
const chatId = Bun.env.TELEGRAM_LOGGER_CHAT_ID ?? Bun.env.TELEGRAM_CHAT_ID;

/**
 * Ops alerts to Telegram (warn / error / fatal). No-op when token/chat are
 * unset or `NODE_ENV=test`. "Critical" maps to `fatal` (library levels).
 */
export const telegramLogger = createTelegramLogger({
	botToken,
	chatId,
	appName: "agentic-personal-finances-api",
	environment: env.NODE_ENV,
	enabled: Boolean(botToken && chatId) && env.NODE_ENV !== "test",
	minLevel: env.NODE_ENV === "production" ? "warn" : "info",
});
