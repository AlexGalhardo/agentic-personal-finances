import { z } from "zod";

// Browser + Vite SSR: only `VITE_*` is inlined. Validated once so callers
// can assume a real URL instead of guessing defaults per call site.
const clientSchema = z.object({
	VITE_API_URL: z.url().default("http://localhost:4000"),
});

const clientParsed = clientSchema.safeParse({
	VITE_API_URL: import.meta.env.VITE_API_URL === "" ? undefined : import.meta.env.VITE_API_URL,
});

if (!clientParsed.success) {
	console.error("Invalid frontend client environment:");
	console.error(z.treeifyError(clientParsed.error));
	throw new Error("Failed to load frontend env. Check VITE_API_URL.");
}

export const env = clientParsed.data;
