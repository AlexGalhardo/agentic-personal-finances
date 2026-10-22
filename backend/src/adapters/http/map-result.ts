import type { AppFailure, Result } from "@agentic-personal-finances/core";
import { AppError } from "../../lib/errors";

const statusByCode: Record<AppFailure["code"], number> = {
	invalid_input: 400,
	unauthorized: 401,
	forbidden: 403,
	plan_limit: 403,
	not_found: 404,
	conflict: 409,
	failed: 500,
};

/** Bridge Result → existing AppError / onError path (ADR 0004). */
export function failureToAppError(failure: AppFailure): AppError {
	return new AppError(failure.message, statusByCode[failure.code] ?? 500);
}

export function unwrapOrThrow<T>(result: Result<T, AppFailure>): T {
	if (result.ok) return result.value;
	throw failureToAppError(result.error);
}
