import { describe, expect, it } from "bun:test";
import { translateAuthError } from "./auth-errors";

describe("translateAuthError", () => {
	it("translates a known better-auth code to English", () => {
		expect(translateAuthError("INVALID_PASSWORD", "fallback")).toBe("Incorrect password");
		expect(translateAuthError("INVALID_EMAIL_OR_PASSWORD", "fallback")).toBe("Incorrect email and/or password");
		expect(translateAuthError("USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL", "fallback")).toBe(
			"An account with this email already exists — use another email",
		);
	});

	it("falls back to the caller-provided message for an unmapped code", () => {
		expect(translateAuthError("SOME_FUTURE_CODE", "default message")).toBe("default message");
	});

	it("falls back when no code is given", () => {
		expect(translateAuthError(undefined, "default message")).toBe("default message");
		expect(translateAuthError(null, "default message")).toBe("default message");
	});
});
