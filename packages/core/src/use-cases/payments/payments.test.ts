import { describe, expect, test } from "bun:test";
import { failure } from "../../failures";
import { computePlanExpiry, isPaidRemoteStatus } from "../../plans/catalog";
import type { Clock } from "../../ports/clock";
import type { PaymentGateway, PixChargeRemote } from "../../ports/payment-gateway";
import type { ChargeRecord, PaymentStore } from "../../ports/payment-store";
import { err, isErr, isOk, ok } from "../../result";
import { activatePlanForCharge } from "./complete-charge";
import { createPixCheckout } from "./create-pix-checkout";
import { getPixCheckoutStatus } from "./get-pix-checkout-status";
import { handlePaymentWebhook } from "./handle-payment-webhook";
import type { PaymentDeps } from "./payment-deps";
import { simulatePixCheckout } from "./simulate-pix-checkout";

const USER = "22222222-2222-4222-8222-222222222222";
const NOW = new Date("2026-10-22T12:00:00.000Z");

function buildCharge(overrides: Partial<ChargeRecord> = {}): ChargeRecord {
	return {
		id: "charge-1",
		userId: USER,
		externalId: "ext-1",
		plan: "monthly",
		amount: 990,
		status: "pending",
		expiresAt: new Date(NOW.getTime() + 60_000),
		brCode: "br",
		brCodeBase64: "b64",
		...overrides,
	};
}

function buildFakes(options: { pixTestMode?: boolean; remoteStatus?: string } = {}) {
	const charges = new Map<string, ChargeRecord>();
	const logs: unknown[] = [];
	let userPlan = { planStatus: "inactive", planExpiresAt: null as Date | null };
	let remoteStatus = options.remoteStatus ?? "PENDING";
	let nextChargeId = 1;

	const gateway: PaymentGateway = {
		async createPixCharge(_input) {
			return ok({
				id: "ext-new",
				status: "PENDING",
				brCode: "00020126",
				brCodeBase64: "img",
				expiresAt: "2026-01-01T00:30:00.000Z",
			} satisfies PixChargeRemote);
		},
		async getPixChargeStatus() {
			return ok({
				id: "ext-1",
				status: remoteStatus,
				brCode: "br",
				brCodeBase64: "b64",
				expiresAt: null,
			});
		},
		async simulatePixPayment() {
			remoteStatus = "PAID";
			return ok({
				id: "ext-1",
				status: "PAID",
				brCode: "br",
				brCodeBase64: "b64",
				expiresAt: null,
			});
		},
	};

	const store: PaymentStore = {
		async createPendingCharge(input) {
			const id = `internal-${nextChargeId++}`;
			charges.set(id, {
				id,
				userId: input.userId,
				externalId: input.externalId,
				plan: input.plan,
				amount: input.amount,
				status: "pending",
				expiresAt: input.expiresAt,
				brCode: input.brCode,
				brCodeBase64: input.brCodeBase64,
			});
			return ok({ chargeId: id });
		},
		async findChargeForUser(chargeId, userId) {
			const row = charges.get(chargeId);
			if (!row || row.userId !== userId) return ok(null);
			return ok(row);
		},
		async findChargeByExternalId(externalId) {
			const row = [...charges.values()].find((c) => c.externalId === externalId) ?? null;
			return ok(row);
		},
		async findChargeById(chargeId) {
			const row = charges.get(chargeId);
			if (!row) return err(failure("not_found", "PIX charge not found"));
			return ok(row);
		},
		async setChargeStatus(chargeId, status) {
			const row = charges.get(chargeId);
			if (row) charges.set(chargeId, { ...row, status });
			return ok(undefined);
		},
		async applyPaidPlan(input) {
			userPlan = { planStatus: "active", planExpiresAt: input.planExpiresAt };
			const row = charges.get(input.chargeId);
			if (row) charges.set(input.chargeId, { ...row, status: "paid" });
			return ok(undefined);
		},
		async appendLog(input) {
			logs.push(input);
			return ok(undefined);
		},
		async listLogs() {
			return ok([]);
		},
		async getUserPlan() {
			return ok(userPlan);
		},
		async expireOverduePlans() {
			return ok(0);
		},
	};

	const clock: Clock = { now: () => NOW };

	const deps: PaymentDeps = {
		gateway,
		store,
		clock,
		pixTestMode: options.pixTestMode ?? false,
	};

	return {
		deps,
		charges,
		logs,
		setUserPlan: (p: typeof userPlan) => (userPlan = p),
		setRemoteStatus: (s: string) => (remoteStatus = s),
	};
}

describe("payment use cases", () => {
	test("AC-1 createPixCheckout persists a pending charge", async () => {
		const { deps, charges, logs } = buildFakes();
		const result = await createPixCheckout(deps, USER, "monthly");
		expect(isOk(result)).toBe(true);
		if (isOk(result)) {
			expect(charges.has(result.value.id)).toBe(true);
			expect(charges.get(result.value.id)?.status).toBe("pending");
		}
		expect(logs.length).toBe(1);
	});

	test("AC-2 webhook completed without paid remote status does not activate", async () => {
		const { deps, charges } = buildFakes({ remoteStatus: "PENDING" });
		const charge = buildCharge();
		charges.set(charge.id, charge);

		const result = await handlePaymentWebhook(deps, {
			event: "transparent.completed",
			data: { id: "ext-1" },
		});
		expect(isOk(result)).toBe(true);
		expect(charges.get(charge.id)?.status).toBe("pending");
	});

	test("AC-3 activation extends from current expiry when still active", async () => {
		const { deps, setUserPlan } = buildFakes();
		const currentExpiry = new Date("2027-01-01T00:00:00.000Z");
		setUserPlan({ planStatus: "active", planExpiresAt: currentExpiry });

		const activated = await activatePlanForCharge(deps, {
			id: "charge-1",
			userId: USER,
			plan: "monthly",
		});
		expect(isOk(activated)).toBe(true);
		if (isOk(activated)) {
			expect(activated.value.getTime()).toBe(computePlanExpiry(currentExpiry, 1).getTime());
		}
	});

	test("AC-4 simulate with pixTestMode false returns forbidden", async () => {
		const { deps } = buildFakes({ pixTestMode: false });
		const result = await simulatePixCheckout(deps, USER, "charge-1");
		expect(isErr(result)).toBe(true);
		if (isErr(result)) expect(result.error.code).toBe("forbidden");
	});

	test("getPixCheckoutStatus marks expired pending charges locally", async () => {
		const { deps, charges } = buildFakes();
		charges.set("charge-1", buildCharge({ expiresAt: new Date(NOW.getTime() - 1000) }));

		const result = await getPixCheckoutStatus(deps, USER, "charge-1");
		expect(isOk(result)).toBe(true);
		if (isOk(result)) expect(result.value.status).toBe("expired");
	});

	test("isPaidRemoteStatus aligns with gateway PAID path", () => {
		expect(isPaidRemoteStatus("PAID")).toBe(true);
	});
});
