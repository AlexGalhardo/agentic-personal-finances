import { ACCOUNT_DELETION_GRACE_DAYS, type IdentityDeps } from "@agentic-personal-finances/core";
import { systemClock } from "../../adapters/prisma/system-clock";
import { createPrismaUserProfileStore } from "../../adapters/prisma/user-profile-store";

export const identityPorts: IdentityDeps = {
	profiles: createPrismaUserProfileStore(),
	clock: systemClock,
	accountDeletionGraceDays: ACCOUNT_DELETION_GRACE_DAYS,
};
