import { z } from "zod";

// Public runtime config. Only `EXPO_PUBLIC_*` reaches the bundle (inlined at
// build time). Validated once so the rest of the app can assume a good shape.
// Without EXPO_PUBLIC_API_URL the app cannot reach the API — fail early.
const schema = z.object({
	apiUrl: z.url(),
});

const parsed = schema.safeParse({
	apiUrl: process.env.EXPO_PUBLIC_API_URL === "" ? undefined : process.env.EXPO_PUBLIC_API_URL,
});

if (!parsed.success) {
	console.error("Invalid mobile environment (EXPO_PUBLIC_*):");
	console.error(z.treeifyError(parsed.error));
	throw new Error("Failed to load mobile env. Check EXPO_PUBLIC_API_URL.");
}

export const env = parsed.data;
