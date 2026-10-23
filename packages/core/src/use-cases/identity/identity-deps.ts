import type { Clock } from "../../ports/clock";
import type { UserProfileStore } from "../../ports/user-profile";

export type IdentityDeps = {
	readonly profiles: UserProfileStore;
	readonly clock: Clock;
	readonly accountDeletionGraceDays: number;
};
