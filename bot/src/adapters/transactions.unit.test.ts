import { describe, expect, it } from "bun:test";
import { failure } from "@agentic-personal-finances/core";
import { PLAN_LIMIT_REPLY, replyForCreateFailure } from "./transactions";

describe("replyForCreateFailure", () => {
	it("returns a chat reply for plan_limit", () => {
		const mapped = replyForCreateFailure(failure("plan_limit", "core message"));
		expect(mapped).toEqual({ ok: false, reply: PLAN_LIMIT_REPLY });
	});

	it("defers not_found and other codes to AppError", () => {
		expect(replyForCreateFailure(failure("not_found", "missing"))).toBe("throw");
		expect(replyForCreateFailure(failure("invalid_input", "bad"))).toBe("throw");
	});
});
