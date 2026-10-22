import { describe, expect, test } from "bun:test";
import { CORE_VERSION } from "./version";

describe("CORE_VERSION", () => {
	test("is the bootstrap pin", () => {
		expect(CORE_VERSION).toBe("0.0.0");
	});
});
