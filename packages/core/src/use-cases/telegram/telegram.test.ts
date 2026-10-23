import { describe, expect, test } from "bun:test";
import { failure } from "../../failures";
import type { Clock } from "../../ports/clock";
import type { ConsumedLinkToken, TelegramLinkTokenStore } from "../../ports/telegram-link-token";
import type { UserProfile, UserProfileStore } from "../../ports/user-profile";
import { err, isErr, isOk, ok } from "../../result";
import { completeTelegramLink } from "./complete-telegram-link";
import { linkTelegramChat } from "./link-telegram-chat";
import type { TelegramDeps } from "./telegram-deps";

const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const CHAT = 12345;
const NOW = new Date("2026-10-22T12:00:00.000Z");

function buildProfiles(initial: UserProfile[]): UserProfileStore {
	const byId = new Map(initial.map((u) => [u.id, { ...u }]));
	return {
		async getById(userId) {
			const row = byId.get(userId);
			if (!row) return err(failure("not_found", "User not found"));
			return ok(row);
		},
		async updateProfile(userId, patch) {
			const row = byId.get(userId);
			if (!row) return err(failure("not_found", "User not found"));
			const updated = { ...row, ...patch };
			byId.set(userId, updated);
			return ok(updated);
		},
		async setTelegramChatId(userId, chatId) {
			const row = byId.get(userId);
			if (!row) return err(failure("not_found", "User not found"));
			for (const u of byId.values()) {
				if (u.telegramChatId === chatId && u.id !== userId) {
					return err(failure("conflict", "chat taken"));
				}
			}
			byId.set(userId, { ...row, telegramChatId: chatId });
			return ok(undefined);
		},
		async findByTelegramChatId(chatId) {
			const row = [...byId.values()].find((u) => u.telegramChatId === chatId) ?? null;
			return ok(row);
		},
		async requestDeletion(userId, at) {
			const row = byId.get(userId);
			if (!row) return err(failure("not_found", "User not found"));
			byId.set(userId, { ...row, deletionRequestedAt: at });
			return ok(undefined);
		},
		async purgeDeletionsRequestedBefore() {
			return ok(0);
		},
	};
}

function baseUser(id: string, chatId: string | null = null): UserProfile {
	return {
		id,
		name: "User",
		email: `${id}@example.com`,
		emailVerified: true,
		image: null,
		twoFactorEnabled: false,
		plan: "inactive",
		planExpiresAt: null,
		freeTransactionCount: 0,
		telegramChatId: chatId,
		deletionRequestedAt: null,
		createdAt: NOW,
	};
}

function buildTokenStore(initial?: ConsumedLinkToken & { token: string }) {
	const rows = new Map<string, ConsumedLinkToken>();
	if (initial) rows.set(initial.token, { chatId: initial.chatId, expiresAt: initial.expiresAt });

	const store: TelegramLinkTokenStore = {
		async create(chatId, token, expiresAt) {
			rows.set(token, { chatId, expiresAt });
			return ok(undefined);
		},
		async consume(token) {
			const row = rows.get(token);
			if (!row) return ok(null);
			rows.delete(token);
			return ok(row);
		},
	};

	return store;
}

function buildTelegramDeps(profiles: UserProfileStore, tokens: TelegramLinkTokenStore, clockNow = NOW): TelegramDeps {
	const clock: Clock = { now: () => clockNow };
	return {
		profiles,
		tokens,
		clock,
		generateToken: () => "fixed-token",
		linkTokenTtlMs: 15 * 60 * 1000,
	};
}

describe("telegram use cases", () => {
	test("AC-3 linkTelegramChat when chat owned by other user returns conflict", async () => {
		const profiles = buildProfiles([baseUser(USER_A, String(CHAT)), baseUser(USER_B, null)]);
		const deps = buildTelegramDeps(profiles, buildTokenStore());
		const result = await linkTelegramChat(deps, CHAT, USER_B);
		expect(isErr(result)).toBe(true);
		if (isErr(result)) expect(result.error.code).toBe("conflict");
	});

	test("AC-2 completeTelegramLink with expired token returns invalid_input", async () => {
		const profiles = buildProfiles([baseUser(USER_A, null)]);
		const tokens = buildTokenStore({
			token: "tok-expired",
			chatId: String(CHAT),
			expiresAt: new Date(NOW.getTime() - 1000),
		});
		const deps = buildTelegramDeps(profiles, tokens);
		const result = await completeTelegramLink(deps, USER_A, "tok-expired");
		expect(isErr(result)).toBe(true);
		if (isErr(result)) expect(result.error.code).toBe("invalid_input");
	});

	test("AC-2 completeTelegramLink with missing token returns invalid_input", async () => {
		const profiles = buildProfiles([baseUser(USER_A, null)]);
		const deps = buildTelegramDeps(profiles, buildTokenStore());
		const result = await completeTelegramLink(deps, USER_A, "missing");
		expect(isErr(result)).toBe(true);
		if (isErr(result)) expect(result.error.code).toBe("invalid_input");
	});

	test("completeTelegramLink redeems valid token and links chat", async () => {
		const profiles = buildProfiles([baseUser(USER_A, null)]);
		const tokens = buildTokenStore({
			token: "tok-ok",
			chatId: String(CHAT),
			expiresAt: new Date(NOW.getTime() + 60_000),
		});
		const deps = buildTelegramDeps(profiles, tokens);
		const result = await completeTelegramLink(deps, USER_A, "tok-ok");
		expect(isOk(result)).toBe(true);
		if (isOk(result)) expect(result.value.chatId).toBe(CHAT);
		const owner = await profiles.findByTelegramChatId(String(CHAT));
		expect(isOk(owner)).toBe(true);
		if (isOk(owner)) expect(owner.value?.id).toBe(USER_A);
	});

	test("AC-4 consume is delete-first: second complete with same token fails", async () => {
		const profiles = buildProfiles([baseUser(USER_A, null), baseUser(USER_B, null)]);
		const tokens = buildTokenStore({
			token: "once",
			chatId: String(CHAT),
			expiresAt: new Date(NOW.getTime() + 60_000),
		});
		const deps = buildTelegramDeps(profiles, tokens);
		expect(isOk(await completeTelegramLink(deps, USER_A, "once"))).toBe(true);
		const second = await completeTelegramLink(deps, USER_B, "once");
		expect(isErr(second)).toBe(true);
		if (isErr(second)) expect(second.error.code).toBe("invalid_input");
	});
});
