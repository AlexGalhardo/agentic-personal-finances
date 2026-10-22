import { describe, expect, test } from "bun:test";
import { failure, ok } from "@agentic-personal-finances/core";
import { AppError } from "../../lib/errors";
import { failureToAppError, unwrapOrThrow } from "./map-result";

describe("map-result", () => {
	test("maps AppFailure codes to HTTP statuses", () => {
		expect(failureToAppError(failure("plan_limit", "limit")).status).toBe(403);
		expect(failureToAppError(failure("not_found", "missing")).status).toBe(404);
		expect(failureToAppError(failure("invalid_input", "bad")).status).toBe(400);
		expect(failureToAppError(failure("unauthorized", "no")).status).toBe(401);
		expect(failureToAppError(failure("forbidden", "no")).status).toBe(403);
		expect(failureToAppError(failure("conflict", "dup")).status).toBe(409);
		expect(failureToAppError(failure("failed", "boom")).status).toBe(500);
	});

	test("unwrapOrThrow returns value or throws AppError", () => {
		expect(unwrapOrThrow(ok(42))).toBe(42);
		expect(() => unwrapOrThrow({ ok: false, error: failure("not_found", "gone") })).toThrow(AppError);
		try {
			unwrapOrThrow({ ok: false, error: failure("plan_limit", "full") });
		} catch (error) {
			expect(error).toBeInstanceOf(AppError);
			expect((error as AppError).status).toBe(403);
			expect((error as AppError).message).toBe("full");
		}
	});
});
