import type { AppFailure } from "../failures";
import type { Result } from "../result";

export type UserProfile = {
	readonly id: string;
	readonly name: string;
	readonly email: string;
	readonly emailVerified: boolean;
	readonly image: string | null;
	readonly twoFactorEnabled: boolean;
	readonly plan: string;
	readonly planExpiresAt: Date | null;
	readonly freeTransactionCount: number;
	readonly telegramChatId: string | null;
	readonly deletionRequestedAt: Date | null;
	readonly createdAt: Date;
};

export type UserProfilePatch = {
	readonly name?: string;
	readonly image?: string;
};

export interface UserProfileStore {
	getById(userId: string): Promise<Result<UserProfile, AppFailure>>;
	updateProfile(userId: string, patch: UserProfilePatch): Promise<Result<UserProfile, AppFailure>>;
	setTelegramChatId(userId: string, chatId: string | null): Promise<Result<void, AppFailure>>;
	findByTelegramChatId(chatId: string): Promise<Result<UserProfile | null, AppFailure>>;
	requestDeletion(userId: string, at: Date): Promise<Result<void, AppFailure>>;
	purgeDeletionsRequestedBefore(cutoff: Date): Promise<Result<number, AppFailure>>;
}
