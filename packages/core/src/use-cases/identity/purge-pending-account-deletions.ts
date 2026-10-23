import type { AppFailure } from "../../failures";
import type { Result } from "../../result";
import type { IdentityDeps } from "./identity-deps";

export async function purgePendingAccountDeletions(deps: IdentityDeps): Promise<Result<number, AppFailure>> {
	const cutoff = new Date(deps.clock.now().getTime() - deps.accountDeletionGraceDays * 24 * 60 * 60 * 1000);
	return deps.profiles.purgeDeletionsRequestedBefore(cutoff);
}
