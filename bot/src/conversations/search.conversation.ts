import type { TransactionCategory } from "@agentic-personal-finances/backend/src/modules/transactions/transaction.schema";
import type { Context } from "grammy";
import { InlineKeyboard } from "grammy";
import { botListTransactions } from "../adapters/transactions";
import {
	customRange,
	InvalidDateRangeError,
	last30Days,
	lastWeek,
	monthRange,
	yearRange,
} from "../date-ranges/date-ranges";
import { formatTransactionList } from "../formatting/format";
import { chunk } from "../lib/chunk";
import { categoryKeyboard, parseCategoryCallback } from "../lib/keyboards";
import type { BotConversation } from "../types";

const PER_PAGE = 20;

function filterMenuKeyboard(): InlineKeyboard {
	const keyboard = new InlineKeyboard();
	const options: [string, string][] = [
		["Category", "filter:category"],
		["Transaction name", "filter:name"],
		["Period (start/end date)", "filter:range"],
		["Year", "filter:year"],
		["Month", "filter:month"],
		["Last week", "filter:lastweek"],
		["Last 30 days", "filter:last30"],
	];
	for (const row of chunk(options, 2)) {
		for (const [label, data] of row) keyboard.text(label, data);
		keyboard.row();
	}
	return keyboard;
}

async function runSearch(
	ctx: Context,
	conversation: BotConversation,
	userId: string,
	query: { search?: string; category?: TransactionCategory; from?: string; to?: string },
): Promise<void> {
	const result = await conversation.external(() =>
		botListTransactions(userId, { ...query, page: 1, perPage: PER_PAGE }),
	);

	const truncated = result.total > PER_PAGE;
	const header = truncated
		? `Found ${result.total} transactions, showing the ${PER_PAGE} most recent:`
		: `Found ${result.total} transaction(s):`;

	await ctx.reply(`${header}\n\n${formatTransactionList(result.transactions)}`);
}

export async function searchConversation(conversation: BotConversation, ctx: Context, userId: string): Promise<void> {
	await ctx.reply("🔎 How do you want to search?", { reply_markup: filterMenuKeyboard() });

	const choice = await conversation.waitFor("callback_query:data", {
		otherwise: (otherCtx) => otherCtx.reply("Use the buttons above to choose how to search."),
	});
	await choice.answerCallbackQuery();
	const kind = choice.callbackQuery.data.slice("filter:".length);

	if (kind === "lastweek") {
		const range = lastWeek();
		await runSearch(choice, conversation, userId, { from: range.from.toISOString(), to: range.to.toISOString() });
		return;
	}
	if (kind === "last30") {
		const range = last30Days();
		await runSearch(choice, conversation, userId, { from: range.from.toISOString(), to: range.to.toISOString() });
		return;
	}

	if (kind === "category") {
		await choice.reply("Choose a category:", { reply_markup: categoryKeyboard() });
		const categoryChoice = await conversation.waitFor("callback_query:data", {
			otherwise: (otherCtx) => otherCtx.reply("Use the buttons above to choose a category."),
		});
		await categoryChoice.answerCallbackQuery();
		const category = parseCategoryCallback(categoryChoice.callbackQuery.data);
		if (!category) {
			await categoryChoice.reply("Invalid category.");
			return;
		}
		await runSearch(categoryChoice, conversation, userId, { category });
		return;
	}

	const prompts: Record<string, string> = {
		name: "Enter the name (or part of the name) of the transaction:",
		range: "Enter the start and end dates as dd/mm/yyyy dd/mm/yyyy (e.g. 01/08/2026 15/08/2026):",
		year: "Enter the year as yyyy (e.g. 2026):",
		month: "Enter the month as mm/yyyy (e.g. 08/2026):",
	};

	const prompt = prompts[kind];
	if (!prompt) {
		await choice.reply("Invalid option.");
		return;
	}
	await choice.reply(prompt);

	for (;;) {
		const reply = await conversation.waitFor("message:text", {
			otherwise: (otherCtx) => otherCtx.reply("I did not understand — send text:"),
		});
		const text = reply.message.text.trim();
		if (!text) {
			await reply.reply("I did not understand — try again:");
			continue;
		}

		try {
			if (kind === "name") {
				await runSearch(reply, conversation, userId, { search: text });
			} else if (kind === "range") {
				const [fromText, toText] = text.split(/\s+/);
				if (!fromText || !toText) {
					throw new InvalidDateRangeError("Send both dates separated by a space: dd/mm/yyyy dd/mm/yyyy");
				}
				const range = customRange(fromText, toText);
				await runSearch(reply, conversation, userId, {
					from: range.from.toISOString(),
					to: range.to.toISOString(),
				});
			} else if (kind === "year") {
				const range = yearRange(text);
				await runSearch(reply, conversation, userId, {
					from: range.from.toISOString(),
					to: range.to.toISOString(),
				});
			} else if (kind === "month") {
				const range = monthRange(text);
				await runSearch(reply, conversation, userId, {
					from: range.from.toISOString(),
					to: range.to.toISOString(),
				});
			}
		} catch (error) {
			if (error instanceof InvalidDateRangeError) {
				await reply.reply(`${error.message}. Try again:`);
				continue;
			}
			throw error;
		}

		return;
	}
}
