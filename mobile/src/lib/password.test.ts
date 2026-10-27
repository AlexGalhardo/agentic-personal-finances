import { hashPassword, validateSignUp, verifyPassword } from "./password";

jest.mock("expo-crypto", () => ({
	getRandomBytes: (length: number) => Uint8Array.from({ length }, (_, i) => (i * 7 + 3) % 256),
}));

describe("password hashing", () => {
	it("verifies the right password and rejects a wrong one", async () => {
		const stored = await hashPassword("correct horse");
		expect(await verifyPassword("correct horse", stored)).toBe(true);
		expect(await verifyPassword("correct horsf", stored)).toBe(false);
	});

	it("never stores the plain password", async () => {
		const stored = await hashPassword("correct horse");
		expect(JSON.stringify(stored)).not.toContain("correct horse");
	});
});

describe("validateSignUp", () => {
	const valid = { name: "Ana", email: "ana@example.com", password: "longenough", confirm: "longenough" };

	it("accepts valid input", () => {
		expect(validateSignUp(valid)).toEqual({});
	});

	it("flags every invalid field", () => {
		const errors = validateSignUp({ name: "A", email: "nope", password: "short", confirm: "other" });
		expect(Object.keys(errors).sort()).toEqual(["confirm", "email", "name", "password"]);
	});
});
