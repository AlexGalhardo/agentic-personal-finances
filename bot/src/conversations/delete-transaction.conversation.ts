import type { Context } from "grammy";
import { InlineKeyboard } from "grammy";
import { botDeleteTransaction, botListTransactions } from "../adapters/transactions";
import { formatCurrencyCents, formatDate, getCategoryLabel } from "../formatting/format";
import type { BotConversation } from "../types";

type Candidate = { id: string; description: string; amount: number; category: string; createdAt: string };

function summarize(candidate: Candidate): string {
	return `${formatCurrencyCents(candidate.amount)} · ${getCategoryLabel(candidate.category)} · ${formatDate(candidate.createdAt)} — ${candidate.description}`;
}

export async function deleteTransactionConversation(
	conversation: BotConversation,
	ctx: Context,
	userId: string,
): Promise<void> {
	await ctx.reply("🗑️ Enter the name (or part of the name) of the transaction you want to delete:");

	let candidates: Candidate[] = [];
	for (;;) {
		const reply = await conversation.waitFor("message:text", {
			otherwise: (otherCtx) => otherCtx.reply("Enter text to search for:"),
		});
		const text = reply.message.text.trim();
		if (!text) {
			await reply.reply("Enter text to search for:");
			continue;
		}

		const result = await conversation.external(() =>
			botListTransactions(userId, { search: text, page: 1, perPage: 10 }),
		);

		if (result.transactions.length === 0) {
			await reply.reply("No transactions found with that name.");
			return;
		}

		candidates = result.transactions.map((transaction) => ({
			id: transaction.id,
			description: transaction.description,
			amount: transaction.amount,
			category: transaction.category,
			createdAt: transaction.createdAt,
		}));

		const keyboard = new InlineKeyboard();
		for (const candidate of candidates) {
			keyboard.text(summarize(candidate).slice(0, 64), `del:${candidate.id}`).row();
		}
		await reply.reply("Which one do you want to delete?", { reply_markup: keyboard });
		break;
	}

	const picked = await conversation.waitFor("callback_query:data", {
		otherwise: (otherCtx) => otherCtx.reply("Use the buttons above to choose a transaction."),
	});
	const pickedId = picked.callbackQuery.data.slice("del:".length);
	const candidate = candidates.find((item) => item.id === pickedId);
	if (!candidate) {
		await picked.answerCallbackQuery("Transaction not found");
		return;
	}
	await picked.answerCallbackQuery();

	const confirmKeyboard = new InlineKeyboard().text("✅ Yes, delete", "confirm:yes").text("❌ Cancel", "confirm:no");
	await picked.reply(`Are you sure you want to delete?\n\n${summarize(candidate)}`, {
		reply_markup: confirmKeyboard,
	});

	const confirmation = await conversation.waitFor("callback_query:data", {
		otherwise: (otherCtx) => otherCtx.reply("Use the buttons above to confirm or cancel."),
	});
	await confirmation.answerCallbackQuery();

	if (confirmation.callbackQuery.data !== "confirm:yes") {
		await confirmation.reply("Operation cancelled.");
		return;
	}

	await conversation.external(() => botDeleteTransaction(userId, candidate.id));
	await confirmation.reply("✅ Transaction deleted successfully.");
}
