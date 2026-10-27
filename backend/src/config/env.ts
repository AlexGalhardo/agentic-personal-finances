import { z } from "zod";

const boolFromString = z
	.enum(["true", "false"])
	.default("false")
	.transform((value) => value === "true");

// Feature flags that are ON unless explicitly turned off.
const boolDefaultTrue = z
	.enum(["true", "false"])
	.default("true")
	.transform((value) => value === "true");

const envSchema = z
	.object({
		// "local" (default): offline-first — SQLite, single user. "hosted": the
		// normal multi-user production deploy (Railway), which requires PostgreSQL.
		APP_MODE: z.enum(["local", "hosted"]).default("local"),
		NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
		PORT: z.coerce.number().int().positive().default(4000),
		APP_URL: z.url().default("http://localhost:4000"),
		FRONTEND_URL: z.url().default("http://localhost:4001"),

		DATABASE_PROVIDER: z.enum(["sqlite", "postgresql"]).default("sqlite"),
		DATABASE_URL: z.string().min(1),

		BETTER_AUTH_SECRET: z.string().min(32),

		// 32 bytes as hex (64 characters), used for AES-256-GCM.
		ENCRYPTION_KEY: z.string().regex(/^[0-9a-f]{64}$/i, "ENCRYPTION_KEY must be 64 hex characters (32 bytes)"),

		ENABLE_CONFIRM_EMAIL: boolFromString,
		ENABLE_2FA: boolFromString,
		ENABLE_ABACATEPAY: boolFromString,
		// false disables the whole paywall: no free-plan transaction limit, no
		// plan gate on the Telegram bot, payment routes answer 404 and the web
		// app hides plans/checkout. For testing and personal single-user setups.
		ENABLE_PAYWALL: boolDefaultTrue,

		GOOGLE_CLIENT_ID: z.string().optional(),
		GOOGLE_CLIENT_SECRET: z.string().optional(),

		RESEND_API_KEY: z.string().optional(),
		RESEND_FROM_EMAIL: z.email().optional(),

		ABACATEPAY_API_KEY: z.string().optional(),
		ABACATEPAY_WEBHOOK_SECRET: z.string().optional(),
		// "Pay PIX Test Mode" button on /checkout + the payment simulation
		// endpoint (AbacatePay sandbox/devMode) — never enable in production.
		ABACATEPAY_PIX_TEST_MODE: boolFromString,

		CRON_SECRET: z.string().optional(),
	})
	.refine((value) => value.APP_MODE !== "hosted" || value.DATABASE_PROVIDER === "postgresql", {
		message: "APP_MODE=hosted requires DATABASE_PROVIDER=postgresql",
		path: ["DATABASE_PROVIDER"],
	});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
	// Optional variables left blank in .env (e.g. "RESEND_FROM_EMAIL=") arrive
	// as empty strings, not undefined — without this, format validators like
	// z.email() reject a local .env with unfilled optional fields.
	const raw = Object.fromEntries(
		Object.entries(Bun.env).map(([key, value]) => [key, value === "" ? undefined : value]),
	);
	const parsed = envSchema.safeParse(raw);

	if (!parsed.success) {
		console.error("Invalid environment variables:");
		console.error(z.treeifyError(parsed.error));
		throw new Error("Failed to load environment variables. Check your .env.");
	}

	return parsed.data;
}

export const env = loadEnv();
