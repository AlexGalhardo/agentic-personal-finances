import { z } from "zod";

const desktopEnvSchema = z.object({
	DESKTOP_APP_URL: z.url().optional(),
});

export function resolveAppUrl(fallbackFromPackage: string, cliUrl?: string): URL {
	const raw = Object.fromEntries(
		Object.entries(process.env).map(([key, value]) => [key, value === "" ? undefined : value]),
	);
	const parsed = desktopEnvSchema.safeParse(raw);
	if (!parsed.success) {
		console.error("Invalid desktop environment:");
		console.error(z.treeifyError(parsed.error));
		throw new Error("Failed to load desktop env. Check DESKTOP_APP_URL.");
	}

	const candidate = cliUrl ?? parsed.data.DESKTOP_APP_URL ?? fallbackFromPackage;
	const urlParsed = z.url().safeParse(candidate);
	if (!urlParsed.success) {
		throw new Error(`Invalid app URL: ${candidate}`);
	}
	return new URL(urlParsed.data);
}
