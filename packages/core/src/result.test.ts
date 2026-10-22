import { describe, expect, test } from "bun:test";
import { failure } from "./failures";
import { err, isErr, isOk, map, mapErr, ok } from "./result";

describe("Result", () => {
	test("ok wraps a value", () => {
		const r = ok(1);
		expect(isOk(r)).toBe(true);
		expect(isErr(r)).toBe(false);
		if (isOk(r)) expect(r.value).toBe(1);
	});

	test("err wraps a failure", () => {
		const r = err(failure("not_found", "missing"));
		expect(isErr(r)).toBe(true);
		expect(isOk(r)).toBe(false);
		if (isErr(r)) expect(r.error.code).toBe("not_found");
	});

	test("map transforms Ok and leaves Err", () => {
		expect(map(ok(2), (n) => n * 3)).toEqual(ok(6));
		const failureResult = err(failure("failed", "x"));
		expect(map(failureResult, (n: number) => n * 3)).toBe(failureResult);
	});

	test("mapErr transforms Err and leaves Ok", () => {
		const okResult = ok("keep");
		expect(mapErr(okResult, () => failure("failed", "nope"))).toBe(okResult);
		const mapped = mapErr(err(failure("not_found", "a")), (e) => failure("failed", e.message));
		expect(isErr(mapped)).toBe(true);
		if (isErr(mapped)) expect(mapped.error.code).toBe("failed");
	});
});
