import type { AppFailureCode } from "@agentic-personal-finances/core";

function edenErrorBody(error: unknown): { message?: string; code?: AppFailureCode } | null {
	if (!error || typeof error !== "object" || !("value" in error)) return null;
	const value = (error as { value?: unknown }).value;
	if (!value || typeof value !== "object") return null;
	return value as { message?: string; code?: AppFailureCode };
}

/** Backend `AppFailure.code` when the HTTP mapper includes it (H05). */
export function apiFailureCode(error: unknown): AppFailureCode | undefined {
	return edenErrorBody(error)?.code;
}

/**
 * Extracts the `{ message }` the backend sends on errors (see backend/src/app.ts)
 * from an Eden treaty error, falling back to a caller-provided message.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
	const body = edenErrorBody(error);
	if (body?.message) return String(body.message);
	return fallback;
}
