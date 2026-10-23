import { type AppFailure, failure } from "../../failures";
import { hasActivePlan } from "../../plan";
import { err, ok, type Result } from "../../result";
import type { IdentityDeps } from "./identity-deps";

export async function requestAccountDeletion(
	deps: IdentityDeps,
	userId: string,
): Promise<Result<{ deletionRequestedAt: Date }, AppFailure>> {
	const profile = await deps.profiles.getById(userId);
	if (!profile.ok) return profile;

	const now = deps.clock.now();
	if (hasActivePlan({ plan: profile.value.plan, planExpiresAt: profile.value.planExpiresAt }, now)) {
		return err(
			failure(
				"conflict",
				"Cannot delete the account while an active plan exists. Cancel the plan before continuing.",
			),
		);
	}

	const marked = await deps.profiles.requestDeletion(userId, now);
	if (!marked.ok) return marked;

	return ok({ deletionRequestedAt: now });
}
