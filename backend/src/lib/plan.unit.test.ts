import { afterEach, describe, expect, it } from "bun:test";
import { env } from "../config/env";
import { FREE_TRANSACTION_LIMIT, hasActivePlan, transactionAllowance } from "./plan";

const day = 24 * 60 * 60 * 1000;

describe("plan", () => {
	it("treats an active plan with a future (or no) expiry as active", () => {
		expect(hasActivePlan({ planStatus: "active", planExpiresAt: new Date(Date.now() + day) })).toBe(true);
		expect(hasActivePlan({ planStatus: "active", planExpiresAt: null })).toBe(true);
	});

	it("treats an expired or inactive plan as inactive", () => {
		expect(hasActivePlan({ planStatus: "active", planExpiresAt: new Date(Date.now() - day) })).toBe(false);
		expect(hasActivePlan({ planStatus: "inactive", planExpiresAt: null })).toBe(false);
	});

	it("gives free users the remaining free allowance, never negative", () => {
		const free = { planStatus: "inactive", planExpiresAt: null };
		expect(transactionAllowance({ ...free, freeTransactionCount: 3 })).toBe(FREE_TRANSACTION_LIMIT - 3);
		expect(transactionAllowance({ ...free, freeTransactionCount: 99 })).toBe(0);
	});

	it("gives users on an active plan an unbounded allowance", () => {
		expect(transactionAllowance({ planStatus: "active", planExpiresAt: null, freeTransactionCount: 99 })).toBe(
			Number.POSITIVE_INFINITY,
		);
	});

	describe("with the paywall disabled", () => {
		afterEach(() => {
			env.ENABLE_PAYWALL = true;
		});

		it("treats every user as subscribed with an unbounded allowance", () => {
			env.ENABLE_PAYWALL = false;
			const free = { planStatus: "inactive", planExpiresAt: null, freeTransactionCount: 99 };
			expect(hasActivePlan(free)).toBe(true);
			expect(transactionAllowance(free)).toBe(Number.POSITIVE_INFINITY);
		});
	});
});
