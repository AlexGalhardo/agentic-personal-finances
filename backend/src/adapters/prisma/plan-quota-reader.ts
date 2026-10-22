import { ok, type PlanQuotaReader } from "@agentic-personal-finances/core";
import { userRepository } from "../../modules/users/user.repository";

export function createPrismaPlanQuotaReader(): PlanQuotaReader {
	return {
		async getQuota(userId) {
			const quota = await userRepository.findPlanQuota(userId);
			return ok({
				plan: quota.planStatus,
				planExpiresAt: quota.planExpiresAt,
				transactionCount: quota.freeTransactionCount,
			});
		},

		async recordCreated(userId, by = 1) {
			await userRepository.incrementFreeTransactionCount(userId, by);
			return ok(undefined);
		},
	};
}
