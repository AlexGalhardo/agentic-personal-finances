import { env as apiEnv } from "@agentic-personal-finances/backend/src/config/env";
import { hasActivePlan } from "@agentic-personal-finances/backend/src/lib/plan";
import {
	AbacatePayNotConfiguredError,
	paymentService,
} from "@agentic-personal-finances/backend/src/modules/payments/payment.service";
import { userRepository } from "@agentic-personal-finances/backend/src/modules/users/user.repository";
import { PLAN_DEFINITIONS, planIds } from "@agentic-personal-finances/core";
import type { Context } from "grammy";
import { InlineKeyboard, InputFile } from "grammy";
import { formatDate } from "../formatting/format";
import type { BotConversation } from "../types";
import { ensureLinked } from "./auth-flows";

/**
 * Ensures the chat is linked to an account (through `ensureLinked`'s access
 * menu, see ./auth-flows.ts) and that the account has an active plan
 * (offering PIX checkout right in the chat otherwise). Returns a userId only
 * when both hold — otherwise the user was already told why, and the caller
 * should just stop.
 */
export async function ensureUserReady(conversation: BotConversation, ctx: Context): Promise<string | null> {
	const userId = await ensureLinked(conversation, ctx);
	if (!userId) return null;

	return ensureActivePlan(conversation, ctx, userId);
}

async function ensureActivePlan(conversation: BotConversation, ctx: Context, userId: string): Promise<string | null> {
	const user = await conversation.external(() => userRepository.findById(userId));
	if (user && hasActivePlan(user)) return userId;

	await ctx.reply(
		"🔒 Your account is on the free plan; the bot is only for active subscribers. Choose a plan to continue:",
		{ reply_markup: planKeyboard() },
	);

	return runPaymentLoop(conversation, userId);
}

function planKeyboard(): InlineKeyboard {
	const keyboard = new InlineKeyboard();
	for (const id of planIds) {
		const plan = PLAN_DEFINITIONS[id];
		keyboard.text(`${plan.label} — R$ ${(plan.amount / 100).toFixed(2)}`, `plan:${id}`).row();
	}
	keyboard.text("❌ Cancelar", "plan:cancel");
	return keyboard;
}

async function runPaymentLoop(conversation: BotConversation, userId: string): Promise<string | null> {
	for (;;) {
		const chosen = await conversation.waitFor("callback_query:data", {
			otherwise: (otherCtx) => otherCtx.reply("Use the buttons above."),
		});
		const data = chosen.callbackQuery.data;
		await chosen.answerCallbackQuery();

		if (data === "plan:cancel") {
			await chosen.reply("Operation cancelled.");
			return null;
		}

		if (!data.startsWith("plan:")) continue;
		const plan = data.slice("plan:".length) as (typeof planIds)[number];
		if (!planIds.includes(plan)) continue;

		const paid = await offerPixCheckout(conversation, chosen, userId, plan);
		if (paid) return userId;
		// cancelled or the PIX expired — let the user pick a plan again
		await chosen.reply("Escolha um plano para continuar:", { reply_markup: planKeyboard() });
	}
}

type PixCheckoutResult =
	| { ok: true; charge: Awaited<ReturnType<typeof paymentService.createPixCheckout>> }
	| { ok: false };

// Caught IN HERE, not after `conversation.external()`: the conversations
// plugin clones results with `structuredClone`, which strips an Error's
// subclass, so an `instanceof` check outside never matches. Same pattern as
// `callAuth` in ./auth-flows.ts.
async function tryCreatePixCheckout(userId: string, plan: (typeof planIds)[number]): Promise<PixCheckoutResult> {
	try {
		const charge = await paymentService.createPixCheckout(userId, plan);
		return { ok: true, charge };
	} catch (error) {
		if (error instanceof AbacatePayNotConfiguredError) return { ok: false };
		throw error;
	}
}

async function offerPixCheckout(
	conversation: BotConversation,
	ctx: Context,
	userId: string,
	plan: (typeof planIds)[number],
): Promise<boolean> {
	const result = await conversation.external(() => tryCreatePixCheckout(userId, plan));
	if (!result.ok) {
		await ctx.reply(`Bot checkout is unavailable right now — subscribe at ${apiEnv.FRONTEND_URL}/checkout.`);
		return false;
	}
	const charge = result.charge;

	const qrBuffer = await conversation.external(() => Buffer.from(charge.brCodeBase64, "base64"));
	await ctx.replyWithPhoto(new InputFile(qrBuffer, "pix.png"), {
		caption: "Scan the QR code above or copy the PIX code below:",
	});
	await ctx.reply(`<code>${charge.brCode}</code>`, { parse_mode: "HTML" });

	const testMode = apiEnv.ABACATEPAY_PIX_TEST_MODE;
	const keyboard = new InlineKeyboard().text("🔄 Check payment", "pix:check").row();
	if (testMode) keyboard.text("🧪 Pagar PIX Teste Mode", "pix:simulate").row();
	keyboard.text("❌ Cancelar", "pix:cancel");

	await ctx.reply("Waiting for payment...", { reply_markup: keyboard });

	for (;;) {
		const action = await conversation.waitFor("callback_query:data", {
			otherwise: (otherCtx) => otherCtx.answerCallbackQuery(),
		});
		const data = action.callbackQuery.data;
		await action.answerCallbackQuery();

		if (data === "pix:cancel") {
			await action.reply("Operation cancelled.");
			return false;
		}

		if (data === "pix:simulate" && testMode) {
			await action.reply("This PIX will be paid in 10 seconds...");
			// @grammyjs/conversations v2 has no `conversation.sleep()` —
			// `external()` runs the timeout once on the real execution (never
			// on replay), the replay-safe way to wait inside a conversation.
			await conversation.external(() => new Promise<void>((resolve) => setTimeout(resolve, 10_000)));
			await conversation.external(() => paymentService.simulateCheckout(userId, charge.id));
		}

		if (data === "pix:check" || data === "pix:simulate") {
			const status = await conversation.external(() => paymentService.getCheckoutStatus(userId, charge.id));

			if (status.status === "paid") {
				const expiresAt = status.planExpiresAt ? formatDate(status.planExpiresAt) : "—";
				await action.reply(`✅ Payment successful! You are on the PRO plan until ${expiresAt}.`);
				return true;
			}

			if (status.status === "expired") {
				await action.reply("This PIX expired. Choose a plan again to generate a new code.");
				return false;
			}

			await action.reply("Still waiting for payment...");
		}
	}
}
