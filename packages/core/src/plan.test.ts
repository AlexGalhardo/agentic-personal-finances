import { describe, expect, test } from "bun:test";
import { FREE_TRANSACTION_LIMIT, hasActivePlan, transactionAllowance } from "./plan";

const day = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-22T12:00:00.000Z");

describe("plan", () => {
	test("treats an active plan with a future (or no) expiry as active", () => {
		expect(hasActivePlan({ plan: "active", planExpiresAt: new Date(now.getTime() + day) }, now)).toBe(true);
		expect(hasActivePlan({ plan: "active", planExpiresAt: null }, now)).toBe(true);
	});

	test("treats an expired or inactive plan as inactive", () => {
		expect(hasActivePlan({ plan: "active", planExpiresAt: new Date(now.getTime() - day) }, now)).toBe(false);
		expect(hasActivePlan({ plan: "inactive", planExpiresAt: null }, now)).toBe(false);
	});

	test("gives free users the remaining free allowance, never negative", () => {
		const free = { plan: "inactive", planExpiresAt: null };
		expect(transactionAllowance({ ...free, transactionCount: 3 }, now)).toBe(FREE_TRANSACTION_LIMIT - 3);
		expect(transactionAllowance({ ...free, transactionCount: 99 }, now)).toBe(0);
	});

	test("gives users on an active plan an unbounded allowance", () => {
		expect(transactionAllowance({ plan: "active", planExpiresAt: null, transactionCount: 99 }, now)).toBe(
			Number.POSITIVE_INFINITY,
		);
	});
});
