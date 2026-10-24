import { unlinkChatFromUser } from "@agentic-personal-finances/backend/src/modules/telegram/telegram.service";
import { transactionCategories } from "@agentic-personal-finances/backend/src/modules/transactions/transaction.schema";
import { conversations, createConversation } from "@grammyjs/conversations";
import { Bot, InlineKeyboard } from "grammy";
import { botFindUserIdByChatId } from "./adapters/identity-telegram";
import { env } from "./config/env";
import { createAddTransactionConversation } from "./conversations/add-transaction.conversation";
import { balanceConversation } from "./conversations/balance.conversation";
import { deleteTransactionConversation } from "./conversations/delete-transaction.conversation";
import { listTransactionsConversation } from "./conversations/list-transactions.conversation";
import { reportConversation } from "./conversations/report.conversation";
import { searchConversation } from "./conversations/search.conversation";
import { startConversation } from "./conversations/start.conversation";
import { categoryLabels } from "./formatting/format";
import { withAuthorizedUser } from "./lib/authorized";
import { buildMenu, withMainMenu } from "./lib/menu";
import { telegramLogger } from "./lib/telegram-logger";
import type { BotContext } from "./types";

function confirmLogoutKeyboard(): InlineKeyboard {
	return new InlineKeyboard().text("✅ Yes, disconnect", "logout:confirm").text("❌ Cancel", "logout:cancel");
}

// "login" isn't a conversation of its own — it re-enters "start", which runs
// the access flow (conversations/start.conversation.ts). Routing it through
// this table keeps loginPromptKeyboard()'s button on the same ^menu: handler.
const MENU_ACTIONS: Record<string, string> = {
	login: "start",
	expense: "add-expense",
	income: "add-income",
	transactions: "list-transactions",
	summary: "balance",
	search: "search",
	delete: "delete-transaction",
	report: "report",
};

export function createBot(): Bot<BotContext> {
	const bot = new Bot<BotContext>(env.TELEGRAM_BOT_TOKEN);

	// @grammyjs/conversations v2 ships its own in-memory storage (per chat),
	// no classic grammY `session()` needed.
	bot.use(conversations());

	// Escape hatch — works even mid-conversation. It must be registered before
	// the createConversation() middlewares: an active conversation consumes
	// every update that reaches it, so "/cancelar" registered after them was
	// read as an answer ("Invalid number") instead of leaving the flow.
	bot.command("cancelar", async (ctx) => {
		await ctx.conversation.exitAll();
		const { text, keyboard } = await buildMenu(ctx.chat?.id);
		await ctx.reply(text, { parse_mode: "Markdown", reply_markup: keyboard });
	});

	const authorizedConversations = {
		"add-expense": createAddTransactionConversation("expense", "expense"),
		"add-income": createAddTransactionConversation("income", "income"),
		"list-transactions": listTransactionsConversation,
		balance: balanceConversation,
		search: searchConversation,
		"delete-transaction": deleteTransactionConversation,
		report: reportConversation,
	};

	bot.use(createConversation(withMainMenu(startConversation), "start"));
	for (const [id, conversation] of Object.entries(authorizedConversations)) {
		bot.use(createConversation(withMainMenu(withAuthorizedUser(conversation)), id));
	}

	bot.command("start", async (ctx) => {
		await ctx.conversation.enter("start");
	});

	bot.callbackQuery(/^menu:/, async (ctx) => {
		await ctx.answerCallbackQuery();
		const action = ctx.callbackQuery.data.slice("menu:".length);

		if (action === "categories") {
			const list = transactionCategories.map((category) => `• ${categoryLabels[category]}`).join("\n");
			await ctx.reply(`Available categories:\n\n${list}`);
			return;
		}

		if (action === "help") {
			const { text, keyboard } = await buildMenu(ctx.chat?.id);
			await ctx.reply(text, { parse_mode: "Markdown", reply_markup: keyboard });
			return;
		}

		if (action === "switch-account") {
			const chatId = ctx.chat?.id;
			const linkedUserId = chatId === undefined ? null : await botFindUserIdByChatId(chatId);
			if (!linkedUserId) {
				await ctx.reply("This chat is not linked to any account yet.");
				return;
			}
			await ctx.reply(
				"Are you sure you want to disconnect the current account from this chat? You can link another one next.",
				{ reply_markup: confirmLogoutKeyboard() },
			);
			return;
		}

		const conversationId = MENU_ACTIONS[action];
		if (conversationId) {
			await ctx.conversation.enter(conversationId);
		}
	});

	bot.callbackQuery(/^logout:/, async (ctx) => {
		await ctx.answerCallbackQuery();
		const action = ctx.callbackQuery.data.slice("logout:".length);
		const chatId = ctx.chat?.id;

		if (action === "confirm" && chatId !== undefined) {
			await unlinkChatFromUser(chatId);
			await ctx.reply("🔌 Account disconnected. Tap any menu option to sign in with another account.");
			return;
		}

		await ctx.reply("Operation cancelled.");
	});

	// Global fallback: anything that isn't a known command nor consumed by a
	// running conversation lands here, so the bot never goes silent.
	bot.on("message", async (ctx) => {
		const { keyboard } = await buildMenu(ctx.chat?.id);
		await ctx.reply("I did not understand. Use the buttons below:", { reply_markup: keyboard });
	});

	bot.catch(({ error, ctx }) => {
		console.error(`Unhandled error for update ${ctx.update.update_id}:`, error);
		void telegramLogger.error(error, { updateId: ctx.update.update_id, chatId: ctx.chat?.id });
		buildMenu(ctx.chat?.id)
			.then(({ keyboard }) =>
				ctx.reply("⚠️ An unexpected error occurred. Tap a button below to continue:", {
					reply_markup: keyboard,
				}),
			)
			.catch(() => undefined);
	});

	return bot;
}
