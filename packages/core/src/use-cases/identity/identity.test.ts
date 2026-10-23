import { describe, expect, test } from "bun:test";
import { failure } from "../../failures";
import type { Clock } from "../../ports/clock";
import type { UserProfile, UserProfileStore } from "../../ports/user-profile";
import { err, isErr, isOk, ok } from "../../result";
import type { IdentityDeps } from "./identity-deps";
import { requestAccountDeletion } from "./request-account-deletion";

const USER = "22222222-2222-4222-8222-222222222222";
const NOW = new Date("2026-10-22T12:00:00.000Z");

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
	return {
		id: USER,
		name: "Test",
		email: "test@example.com",
		emailVerified: true,
		image: null,
		twoFactorEnabled: false,
		plan: "inactive",
		planExpiresAt: null,
		freeTransactionCount: 0,
		telegramChatId: null,
		deletionRequestedAt: null,
		createdAt: NOW,
		...overrides,
	};
}

function buildDeps(initial: UserProfile): { deps: IdentityDeps; getProfile: () => UserProfile } {
	let row = { ...initial };
	const store: UserProfileStore = {
		async getById(userId) {
			if (userId !== row.id) return err(failure("not_found", "User not found"));
			return ok(row);
		},
		async updateProfile(userId, patch) {
			if (userId !== row.id) return err(failure("not_found", "User not found"));
			row = { ...row, ...patch };
			return ok(row);
		},
		async setTelegramChatId(userId, chatId) {
			if (userId !== row.id) return err(failure("not_found", "User not found"));
			row = { ...row, telegramChatId: chatId };
			return ok(undefined);
		},
		async findByTelegramChatId(chatId) {
			return ok(row.telegramChatId === chatId ? row : null);
		},
		async requestDeletion(userId, at) {
			if (userId !== row.id) return err(failure("not_found", "User not found"));
			row = { ...row, deletionRequestedAt: at };
			return ok(undefined);
		},
		async purgeDeletionsRequestedBefore(_cutoff) {
			return ok(0);
		},
	};

	const clock: Clock = { now: () => NOW };

	return {
		deps: { profiles: store, clock, accountDeletionGraceDays: 30 },
		getProfile: () => row,
	};
}

describe("identity use cases", () => {
	test("AC-1 requestAccountDeletion with active plan returns conflict", async () => {
		const { deps } = buildDeps(profile({ plan: "active", planExpiresAt: new Date(NOW.getTime() + 86_400_000) }));
		const result = await requestAccountDeletion(deps, USER);
		expect(isErr(result)).toBe(true);
		if (isErr(result)) expect(result.error.code).toBe("conflict");
	});

	test("requestAccountDeletion marks deletion when no active plan", async () => {
		const { deps, getProfile } = buildDeps(profile());
		const result = await requestAccountDeletion(deps, USER);
		expect(isOk(result)).toBe(true);
		expect(getProfile().deletionRequestedAt).toEqual(NOW);
	});
});
