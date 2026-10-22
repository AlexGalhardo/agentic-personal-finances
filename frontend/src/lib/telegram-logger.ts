import { createTelegramLogger } from "@galhardoalex/telegram-logger";

const botToken = process.env.TELEGRAM_LOGGER_BOT_TOKEN ?? process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_LOGGER_CHAT_ID ?? process.env.TELEGRAM_CHAT_ID;
const nodeEnv = process.env.NODE_ENV ?? "development";

/**
 * Server-side ops alerts only — never import this from client components
 * (bot token must not ship to the browser).
 */
export const telegramLogger = createTelegramLogger({
	botToken,
	chatId,
	appName: "agentic-personal-finances-web",
	environment: nodeEnv,
	enabled: Boolean(botToken && chatId) && nodeEnv !== "test",
	minLevel: nodeEnv === "production" ? "warn" : "info",
});
