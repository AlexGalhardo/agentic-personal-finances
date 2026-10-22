import { describe, expect, test } from "bun:test";
import { failure } from "./failures";

describe("failure", () => {
	test("builds a code + message without details", () => {
		expect(failure("invalid_input", "bad")).toEqual({
			code: "invalid_input",
			message: "bad",
		});
	});

	test("includes details when provided", () => {
		expect(failure("plan_limit", "quota", { used: 50 })).toEqual({
			code: "plan_limit",
			message: "quota",
			details: { used: 50 },
		});
	});
});
