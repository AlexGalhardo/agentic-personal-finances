// One-shot: set Dockerfile path (already done) + production variables for
// backend / frontend / bot. Secrets come from .railway-secrets.json (gitignored).
import { z } from "zod";

const secretsSchema = z.object({
	BETTER_AUTH_SECRET: z.string().min(32),
	ENCRYPTION_KEY: z.string().regex(/^[0-9a-f]{64}$/i),
	CRON_SECRET: z.string().min(32),
});

const secretsFile = Bun.file(".railway-secrets.json");
if (!(await secretsFile.exists())) {
	throw new Error(
		"Missing .railway-secrets.json — generate BETTER_AUTH_SECRET / ENCRYPTION_KEY / CRON_SECRET first.",
	);
}
const secrets = secretsSchema.parse(await secretsFile.json());

function setVars(service: string, pairs: Record<string, string>): void {
	const args = ["variable", "set", "--service", service, "--skip-deploys"];
	for (const [key, value] of Object.entries(pairs)) {
		args.push(`${key}=${value}`);
	}
	console.log(`Setting ${Object.keys(pairs).length} vars on ${service}…`);
	const result = Bun.spawnSync(["railway", ...args], {
		stdout: "inherit",
		stderr: "inherit",
	});
	if (result.exitCode !== 0) {
		throw new Error(`railway variable set failed for ${service}`);
	}
}

// Railway reference syntax is literal `${{...}}` (not a JS template).
const pgUrl = `\${{Postgres.DATABASE_URL}}`;
const backendPublic = `https://\${{backend.RAILWAY_PUBLIC_DOMAIN}}`;
const frontendPublic = `https://\${{frontend.RAILWAY_PUBLIC_DOMAIN}}`;

setVars("backend", {
	RAILWAY_SERVICE_TARGET: "backend",
	APP_MODE: "hosted",
	NODE_ENV: "production",
	DATABASE_PROVIDER: "postgresql",
	DATABASE_URL: pgUrl,
	BETTER_AUTH_SECRET: secrets.BETTER_AUTH_SECRET,
	ENCRYPTION_KEY: secrets.ENCRYPTION_KEY,
	CRON_SECRET: secrets.CRON_SECRET,
	APP_URL: backendPublic,
	FRONTEND_URL: frontendPublic,
	ENABLE_CONFIRM_EMAIL: "false",
	ENABLE_2FA: "false",
	ENABLE_ABACATEPAY: "false",
	ABACATEPAY_PIX_TEST_MODE: "false",
});

setVars("frontend", {
	RAILWAY_SERVICE_TARGET: "frontend",
	VITE_API_URL: backendPublic,
});

setVars("bot", {
	RAILWAY_SERVICE_TARGET: "bot",
	APP_MODE: "hosted",
	NODE_ENV: "production",
	DATABASE_PROVIDER: "postgresql",
	DATABASE_URL: pgUrl,
	BETTER_AUTH_SECRET: secrets.BETTER_AUTH_SECRET,
	ENCRYPTION_KEY: secrets.ENCRYPTION_KEY,
	FRONTEND_URL: frontendPublic,
	TELEGRAM_BOT_USE_PASSWORD_TO_CONFIRM_ACTIONS: "false",
	ENABLE_ABACATEPAY: "false",
	ABACATEPAY_PIX_TEST_MODE: "false",
});

console.log(
	"Variables set. Still required on bot (dashboard): TELEGRAM_BOT_TOKEN, BOT_PASSWORD_HASH_BASE64. Generate domains next, then redeploy.",
);
