import { createTelegramLogger } from "@galhardoalex/telegram-logger";

const botToken = Bun.env.TELEGRAM_LOGGER_BOT_TOKEN ?? Bun.env.TELEGRAM_BOT_TOKEN;
const chatId = Bun.env.TELEGRAM_LOGGER_CHAT_ID ?? Bun.env.TELEGRAM_CHAT_ID;
const nodeEnv = Bun.env.NODE_ENV ?? "development";

/**
 * Ops alerts to Telegram (warn / error / fatal). Prefer a dedicated alerts
 * chat (`TELEGRAM_LOGGER_CHAT_ID`) so user chats stay quiet. No-op in test
 * or when config is missing. "Critical" maps to `fatal`.
 */
export const telegramLogger = createTelegramLogger({
	botToken,
	chatId,
	appName: "agentic-personal-finances-bot",
	environment: nodeEnv,
	enabled: Boolean(botToken && chatId) && nodeEnv !== "test",
	minLevel: nodeEnv === "production" ? "warn" : "info",
});
