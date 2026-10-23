// Builds the root-level standalone binary (frontend + backend + SQLite).
// Output: ./agentic-personal-finances(.exe) — gitignored.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "../..");
const standaloneDir = import.meta.dir;
const assetsDir = join(standaloneDir, "assets");
const frontendAssets = join(assetsDir, "frontend");
const templateDb = join(assetsDir, "template.db");
const outfile = join(root, "agentic-personal-finances");

function run(cmd: string[], cwd = root, env?: Record<string, string>): void {
	console.log(`$ ${cmd.join(" ")}`);
	const result = Bun.spawnSync(cmd, {
		cwd,
		stdout: "inherit",
		stderr: "inherit",
		env: { ...process.env, ...env },
	});
	if (result.exitCode !== 0) {
		throw new Error(`Command failed (${result.exitCode}): ${cmd.join(" ")}`);
	}
}

rmSync(assetsDir, { recursive: true, force: true });
mkdirSync(frontendAssets, { recursive: true });

run(["bun", "run", "db:generate"], join(root, "backend"), {
	DATABASE_PROVIDER: "sqlite",
	DATABASE_URL: `file:${templateDb.replaceAll("\\", "/")}`,
});

run(["bunx", "prisma", "migrate", "deploy"], join(root, "backend"), {
	DATABASE_PROVIDER: "sqlite",
	DATABASE_URL: `file:${templateDb.replaceAll("\\", "/")}`,
});

if (!existsSync(templateDb)) {
	throw new Error(`Expected template DB at ${templateDb}`);
}

run(["bunx", "tsr", "generate"], join(root, "frontend"));
run(["bun", "run", "build"], join(root, "frontend"), {
	VITE_API_URL: "http://localhost:8787",
});

const distClient = join(root, "frontend", "dist", "client");
const distServer = join(root, "frontend", "dist", "server");
if (!existsSync(distClient) || !existsSync(distServer)) {
	throw new Error("frontend dist missing after build");
}
cpSync(distClient, join(frontendAssets, "client"), { recursive: true });
cpSync(distServer, join(frontendAssets, "server"), { recursive: true });

// Sidecar next to the binary: compiled executables cannot always read every
// embedded directory entry (esp. SQLite), so we ship frontend + template.db
// beside the exe under `.standalone/` (gitignored).
const sidecar = join(root, ".standalone");
rmSync(sidecar, { recursive: true, force: true });
mkdirSync(sidecar, { recursive: true });
cpSync(assetsDir, sidecar, { recursive: true });

console.log("Compiling standalone binary…");
run(
	["bun", "build", "--compile", "--minify", "./server.ts", "--outfile", outfile, "--asset", "./assets"],
	standaloneDir,
);

const binaryPath = process.platform === "win32" ? `${outfile}.exe` : outfile;
console.log(`\nStandalone binary: ${binaryPath}`);
console.log("Sidecar assets: .standalone/ (keep next to the binary)");
console.log("Run from the repo root (creates .standalone-data/ for SQLite + secrets).");
