import type { Context } from "grammy";
import { InlineKeyboard, InputFile } from "grammy";
import { last30Days, lastWeek } from "../date-ranges/date-ranges";
import { buildPeriodReportPdf } from "../lib/pdf-report";
import type { BotConversation } from "../types";

export async function reportConversation(conversation: BotConversation, ctx: Context, userId: string): Promise<void> {
	const keyboard = new InlineKeyboard()
		.text("Last 7 days", "report:7")
		.text("Last 30 days", "report:30")
		.row()
		.text("❌ Cancel", "report:cancel");
	await ctx.reply("📄 Generate a PDF report for which period?", { reply_markup: keyboard });

	const choice = await conversation.waitFor("callback_query:data", {
		otherwise: (otherCtx) => otherCtx.reply("Use the buttons above."),
	});
	await choice.answerCallbackQuery();

	if (choice.callbackQuery.data === "report:cancel") {
		await choice.reply("Operation cancelled.");
		return;
	}

	const days = choice.callbackQuery.data === "report:7" ? 7 : 30;
	const range = days === 7 ? lastWeek() : last30Days();

	await choice.reply("Generating PDF, one moment...");

	const pdfBuffer = await conversation.external(() =>
		buildPeriodReportPdf(userId, range, `Report — last ${days} days`),
	);

	await choice.replyWithDocument(new InputFile(pdfBuffer, `relatorio-${days}-dias.pdf`));
}
