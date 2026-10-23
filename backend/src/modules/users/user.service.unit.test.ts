import { beforeEach, describe, expect, it, mock } from "bun:test";

const identityMock = {
	getUserProfile: mock(),
	updateUserProfile: mock(),
	requestAccountDeletion: mock(),
	purgePendingAccountDeletions: mock(),
};

mock.module("@agentic-personal-finances/core", () => ({
	ACCOUNT_DELETION_GRACE_DAYS: 30,
	getUserProfile: identityMock.getUserProfile,
	updateUserProfile: identityMock.updateUserProfile,
	requestAccountDeletion: identityMock.requestAccountDeletion,
	purgePendingAccountDeletions: identityMock.purgePendingAccountDeletions,
}));

const userRepoMock = {
	findByIdOrThrow: mock(),
};

mock.module("./user.repository", () => ({ userRepository: userRepoMock }));

const { userService, ActivePlanError } = await import("./user.service");

describe("userService", () => {
	beforeEach(() => {
		for (const fn of Object.values(identityMock)) fn.mockReset();
		userRepoMock.findByIdOrThrow.mockReset();
	});

	it("requestDeletion throws ActivePlanError on conflict from core", async () => {
		identityMock.requestAccountDeletion.mockResolvedValue({
			ok: false,
			error: {
				code: "conflict",
				message: "Cannot delete the account while an active plan exists. Cancel the plan before continuing.",
			},
		});

		await expect(userService.requestDeletion("user-1")).rejects.toThrow(ActivePlanError);
	});
});
