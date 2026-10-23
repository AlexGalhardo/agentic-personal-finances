import {
	err,
	failure,
	ok,
	type UserProfile,
	type UserProfilePatch,
	type UserProfileStore,
} from "@agentic-personal-finances/core";
import type { User } from "../../../prisma/generated/client/client";
import { prisma } from "../../config/prisma";

function toProfile(user: User): UserProfile {
	return {
		id: user.id,
		name: user.name,
		email: user.email,
		emailVerified: user.emailVerified,
		image: user.image,
		twoFactorEnabled: user.twoFactorEnabled,
		plan: user.planStatus,
		planExpiresAt: user.planExpiresAt,
		freeTransactionCount: user.freeTransactionCount,
		telegramChatId: user.telegramChatId,
		deletionRequestedAt: user.deletionRequestedAt,
		createdAt: user.createdAt,
	};
}

export function createPrismaUserProfileStore(): UserProfileStore {
	return {
		async getById(userId) {
			const user = await prisma.user.findUnique({ where: { id: userId } });
			if (!user) return err(failure("not_found", "User not found"));
			return ok(toProfile(user));
		},

		async updateProfile(userId, patch: UserProfilePatch) {
			try {
				const user = await prisma.user.update({ where: { id: userId }, data: patch });
				return ok(toProfile(user));
			} catch {
				return err(failure("not_found", "User not found"));
			}
		},

		async setTelegramChatId(userId, chatId) {
			try {
				await prisma.user.update({ where: { id: userId }, data: { telegramChatId: chatId } });
				return ok(undefined);
			} catch {
				return err(failure("not_found", "User not found"));
			}
		},

		async findByTelegramChatId(chatId) {
			const user = await prisma.user.findUnique({ where: { telegramChatId: chatId } });
			return ok(user ? toProfile(user) : null);
		},

		async requestDeletion(userId, at) {
			try {
				await prisma.user.update({ where: { id: userId }, data: { deletionRequestedAt: at } });
				return ok(undefined);
			} catch {
				return err(failure("not_found", "User not found"));
			}
		},

		async purgeDeletionsRequestedBefore(cutoff) {
			const result = await prisma.user.deleteMany({ where: { deletionRequestedAt: { lte: cutoff } } });
			return ok(result.count);
		},
	};
}
