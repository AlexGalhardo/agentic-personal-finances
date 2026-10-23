import type { AppFailure } from "../../failures";
import type { UserProfile } from "../../ports/user-profile";
import type { Result } from "../../result";
import type { IdentityDeps } from "./identity-deps";

export async function getUserProfile(deps: IdentityDeps, userId: string): Promise<Result<UserProfile, AppFailure>> {
	return deps.profiles.getById(userId);
}
