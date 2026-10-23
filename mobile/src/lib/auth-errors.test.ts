import { translateAuthError } from "./auth-errors";

describe("translateAuthError", () => {
	it("translates a known better-auth code to English", () => {
		expect(translateAuthError({ code: "INVALID_PASSWORD" }, "fallback")).toBe("Incorrect password");
		expect(translateAuthError({ code: "INVALID_EMAIL_OR_PASSWORD" }, "fallback")).toBe(
			"Incorrect email and/or password",
		);
	});

	it("falls back to the caller-provided message for an unmapped code", () => {
		expect(translateAuthError({ code: "SOME_FUTURE_CODE" }, "default message")).toBe("default message");
	});

	it("falls back when there is no error or no code", () => {
		expect(translateAuthError(undefined, "default message")).toBe("default message");
		expect(translateAuthError(null, "default message")).toBe("default message");
		expect(translateAuthError({}, "default message")).toBe("default message");
	});
});
