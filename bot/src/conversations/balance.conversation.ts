import { transactionService } from "@agentic-personal-finances/backend/src/modules/transactions/transaction.service";
import type { Context } from "grammy";
import { formatCurrencyCents, getCategoryLabel } from "../formatting/format";
import type { BotConversation } from "../types";

export async function balanceConversation(conversation: BotConversation, ctx: Context, userId: string): Promise<void> {
	const stats = await conversation.external(() => transactionService.statsByCategory(userId));

	const incomeTotal = stats.filter((row) => row.type === "income").reduce((sum, row) => sum + row.total, 0);
	const expenseTotal = stats.filter((row) => row.type === "expense").reduce((sum, row) => sum + row.total, 0);
	const balance = incomeTotal - expenseTotal;

	const lines = [
		"📊 Overall summary",
		"",
		`Income: ${formatCurrencyCents(incomeTotal)}`,
		`Expenses: ${formatCurrencyCents(expenseTotal)}`,
		`Balance: ${formatCurrencyCents(balance)}`,
		"",
		"By category:",
		...stats
			.sort((a, b) => b.total - a.total)
			.map(
				(row) =>
					`${row.type === "income" ? "🟢" : "🔴"} ${getCategoryLabel(row.category)}: ${formatCurrencyCents(row.total)} (${row.percentage}%)`,
			),
	];

	await ctx.reply(lines.join("\n"));
}
