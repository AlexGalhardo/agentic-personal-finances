import { createHash, randomBytes } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";

const assetRoot = join(import.meta.dir, "assets");
const dataDir = join(process.cwd(), ".standalone-data");

function resolveTemplateDbPath(): string {
	// Prefer the `.standalone/` sidecar next to the binary (reliable on Windows).
	// Embedded Bun virtual paths from `--asset` are not always copyable via fs.
	const candidates = [
		join(process.cwd(), ".standalone", "template.db"),
		join(dirname(process.execPath), ".standalone", "template.db"),
		join(assetRoot, "template.db"),
	];
	for (const path of candidates) {
		if (existsSync(path)) return path;
	}
	throw new Error(
		`Missing SQLite template DB. Tried: ${candidates.join(", ")}. Rebuild with bun run build:standalone.`,
	);
}

const standaloneEnvSchema = z.object({
	NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
	PORT: z.coerce.number().int().positive().default(8787),
	STANDALONE_URL: z.url().optional(),
	DATABASE_PROVIDER: z.literal("sqlite").default("sqlite"),
	DATABASE_URL: z.string().min(1).optional(),
	BETTER_AUTH_SECRET: z.string().min(32).optional(),
	ENCRYPTION_KEY: z
		.string()
		.regex(/^[0-9a-f]{64}$/i, "ENCRYPTION_KEY must be 64 hex characters")
		.optional(),
	ENABLE_CONFIRM_EMAIL: z.enum(["true", "false"]).default("false"),
	ENABLE_2FA: z.enum(["true", "false"]).default("false"),
	ENABLE_ABACATEPAY: z.enum(["true", "false"]).default("false"),
	ABACATEPAY_PIX_TEST_MODE: z.enum(["true", "false"]).default("false"),
});

function ensureDataDir(): void {
	mkdirSync(dataDir, { recursive: true });
}

function readOrCreateSecret(fileName: string, bytes: number): string {
	const path = join(dataDir, fileName);
	if (existsSync(path)) {
		return readFileSync(path, "utf8").trim();
	}
	const value = randomBytes(bytes).toString("hex");
	writeFileSync(path, value, "utf8");
	return value;
}

function ensureSqliteFile(dbFile: string): void {
	if (existsSync(dbFile)) return;
	copyFileSync(resolveTemplateDbPath(), dbFile);
}

/** Mutates process.env with validated standalone defaults, then returns them. */
export function bootstrapStandaloneEnv(): {
	port: number;
	origin: string;
	dataDir: string;
	assetRoot: string;
	dbFingerprint: string;
} {
	ensureDataDir();
	const dbFile = join(dataDir, "app.db");
	ensureSqliteFile(dbFile);

	const raw = Object.fromEntries(
		Object.entries(Bun.env).map(([key, value]) => [key, value === "" ? undefined : value]),
	);
	const parsed = standaloneEnvSchema.safeParse(raw);
	if (!parsed.success) {
		console.error("Invalid standalone environment:");
		console.error(z.treeifyError(parsed.error));
		throw new Error("Failed to load standalone env.");
	}

	const port = parsed.data.PORT;
	const origin = parsed.data.STANDALONE_URL ?? `http://localhost:${port}`;
	const dbPath = dbFile.replaceAll("\\", "/");
	const databaseUrl = parsed.data.DATABASE_URL ?? `file:${dbPath}`;
	const betterAuthSecret = parsed.data.BETTER_AUTH_SECRET ?? readOrCreateSecret("better-auth.secret", 32);
	const encryptionKey = parsed.data.ENCRYPTION_KEY ?? readOrCreateSecret("encryption.key", 32);

	// Re-validate after filling defaults — backend/src/config/env.ts will also
	// parse Bun.env on import.
	const applied = standaloneEnvSchema
		.extend({
			DATABASE_URL: z.string().min(1),
			BETTER_AUTH_SECRET: z.string().min(32),
			ENCRYPTION_KEY: z.string().regex(/^[0-9a-f]{64}$/i),
			APP_URL: z.url(),
			FRONTEND_URL: z.url(),
		})
		.parse({
			...parsed.data,
			DATABASE_URL: databaseUrl,
			BETTER_AUTH_SECRET: betterAuthSecret,
			ENCRYPTION_KEY: encryptionKey,
			APP_URL: origin,
			FRONTEND_URL: origin,
		});

	process.env.NODE_ENV = applied.NODE_ENV;
	process.env.PORT = String(applied.PORT);
	process.env.APP_URL = applied.APP_URL;
	process.env.FRONTEND_URL = applied.FRONTEND_URL;
	process.env.DATABASE_PROVIDER = applied.DATABASE_PROVIDER;
	process.env.DATABASE_URL = applied.DATABASE_URL;
	process.env.BETTER_AUTH_SECRET = applied.BETTER_AUTH_SECRET;
	process.env.ENCRYPTION_KEY = applied.ENCRYPTION_KEY;
	process.env.ENABLE_CONFIRM_EMAIL = applied.ENABLE_CONFIRM_EMAIL;
	process.env.ENABLE_2FA = applied.ENABLE_2FA;
	process.env.ENABLE_ABACATEPAY = applied.ENABLE_ABACATEPAY;
	process.env.ABACATEPAY_PIX_TEST_MODE = applied.ABACATEPAY_PIX_TEST_MODE;

	return {
		port: applied.PORT,
		origin: applied.APP_URL,
		dataDir,
		assetRoot,
		dbFingerprint: createHash("sha256").update(applied.DATABASE_URL).digest("hex").slice(0, 8),
	};
}

export { assetRoot, dataDir };
