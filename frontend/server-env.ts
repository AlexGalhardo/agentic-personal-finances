import { z } from "zod";

// Production Bun server (server.ts) — not bundled into the Vite client.
const serverEnvSchema = z.object({
	PORT: z.coerce.number().int().positive().default(4001),
	VITE_API_URL: z.url().default("http://localhost:4000"),
});

function loadServerEnv() {
	const raw = Object.fromEntries(
		Object.entries(Bun.env).map(([key, value]) => [key, value === "" ? undefined : value]),
	);
	const parsed = serverEnvSchema.safeParse(raw);
	if (!parsed.success) {
		console.error("Invalid frontend server environment:");
		console.error(z.treeifyError(parsed.error));
		throw new Error("Failed to load frontend server env. Check PORT / VITE_API_URL.");
	}
	return parsed.data;
}

export const serverEnv = loadServerEnv();
