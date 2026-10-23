import type { AppFailure } from "../../failures";
import type { UserProfile, UserProfilePatch } from "../../ports/user-profile";
import type { Result } from "../../result";
import type { IdentityDeps } from "./identity-deps";

export async function updateUserProfile(
	deps: IdentityDeps,
	userId: string,
	patch: UserProfilePatch,
): Promise<Result<UserProfile, AppFailure>> {
	return deps.profiles.updateProfile(userId, patch);
}
