import type {
	TransactionCategory,
	TransactionType,
} from "@agentic-personal-finances/backend/src/modules/transactions/transaction.schema";
import { createTransactionSchema } from "@agentic-personal-finances/backend/src/modules/transactions/transaction.schema";
import type { Context } from "grammy";
import { InlineKeyboard } from "grammy";
import { botCreateTransaction } from "../adapters/transactions";
import { categoryLabels, formatCurrencyCents } from "../formatting/format";
import { categoryKeyboard, parseCategoryCallback } from "../lib/keyboards";
import { parseAmountToCents } from "../lib/parse-amount";
import type { BotConversation } from "../types";

const descriptionSchema = createTransactionSchema.shape.description;
const amountSchema = createTransactionSchema.shape.amount;

export function createAddTransactionConversation(type: TransactionType, label: string) {
	return async function addTransactionConversation(
		conversation: BotConversation,
		ctx: Context,
		userId: string,
	): Promise<void> {
		await ctx.reply(`💰 Enter the ${label} amount (e.g. 49.90):`);

		let amountCents: number | null = null;
		while (amountCents === null) {
			const reply = await conversation.waitFor("message:text", {
				otherwise: (otherCtx) => otherCtx.reply("Enter the amount as text, e.g. 49.90"),
			});
			const parsed = amountSchema.safeParse(parseAmountToCents(reply.message.text));
			if (parsed.success) {
				amountCents = parsed.data;
			} else {
				await reply.reply("Invalid amount. Enter a number greater than zero, e.g. 49.90");
			}
		}

		await ctx.reply("📂 Choose a category:", { reply_markup: categoryKeyboard() });

		let category: TransactionCategory | null = null;
		while (category === null) {
			const reply = await conversation.waitFor("callback_query:data", {
				otherwise: (otherCtx) => otherCtx.reply("Use the buttons above to choose a category."),
			});
			await reply.answerCallbackQuery();
			category = parseCategoryCallback(reply.callbackQuery.data);
		}

		await ctx.reply("📝 Describe the transaction (e.g. Grocery, Uber, Salary...):");

		let description: string | null = null;
		while (description === null) {
			const reply = await conversation.waitFor("message:text", {
				otherwise: (otherCtx) => otherCtx.reply("Describe the transaction in text:"),
			});
			const parsed = descriptionSchema.safeParse(reply.message.text);
			if (parsed.success) {
				description = parsed.data;
			} else {
				await reply.reply("Description must be 1–280 characters. Describe the transaction:");
			}
		}

		const summary = [
			`Confirm the ${label} below?`,
			"",
			`Amount: ${formatCurrencyCents(amountCents)}`,
			`Category: ${categoryLabels[category]}`,
			`Description: ${description}`,
		].join("\n");

		const confirmKeyboard = new InlineKeyboard().text("✅ Confirm", "confirm:yes").text("❌ Cancel", "confirm:no");
		await ctx.reply(summary, { reply_markup: confirmKeyboard });

		const confirmation = await conversation.waitFor("callback_query:data", {
			otherwise: (otherCtx) => otherCtx.reply("Use the buttons above to confirm or cancel."),
		});
		await confirmation.answerCallbackQuery();

		if (confirmation.callbackQuery.data !== "confirm:yes") {
			await confirmation.reply("Operation cancelled.");
			return;
		}

		const input = { description, amount: amountCents, category, type };
		const created = await conversation.external(() => botCreateTransaction(userId, input));
		if (!created.ok) {
			await confirmation.reply(created.reply);
			return;
		}

		await confirmation.reply(`✅ ${type === "expense" ? "Expense" : "Income"} saved successfully!`);
	};
}
