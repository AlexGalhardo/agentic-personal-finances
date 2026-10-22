#!/usr/bin/env bun
/**
 * Enforce the Dependency Rule for packages/core: no imports from outer rings
 * (clients, frameworks). See docs/specs/H08-dependency-rule.md.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(import.meta.dir, "..");
const CORE_SRC = join(ROOT, "packages/core/src");

/** Substrings forbidden in import/require/export-from paths under packages/core. */
export const FORBIDDEN_IMPORT_SUBSTRINGS = [
	"@agent-money-boilerplate/backend",
	"@agent-money-boilerplate/bot",
	"@agent-money-boilerplate/frontend",
	"@agent-money-boilerplate/mobile",
	"@agent-money-boilerplate/desktop",
	"@agentic-personal-finances/backend",
	"elysia",
	"@prisma",
	"prisma/",
	"react-native",
	"react",
	"expo",
	"grammy",
] as const;

const IMPORT_RE = /(?:from\s+|import\s*\(|require\s*\(|export\s+[\s\w*{,}$]*?\s+from\s+)['"]([^'"]+)['"]/g;

function matchesForbidden(spec: string, needle: string): boolean {
	if (needle === "react") return spec === "react" || spec.startsWith("react/");
	return spec.includes(needle);
}

export function findForbiddenImports(source: string): string[] {
	const hits: string[] = [];
	for (const match of source.matchAll(IMPORT_RE)) {
		const spec = match[1] ?? "";
		for (const needle of FORBIDDEN_IMPORT_SUBSTRINGS) {
			if (matchesForbidden(spec, needle)) {
				hits.push(spec);
				break;
			}
		}
	}
	return hits;
}

function walkTsFiles(dir: string): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		const path = join(dir, name);
		const st = statSync(path);
		if (st.isDirectory()) out.push(...walkTsFiles(path));
		else if (name.endsWith(".ts") || name.endsWith(".tsx")) out.push(path);
	}
	return out;
}

export function checkCoreTree(coreSrc = CORE_SRC): { path: string; imports: string[] }[] {
	const offenders: { path: string; imports: string[] }[] = [];
	for (const file of walkTsFiles(coreSrc)) {
		const source = readFileSync(file, "utf8");
		const imports = findForbiddenImports(source);
		if (imports.length > 0) {
			offenders.push({ path: relative(ROOT, file).replaceAll("\\", "/"), imports });
		}
	}
	return offenders;
}

const isMain = import.meta.main;
if (isMain) {
	const offenders = checkCoreTree();
	if (offenders.length === 0) {
		console.log("Dependency Rule: packages/core is clean.");
		process.exit(0);
	}
	console.error("Dependency Rule violations in packages/core:\n");
	for (const row of offenders) {
		console.error(`  ${row.path}`);
		for (const imp of row.imports) console.error(`    → ${imp}`);
	}
	process.exit(1);
}
