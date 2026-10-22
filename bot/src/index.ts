import { GrammyError } from "grammy";
import { createBot } from "./bot";
import { telegramLogger } from "./lib/telegram-logger";

const bot = createBot();

// grammY rethrows (instead of retrying forever) 401/409 errors from
// getUpdates — 409 means another instance is already long polling with this
// TELEGRAM_BOT_TOKEN (production and local can never run at the same time
// with the same token). Without this catch, the rejection surfaces as an
// unhandled rejection with an unreadable stack trace.
bot.start({
	onStart: () => console.log("🤖 Telegram bot running (long polling)..."),
}).catch(async (error: unknown) => {
	if (error instanceof GrammyError && error.error_code === 409) {
		console.error(
			"🤖 Telegram bot failed to start: another instance is already long polling with this TELEGRAM_BOT_TOKEN. Stop it (e.g. production on Railway) before running locally, or create a separate test bot (@BotFather > /newbot) for development.",
		);
		await telegramLogger.fatal(error, { reason: "conflict_409" });
		process.exit(1);
	}
	if (error instanceof GrammyError && error.error_code === 401) {
		console.error("🤖 Telegram bot failed to start: TELEGRAM_BOT_TOKEN is invalid or revoked.");
		await telegramLogger.fatal(error, { reason: "unauthorized_401" });
		process.exit(1);
	}
	await telegramLogger.fatal(error, { reason: "bot_start_failed" });
	throw error;
});

process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());
