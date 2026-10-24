import { env as apiEnv } from "@agentic-personal-finances/backend/src/config/env";
import { auth } from "@agentic-personal-finances/backend/src/lib/auth";
import { userRepository } from "@agentic-personal-finances/backend/src/modules/users/user.repository";
import { APIError } from "better-auth";
import type { Context } from "grammy";
import { InlineKeyboard } from "grammy";
import { z } from "zod";
import { botCreateLinkToken, botFindUserIdByChatId, botLinkChatToUser } from "../adapters/identity-telegram";
import type { BotConversation } from "../types";
import { translateAuthError } from "./auth-errors";
import { createLockout, remainingMinutes } from "./lockout";
import { failingPasswordRules, PASSWORD_RULES } from "./password-rules";

// The bot calls `auth.api.*` in-process, which bypasses better-auth's HTTP
// rate limiter — without this, a chat could brute-force passwords.
export const loginLockout = createLockout({ maxAttempts: 5, lockoutMinutes: 15 });

const emailSchema = z.email();

function authMenuKeyboard(): InlineKeyboard {
	return new InlineKeyboard()
		.text("🔑 Sign in with email and password", "authmenu:login")
		.row()
		.text("🆕 Create account", "authmenu:signup")
		.row()
		.text("🌐 Sign in through the browser (Google or email)", "authmenu:web")
		.row()
		.text("❓ Forgot my password", "authmenu:forgot");
}

function capitalizeFirstLetter(value: string): string {
	return value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);
}

/** Asks for text and repeats until `validate` returns `null` (valid). */
async function promptText(
	conversation: BotConversation,
	ctx: Context,
	promptMessage: string,
	validate: (text: string) => string | null,
): Promise<string> {
	await ctx.reply(promptMessage, { parse_mode: "Markdown" });

	for (;;) {
		const replyCtx = await conversation.waitFor("message:text", {
			otherwise: (otherCtx) => otherCtx.reply("Reply with text:"),
		});
		const text = replyCtx.message.text.trim();
		const error = validate(text);
		if (error) {
			await replyCtx.reply(`${error} Try again:`);
			continue;
		}
		return text;
	}
}

/** Like `promptText`, but deletes every typed message — the answer is a password. */
async function promptPassword(
	conversation: BotConversation,
	ctx: Context,
	promptMessage: string,
	validate: (text: string) => string | null,
): Promise<string> {
	await ctx.reply(promptMessage);

	for (;;) {
		const replyCtx = await conversation.waitFor("message:text", {
			otherwise: (otherCtx) => otherCtx.reply("Type your password as plain text:"),
		});
		const text = replyCtx.message.text.trim();
		await replyCtx.deleteMessage().catch(() => undefined);

		const error = validate(text);
		if (error) {
			await replyCtx.reply(`${error} Try again:`);
			continue;
		}
		return text;
	}
}

type AuthResult<T> = { ok: true; data: T } | { ok: false; code?: string };

/**
 * Runs a better-auth call and returns a plain, serializable result. It must
 * not throw across `conversation.external()`: @grammyjs/conversations clones
 * results with `structuredClone`, which strips an Error's subclass, so an
 * `instanceof APIError` check after `external()` would never match.
 */
async function callAuth<T>(fn: () => Promise<T>): Promise<AuthResult<T>> {
	try {
		return { ok: true, data: await fn() };
	} catch (error) {
		if (error instanceof APIError) {
			return { ok: false, code: typeof error.body?.code === "string" ? error.body.code : undefined };
		}
		throw error;
	}
}

type LoginAttempt =
	| { outcome: "locked"; minutes: number }
	| { outcome: "failed"; code?: string }
	| { outcome: "two-factor" }
	| { outcome: "ok"; userId: string; name: string };

async function attemptLogin(chatId: number, email: string, password: string): Promise<LoginAttempt> {
	const lock = loginLockout.check(chatId);
	if (lock.locked) return { outcome: "locked", minutes: remainingMinutes(lock) };

	const result = await callAuth(() => auth.api.signInEmail({ body: { email, password } }));
	if (!result.ok) {
		const status = loginLockout.recordFailure(chatId);
		return status.locked
			? { outcome: "locked", minutes: remainingMinutes(status) }
			: { outcome: "failed", code: result.code };
	}

	loginLockout.recordSuccess(chatId);
	if ("twoFactorRedirect" in result.data && result.data.twoFactorRedirect) return { outcome: "two-factor" };
	if (!("user" in result.data)) return { outcome: "failed" };

	await botLinkChatToUser(chatId, result.data.user.id);
	return { outcome: "ok", userId: result.data.user.id, name: result.data.user.name };
}

async function handleLogin(conversation: BotConversation, ctx: Context, chatId: number): Promise<string | null> {
	const email = await promptText(conversation, ctx, "Enter your *email*:", (text) =>
		emailSchema.safeParse(text).success ? null : "Invalid email.",
	);
	const password = await promptPassword(conversation, ctx, "🔒 Enter your password:", () => null);

	const attempt = await conversation.external(() => attemptLogin(chatId, email, password));

	switch (attempt.outcome) {
		case "locked":
			await ctx.reply(`🚫 Too many incorrect attempts. Try again in ${attempt.minutes} min.`);
			return null;
		case "failed":
			if (attempt.code === "EMAIL_NOT_VERIFIED") {
				await ctx.reply("📧 Your email is not verified yet. Check your inbox before signing in.");
				return null;
			}
			await ctx.reply(`❌ ${translateAuthError(attempt.code, "Incorrect email and/or password")}`);
			return null;
		case "two-factor":
			await ctx.reply(
				"🔐 Your account has two-factor authentication. Use 'Sign in via browser' to link this chat.",
			);
			return null;
		case "ok":
			await ctx.reply(`✅ Account linked! Hello, ${attempt.name}.`);
			return attempt.userId;
	}
}

async function handleSignup(conversation: BotConversation, ctx: Context, chatId: number): Promise<string | null> {
	const rawName = await promptText(
		conversation,
		ctx,
		"What should we call you? Enter your *name* (4 to 16 letters):",
		(text) => {
			if (text.length < 4) return "Name too short (minimum 4 characters).";
			if (text.length > 16) return "Name too long (maximum 16 characters).";
			return null;
		},
	);
	const name = capitalizeFirstLetter(rawName);

	const email = await promptText(conversation, ctx, "Enter your *email*:", (text) => {
		if (text.length > 48) return "Email too long (maximum 48 characters).";
		return emailSchema.safeParse(text).success ? null : "Invalid email.";
	});

	await ctx.reply(
		["Now create a strong password with:", ...PASSWORD_RULES.map((rule) => `• ${rule.label}`)].join("\n"),
	);
	const password = await promptPassword(conversation, ctx, "Enter your password:", (text) => {
		const failing = failingPasswordRules(text);
		return failing.length === 0 ? null : `Still missing: ${failing.join(", ")}.`;
	});

	const result = await conversation.external(() =>
		callAuth(() => auth.api.signUpEmail({ body: { name, email, password } })),
	);

	if (!result.ok) {
		await ctx.reply(`❌ ${translateAuthError(result.code, "Could not create your account")}`);
		return null;
	}

	if (result.data.token === null) {
		await ctx.reply(
			"📧 Almost there! We sent a confirmation link to your email. Confirm it, then come back and choose 'Sign in with email and password'.",
		);
		return null;
	}

	const userId = result.data.user.id;
	await conversation.external(() => botLinkChatToUser(chatId, userId));
	await ctx.reply(`✅ Account created and linked! Welcome, ${result.data.user.name}.`);
	return userId;
}

async function handleForgotPassword(conversation: BotConversation, ctx: Context): Promise<null> {
	const email = await promptText(
		conversation,
		ctx,
		"Enter the *email* for your account to receive the reset link:",
		(text) => (emailSchema.safeParse(text).success ? null : "Invalid email."),
	);

	await conversation.external(() =>
		callAuth(() =>
			auth.api.requestPasswordReset({ body: { email, redirectTo: `${apiEnv.FRONTEND_URL}/resetar-senha` } }),
		),
	);

	await ctx.reply(
		"📧 If that email is registered, we sent a password reset link. Open it in the browser, set a new password, then come back and choose 'Sign in with email and password'.",
	);
	return null;
}

/** Links through the browser: works for Google and for accounts with 2FA. */
async function handleWebLink(conversation: BotConversation, ctx: Context, chatId: number): Promise<string | null> {
	const { url } = await conversation.external(async () => {
		const { token } = await botCreateLinkToken(chatId);
		return { url: `${apiEnv.FRONTEND_URL}/telegram-vincular?token=${encodeURIComponent(token)}` };
	});

	const keyboard = new InlineKeyboard()
		.url("🌐 Open in browser", url)
		.row()
		.text("🔄 I signed in, verify link", "weblink:check")
		.row()
		.text("❌ Cancel", "weblink:cancel");

	await ctx.reply(
		"Tap the button below to sign in via browser (Google or email and password). The link is valid for 15 minutes. Then return here and tap *I signed in, verify link*.",
		{ parse_mode: "Markdown", reply_markup: keyboard },
	);

	for (;;) {
		const action = await conversation.waitFor("callback_query:data", {
			otherwise: (otherCtx) => otherCtx.reply("Use the buttons above."),
		});
		const data = action.callbackQuery.data;
		await action.answerCallbackQuery();

		if (data === "weblink:cancel") {
			await action.reply("Operation cancelled.");
			return null;
		}

		if (data === "weblink:check") {
			const linked = await conversation.external(async () => {
				const userId = await botFindUserIdByChatId(chatId);
				const user = userId ? await userRepository.findById(userId) : null;
				return user ? { userId: user.id, name: user.name } : null;
			});
			if (!linked) {
				await action.reply("Link not found yet. Finish signing in in the browser and tap verify again.");
				continue;
			}
			await action.reply(`✅ Account linked! Hello, ${linked.name}.`);
			return linked.userId;
		}
	}
}

const AUTH_MENU_HANDLERS: Record<
	string,
	(conversation: BotConversation, ctx: Context, chatId: number) => Promise<string | null>
> = {
	login: handleLogin,
	signup: handleSignup,
	web: handleWebLink,
	forgot: (conversation, ctx) => handleForgotPassword(conversation, ctx),
};

/**
 * Shows the access menu (login, sign up, browser login, forgot password)
 * until one option links an account to this chat. Every path proves control
 * of the account — never link from an identifier the user merely types.
 * Reuses better-auth in-process (the bot imports `auth` from the backend
 * workspace, no HTTP).
 */
export async function ensureLinked(conversation: BotConversation, ctx: Context): Promise<string | null> {
	const chatId = ctx.chat?.id;
	if (chatId === undefined) return null;

	const linkedUserId = await conversation.external(() => botFindUserIdByChatId(chatId));
	if (linkedUserId) return linkedUserId;

	for (;;) {
		await ctx.reply("👋 To get started, choose how you want to access your account:", {
			reply_markup: authMenuKeyboard(),
		});

		const choice = await conversation.waitFor("callback_query:data", {
			otherwise: (otherCtx) => otherCtx.reply("Tap one of the options above."),
		});
		await choice.answerCallbackQuery();

		const handler = AUTH_MENU_HANDLERS[choice.callbackQuery.data.replace(/^authmenu:/, "")];
		const userId = handler ? await handler(conversation, choice, chatId) : null;

		if (userId) return userId;
	}
}
