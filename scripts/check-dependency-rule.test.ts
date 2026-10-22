import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { checkCoreTree, findForbiddenImports } from "./check-dependency-rule";

const FIXTURE = join(import.meta.dir, ".tmp-dep-rule-fixture");

afterEach(() => {
	rmSync(FIXTURE, { recursive: true, force: true });
});

describe("check-dependency-rule", () => {
	test("allows clean core-style imports", () => {
		expect(findForbiddenImports(`import { ok } from "./result";\nexport type { Result } from "./result";`)).toEqual(
			[],
		);
	});

	test("flags elysia import in a source string", () => {
		expect(findForbiddenImports(`import { Elysia } from "elysia";`)).toContain("elysia");
	});

	test("flags react and prisma package imports", () => {
		expect(findForbiddenImports(`import React from "react";`)).toContain("react");
		expect(findForbiddenImports(`import { PrismaClient } from "@prisma/client";`)).toContain("@prisma/client");
	});

	test("temp tree with elysia import fails the directory scan", () => {
		mkdirSync(FIXTURE, { recursive: true });
		writeFileSync(join(FIXTURE, "bad.ts"), `import { Elysia } from "elysia";\n`);
		writeFileSync(join(FIXTURE, "ok.ts"), `export const x = 1;\n`);
		const offenders = checkCoreTree(FIXTURE);
		expect(offenders.some((row) => row.imports.includes("elysia"))).toBe(true);
	});

	test("real packages/core tree is clean", () => {
		expect(checkCoreTree()).toEqual([]);
	});
});
