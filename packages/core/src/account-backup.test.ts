import { describe, expect, test } from "bun:test";
import { buildAccountExport, parseAccountExport } from "./account-backup";

const sample = [
	{
		description: "Salary",
		amount: 420000,
		category: "salary",
		type: "income" as const,
		date: "2026-10-01T00:00:00.000Z",
	},
	{
		description: "Lunch",
		amount: 3500,
		category: "food",
		type: "expense" as const,
		date: "2026-10-02T12:00:00.000Z",
	},
];

describe("account export", () => {
	test("round-trips through JSON", () => {
		const file = buildAccountExport({ name: "Ada", email: "ada@example.com" }, sample);
		const parsed = parseAccountExport(JSON.parse(JSON.stringify(file)));
		expect(parsed.ok && parsed.value.transactions).toEqual(sample);
	});

	test("rejects foreign files and bad rows", () => {
		expect(parseAccountExport({ format: "other" }).ok).toBe(false);
		const bad = { ...buildAccountExport({}, sample), transactions: [{ ...sample[0], amount: 1.5 }] };
		const parsed = parseAccountExport(bad);
		expect(!parsed.ok && parsed.error).toContain("transactions[0].amount");
	});
});
