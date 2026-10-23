import { describe, expect, test } from "bun:test";
import { computePlanExpiry, isPaidRemoteStatus, PLAN_DEFINITIONS, planMonths } from "./catalog";

describe("plans/catalog", () => {
	test("computePlanExpiry adds calendar months", () => {
		const base = new Date("2026-01-15T12:00:00.000Z");
		const expiry = computePlanExpiry(base, 1);
		expect(expiry.getMonth()).toBe(base.getMonth() + 1);
	});

	test("planMonths falls back to 1 for unknown plan keys", () => {
		expect(planMonths("monthly")).toBe(PLAN_DEFINITIONS.monthly.months);
		expect(planMonths("unknown")).toBe(1);
	});

	test("isPaidRemoteStatus accepts PAID and COMPLETED only", () => {
		expect(isPaidRemoteStatus("PAID")).toBe(true);
		expect(isPaidRemoteStatus("COMPLETED")).toBe(true);
		expect(isPaidRemoteStatus("PENDING")).toBe(false);
	});
});
